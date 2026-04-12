from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum
from uuid import UUID

class FriendStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    BLOCKED = "blocked"

class FriendBase(BaseModel):
    user_id: UUID
    friend_id: UUID
    status: FriendStatus = FriendStatus.PENDING

class FriendCreate(FriendBase):
    pass

class FriendUpdate(BaseModel):
    status: FriendStatus

class FriendResponse(FriendBase):
    created_at: datetime

    class Config:
        from_attributes = True
