from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Depends
from typing import List
from uuid import UUID
from pydantic import BaseModel
from supabase import Client
from app.core.supabase_client import get_supabase
from app.core.auth import get_current_user
from app.models.message import MessageCreate, MessageUpdate, MessageResponse

router = APIRouter(
    prefix="/messages",
    tags=["messages"]
)

class NotificationRequest(BaseModel):
    message_id: str
    sender_id: str
    receiver_id: str
    audio_path: str # Path directly on Supabase Storage

class NotificationResponse(BaseModel):
    status: str
    message: str

def schedule_supabase_cleanup(message_id: str, audio_path: str):
    print(f"[Supabase Cleanup] Scheduled deletion for audio {audio_path} (ID: {message_id}) in 24h")

@router.post("/notify", response_model=NotificationResponse)
async def notify_receiver(
    request: NotificationRequest,
    background_tasks: BackgroundTasks
):
    print(f"Triggering push to {request.receiver_id} from {request.sender_id}")
    background_tasks.add_task(schedule_supabase_cleanup, request.message_id, request.audio_path)
    return {"status": "success", "message": "Notification dispatched and cleanup scheduled."}

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message: MessageCreate, 
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    # Ensure the sender_id matches the authenticated user
    if str(message.sender_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot send message on behalf of another user")
    
    # If group message, verify membership
    if message.group_id:
        member_check = supabase.table("group_members").select("*").eq("group_id", str(message.group_id)).eq("user_id", current_user_id).execute()
        if not member_check.data:
            raise HTTPException(status_code=403, detail="Not a member of this group")
            
    response = supabase.table("messages").insert(message.model_dump(mode='json')).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to send message")
    return response.data[0]

@router.get("/{other_id}", response_model=List[MessageResponse])
async def get_conversation(
    other_id: UUID,
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Get direct messages between 'current_user_id' and 'other_id'
    """
    response = supabase.table("messages").select("*").or_(
        f"and(sender_id.eq.{current_user_id},receiver_id.eq.{other_id}),"
        f"and(sender_id.eq.{other_id},receiver_id.eq.{current_user_id})"
    ).is_("group_id", "null").order("created_at", descending=False).execute()
    return response.data

@router.get("/group/{group_id}", response_model=List[MessageResponse])
async def get_group_messages(
    group_id: UUID,
    current_user_id: str = Depends(get_current_user),
    supabase: Client = Depends(get_supabase)
):
    """
    Get messages for a specific group
    """
    # Verify membership
    member_check = supabase.table("group_members").select("*").eq("group_id", str(group_id)).eq("user_id", current_user_id).execute()
    if not member_check.data:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    response = supabase.table("messages").select("*").eq("group_id", str(group_id)).order("created_at", descending=False).execute()
    return response.data

@router.patch("/{message_id}/played", response_model=MessageResponse)
async def mark_as_played(
    message_id: UUID,
    supabase: Client = Depends(get_supabase)
):
    response = supabase.table("messages").update({"is_played": True}).eq("id", str(message_id)).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Message not found")
    return response.data[0]
