/**
 * NotificationController — local notification lifecycle.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Notification controller
 *   - docs/refactor/slice-3b-controller-mapping.md §1
 *
 * Decisions (slice-3b decision log):
 *   #1 — `init(navigation)` registers `appPort.addListener('appStateChange', ...)`
 *        internally and dispatches to its own `handleAppStateChange({isActive})`.
 *   #4 — `setEnabled(enabled)` orchestrates request/schedule/cancel/storage
 *        directly inside the controller (no reactor).
 *
 * Storage key fixed by instruction §6: 'notificationEnabled' (string 'true'/'false').
 *
 * `navigation` is duck-typed `{ navigate(viewName: string): void }` per
 * slice-2 decision #6 / slice-3a resolution #2.
 *
 * @param {{
 *   notificationPort: {
 *     requestPermission: () => Promise<boolean>,
 *     scheduleDailyNotification: () => Promise<boolean>,
 *     cancelAll: () => Promise<boolean|void>,
 *     setupActionListener: (navigation: Object) => Promise<void>|void
 *   },
 *   appPort: { addListener: Function },
 *   storagePort: { getItem: (k: string) => string|null, setItem: (k: string, v: string) => void },
 *   store: Object,
 *   normalizeError: (error: any, context?: string) => Object
 * }} deps
 */
const STORAGE_KEY = 'notificationEnabled';
const NOTIFICATION_CONTEXT = 'notifications';

export function createNotificationController({
    notificationPort,
    appPort,
    storagePort,
    store,
    normalizeError
} = {}) {
    const writeNotifications = (patch) => {
        store.patch({ notifications: patch });
    };

    const writeError = (error) => {
        const normalized = normalizeError
            ? normalizeError(error, NOTIFICATION_CONTEXT)
            : { message: 'notifications_error', context: NOTIFICATION_CONTEXT, code: null, cause: error };
        writeNotifications({ status: 'error', error: normalized });
    };

    const controller = {
        async init(navigation) {
            writeNotifications({ status: 'initializing', error: null });

            // Hydrate persisted enabled flag before touching native listener.
            controller.loadSetting();

            try {
                await notificationPort.setupActionListener(navigation);
            } catch (error) {
                writeError(error);
                return;
            }

            // Decision #1A — controller owns appStateChange registration.
            try {
                appPort.addListener('appStateChange', (event) => {
                    const isActive = Boolean(event && event.isActive);
                    // Fire-and-forget — handleAppStateChange writes its own state.
                    controller.handleAppStateChange({ isActive });
                });
            } catch (error) {
                writeError(error);
                return;
            }

            // Boot parity: if persisted enabled, call schedule once at init time
            // (matches main.js:352-353).
            const enabledNow = Boolean(store.get('notifications.enabled'));
            if (enabledNow) {
                writeNotifications({ status: 'scheduling' });
                try {
                    await notificationPort.scheduleDailyNotification();
                    writeNotifications({ status: 'enabled', error: null });
                } catch (error) {
                    writeError(error);
                }
            } else {
                writeNotifications({ status: 'idle' });
            }
        },

        loadSetting() {
            const raw = storagePort.getItem(STORAGE_KEY);
            const enabled = raw === 'true';
            writeNotifications({ enabled, status: 'idle', error: null });
        },

        async setEnabled(enabled) {
            const wantOn = Boolean(enabled);

            if (wantOn) {
                writeNotifications({ status: 'requesting_permission', error: null });

                let granted = false;
                try {
                    granted = await notificationPort.requestPermission();
                } catch (error) {
                    writeError(error);
                    return;
                }

                if (!granted) {
                    storagePort.setItem(STORAGE_KEY, 'false');
                    writeNotifications({ enabled: false, status: 'permission_denied', error: null });
                    return;
                }

                writeNotifications({ status: 'scheduling' });
                try {
                    await notificationPort.scheduleDailyNotification();
                } catch (error) {
                    writeError(error);
                    return;
                }

                storagePort.setItem(STORAGE_KEY, 'true');
                writeNotifications({ enabled: true, status: 'enabled', error: null });
                return;
            }

            writeNotifications({ status: 'cancelling', error: null });
            try {
                await notificationPort.cancelAll();
            } catch (error) {
                writeError(error);
                return;
            }

            storagePort.setItem(STORAGE_KEY, 'false');
            writeNotifications({ enabled: false, status: 'disabled', error: null });
        },

        async handleAppStateChange({ isActive } = {}) {
            if (!isActive) return;

            const enabledNow = Boolean(store.get('notifications.enabled'));
            if (!enabledNow) return;

            writeNotifications({ status: 'rescheduling', error: null });
            try {
                await notificationPort.scheduleDailyNotification();
                writeNotifications({ status: 'enabled', error: null });
            } catch (error) {
                writeError(error);
            }
        },

        getViewModel() {
            const slice = store.get('notifications') || {};
            const status = typeof slice.status === 'string' ? slice.status : 'idle';

            return {
                enabled: Boolean(slice.enabled),
                status,
                error: slice.error || null,
                storageKey: STORAGE_KEY
            };
        }
    };

    return controller;
}
