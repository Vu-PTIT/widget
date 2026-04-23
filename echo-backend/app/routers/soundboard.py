from fastapi import APIRouter, HTTPException, status
from typing import List, Annotated
from app.core.supabase_client import SupabaseClient
from app.models.soundboard import SoundboardItemResponse

router = APIRouter(
    prefix="/soundboard",
    tags=["soundboard"]
)

DEFAULT_MAX_ITEMS = 200  # Prevent runaway DB growth

@router.get("/", response_model=List[SoundboardItemResponse])
async def list_soundboard(
    supabase: SupabaseClient
):
    response = await supabase.table("soundboard_items").select("*").limit(DEFAULT_MAX_ITEMS).execute()
    return response.data

