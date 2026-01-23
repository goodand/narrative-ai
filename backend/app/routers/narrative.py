"""
Narrative Router
/api/v1/narrative 엔드포인트
"""

from fastapi import APIRouter, HTTPException, Request

from ..models.schemas import NarrativeRequest, NarrativeResponse, ErrorResponse
from ..services.gemini import GeminiService

router = APIRouter(prefix="/api/v1", tags=["narrative"])


@router.post(
    "/narrative",
    response_model=NarrativeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    },
    summary="이미지 기반 스토리 생성",
    description="업로드된 이미지와 컨텍스트를 기반으로 AI 스토리를 생성합니다."
)
async def generate_narrative(request: Request, body: NarrativeRequest):
    """
    이미지 기반 내러티브 생성 API

    - **image**: Base64 인코딩된 이미지 데이터
    - **context**: 생성 컨텍스트 (SNS 플랫폼, 분위기, 감정 온도 등)
    """
    try:
        # Get HTTP client from app state
        client = request.app.state.http_client
        gemini_service = GeminiService(client)

        result = await gemini_service.generate_story(
            image_base64=body.image,
            context=body.context
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스토리 생성 중 오류가 발생했습니다: {str(e)}")
