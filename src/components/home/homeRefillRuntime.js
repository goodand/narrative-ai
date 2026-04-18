import { photoService } from '../../services/PhotoService.js';
import { performBatchAnalysis } from './homeImageRuntime.js';

/**
 * 백그라운드에서 다음 추천 후보군을 가져오고 미리 AI 분석을 수행합니다.
 * @param {HomeManager} manager 
 * @returns {Promise<Array>} 분석이 완료된 사진 배열
 */
export async function triggerBackgroundPrefetch(manager) {
    try {
        console.info('[RECOCO-TRACE] Prefetching next batch in background...');
        
        // 1. 다음 후보군 3장 가져오기 (전역 상태에 영향 주지 않음)
        const result = await photoService.fetchCurationBatch({ 
            limit: 3,
            forceRefresh: true 
        });

        const nextPhotos = result.photos;
        if (!nextPhotos || nextPhotos.length === 0) {
            console.warn('[RECOCO-TRACE] No more candidates available for prefetch.');
            return [];
        }

        // 2. 이미 존재하는 사진과 중복 체크 (assetId 기준)
        const currentIds = (manager.photos || []).map(p => p.id);
        const uniqueNextPhotos = nextPhotos.filter(p => !currentIds.includes(p.id));

        if (uniqueNextPhotos.length === 0) {
            console.warn('[RECOCO-TRACE] All pre-fetched photos are already in the list.');
            return [];
        }

        // 3. 백그라운드 배치 분석 실행 (manager를 넘겨주지 않음으로써 UI 간섭 방지)
        uniqueNextPhotos.forEach(p => p._aiReasonFetching = true);
        
        console.info(`[RECOCO-TRACE] Running background AI analysis for ${uniqueNextPhotos.length} assets...`);
        
        // [교정] 인덱스 기반 targets 제거. 자산 배열 자체를 전달하여 정합성 확보.
        await performBatchAnalysis(uniqueNextPhotos, null);

        console.info('[RECOCO-TRACE] Background pre-fetch and analysis complete.');
        return uniqueNextPhotos;

    } catch (error) {
        console.error('[RECOCO-TRACE] Background prefetch failed:', error);
        return [];
    }
}
