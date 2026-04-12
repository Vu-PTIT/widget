from fastapi import APIRouter, HTTPException, status, Query
from typing import List
from uuid import UUID
from app.core.supabase_client import get_supabase
from app.models.friend import FriendCreate, FriendUpdate, FriendResponse, FriendStatus

router = APIRouter(
    prefix="/friends",
    tags=["friends"]
)

@router.post("/", response_model=FriendResponse, status_code=status.HTTP_201_CREATED)
async def add_friend(friend: FriendCreate):
    supabase = get_supabase()
    # Check if relationship already exists
    existing = supabase.table("friends").select("*").eq("user_id", str(friend.user_id)).eq("friend_id", str(friend.friend_id)).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Friend relationship already exists")
        
    response = supabase.table("friends").insert(friend.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to add friend")
    return response.data[0]

@router.get("/{user_id}", response_model=List[FriendResponse])
async def list_friends(user_id: UUID):
    supabase = get_supabase()
    # Fetch where user_id is the user OR friend_id is the user
    response = supabase.table("friends").select("*").or_(f"user_id.eq.{user_id},friend_id.eq.{user_id}").execute()
    return response.data

@router.patch("/{user_id}/{friend_id}", response_model=FriendResponse)
async def update_friend_status(user_id: UUID, friend_id: UUID, status_update: FriendUpdate):
    supabase = get_supabase()
    response = supabase.table("friends").update({"status": status_update.status}).eq("user_id", str(user_id)).eq("friend_id", str(friend_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Friend relationship not found")
    return response.data[0]

@router.delete("/{user_id}/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(user_id: UUID, friend_id: UUID):
    supabase = get_supabase()
    response = supabase.table("friends").delete().eq("user_id", str(user_id)).eq("friend_id", str(friend_id)).execute()
    if not response.data:
        # Check reverse relationship too
        response = supabase.table("friends").delete().eq("user_id", str(friend_id)).eq("friend_id", str(user_id)).execute()
    return None
