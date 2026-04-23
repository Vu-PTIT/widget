from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    # Supabase Configuration
    SUPABASE_URL: str = "https://your-project.supabase.co"
    SUPABASE_KEY: str = "your-anon-or-service-role-key"
    SUPABASE_SERVICE_KEY: str = "your-service-role-key"
    SUPABASE_JWT_SECRET: str = "your-jwt-secret"  # Từ Supabase Dashboard

    # App Settings
    APP_NAME: str = "Echo Backend"
    DEBUG: bool = False
    
    # Security
    # Defaults for development, MUST be set in .env for production
    SECRET_KEY: str = "dev-secret-key-replace-me-in-production"
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"] # Default for local development
    
    # RevenueCat
    REVENUECAT_WEBHOOK_AUTH_KEY: str = "rc_webhook_auth_key_placeholder"

    model_config = SettingsConfigDict(
        env_file=".env", 
        env_file_encoding="utf-8",
        extra="ignore" # Ignore extra env vars
    )

settings = Settings()
