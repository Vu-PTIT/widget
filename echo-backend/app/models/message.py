from pydantic import BaseModel, model_validator, ConfigDict, field_validator
from typing import Optional, List
from datetime import datetime
from uuid import UUID
import re

_URL_PATTERN = re.compile(r'^https?://.+', re.IGNORECASE)

class MessageBase(BaseModel):
    sender_id: UUID
    receiver_id: Optional[UUID] = None
    group_id: Optional[UUID] = None
    audio_url: str
    audio_path: Optional[str] = None
    duration: Optional[float] = None
    voice_effect: Optional[str] = None

    @field_validator('audio_url', mode='before')
    @classmethod
    def validate_audio_url(cls, v):
        if not _URL_PATTERN.match(str(v)):
            raise ValueError('audio_url must be a valid http/https URL')
        return v

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
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
    is_played: Optional[bool] = None # Computed or joined field
    read_by: Optional[List[UUID]] = None # List of user IDs who read it

class ReadStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    message_id: UUID
    user_id: UUID
    read_at: Optional[datetime] = None

class InboxEntry(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    peer_id: UUID
    is_group: bool
    last_message: MessageResponse
    peer_name: Optional[str] = None
    peer_avatar: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def parse_last_message(cls, values):
        """Parse last_message from JSONB dict returned by Supabase RPC."""
        if isinstance(values, dict) and isinstance(values.get('last_message'), dict):
            values['last_message'] = MessageResponse.model_validate(values['last_message'])
        return values
