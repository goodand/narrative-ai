"""
Gemini API Service
Google Gemini API 통신 담당
"""

import asyncio
import json
import httpx
from typing import Optional

from ..config import get_settings, DEFAULT_SYSTEM_PROMPT
from ..models.schemas import NarrativeContext, NarrativeResponse, SynonymsResponse, SynonymItem
from ..utils.prompts import build_story_prompt, build_synonyms_prompt


class GeminiService:
    """Gemini API 서비스 클래스"""

    def __init__(self, client: httpx.AsyncClient):
        self.client = client
        self.settings = get_settings()

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
                if e.response.status_code == 429:
                    # Rate limit - wait longer
                    wait_time = initial_backoff * (2 ** attempt) * 2
                    await asyncio.sleep(wait_time)
                elif e.response.status_code >= 500:
                    # Server error - retry with backoff
                    wait_time = initial_backoff * (2 ** attempt)
                    await asyncio.sleep(wait_time)
                else:
                    raise

            except httpx.RequestError as e:
                last_error = e
                wait_time = initial_backoff * (2 ** attempt)
                await asyncio.sleep(wait_time)

        raise last_error or Exception("Max retries exceeded")

    async def generate_story(
        self,
        image_base64: str,
        context: NarrativeContext
    ) -> NarrativeResponse:
        """
        이미지 기반 스토리 생성
        """
        prompt = build_story_prompt(context)
        system_prompt = context.systemPrompt or DEFAULT_SYSTEM_PROMPT

        url = f"{self.settings.gemini_base_url}/{self.settings.gemini_story_model}:generateContent?key={self.settings.gemini_api_key}"

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

        data = await self._fetch_with_retry(url, payload)
        return self._parse_story_response(data)

    async def get_synonyms(
        self,
        keywords: list[str],
        language: str
    ) -> SynonymsResponse:
        """
        키워드 유의어 추천
        """
        # Rate limit prevention
        await asyncio.sleep(1.0)

        prompt = build_synonyms_prompt(keywords, language)

        url = f"{self.settings.gemini_base_url}/{self.settings.gemini_suggestions_model}:generateContent?key={self.settings.gemini_api_key}"

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
                "temperature": 1.2,
                "topP": 0.95
            }
        }

        try:
            data = await self._fetch_with_retry(url, payload, max_retries=3)
            return self._parse_synonyms_response(data, keywords)
        except Exception as e:
            # Fallback: return empty suggestions
            return SynonymsResponse(
                suggestions=[SynonymItem(word=w, alternatives=[]) for w in keywords]
            )

    def _parse_story_response(self, data: dict) -> NarrativeResponse:
        """스토리 응답 파싱"""
        if not data.get("candidates") or len(data["candidates"]) == 0:
            raise ValueError("AI 응답이 없습니다. 다시 시도해주세요.")

        result_text = data["candidates"][0].get("content", {}).get("parts", [{}])[0].get("text")

        if not result_text:
            raise ValueError("AI 응답 형식이 올바르지 않습니다.")

        # Clean JSON markdown wrapper
        cleaned_text = result_text.replace("```json", "").replace("```", "").strip()

        try:
            parsed = json.loads(cleaned_text)
            return NarrativeResponse(
                original_caption=parsed.get("original_caption", ""),
                keywords=parsed.get("keywords", [])
            )
        except json.JSONDecodeError as e:
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
