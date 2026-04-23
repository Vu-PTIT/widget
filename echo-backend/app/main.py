from fastapi import FastAPI, Request, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
from postgrest.exceptions import APIError
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from app.core.config import settings
from app.core.auth import get_current_user
from app.core.logger import logger
from app.routers import messages, users, friends, stories, soundboard, groups, voice_effects, payments

# M5: Rate limiter — key off real IP address
limiter = Limiter(key_func=get_remote_address, default_limits=["60/minute"])

def _validate_startup_config():
    """C1 + H2: Abort on insecure defaults when DEBUG is off."""
    errors = []
    if not settings.DEBUG:
        if settings.SECRET_KEY in ("dev-secret-key-replace-me-in-production", "generate-a-secure-secret-key-here", ""):
            errors.append("SECRET_KEY is still the default placeholder. Generate one with: python -c \"import secrets; print(secrets.token_urlsafe(64))\"")
        if "*" in settings.ALLOWED_ORIGINS:
            errors.append("ALLOWED_ORIGINS must NOT contain '*' in production. Set it to your frontend domain(s).")
        if settings.SUPABASE_KEY in ("your-anon-or-service-role-key", ""):
            errors.append("SUPABASE_KEY is not set.")
        if settings.SUPABASE_JWT_SECRET in ("your-jwt-secret", "your-jwt-secret-from-dashboard", ""):
            errors.append("SUPABASE_JWT_SECRET is not set.")
    if errors:
        for e in errors:
            logger.critical(f"[STARTUP CONFIG ERROR] {e}")
        raise RuntimeError("Insecure configuration detected. Refusing to start. See logs above.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    _validate_startup_config()
    logger.info("Starting Echo API - The Whisper Widget (MLP Architecture)")
    yield
    # Shutdown logic
    logger.info("Echo API is shutting down...")

app = FastAPI(
    title="Echo API",
    description="Backend API for Echo - The Whisper Widget (MLP Architecture)",
    version="1.0.0",
    lifespan=lifespan
)

@app.exception_handler(APIError)
async def postgrest_exception_handler(request: Request, exc: APIError):
    # M2: Never expose raw Postgres error details to the client in production
    logger.error(f"Postgrest Error: {exc.message}")
    detail = exc.message if settings.DEBUG else "The request could not be processed. Please try again."
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": detail},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    # Log the full exception but return a generic message to the client
    logger.exception(f"Unhandled Exception: {str(exc)}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred. Our team has been notified."}
    )

# CORS middleware with restricted origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# --- Routing Strategy ---
# We use /v1 prefix for all business routers to ensure future compatibility.

# 1. Public Routers
app.include_router(payments.router, prefix="/v1")

# 2. Protected Routers (Auth required)
auth_dep = [Depends(get_current_user)]

app.include_router(messages.router, prefix="/v1", dependencies=auth_dep)
app.include_router(users.router, prefix="/v1", dependencies=auth_dep)
app.include_router(friends.router, prefix="/v1", dependencies=auth_dep)
app.include_router(stories.router, prefix="/v1", dependencies=auth_dep)
app.include_router(soundboard.router, prefix="/v1", dependencies=auth_dep)
app.include_router(groups.router, prefix="/v1", dependencies=auth_dep)
app.include_router(voice_effects.router, prefix="/v1", dependencies=auth_dep)

@app.get("/")
async def root():
    return {"message": "Echo API is running smoothly", "version": "1.0.0", "docs": "/docs"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
