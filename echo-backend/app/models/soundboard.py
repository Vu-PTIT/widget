from pydantic import BaseModel, ConfigDict
from typing import Optional

class SoundboardItemBase(BaseModel):
    icon: Optional[str] = None
    label: Optional[str] = None
    sound_url: Optional[str] = None
    is_premium: bool = False

class SoundboardItemCreate(SoundboardItemBase):
    """Fields provided when creating a soundboard item.
    `id` is NOT included — server generates it as a slug from `label`.
    """
    pass

class SoundboardItemResponse(SoundboardItemBase):
    model_config = ConfigDict(from_attributes=True)

    id: str  # Server-generated, returned in responses only
