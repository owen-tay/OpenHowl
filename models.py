# models.py
from pydantic import BaseModel, Field

class Sound(BaseModel):
    id: str = None
    name: str
    length: int  # Maximum length in ms
    volume: int = 70
    playing: bool = False
    effects: dict = Field(default_factory=lambda: {
        "echo": False,
        "reverb": False,
        "lowpass": False,
        "highpass": False,
        "reverse": False,
        "distort": False,
    })
    trim_start: int = 0
    trim_end: int = 0  # Will be set to match length if not provided
    file_path: str = ""   # Path to the stored file in the sounds folder
    file_format: str = "" # File format, e.g. 'mp3', 'wav'
