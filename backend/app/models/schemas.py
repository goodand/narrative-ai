"""
Pydantic Schemas
API 요청/응답 스키마 정의
"""

from typing import Optional, Literal
from pydantic import BaseModel, Field


# ============== Request Schemas ==============

class ImageMetadata(BaseModel):
    """이미지 메타데이터"""
    date: Optional[str] = None
    gps: Optional[str] = None
    location: Optional[str] = None


class NarrativeContext(BaseModel):
    """내러티브 생성 컨텍스트"""
    sns: Literal["Instagram", "Facebook", "Twitter", "Blog"] = "Instagram"
    mood: str = "Casual"
    temp: Literal["Cold", "Lukewarm", "Hot"] = "Lukewarm"
    language: str = "Korean"
    tags: Optional[str] = ""
    activity: Optional[str] = "Not specified"
    bodyState: Optional[str] = "Not specified"
    relationship: Optional[str] = "Not specified"
    metadata: ImageMetadata = Field(default_factory=ImageMetadata)
    systemPrompt: Optional[str] = None


class NarrativeRequest(BaseModel):
    """POST /api/v1/narrative 요청 스키마"""
    image: str = Field(..., description="Base64 encoded image data")
    context: NarrativeContext


class SynonymsRequest(BaseModel):
    """POST /api/v1/synonyms 요청 스키마"""
    keywords: list[str] = Field(..., min_length=1, description="Keywords to find alternatives for")
    language: str = "Korean"


# ============== Response Schemas ==============

class NarrativeResponse(BaseModel):
    """POST /api/v1/narrative 응답 스키마"""
    original_caption: str
    keywords: list[str]


class SynonymItem(BaseModel):
    """개별 키워드 유의어"""
    word: str
    alternatives: list[str]


class SynonymsResponse(BaseModel):
    """POST /api/v1/synonyms 응답 스키마"""
    suggestions: list[SynonymItem]


class ErrorResponse(BaseModel):
    """에러 응답 스키마"""
    detail: str
    error_code: Optional[str] = None
