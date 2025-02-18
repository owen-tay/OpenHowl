# import os
# import discord
# import asyncio
# import subprocess
# from discord.ext import commands
# from discord import FFmpegPCMAudio
# from dotenv import load_dotenv

# # Load environment variables
# load_dotenv(".env.local")

# DISCORD_BOT_TOKEN = os.getenv("DISCORD_BOT_TOKEN")
# API_BASE_URL = "http://127.0.0.1:8000"  # Ensure this is correct

# if not DISCORD_BOT_TOKEN:
#     raise ValueError("DISCORD_BOT_TOKEN is missing! Check your .env.local file.")

# description = "Discord Bot for OpenHowl Soundboard"
# intents = discord.Intents.default()
# intents.message_content = True

# bot = commands.Bot(command_prefix="/OpenHowl ", description=description, intents=intents)
# voice_clients = {}

# @bot.command()
# async def join(ctx):
#     """ Join the user's voice channel """
#     if ctx.author.voice is None or ctx.author.voice.channel is None:
#         await ctx.send("You must be in a voice channel for me to join!")
#         return

#     channel = ctx.author.voice.channel
#     if ctx.guild.id in voice_clients and voice_clients[ctx.guild.id].is_connected():
#         await voice_clients[ctx.guild.id].move_to(channel)
#     else:
#         voice_clients[ctx.guild.id] = await channel.connect()

#     await ctx.send(f"Joined {channel.name}!")

# @bot.command()
# async def leave(ctx):
#     """ Leave the voice channel """
#     if ctx.guild.id in voice_clients and voice_clients[ctx.guild.id].is_connected():
#         await voice_clients[ctx.guild.id].disconnect()
#         del voice_clients[ctx.guild.id]
#         await ctx.send("Disconnected from voice channel.")
#     else:
#         await ctx.send("I'm not connected to any voice channel!")

# @bot.command()
# async def play(ctx, sound_id: str):
#     """ Play a sound from the API in Discord Voice Chat """
#     if ctx.guild.id not in voice_clients or not voice_clients[ctx.guild.id].is_connected():
#         await join(ctx)  # Ensure bot is in voice channel

#     vc = voice_clients[ctx.guild.id]
#     sound_url = f"{API_BASE_URL}/sounds/preview/{sound_id}"  # API URL for sound

#     # Use FFmpeg to stream the sound
#     ffmpeg_options = {
#         "options": "-reconnect 1 -reconnect_streamed 1 -reconnect_delay_max 5"
#     }
#     audio_source = FFmpegPCMAudio(sound_url, **ffmpeg_options)

#     if not vc.is_playing():
#         vc.play(audio_source)
#         await ctx.send(f"Playing sound `{sound_id}`")
#     else:
#         # Play sound in parallel by spawning a separate FFmpeg process
#         process = subprocess.Popen(
#             ["ffmpeg", "-i", sound_url, "-f", "wav", "pipe:1"],
#             stdout=subprocess.PIPE,
#             stderr=subprocess.DEVNULL
#         )
#         audio_source_parallel = discord.PCMVolumeTransformer(discord.FFmpegPCMAudio(process.stdout))

#         def after_playing(err):
#             if err:
#                 print(f"Error in playback: {err}")
#             process.stdout.close()
#             process.wait()

#         vc.play(audio_source_parallel, after=after_playing)
#         await ctx.send(f"Queued sound `{sound_id}` for parallel playback.")

# @bot.event
# async def on_ready():
#     print(f'Logged in as {bot.user.name}')
#     print(f'Bot ID: {bot.user.id}')

# if __name__ == "__main__":
#     bot.run(DISCORD_BOT_TOKEN)
