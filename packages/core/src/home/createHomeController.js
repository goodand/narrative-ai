/**
 * HomeController — daily curation lifecycle, photo navigation, AI batch
 * registry coordination, refill orchestration.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Home controller
 *   - docs/refactor/slice-3c1-controller-mapping.md (decisions + source mapping)
 *
 * Decisions (slice-3c-1 decision log):
 *   #1 (C) — no `daily-curation-updated` listener in Slice 3c-1; only active
 *            call paths populate `store.home.*`.
 *   #2 (C) — Hybrid AI split: `analyzeCurationReasons` is pure helper here.
 *            Controller owns batch registry/Promise coordination + AiPort
 *            calls. Per-photo individual analysis (handleAIContextDisplay)
 *            stays out of core until slice 4/5.
 *   #3 (A) — `store.home.photos` is the single source of truth.
 *   #4 (B) — 17:00 reset is NOT migrated; legacy `main.js` keeps
 *            `store.checkAndResetDaily()` until later slice.
 *   #5 (A) — view model reads `store.auth.user` only (delegated to
 *            `createHomeViewModel`).
 *
 * Cross-controller coupling:
 *   - subscribes to `store.permissions.photo.authorized`; on `false → true`
 *     transition, calls `loadDailyCuration()` if photos are empty and
 *     status is not loading. This replaces `main.js:147-155` callback per
 *     slice-3a decision #5.
 *   - DOES NOT call NavigationController, AccountController, AuthController
 *     methods directly.
 *   - DOES NOT call `statsPort.logCurationAction` from `deleteCurrent()`;
 *     `mutationRuntime.deletePhoto` already logs through StatsService
 *     (slice-2 mapping coupling note).
 *
 * @param {{
 *   photoPort: Object,
 *   aiPort: Object,
 *   store: Object,
 *   normalizeError: (error: any, context?: string) => Object
 * }} deps
 */

import { analyzeCurationReasons } from './analyzeCurationReasons.js';
import { createHomeViewModel } from './createHomeViewModel.js';

const HOME_CONTEXT = 'home';
const VISIBLE_COUNT = 3;
const DEFAULT_LIMIT = 3;
const DEFAULT_THUMB_SIZE = 300;

