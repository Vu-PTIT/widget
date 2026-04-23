from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from uuid import UUID
import re

_URL_PATTERN = re.compile(r'^https?://.+', re.IGNORECASE)

class StoryBase(BaseModel):
    user_id: UUID
    audio_url: str
    duration: Optional[float] = None
    voice_effect: Optional[str] = None
    expires_at: Optional[datetime] = None

    @field_validator('audio_url', mode='before')
    @classmethod
    def validate_audio_url(cls, v):
        if not _URL_PATTERN.match(str(v)):
            raise ValueError('audio_url must be a valid http/https URL')
        return v

class StoryCreate(StoryBase):
    pass

class StoryResponse(StoryBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
