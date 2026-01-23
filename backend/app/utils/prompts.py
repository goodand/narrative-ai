"""
Prompt Templates
프롬프트 빌드 로직 (클라이언트에서 이전됨)
"""

from ..models.schemas import NarrativeContext
import json

# Default System Prompt (페르소나 정의)
DEFAULT_SYSTEM_PROMPT = """You are RECOCO, a professional storyteller.
Help users tell stories using image metadata.
Use emojis and platform-appropriate tone.
Be creative, emotional, and engaging."""


def build_story_prompt(context: NarrativeContext) -> str:
    """
    스토리 생성 프롬프트 빌드
    기존 GeminiService._buildStoryPrompt 로직을 서버로 이전
    """
    # metadata가 dict 또는 객체일 수 있음
    metadata = context.metadata
    if metadata is None:
        metadata = {}
    elif hasattr(metadata, 'model_dump'):
        metadata = metadata.model_dump()
    elif not isinstance(metadata, dict):
        metadata = {}

    metadata_str = json.dumps(metadata, default=str, ensure_ascii=False)

    # 기본 컨텍스트 항목 구성
    context_lines = [
        f"- Platform: {context.sns}",
        f"- Mood: {context.mood}",
        f"- Emotion Temperature: {context.temp}",
        f"- Language: {context.language}",
    ]

    # 선택적 항목 (값이 있고 'Not specified'가 아닐 때만 추가)
    if context.tags and context.tags.strip():
        context_lines.append(f"- User Tags: {context.tags}")
    
    if context.activity and context.activity.strip() and context.activity != "Not specified":
        context_lines.append(f"- Activity: {context.activity}")
        
    if context.bodyState and context.bodyState.strip() and context.bodyState != "Not specified":
        context_lines.append(f"- Body State: {context.bodyState}")
        
    if context.relationship and context.relationship.strip() and context.relationship != "Not specified":
        context_lines.append(f"- Relationship State: {context.relationship}")
    
    # 메타데이터 추가
    context_lines.append(f"- Metadata: {metadata_str}")

    context_str = "\n  ".join(context_lines)

    return f"""
Role: Professional Storyteller (Service Name: RECOCO).
Task: Create a compelling story based on the image metadata and visual context.

Context:
  {context_str}

Length Constraint: Keep the caption CONCISE - around 2-3 sentences maximum. Be brief and impactful.
Output Requirement: Identify 2-3 key emotional words that appear EXACTLY in the generated caption (must be exact substrings).
Format: JSON only. {{"original_caption": "caption text here", "keywords": ["word1", "word2", "word3"]}}
""".strip()


def build_synonyms_prompt(keywords: list[str], language: str) -> str:
    """
    유의어 추천 프롬프트 빌드
    기존 GeminiService.getSynonyms 프롬프트 로직을 서버로 이전
    """
    return f"""
Generate 3-4 creative synonyms or alternative expressions for each word.
Language: {language}
Words: {json.dumps(keywords)}
Be creative and suggest expressive alternatives.
Format: JSON only. {{"suggestions": [{{'word': 'original', 'alternatives': ['alt1', 'alt2', 'alt3']}}]}}
""".strip()