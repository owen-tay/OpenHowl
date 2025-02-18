import os
import json
import uuid
import io
import subprocess
import asyncio
from typing import List, Optional
from pydantic import BaseModel
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile, Form, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

# Discord imports
import discord
from discord.ext import commands
from discord import FFmpegPCMAudio

# Audio handling
from pydub import AudioSegment
from models import Sound, YouTubeBody
from audioHandler import load_audio, trim_audio, apply_effects, play_audio

# Load environment variables
load_dotenv(os.path.join(os.getcwd(), ".env.local"))

# Token strings used for admin vs user
ADMIN_TOKEN = "OPENHOWL_ADMIN_TOKEN"
USER_TOKEN = "OPENHOWL_USER_TOKEN"

# Read environment variables with new naming
ADMIN_PW = os.getenv("OPENHOWL_ADMIN_PASSWORD")
USER_PW = os.getenv("OPENHOWL_USER_PASSWORD")
DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")

MAX_FILE_SIZE = int(os.getenv("OPENHOWL_MAX_FILE_SIZE_MB", "500")) * 1024 * 1024

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_FILE = "sounds.json"
SOUNDS_FOLDER = "sounds"
os.makedirs(SOUNDS_FOLDER, exist_ok=True)

# Discord bot setup
description = "Discord Bot for OpenHowl Soundboard"
intents = discord.Intents.default()
intents.message_content = True

bot = commands.Bot(command_prefix="/OpenHowl ", description=description, intents=intents)
voice_clients = {}

# Track the bot's instance
bot_instance = None

# Function to initialize the discord bot in a non-blocking way
async def init_discord_bot():
    global bot_instance
    bot_instance = bot
    
    @bot.event
    async def on_ready():
        print(f'Logged in as {bot.user.name}')
        print(f'Bot ID: {bot.user.id}')
    
    @bot.command()
    async def join(ctx):
        """ Join the user's voice channel """
        if ctx.author.voice is None or ctx.author.voice.channel is None:
            await ctx.send("You must be in a voice channel for me to join!")
            return

        channel = ctx.author.voice.channel
        if ctx.guild.id in voice_clients and voice_clients[ctx.guild.id].is_connected():
            await voice_clients[ctx.guild.id].move_to(channel)
        else:
            voice_clients[ctx.guild.id] = await channel.connect()

        await ctx.send(f"Joined {channel.name}!")
    
    @bot.command()
    async def leave(ctx):
        """ Leave the voice channel """
        if ctx.guild.id in voice_clients and voice_clients[ctx.guild.id].is_connected():
            await voice_clients[ctx.guild.id].disconnect()
            del voice_clients[ctx.guild.id]
            await ctx.send("Disconnected from voice channel.")
        else:
            await ctx.send("I'm not connected to any voice channel!")
    
    @bot.command()
    async def play(ctx, sound_id: str):
        """ Play a sound from the API in Discord Voice Chat """
        if ctx.guild.id not in voice_clients or not voice_clients[ctx.guild.id].is_connected():
            await join(ctx)  # Ensure bot is in voice channel

        vc = voice_clients[ctx.guild.id]
        sound_url = f"http://127.0.0.1:8000/sounds/preview/{sound_id}"  # API URL for sound

        # Use FFmpeg to stream the sound
        ffmpeg_options = {
            "options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5"
        }
        audio_source = FFmpegPCMAudio(sound_url, **ffmpeg_options)

        if not vc.is_playing():
            vc.play(audio_source)
            await ctx.send(f"Playing sound `{sound_id}`")
        else:
            # Play sound in parallel by spawning a separate FFmpeg process
            process = subprocess.Popen(
                ["ffmpeg", "-i", sound_url, "-f", "wav", "pipe:1"],
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL
            )
            audio_source_parallel = discord.PCMVolumeTransformer(discord.FFmpegPCMAudio(process.stdout))

            def after_playing(err):
                if err:
                    print(f"Error in playback: {err}")
                process.stdout.close()
                process.wait()

            vc.play(audio_source_parallel, after=after_playing)
            await ctx.send(f"Queued sound `{sound_id}` for parallel playback.")

    # Start the bot
    asyncio.create_task(bot.start(DISCORD_BOT_TOKEN))

