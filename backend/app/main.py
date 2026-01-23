"""
FastAPI Application Entry Point
RECOCO Backend API 진입점
"""

from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import narrative, synonyms


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    HTTP 클라이언트 수명주기 관리
    """
    # Startup: Create HTTP client
    app.state.http_client = httpx.AsyncClient(timeout=60.0)
    print("🚀 RECOCO Backend API started")

    yield

    # Shutdown: Close HTTP client
    await app.state.http_client.aclose()
    print("👋 RECOCO Backend API shutdown")


# Create FastAPI application
app = FastAPI(
    title="RECOCO API",
    description="RECOCO - AI 스토리텔링 서비스 백엔드 API",
    version="0.5.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=True  # /api/v1/narrative/ -> /api/v1/narrative 자동 리다이렉트
)

# Configure CORS
settings = get_settings()
# 허용할 도메인 목록 명시 (Render 배포 도메인 포함)
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://recoco.onrender.com",  # 예시: 실제 프론트엔드 도메인으로 교체 필요
    "*"  # 모든 도메인 허용 (테스트용, 보안을 위해 나중에 특정 도메인만 지정 권장)
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],  # OPTIONS 명시적 허용
    allow_headers=["*"],
)

# Register routers
app.include_router(narrative.router)
app.include_router(synonyms.router)


@app.get("/", tags=["health"])
async def root():
    """API Health Check"""
    return {
        "service": "RECOCO API",
        "status": "healthy",
        "version": "0.5.0"
    }


@app.get("/health", tags=["health"])
async def health_check():
    """Detailed Health Check"""
    return {
        "status": "healthy",
        "api_key_configured": bool(settings.gemini_api_key),
        "model": settings.gemini_story_model
    }
