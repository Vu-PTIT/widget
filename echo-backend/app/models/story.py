from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class StoryBase(BaseModel):
    user_id: UUID
    audio_url: str
    duration: Optional[float] = None
    voice_effect: Optional[str] = None
    expires_at: Optional[datetime] = None

class StoryCreate(StoryBase):
    pass

class StoryResponse(StoryBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
