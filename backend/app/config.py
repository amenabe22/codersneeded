from pydantic_settings import BaseSettings
from pydantic import Field
from typing import Optional
import os


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "sqlite:///./telegram_jobs.db"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # Telegram Bot
    TELEGRAM_BOT_TOKEN: str = "1386084322:AAFqtVW85NiouhfMb0z5p-fEjnJlu8_TO70"
    TELEGRAM_WEBAPP_URL: str = "https://your-domain.com"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-this"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # File Storage
    UPLOAD_DIR: str = "uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    
    # GCP Storage
    GCP_CREDENTIALS_PATH: str = Field(default="/Users/amenmohammed/Documents/projects/moyats_projects/moyats_agents/fuck-afri/credentials/creds.json", validation_alias="GCP_CREDENTIALS_PATH")
    GCP_BUCKET_NAME: str = Field(default="coders-needed-resumes")
    GCP_PROJECT_ID: str = Field(default="")
    
    # App
    DEBUG: bool = True
    CORS_ORIGINS: list = ["*"]  # Allow all origins for Telegram Mini App
    
    class Config:
        env_file = ".env"
        extra = "ignore"  # Ignore extra environment variables


settings = Settings()
