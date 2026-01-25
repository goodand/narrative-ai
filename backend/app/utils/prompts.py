"""
Prompt Templates & Builder
데이터 전처리(Data), 템플릿 관리(View), 응답 파싱(Parser) 분리 전략 적용
"""

import json
from typing import Any, List, Optional
from ..models.schemas import NarrativeContext

# --- 1. Schema Definitions (Schema Enforcement) ---
# LLM 출력 형식을 상수로 정의하여 프롬프트에 주입하고 관리
STORY_OUTPUT_SCHEMA = {
    "original_caption": "caption text here",
    "keywords": ["word1", "word2", "word3"]
}

SYNONYMS_OUTPUT_SCHEMA = {
    "suggestions": [
        {
            "word": "original",
            "alternatives": ["alt1", "alt2", "alt3"]
        }
    ]
}

# --- 2. Template Definitions (Template Injection) ---
# 프롬프트 템플릿을 로직과 분리하여 상수로 관리
DEFAULT_SYSTEM_PROMPT = """You are RECOCO, a professional storyteller.
Help users tell stories using image metadata.
Use emojis and platform-appropriate tone.
Be creative, emotional, and engaging."""

STORY_PROMPT_TEMPLATE = """
Role: Professional Storyteller (Service Name: RECOCO).
Task: Create a compelling story based on the image metadata and visual context.

Context:
{context_str}

Length Constraint: Keep the caption CONCISE - around 2-3 sentences maximum. Be brief and impactful.
Output Requirement: Identify 2-3 key emotional words that appear EXACTLY in the generated caption (must be exact substrings).
Format: JSON only.
Expected Output Schema:
{output_schema}
"""

SYNONYMS_PROMPT_TEMPLATE = """
Generate 3-4 creative synonyms or alternative expressions for each word.
Language: {language}
Words: {words_json}
Be creative and suggest expressive alternatives.
Format: JSON only.
Expected Output Schema:
{output_schema}
"""

# --- 3. Context Builder (Context Mapping) ---
class ContextBuilder:
    """
    복잡한 컨텍스트 생성 로직을 캡슐화한 빌더 클래스
    """
    
    @staticmethod
    def _get_clean_metadata_dict(metadata: Any) -> dict:
        """메타데이터 객체/딕셔너리를 순수한 dict로 변환 및 정리"""
        if metadata is None:
            return {}
            
        data = {}
        if hasattr(metadata, 'model_dump'):
            data = metadata.model_dump()
        elif isinstance(metadata, dict):
            data = metadata.copy()
            
        # 불필요하거나 별도로 처리된 필드 제거
        data.pop("location_address", None)
        if "gps" in data:
            del data["gps"]
            
        return data

    @staticmethod
    def _extract_location(metadata: Any) -> Optional[str]:
        """메타데이터에서 위치 정보 추출"""
        if metadata is None:
            return None
        if isinstance(metadata, dict):
            return metadata.get("location_address")
        return getattr(metadata, "location_address", None)

    @staticmethod
    def build_story_context(context: NarrativeContext) -> str:
        """
        NarrativeContext 객체를 분석하여 프롬프트에 주입할 포맷팅된 문자열 생성
        if-else 구조를 데이터 매핑 방식으로 개선
        """
        # 1. 필수 항목 (Base Context)
        lines = [
            f"- Platform: {context.sns}",
            f"- Mood: {context.mood}",
            f"- Emotion Temperature: {context.temp}",
            f"- Language: {context.language}",
        ]

        # 2. 선택적 항목 (Optional Fields)
        # (Label, ValueGetter) 튜플 리스트로 관리하여 확장성 확보
        optional_fields = [
            ("Location", ContextBuilder._extract_location(context.metadata)),
            ("User Tags", context.tags),
            ("Activity", context.activity),
            ("Body State", context.bodyState),
            ("Relationship State", context.relationship),
        ]

        for label, value in optional_fields:
            if value and str(value).strip() and str(value) != "Not specified":
                lines.append(f"- {label}: {value}")

        # 3. 기타 메타데이터 (Raw Metadata)
        metadata_dict = ContextBuilder._get_clean_metadata_dict(context.metadata)
        if metadata_dict:
            metadata_str = json.dumps(metadata_dict, default=str, ensure_ascii=False)
            lines.append(f"- Metadata: {metadata_str}")

        return "\n  ".join(lines)


# --- Public Interface ---

def build_story_prompt(context: NarrativeContext) -> str:
    """
    스토리 생성 프롬프트 빌드
    """
    context_str = ContextBuilder.build_story_context(context)
    schema_str = json.dumps(STORY_OUTPUT_SCHEMA, ensure_ascii=False)

    return STORY_PROMPT_TEMPLATE.strip().format(
        context_str=context_str,
        output_schema=schema_str
    )

def build_synonyms_prompt(keywords: List[str], language: str) -> str:
    """
    유의어 추천 프롬프트 빌드
    """
    words_json = json.dumps(keywords, ensure_ascii=False)
    schema_str = json.dumps(SYNONYMS_OUTPUT_SCHEMA, ensure_ascii=False)

    return SYNONYMS_PROMPT_TEMPLATE.strip().format(
        language=language,
        words_json=words_json,
        output_schema=schema_str
    )
