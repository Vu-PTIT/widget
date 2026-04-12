from pydantic import BaseModel
from typing import Optional

class SoundboardItemBase(BaseModel):
    id: str
    icon: Optional[str] = None
    label: Optional[str] = None
    sound_url: Optional[str] = None

class SoundboardItemCreate(SoundboardItemBase):
    pass

class SoundboardItemResponse(SoundboardItemBase):
    class Config:
        from_attributes = True