export function createHomeController({
    photoPort,
    aiPort,
    store,
    normalizeError
} = {}) {
    if (!photoPort || !aiPort || !store) {
        throw new Error('createHomeController: photoPort, aiPort, store are required');
    }

    const writeHome = (patch) => {
        store.patch({ home: patch });
    };

    const writeError = (error) => {
        const normalized = normalizeError
            ? normalizeError(error, HOME_CONTEXT)
            : { message: 'home_error', context: HOME_CONTEXT, code: null, cause: error };
        writeHome({ status: 'error', error: normalized });
    };

    const getHomeSlice = () => store.get('home') || {};

    const replacePhotoAt = (index, mutator) => {
        const slice = getHomeSlice();
        const photos = Array.isArray(slice.photos) ? slice.photos : [];
        if (index < 0 || index >= photos.length) return;
        const next = photos.slice();
        next[index] = mutator(next[index]);
        writeHome({ photos: next });
    };

    const updatePhotoByAssetId = (assetId, mutator) => {
        const slice = getHomeSlice();
        const photos = Array.isArray(slice.photos) ? slice.photos : [];
        let changed = false;
        const next = photos.map((photo) => {
            if (photo && photo.id === assetId) {
                changed = true;
                return mutator(photo);
            }
            return photo;
        });
        if (changed) writeHome({ photos: next });
    };

    const visibleIndices = (photosLength) => {
        const visibleMax = Math.min(photosLength, VISIBLE_COUNT);
        const indices = [];
        for (let i = 0; i < visibleMax; i += 1) indices.push(i);
        return indices;
    };

    const controller = {
        async loadDailyCuration(options = {}) {
            writeHome({ status: 'loading', error: null });

            try {
                const result = await photoPort.fetchDailyCuration({
                    limit: DEFAULT_LIMIT,
                    thumbSize: DEFAULT_THUMB_SIZE,
                    transport: 'base64',
                    ...options
                });

                const photos = Array.isArray(result?.photos) ? result.photos : [];
                writeHome({
                    photos,
                    currentIndex: 0,
                    nextBatch: null,
                    isRefilling: false,
                    error: null
                });

                if (photos.length === 0) {
                    writeHome({ status: 'empty' });
                } else {
                    writeHome({ status: 'ready' });
                }

                return result;
            } catch (error) {
                writeError(error);
                return null;
            }
        },

        getCurrentPhotoMeta() {
            const slice = getHomeSlice();
            const photos = Array.isArray(slice.photos) ? slice.photos : [];
            const idx = typeof slice.currentIndex === 'number' ? slice.currentIndex : 0;
            if (idx < 0 || idx >= photos.length) return {};
            const photo = photos[idx] || {};
            const asset = photo.rawAsset || {};
            return {
                Make: 'Apple iPhone',
                date: asset.creationDate ? String(asset.creationDate).split('T')[0] : '',
                DateTime: asset.creationDate || null,
                pixelWidth: asset.pixelWidth || null,
                pixelHeight: asset.pixelHeight || null,
                fileSize: asset.fileSize || null,
                gps: asset.location ? {
                    lat: asset.location.latitude,
                    lon: asset.location.longitude,
                    formatted: photo.location || null
                } : null,
                _isNative: true,
                curationScore: photo.score || 0,
                assetId: photo.id || null,
                dayKey: photo.dayKey || null,
                curationReasons: Array.isArray(asset.curationReasons) ? asset.curationReasons : []
            };
        },

        getCurrentImageAsFile() {
            const slice = getHomeSlice();
            const idx = typeof slice.currentIndex === 'number' ? slice.currentIndex : 0;
            return photoPort.getPhotoAsFile(idx);
        },

        getCurrentPhotoBase64() {
            const slice = getHomeSlice();
            const idx = typeof slice.currentIndex === 'number' ? slice.currentIndex : 0;
            return photoPort.getPhotoAsBase64(idx);
        },

        movePrevious() {
            const slice = getHomeSlice();
            const photos = Array.isArray(slice.photos) ? slice.photos : [];
            const visibleMax = Math.min(photos.length, VISIBLE_COUNT);
            const idx = typeof slice.currentIndex === 'number' ? slice.currentIndex : 0;
            if (idx <= 0 || visibleMax === 0) return;
            writeHome({ currentIndex: idx - 1 });
        },

        moveNext() {
            const slice = getHomeSlice();
            const photos = Array.isArray(slice.photos) ? slice.photos : [];
            const visibleMax = Math.min(photos.length, VISIBLE_COUNT);
            const idx = typeof slice.currentIndex === 'number' ? slice.currentIndex : 0;
            if (idx >= visibleMax - 1) return;
            writeHome({ currentIndex: idx + 1 });
        },

        async markPrecious() {
            const meta = controller.getCurrentPhotoMeta();
            if (!meta || !meta.assetId) return;

            try {
                await photoPort.recordCurationAction({
                    assetId: meta.assetId,
                    action: 'recorded',
                    dayKey: meta.dayKey || ''
                });
            } catch (error) {
                writeError(error);
                return;
            }

            const slice = getHomeSlice();
            const idx = typeof slice.currentIndex === 'number' ? slice.currentIndex : 0;
            await controller.consumePhoto(idx);
        },

        async deleteCurrent() {
            const slice = getHomeSlice();
            const idx = typeof slice.currentIndex === 'number' ? slice.currentIndex : 0;
            const photos = Array.isArray(slice.photos) ? slice.photos : [];
            const photo = photos[idx];
            if (!photo) return;

            const assetId = photo.id;
            const dayKey = photo.dayKey;

            writeHome({ status: 'deleting' });

            let success = false;
            try {
                success = await photoPort.deletePhoto(idx);
            } catch (error) {
                writeError(error);
                return;
            }

            if (!success) {
                writeHome({ status: 'ready' });
                return;
            }

            try {
                await photoPort.recordCurationAction({
                    assetId,
                    action: 'deleted',
                    dayKey: dayKey || ''
                });
            } catch (error) {
                writeError(error);
                // Continue with consume even if action recording fails — the
                // photo has already been deleted from the device.
            }

            await controller.consumePhoto(idx);
            // After consume, status flows to 'ready'/'empty' through that path.
        },

        async consumePhoto(index) {
            const slice = getHomeSlice();
            const photos = Array.isArray(slice.photos) ? slice.photos : [];
            if (index < 0 || index >= photos.length) return;

            const next = photos.slice();
            next.splice(index, 1);

            // Trigger background refill when only one photo remains and no
            // batch is queued, mirroring HomeManager.consumePhoto:300-319.
            const shouldRefill = next.length === 1
                && !slice.nextBatch
                && !slice.isRefilling;

            if (next.length === 0) {
                writeHome({ photos: next });
                await controller.switchToNextBatch();
                return;
            }

            const currentIdx = typeof slice.currentIndex === 'number' ? slice.currentIndex : 0;
            const nextIdx = currentIdx >= next.length ? Math.max(0, next.length - 1) : currentIdx;
            writeHome({ photos: next, currentIndex: nextIdx, status: 'ready', error: null });

            if (shouldRefill) {
                // Fire-and-forget; refill writes its own state.
                controller.triggerBackgroundRefill();
            }
        },

        async triggerBackgroundRefill() {
            const slice = getHomeSlice();
            if (slice.isRefilling) return;

            writeHome({ isRefilling: true });

            try {
                const result = await photoPort.fetchCurationBatch({
                    limit: DEFAULT_LIMIT,
                    forceRefresh: true
                });

                const candidates = Array.isArray(result?.photos) ? result.photos : [];
                if (candidates.length === 0) {
                    writeHome({ isRefilling: false, nextBatch: [] });
                    return;
                }

                const currentSlice = getHomeSlice();
                const currentIds = (currentSlice.photos || []).map((p) => p && p.id).filter(Boolean);
                const unique = candidates.filter((p) => p && !currentIds.includes(p.id));

                if (unique.length === 0) {
                    writeHome({ isRefilling: false, nextBatch: [] });
                    return;
                }

                // Hydrate thumbs and pre-analyze the candidate batch in parallel.
                const tasks = [];
                tasks.push(
                    Promise.resolve(photoPort.hydrateThumbsForPhotos(unique, { thumbSize: DEFAULT_THUMB_SIZE }))
                        .catch(() => undefined)
                );
                tasks.push(
                    controller._runBatchAnalysis(unique, { skipHeaderUpdate: true })
                        .catch(() => undefined)
                );
                await Promise.allSettled(tasks);

                writeHome({ nextBatch: unique, isRefilling: false });
            } catch (error) {
                writeError(error);
                writeHome({ isRefilling: false });
            }
        },

        async switchToNextBatch() {
            const slice = getHomeSlice();
            const queued = Array.isArray(slice.nextBatch) ? slice.nextBatch : null;

            if (queued && queued.length > 0) {
                writeHome({
                    photos: queued,
                    nextBatch: null,
                    currentIndex: 0,
                    status: 'ready',
                    error: null
                });
                return;
            }

            await controller.loadDailyCuration();
            // loadDailyCuration already resets currentIndex.
        },

        async ensureVisibleImages() {
            const slice = getHomeSlice();
            const photos = Array.isArray(slice.photos) ? slice.photos : [];
            const indices = visibleIndices(photos.length);
            if (indices.length === 0) return;

            const currentIdx = typeof slice.currentIndex === 'number' ? slice.currentIndex : 0;
            const orderedIndices = [
                currentIdx,
                ...indices.filter((i) => i !== currentIdx)
            ];

            // Fetch current first, then the rest in parallel.
            try {
                await photoPort.loadPhotoDetails(currentIdx);
            } catch (_) {
                // best-effort; controller does not surface per-photo load errors.
            }

            await Promise.allSettled(
                orderedIndices.slice(1).map((i) => Promise.resolve(photoPort.loadPhotoDetails(i)))
            );
        },

        async analyzeVisiblePhotos() {
            const slice = getHomeSlice();
            const photos = Array.isArray(slice.photos) ? slice.photos : [];
            if (photos.length === 0) return;

            const visibleMax = Math.min(photos.length, VISIBLE_COUNT);
            const targets = photos
                .slice(0, visibleMax)
                .filter((p) => p && !p.contextMessage && !p._aiReasonFetching);

            if (targets.length < 2) {
                // Below batch threshold — individual analysis is deferred to
                // slice 4/5 (Decision 2C). Update header from existing common
                // reasons in the visible-photo set only.
                const existingHeader = analyzeCurationReasons(photos.slice(0, visibleMax));
                if (existingHeader.headerMessage) {
                    writeHome({ headerMessage: existingHeader.headerMessage });
                }
                return;
            }

            await controller._runBatchAnalysis(targets, { skipHeaderUpdate: false });
        },

        getViewModel() {
            return createHomeViewModel(store.getState());
        },

        // ----- private helpers (underscore-prefixed) -----

        async _runBatchAnalysis(targets, { skipHeaderUpdate = false } = {}) {
            if (!Array.isArray(targets) || targets.length === 0) return null;

            const assetIds = targets.map((p) => p && p.id).filter(Boolean);
            if (assetIds.length === 0) return null;

            // Mark fetching flags inline on store copies.
            for (const id of assetIds) {
                updatePhotoByAssetId(id, (photo) => ({ ...photo, _aiReasonFetching: true }));
            }

            const reasonAnalysis = analyzeCurationReasons(targets);
            if (!skipHeaderUpdate && reasonAnalysis.headerMessage) {
                writeHome({ headerMessage: reasonAnalysis.headerMessage });
            }

            const registryKey = `batch:${assetIds.join('|')}`;
            const existingPromise = photoPort.getAnalysis(registryKey);
            if (existingPromise) {
                try {
                    return await existingPromise;
                } catch (_) {
                    // fall through to fresh request
                }
            }

            const promise = (async () => {
                try {
                    const images = await Promise.all(
                        assetIds.map((id) => photoPort.getPhotoAsAnalysisBase64(id))
                    );
                    const metadatas = targets.map((p) => (p && p.rawAsset) || {});
                    const cleanedCriteriaList = targets.map((p) => {
                        const list = p && p.rawAsset && Array.isArray(p.rawAsset.curationReasons)
                            ? p.rawAsset.curationReasons
                            : [];
                        return list.filter((r) => !reasonAnalysis.commonReasons.includes(r));
                    });

                    const result = await aiPort.generateBatchDeleteRecommendations({
                        images,
                        metadatas,
                        filteringCriteriaList: cleanedCriteriaList,
                        maxLength: 60
                    });

                    const recommendations = Array.isArray(result?.recommendations)
                        ? result.recommendations
                        : [];

                    recommendations.forEach((rec, i) => {
                        const id = assetIds[i];
                        if (!id || !rec) return;
                        updatePhotoByAssetId(id, (photo) => ({
                            ...photo,
                            contextMessage: rec.reason,
                            _aiReasonFetching: false
                        }));
                    });

                    return result;
                } catch (error) {
                    for (const id of assetIds) {
                        updatePhotoByAssetId(id, (photo) => ({ ...photo, _aiReasonFetching: false }));
                    }
                    throw error;
                }
            })();

            photoPort.registerAnalysis(registryKey, promise);
            return promise;
        }
    };

    // Subscribe to permissions.photo.authorized — false → true triggers
    // loadDailyCuration when photos are empty and not already loading.
    if (typeof store.subscribe === 'function') {
        store.subscribe((nextState, prevState) => {
            const prevAuth = prevState
                && prevState.permissions
                && prevState.permissions.photo
                && prevState.permissions.photo.authorized;
            const nextAuth = nextState
                && nextState.permissions
                && nextState.permissions.photo
                && nextState.permissions.photo.authorized;

            if (prevAuth !== true && nextAuth === true) {
                const home = (nextState && nextState.home) || {};
                const photos = Array.isArray(home.photos) ? home.photos : [];
                if (photos.length === 0 && home.status !== 'loading') {
                    // Fire-and-forget; loadDailyCuration writes its own state.
                    controller.loadDailyCuration().catch(() => undefined);
                }
            }
        });
    }

    return controller;
}
