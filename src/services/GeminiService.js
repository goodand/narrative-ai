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
        this.baseUrl = API_CONFIG.BASE_URL;
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
        const response = await fetchWithRetry(
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

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || UI_MESSAGES.ERROR_NO_RESPONSE);
        }

        return await response.json();
    }

    /**
     * Generate synonym suggestions for keywords via backend proxy
     * @param {string[]} keywords - Keywords to find alternatives for
     * @param {string} language - Target language
     * @returns {Promise<Array>} Keywords with suggestions
     */
    async getSynonyms(keywords, language) {
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
                throw new Error('Synonyms API error');
            }

            const data = await response.json();

            // 백엔드 응답 형식에 맞게 변환
            return data.suggestions.map(item => ({
                word: item.word,
                suggestions: item.alternatives || []
            }));
        } catch (error) {
            console.error('Suggestions generation error:', error);
            return keywords.map(w => ({ word: w, suggestions: [] }));
        }
    }
}
