from fastapi import APIRouter, HTTPException, status, Query
from typing import List, Annotated, Optional
from uuid import UUID
from datetime import datetime, timedelta, timezone
from app.core.supabase_client import SupabaseClient
from app.core.auth import CurrentUser
from app.models.user import UserCreate, UserUpdate, UserResponse
from app.models.settings import UserSettingsResponse, UserSettingsUpdate
from app.models.widget_config import WidgetConfigResponse, WidgetConfigUpdate

router = APIRouter(
    prefix="/users",
    tags=["users"]
)

@router.post("/", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user: UserCreate, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # Ensure the user ID matches the authenticated user
    if str(user.id) != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot create profile for another user")
    
    user_data = user.model_dump(mode='json')
    
    # Use upsert to handle cases where the trigger already created a basic profile
    response = await supabase.table("users").upsert(user_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create or update user profile")
    return response.data[0]

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    response = await supabase.table("users").select("*").eq("id", current_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User profile not found")
    return response.data[0]

@router.put("/me", response_model=UserResponse)
async def update_current_user(
    user_update: UserUpdate, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    update_data = user_update.model_dump(exclude_unset=True, mode='json')
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    response = await supabase.table("users").update(update_data).eq("id", current_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found or update failed")
    return response.data[0]

@router.get("/", response_model=List[UserResponse])
async def list_users(
    current_user_id: CurrentUser,
    supabase: SupabaseClient,
    query: Optional[str] = Query(None, min_length=3),
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
):
    """
    Search for users by username or name.
    Requires at least 3 characters for privacy.
    """
    if not query:
        raise HTTPException(
            status_code=400, 
            detail="A search query of at least 3 characters is required to list users."
        )
        
    response = await supabase.table("users").select("*")\
        .or_(f"username.ilike.%{query}%,name.ilike.%{query}%")\
        .limit(limit).execute()
    return response.data

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    supabase: SupabaseClient
):
    response = await supabase.table("users").select("*").eq("id", str(user_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="User not found")
    return response.data[0]

# --- Settings & Widget Config ---

@router.get("/me/settings", response_model=UserSettingsResponse)
async def get_my_settings(
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    response = await supabase.table("user_settings").select("*").eq("user_id", current_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Settings not found")
    return response.data[0]

@router.put("/me/settings", response_model=UserSettingsResponse)
async def update_my_settings(
    settings_update: UserSettingsUpdate,
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    update_data = settings_update.model_dump(exclude_unset=True, mode='json')
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    response = await supabase.table("user_settings").update(update_data).eq("user_id", current_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Settings update failed")
    return response.data[0]

@router.get("/me/widget-config", response_model=WidgetConfigResponse)
async def get_my_widget_config(
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    response = await supabase.table("user_widget_configs").select("*").eq("user_id", current_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Widget config not found")
    return response.data[0]

@router.put("/me/widget-config", response_model=WidgetConfigResponse)
async def update_my_widget_config(
    config_update: WidgetConfigUpdate,
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    update_data = config_update.model_dump(exclude_unset=True, mode='json')
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
        
    response = await supabase.table("user_widget_configs").update(update_data).eq("user_id", current_user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Widget config update failed")
    return response.data[0]

