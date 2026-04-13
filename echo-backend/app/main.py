from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routers import messages, users, friends, stories, soundboard, groups

app = FastAPI(
    title="Echo API",
    description="Backend API for Echo - The Whisper Widget (MLP Architecture)",
    version="1.0.0"
)

# TODO: Implement JWT authentication middleware
# For now, endpoints that require auth will handle it individually
# Global auth middleware can be added here later

# CORS middleware to allow mobile edge connections and local web mockup testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(messages.router)
app.include_router(users.router)
app.include_router(friends.router)
app.include_router(stories.router)
app.include_router(soundboard.router)
app.include_router(groups.router)

@app.get("/")
async def root():
    return {"message": "Echo API is running mượt mà"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
