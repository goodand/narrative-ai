"""
Narrative Router
/api/v1/narrative 엔드포인트
"""

import logging
import httpx
from fastapi import APIRouter, HTTPException, Request

from ..models.schemas import NarrativeRequest, NarrativeResponse, ErrorResponse
from ..services.gemini import GeminiService

logger = logging.getLogger(__name__)
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
        logger.info(f"Narrative request received - SNS: {body.context.sns}, Language: {body.context.language}")
        logger.info(f"Image data length: {len(body.image)}, first 50 chars: {body.image[:50]}")

        # Get HTTP client from app state
        client = request.app.state.http_client
        gemini_service = GeminiService(client)

        result = await gemini_service.generate_story(
            image_base64=body.image,
            context=body.context
        )

        logger.info(f"Narrative generated successfully - Keywords: {result.keywords}")
        return result

    except ValueError as e:
        logger.warning(f"Narrative generation failed (ValueError): {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except httpx.HTTPStatusError as e:
        status_code = e.response.status_code
        error_detail = f"AI 서비스 할당량 초과 또는 오류가 발생했습니다 ({status_code}). 잠시 후 다시 시도해주세요."
        if status_code == 429:
            logger.warning(f"Gemini API Rate Limit reached: {e}")
            raise HTTPException(status_code=429, detail=error_detail)
        logger.error(f"Gemini API HTTP Error {status_code}: {e}")
        raise HTTPException(status_code=status_code, detail=error_detail)
    except Exception as e:
        logger.error(f"Narrative generation failed (Exception): {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"스토리 생성 중 오류가 발생했습니다: {str(e)}")
