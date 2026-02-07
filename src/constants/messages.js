/**
 * UI Messages and Text Constants
 * Localization ready structure
 */

export const UI_MESSAGES = {
    LOADING: "기억을 분석하는 중...",
    FINDING_SYNONYMS: "유의어를 찾는 중...",
    GENERATE_BUTTON: "기억 분석하기",
    COPY_SUCCESS: "복사 완료!",
    ERROR_NO_API_KEY: "API Key가 설정되지 않았습니다. .env 파일을 확인하세요.",
    ERROR_NO_IMAGE: "사진을 업로드해주세요.",
    ERROR_IMAGE_PROCESS: "이미지 처리 중 오류가 발생했습니다.",
    ERROR_NO_RESPONSE: "AI 응답이 없습니다. 다시 시도해주세요.",
    ERROR_INVALID_FORMAT: "AI 응답 형식이 올바르지 않습니다.",
    ERROR_JSON_PARSE: "AI 응답을 처리하는 중 오류가 발생했습니다. (JSON 형식 불일치)"
};

// Note: This should match backend/app/utils/prompts.py
export const DEFAULT_SYSTEM_PROMPT =
    "You are RECOCO, a professional storyteller. Help users tell stories using image metadata.";
