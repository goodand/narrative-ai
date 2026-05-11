/**
 * PermissionController — photo library permission state.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Permission controller
 *   - docs/refactor/slice-3-controller-mapping.md §2
 *
 * Decision #5 (slice-3): writes `store.permissions.photo.*` ONLY. Home
 * curation reaction is HomeController's responsibility (slice 3c) — this
 * controller does not call any home / navigation method directly.
 *
 * 2500ms timeout rule preserved from PermissionModal.checkAndOpen
 * (instruction §6).
 *
 * @param {{
 *   appPort: { isNative: () => boolean },
 *   photoPort: {
 *     getPhotoLibraryPermissionStatus: () => Promise<{ status: string, authorized: boolean }>,
 *     requestPhotoLibraryPermission: () => Promise<{ status: string, authorized: boolean }>
 *   },
 *   store: Object,
 *   normalizeError: (error: any, context?: string) => Object
 * }} deps
 */
const CHECK_TIMEOUT_MS = 2500;
const PERMISSION_CONTEXT = 'permissions';

export function createPermissionController({
    appPort,
    photoPort,
    store,
    normalizeError
} = {}) {
    const writePhoto = (patch) => {
        store.patch({ permissions: { photo: patch } });
    };

    const initialPhotoState = () => store.get('permissions.photo') || {};

    return {
        async checkPhotoPermission() {
            writePhoto({ checking: true, requesting: false, error: null });

            if (!appPort || !appPort.isNative || !appPort.isNative()) {
                writePhoto({
                    checking: false,
                    authorized: true,
                    status: 'authorized',
                    reason: 'web_non_native'
                });
                return;
            }

            let resolved = false;
            const requestId = Symbol('check');

            // 2500ms safety timeout — UI can decide modal/prompt display.
            const timeoutPromise = new Promise((resolve) => {
                setTimeout(() => {
                    if (!resolved) {
                        resolved = true;
                        writePhoto({
                            checking: false,
                            authorized: false,
                            status: initialPhotoState().status || null,
                            reason: 'timeout_prompt',
                            error: null
                        });
                        resolve({ __timeout: true, __requestId: requestId });
                    }
                }, CHECK_TIMEOUT_MS);
            });

            const statusPromise = (async () => {
                try {
                    const result = await photoPort.getPhotoLibraryPermissionStatus();
                    if (resolved) return null;
                    resolved = true;
                    if (result && result.authorized) {
                        writePhoto({
                            checking: false,
                            authorized: true,
                            status: result.status || 'authorized',
                            reason: 'already_authorized',
                            error: null
                        });
                    } else {
                        writePhoto({
                            checking: false,
                            authorized: false,
                            status: result ? (result.status || null) : null,
                            reason: 'needs_prompt',
                            error: null
                        });
                    }
                    return result;
                } catch (error) {
                    if (resolved) return null;
                    resolved = true;
                    writePhoto({
                        checking: false,
                        authorized: false,
                        status: initialPhotoState().status || null,
                        reason: 'check_error',
                        error: normalizeError ? normalizeError(error, PERMISSION_CONTEXT) : { message: 'check_error', context: PERMISSION_CONTEXT, code: null, cause: error }
                    });
                    return null;
                }
            })();

            await Promise.race([statusPromise, timeoutPromise]);
        },

        async requestPhotoPermission() {
            writePhoto({ requesting: true, error: null });

            try {
                const result = await photoPort.requestPhotoLibraryPermission();
                if (result && result.authorized) {
                    writePhoto({
                        requesting: false,
                        authorized: true,
                        status: result.status || 'authorized',
                        reason: 'user_granted',
                        error: null
                    });
                } else {
                    writePhoto({
                        requesting: false,
                        authorized: false,
                        status: result ? (result.status || 'denied') : 'denied',
                        reason: 'user_denied',
                        error: null
                    });
                }
            } catch (error) {
                writePhoto({
                    requesting: false,
                    authorized: false,
                    status: initialPhotoState().status || null,
                    reason: 'request_error',
                    error: normalizeError ? normalizeError(error, PERMISSION_CONTEXT) : { message: 'request_error', context: PERMISSION_CONTEXT, code: null, cause: error }
                });
            }
        },

        skipPhotoPermission() {
            const prevStatus = initialPhotoState().status || 'not_requested';
            writePhoto({
                checking: false,
                requesting: false,
                authorized: false,
                status: prevStatus,
                reason: 'user_skipped',
                error: null
            });
        },

        getViewModel() {
            const photo = store.get('permissions.photo') || {};
            const checking = Boolean(photo.checking);
            const requesting = Boolean(photo.requesting);
            const authorized = Boolean(photo.authorized);
            const reason = typeof photo.reason === 'string' ? photo.reason : null;

            const shouldPrompt = !authorized
                && !checking
                && !requesting
                && reason !== 'user_skipped';

            return {
                photo: {
                    authorized,
                    status: photo.status || null,
                    reason,
                    checking,
                    requesting,
                    error: photo.error || null,
                    shouldPrompt,
                    canRequest: !requesting && !authorized,
                    canSkip: !requesting
                }
            };
        }
    };
}
