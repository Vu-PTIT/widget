from fastapi import APIRouter, Header, HTTPException, status, Request
from app.core.config import settings
from app.core.supabase_client import SupabaseAdminClient
from app.core.logger import logger
from datetime import datetime, timezone
from typing import Optional

router = APIRouter(
    prefix="/payments",
    tags=["payments"]
)

@router.post("/webhook")
async def revenuecat_webhook(
    request: Request,
    supabase: SupabaseAdminClient,
    authorization: Optional[str] = Header(None)
):
    """
    RevenueCat Webhook handler to sync premium status.
    Security: Validates Authorization header against REVENUECAT_WEBHOOK_AUTH_KEY.
    """
    if not authorization or authorization != settings.REVENUECAT_WEBHOOK_AUTH_KEY:
        logger.warning(f"Unauthorized RevenueCat webhook attempt with auth: {authorization}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid authorization key"
        )
    
    try:
        data = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse RevenueCat webhook JSON: {e}")
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event = data.get("event", {})
    event_type = event.get("type")
    app_user_id = event.get("app_user_id")

    if not app_user_id:
        logger.error("RevenueCat webhook missing app_user_id")
        return {"status": "ignored", "reason": "missing_app_user_id"}

    logger.info(f"Processing RevenueCat event: {event_type} for user: {app_user_id}")

    # 1. Log payment event to history
    try:
        await supabase.table("payment_history").insert({
            "user_id": app_user_id,
            "event_type": event_type,
            "payload": data
        }).execute()
    except Exception as e:
        logger.error(f"Failed to log payment history: {e}")
        # We continue even if logging fails, as updating user status is more critical

    # 2. Update user membership status
    if event_type in ["INITIAL_PURCHASE", "RENEWAL", "UNCANCEL"]:
        expiration_ms = event.get("expiration_at_ms")
        premium_until = None
        if expiration_ms:
            # RevenueCat sends timestamps in milliseconds
            premium_until = datetime.fromtimestamp(
                expiration_ms / 1000.0, 
                tz=timezone.utc
            ).isoformat()
        
        await supabase.table("users").update({
            "membership": "premium",
            "premium_until": premium_until
        }).eq("id", app_user_id).execute()
        
        logger.info(f"User {app_user_id} upgraded to premium until {premium_until}")
        
    elif event_type in ["EXPIRATION", "CANCELLATION"]:
        # In case of expiration, we revert to free
        # Note: RevenueCat sends EXPIRATION event when the user actually loses access.
        await supabase.table("users").update({
            "membership": "free"
        }).eq("id", app_user_id).execute()
        
        logger.info(f"User {app_user_id} membership set to free due to {event_type}")

    elif event_type == "TRANSFER":
        # Handle cases where a purchase is moved between IDs
        # RevenueCat provides origin and destination IDs in the event
        # For simple cases, we just follow the normal flow for the new app_user_id
        pass

    return {"status": "ok"}
