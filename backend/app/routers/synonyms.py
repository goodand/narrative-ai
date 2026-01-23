"""
Synonyms Router
/api/v1/synonyms 엔드포인트
"""

import httpx
from fastapi import APIRouter, HTTPException, Request

from ..models.schemas import SynonymsRequest, SynonymsResponse, ErrorResponse
from ..services.gemini import GeminiService

router = APIRouter(prefix="/api/v1", tags=["synonyms"])


@router.post(
    "/synonyms",
    response_model=SynonymsResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    },
    summary="키워드 유의어 추천",
    description="주어진 키워드들에 대한 창의적인 유의어/대체 표현을 추천합니다."
)
@router.post("/synonyms/") # 슬래시 있는 버전 추가
async def get_synonyms(request: Request, body: SynonymsRequest):
    """
    키워드 유의어 추천 API

    - **keywords**: 유의어를 찾을 키워드 리스트
    - **language**: 응답 언어 (기본: Korean)
    """
    try:
        # Get HTTP client from app state
        client = request.app.state.http_client
        gemini_service = GeminiService(client)

        result = await gemini_service.get_synonyms(
            keywords=body.keywords,
            language=body.language
        )

        return result

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except httpx.HTTPStatusError as e:
        status_code = e.response.status_code
        raise HTTPException(status_code=status_code, detail=f"유의어 추천 서비스 오류 ({status_code})")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"유의어 추천 중 오류가 발생했습니다: {str(e)}")
