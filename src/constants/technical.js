/**
 * Technical Constraints and Constants
 */

export const IMAGE_CONFIG = {
    MAX_SIDE: 384,
    MAX_AREA: 384 * 384,
    QUALITY: 0.7,
    FORMAT: 'image/jpeg'
};

export const RETRY_CONFIG = {
    MAX_RETRIES: 5,
    INITIAL_BACKOFF: 1000
};

export const SNS_PLATFORMS = ['Instagram', 'Facebook', 'Twitter', 'Blog'];

export const EMOTION_TEMPS = {
    COLD: 'Cold',
    LUKEWARM: 'Lukewarm',
    HOT: 'Hot'
};
