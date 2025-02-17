import os
from dotenv import load_dotenv
from typing import List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, File, UploadFile, Form, Header
from fastapi.middleware.cors import CORSMiddleware
import json
import uuid
import subprocess
from pydub import AudioSegment
from pydantic import BaseModel
from models import Sound, YouTubeBody
from fastapi import FastAPI, HTTPException
from audioHandler import load_audio, trim_audio, apply_effects, play_audio
from fastapi.responses import StreamingResponse
import io

# Load environment variables
load_dotenv(os.path.join(os.getcwd(), ".env.local"))

# Token strings used for admin vs user
ADMIN_TOKEN = "OPENHOWL_ADMIN_TOKEN"
USER_TOKEN = "OPENHOWL_USER_TOKEN"

# Read environment variables with new naming
ADMIN_PW = os.getenv("OPENHOWL_ADMIN_PASSWORD")
USER_PW = os.getenv("OPENHOWL_USER_PASSWORD")

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


def load_sounds_for_preview():
    """ Load all Sound entries from the JSON database as dictionaries. """
    try:
        with open(DATABASE_FILE, "r") as f:
            return json.load(f)
    except FileNotFoundError:
        return []

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

    # Export to in-memory file (MP3 format for browser compatibility)
    buffer = io.BytesIO()
    audio.export(buffer, format="mp3")  # Export as MP3 (most browser-compatible)
    buffer.seek(0)  # Reset buffer position

    return StreamingResponse(buffer, media_type="audio/mpeg")
    
    return {"message": f"Playing sound preview with {volume}% volume", "sound_id": sound_id}


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
    new_sounds = [s for s in sounds if s.id != sound_id]
    if len(new_sounds) == len(sounds):
        raise HTTPException(status_code=404, detail="Sound not found")
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
    ext = ext.lower() if ext else ".mp3"

    allowed_exts = [".mp3", ".wav", ".ogg", ".flac"]
    if ext not in allowed_exts:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {ext}. Allowed: {allowed_exts}"
        )

    file_path = os.path.join(SOUNDS_FOLDER, f"{sound_id}{ext}")

    file_contents = await file.read()
    if len(file_contents) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="File too large")

    with open(file_path, "wb") as f:
        f.write(file_contents)

    try:
        audio = AudioSegment.from_file(file_path)
        length_ms = len(audio)
    except:
        length_ms = 0

    new_sound = Sound(
        id=sound_id,
        name=name.strip() if name else "Untitled",
        length=length_ms,
        volume=80,
        playing=False,
        trim_start=0,
        trim_end=length_ms,
        file_path=file_path,
        file_format=ext.lstrip(".")
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
    output_filename = f"{sound_id}.mp3"
    output_path = os.path.join(SOUNDS_FOLDER, output_filename)

    command = [
        "yt-dlp",
        "--extract-audio",
        "--audio-format", "mp3",
        "--audio-quality", "0",
        "--output", f"{SOUNDS_FOLDER}/{sound_id}.%(ext)s",
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
        audio = AudioSegment.from_file(output_path, format="mp3")
        length_ms = len(audio)
    except:
        length_ms = 0

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


        