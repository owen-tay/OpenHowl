from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from typing import List
import json, uuid, os
from models import Sound  # Make sure models.py is in the same directory

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS with explicit allowed origin for local development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Adjust if your frontend is served elsewhere
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATABASE_FILE = "sounds.json"
SOUNDS_FOLDER = "sounds"

# Ensure the sounds folder exists.
os.makedirs(SOUNDS_FOLDER, exist_ok=True)

def load_sounds() -> List[Sound]:
    try:
        with open(DATABASE_FILE, "r") as f:
            data = json.load(f)
            return [Sound(**sound) for sound in data]
    except FileNotFoundError:
        return []

def save_sounds(sounds: List[Sound]):
    with open(DATABASE_FILE, "w") as f:
        json.dump([sound.dict() for sound in sounds], f, indent=2)

@app.get("/sounds", response_model=List[Sound])
def get_sounds():
    """
    Retrieve all sound entries from the dummy JSON database.
    """
    return load_sounds()

@app.post("/sounds", response_model=Sound)
def create_sound(sound: Sound):
    """
    Create a new sound entry.
    If trim_end is not provided (or is zero), it will be set to match the sound length.
    """
    sounds = load_sounds()
    sound.id = str(uuid.uuid4())
    if sound.trim_end == 0:
        sound.trim_end = sound.length
    sounds.append(sound)
    save_sounds(sounds)
    return sound

@app.put("/sounds/{sound_id}", response_model=Sound)
def update_sound(sound_id: str, updated_sound: Sound):
    """
    Update an existing sound entry by its ID.
    """
    sounds = load_sounds()
    for idx, sound in enumerate(sounds):
        if sound.id == sound_id:
            sounds[idx] = updated_sound
            save_sounds(sounds)
            return updated_sound
    raise HTTPException(status_code=404, detail="Sound not found")

@app.delete("/sounds/{sound_id}")
def delete_sound(sound_id: str):
    """
    Delete a sound entry by its ID.
    """
    sounds = load_sounds()
    new_sounds = [sound for sound in sounds if sound.id != sound_id]
    if len(new_sounds) == len(sounds):
        raise HTTPException(status_code=404, detail="Sound not found")
    save_sounds(new_sounds)
    return {"detail": "Sound deleted"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    A placeholder WebSocket endpoint for real-time updates.
    In production, you would send state changes (e.g., playing status) from the backend.
    """
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Echo: {data}")
    except WebSocketDisconnect:
        print("Client disconnected")
