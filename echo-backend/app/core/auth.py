from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from typing import Annotated
from app.core.config import settings

security = HTTPBearer()

async def get_current_token(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> str:
    return credentials.credentials

async def get_current_user(
    token: str = Depends(get_current_token)
) -> str:
    try:
        # Supabase JWT secret lấy từ Dashboard > Settings > API > JWT Secret
        payload = jwt.decode(
            token,
            settings.SUPABASE_JWT_SECRET,
            algorithms=["HS256"],
            audience="authenticated"
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Token invalid or expired")

# Type alias for current user ID dependency
CurrentUser = Annotated[str, Depends(get_current_user)]