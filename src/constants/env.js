/**
 * Environment Configuration
 * API URL, External Service Configs
 */

const isCapacitor = window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost' && typeof window.Capacitor !== 'undefined';

export const API_CONFIG = {
    // 런타임 환경에 따라 API 주소 자동 결정
    BASE_URL: import.meta.env.VITE_API_BASE_URL || (
        (window.location.hostname === 'localhost' && !isCapacitor)
            ? 'http://localhost:8000'
            : 'https://narrative-ai-backend.onrender.com'
    )
};

export const GEMINI_CONFIG = {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    STORY_MODEL: 'gemini-2.5-flash',
    SUGGESTIONS_MODEL: 'gemini-2.5-flash'
};
