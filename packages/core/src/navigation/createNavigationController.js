/**
 * NavigationController — pure route state.
 *
 * See:
 *   - docs/refactor/headless-core-agent-instructions.md §6 Navigation controller
 *   - docs/refactor/slice-3-controller-mapping.md §3
 *
 * Owns ONLY route state and history. DOM display manipulation
 * (view show/hide, header visibility/title, tab fill, scroll reset) lives
 * in `src/ui/dom/domRouterAdapter.js` (slice 4+).
 *
 * Allowed view names: home, input, result, report, mypage, notice.
 *
 * @param {{ store: Object }} deps
 */
const ALLOWED_VIEWS = ['home', 'input', 'result', 'report', 'mypage', 'notice'];
const TAB_VIEWS = ['home', 'report', 'mypage'];

const tabActiveFor = (currentView) => {
    if (currentView === 'home' || currentView === 'input' || currentView === 'result') return 'home';
    if (currentView === 'report') return 'report';
    if (currentView === 'mypage') return 'mypage';
    return null;
};

const headerVisibleFor = (currentView) => {
    const isMainTab = ['home', 'report', 'mypage', 'notice'].includes(currentView);
    return !isMainTab;
};

const headerTitleFor = (currentView) => {
    if (currentView === 'input') return '리코코 상세 기록 설정';
    if (currentView === 'result') return '리코코 기록 결과';
    return '';
};

export function createNavigationController({ store } = {}) {
    const subscribers = new Set();

    const notifyNavigationChange = (next, prev) => {
        if (subscribers.size === 0) return;
        for (const cb of subscribers) {
            cb(next, prev);
        }
    };

    const isAllowed = (viewName) => ALLOWED_VIEWS.includes(viewName);

    return {
        navigate(viewName, options = {}) {
            if (!isAllowed(viewName)) return;

            const prev = store.get('navigation') || { currentView: 'home', history: ['home'] };
            const prevHistory = Array.isArray(prev.history) ? prev.history : ['home'];
            const replace = options && (options.replace === true || options.addToHistory === false);

            if (replace) {
                if (viewName === prev.currentView) return;
                store.patch({ navigation: { currentView: viewName, history: prevHistory } });
                notifyNavigationChange({ currentView: viewName, history: prevHistory }, prev);
                return;
            }

            if (viewName === prev.currentView) return;

            const nextHistory = [...prevHistory, viewName];
            store.patch({ navigation: { currentView: viewName, history: nextHistory } });
            notifyNavigationChange({ currentView: viewName, history: nextHistory }, prev);
        },

        goBack() {
            const prev = store.get('navigation') || { currentView: 'home', history: ['home'] };
            const prevHistory = Array.isArray(prev.history) ? prev.history : ['home'];

            if (prevHistory.length > 1) {
                const nextHistory = prevHistory.slice(0, -1);
                const nextView = nextHistory[nextHistory.length - 1];
                store.patch({ navigation: { currentView: nextView, history: nextHistory } });
                notifyNavigationChange({ currentView: nextView, history: nextHistory }, prev);
                return;
            }

            if (prev.currentView === 'home' && prevHistory.length === 1) return;

            store.patch({ navigation: { currentView: 'home', history: ['home'] } });
            notifyNavigationChange({ currentView: 'home', history: ['home'] }, prev);
        },

        getViewModel() {
            const navState = store.get('navigation') || { currentView: 'home', history: ['home'] };
            const currentView = navState.currentView || 'home';
            const history = Array.isArray(navState.history) ? navState.history : ['home'];
            const active = tabActiveFor(currentView);

            return {
                currentView,
                history: [...history],
                canGoBack: history.length > 1,
                tabs: {
                    active,
                    items: TAB_VIEWS.map((name) => ({ name, active: name === active }))
                },
                header: {
                    visible: headerVisibleFor(currentView),
                    title: headerTitleFor(currentView)
                }
            };
        },

        subscribe(callback) {
            if (typeof callback !== 'function') return () => {};
            subscribers.add(callback);
            return () => {
                subscribers.delete(callback);
            };
        }
    };
}
