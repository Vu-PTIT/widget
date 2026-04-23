from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class VoiceEffectBase(BaseModel):
    id: str
    label: str
    icon: Optional[str] = None
    is_premium: bool = False

class VoiceEffectCreate(VoiceEffectBase):
    pass

class VoiceEffectResponse(VoiceEffectBase):
    model_config = ConfigDict(from_attributes=True)
    
    created_at: datetime
