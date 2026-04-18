"""
FastAPI Application Entry Point
RECOCO Backend API 진입점
"""

from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .routers import narrative, synonyms, geo, account

APP_VERSION = "0.6.0"


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
    version=APP_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    redirect_slashes=True  # /api/v1/narrative/ -> /api/v1/narrative 자동 리다이렉트
)

# Configure CORS
settings = get_settings()
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://narrative-ai-5p8q.onrender.com",
    "https://recoco.onrender.com",
    "capacitor://localhost",
    "ionic://localhost",
    "com.narrativeai.appv://localhost",  # Capacitor iOS custom scheme
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(narrative.router)
app.include_router(synonyms.router)
app.include_router(geo.router)
app.include_router(account.router)


@app.get("/", tags=["health"])
async def root():
    """API Health Check"""
    return {
        "service": "RECOCO API",
        "status": "healthy",
        "version": app.version
    }


@app.get("/health", tags=["health"])
async def health_check():
    """환경에 따라 상세도를 조절하는 진단 엔드포인트."""
    settings = get_settings()
    payload = {
        "status": "ok",
        "version": app.version,
    }

    if not settings.detailed_health:
        return payload

    payload.update({
        "gemini_keys_configured": len(settings.gemini_failover_keys),
        "active_models": {
            "story": settings.gemini_story_model,
            "suggestions": settings.gemini_suggestions_model,
            "batch": settings.gemini_batch_model
        },
        "performance_constraints": {
            "batch_timeout": settings.batch_timeout,
            "batch_max_retries": settings.batch_max_retries
        },
        "network": {
            "allow_lan": settings.allow_lan,
            "port": settings.port
        }
    })
    return payload
