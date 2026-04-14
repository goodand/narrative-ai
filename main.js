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
    header: document.querySelector('header'),
    headerTitle: document.getElementById('header-title'),
    backBtn: document.getElementById('back-btn'),
    bottomBar: document.getElementById('bottom-action-bar'),
    mypageView: document.getElementById('mypage-view'),
    noticeView: document.getElementById('notice-view')
};

// Initialize Router
const router = new Router(els);

// --- Component Initializations ---
const inputManager = new InputManager('input-view');

// SelectionGroup instances for sns and temp are no longer needed as they are removed from UI
// keeping them if they are used elsewhere, but ideally cleaning up if exclusively for input view

const suggestionModal = new SuggestionModal('suggestion-modal', 'suggestion-list');

// 유의어 선택 핸들러
function handleSuggestionSelect(suggestion, originalWord) {
    const currentResult = store.getState('currentResult');
    if (!currentResult) return;

    const newCaption = currentResult.original_caption.replace(originalWord, suggestion);
    currentResult.original_caption = newCaption;

    const keyword = currentResult.keywords.find(k => k.word === originalWord);
    if (keyword) {
        keyword.word = suggestion;
    }

    store.setResult(currentResult);
    resultViewer.renderCaption(currentResult);
}

const resultViewer = new ResultViewer({
    resultArea: 'result-view',
    interactiveCaption: 'caption-interactive',
    editCaption: 'caption-edit',
    editBtn: 'edit-btn',
    saveBtn: 'save-btn',
    copyBtn: 'copy-btn',
    shareBtn: 'share-btn',
    resultImage: 'result-image',
    onKeywordClick: (wordData) => {
        suggestionModal.renderSuggestions(wordData, handleSuggestionSelect);
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
            if (imageBase64) {
                await shareWithImage({ imageBase64, caption: captionText });
            } else {
                await shareCaption(captionText);
            }
        } catch (err) {
            handleError(err, 'Share');
        }
    }
});
const settingsModal = new SettingsModal('settings-modal', 'system-prompt-input');
const editConfirmModal = new ConfirmModal('edit-confirm-modal');

const permissionModal = new PermissionModal('permission-modal');
const authModal = new AuthModal('auth-modal');
const onboardingModal = new OnboardingModal('onboarding-modal', {
    onComplete: () => authModal.open('signup')
});

const homeManager = new HomeManager('home-view', {
    confirmModal: editConfirmModal,
    onPreciousClick: async () => {
        // 현재 사진의 ID를 가져와서 소비(Consume) 처리만 수행 (다음 버전에서 상세 설정을 사용함)
        const photoMeta = await homeManager.getCurrentPhotoMeta();
        if (photoMeta) {
            showToast("소중한 기억으로 기록되었습니다.", ErrorLevel.INFO);
            const photos = homeManager.photos || [];
            const targetIdx = photos.findIndex(p => p.id === photoMeta.assetId);
            if (targetIdx !== -1) {
                homeManager.consumePhoto(targetIdx);
            }
        }
    }
});
const reportManager = new ReportManager('report-view');
const mypageManager = new MyPageManager('mypage-view', { onLogout: () => window.location.reload() });
const noticeManager = new NoticeManager('notice-view');

// Register Managers to Router
router.registerManager('home', homeManager);
router.registerManager('report', reportManager);
router.registerManager('mypage', mypageManager);
router.registerManager('notice', noticeManager);
router.registerManager('input', inputManager);

// 뒤로가기 버튼 이벤트 연결
if (els.backBtn) {
    els.backBtn.onclick = () => router.goBack();
}

els.navHome.onclick = () => router.navigate('home');
els.navReport.onclick = () => router.navigate('report');
els.navMypage.onclick = () => router.navigate('mypage');

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
        authModal.close();
        onboardingModal.element.classList.add('hidden');
        permissionModal.onComplete = () => {
            router.navigate('home');
            if (localStorage.getItem('notificationEnabled') === 'true') {
                scheduleDailyNotification();
            }
        };
        permissionModal.checkAndOpen();
    } else if (event === 'SIGNED_OUT') {
        onboardingModal.open();
    }
});

function setLoading(isLoading) {
    // Current version focus (Daily Curation) manages loading in individual managers
}

/**
 * App Initialization
 */
async function initApp() {
    store.checkAndResetDaily();
    setupActionListener(router);

    const launchUrl = await App.getLaunchUrl();
    if (launchUrl?.url) await handleUrl(launchUrl.url);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        onboardingModal.open();
    } else {
        onboardingModal.element.classList.add('hidden');
        authModal.close();
        permissionModal.onComplete = () => {
            router.navigate('home');
            if (localStorage.getItem('notificationEnabled') === 'true') {
                scheduleDailyNotification();
            }
        };
        permissionModal.checkAndOpen();
    }
}

initApp();
