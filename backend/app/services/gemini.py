"""
Gemini API Service
Google Gemini API 통신 담당
"""

import asyncio
import json
import logging
import random
import httpx
from typing import Optional

from ..config import get_settings
from ..models.schemas import NarrativeContext, NarrativeResponse, SynonymsResponse, SynonymItem, DeleteRecommendationResponse, BatchDeleteRecommendationResponse
from ..utils.prompts import build_story_prompt, build_synonyms_prompt, DEFAULT_SYSTEM_PROMPT
from .geocoding import get_address_from_coords

logger = logging.getLogger(__name__)


class GeminiService:
    """Gemini API 서비스 클래스"""

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.settings = get_settings()

    def _get_gemini_api_keys(self) -> list[str]:
        """
        Gemini API keys in failover order.
        Priority:
        1) GEMINI_API_KEYS (comma-separated)
        2) GEMINI_API_KEY -> GEMINI_API_KEY_SUB -> GEMINI_API_KEY_INSU
        """
        keys: list[str] = []

        if self.settings.gemini_api_keys:
            keys.extend([k.strip() for k in self.settings.gemini_api_keys.split(",") if k.strip()])

        for key in [
            self.settings.gemini_api_key,
            self.settings.gemini_api_key_sub,
            self.settings.gemini_api_key_insu,
            self.settings.google_cloud_api_key,
        ]:
            if key and key not in keys:
                keys.append(key)

        return keys

    @staticmethod
    def _is_quota_or_rate_limit_error(status_code: int, error_body: str) -> bool:
        if status_code == 429:
            return True
        if status_code in (400, 403):
            body = (error_body or "").lower()
            markers = [
                "quota",
                "resource_exhausted",
                "rate limit",
                "too many requests",
                "exceeded",
            ]
            return any(m in body for m in markers)
        return False

    @staticmethod
    def _extract_gps(metadata) -> tuple:
        """metadata에서 GPS 좌표(lat, lon)를 추출. 없으면 (None, None) 반환."""
        if not metadata:
            return None, None

        gps_data = metadata.get("gps") if isinstance(metadata, dict) else getattr(metadata, "gps", None)
        if not gps_data:
            return None, None

        # 문자열 → dict 변환 시도
        if isinstance(gps_data, str):
            try:
                gps_data = json.loads(gps_data)
            except (json.JSONDecodeError, ValueError):
                return None, None

        # dict 또는 Pydantic 모델에서 lat/lon 추출
        if isinstance(gps_data, dict):
            lat, lon = gps_data.get("lat"), gps_data.get("lon")
        else:
            lat, lon = getattr(gps_data, "lat", None), getattr(gps_data, "lon", None)

        return lat, lon

    async def _fetch_with_retry(
        self,
        url: str,
        payload: dict,
        max_retries: Optional[int] = None,
        initial_backoff: Optional[float] = None
    ) -> dict:
        """
        지수 백오프 방식의 재시도 로직이 포함된 API 호출
        """
        max_retries = max_retries or self.settings.max_retries
        initial_backoff = initial_backoff or self.settings.initial_backoff

        last_error = None

        for attempt in range(max_retries):
            try:
                response = await self.client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                    timeout=60.0
                )
                response.raise_for_status()
                return response.json()

            except httpx.HTTPStatusError as e:
                last_error = e
                error_body = e.response.text[:500] if e.response.text else "No body"
                logger.error(f"HTTP {e.response.status_code} error: {error_body}")

                # Quota/rate-limit errors should bubble up quickly so caller can switch to next API key.
                if self._is_quota_or_rate_limit_error(e.response.status_code, error_body):
                    raise
                elif e.response.status_code >= 500:
                    # Server error - retry with backoff (with jitter)
                    wait_time = initial_backoff * (2 ** attempt) * (0.5 + random.random())
                    logger.warning(f"Server error. Waiting {wait_time:.1f}s before retry {attempt + 1}")
                    await asyncio.sleep(wait_time)
                else:
                    raise

            except httpx.RequestError as e:
                last_error = e
                wait_time = initial_backoff * (2 ** attempt)
                await asyncio.sleep(wait_time)

        raise last_error or Exception("Max retries exceeded")

    async def _fetch_with_key_failover(
        self,
        model: str,
        payload: dict,
        max_retries: Optional[int] = None,
        initial_backoff: Optional[float] = None,
    ) -> dict:
        keys = self._get_gemini_api_keys()
        if not keys:
            raise ValueError("Gemini API key is not configured.")

        last_error = None
        for idx, key in enumerate(keys, start=1):
            url = f"{self.settings.gemini_base_url}/{model}:generateContent?key={key}"
            try:
                if idx > 1:
                    logger.warning(f"Trying fallback Gemini key #{idx}")
                return await self._fetch_with_retry(
                    url,
                    payload,
                    max_retries=max_retries,
                    initial_backoff=initial_backoff,
                )
            except httpx.HTTPStatusError as e:
                last_error = e
                body = e.response.text[:500] if e.response and e.response.text else ""
                if self._is_quota_or_rate_limit_error(e.response.status_code, body) and idx < len(keys):
                    logger.warning(
                        f"Gemini key #{idx} exhausted/rate-limited (HTTP {e.response.status_code}). Switching key."
                    )
                    continue
                raise
            except Exception as e:
                last_error = e
                if idx < len(keys):
                    logger.warning(f"Gemini key #{idx} failed ({type(e).__name__}). Switching key.")
                    continue
                raise

        raise last_error or Exception("All Gemini API keys failed")

    async def generate_story(
        self,
        image_base64: str,
        context: NarrativeContext
    ) -> NarrativeResponse:
        """
        이미지 기반 스토리 생성
        """
        # Geocoding 처리 (위도/경도 -> 주소 변환)
        lat, lon = self._extract_gps(context.metadata)
        if lat is not None and lon is not None:
            try:
                address = await get_address_from_coords(self.client, lat, lon)
                if address:
                    logger.info(f"Address resolved: {address}")
                    if isinstance(context.metadata, dict):
                        context.metadata["location_address"] = address
                    else:
                        setattr(context.metadata, "location_address", address)
                else:
                    logger.warning(f"Geocoding returned empty for {lat}, {lon}")
            except Exception as e:
                logger.error(f"Failed to resolve address: {e}", exc_info=True)

        prompt = build_story_prompt(context)
        system_prompt = context.systemPrompt or DEFAULT_SYSTEM_PROMPT

        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inlineData": {"mimeType": "image/jpeg", "data": image_base64}}
                ]
            }],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "original_caption": {
                            "type": "string",
                            "description": "The generated story caption"
                        },
                        "keywords": {
                            "type": "array",
                            "items": {"type": "string"},
                            "description": "2-3 key emotional words from the caption"
                        }
                    },
                    "required": ["original_caption", "keywords"]
                },
                "temperature": 0.9,
                "topP": 0.85
            }
        }

        data = await self._fetch_with_key_failover(
            self.settings.gemini_story_model,
            payload
        )
        return self._parse_story_response(data)

    async def get_synonyms(
        self,
        keywords: list[str],
        language: str
    ) -> SynonymsResponse:
        """
        키워드 유의어 추천
        """
        # Rate limit prevention (잠시 대기 시간을 0.5초로 단축)
        await asyncio.sleep(0.5)

        prompt = build_synonyms_prompt(keywords, language)

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "suggestions": {
                            "type": "array",
                            "items": {
                                "type": "object",
                                "properties": {
                                    "word": {"type": "string"},
                                    "alternatives": {
                                        "type": "array",
                                        "items": {"type": "string"}
                                    }
                                },
                                "required": ["word", "alternatives"]
                            }
                        }
                    },
                    "required": ["suggestions"]
                },
                "temperature": 0.8,
                "topP": 0.95
            }
        }

        try:
            data = await self._fetch_with_key_failover(
                self.settings.gemini_suggestions_model,
                payload,
                max_retries=3
            )
            return self._parse_synonyms_response(data, keywords)
        except Exception as e:
            # Fallback: return empty suggestions
            return SynonymsResponse(
                suggestions=[SynonymItem(word=w, alternatives=[]) for w in keywords]
            )

    def _parse_story_response(self, data: dict) -> NarrativeResponse:
        """스토리 응답 파싱"""
        logger.info(f"Gemini API raw response keys: {data.keys()}")

        # 안전성 필터 차단 확인
        if "promptFeedback" in data:
            feedback = data["promptFeedback"]
            logger.warning(f"Prompt feedback: {feedback}")
            if feedback.get("blockReason"):
                raise ValueError(f"콘텐츠가 안전성 필터에 의해 차단되었습니다: {feedback.get('blockReason')}")

        # candidates 확인
        if not data.get("candidates") or len(data["candidates"]) == 0:
            logger.error(f"No candidates in response. Full response: {json.dumps(data, indent=2, ensure_ascii=False)[:1000]}")
            raise ValueError("AI 응답이 없습니다. 다시 시도해주세요.")

        candidate = data["candidates"][0]

        # finishReason 확인
        finish_reason = candidate.get("finishReason")
        if finish_reason and finish_reason != "STOP":
            logger.warning(f"Unexpected finish reason: {finish_reason}")
            if finish_reason == "SAFETY":
                raise ValueError("콘텐츠가 안전성 정책에 의해 차단되었습니다.")
            elif finish_reason == "RECITATION":
                raise ValueError("응답이 인용 정책에 의해 차단되었습니다.")

        result_text = candidate.get("content", {}).get("parts", [{}])[0].get("text")

        if not result_text:
            logger.error(f"No text in candidate. Candidate: {json.dumps(candidate, indent=2, ensure_ascii=False)[:500]}")
            raise ValueError("AI 응답 형식이 올바르지 않습니다.")

        logger.info(f"Gemini response text (first 200 chars): {result_text[:200]}")

        # Clean JSON markdown wrapper
        cleaned_text = result_text.replace("```json", "").replace("```", "").strip()

        try:
            parsed = json.loads(cleaned_text)
            return NarrativeResponse(
                original_caption=parsed.get("original_caption", ""),
                keywords=parsed.get("keywords", [])
            )
        except json.JSONDecodeError as e:
            logger.error(f"JSON parse error. Text: {cleaned_text[:500]}")
            raise ValueError(f"AI 응답을 처리하는 중 오류가 발생했습니다. (JSON 형식 불일치): {e}")

    def _parse_synonyms_response(self, data: dict, original_keywords: list[str]) -> SynonymsResponse:
        """유의어 응답 파싱"""
        try:
            result_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned_text = result_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(cleaned_text)

            return SynonymsResponse(
                suggestions=[
                    SynonymItem(
                        word=item.get("word", ""),
                        alternatives=item.get("alternatives", [])
                    )
                    for item in parsed.get("suggestions", [])
                ]
            )
        except (KeyError, json.JSONDecodeError):
            return SynonymsResponse(
                suggestions=[SynonymItem(word=w, alternatives=[]) for w in original_keywords]
            )

    async def generate_delete_recommendation(
        self,
        image_base64: str,
        metadata: dict,
        filtering_criteria: list,
        language: str,
        tone: str,
        max_length: int
    ) -> DeleteRecommendationResponse:
        await asyncio.sleep(0.5)

        # Build prompt
        criteria_str = ", ".join([str(c) for c in filtering_criteria]) if filtering_criteria else "분석 결과"
        prompt = (f"사용자가 사진첩 정리를 위해 사진을 삭제하려고 합니다. "
                  f"주어진 사진과 기준({criteria_str})을 보고, 이 사진을 비우면(삭제하면) 좋은 이유를 "
                  f"매우 간결하고 부드러운 어조({tone})로 {language}로 ⚠️딱 한 문장(1 sentence)⚠️으로만 작성해주세요. "
                  f"길이는 {max_length}자 이내여야 합니다. 불필요한 부연 설명은 빼주세요.")
        
        system_prompt = "너는 디지털 미니멀리즘을 도와주는 친절한 어시스턴트 리코코야. 사용자의 추억 비우기 과정을 죄책감 들지 않고 기분 좋게 격려해야 해."

        logger.info(f"--- [GEMINI-TRACE] Single Delete Recommendation ---")
        logger.info(f"Criteria: {criteria_str}")
        logger.info(f"Target Prompt: {prompt}")

        payload = {
            "contents": [{
                "parts": [
                    {"text": prompt},
                    {"inlineData": {"mimeType": "image/jpeg", "data": image_base64}}
                ]
            }],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "reason": {
                            "type": "string",
                            "description": "Full gentle reason for deletion"
                        },
                        "shortReason": {
                            "type": "string",
                            "description": "Very short 2-3 word summary"
                        },
                        "usedCriteria": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    },
                    "required": ["reason", "shortReason", "usedCriteria"]
                },
                "temperature": 0.7,
                "topP": 0.90
            }
        }

        try:
            data = await self._fetch_with_key_failover(
                self.settings.gemini_story_model,
                payload
            )
            return self._parse_delete_recommendation_response(data)
        except Exception as e:
            logger.error(f"Failed to generate delete recommendation: {e}")
            return DeleteRecommendationResponse(
                reason="오늘 비워내기 좋은 기록입니다.",
                shortReason="정리 추천",
                usedCriteria=[]
            )

    async def generate_batch_delete_recommendation(
        self,
        images_base64: list[str],
        metadatas: Optional[list[dict]],
        filtering_criteria_list: Optional[list[list]],
        language: str,
        tone: str,
        max_length: int
    ) -> BatchDeleteRecommendationResponse:
        """
        여러 장의 사진을 동시에 분석하여 비교 우위 기반의 삭제 추천 사유 생성
        """
        await asyncio.sleep(0.5)

        num_images = len(images_base64)
        
        # Build comparative prompt for a warm, friendly batch reason
        prompt = (
            f"제시된 {num_images}장의 사진들은 현재 사진첩 정리를 위해 선정된 기록들입니다.\n"
            f"이 사진들을 분석하여, 사용자가 이 사진들을 비워내도(삭제해도) 괜찮은 공통된 이유를 "
            f"매우 부드러운 어조({tone})로 {language}로 ⚠️딱 한 문장(1 sentence)⚠️으로만 작성해주세요.\n"
            f"사진의 시각적 느낌이나 담긴 내용의 맥락을 살펴보고, 사용자가 기분 좋게 비울 수 있도록 격려하는 이유여야 합니다.\n"
            f"길이는 {max_length}자 이내여야 하며, 결과는 'commonReason' 필드에 담아 JSON으로 반환해주세요."
        )
        
        system_prompt = "너는 디지털 미니멀리즘을 도와주는 친절한 어시스턴트 리코코야. 사용자의 추억 비우기 과정을 죄책감 들지 않고 기분 좋게 격려해야 해. 전문가적인 차가운 분석보다는 친구 같은 따뜻한 조언을 해줘."

        logger.info(f"--- [GEMINI-TRACE] Hybrid Batch Analysis ({num_images} images) ---")
        logger.info(f"Hybrid Prompt: {prompt}")

        parts = [{"text": prompt}]
        for i, img in enumerate(images_base64):
            parts.append({"text": f"--- Photo {i+1} ---"})
            parts.append({"inlineData": {"mimeType": "image/jpeg", "data": img}})

        payload = {
            "contents": [{"parts": parts}],
            "systemInstruction": {"parts": [{"text": system_prompt}]},
            "generationConfig": {
                "responseMimeType": "application/json",
                "responseSchema": {
                    "type": "object",
                    "properties": {
                        "commonReason": {"type": "string"},
                        "shortReason": {"type": "string"}
                    },
                    "required": ["commonReason", "shortReason"]
                },
                "temperature": 0.4,
                "topP": 0.90
            }
        }

        try:
            data = await self._fetch_with_key_failover(self.settings.gemini_story_model, payload)
            return self._parse_hybrid_batch_response(data, num_images)
        except Exception as e:
            logger.error(f"Failed to generate hybrid batch recommendation: {e}")
            fallback_items = [
                DeleteRecommendationResponse(reason="정리하기 좋은 기록입니다.", shortReason="정리 추천", usedCriteria=[])
                for _ in range(num_images)
            ]
            return BatchDeleteRecommendationResponse(recommendations=fallback_items)

    def _parse_hybrid_batch_response(self, data: dict, expected_count: int) -> BatchDeleteRecommendationResponse:
        try:
            result_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned_text = result_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(cleaned_text)
            
            common_reason = parsed.get("commonReason", "정리하기 좋은 기록입니다.")
            short_reason = parsed.get("shortReason", "정리 추천")
            
            recs = [
                DeleteRecommendationResponse(
                    reason=common_reason,
                    shortReason=short_reason,
                    usedCriteria=[]
                ) for _ in range(expected_count)
            ]
                
            return BatchDeleteRecommendationResponse(recommendations=recs)
        except Exception as e:
            logger.error(f"Hybrid batch parse error: {e}")
            fallback_items = [
                DeleteRecommendationResponse(reason="정리하기 좋은 기록입니다.", shortReason="정리 추천", usedCriteria=[])
                for _ in range(expected_count)
            ]
            return BatchDeleteRecommendationResponse(recommendations=fallback_items)

    def _parse_delete_recommendation_response(self, data: dict) -> DeleteRecommendationResponse:

        try:
            result_text = data["candidates"][0]["content"]["parts"][0]["text"]
            cleaned_text = result_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(cleaned_text)
            return DeleteRecommendationResponse(
                reason=parsed.get("reason", "오늘 비워내기 좋은 기록입니다."),
                shortReason=parsed.get("shortReason", "정리 추천"),
                usedCriteria=parsed.get("usedCriteria", [])
            )
        except (KeyError, IndexError, json.JSONDecodeError):
            return DeleteRecommendationResponse(
                reason="오늘 비워내기 좋은 기록입니다.",
                shortReason="정리 추천",
                usedCriteria=[]
            )
