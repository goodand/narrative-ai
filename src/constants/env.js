/**
 * Environment Configuration
 * API URL, External Service Configs
 */

const isCapacitor = window.location.protocol === 'capacitor:' || window.location.hostname === 'localhost' && typeof window.Capacitor !== 'undefined';

export const API_CONFIG = {
    // 런타임 환경에 따라 API 주소 자동 결정
    // [DEV] Capacitor 시뮬레이터도 로컬 백엔드 사용 (배치 엔드포인트 미배포 대응)
    BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
};

export const GEMINI_CONFIG = {
    BASE_URL: 'https://generativelanguage.googleapis.com/v1beta/models',
    STORY_MODEL: 'gemini-2.5-flash',
    SUGGESTIONS_MODEL: 'gemini-2.5-flash'
};
