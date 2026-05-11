/**
 * PhotoPort adapter — wraps PhotoService + RecocolPhotos plugin.
 *
 * See: packages/core/src/contracts/ports.js — PhotoPort, PhotoCurationResult
 *
 * Decision #1 (slice-2-adapter-decisions): `fetchDailyCuration` and
 * `fetchCurationBatch` return `PhotoCurationResult` (the rich source shape:
 * `{ photos, dayKey, totalCount, fromCache, needsRefresh, stale,
 *   nativeTimeout }`). The typedef in ports.js was updated in slice 2a to
 * match — no normalization is performed here.
 *
 * Permission methods (`getPhotoLibraryPermissionStatus`,
 * `requestPhotoLibraryPermission`) live on the native plugin, not on
 * `PhotoService`, so they delegate to the plugin directly.
 *
 * Cross-service note: `photoService.deletePhoto` (via mutationRuntime)
 * already calls `StatsService.logDetox` internally. Do NOT call
 * `statsPort.logCurationAction` for the same deletion in any controller.
 *
 * @param {{
 *   photoService: Object,
 *   recocolPhotos: {
 *     getPhotoLibraryPermissionStatus: () => Promise<{ status: string, authorized: boolean }>,
 *     requestPhotoLibraryPermission: () => Promise<{ status: string, authorized: boolean }>
 *   }
 * }} deps
 */
export function createPhotoPort({ photoService, recocolPhotos } = {}) {
    return {
        getPhotos() {
            return photoService.getPhotos();
        },
        fetchDailyCuration(options) {
            return photoService.fetchDailyCuration(options);
        },
        fetchCurationBatch(options) {
            return photoService.fetchCurationBatch(options);
        },
        hydrateThumbsForPhotos(photos, options) {
            return photoService.hydrateThumbsForPhotos(photos, options);
        },
        loadPhotoDetails(index) {
            return photoService.loadPhotoDetails(index);
        },
        getPhotoAsBase64(index, options) {
            return photoService.getPhotoAsBase64(index, options);
        },
        getPhotoAsFile(index, options) {
            return photoService.getPhotoAsFile(index, options);
        },
        getPhotoAsAnalysisBase64(assetId) {
            return photoService.getPhotoAsAnalysisBase64(assetId);
        },
        getAnalysis(assetId) {
            return photoService.getAnalysis(assetId);
        },
        registerAnalysis(assetId, promise) {
            photoService.registerAnalysis(assetId, promise);
        },
        deletePhoto(index) {
            return photoService.deletePhoto(index);
        },
        async recordCurationAction(payload) {
            await photoService.recordCurationAction(payload);
        },
        getPhotoLibraryPermissionStatus() {
            return recocolPhotos.getPhotoLibraryPermissionStatus();
        },
        requestPhotoLibraryPermission() {
            return recocolPhotos.requestPhotoLibraryPermission();
        }
    };
}
