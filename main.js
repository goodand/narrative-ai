/**
 * RECOCO - Narrative AI Application
 * Entry point that orchestrates all modules
 */

import './style.css';

// Constants
import { UI_MESSAGES, DEFAULT_SYSTEM_PROMPT } from './src/constants/config.js';

// Error Handling
import { handleError, showToast, ErrorLevel } from './src/utils/errorHandler.js';

// State Management
import { StateManager, store } from './src/state/StateManager.js';

// Services
import { GeminiService } from './src/services/GeminiService.js';
import { supabase } from './src/services/supabase.js';
import { Router } from './src/services/Router.js';
import { photoService } from './src/services/PhotoService.js';

// Capacitor Plugins
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { scheduleDailyNotification, setupActionListener } from './src/services/NotificationService.js';

// Components
import { InputManager } from './src/components/InputManager.js';
import { SelectionGroup } from './src/components/SelectionGroup.js';
import { ResultViewer } from './src/components/ResultViewer.js';
import { SuggestionModal, SettingsModal, ConfirmModal } from './src/components/Modal.js';
import { OnboardingModal } from './src/components/OnboardingModal.js';
import { AuthModal } from './src/components/AuthModal.js';
import { PermissionModal } from './src/components/PermissionModal.js';
import { HomeManager } from './src/components/HomeManager.js';
import { MyPageManager } from './src/components/MyPageManager.js';
import { ReportManager } from './src/components/ReportManager.js';
import { NoticeManager } from './src/components/NoticeManager.js';

// Initialize Core Services
const geminiService = new GeminiService();

// Global Manager References (declared early to avoid ReferenceErrors)
let homeManager, reportManager, mypageManager, noticeManager;
let inputManager, resultViewer, suggestionModal, settingsModal, editConfirmModal;
let permissionModal, authModal, onboardingModal;

// Failure Tracking
window.__bootErrors = {};

/**
 * safeInit - Initializes a component safely and tracks failures
 */
function safeInit(name, factory) {
    try {
        console.log(`[BOOT] Initializing ${name}...`);
        const instance = factory();
        console.log(`[BOOT] ${name} initialized successfully.`);
        return instance;
    } catch (err) {
        console.error(`[BOOT] ${name} failed to initialize:`, err);
        window.__bootErrors[name] = err.message;
        return null;
    }
}

/**
 * Handle Deep Links (OAuth Callback)
 */
const handleUrl = async (urlStr) => {
    console.log('[DEEPLINK] Incoming URL:', urlStr);
    if (!urlStr) return;

    // 딥링크 수신 직후 네이티브 레이어가 준비될 시간을 잠시 줌 (iOS 안정성 확보)
    await new Promise(resolve => setTimeout(resolve, 150));

    // 딥링크가 들어오면 우선 브라우저를 닫음 (성공 여부 상관없이 UX 우선 처리)
    try { await Browser.close(); } catch (e) {}

    try {
        let accessToken = null;
        let refreshToken = null;
        let code = null;

        // URL에서 토큰 및 코드 파싱
        const parts = urlStr.split(/[#?&]/);
        parts.forEach(part => {
            if (part.startsWith('access_token=')) accessToken = part.split('=')[1];
            if (part.startsWith('refresh_token=')) refreshToken = part.split('=')[1];
            if (part.startsWith('code=')) code = part.split('=')[1];
        });

        if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken
            });
            if (error) throw error;
            console.log('[DEEPLINK] Session set successfully');
        } else if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) throw error;
            console.log('[DEEPLINK] Code exchange successful');
        }
    } catch (err) {
        handleError(err, 'Auth', { silent: true });
    }
};

App.addListener('appUrlOpen', (data) => {
    handleUrl(data.url);
});

// Re-register notifications when app returns to foreground (iOS reboot recovery)
App.addListener('appStateChange', ({ isActive }) => {
    if (isActive && localStorage.getItem('notificationEnabled') === 'true') {
        scheduleDailyNotification();
    }
});

