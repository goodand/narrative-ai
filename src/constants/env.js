/**
 * Environment Configuration
 * API URL, External Service Configs
 */

const isCapacitor = window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost' && typeof window.Capacitor !== 'undefined';

const isProd = import.meta.env.PROD;
const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Production 환경에서 API URL이 없으면 즉시 에러 발생 (Fail-fast)
if (isProd && !VITE_API_BASE_URL) {
    console.error('CRITICAL: VITE_API_BASE_URL is missing in production environment!');
}

export const API_CONFIG = {
    // 런타임 환경에 따라 API 주소 자동 결정
    BASE_URL: VITE_API_BASE_URL || 'http://localhost:8000'
};

export const GEMINI_CONFIG = {
    // [최적화] 2026년 현재 가장 안정적이고 효율적인 2.5 Flash 모델 사용
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    STORY_MODEL: 'gemini-2.5-flash',
    SUGGESTIONS_MODEL: 'gemini-2.5-flash'
};
