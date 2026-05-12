/**
 * createDomApp — DOM application composition.
 *
 * Decisions:
 *   slice-4 #1 A3 — pure additive integration (auth/notifications via core).
 *   slice-4 #4 A  — reactors live inline here.
 *   slice-4 #6 A  — lazy manager pattern preserved.
 *   slice-5 #3 C  — components receive `{ core }` and call controllers.
 *   slice-5 #4 B  — domain reactors here trigger UI side effects.
 *   slice-5 #5 C  — HomeController owns daily-curation load on permission
 *                   false→true; createDomApp does NOT bridge that anymore.
 *   slice-6 H1    — destroy() iterates eager + lazy + modals and calls
 *                   component-side destroy() when present (subscription leak fix).
 *   slice-6 H2    — boot error capture is injected via `bootErrors` callback;
 *                   createDomApp does NOT touch `window.*` directly anymore.
 *   slice-6 M4    — SettingsModal removed (unused after slice 5e).
 *   slice-6 M5    — toast subscription covers all nine controller domains.
 *
 * Constraints:
 *   - May import core, sibling DOM adapters (domEvents, domRouterAdapter,
 *     toastPresenter), and the converted DOM-only components.
 *   - Must NOT import platform packages, supabase, ShareService, or other
 *     service files directly.
 */

import { InputManager } from '../../components/InputManager.js';
import { ResultViewer } from '../../components/ResultViewer.js';
import { SuggestionModal, ConfirmModal } from '../../components/Modal.js';
import { OnboardingModal } from '../../components/OnboardingModal.js';
import { AuthModal } from '../../components/AuthModal.js';
import { PermissionModal } from '../../components/PermissionModal.js';
import { HomeManager } from '../../components/HomeManager.js';
import { MyPageManager } from '../../components/MyPageManager.js';
import { ReportManager } from '../../components/ReportManager.js';
import { NoticeManager } from '../../components/NoticeManager.js';

import { createDomRouterAdapter } from './domRouterAdapter.js';
import { bindBottomTabs, bindBackButton, bindNavChange } from './domEvents.js';
import { subscribeCoreErrors } from './toastPresenter.js';

const TOAST_DOMAINS = [
    'auth',
    'permissions',
    'notifications',
    'account',
    'home',
    'input',
    'result',
    'report'
];

const makeSafeInit = (bootErrors) => (name, factory) => {
    try {
        console.log(`[BOOT] Initializing ${name}...`);
        const instance = factory();
        console.log(`[BOOT] ${name} initialized successfully.`);
        return instance;
    } catch (err) {
        console.error(`[BOOT] ${name} failed to initialize:`, err);
        if (bootErrors && typeof bootErrors === 'object') {
            bootErrors[name] = err && err.message ? err.message : String(err);
        }
        return null;
    }
};

const tryDestroy = (instance) => {
    if (!instance) return;
    if (typeof instance.destroy === 'function') {
        try { instance.destroy(); } catch (_) { /* swallow */ }
    }
};

/**
 * @param {{
 *   core: Object,
 *   rootEls: Object,
 *   bootErrors?: Object
 * }} deps
 * @returns {{
 *   destroy: () => void,
 *   getManager: (name: string) => Object|null,
 *   bootErrors: Object
 * }}
 */
