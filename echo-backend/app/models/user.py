from pydantic import BaseModel, Field, EmailStr
from typing import Optional
from datetime import datetime
from enum import Enum
from uuid import UUID

class UserStatus(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    BUSY = "busy"

class UserType(str, Enum):
    INDIVIDUAL = "individual"
    BOT = "bot"
    ADMIN = "admin"

class UserBase(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    status: UserStatus = UserStatus.OFFLINE
    streak: int = 0
    nickname: Optional[str] = None
    type: UserType = UserType.INDIVIDUAL
    email: Optional[EmailStr] = None

class UserCreate(UserBase):
    id: UUID

class UserUpdate(BaseModel):
    username: Optional[str] = None
    name: Optional[str] = None
    avatar: Optional[str] = None
    status: Optional[UserStatus] = None
    streak: Optional[int] = None
    nickname: Optional[str] = None
    type: Optional[UserType] = None

class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
