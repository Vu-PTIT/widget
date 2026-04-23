# C:\Users\Admin\OneDrive\Documents\Code\widget\echo-backend\app\models\settings.py
from pydantic import BaseModel, ConfigDict
from typing import Optional
from enum import Enum
from uuid import UUID

class HapticType(str, Enum):
    HEARTBEAT = "heartbeat"
    INTENSE = "intense"
    GENTLE = "gentle"

class UserSettingsBase(BaseModel):
    app_theme: str = "bg-neutral-950"
    sleep_mode: bool = False
    raise_to_listen: bool = True
    haptic_feedback: HapticType = HapticType.HEARTBEAT

class UserSettingsUpdate(BaseModel):
    app_theme: Optional[str] = None
    sleep_mode: Optional[bool] = None
    raise_to_listen: Optional[bool] = None
    haptic_feedback: Optional[HapticType] = None

class UserSettingsResponse(UserSettingsBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: UUID
