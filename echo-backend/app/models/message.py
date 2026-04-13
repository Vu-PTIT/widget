from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime
from uuid import UUID

class MessageBase(BaseModel):
    sender_id: UUID
    receiver_id: Optional[UUID] = None
    group_id: Optional[UUID] = None
    audio_url: str
    audio_path: Optional[str] = None
    duration: Optional[float] = None
    voice_effect: Optional[str] = None
    is_played: bool = False

    @model_validator(mode='after')
    def check_target(self) -> 'MessageBase':
        if self.receiver_id is None and self.group_id is None:
            raise ValueError('Either receiver_id or group_id must be provided')
        if self.receiver_id is not None and self.group_id is not None:
            raise ValueError('Cannot provide both receiver_id and group_id')
        return self

class MessageCreate(MessageBase):
    pass

class MessageUpdate(BaseModel):
    is_played: Optional[bool] = None

class MessageResponse(MessageBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
