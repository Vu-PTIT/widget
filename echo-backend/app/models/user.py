from pydantic import BaseModel, Field, EmailStr, ConfigDict, field_validator
from typing import Optional
from datetime import datetime
from enum import Enum
from uuid import UUID
import re

_URL_PATTERN = re.compile(r'^https?://.+', re.IGNORECASE)

class UserStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"
    LISTENING = "listening"
    SLEEP = "sleep"


class MembershipType(str, Enum):
    FREE = "free"
    PREMIUM = "premium"

class UserBase(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    status: UserStatus = UserStatus.OFFLINE
    streak: int = 0
    nickname: Optional[str] = None
    membership: MembershipType = MembershipType.FREE
    premium_until: Optional[datetime] = None
    email: Optional[EmailStr] = None

    @field_validator('avatar', mode='before')
    @classmethod
    def validate_avatar_url(cls, v):
        if v is not None and not _URL_PATTERN.match(str(v)):
            raise ValueError('avatar must be a valid http/https URL')
        return v

class UserCreate(UserBase):
    id: UUID

class UserUpdate(BaseModel):
    """Fields a user is allowed to update on their own profile.
    Sensitive fields (membership, premium_until) are intentionally
    excluded — these are managed via automated logic (e.g. webhooks).
    """
    username: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[UserStatus] = None
    streak: Optional[int] = None
    nickname: Optional[str] = None

    @field_validator('avatar', mode='before')
    @classmethod
    def validate_avatar_url(cls, v):
        if v is not None and not _URL_PATTERN.match(str(v)):
            raise ValueError('avatar must be a valid http/https URL')
        return v

class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_at: datetime
