from fastapi import APIRouter, HTTPException, status
from typing import List
from uuid import UUID
from app.core.supabase_client import get_supabase
from app.models.user import UserCreate, UserUpdate, UserResponse

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate):
    supabase = get_supabase()
    response = supabase.table("users").insert(user.model_dump()).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create user")
    return response.data[0]

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID):
    supabase = get_supabase()
    response = supabase.table("users").select("*").eq("id", str(user_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(user_id: UUID, user_update: UserUpdate):
    supabase = get_supabase()
    update_data = user_update.model_dump(exclude_unset=True)
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    response = supabase.table("users").update(update_data).eq("id", str(user_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found or update failed")
    return response.data[0]

@router.get("/", response_model=List[UserResponse])
async def list_users(limit: int = 100):
    supabase = get_supabase()
    response = supabase.table("users").select("*").limit(limit).execute()
    return response.data
