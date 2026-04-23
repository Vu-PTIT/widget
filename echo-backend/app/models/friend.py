from pydantic import BaseModel, ConfigDict
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
    initiator_id: UUID
    status: FriendStatus = FriendStatus.PENDING

class FriendCreate(FriendBase):
    pass

class FriendUpdate(BaseModel):
    status: FriendStatus

class FriendPeer(BaseModel):
    id: UUID
    username: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[str] = None

class FriendResponse(FriendBase):
    model_config = ConfigDict(from_attributes=True)
    
    created_at: datetime
    peer_profile: Optional[FriendPeer] = None
