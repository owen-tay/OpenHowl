import threading
import subprocess
import os
from pydub import AudioSegment
from pydub import AudioSegment
from pydub.effects import speedup, low_pass_filter, high_pass_filter

def load_audio(file_path: str) -> AudioSegment:
    """
    Load an audio file using pydub.
    """
    try:
        return AudioSegment.from_file(file_path)
    except Exception as e:
        print(f"Error loading audio: {e}")
        return None

def trim_audio(audio: AudioSegment, trim_start: int, trim_end: int) -> AudioSegment:

    return audio[trim_start:trim_end]

def apply_effects(audio: AudioSegment, effects: dict, volume: int = 100) -> AudioSegment:


    # 🔊 Apply Volume Scaling (0 - 100% → -60 dB to 0 dB)
    volume_db = (volume / 100) * 60 - 60  # Scale volume to decibels
    print(f"Applying volume: {volume}% ({volume_db:.2f} dB)")
    audio = audio + volume_db  # Adjust volume

    if effects.get("echo", False):
        echo_delay = 150  # milliseconds
        echo_repeats = 5  # More repeats for a chaotic sound
        print("Applying EXTREME echo effect!")
        
        for _ in range(echo_repeats):
            delayed = audio - 10  # Reduce volume slightly each repeat
            delayed = delayed.overlay(audio, position=echo_delay)
            audio = delayed

    if effects.get("reverse", False):
        print("Applying reverse effect!")
        audio = audio.reverse() + 5  # Slight volume boost

    if effects.get("lowpass", False):
        print("Applying aggressive lowpass filter!")
        audio = low_pass_filter(audio, 300)  # Lower cutoff for a muffled effect

    if effects.get("highpass", False):
        print("Applying aggressive highpass filter!")
        audio = high_pass_filter(audio, 3000)  # Higher cutoff for more extreme effect

    if effects.get("speedup", False):
        print("Applying chipmunk speedup effect!")
        audio = speedup(audio, playback_speed=1.5)  # 1.5x speed for high-pitched sounds

    if effects.get("slowdown", False):
        print("Applying deep demon slowdown effect!")
        audio = speedup(audio, playback_speed=0.7)  # 0.7x speed for deep, slow sounds

    if effects.get("distort", False):
        print("Applying **SIMPLE OVERDRIVE DISTORTION**!")

        # Step 1: Boost volume HARD to force natural clipping
        boosted = audio + 50  # Louder than normal

        # Step 2: Create a blown-out version by increasing again and overlaying
        blown_out = boosted + 50  # Even louder for "crunch"
        distorted = boosted.overlay(blown_out, gain_during_overlay=--0)  # Layer effect

        # Step 3: Reduce final volume to prevent excessive clipping
        distorted = distorted - 10  # Bring it down so it doesn’t clip eardrums

        audio = distorted  # Apply the final distortion effect

    return audio

def _play_audio_thread(audio: AudioSegment):
    """
    Runs in a separate thread to allow overlapping playback.
    """
    temp_path = f"temp_{threading.get_ident()}.mp3"  # Unique temp file for each thread
    audio.export(temp_path, format="mp3")

    try:
        subprocess.Popen(
            ["ffplay", "-nodisp", "-autoexit", temp_path],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
    except Exception as e:
        print(f"Error playing audio: {e}")

    # Cleanup after a short delay to prevent deletion before playback
    threading.Timer(5, lambda: os.remove(temp_path) if os.path.exists(temp_path) else None).start()

def play_audio(audio: AudioSegment):
    """
    Plays the audio in a new thread, allowing multiple sounds to mix together.
    """
    thread = threading.Thread(target=_play_audio_thread, args=(audio,))
    thread.start()
