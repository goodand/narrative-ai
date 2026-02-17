"""
Narrative Router
/api/v1/narrative 엔드포인트
"""

import base64
import io
import json
import logging

import httpx
from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile
from PIL import Image, ImageOps

from ..models.schemas import NarrativeContext, NarrativeResponse, ErrorResponse
from ..services.gemini import GeminiService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1", tags=["narrative"])
MAX_IMAGE_EDGE = 2048
JPEG_QUALITY = 85


def _normalize_image_bytes(image_bytes: bytes) -> bytes:
    """
    Normalize uploaded image before sending to Gemini.
    - apply EXIF orientation
    - resize to max edge
    - convert to RGB JPEG
    """
    try:
        with Image.open(io.BytesIO(image_bytes)) as img:
            img = ImageOps.exif_transpose(img)
            img.thumbnail((MAX_IMAGE_EDGE, MAX_IMAGE_EDGE), Image.Resampling.LANCZOS)

            if img.mode in ("RGBA", "LA"):
                bg = Image.new("RGB", img.size, (255, 255, 255))
                bg.paste(img, mask=img.split()[-1])
                img = bg
            elif img.mode != "RGB":
                img = img.convert("RGB")

            out = io.BytesIO()
            img.save(out, format="JPEG", quality=JPEG_QUALITY, optimize=True)
            return out.getvalue()
    except Exception as e:
        raise ValueError(f"이미지 정규화 실패: {str(e)}")


@router.post(
    "/narrative",
    response_model=NarrativeResponse,
    responses={
        400: {"model": ErrorResponse, "description": "Bad Request"},
        500: {"model": ErrorResponse, "description": "Internal Server Error"}
    },
    summary="이미지 기반 스토리 생성",
    description="multipart/form-data로 이미지와 컨텍스트를 전송하여 AI 스토리를 생성합니다."
)
async def generate_narrative(
    request: Request,
    image: UploadFile = File(..., description="JPEG 이미지 파일"),
    context: str = Form(..., description="JSON 문자열로 인코딩된 생성 컨텍스트")
):
    """
    이미지 기반 내러티브 생성 API (multipart/form-data)

    - **image**: JPEG 이미지 파일 (바이너리)
    - **context**: JSON 문자열 (NarrativeContext 스키마)
    """
    try:
        # context JSON 파싱 및 검증
        try:
            context_obj = NarrativeContext(**json.loads(context))
        except (json.JSONDecodeError, Exception) as e:
            raise ValueError(f"context JSON 파싱 실패: {str(e)}")

        raw_image_bytes = await image.read()
        normalized_image_bytes = _normalize_image_bytes(raw_image_bytes)
        image_base64 = base64.b64encode(normalized_image_bytes).decode("utf-8")

        logger.info(f"Narrative request received - SNS: {context_obj.sns}, Language: {context_obj.language}")
        logger.info(
            f"Image size raw={len(raw_image_bytes)} bytes, normalized={len(normalized_image_bytes)} bytes, "
            f"base64 length={len(image_base64)}"
        )

        client = request.app.state.http_client
        gemini_service = GeminiService(client)

        result = await gemini_service.generate_story(
            image_base64=image_base64,
            context=context_obj
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
