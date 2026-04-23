# C:\Users\Admin\OneDrive\Documents\Code\widget\echo-backend\app\models\widget_config.py
from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID

class WidgetConfigBase(BaseModel):
    theme: str = "bg-pink-500"
    slot_1_id: Optional[str] = None
    slot_2_id: Optional[str] = None
    slot_3_id: Optional[str] = None
    slot_4_id: Optional[str] = None

class WidgetConfigUpdate(BaseModel):
    theme: Optional[str] = None
    slot_1_id: Optional[str] = None
    slot_2_id: Optional[str] = None
    slot_3_id: Optional[str] = None
    slot_4_id: Optional[str] = None

class WidgetConfigResponse(WidgetConfigBase):
    model_config = ConfigDict(from_attributes=True)
    user_id: UUID