// DOM Elements
const els = {
    navHome: document.getElementById('nav-home'),
    navReport: document.getElementById('nav-report'),
    navMypage: document.getElementById('nav-mypage'),
    homeView: document.getElementById('home-view'),
    reportView: document.getElementById('report-view'),
    inputView: document.getElementById('input-view'),
    resultView: document.getElementById('result-view'),
    header: document.querySelector('header'),
    headerTitle: document.getElementById('header-title'),
    backBtn: document.getElementById('back-btn'),
    bottomBar: document.getElementById('bottom-action-bar'),
    mypageView: document.getElementById('mypage-view'),
    noticeView: document.getElementById('notice-view')
};

// Initialize Router
console.log('[BOOT] Initializing elements and router...');
const router = new Router(els);

// --- Component Initializations ---

// 1. Critical Modals & Core Managers (Needed for first frame)
permissionModal = safeInit('permissionModal', () => new PermissionModal('permission-modal'));
editConfirmModal = safeInit('editConfirmModal', () => new ConfirmModal('edit-confirm-modal'));
authModal = safeInit('authModal', () => new AuthModal('auth-modal'));
onboardingModal = safeInit('onboardingModal', () => new OnboardingModal('onboarding-modal', {
    onComplete: () => authModal?.open('signup')
}));

homeManager = safeInit('homeManager', () => new HomeManager('home-view', {
    confirmModal: editConfirmModal,
    onPreciousClick: async () => {
        const photoMeta = await homeManager.getCurrentPhotoMeta();
        if (photoMeta) {
            showToast("소중한 기억으로 기록되었습니다.", ErrorLevel.INFO);
            const photos = homeManager.photos || [];
            const targetIdx = photos.findIndex(p => p.id === photoMeta.assetId);
            if (targetIdx !== -1) homeManager.consumePhoto(targetIdx);
        }
    }
}));

// 2. Register Initial Critical Managers
if (homeManager) router.registerManager('home', homeManager);

// 3. Lazy Manager Factories (Initialized on first navigation)
const managerFactories = {
    report: () => new ReportManager('report-view'),
    mypage: () => new MyPageManager('mypage-view', { onLogout: () => window.location.reload() }),
    notice: () => new NoticeManager('notice-view'),
    input: () => new InputManager('input-view'),
    result: () => {
        return new ResultViewer({
            resultArea: 'result-view',
            interactiveCaption: 'caption-interactive',
            editCaption: 'caption-edit',
            editBtn: 'edit-btn',
            saveBtn: 'save-btn',
            copyBtn: 'copy-btn',
            shareBtn: 'share-btn',
            resultImage: 'result-image',
            onKeywordClick: (wordData) => {
                const suggestionModal = getSuggestionModal();
                if (suggestionModal) suggestionModal.renderSuggestions(wordData, (s, o) => {
                    const currentResult = store.getState('currentResult');
                    if (!currentResult) return;
                    currentResult.original_caption = currentResult.original_caption.replace(o, s);
                    const keyword = currentResult.keywords.find(k => k.word === o);
                    if (keyword) keyword.word = s;
                    store.setResult(currentResult);
                    const viewer = getManager('result');
                    if (viewer) viewer.renderCaption(currentResult);
                });
            },
            onSave: (newText) => {
                const currentResult = store.getState('currentResult');
                if (currentResult) {
                    currentResult.original_caption = newText;
                    store.setResult(currentResult);
                }
            },
            onShare: async (captionText) => {
                try {
                    const { shareWithImage, shareCaption } = await import('./src/services/ShareService.js');
                    const imageBase64 = store.getState('base64');
                    if (imageBase64) await shareWithImage({ imageBase64, caption: captionText });
                    else await shareCaption(captionText);
                } catch (err) { handleError(err, 'Share'); }
            }
        });
    }
};

const lazyModals = {
    suggestionModal: () => new SuggestionModal('suggestion-modal', 'suggestion-list'),
    settingsModal: () => new SettingsModal('settings-modal', 'system-prompt-input')
};

const managers = {};
const modals = {};

