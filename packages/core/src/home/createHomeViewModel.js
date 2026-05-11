/**
 * createHomeViewModel — pure derivation of the Home view model from a state
 * snapshot.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Home view model shape
 *   - docs/refactor/slice-3c1-controller-mapping.md §2
 *
 * Decision 5A: profileName reads `state.auth.user.user_metadata.full_name`
 * and falls back to '사용자'.
 *
 * Constraints:
 *   - Synchronous, side-effect free.
 *   - No store/port/clock/normalizeError calls.
 *   - No mutation of input arrays/objects.
 *
 * @param {Object} state Full store snapshot (output of `store.getState()`).
 * @param {Object} [_options] Reserved.
 * @returns {{
 *   status: string,
 *   error: Object|null,
 *   profileName: string,
 *   headerMessage: string,
 *   photos: Array<Object>,
 *   currentIndex: number,
 *   visiblePhotos: Array<Object>,
 *   currentPhoto: Object|null,
 *   progress: { clearedCount: number, targetCount: number, percent: number },
 *   meta: { date: string, location: string, contextMessage: string },
 *   controls: { canPrevious: boolean, canNext: boolean, canDelete: boolean, canMarkPrecious: boolean }
 * }}
 */

const VISIBLE_COUNT = 3;
const TARGET_COUNT = 7;
const DEFAULT_PROFILE_NAME = '사용자';
const DEFAULT_HEADER_MESSAGE = '기기에서 찾아낸 비우기 좋은 기록들입니다.';

const safeArray = (value) => (Array.isArray(value) ? value : []);

const clampIndex = (rawIndex, max) => {
    if (max <= 0) return 0;
    if (typeof rawIndex !== 'number' || Number.isNaN(rawIndex)) return 0;
    if (rawIndex < 0) return 0;
    if (rawIndex >= max) return max - 1;
    return rawIndex;
};

export function createHomeViewModel(state, _options = {}) {
    const safeState = state && typeof state === 'object' ? state : {};
    const home = safeState.home && typeof safeState.home === 'object' ? safeState.home : {};
    const auth = safeState.auth && typeof safeState.auth === 'object' ? safeState.auth : {};

    const photos = safeArray(home.photos);
    const visibleMax = Math.min(photos.length, VISIBLE_COUNT);
    const currentIndex = clampIndex(home.currentIndex, visibleMax);
    const visiblePhotos = photos.slice(0, visibleMax);
    const currentPhoto = visibleMax > 0 ? (visiblePhotos[currentIndex] || null) : null;

    const status = typeof home.status === 'string' ? home.status : 'idle';
    const error = home.error || null;
    const headerMessage = typeof home.headerMessage === 'string' && home.headerMessage.length > 0
        ? home.headerMessage
        : DEFAULT_HEADER_MESSAGE;

    const fullName = auth.user
        && auth.user.user_metadata
        && typeof auth.user.user_metadata.full_name === 'string'
        && auth.user.user_metadata.full_name.length > 0
        ? auth.user.user_metadata.full_name
        : DEFAULT_PROFILE_NAME;

    const clearedCount = Math.max(0, TARGET_COUNT - visibleMax);
    const percent = Math.max(0, Math.min(100, (clearedCount / TARGET_COUNT) * 100));

    const isFirst = currentIndex <= 0;
    const isLast = visibleMax === 0 || currentIndex >= visibleMax - 1;
    const hasCurrent = currentPhoto !== null;
    const isBusy = status === 'loading' || status === 'deleting' || status === 'refilling';

    return {
        status,
        error,
        profileName: fullName,
        headerMessage,
        photos: photos.slice(),
        currentIndex,
        visiblePhotos,
        currentPhoto,
        progress: {
            clearedCount,
            targetCount: TARGET_COUNT,
            percent
        },
        meta: {
            date: (currentPhoto && typeof currentPhoto.date === 'string') ? currentPhoto.date : '',
            location: (currentPhoto && typeof currentPhoto.location === 'string') ? currentPhoto.location : '',
            contextMessage: (currentPhoto && typeof currentPhoto.contextMessage === 'string') ? currentPhoto.contextMessage : ''
        },
        controls: {
            canPrevious: !isBusy && hasCurrent && !isFirst,
            canNext: !isBusy && hasCurrent && !isLast,
            canDelete: !isBusy && hasCurrent,
            canMarkPrecious: !isBusy && hasCurrent
        }
    };
}
