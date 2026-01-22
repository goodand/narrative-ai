/**
 * GeminiService - Google Gemini API Integration
 * AI 스토리 생성 및 유의어 추천 API 담당
 */

import { GEMINI_API, UI_MESSAGES } from '../constants/config.js';
import { fetchWithRetry, delay } from '../utils/fetch.js';

export class GeminiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
    }

    /**
     * Check if API key is configured
     * @returns {boolean}
     */
    isConfigured() {
        return Boolean(this.apiKey);
    }

    /**
     * Generate story caption from image
     * @param {string} imageBase64 - Base64 encoded image
     * @param {Object} context - Context data for generation
     * @returns {Promise<Object>} Generated caption and keywords
     */
    async generateStory(imageBase64, context) {
        if (!this.apiKey) {
            throw new Error(UI_MESSAGES.ERROR_NO_API_KEY);
        }

        const prompt = this._buildStoryPrompt(context);

        const response = await fetchWithRetry(
            `${GEMINI_API.BASE_URL}/${GEMINI_API.STORY_MODEL}:generateContent?key=${this.apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: prompt },
                            { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } }
                        ]
                    }],
                    systemInstruction: { parts: [{ text: context.systemPrompt }] },
                    generationConfig: {
                        responseMimeType: 'application/json',
                        maxOutputTokens: GEMINI_API.MAX_OUTPUT_TOKENS,
                        topP: 0.85
                    }
                })
            }
        );

        const data = await response.json();
        return this._parseStoryResponse(data);
    }

    /**
     * Generate synonym suggestions for keywords
     * @param {string[]} keywords - Keywords to find alternatives for
     * @param {string} language - Target language
     * @returns {Promise<Array>} Keywords with suggestions
     */
    async getSynonyms(keywords, language) {
        // Rate limit prevention
        await delay(1000);

        const prompt = `
            Generate 3-4 creative synonyms or alternative expressions for each word.
            Language: ${language}
            Words: ${JSON.stringify(keywords)}
            Be creative and suggest expressive alternatives.
            Format: JSON only. {"suggestions": [{"word": "original", "alternatives": ["alt1", "alt2", "alt3"]}]}
        `;

        try {
            const response = await fetch(
                `${GEMINI_API.BASE_URL}/${GEMINI_API.SUGGESTIONS_MODEL}:generateContent?key=${this.apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                        generationConfig: {
                            responseMimeType: 'application/json',
                            temperature: 1.2,
                            topP: 0.95,
                            maxOutputTokens: GEMINI_API.SUGGESTIONS_MAX_TOKENS
                        }
                    })
                }
            );

            const data = await response.json();
            return this._parseSynonymsResponse(data, keywords);
        } catch (error) {
            console.error('Suggestions generation error:', error);
            return keywords.map(w => ({ word: w, suggestions: [] }));
        }
    }

    // Private methods

    _buildStoryPrompt(context) {
        return `
            Role: Professional Storyteller (Service Name: RECOCO).
            Task: Create a compelling story based on the image metadata and visual context.
            Context:
              - Platform: ${context.sns}
              - Mood: ${context.mood}
              - Emotion Temperature: ${context.temp}
              - Language: ${context.language}
              - User Tags: ${context.tags || ''}
              - Activity: ${context.activity || 'Not specified'}
              - Body State: ${context.bodyState || 'Not specified'}
              - Relationship State: ${context.relationship || 'Not specified'}
              - Metadata: ${JSON.stringify(context.metadata)}
            Length Constraint: Keep the caption CONCISE - around 2-3 sentences maximum. Be brief and impactful.
            Output Requirement: Identify 2-3 key emotional words from the caption.
            Format: JSON only. {"original_caption": "caption text here", "keywords": ["word1", "word2", "word3"]}
        `;
    }

    _parseStoryResponse(data) {
        if (!data?.candidates || data.candidates.length === 0) {
            throw new Error(UI_MESSAGES.ERROR_NO_RESPONSE);
        }

        const resultText = data.candidates[0]?.content?.parts?.[0]?.text;

        if (!resultText) {
            throw new Error(UI_MESSAGES.ERROR_INVALID_FORMAT);
        }

        // Clean JSON markdown wrapper
        const cleanedText = resultText.replace(/```json|```/g, '').trim();

        try {
            return JSON.parse(cleanedText);
        } catch (e) {
            console.error('JSON Parse Error:', resultText);
            throw new Error(UI_MESSAGES.ERROR_JSON_PARSE);
        }
    }

    _parseSynonymsResponse(data, originalKeywords) {
        if (!data?.candidates?.[0]?.content?.parts?.[0]?.text) {
            return originalKeywords.map(w => ({ word: w, suggestions: [] }));
        }

        const resultText = data.candidates[0].content.parts[0].text;
        const cleanedText = resultText.replace(/```json|```/g, '').trim();

        try {
            const parsed = JSON.parse(cleanedText);
            return parsed.suggestions.map(item => ({
                word: item.word,
                suggestions: item.alternatives || []
            }));
        } catch (e) {
            console.error('Synonyms JSON Parse Error:', resultText);
            return originalKeywords.map(w => ({ word: w, suggestions: [] }));
        }
    }
}
