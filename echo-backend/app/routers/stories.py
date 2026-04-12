from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID
from datetime import datetime, timedelta
from app.core.supabase_client import get_supabase
from app.models.story import StoryCreate, StoryResponse

router = APIRouter(
    prefix="/stories",
    tags=["stories"]
)

@router.post("/", response_model=StoryResponse, status_code=status.HTTP_201_CREATED)
async def create_story(story: StoryCreate):
    supabase = get_supabase()
    # Auto-expire in 24h if not set
    if not story.expires_at:
        story.expires_at = datetime.now() + timedelta(hours=24)
        
    response = supabase.table("stories").insert(story.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create story")
    return response.data[0]

@router.get("/", response_model=List[StoryResponse])
async def list_active_stories():
    """
    List all stories that haven't expired yet
    """
    supabase = get_supabase()
    now = datetime.now().isoformat()
    response = supabase.table("stories").select("*").gt("expires_at", now).execute()
    return response.data

@router.get("/{user_id}", response_model=List[StoryResponse])
async def get_user_stories(user_id: UUID):
    supabase = get_supabase()
    now = datetime.now().isoformat()
    response = supabase.table("stories").select("*").eq("user_id", str(user_id)).gt("expires_at", now).execute()
    return response.data
