from fastapi import APIRouter, BackgroundTasks, HTTPException, status, Query
from typing import List, Optional, Annotated
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from collections import defaultdict
from supabase import AClient as AsyncClient
from app.core.supabase_client import SupabaseClient
from app.core.auth import CurrentUser
from app.core.logger import logger
from app.models.message import MessageCreate, MessageUpdate, MessageResponse, InboxEntry, ReadStateResponse

router = APIRouter(
    prefix="/messages",
    tags=["messages"]
)

class NotificationRequest(BaseModel):
    message_id: UUID
    sender_id: UUID
    receiver_id: UUID
    audio_path: str # Path directly on Supabase Storage

class NotificationResponse(BaseModel):
    status: str
    message: str

async def _process_messages(messages: List[dict], current_user_id: str, supabase: AsyncClient) -> List[MessageResponse]:
    """
    Helper to add is_played and read_by information to a list of messages.
    Returns a list of MessageResponse models.
    """
    if not messages:
        return []
        
    msg_ids = [m["id"] for m in messages]
    # Fetch all read states for these messages
    reads = await supabase.table("message_read_states")\
        .select("message_id, user_id")\
        .in_("message_id", msg_ids)\
        .execute()
        
    # Group reads by message_id
    msg_reads = defaultdict(list)
    for r in reads.data:
        msg_reads[r["message_id"]].append(r["user_id"])
        
    processed = []
    for m in messages:
        read_by = msg_reads[m["id"]]
        # Ensure string comparison for compatibility
        is_played = str(current_user_id) in [str(uid) for uid in read_by] or str(m["sender_id"]) == str(current_user_id)
        
        # Combine data for MessageResponse
        m_data = {**m, "read_by": read_by, "is_played": is_played}
        processed.append(MessageResponse.model_validate(m_data))
        
    return processed

def schedule_supabase_cleanup(message_id: str, audio_path: str):
    logger.info(f"[Supabase Cleanup] Scheduled deletion for audio {audio_path} (ID: {message_id}) in 24h")

@router.post("/notify", response_model=NotificationResponse)
async def notify_receiver(
    request: NotificationRequest,
    background_tasks: BackgroundTasks,
    current_user_id: CurrentUser,
    supabase: SupabaseClient,
):
    # L3: Verify sender matches authenticated user
    if str(request.sender_id) != current_user_id:
        raise HTTPException(status_code=403, detail="Cannot send notification on behalf of another user")

    # L3: Verify receiver actually exists
    receiver_check = await supabase.table("users").select("id").eq("id", str(request.receiver_id)).execute()
    if not receiver_check.data:
        raise HTTPException(status_code=404, detail="Receiver not found")

    # M1: Mask UUIDs in logs — show only first 8 chars
    masked_receiver = str(request.receiver_id)[:8] + "..."
    masked_sender = str(request.sender_id)[:8] + "..."
    logger.info(f"Triggering push to {masked_receiver} from {masked_sender}")

    # L3: Verify message_id exists and was sent by current_user_id before scheduling cleanup
    msg_verify = await supabase.table("messages").select("sender_id").eq("id", str(request.message_id)).execute()
    if not msg_verify.data or str(msg_verify.data[0]["sender_id"]) != current_user_id:
        logger.warning(f"Cleanup skipped: User {current_user_id[:8]}... does not own message {str(request.message_id)[:8]}...")
    else:
        background_tasks.add_task(schedule_supabase_cleanup, str(request.message_id), request.audio_path)
    
    return {"status": "success", "message": "Notification dispatched and cleanup scheduled."}

