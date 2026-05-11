/**
 * NotificationPort adapter — wraps NotificationService named exports.
 *
 * See: packages/core/src/contracts/ports.js — NotificationPort
 * Source: src/services/NotificationService.js
 *
 * Decision #6 (slice-2-adapter-decisions): `setupActionListener(navigation)`
 * accepts duck-typed `{ navigate(name): void }`. The current source signature
 * expects a Router instance with `.navigate('home')`, which conforms.
 *
 * @param {{
 *   requestPermission: () => Promise<boolean>,
 *   scheduleDailyNotification: () => Promise<boolean>,
 *   cancelAll: () => Promise<void>|Promise<boolean>,
 *   setupActionListener: (navigation: { navigate: (name: string) => void }) => void
 * }} deps
 * @returns {{
 *   requestPermission: () => Promise<boolean>,
 *   scheduleDailyNotification: () => Promise<boolean>,
 *   cancelAll: () => Promise<boolean|void>,
 *   setupActionListener: (navigation: Object) => Promise<void>|void
 * }}
 */
export function createCapacitorNotificationPort({
    requestPermission,
    scheduleDailyNotification,
    cancelAll,
    setupActionListener
} = {}) {
    return {
        requestPermission() {
            return requestPermission();
        },
        scheduleDailyNotification() {
            return scheduleDailyNotification();
        },
        cancelAll() {
            return cancelAll();
        },
        setupActionListener(navigation) {
            return setupActionListener(navigation);
        }
    };
}
