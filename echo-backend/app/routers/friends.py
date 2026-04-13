from fastapi import APIRouter, HTTPException, status, Query, Depends
from typing import List
from uuid import UUID
from supabase import Client
from app.core.supabase_client import get_supabase
from app.core.auth import get_current_user
from app.models.friend import FriendCreate, FriendUpdate, FriendResponse, FriendStatus

router = APIRouter(
    prefix="/friends",
    tags=["friends"]
)

@router.post("/", response_model=FriendResponse, status_code=status.HTTP_201_CREATED)
async def add_friend(
    friend: FriendCreate, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Ensure the user_id matches the authenticated user
    if str(friend.user_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot add friend on behalf of another user")
    
    # Check if relationship already exists
    existing = supabase.table("friends").select("*").eq("user_id", str(friend.user_id)).eq("friend_id", str(friend.friend_id)).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Friend relationship already exists")
        
    response = supabase.table("friends").insert(friend.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to add friend")
    return response.data[0]

@router.get("/", response_model=List[FriendResponse])
async def list_friends(
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Fetch where user_id is the user OR friend_id is the user
    response = supabase.table("friends").select("*").or_(f"user_id.eq.{current_user_id},friend_id.eq.{current_user_id}").execute()
    return response.data

@router.patch("/{friend_id}", response_model=FriendResponse)
async def update_friend_status(
    friend_id: UUID, 
    status_update: FriendUpdate, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("friends").update({"status": status_update.status}).eq("user_id", current_user_id).eq("friend_id", str(friend_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Friend relationship not found")
    return response.data[0]

@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(
    friend_id: UUID, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("friends").delete().eq("user_id", current_user_id).eq("friend_id", str(friend_id)).execute()
    if not response.data:
        # Check reverse relationship too
        response = supabase.table("friends").delete().eq("user_id", str(friend_id)).eq("friend_id", current_user_id).execute()
        if not response.data:
            raise HTTPException(status_code=404, detail="Friend relationship not found")
    return None
