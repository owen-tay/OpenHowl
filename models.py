# models.py
from typing import Optional
from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    password: str

class YouTubeBody(BaseModel):
    youtube_url: str
    sound_name: Optional[str] = None


class Sound(BaseModel):
    id: Optional[str] = None
    name: str
    length: int = 0
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
    trim_end: int = 0
    file_path: str = ""
    file_format: str = ""
    color: str = "#00D6BF"  