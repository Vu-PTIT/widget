from fastapi import APIRouter, HTTPException, status, Depends
from typing import List
from uuid import UUID
from supabase import Client
from app.core.supabase_client import get_supabase
from app.core.auth import get_current_user
from app.models.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Ensure the user ID matches the authenticated user
    if str(user.id) != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot create profile for another user")
    
    response = supabase.table("users").insert(user.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create user")
    return response.data[0]

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("users").select("*").eq("id", current_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    return response.data[0]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("users").select("*").eq("id", str(user_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    update_data = user_update.model_dump(exclude_unset=True, mode='json')
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    response = supabase.table("users").update(update_data).eq("id", current_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found or update failed")
    return response.data[0]

@router.get("/", response_model=List[UserResponse])
async def list_users(
    limit: int = 100,
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("users").select("*").limit(limit).execute()
    return response.data
