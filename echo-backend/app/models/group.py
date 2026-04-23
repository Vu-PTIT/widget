from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime
from enum import Enum
from uuid import UUID


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
    model_config = ConfigDict(from_attributes=True)
    
    id: UUID
    created_by: Optional[UUID] = None
    created_at: datetime

class GroupMemberBase(BaseModel):
    group_id: UUID
    user_id: UUID

class MemberAdd(BaseModel):
    user_id: UUID

class GroupMemberResponse(GroupMemberBase):
    model_config = ConfigDict(from_attributes=True)
    
    joined_at: datetime
