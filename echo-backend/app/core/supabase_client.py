from typing import Annotated
from supabase import acreate_client, AClient as AsyncClient
from fastapi import Depends
from app.core.config import settings
from app.core.auth import get_current_token


async def get_supabase(token: str = Depends(get_current_token)) -> AsyncClient:
    # IMPORTANT: We create a NEW client instance per request to avoid race conditions
    # when setting the auth token for postgrest.
    client: AsyncClient = await acreate_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)
    client.postgrest.auth(token)
    return client

async def get_supabase_admin() -> AsyncClient:
    """Returns a Supabase client with SERVICE_ROLE permissions.
    Used for webhooks and internal background tasks where no user context exists.
    """
    return await acreate_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_KEY)

# Type aliases for Supabase client dependencies
SupabaseClient = Annotated[AsyncClient, Depends(get_supabase)]
SupabaseAdminClient = Annotated[AsyncClient, Depends(get_supabase_admin)]
