/**
 * StoragePort adapter — browser localStorage / sessionStorage.
 *
 * See: packages/core/src/contracts/ports.js — StoragePort
 * Wraps the two Web Storage globals injected via deps.
 *
 * @param {{ localStorage: Storage, sessionStorage: Storage }} deps
 * @returns {{ getItem(key: string): string|null, setItem(key: string, value: string): void, clearLocal(): void, clearSession(): void }}
 */
export function createBrowserStoragePort({ localStorage, sessionStorage } = {}) {
    return {
        getItem(key) {
            return localStorage.getItem(key);
        },
        setItem(key, value) {
            localStorage.setItem(key, value);
        },
        clearLocal() {
            localStorage.clear();
        },
        clearSession() {
            sessionStorage.clear();
        }
    };
}
