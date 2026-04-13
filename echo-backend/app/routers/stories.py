from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID
from datetime import datetime, timedelta, timezone
from supabase import Client
from app.core.supabase_client import get_supabase
from app.core.auth import get_current_user
from app.models.story import StoryCreate, StoryResponse

router = APIRouter(
    prefix="/stories",
    tags=["stories"]
)

@router.post("/", response_model=StoryResponse, status_code=status.HTTP_201_CREATED)
async def create_story(
    story: StoryCreate, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Ensure the user_id matches the authenticated user
    if str(story.user_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot create story for another user")
    
    # Auto-expire in 24h if not set
    if not story.expires_at:
        story.expires_at = datetime.now(timezone.utc) + timedelta(hours=24)
        
    response = supabase.table("stories").insert(story.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create story")
    return response.data[0]

@router.get("/", response_model=List[StoryResponse])
async def list_active_stories(
    supabase: Client = Depends(get_supabase)
):
    """
    List all stories that haven't expired yet
    """
    now = datetime.now(timezone.utc).isoformat()
    response = supabase.table("stories").select("*").gt("expires_at", now).execute()
    return response.data

@router.get("/my", response_model=List[StoryResponse])
async def get_my_stories(
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    now = datetime.now(timezone.utc).isoformat()
    response = supabase.table("stories").select("*").eq("user_id", current_user_id).gt("expires_at", now).execute()
    return response.data
