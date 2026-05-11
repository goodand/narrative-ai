/**
 * AppPort adapter — Capacitor App plugin + native platform detection.
 *
 * See: packages/core/src/contracts/ports.js — AppPort
 * Wraps `@capacitor/core` Capacitor.isNativePlatform and `@capacitor/app` App.
 *
 * @param {{
 *   Capacitor: { isNativePlatform: () => boolean },
 *   App: { getLaunchUrl: () => Promise<{ url?: string }|null>, addListener: Function }
 * }} deps
 * @returns {{
 *   isNative: () => boolean,
 *   getLaunchUrl: () => Promise<{ url?: string }|null>,
 *   addListener: (eventName: 'appUrlOpen'|'appStateChange', callback: Function) => Promise<{ remove?: Function }>|{ remove?: Function }
 * }}
 */
export function createCapacitorAppPort({ Capacitor, App } = {}) {
    return {
        isNative() {
            return Capacitor.isNativePlatform();
        },
        getLaunchUrl() {
            return App.getLaunchUrl();
        },
        addListener(eventName, callback) {
            return App.addListener(eventName, callback);
        }
    };
}
