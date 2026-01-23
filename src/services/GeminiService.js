/**
 * GeminiService - Backend Proxy API Integration
 * FastAPI 백엔드 프록시를 통한 AI 스토리 생성 및 유의어 추천 API 담당
 *
 * [보안 개선] API Key가 클라이언트에 노출되지 않음
 * [로직 은닉] 프롬프트 빌드 로직이 서버에서 처리됨
 */

import { API_CONFIG, UI_MESSAGES } from '../constants/config.js';
import { fetchWithRetry } from '../utils/fetch.js';

export class GeminiService {
    constructor() {
        // API Key는 더 이상 클라이언트에서 관리하지 않음
        // baseUrl 끝의 슬래시 제거 처리
        this.baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '');
    }

    /**
     * Check if backend API is available
     * @returns {boolean}
     */
    isConfigured() {
        // 백엔드 프록시 사용 시 항상 true 반환
        return true;
    }

    /**
     * Generate story caption from image via backend proxy
     * @param {string} imageBase64 - Base64 encoded image
     * @param {Object} context - Context data for generation
     * @returns {Promise<Object>} Generated caption and keywords
     */
    async generateStory(imageBase64, context) {
        let response;
        try {
            response = await fetchWithRetry(
                `${this.baseUrl}/api/v1/narrative`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: imageBase64,
                        context: {
                            sns: context.sns,
                            mood: context.mood,
                            temp: context.temp,
                            language: context.language,
                            tags: context.tags || '',
                            activity: context.activity || 'Not specified',
                            bodyState: context.bodyState || 'Not specified',
                            relationship: context.relationship || 'Not specified',
                            metadata: context.metadata || {},
                            systemPrompt: context.systemPrompt || null
                        }
                    })
                }
            );
        } catch (networkError) {
            console.error('Network or fetch error:', networkError);
            throw new Error('서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
        }

        const responseText = await response.text();

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
            }
            
            let errorMessage = UI_MESSAGES.ERROR_NO_RESPONSE;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.detail || errorMessage;
            } catch {
                console.error('Non-JSON error response:', responseText);
            }
            throw new Error(`[${response.status}] ${errorMessage}`);
        }

        if (!responseText) {
            throw new Error(UI_MESSAGES.ERROR_NO_RESPONSE);
        }

        try {
            const data = JSON.parse(responseText);
            
            // Structured Output 검증
            if (!data.original_caption || !Array.isArray(data.keywords)) {
                throw new Error(UI_MESSAGES.ERROR_INVALID_FORMAT);
            }
            
            return data;
        } catch (e) {
            console.error('Response processing error:', e, 'Response:', responseText);
            throw new Error(e.message === UI_MESSAGES.ERROR_INVALID_FORMAT 
                ? UI_MESSAGES.ERROR_INVALID_FORMAT 
                : UI_MESSAGES.ERROR_JSON_PARSE);
        }
    }

    /**
     * Generate synonym suggestions for keywords via backend proxy
     * @param {string[]} keywords - Keywords to find alternatives for
     * @param {string} language - Target language
     * @returns {Promise<Array>} Keywords with suggestions
     */
    async getSynonyms(keywords, language) {
        if (!keywords || keywords.length === 0) return [];

        try {
            const response = await fetch(
                `${this.baseUrl}/api/v1/synonyms`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        keywords: keywords,
                        language: language
                    })
                }
            );

            if (!response.ok) {
                console.warn(`Synonyms API returned status ${response.status}`);
                return keywords.map(w => ({ word: w, suggestions: [] }));
            }

            const data = await response.json();

            // 데이터 구조 안전성 검증 및 변환
            if (!data.suggestions || !Array.isArray(data.suggestions)) {
                return keywords.map(w => ({ word: w, suggestions: [] }));
            }

            return data.suggestions.map(item => ({
                word: item.word || '',
                suggestions: Array.isArray(item.alternatives) ? item.alternatives : []
            }));
        } catch (error) {
            console.error('Suggestions generation error:', error);
            // 에러 발생 시 원래 단어만 유지하고 추천은 빈 목록으로 반환 (UI 흐름 유지)
            return keywords.map(w => ({ word: w, suggestions: [] }));
        }
    }
}
