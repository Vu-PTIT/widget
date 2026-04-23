from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Annotated
from uuid import UUID
from app.core.supabase_client import SupabaseClient
from app.core.auth import CurrentUser
from app.models.friend import FriendCreate, FriendUpdate, FriendResponse, FriendStatus

router = APIRouter(
    prefix="/friends",
    tags=["friends"]
)

def ordered_ids(id_a: str, id_b: str):
    return (id_a, id_b) if id_a < id_b else (id_b, id_a)

@router.post("/", response_model=FriendResponse, status_code=status.HTTP_201_CREATED)
async def add_friend(
    friend: FriendCreate, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # Ensure the initiator_id matches the authenticated user
    if str(friend.initiator_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot send friend request on behalf of another user")
    
    # Check if the authenticated user is either user_id or friend_id
    if str(friend.user_id) != current_user_id and str(friend.friend_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Authenticated user must be part of the friendship")

    # Ensure IDs are ordered consistently for the check and the insert
    uid, fid = ordered_ids(str(friend.user_id), str(friend.friend_id))
    
    # Update friend object with ordered IDs
    friend_dict = friend.model_dump(mode='json')
    friend_dict['user_id'] = uid
    friend_dict['friend_id'] = fid
    
    # Check if relationship already exists
    existing = await supabase.table("friends").select("*").eq("user_id", uid).eq("friend_id", fid).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Friend relationship already exists")
        
    response = await supabase.table("friends").insert(friend_dict).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to add friend")
    return response.data[0]

@router.get("/", response_model=List[FriendResponse])
async def list_friends(
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # Fetch where user_id is the user OR friend_id is the user, along with both profiles
    response = await supabase.table("friends")\
        .select("*, user:users!user_id(id, username, name, avatar, status), friend:users!friend_id(id, username, name, avatar, status)")\
        .or_(f"user_id.eq.{current_user_id},friend_id.eq.{current_user_id}")\
        .execute()
    
    data = response.data or []
    for item in data:
        # Determine which profile is the "peer"
        if str(item["user_id"]) == current_user_id:
            item["peer_profile"] = item["friend"]
        else:
            item["peer_profile"] = item["user"]
        
        # Remove the extra fields to match schema
        if "user" in item: del item["user"]
        if "friend" in item: del item["friend"]
        
    return data

@router.patch("/{friend_id}", response_model=FriendResponse)
async def update_friend_status(
    friend_id: UUID, 
    status_update: FriendUpdate, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    uid, fid = ordered_ids(current_user_id, str(friend_id))
    
    # Fetch existing to check initiator
    existing = await supabase.table("friends").select("*").eq("user_id", uid).eq("friend_id", fid).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Friend relationship not found")
    
    record = existing.data[0]
    
    # Prevent initiator from accepting their own request
    if status_update.status == FriendStatus.ACCEPTED and str(record['initiator_id']) == current_user_id:
        raise HTTPException(status_code=403, detail="Cannot accept your own friend request")
        
    response = await supabase.table("friends").update({"status": status_update.status.value}).eq("user_id", uid).eq("friend_id", fid).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to update friend status")
    return response.data[0]

@router.delete("/{friend_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_friend(
    friend_id: UUID, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    uid, fid = ordered_ids(current_user_id, str(friend_id))
    response = await supabase.table("friends").delete().eq("user_id", uid).eq("friend_id", fid).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Friend relationship not found")
    return None
