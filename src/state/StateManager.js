/**
 * StateManager - Central State Management
 * 애플리케이션 상태를 중앙에서 관리하는 클래스
 */

import { DEFAULT_SYSTEM_PROMPT, EMOTION_TEMPS } from '../constants/config.js';

export class StateManager {
    constructor() {
        this._state = {
            base64: null,
            metadata: {},
            currentResult: null,
            userPreferences: {
                sns: 'Instagram',
                mood: 'casual',
                temp: EMOTION_TEMPS.LUKEWARM,
                language: 'Korean',
                activity: '',
                bodyState: '',
                relationship: '',
                tags: ''
            },
            systemPrompt: DEFAULT_SYSTEM_PROMPT
        };

        this._listeners = new Map();
    }

    /**
     * Get entire state or specific key
     * @param {string} [key] - Optional key to get specific value
     * @returns {any}
     */
    getState(key) {
        if (key) {
            return this._getNestedValue(this._state, key);
        }
        return { ...this._state };
    }

    /**
     * Set state value
     * @param {string} key - State key (supports dot notation: 'userPreferences.sns')
     * @param {any} value - New value
     */
    setState(key, value) {
        const oldValue = this._getNestedValue(this._state, key);
        this._setNestedValue(this._state, key, value);

        // Notify listeners
        this._notifyListeners(key, value, oldValue);
    }

    /**
     * Subscribe to state changes
     * @param {string} key - State key to watch
     * @param {Function} callback - Callback function (newValue, oldValue)
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this._listeners.has(key)) {
            this._listeners.set(key, new Set());
        }
        this._listeners.get(key).add(callback);

        // Return unsubscribe function
        return () => {
            this._listeners.get(key).delete(callback);
        };
    }

    /**
     * Reset state to initial values
     */
    reset() {
        this._state.base64 = null;
        this._state.metadata = {};
        this._state.currentResult = null;
        this._notifyListeners('reset', null, null);
    }

    /**
     * Set image data
     * @param {string} base64 - Base64 encoded image
     * @param {Object} metadata - Image metadata
     */
    setImageData(base64, metadata = {}) {
        this.setState('base64', base64);
        this.setState('metadata', metadata);
    }

    /**
     * Set AI result
     * @param {Object} result - AI generated result
     */
    setResult(result) {
        this.setState('currentResult', result);
    }

    /**
     * Update user preference
     * @param {string} key - Preference key
     * @param {any} value - New value
     */
    setPreference(key, value) {
        this.setState(`userPreferences.${key}`, value);
    }

    /**
     * Get user preference
     * @param {string} key - Preference key
     * @returns {any}
     */
    getPreference(key) {
        return this._state.userPreferences[key];
    }

    // Private helper methods

    _getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    _setNestedValue(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key]) current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }

    _notifyListeners(key, newValue, oldValue) {
        // ... (기존 로직)
    }

    /**
     * 매일 17:00 (오후 5시) 기준으로 데일리 상태를 초기화합니다.
     */
    checkAndResetDaily() {
        const RESET_HOUR = 17;
        const lastReset = localStorage.getItem('last_reset_timestamp');
        const now = new Date();
        
        // 오늘 기준 리셋 시간 설정
        const todayResetTime = new Date(now);
        todayResetTime.setHours(RESET_HOUR, 0, 0, 0);

        // 1. 현재 시간이 리셋 시간을 지났는지 확인
        // 2. 마지막 리셋이 오늘 리셋 시간 이전인지 확인
        if (now > todayResetTime && (!lastReset || new Date(lastReset) < todayResetTime)) {
            console.log('[STATE] 17:00 데일리 리셋 수행');
            this._performDailyReset();
            localStorage.setItem('last_reset_timestamp', now.toISOString());
        }
    }

    _performDailyReset() {
        // 오늘의 비움 목표 관련 상태 초기화
        this.setState('clearedCount', 0);
        this.setState('todayCurationStatus', 'pending');
    }
}

// Export singleton instance
export const store = new StateManager();
