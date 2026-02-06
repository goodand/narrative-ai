/**
 * GeocodingService - Location Address Resolver
 * 좌표를 주소로 변환하며, API 비용 절감을 위해 메모리 캐싱을 수행합니다.
 */

import { API_CONFIG } from '../constants/config.js';
import { fetchWithRetry } from '../utils/fetch.js';
import { handleError, ErrorLevel } from '../utils/errorHandler.js';

export class GeocodingService {
    constructor() {
        this.baseUrl = (API_CONFIG.BASE_URL || '').replace(/\/$/, '');
        this.cache = new Map(); // { "lat,lon": "address" }
    }

    /**
     * 좌표를 주소로 변환합니다. (캐싱 적용)
     */
    async getAddress(lat, lon) {
        // 소수점 3자리까지 정규화하여 근접 위치 캐싱 효율 증대 (약 100m 오차)
        const cacheKey = `${lat.toFixed(3)},${lon.toFixed(3)}`;
        
        if (this.cache.has(cacheKey)) {
            console.log(`[GEO-CACHE] Hit: ${cacheKey}`);
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetchWithRetry(
                `${this.baseUrl}/api/v1/geocode`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ lat, lon })
                }
            );
            const data = await response.json();
            const address = data.address || '알 수 없는 위치';
            
            // 캐시에 저장
            this.cache.set(cacheKey, address);
            return address;
        } catch (error) {
            handleError(error, 'Geocoding', { level: ErrorLevel.WARN, silent: true });
            return '위치 정보 오류';
        }
    }
}

export const geocodingService = new GeocodingService();
