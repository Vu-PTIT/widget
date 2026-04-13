from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from supabase import Client
from app.core.supabase_client import get_supabase
from app.core.auth import get_current_user
from app.models.soundboard import SoundboardItemCreate, SoundboardItemResponse

router = APIRouter(
    prefix="/soundboard",
    tags=["soundboard"]
)

@router.get("/", response_model=List[SoundboardItemResponse])
async def list_soundboard(
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("soundboard_items").select("*").execute()
    return response.data

@router.post("/", response_model=SoundboardItemResponse, status_code=status.HTTP_201_CREATED)
async def create_soundboard_item(
    item: SoundboardItemCreate, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Only allow admin users to create soundboard items
    # For now, just require authentication - you might want to add role checking later
    response = supabase.table("soundboard_items").insert(item.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create soundboard item")
    return response.data[0]