function getManager(name) {
    if (managers[name]) return managers[name];
    if (managerFactories[name]) {
        console.log(`[BOOT-LAZY] Lazily initializing manager: ${name}`);
        managers[name] = safeInit(name, managerFactories[name]);
        if (managers[name]) router.registerManager(name, managers[name]);
        return managers[name];
    }
    return null;
}

function getSuggestionModal() {
    if (modals.suggestionModal) return modals.suggestionModal;
    console.log(`[BOOT-LAZY] Lazily initializing Modal: suggestionModal`);
    modals.suggestionModal = safeInit('suggestionModal', lazyModals.suggestionModal);
    return modals.suggestionModal;
}

// 4. Update Event Listeners to use Lazy Getters
if (els.navHome) els.navHome.onclick = () => router.navigate('home');
if (els.navReport) els.navReport.onclick = () => {
    getManager('report');
    router.navigate('report');
};
if (els.navMypage) els.navMypage.onclick = () => {
    getManager('mypage');
    router.navigate('mypage');
};

// --- View Redirection for Notice ---
window.addEventListener('nav-change', (e) => {
    if (e.detail) {
        if (managerFactories[e.detail]) getManager(e.detail);
        router.navigate(e.detail);
    }
});

// --- Utility Functions ---

function handleSuggestionSelect(suggestion, originalWord) {
    const currentResult = store.getState('currentResult');
    if (!currentResult) return;

    const newCaption = currentResult.original_caption.replace(originalWord, suggestion);
    currentResult.original_caption = newCaption;

    const keyword = currentResult.keywords.find(k => k.word === originalWord);
    if (keyword) keyword.word = suggestion;

    store.setResult(currentResult);
    if (resultViewer) resultViewer.renderCaption(currentResult);
}

const navigateToHome = () => {
    console.log('[BOOT] Navigating to home shell...');
    router.navigate('home');
    // render() side-effect removal requires explicit load here
    if (homeManager && homeManager.photos.length === 0) {
        homeManager.loadRealPhotos();
    }
};

// 뒤로가기 버튼 이벤트 연결
if (els.backBtn) {
    els.backBtn.onclick = () => router.goBack();
}

if (els.navHome) els.navHome.onclick = () => router.navigate('home');
if (els.navReport) els.navReport.onclick = () => router.navigate('report');
if (els.navMypage) els.navMypage.onclick = () => router.navigate('mypage');

// MyPageManager의 뒤로가기 이벤트 처리
window.addEventListener('nav-change', (e) => {
    if (e.detail) router.navigate(e.detail);
});

/**
 * Handle Auth State Changes
 */
supabase.auth.onAuthStateChange((event, session) => {
    console.log(`[AUTH] Event: ${event}`);
    if (event === 'SIGNED_IN') {
        authModal?.close();
        onboardingModal?.element?.classList?.add('hidden');
        
        // Post-login/signup always unblocks to home, permission check is parallel
        navigateToHome();
        permissionModal?.checkAndOpen();
    } else if (event === 'SIGNED_OUT') {
        onboardingModal?.open();
    }
});

function setLoading(isLoading) {
    // Current version focus (Daily Curation) manages loading in individual managers
}

/**
 * App Initialization
 */
async function initApp() {
    console.log('[BOOT] Starting initApp...');
    try {
        store.checkAndResetDaily();
        setupActionListener(router);

        const launchUrl = await App.getLaunchUrl();
        if (launchUrl?.url) await handleUrl(launchUrl.url);

        const { data: { session } } = await supabase.auth.getSession();
        console.log('[BOOT] Initial session check:', session ? 'Found' : 'Not Found');

        if (!session) {
            onboardingModal?.open();
        } else {
            // Already logged in: unblock view first, then handle permissions in parallel
            navigateToHome();
            
            if (localStorage.getItem('notificationEnabled') === 'true') {
                scheduleDailyNotification();
            }
            
            // Trigger permission flow but don't block navigation
            permissionModal?.checkAndOpen();
        }
    } catch (err) {
        console.error('[BOOT] Critical initApp failure:', err);
        navigateToHome();
    }
}

initApp();
