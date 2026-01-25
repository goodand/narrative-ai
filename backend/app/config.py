"""
Application Configuration
환경변수 및 설정 관리
"""

import os
from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # Server Configuration
    port: int = 8000

    # API Keys
    gemini_api_key: str = ""
    google_cloud_api_key: str = ""

    # Gemini API Configuration
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/models"
    gemini_story_model: str = "gemini-2.5-flash"
    gemini_suggestions_model: str = "gemini-2.5-flash"

    # Retry Configuration
    max_retries: int = 5
    initial_backoff: float = 1.0

    # CORS Configuration
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()

