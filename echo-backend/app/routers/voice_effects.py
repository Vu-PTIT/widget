from fastapi import APIRouter, HTTPException, status
from typing import List
from app.core.supabase_client import SupabaseClient
from app.models.voice_effect import VoiceEffectResponse

router = APIRouter(
    prefix="/voice-effects",
    tags=["voice-effects"]
)

@router.get("/", response_model=List[VoiceEffectResponse])
async def list_voice_effects(
    supabase: SupabaseClient
):
    """
    List all available voice effects.
    """
    response = await supabase.table("voice_effects").select("*").execute()
    return response.data
