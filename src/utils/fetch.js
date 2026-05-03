/**
 * Fetch Utility with Retry Logic
 * 네트워크 오류 시 지수 백오프 방식으로 재시도
 */

import { RETRY_CONFIG } from '../constants/config.js';

/**
 * Fetch with exponential backoff retry
 * @param {string} url - API endpoint URL
 * @param {RequestInit} options - Fetch options
 * @param {number} retries - Number of retries remaining
 * @param {number} backoff - Current backoff delay in ms
 * @returns {Promise<Response>}
 */
export async function fetchWithRetry(
    url,
    options,
    retries = RETRY_CONFIG.MAX_RETRIES,
    backoff = RETRY_CONFIG.INITIAL_BACKOFF
) {
    try {
        const response = await fetch(url, options);

        // User Strategy #6: 429, 5xx, 네트워크 에러만 선별적으로 재시도
        const shouldRetry = (response.status === 429 || response.status >= 500);

        if (!response.ok && shouldRetry && retries > 0) {
            console.warn(`Fetch failed with status ${response.status}, retrying in ${backoff}ms...`);
            await delay(backoff);
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }

        if (!response.ok) {
            throw new Error(`서버 응답 오류: ${response.status}`);
        }

        return response;
    } catch (error) {
        if (retries > 0 && isNetworkError(error)) {
            console.warn(`Network error, retrying in ${backoff}ms...`, error.message);
            await delay(backoff);
            return fetchWithRetry(url, options, retries - 1, backoff * 2);
        }
        throw error;
    }
}

/**
 * Delay execution
 * @param {number} ms - Delay in milliseconds
 * @returns {Promise<void>}
 */
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Check if error is a network error
 * @param {Error} error
 * @returns {boolean}
 */
function isNetworkError(error) {
    return (
        error instanceof TypeError ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError')
    );
}
