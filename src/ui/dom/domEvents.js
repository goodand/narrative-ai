/**
 * domEvents — DOM event binding for slice 4+.
 *
 * Owns:
 *   - Bottom tab clicks (home/report/mypage)
 *   - Back button click
 *   - Legacy `nav-change` CustomEvent listener proxy
 *   - `dispatchNavChange` helper for legacy components that still emit it
 *
 * Source mapping: main.js:257-274, main.js:302-305 (legacy bindings).
 *
 * Constraint: must NOT import components, ports, services, or core controllers.
 * It only consumes a `navigation` controller and an optional `ensureManager`
 * hook for lazy view construction.
 */

const ALLOWED_VIEW_NAMES = new Set(['home', 'input', 'result', 'report', 'mypage', 'notice']);

export function dispatchNavChange(viewName) {
    if (!viewName) return;
    if (typeof window === 'undefined' || typeof CustomEvent !== 'function') return;
    window.dispatchEvent(new CustomEvent('nav-change', { detail: viewName }));
}

export function bindNavChange({ navigation, ensureManager } = {}) {
    if (!navigation || typeof window === 'undefined') return () => {};
    const handler = (e) => {
        const detail = e && e.detail;
        if (!detail || !ALLOWED_VIEW_NAMES.has(detail)) return;
        if (typeof ensureManager === 'function') ensureManager(detail);
        navigation.navigate(detail);
    };
    window.addEventListener('nav-change', handler);
    return () => window.removeEventListener('nav-change', handler);
}

export function bindBottomTabs({ rootEls, navigation, ensureManager } = {}) {
    if (!rootEls || !navigation) return () => {};

    const bindings = [];
    const wire = (el, viewName, lazy) => {
        if (!el) return;
        const handler = () => {
            if (lazy && typeof ensureManager === 'function') ensureManager(viewName);
            navigation.navigate(viewName);
        };
        el.onclick = handler;
        bindings.push(() => {
            if (el.onclick === handler) el.onclick = null;
        });
    };

    wire(rootEls.navHome, 'home', false);
    wire(rootEls.navReport, 'report', true);
    wire(rootEls.navMypage, 'mypage', true);

    return () => bindings.forEach((fn) => fn());
}

export function bindBackButton({ rootEls, navigation } = {}) {
    if (!rootEls || !navigation) return () => {};
    const el = rootEls.backBtn;
    if (!el) return () => {};
    const handler = () => navigation.goBack();
    el.onclick = handler;
    return () => {
        if (el.onclick === handler) el.onclick = null;
    };
}
