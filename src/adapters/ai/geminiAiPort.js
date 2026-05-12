/**
 * AiPort adapter — wraps GeminiService.
 *
 * See: packages/core/src/contracts/ports.js — AiPort
 *
 * Decisions (slice-2-adapter-decisions):
 *   #3 — `generateStory(payload)` unpacks `payload.imageData` and
 *        `payload.context` for the source's `(imageData, context)` arity.
 *   #4 — `generateSynonyms(payload)` maps to the source's `getSynonyms(
 *        keywords, language)` (different name, different arg shape).
 *
 * @param {{ geminiService: {
 *   generateDeleteRecommendation: (payload: Object) => Promise<Object>,
 *   generateBatchDeleteRecommendations: (payload: Object) => Promise<{ recommendations: Array<Object> }>,
 *   generateStory: (imageData: string, context: Object) => Promise<Object>,
 *   getSynonyms: (keywords: Array<string>, language: string) => Promise<Array<Object>>
 * } }} deps
 * @returns {{
 *   generateDeleteRecommendation: (payload: Object) => Promise<Object>,
 *   generateBatchDeleteRecommendations: (payload: Object) => Promise<{ recommendations: Array<Object> }>,
 *   generateStory: (payload: { imageData: string, context: Object }) => Promise<Object>,
 *   generateSynonyms: (payload: { keywords: Array<string>, language?: string }) => Promise<Array<Object>>
 * }}
 */
export function createGeminiAiPort({ geminiService } = {}) {
    return {
        generateDeleteRecommendation(payload) {
            return geminiService.generateDeleteRecommendation(payload);
        },
        generateBatchDeleteRecommendations(payload) {
            return geminiService.generateBatchDeleteRecommendations(payload);
        },
        generateStory(payload) {
            const { imageData, context } = payload || {};
            return geminiService.generateStory(imageData, context);
        },
        generateSynonyms(payload) {
            const { keywords, language } = payload || {};
            return geminiService.getSynonyms(keywords, language);
        }
    };
}
