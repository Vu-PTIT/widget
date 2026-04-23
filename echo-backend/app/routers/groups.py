from fastapi import APIRouter, HTTPException, status
from typing import List, Annotated
from uuid import UUID
from app.core.supabase_client import SupabaseClient
from app.core.auth import CurrentUser
from app.models.group import GroupCreate, GroupResponse, GroupMemberResponse, MemberAdd

router = APIRouter(
    prefix="/groups",
    tags=["groups"]
)

@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group: GroupCreate, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # 1. Create the group
    group_data = group.model_dump(mode='json')  # mode='json' serializes UUIDs to str
    group_data["created_by"] = current_user_id
    
    response = await supabase.table("groups").insert(group_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create group")
    
    new_group = response.data[0]
    
    # 2. Automatically add the creator as a member
    member_data = {
        "group_id": new_group["id"],
        "user_id": current_user_id
    }
    
    member_response = await supabase.table("group_members").insert(member_data).execute()
    if not member_response.data:
        # Cleanup the group if metadata association fails (pseudo-transaction)
        await supabase.table("groups").delete().eq("id", new_group["id"]).execute()
        raise HTTPException(status_code=400, detail="Failed to associate creator with group")
    
    return new_group

@router.get("/", response_model=List[GroupResponse])
async def get_my_groups(
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # Optimized: Use a single join query with Supabase !inner filter
    # This fetches groups where the user is a member in one round-trip.
    response = await supabase.table("groups")\
        .select("*, group_members!inner(user_id)")\
        .eq("group_members.user_id", current_user_id)\
        .execute()
    
    # The join adds group_members data to each group dict; we remove it to match GroupResponse
    groups = response.data or []
    for g in groups:
        if "group_members" in g:
            del g["group_members"]
            
    return groups

@router.get("/{group_id}", response_model=GroupResponse)
async def get_group_details(
    group_id: UUID, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # Check membership (enforced by RLS anyway, but good for explicit error)
    member_check = await supabase.table("group_members").select("*").eq("group_id", str(group_id)).eq("user_id", current_user_id).execute()
    if not member_check.data:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    response = await supabase.table("groups").select("*").eq("id", str(group_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Group not found")
        
    return response.data[0]

@router.post("/{group_id}/members", status_code=status.HTTP_201_CREATED)
async def add_member(
    group_id: UUID, 
    member: MemberAdd, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # Check if current user is a member of the group
    member_check = await supabase.table("group_members").select("*").eq("group_id", str(group_id)).eq("user_id", current_user_id).execute()
    
    if not member_check.data:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
    
    member_data = {
        "group_id": str(group_id),
        "user_id": str(member.user_id)
    }
    
    response = await supabase.table("group_members").insert(member_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to add member")
    
    return {"message": "Member added successfully"}

@router.delete("/{group_id}/members/{user_id}")
async def remove_member(
    group_id: UUID, 
    user_id: UUID, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # Any member can remove anyone (equal rights)
    member_check = await supabase.table("group_members").select("*").eq("group_id", str(group_id)).eq("user_id", current_user_id).execute()
    
    if not member_check.data:
        raise HTTPException(status_code=403, detail="You are not a member of this group")
            
    response = await supabase.table("group_members").delete().eq("group_id", str(group_id)).eq("user_id", str(user_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Member not found in this group")
    return {"message": "Member removed successfully"}
