import { photoService } from '../../services/PhotoService.js';
import { handleError, showToast, ErrorLevel } from '../../utils/errorHandler.js';
import { isPhotoPermissionError } from '../../utils/photoPermission.js';

/**
 * 전체 로딩 작업의 최종 안전망 타임아웃 (30초).
 * dailyCurationRuntime의 10초 네이티브 타임아웃이 실패하는 극단적 상황
 * (예: iOS main thread deadlock) 에서도 UI가 무한 hang되지 않도록 보장합니다.
 */
const GLOBAL_LOAD_TIMEOUT_MS = 30000;

function persistPerfEntry({ elapsed, dayKey, fromCache, needsRefresh, photos }) {
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
}

function notifyLaunchState({ elapsed, fromCache, needsRefresh, photos, stale, nativeTimeout }) {
    let perfMsg = `[PERF] ${elapsed}ms cache=${fromCache ? 'Y' : 'N'} refresh=${needsRefresh ? 'Y' : 'N'} items=${photos.length}`;
    if (stale || nativeTimeout) {
        perfMsg += ' (STALE FALLBACK)';
        showToast('이전 추천을 먼저 보여드리고 있어요. 새 분석은 백그라운드에서 다시 시도됩니다.', ErrorLevel.WARNING);
        return;
    }
    showToast(perfMsg, ErrorLevel.INFO);
}

function applyLoadError(manager, error) {
    const permissionError = isPhotoPermissionError(error);
    handleError(error, 'HomeManager', { silent: permissionError });
    if (error.name === 'TimeoutError') {
        manager.error = '사진 보관함 응답이 지연되고 있습니다. iCloud 동기화 상태를 확인하거나 [다시 시도하기] 버튼을 눌러주세요.';
        return;
    }
    if (permissionError) {
        manager.error = '사진첩 접근 권한이 필요합니다. 권한 안내 화면에서 사진 접근을 허용해주세요.';
        return;
    }
    manager.error = '사진첩 접근 권한이 없거나 분석 중 오류가 발생했습니다.';
}

function notifyUpdatedState(detail) {
    if (detail.stale || detail.nativeTimeout) {
        showToast('이전 추천을 보여드리고 있습니다. 잠시만 기다려주세요.', ErrorLevel.WARNING);
    }
}

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
        const result = await Promise.race([
            fetchPromise,
            globalTimeout
        ]);

        const { photos, dayKey, fromCache, needsRefresh, stale, nativeTimeout } = result;

        const elapsed = Math.round(performance.now() - startedAt);
        console.log(`[PERF] launch_to_carousel_ms=${elapsed} dayKey=${dayKey} fromCache=${fromCache} needsRefresh=${needsRefresh}`);
        console.log(`HomeManager: 데일리 큐레이션 조회 성공 — ${photos.length}장`);
        manager.photos = [...photoService.getPhotos()];

        persistPerfEntry({ elapsed, dayKey, fromCache, needsRefresh, photos });
        notifyLaunchState({ elapsed, fromCache, needsRefresh, photos, stale, nativeTimeout });

        if (photos.length > 0) {
            manager.currentIndex = 0;
        } else {
            manager.error = '사진첩에 분석할 수 있는 사진이 없습니다.';
        }
    } catch (error) {
        applyLoadError(manager, error);
    } finally {
        clearTimeout(globalTimeoutId);
        manager.isLoading = false;
        manager.render();
    }
}

export function setupDailyCurationListener(manager) {
    if (typeof window === 'undefined') return;
    window.addEventListener('daily-curation-updated', (event) => {
        const detail = event.detail || {};
        notifyUpdatedState(detail);
        const photos = photoService.getPhotos();
        const visibleMax = Math.min(photos.length, 3);
        manager.photos = [...photos];

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
