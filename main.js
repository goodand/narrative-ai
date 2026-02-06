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

// Capacitor Plugins
import { App } from '@capacitor/app';
import { scheduleDailyNotification, setupActionListener } from './src/services/NotificationService.js';

// Components
import { DropZone } from './src/components/DropZone.js';
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
    genBtn: document.getElementById('generate-btn'),
    btnText: document.getElementById('btn-text'),
    loader: document.getElementById('btn-loader'),
    meaningInput: document.getElementById('meaning-input'),
    tagsInput: document.getElementById('tags-input'),
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
const router = new Router(els);

// --- Component Initializations ---
const dropZone = new DropZone({
    dropZone: 'drop-zone', input: 'image-input', preview: 'image-preview', container: 'preview-container', placeholder: 'upload-placeholder',
    metaElements: { date: 'meta-date', gps: 'meta-gps' },
    onFileLoaded: (data) => {
        store.setState('base64', data.base64);
        store.setState('dataUrl', data.dataUrl);
        store.setState('metadata', data.metadata);
    }
});

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
    onPreciousClick: async () => {
        // 선택된 사진을 input-view에 표시
        const currentPhoto = await homeManager.getCurrentImageAsFile(); // PhotoService 활용
        const meta = homeManager.getCurrentPhotoMeta();
        
        // 이미지 프리뷰에 직접 표시
        const previewImg = document.getElementById('image-preview');
        const previewContainer = document.getElementById('preview-container');
        const uploadPlaceholder = document.getElementById('upload-placeholder');

        if (previewImg && currentPhoto) {
            // File -> DataURL 변환
            const reader = new FileReader();
            reader.onload = (e) => {
                const dataUrl = e.target.result;
                previewImg.src = dataUrl;
                previewContainer?.classList.remove('hidden');
                uploadPlaceholder?.classList.add('hidden');

                const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
                store.setState('dataUrl', dataUrl);
                store.setState('base64', base64);
                store.setState('metadata', meta);
            };
            reader.readAsDataURL(currentPhoto);
        }
        router.navigate('input');
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

/**
 * Generate Button Click Handler
 */
els.genBtn.onclick = async () => {
    const imageData = store.getState('base64') || store.getState('dataUrl');
    if (!imageData) {
        showToast(UI_MESSAGES.ERROR_NO_IMAGE, ErrorLevel.WARN);
        return;
    }

    setLoading(true);

    const context = {
        sns: 'Instagram', // Default
        mood: 'emotional', // Default
        temp: 'Lukewarm', // Default
        language: 'Korean', // Default
        meaning: els.meaningInput?.value?.trim() || '', // New field
        tags: els.tagsInput?.value?.trim() || '',
        activity: '',
        bodyState: '',
        relationship: '',
        metadata: store.getState('metadata'),
        systemPrompt: store.getState('systemPrompt')
    };

    try {
        const storyResult = await geminiService.generateStory(imageData, context);
        els.btnText.innerText = UI_MESSAGES.FINDING_SYNONYMS;

        const keywordsWithSuggestions = await geminiService.getSynonyms(
            storyResult.keywords,
            context.language
        );

        const metadata = store.getState('metadata');
        const displayImage = store.getState('dataUrl');

        const result = {
            original_caption: storyResult.original_caption,
            keywords: keywordsWithSuggestions,
            image: displayImage,
            metadata: metadata
        };
        store.setResult(result);

        router.navigate('result');
        // Router handles visibility, but Input View specific hiding might be needed if Router doesn't cover it
        // Router.navigate hides all views including inputView, so this is handled.
        
        els.header.classList.remove('hidden');
        els.headerTitle.innerText = '리코코 기록 결과';

        const resultDate = document.getElementById('result-date');
        const resultLoc = document.getElementById('result-location');
        if (resultDate && metadata?.date) resultDate.innerText = metadata.date;
        if (resultLoc && metadata?.gps) resultLoc.innerText = metadata.gps.formatted;

        resultViewer.show();
        resultViewer.renderCaption(result);
        resultViewer.scrollIntoView();

    } catch (error) {
        handleError(error, 'AI');
    } finally {
        setLoading(false);
    }
};

function setLoading(isLoading) {
    els.genBtn.disabled = isLoading;
    els.loader?.classList.toggle('hidden', !isLoading);
    els.btnText.innerText = isLoading ? UI_MESSAGES.LOADING : UI_MESSAGES.GENERATE_BUTTON;
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