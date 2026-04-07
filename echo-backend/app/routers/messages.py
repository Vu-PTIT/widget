from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from app.core.supabase_client import get_supabase

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
    # Dummy logic for Celery / BackgroundTask
    # Supabase provides pg_cron which could also do this natively,
    # but FastAPI gives us programmatic control.
    print(f"[Supabase Cleanup] Scheduled deletion for audio {audio_path} (ID: {message_id}) in 24h")

@router.post("/notify", response_model=NotificationResponse)
async def notify_receiver(
    request: NotificationRequest,
    background_tasks: BackgroundTasks
):
    supabase = get_supabase()
    
    # Optional: Verify if the message actually exists in Supabase DB
    # response = supabase.table('messages').select('*').eq('id', request.message_id).execute()
    # if not response.data:
    #     raise HTTPException(status_code=404, detail="Message not found in Supabase")
        
    # TODO: 
    # 1. Fetch receiver's FCM Token from Supabase users table
    # 2. Trigger Firebase Admin SDK to send Silent push for Haptic Feedback
    print(f"Triggering push to {request.receiver_id} from {request.sender_id}")
    
    # Schedule ephemeral auto-deletion (24h rule)
    background_tasks.add_task(schedule_supabase_cleanup, request.message_id, request.audio_path)
    
    return {"status": "success", "message": "Notification dispatched and cleanup scheduled."}
