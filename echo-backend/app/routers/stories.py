from fastapi import APIRouter, HTTPException, status
from typing import List, Annotated
from uuid import UUID
from datetime import datetime, timedelta, timezone
from app.core.supabase_client import SupabaseClient
from app.core.auth import CurrentUser
from app.models.story import StoryCreate, StoryResponse

router = APIRouter(
    prefix="/stories",
    tags=["stories"]
)

@router.post("/", response_model=StoryResponse, status_code=status.HTTP_201_CREATED)
async def create_story(
    story: StoryCreate, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # Ensure the user_id matches the authenticated user
    if str(story.user_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot create story for another user")
    
    # Auto-expire in 24h if not set
    now = datetime.now(timezone.utc)
    if not story.expires_at:
        story.expires_at = now + timedelta(hours=24)
    elif story.expires_at <= now:
        raise HTTPException(status_code=400, detail="Story expiration time must be in the future")
        
    response = await supabase.table("stories").insert(story.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create story")
    return response.data[0]

@router.get("/", response_model=List[StoryResponse])
async def list_active_stories(
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    """
    List all stories from friends that haven't expired yet
    """
    # Optimized: Fetch stories only from people the user is following/friends with
    friend_response = await supabase.table("friends").select("user_id, friend_id")\
        .eq("status", "accepted")\
        .or_(f"user_id.eq.{current_user_id},friend_id.eq.{current_user_id}")\
        .execute()
    
    # Collective set of user IDs (self + friends)
    friend_ids = {current_user_id}
    for f in friend_response.data or []:
        friend_ids.add(f["user_id"])
        friend_ids.add(f["friend_id"])
    
    now = datetime.now(timezone.utc).isoformat()
    response = await supabase.table("stories")\
        .select("*")\
        .in_("user_id", list(friend_ids))\
        .gt("expires_at", now)\
        .execute()
        
    return response.data

@router.get("/my", response_model=List[StoryResponse])
async def get_my_stories(
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    now = datetime.now(timezone.utc).isoformat()
    response = await supabase.table("stories").select("*").eq("user_id", current_user_id).gt("expires_at", now).execute()
    return response.data

@router.delete("/{story_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_story(
    story_id: UUID,
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    """
    Delete a story. Only the owner can delete their story.
    """
    response = await supabase.table("stories").delete().eq("id", str(story_id)).eq("user_id", current_user_id).execute()
    
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Story not found or you don't have permission to delete it"
        )
    
    return None
