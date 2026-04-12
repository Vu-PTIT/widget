from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import messages, users, friends, stories, soundboard

app = FastAPI(
    title="Echo API",
    description="Backend API for Echo - The Whisper Widget (MLP Architecture)",
    version="1.0.0"
)

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

@app.get("/")
async def root():
    return {"message": "Echo API is running mượt mà"}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
