from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID
from supabase import Client
from app.core.supabase_client import get_supabase
from app.core.auth import get_current_user
from app.models.group import GroupCreate, GroupResponse, GroupMemberResponse, GroupRole

router = APIRouter(
    prefix="/groups",
    tags=["groups"]
)

@router.post("/", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    group: GroupCreate, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # 1. Create the group
    group_data = group.model_dump()
    group_data["created_by"] = current_user_id
    
    response = supabase.table("groups").insert(group_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create group")
    
    new_group = response.data[0]
    
    # 2. Automatically add the creator as an admin member
    member_data = {
        "group_id": new_group["id"],
        "user_id": current_user_id,
        "role": GroupRole.ADMIN
    }
    supabase.table("group_members").insert(member_data).execute()
    
    return new_group

@router.get("/", response_model=List[GroupResponse])
async def get_my_groups(
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Get groups where user is a member
    response = supabase.table("group_members").select("group_id").eq("user_id", current_user_id).execute()
    group_ids = [m["group_id"] for m in response.data]
    
    if not group_ids:
        return []
    
    response = supabase.table("groups").select("*").in_("id", group_ids).execute()
    return response.data

@router.get("/{group_id}", response_model=GroupResponse)
async def get_group_details(
    group_id: UUID, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Check membership (enforced by RLS anyway, but good for explicit error)
    member_check = supabase.table("group_members").select("*").eq("group_id", str(group_id)).eq("user_id", current_user_id).execute()
    if not member_check.data:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    response = supabase.table("groups").select("*").eq("id", str(group_id)).single().execute()
    return response.data

@router.post("/{group_id}/members/{user_id}", status_code=status.HTTP_201_CREATED)
async def add_member(
    group_id: UUID, 
    user_id: UUID, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Check if current user is an admin of the group
    admin_check = supabase.table("group_members").select("role").eq("group_id", str(group_id)).eq("user_id", current_user_id).single().execute()
    if not admin_check.data or admin_check.data["role"] != GroupRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can add members")
    
    member_data = {
        "group_id": str(group_id),
        "user_id": str(user_id),
        "role": GroupRole.MEMBER
    }
    
    response = supabase.table("group_members").insert(member_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to add member")
    
    return {"message": "Member added successfully"}

@router.delete("/{group_id}/members/{user_id}")
async def remove_member(
    group_id: UUID, 
    user_id: UUID, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Users can remove themselves, or admins can remove anyone
    is_self = str(user_id) == current_user_id
    
    if not is_self:
        admin_check = supabase.table("group_members").select("role").eq("group_id", str(group_id)).eq("user_id", current_user_id).single().execute()
        if not admin_check.data or admin_check.data["role"] != GroupRole.ADMIN:
            raise HTTPException(status_code=403, detail="Only admins can remove members")
            
    response = supabase.table("group_members").delete().eq("group_id", str(group_id)).eq("user_id", str(user_id)).execute()
    return {"message": "Member removed successfully"}
