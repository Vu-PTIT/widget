from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from enum import Enum
from uuid import UUID

class GroupRole(str, Enum):
    ADMIN = "admin"
    MEMBER = "member"

class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    avatar: Optional[str] = None

class GroupCreate(GroupBase):
    pass

class GroupUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    avatar: Optional[str] = None

class GroupResponse(GroupBase):
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime

    class Config:
        from_attributes = True

class GroupMemberBase(BaseModel):
    group_id: UUID
    user_id: UUID
    role: GroupRole = GroupRole.MEMBER

class GroupMemberResponse(GroupMemberBase):
    joined_at: datetime

    class Config:
        from_attributes = True
