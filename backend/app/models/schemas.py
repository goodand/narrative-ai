"""
Pydantic Schemas
API 요청/응답 스키마 정의
"""

from typing import Optional, Literal, Any, Union
from pydantic import BaseModel, Field


# ============== Request Schemas ==============

class GPSData(BaseModel):
    """GPS 좌표 데이터"""
    lat: Optional[float] = None
    lon: Optional[float] = None
    formatted: Optional[str] = None


class ImageMetadata(BaseModel):
    """이미지 메타데이터"""
    date: Optional[str] = None
    gps: Optional[Union[GPSData, dict, str]] = None  # 유연한 타입 허용
    location: Optional[str] = None
    location_address: Optional[str] = None  # 역지오코딩된 주소 저장 필드 추가

    class Config:
        extra = "allow"  # 추가 필드 허용


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
    metadata: Optional[Union[ImageMetadata, dict]] = Field(default_factory=dict)  # dict도 허용
    systemPrompt: Optional[str] = None

    class Config:
        extra = "allow"  # 추가 필드 허용


class NarrativeRequest(BaseModel):
    """POST /api/v1/narrative 요청 스키마"""
    image: str = Field(..., description="Base64 encoded image data")
    context: NarrativeContext


class SynonymsRequest(BaseModel):
    """POST /api/v1/synonyms 요청 스키마"""
    keywords: list[str] = Field(..., min_length=1, description="Keywords to find alternatives for")
    language: str = "Korean"


class DeleteRecommendationRequest(BaseModel):
    """POST /api/v1/delete-recommendation 요청 스키마"""
    image: str = Field(..., description="Base64 encoded image data")
    metadata: Optional[Union[ImageMetadata, dict]] = Field(default_factory=dict)
    filteringCriteria: Optional[list[Any]] = None
    language: str = "Korean"
    tone: str = "gentle"
    maxLength: int = 120


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


class DeleteRecommendationResponse(BaseModel):
    """POST /api/v1/delete-recommendation 응답 스키마"""
    reason: str
    shortReason: str
    usedCriteria: list[str]


class ErrorResponse(BaseModel):
    """에러 응답 스키마"""
    detail: str
    error_code: Optional[str] = None