# Database functions
def load_sounds_for_preview():
    """ Load all Sound entries from the JSON database as dictionaries. """
    try:
        with open(DATABASE_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

def load_sounds() -> List[Sound]:
    """Load all Sound entries from the JSON database."""
    try:
        with open(DATABASE_FILE, "r") as f:
            data = json.load(f)
            return [Sound(**sound) for sound in data]
    except FileNotFoundError:
        return []

def save_sounds(sounds: List[Sound]):
    """Save the list of Sound objects to sounds.json."""
    with open(DATABASE_FILE, "w") as f:
        json.dump([sound.dict() for sound in sounds], f, indent=2)

# Helper function to find a guild with connected voice client
async def get_first_connected_voice_client():
    for guild_id, voice_client in voice_clients.items():
        if voice_client.is_connected():
            return guild_id, voice_client
    return None, None

# FastAPI endpoints
@app.on_event("startup")
async def startup_event():
    if DISCORD_BOT_TOKEN:
        asyncio.create_task(init_discord_bot())
    else:
        print("WARNING: DISCORD_BOT_TOKEN missing, Discord bot will not start")

# Modified endpoint to actually play the sound via Discord
@app.post("/discord/play/{sound_id}")
async def discord_play(sound_id: str):
    if not bot_instance:
        raise HTTPException(status_code=503, detail="Discord bot is not initialized")
    
    # Find the first connected voice client
    guild_id, voice_client = await get_first_connected_voice_client()
    
    if not guild_id or not voice_client:
        # No active voice clients; attempt to auto-join a voice channel
        joined = False
        # Iterate over all guilds the bot is in
        for guild in bot_instance.guilds:
            # Look for a voice channel with at least one non-bot member
            for channel in guild.voice_channels:
                if any(not member.bot for member in channel.members):
                    voice_client = await channel.connect()
                    voice_clients[guild.id] = voice_client
                    guild_id = guild.id
                    joined = True
                    break
            if joined:
                break
        if not joined:
            raise HTTPException(status_code=400, detail="No active voice channel connections and unable to auto join")
    
    sound_url = f"http://127.0.0.1:8000/sounds/preview/{sound_id}"
    
    # Use FFmpeg to stream the sound
    ffmpeg_options = {
        "options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5"
    }
    audio_source = FFmpegPCMAudio(sound_url, **ffmpeg_options)
    
    if not voice_client.is_playing():
        voice_client.play(audio_source)
        return {"message": f"Playing sound {sound_id} in Discord"}
    else:
        # Play sound in parallel by spawning a separate FFmpeg process
        process = subprocess.Popen(
            ["ffmpeg", "-i", sound_url, "-f", "wav", "pipe:1"],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL
        )
        audio_source_parallel = discord.PCMVolumeTransformer(discord.FFmpegPCMAudio(process.stdout))

        def after_playing(err):
            if err:
                print(f"Error in playback: {err}")
            process.stdout.close()
            process.wait()

        voice_client.play(audio_source_parallel, after=after_playing)
        return {"message": f"Queued sound {sound_id} for parallel playback in Discord"}


@app.post("/discord/stop")
async def discord_stop():
    if not bot_instance:
        raise HTTPException(status_code=503, detail="Discord bot is not initialized")
    
    stopped = False
    for guild_id, voice_client in voice_clients.items():
        if voice_client.is_playing():
            voice_client.stop()
            stopped = True
    
    if stopped:
        return {"message": "Stopped all Discord audio playback"}
    else:
        return {"message": "No active playback to stop"}

@app.get("/sounds/preview/{sound_id}")
def preview_sound(sound_id: str):
    """ Generate processed audio and stream it to the browser. """
    sounds = load_sounds_for_preview()
    sound = next((s for s in sounds if s["id"] == sound_id), None)
    
    if not sound:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    file_path = sound["file_path"]
    trim_start = sound.get("trim_start", 0)
    trim_end = sound.get("trim_end", sound.get("length", 0))
    effects = sound.get("effects", {})
    volume = sound.get("volume", 100)  # Default to 100% volume

    # Load and process the audio
    audio = load_audio(file_path)
    if audio is None:
        raise HTTPException(status_code=500, detail="Error loading audio")
    
    audio = trim_audio(audio, trim_start, trim_end)
    audio = apply_effects(audio, effects, volume)  # Apply effects + volume
    
    # Standardize format for streaming - mono, 48kHz
    audio = audio.set_channels(1).set_frame_rate(48000)

    # Export to in-memory file with consistent bitrate (128k)
    buffer = io.BytesIO()
    audio.export(buffer, format="mp3", bitrate="128k")
    buffer.seek(0)  # Reset buffer position

    return StreamingResponse(buffer, media_type="audio/mpeg")

@app.get("/sounds", response_model=List[Sound])
def get_sounds():
    return load_sounds()

@app.post("/sounds", response_model=Sound)
def create_sound(sound: Sound):
    sounds = load_sounds()
    sound.id = str(uuid.uuid4())
    if sound.trim_end == 0:
        sound.trim_end = sound.length
    sounds.append(sound)
    save_sounds(sounds)
    return sound

@app.put("/sounds/{sound_id}", response_model=Sound)
def update_sound(
    sound_id: str,
    updated_sound: Sound,
    authorization: Optional[str] = Header(None)
):
    # Either admin or user token is okay
    if authorization not in [f"Bearer {ADMIN_TOKEN}", f"Bearer {USER_TOKEN}"]:
        raise HTTPException(status_code=401, detail="Unauthorized")

    sounds = load_sounds()
    for idx, existing_sound in enumerate(sounds):
        if existing_sound.id == sound_id:
            # ensure ID doesn't change
            updated_sound.id = sound_id
            sounds[idx] = updated_sound
            save_sounds(sounds)
            return updated_sound

    raise HTTPException(status_code=404, detail="Sound not found")



@app.delete("/sounds/{sound_id}")
def delete_sound(
    sound_id: str,
    authorization: Optional[str] = Header(None)
):
    if authorization not in [f"Bearer {ADMIN_TOKEN}", f"Bearer {USER_TOKEN}"]:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    sounds = load_sounds()
    # Find the sound to delete using attribute access
    sound_to_delete = next((s for s in sounds if s.id == sound_id), None)
    if not sound_to_delete:
        raise HTTPException(status_code=404, detail="Sound not found")
    
    # Attempt to remove the sound file from disk
    file_path = sound_to_delete.file_path
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")
            # Optionally, handle the error here (log it, etc.)

    # Remove the sound from the JSON database
    new_sounds = [s for s in sounds if s.id != sound_id]
    save_sounds(new_sounds)
    return {"detail": "Sound deleted"}


@app.post("/sounds/upload", response_model=Sound)
async def upload_sound(
    file: UploadFile = File(...),
    name: str = Form(...),
    authorization: Optional[str] = Header(None)
):
    # Admin check
    if authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Generate unique ID
    sound_id = str(uuid.uuid4())
    original_filename = file.filename
    _, ext = os.path.splitext(original_filename)
    
    # Always save as mp3 with consistent settings
    file_path = os.path.join(SOUNDS_FOLDER, f"{sound_id}.mp3")

    file_contents = await file.read()
    if len(file_contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    # Save the temporary file
    temp_path = os.path.join(SOUNDS_FOLDER, f"temp_{sound_id}{ext}")
    with open(temp_path, "wb") as f:
        f.write(file_contents)

    try:
        # Convert to standardized mp3 format
        audio = AudioSegment.from_file(temp_path)
        # Set consistent format (mono, 48kHz, 128kbps)
        audio = audio.set_channels(1).set_frame_rate(48000)
        audio.export(file_path, format="mp3", bitrate="128k")
        length_ms = len(audio)
        
        # Remove temporary file
        os.remove(temp_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing audio: {str(e)}")

    new_sound = Sound(
        id=sound_id,
        name=name.strip() if name else "Untitled",
        length=length_ms,
        volume=80,
        playing=False,
        trim_start=0,
        trim_end=length_ms,
        file_path=file_path,
        file_format="mp3"
    )

    sounds = load_sounds()
    sounds.append(new_sound)
    save_sounds(sounds)

    return new_sound

class LoginRequest(BaseModel):
    password: str

@app.post("/auth/login")
def login(req: LoginRequest):
    if req.password == ADMIN_PW:
        return {"token": ADMIN_TOKEN, "role": "admin"}
    elif req.password == USER_PW:
        return {"token": USER_TOKEN, "role": "user"}
    else:
        raise HTTPException(status_code=401, detail="Invalid password")

@app.post("/sounds/youtube", response_model=Sound)
def create_sound_from_youtube(
    data: YouTubeBody,
    authorization: Optional[str] = Header(None)
):
    if authorization != f"Bearer {ADMIN_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")

    youtube_url = data.youtube_url
    sound_name = data.sound_name or "YouTube Audio"

    if not youtube_url.startswith("http"):
        raise HTTPException(status_code=400, detail="Invalid YouTube URL.")

    sound_id = str(uuid.uuid4())
    temp_filename = f"temp_{sound_id}.mp3"
    output_filename = f"{sound_id}.mp3"
    temp_path = os.path.join(SOUNDS_FOLDER, temp_filename)
    output_path = os.path.join(SOUNDS_FOLDER, output_filename)

    command = [
        "yt-dlp",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--output", f"{SOUNDS_FOLDER}/temp_{sound_id}.%(ext)s",
        youtube_url
    ]
    try:
        subprocess.run(command, check=True)
    except subprocess.CalledProcessError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to download from YouTube: {e}"
        )

    try:
        # Standardize the audio format
        audio = AudioSegment.from_file(temp_path, format="mp3")
        # Set consistent format (mono, 48kHz, 128kbps)
        audio = audio.set_channels(1).set_frame_rate(48000)
        audio.export(output_path, format="mp3", bitrate="128k")
        length_ms = len(audio)
        
        # Remove temporary file
        os.remove(temp_path)
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error standardizing audio: {str(e)}"
        )

    new_sound = Sound(
        id=sound_id,
        name=sound_name.strip(),
        length=length_ms,
        volume=80,
        playing=False,
        trim_start=0,
        trim_end=length_ms,
        file_path=output_path,
        file_format="mp3"
    )

    sounds = load_sounds()
    sounds.append(new_sound)
    save_sounds(sounds)
    return new_sound

# WebSocket handling for real-time updates
connected_clients: List[WebSocket] = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    connected_clients.append(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Broadcast to all connected clients
            for client in connected_clients:
                await client.send_text(data)
    except WebSocketDisconnect:
        connected_clients.remove(websocket)