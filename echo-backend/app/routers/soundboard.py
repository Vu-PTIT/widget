from fastapi import APIRouter, HTTPException, status
from typing import List
from app.core.supabase_client import get_supabase
from app.models.soundboard import SoundboardItemCreate, SoundboardItemResponse

router = APIRouter(
    prefix="/soundboard",
    tags=["soundboard"]
)

@router.get("/", response_model=List[SoundboardItemResponse])
async def list_soundboard():
    supabase = get_supabase()
    response = supabase.table("soundboard_items").select("*").execute()
    return response.data

@router.post("/", response_model=SoundboardItemResponse, status_code=status.HTTP_201_CREATED)
async def create_soundboard_item(item: SoundboardItemCreate):
    supabase = get_supabase()
    response = supabase.table("soundboard_items").insert(item.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create soundboard item")
    return response.data[0]
