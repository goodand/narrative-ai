import { photoService } from '../../services/PhotoService.js';
import { handleError, showToast, ErrorLevel } from '../../utils/errorHandler.js';

/**
 * 전체 로딩 작업의 최종 안전망 타임아웃 (30초).
 * dailyCurationRuntime의 10초 네이티브 타임아웃이 실패하는 극단적 상황
 * (예: iOS main thread deadlock) 에서도 UI가 무한 hang되지 않도록 보장합니다.
 */
const GLOBAL_LOAD_TIMEOUT_MS = 30000;

export async function loadRealPhotos(manager) {
    console.log('HomeManager: Starting loadRealPhotos...');
    const startedAt = performance.now();
    manager.isLoading = true;
    manager.error = null;
    manager.render();

    // 전체 작업 안전망 타이머
    let globalTimeoutId = null;
    const globalTimeout = new Promise((_, reject) => {
        globalTimeoutId = setTimeout(() => {
            const err = new Error('전체 사진 로딩 작업이 응답 시간을 초과했습니다.');
            err.name = 'TimeoutError';
            reject(err);
        }, GLOBAL_LOAD_TIMEOUT_MS);
    });

    try {
        const fetchPromise = photoService.fetchDailyCuration({
            limit: 3,
            thumbSize: 300,
            transport: 'base64'
        });

        // 네이티브 10초 타임아웃 + 전체 30초 안전망 이중 보호
        const { photos, dayKey, fromCache, needsRefresh } = await Promise.race([
            fetchPromise,
            globalTimeout
        ]);

        const elapsed = Math.round(performance.now() - startedAt);
        console.log(`[PERF] launch_to_carousel_ms=${elapsed} dayKey=${dayKey} fromCache=${fromCache} needsRefresh=${needsRefresh}`);
        console.log(`HomeManager: 데일리 큐레이션 조회 성공 — ${photos.length}장`);

        const perfEntry = {
            ts: new Date().toISOString(),
            launch_to_carousel_ms: elapsed,
            dayKey,
            fromCache,
            needsRefresh,
            daily_items_count: photos.length
        };
        const prev = JSON.parse(localStorage.getItem('perf_runs') || '[]');
        prev.push(perfEntry);
        localStorage.setItem('perf_runs', JSON.stringify(prev.slice(-50)));
        showToast(`[PERF] ${elapsed}ms cache=${fromCache ? 'Y' : 'N'} refresh=${needsRefresh ? 'Y' : 'N'} items=${photos.length}`, ErrorLevel.INFO);

        if (photos.length > 0) {
            manager.currentIndex = 0;
        } else {
            manager.error = '사진첩에 분석할 수 있는 사진이 없습니다.';
        }
    } catch (error) {
        handleError(error, 'HomeManager');
        if (error.name === 'TimeoutError') {
            manager.error = '사진 보관함 응답이 지연되고 있습니다. iCloud 동기화 상태를 확인하거나 [다시 시도하기] 버튼을 눌러주세요.';
        } else {
            manager.error = '사진첩 접근 권한이 없거나 분석 중 오류가 발생했습니다.';
        }
    } finally {
        clearTimeout(globalTimeoutId);
        manager.isLoading = false;
        manager.render();
    }
}

export function setupDailyCurationListener(manager) {
    if (typeof window === 'undefined') return;
    window.addEventListener('daily-curation-updated', () => {
        const photos = photoService.getPhotos();
        const visibleMax = Math.min(photos.length, 3);

        if (photos.length > 0) {
            manager.error = null;
            if (manager.currentIndex >= visibleMax) {
                manager.currentIndex = Math.max(0, visibleMax - 1);
            }
        } else if (!manager.isLoading) {
            manager.error = '사진첩에 분석할 수 있는 사진이 없습니다.';
            manager.currentIndex = 0;
        }

        const isVisible = manager.container &&
            !manager.container.classList.contains('hidden') &&
            manager.container.style.display !== 'none';

        if (isVisible) {
            manager.render();
        }
    });
}
