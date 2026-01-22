/**
 * Application Configuration Constants
 * 앱 전역에서 사용되는 상수 및 설정값
 */

// API Configuration
export const GEMINI_CONFIG = {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    STORY_MODEL: 'gemini-2.5-flash',
    SUGGESTIONS_MODEL: 'gemini-2.5-flash'
};

// Image Processing Configuration
export const IMAGE_CONFIG = {
    MAX_SIDE: 512,
    MAX_AREA: 512 * 512,
    QUALITY: 0.85,
    FORMAT: 'image/jpeg'
};

// Default System Prompt
export const DEFAULT_SYSTEM_PROMPT =
    "You are RECOCO, a professional storyteller. Help users tell stories using image metadata. Use emojis and platform-appropriate tone.";

// Retry Configuration
export const RETRY_CONFIG = {
    MAX_RETRIES: 5,
    INITIAL_BACKOFF: 1000
};

// UI Messages
export const UI_MESSAGES = {
    LOADING: "기억을 분석하는 중...",
    FINDING_SYNONYMS: "유의어를 찾는 중...",
    GENERATE_BUTTON: "내 기억을 선명하게 하기",
    COPY_SUCCESS: "복사 완료!",
    ERROR_NO_API_KEY: "API Key가 설정되지 않았습니다. .env 파일을 확인하세요.",
    ERROR_NO_IMAGE: "사진을 업로드해주세요.",
    ERROR_IMAGE_PROCESS: "이미지 처리 중 오류가 발생했습니다.",
    ERROR_NO_RESPONSE: "AI 응답이 없습니다. 다시 시도해주세요.",
    ERROR_INVALID_FORMAT: "AI 응답 형식이 올바르지 않습니다.",
    ERROR_JSON_PARSE: "AI 응답을 처리하는 중 오류가 발생했습니다. (JSON 형식 불일치)"
};

// SNS Platform Options
export const SNS_PLATFORMS = ['Instagram', 'Facebook', 'Twitter', 'Blog'];

// Emotion Temperature Options
export const EMOTION_TEMPS = {
    COLD: 'Cold',
    LUKEWARM: 'Lukewarm',
    HOT: 'Hot'
};