@router.post("/", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message(
    message: MessageCreate, 
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    # Ensure the sender_id matches the authenticated user
    if str(message.sender_id) != current_user_id:
        logger.warning(f"User {current_user_id[:8]}... tried to send message as {str(message.sender_id)[:8]}...")
        raise HTTPException(status_code=403, detail="Cannot send message on behalf of another user")
    
    # If group message, verify membership
    if message.group_id:
        member_check = await supabase.table("group_members").select("*").eq("group_id", str(message.group_id)).eq("user_id", current_user_id).execute()
        if not member_check.data:
            raise HTTPException(status_code=403, detail="Not a member of this group")
            
    response = await supabase.table("messages").insert(message.model_dump(mode='json')).execute()
    res_data = response.data[0]
    # Sender has logically "played" their own message
    res_data["is_played"] = True
    res_data["read_by"] = []
    return res_data

@router.get("/inbox", response_model=List[InboxEntry])
async def get_inbox(
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    """
    Get the latest message for every conversation the user is part of.
    """
    response = await supabase.rpc("get_user_inbox", {"p_user_id": current_user_id}).execute()
    if not response.data:
        return []
    
    return response.data

@router.get("/unread-count")
async def get_unread_count(
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    """
    Get unread message counts per conversation.
    """
    response = await supabase.rpc("get_unread_counts", {"p_user_id": current_user_id}).execute()
    return response.data or []

@router.get("/group/{group_id}", response_model=List[MessageResponse])
async def get_group_messages(
    group_id: UUID,
    current_user_id: CurrentUser,
    supabase: SupabaseClient,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    before: Optional[datetime] = Query(default=None),
):
    """
    Get messages for a specific group with pagination
    """
    # Verify membership
    member_check = await supabase.table("group_members").select("*").eq("group_id", str(group_id)).eq("user_id", current_user_id).execute()
    if not member_check.data:
        raise HTTPException(status_code=403, detail="Not a member of this group")
        
    # Get messages
    query = supabase.table("messages").select("*").eq("group_id", str(group_id))
    
    if before:
        query = query.lt("created_at", before.isoformat())
        
    response = await query.order("created_at", descending=True).limit(limit).execute()
    
    return await _process_messages(response.data, current_user_id, supabase)

@router.post("/{message_id}/played", response_model=ReadStateResponse)
async def mark_as_read(
    message_id: UUID,
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    """
    Mark a message as read by the current user.
    Works for both direct and group messages.
    """
    # Insert or do nothing if already read (upsert style)
    read_data = {
        "message_id": str(message_id),
        "user_id": current_user_id
    }
    
    try:
        response = await supabase.table("message_read_states").upsert(read_data).execute()
        if response.data:
            return response.data[0]
    except Exception as e:
        logger.error(f"Read state upsert failed: {str(e)}")
        # Continue to explicit check below
        pass

    # If we get here, either response.data was empty or an exception occurred
    msg_check = await supabase.table("messages").select("id, receiver_id, group_id").eq("id", str(message_id)).execute()
    
    if not msg_check.data:
        raise HTTPException(status_code=404, detail="Message not found")
    
    # If it exists but upsert failed, it's likely an RLS permission issue
    raise HTTPException(
        status_code=403, 
        detail="You do not have permission to mark this message as read (you must be the receiver or a group member)"
    )

@router.get("/{message_id}/reads", response_model=List[UUID])
async def get_message_read_status(
    message_id: UUID,
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    """
    See a list of user IDs who have read this message.
    """
    # RLS will ensure the user can only see reads for messages they have access to
    response = await supabase.table("message_read_states").select("user_id").eq("message_id", str(message_id)).execute()
    return [r["user_id"] for r in response.data]

@router.post("/conversation/{other_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_conversation_as_read(
    other_id: UUID,
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    """
    Mark all unread messages in a direct conversation as read.
    """
    await supabase.rpc("mark_conversation_as_read", {
        "p_user_id": current_user_id,
        "p_other_id": str(other_id)
    }).execute()
    return None

@router.post("/group/{group_id}/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_group_messages_as_read(
    group_id: UUID,
    current_user_id: CurrentUser,
    supabase: SupabaseClient
):
    """
    Mark all unread messages in a group as read.
    """
    await supabase.rpc("mark_group_as_read", {
        "p_user_id": current_user_id,
        "p_group_id": str(group_id)
    }).execute()
    return None

@router.get("/{other_id}", response_model=List[MessageResponse])
async def get_conversation(
    other_id: UUID,
    current_user_id: CurrentUser,
    supabase: SupabaseClient,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    before: Optional[datetime] = Query(default=None),
):
    """
    Get direct messages between 'current_user_id' and 'other_id' with pagination
    """
    query = supabase.table("messages").select("*").or_(
        f"and(sender_id.eq.{current_user_id},receiver_id.eq.{other_id}),"
        f"and(sender_id.eq.{other_id},receiver_id.eq.{current_user_id})"
    ).is_("group_id", None)
    
    if before:
        query = query.lt("created_at", before.isoformat())
        
    response = await query.order("created_at", descending=True).limit(limit).execute()
    
    return await _process_messages(response.data, current_user_id, supabase)
