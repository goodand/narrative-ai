/**
 * toastPresenter — DOM toast surface for slice 4+.
 *
 * The only adapter-layer file allowed to import legacy `showToast`/`ErrorLevel`.
 * Components and services keep their own direct `handleError` calls during
 * slice 3-5 per instructions §13 (legacy compat). Slice 5 will route
 * components through this presenter.
 */

import { showToast, ErrorLevel } from '../../utils/errorHandler.js';

export { ErrorLevel };

/**
 * Thin wrapper around legacy showToast.
 * @param {string} message
 * @param {string} [level=ErrorLevel.INFO]
 */
export function presentToast(message, level = ErrorLevel.INFO) {
    if (!message) return;
    showToast(message, level);
}

/**
 * Subscribe to normalized error fields on selected store domains and surface
 * one toast per `{context,code,message}` change. Returns an unsubscribe.
 *
 * @param {{
 *   store: Object,
 *   domains?: string[]
 * }} options
 */
export function subscribeCoreErrors({ store, domains = ['auth', 'notifications'] } = {}) {
    if (!store || typeof store.subscribe !== 'function') return () => {};

    const last = new Map();

    const readError = (state, domain) => {
        const slice = state && state[domain];
        if (!slice || typeof slice !== 'object') return null;
        if (domain === 'permissions') {
            const photo = slice.photo;
            return photo && photo.reason ? { message: null, context: 'permissions', code: photo.reason } : null;
        }
        return slice.error || null;
    };

    const fingerprint = (err) => {
        if (!err) return '';
        return `${err.context || ''}|${err.code || ''}|${err.message || ''}`;
    };

    return store.subscribe((nextState) => {
        for (const domain of domains) {
            const err = readError(nextState, domain);
            const fp = fingerprint(err);
            if (last.get(domain) === fp) continue;
            last.set(domain, fp);
            if (err && err.message) {
                presentToast(err.message, ErrorLevel.ERROR);
            }
        }
    });
}
