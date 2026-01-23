"""
Prompt Templates
프롬프트 빌드 로직 (클라이언트에서 이전됨)
"""

from ..models.schemas import NarrativeContext
import json


def build_story_prompt(context: NarrativeContext) -> str:
    """
    스토리 생성 프롬프트 빌드
    기존 GeminiService._buildStoryPrompt 로직을 서버로 이전
    """
    metadata_str = json.dumps({
        "date": context.metadata.date,
        "gps": context.metadata.gps,
        "location": context.metadata.location
    })

    return f"""
Role: Professional Storyteller (Service Name: RECOCO).
Task: Create a compelling story based on the image metadata and visual context.

Context:
  - Platform: {context.sns}
  - Mood: {context.mood}
  - Emotion Temperature: {context.temp}
  - Language: {context.language}
  - User Tags: {context.tags or ''}
  - Activity: {context.activity or 'Not specified'}
  - Body State: {context.bodyState or 'Not specified'}
  - Relationship State: {context.relationship or 'Not specified'}
  - Metadata: {metadata_str}

Length Constraint: Keep the caption CONCISE - around 2-3 sentences maximum. Be brief and impactful.
Output Requirement: Identify 2-3 key emotional words from the caption.
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
Format: JSON only. {{"suggestions": [{{"word": "original", "alternatives": ["alt1", "alt2", "alt3"]}}]}}
""".strip()
