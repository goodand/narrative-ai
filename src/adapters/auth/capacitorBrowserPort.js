/**
 * BrowserPort adapter — Capacitor Browser plugin.
 *
 * See: packages/core/src/contracts/ports.js — BrowserPort
 * Wraps `@capacitor/browser` Browser global injected via deps.
 *
 * @param {{ Browser: { open: Function, close: Function } }} deps
 * @returns {{ open: (options: { url: string, presentationStyle?: string }) => Promise<void>, close: () => Promise<void> }}
 */
export function createCapacitorBrowserPort({ Browser } = {}) {
    return {
        async open(options) {
            await Browser.open(options);
        },
        async close() {
            await Browser.close();
        }
    };
}
