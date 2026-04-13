from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_KEY: str = "your-anon-or-service-role-key"
    SUPABASE_SERVICE_KEY: str = "your-service-role-key"
    SUPABASE_JWT_SECRET: str = "your-jwt-secret"  # Từ Supabase Dashboard
    
    # Firebase Configuration (for FCM)
    FIREBASE_SERVICE_ACCOUNT_PATH: Optional[str] = None
    
    # App Settings
    APP_NAME: str = "Echo Backend"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str = "super-secret-key-change-me"
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
