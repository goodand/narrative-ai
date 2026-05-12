/**
 * domRouterAdapter — projects core navigation state to DOM.
 *
 * Replaces `src/services/Router.js` rendering responsibilities. The core
 * `NavigationController` owns route state (current view, history); this
 * adapter applies all DOM side effects on each transition.
 *
 * Mapping (Router.js → here):
 *   - Hide all *View elements          (Router.js:25-31)
 *   - Toggle bottom-bar generate area  (Router.js:33-37)
 *   - Toggle main header visibility    (Router.js:39-44)
 *   - Tab active + Material Symbols    (Router.js:65-86)
 *   - Show target view                 (Router.js:88-100)
 *   - Trigger manager.render()         (Router.js:101-113)
 *   - Set header title                 (Router.js:115-118)
 *   - scrollTo(0, 0)                   (Router.js:52)
 *
 * Constraint: read-only with respect to core navigation state.
 */

const TAB_VIEWS = ['home', 'report', 'mypage'];
const MAIN_TAB_VIEWS = ['home', 'report', 'mypage', 'notice'];

const showView = (rootEls, viewName) => {
    Object.keys(rootEls).forEach((key) => {
        if (key.endsWith('View') && rootEls[key]) {
            rootEls[key].classList.add('hidden');
            rootEls[key].style.display = 'none';
        }
    });

    let target = null;
    if (viewName === 'home') target = rootEls.homeView;
    else if (viewName === 'input') target = rootEls.inputView;
    else if (viewName === 'report') target = rootEls.reportView;
    else if (viewName === 'mypage') target = rootEls.mypageView;
    else if (viewName === 'notice') target = rootEls.noticeView;
    else if (viewName === 'result') target = rootEls.resultView;

    if (target) {
        target.classList.remove('hidden');
        target.style.display = 'block';
    }
    return target;
};

const updateTabState = (rootEls, viewName) => {
    [rootEls.navHome, rootEls.navReport, rootEls.navMypage].forEach((nav) => {
        if (!nav) return;
        nav.classList.remove('text-primary');
        nav.classList.add('opacity-40');
        const icon = nav.querySelector('.material-symbols-outlined');
        if (icon) icon.style.fontVariationSettings = "'FILL' 0";
    });

    let activeNav = null;
    if (viewName === 'home' || viewName === 'input' || viewName === 'result') activeNav = rootEls.navHome;
    else if (viewName === 'report') activeNav = rootEls.navReport;
    else if (viewName === 'mypage') activeNav = rootEls.navMypage;

    if (activeNav) {
        activeNav.classList.add('text-primary');
        activeNav.classList.remove('opacity-40');
        const icon = activeNav.querySelector('.material-symbols-outlined');
        if (icon) icon.style.fontVariationSettings = "'FILL' 1";
    }
};

const setHeaderTitle = (rootEls, viewName) => {
    if (!rootEls.headerTitle) return;
    if (viewName === 'input') rootEls.headerTitle.innerText = '리코코 상세 기록 설정';
    else if (viewName === 'result') rootEls.headerTitle.innerText = '리코코 기록 결과';
};

const renderManager = (manager, viewName) => {
    if (!manager || typeof manager.render !== 'function') return;
    try {
        const result = manager.render();
        if (result && typeof result.catch === 'function') {
            result.catch((error) => {
                console.error(`[ROUTER] ${viewName} render failed:`, error);
            });
        }
    } catch (error) {
        console.error(`[ROUTER] ${viewName} render failed:`, error);
    }
};

/**
 * @param {{
 *   navigation: { subscribe: Function, getViewModel: Function },
 *   rootEls: Object,
 *   ensureManager?: (viewName: string) => Object|null
 * }} options
 * @returns {() => void} unsubscribe
 */
export function createDomRouterAdapter({ navigation, rootEls, ensureManager } = {}) {
    if (!navigation || !rootEls) return () => {};

    const apply = (currentView) => {
        if (!currentView) return;

        if (rootEls.bottomBar) {
            const genBtnContainer = rootEls.bottomBar.querySelector('div:first-child');
            if (genBtnContainer) {
                genBtnContainer.style.display = (currentView === 'input') ? 'block' : 'none';
            }
            rootEls.bottomBar.style.display = 'block';
        }

        if (rootEls.header) {
            const isMainTab = MAIN_TAB_VIEWS.includes(currentView);
            rootEls.header.style.display = isMainTab ? 'none' : 'flex';
        }

        updateTabState(rootEls, currentView);

        const targetEl = showView(rootEls, currentView);
        if (targetEl) {
            const manager = typeof ensureManager === 'function' ? ensureManager(currentView) : null;
            renderManager(manager, currentView);
            setHeaderTitle(rootEls, currentView);
        }

        if (typeof window !== 'undefined' && typeof window.scrollTo === 'function') {
            window.scrollTo(0, 0);
        }
    };

    const unsubscribe = navigation.subscribe((next) => {
        apply(next && next.currentView);
    });

    // Initial sync.
    const vm = navigation.getViewModel();
    apply(vm && vm.currentView);

    return unsubscribe;
}

// Re-export tab list for any caller that needs the canonical set.
export const NAVIGATION_TAB_VIEWS = TAB_VIEWS.slice();
