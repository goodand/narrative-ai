import { photoService } from '../../services/PhotoService.js';
import { handleError, showToast, ErrorLevel } from '../../utils/errorHandler.js';

export async function loadRealPhotos(manager) {
    console.log('HomeManager: Starting loadRealPhotos...');
    const startedAt = performance.now();
    manager.isLoading = true;
    manager.error = null;
    manager.render();

    try {
        const { photos, dayKey, fromCache, needsRefresh } = await photoService.fetchDailyCuration({
            limit: 3,
            thumbSize: 300,
            transport: 'base64'
        });

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
        manager.error = '사진첩 접근 권한이 필요합니다.';
    } finally {
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
