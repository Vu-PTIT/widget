from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class MessageBase(BaseModel):
    sender_id: UUID
    receiver_id: UUID
    audio_url: str
    audio_path: Optional[str] = None
    duration: Optional[float] = None
    is_played: bool = False

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    is_played: Optional[bool] = None

class MessageResponse(MessageBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
