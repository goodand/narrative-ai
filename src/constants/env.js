/**
 * Environment Configuration
 * API URL, External Service Configs
 */

// 런타임 환경 감지 (User Strategy #2)
const isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
const backendOrigin = (import.meta.env.VITE_BACKEND_ORIGIN || '').replace(/\/$/, '');

export const API_CONFIG = {
    // 브라우저(Dev)는 프록시를 위해 빈 문자열, 네이티브는 절대 URL 사용
    BASE_URL: isCapacitor ? backendOrigin : '',
    TIMEOUT: 60000,
};

export const GEMINI_CONFIG = {
    // [최적화] 2026년 현재 가장 안정적이고 효율적인 2.5 Flash 모델 사용
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    STORY_MODEL: 'gemini-2.5-flash',
    SUGGESTIONS_MODEL: 'gemini-2.5-flash-lite'
};