export function createDomApp({ core, rootEls, bootErrors = {} } = {}) {
    if (!core || !rootEls) {
        throw new Error('createDomApp: core and rootEls are required');
    }

    const teardowns = [];
    const safeInit = makeSafeInit(bootErrors);

    // --- Eager modals + home ---
    const permissionModal = safeInit('permissionModal', () => new PermissionModal('permission-modal', { core }));
    const editConfirmModal = safeInit('editConfirmModal', () => new ConfirmModal('edit-confirm-modal'));
    const authModal = safeInit('authModal', () => new AuthModal('auth-modal', { core }));
    const onboardingModal = safeInit('onboardingModal', () => new OnboardingModal('onboarding-modal', {
        onComplete: () => authModal?.open('signup')
    }));

    const homeManager = safeInit('homeManager', () => new HomeManager('home-view', {
        core,
        confirmModal: editConfirmModal
    }));

    // --- Lazy factories ---
    const managerFactories = {
        report: () => new ReportManager('report-view', { core }),
        mypage: () => new MyPageManager('mypage-view', {
            core,
            onLogout: () => {
                if (typeof window !== 'undefined') window.location.reload();
            }
        }),
        notice: () => new NoticeManager('notice-view', { core }),
        input: () => new InputManager('input-view', { core }),
        result: () => new ResultViewer({
            core,
            resultArea: 'result-view',
            interactiveCaption: 'caption-interactive',
            editCaption: 'caption-edit',
            editBtn: 'edit-btn',
            saveBtn: 'save-btn',
            copyBtn: 'copy-btn',
            shareBtn: 'share-btn',
            resultImage: 'result-image',
            onKeywordSelected: async (word) => {
                if (!word) return;
                const sm = getSuggestionModal();
                if (!sm) return;
                const alternatives = await core.result.loadSynonyms(word);
                sm.renderSuggestions({ word, alternatives }, (suggestion, originalWord) => {
                    core.result.replaceKeyword({ originalWord, suggestion });
                    const viewer = getManager('result');
                    if (viewer) viewer.renderCaption();
                });
            }
        })
    };

    const lazyModals = {
        suggestionModal: () => new SuggestionModal('suggestion-modal', 'suggestion-list')
    };

    const managers = {};
    const modals = {};

    if (homeManager) managers.home = homeManager;

    function getManager(name) {
        if (managers[name]) return managers[name];
        if (managerFactories[name]) {
            console.log(`[BOOT-LAZY] Lazily initializing manager: ${name}`);
            managers[name] = safeInit(name, managerFactories[name]);
            return managers[name];
        }
        return null;
    }

    function getSuggestionModal() {
        if (modals.suggestionModal) return modals.suggestionModal;
        console.log('[BOOT-LAZY] Lazily initializing Modal: suggestionModal');
        modals.suggestionModal = safeInit('suggestionModal', lazyModals.suggestionModal);
        return modals.suggestionModal;
    }

    // --- DOM router adapter (replaces Router.js render side-effects) ---
    const unsubRouter = createDomRouterAdapter({
        navigation: core.navigation,
        rootEls,
        ensureManager: getManager
    });
    teardowns.push(unsubRouter);

    // --- DOM event bindings ---
    teardowns.push(bindBottomTabs({ rootEls, navigation: core.navigation, ensureManager: getManager }));
    teardowns.push(bindBackButton({ rootEls, navigation: core.navigation }));
    teardowns.push(bindNavChange({ navigation: core.navigation, ensureManager: getManager }));

    // --- Auth reactor: observe store.auth.status transitions ---
    let prevAuthStatus = null;
    const unsubAuthReactor = core.store.subscribe((next) => {
        const auth = next && next.auth;
        if (!auth) return;
        const status = auth.status;
        if (status === prevAuthStatus) return;
        const wasStatus = prevAuthStatus;
        prevAuthStatus = status;

        if (status === 'signed_in' && wasStatus !== 'signed_in') {
            authModal?.close();
            onboardingModal?.element?.classList?.add('hidden');
            core.navigation.navigate('home');
            permissionModal?.checkAndOpen();
        } else if (status === 'signed_out' && wasStatus !== null && wasStatus !== 'signed_out') {
            onboardingModal?.open();
        } else if (status === 'signed_out' && wasStatus === null) {
            // Initial restore resolved with no session.
            onboardingModal?.open();
        }
    });
    teardowns.push(unsubAuthReactor);

    // --- Core error toast subscription (all controller domains) ---
    teardowns.push(subscribeCoreErrors({ store: core.store, domains: TOAST_DOMAINS }));

    return {
        getManager,
        bootErrors,
        destroy() {
            // Component destroy first (releases store subscriptions),
            // then teardown adapter/event subscriptions.
            tryDestroy(permissionModal);
            tryDestroy(editConfirmModal);
            tryDestroy(authModal);
            tryDestroy(onboardingModal);
            tryDestroy(homeManager);

            for (const name of Object.keys(managers)) {
                if (managers[name] !== homeManager) tryDestroy(managers[name]);
                delete managers[name];
            }
            for (const name of Object.keys(modals)) {
                tryDestroy(modals[name]);
                delete modals[name];
            }

            while (teardowns.length) {
                const fn = teardowns.pop();
                try { if (typeof fn === 'function') fn(); } catch (_) { /* swallow */ }
            }
        }
    };
}
