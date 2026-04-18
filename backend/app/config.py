"""
Application Configuration
환경변수 및 설정 관리
"""

import os
from pathlib import Path
from functools import lru_cache
from pydantic import Field, AliasChoices
from pydantic_settings import BaseSettings, SettingsConfigDict


# 경로 정의 (User Critique 반영: 소유권 정리)
# ROOT: /.../narrative-ai/
# BACKEND: /.../narrative-ai/backend/
BACKEND = Path(__file__).resolve().parents[1]
ROOT = BACKEND.parent


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    model_config = SettingsConfigDict(
        # 1. ROOT .env 우선, BACKEND .env 보완 (User Strategy #1)
        env_file=(ROOT / ".env", BACKEND / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Server Configuration
    port: int = 8000
    allow_lan: bool = Field(default=False, validation_alias="ALLOW_LAN")

    # API Keys & Failover Chain
    gemini_api_key: str = ""
    narrative_ai_limit_key: str = ""  # User's custom limit key
    gemini_api_key_sub: str = ""
    gemini_api_key_insu: str = ""
    google_cloud_api_key: str = ""
    gemini_api_keys: str = ""  # optional comma-separated key list

    # Supabase Configuration (Refined boundary)
    supabase_url: str = Field(
        default="",
        validation_alias=AliasChoices("SUPABASE_URL", "VITE_SUPABASE_URL"),
    )
    service_role_key: str = ""

    # Gemini API Configuration
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/models"
    gemini_story_model: str = "gemini-2.5-flash"
    gemini_suggestions_model: str = "gemini-2.5-flash-lite" # Suggestions용 Lite 모델 분리 적용
    gemini_batch_model: str = "gemini-2.5-flash-lite" # [교정] 배치 분석 전용 경량 모델 (User Strategy #1)

    # Retry & Timeout Configuration (User Critique High Priorities)
    max_retries: int = 5
    initial_backoff: float = 1.0
    batch_max_retries: int = 1
    batch_timeout: float = 20.0

    # CORS Configuration
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    @property
    def gemini_failover_keys(self) -> list[str]:
        """
        Gemini API keys in a structured failover hierarchy. (User Strategy #5)
        Statelessly consumed by GeminiService.
        """
        keys = []
        # Priority order as per expert critique
        candidate_keys = [
            self.gemini_api_key,
            self.narrative_ai_limit_key,
            self.gemini_api_key_sub,
            self.gemini_api_key_insu,
            self.google_cloud_api_key,
        ]

        # 쉼표 구분 리스트 처리
        if self.gemini_api_keys:
            keys.extend([k.strip() for k in self.gemini_api_keys.split(",") if k.strip()])

        for key in candidate_keys:
            if key and key not in keys:
                keys.append(key)
        return keys

@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
