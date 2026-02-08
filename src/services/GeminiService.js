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
     * Generate story caption from image via backend proxy
     * @param {string} imageData - Base64 encoded image string
     * @param {Object} context - Context data for generation
     * @returns {Promise<Object>} Generated caption and keywords
     */
    async generateStory(imageData, context) {
        let response;
        try {
            // base64 → Blob 변환 (multipart 전송용)
            const byteChars = atob(imageData);
            const byteArray = new Uint8Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) {
                byteArray[i] = byteChars.charCodeAt(i);
            }
            const imageBlob = new Blob([byteArray], { type: 'image/jpeg' });

            const formData = new FormData();
            formData.append('image', imageBlob, 'photo.jpg');
            formData.append('context', JSON.stringify({
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
            }));

            response = await fetchWithRetry(
                `${this.baseUrl}/api/v1/narrative`,
                {
                    method: 'POST',
                    // Content-Type은 브라우저가 multipart boundary와 함께 자동 설정
                    body: formData
                }
            );
        } catch (networkError) {
            console.error('Network or fetch error:', networkError);
            throw new Error('서버와 연결할 수 없습니다. 네트워크 상태를 확인해주세요.');
        }

        const responseText = await response.text();

        if (!response.ok) {
            let errorMessage = UI_MESSAGES.ERROR_NO_RESPONSE;
            try {
                const errorData = JSON.parse(responseText);
                errorMessage = errorData.detail || errorMessage;
            } catch {
                console.error('Non-JSON error response:', responseText);
            }
            
            if (response.status === 429) {
                throw new Error(errorMessage || '사용자가 많아 요청이 지연되고 있습니다. 1분 후 다시 시도해주세요.');
            }
            throw new Error(errorMessage);
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
     * Get synonyms for keywords via backend proxy
     * @param {string[]} keywords - Keywords to get synonyms for
     * @param {string} language - Language for synonyms
     * @returns {Promise<Object[]>} Synonyms suggestions
     */
    async getSynonyms(keywords, language) {
        try {
            const response = await fetchWithRetry(
                `${this.baseUrl}/api/v1/synonyms`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        keywords: keywords,
                        language: language || 'Korean'
                    })
                }
            );

            if (!response.ok) {
                console.warn('Synonyms API error, returning empty suggestions');
                return keywords.map(w => ({ word: w, alternatives: [] }));
            }

            const data = await response.json();
            return data.suggestions || keywords.map(w => ({ word: w, alternatives: [] }));
        } catch (error) {
            console.error('Synonyms fetch error:', error);
            return keywords.map(w => ({ word: w, alternatives: [] }));
        }
    }
}
