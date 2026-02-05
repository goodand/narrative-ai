/**
 * RECOCO - Narrative AI Application
 * Entry point that orchestrates all modules
 */

import './style.css';

// Constants
import { UI_MESSAGES, DEFAULT_SYSTEM_PROMPT } from './src/constants/config.js';

// State Management
import { StateManager, store } from './src/state/StateManager.js';

// Services
import { GeminiService } from './src/services/GeminiService.js';
import { supabase } from './src/services/supabase.js';

// Capacitor Plugins
import { App } from '@capacitor/app';

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
        console.error('[DEEPLINK] Error:', err);
    }
};

App.addListener('appUrlOpen', (data) => {
    handleUrl(data.url);
});

// DOM Elements
const els = {
    genBtn: document.getElementById('generate-btn'),
    btnText: document.getElementById('btn-text'),
    loader: document.getElementById('btn-loader'),
    error: document.getElementById('error-msg'),
    lang: document.getElementById('language-select'),
    style: document.getElementById('style-select'),
    tagsInput: document.getElementById('tags-input'),
    activity: document.getElementById('activity-select'),
    bodyState: document.getElementById('body-state-select'),
    relationship: document.getElementById('relationship-select'),
    navHome: document.getElementById('nav-home'),
    navReport: document.getElementById('nav-report'),
    navMypage: document.getElementById('nav-mypage'),
    homeView: document.getElementById('home-view'),
    reportView: document.getElementById('report-view'),
    inputView: document.getElementById('input-view'),
    resultView: document.getElementById('result-view'),
    header: document.querySelector('header'),
    headerTitle: document.getElementById('header-title'),
    bottomBar: document.getElementById('bottom-action-bar')
};

// Components Initializations
const dropZone = new DropZone({
    dropZone: 'drop-zone', input: 'image-input', preview: 'image-preview', container: 'preview-container', placeholder: 'upload-placeholder',
    metaElements: { date: 'meta-date', gps: 'meta-gps' },
    onFileLoaded: (data) => {
        store.setState('base64', data.base64);
        store.setState('dataUrl', data.dataUrl);
        store.setState('metadata', data.metadata);
    }
});

const snsGroup = new SelectionGroup({ container: '.sns-grid', itemSelector: '.sns-item', activeClass: 'bg-primary text-white rounded-xl text-xs font-semibold sns-item active', inactiveClass: 'bg-field-bg text-muted-lavender rounded-xl text-xs font-semibold sns-item' });
const tempGroup = new SelectionGroup({ container: '#temp-toggle-group', itemSelector: 'button', activeClass: 'bg-white/10 shadow-sm', inactiveClass: 'hover:bg-white/5' });
const resultViewer = new ResultViewer({ resultArea: 'result-view', interactiveCaption: 'caption-interactive', editCaption: 'caption-edit', editBtn: 'edit-btn', saveBtn: 'save-btn', copyBtn: 'copy-btn', shareBtn: 'share-btn', resultImage: 'result-image' });

const suggestionModal = new SuggestionModal('suggestion-modal', 'suggestion-list');
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
        const currentPhoto = homeManager.curationPhotos[homeManager.currentIndex];
        if (currentPhoto) {
            // 이미지 프리뷰에 직접 표시
            const previewImg = document.getElementById('image-preview');
            const previewContainer = document.getElementById('preview-container');
            const uploadPlaceholder = document.getElementById('upload-placeholder');

            if (previewImg && currentPhoto.imageUrl) {
                previewImg.src = currentPhoto.imageUrl;
                previewContainer?.classList.remove('hidden');
                uploadPlaceholder?.classList.add('hidden');

                // Store에 데이터 저장
                store.setState('dataUrl', currentPhoto.imageUrl);
                store.setState('metadata', homeManager.getCurrentPhotoMeta());
            }
        }
        showView('input');
    }
});
const reportManager = new ReportManager('report-view');
const mypageContainer = document.createElement('div');
mypageContainer.id = 'mypage-view';
mypageContainer.className = 'hidden min-h-screen bg-dark-bg';
document.body.appendChild(mypageContainer);
const mypageManager = new MyPageManager('mypage-view', { onLogout: () => window.location.reload() });

function showView(viewName) {
    els.homeView.classList.add('hidden');
    els.reportView.classList.add('hidden');
    els.inputView.classList.add('hidden');
    els.resultView.classList.add('hidden');
    mypageContainer.classList.add('hidden');
    
    if (viewName === 'home') {
        authModal.close();
        onboardingModal.element.classList.add('hidden');
        permissionModal.element.classList.add('hidden');
    }

    els.header.classList.toggle('hidden', viewName === 'mypage' || viewName === 'home' || viewName === 'report');
    els.bottomBar.classList.toggle('hidden', viewName === 'mypage');

    if (viewName === 'home') { els.homeView.classList.remove('hidden'); homeManager.render(); }
    else if (viewName === 'report') { els.reportView.classList.remove('hidden'); reportManager.render(); }
    else if (viewName === 'input') { els.inputView.classList.remove('hidden'); }
    else if (viewName === 'mypage') { mypageContainer.classList.remove('hidden'); mypageManager.render(); }
}

els.navHome.onclick = () => showView('home');
els.navReport.onclick = () => showView('report');
els.navMypage.onclick = () => showView('mypage');

/**
 * Handle Auth State Changes
 */
supabase.auth.onAuthStateChange((event, session) => {
    console.log(`[AUTH] Event: ${event}`);
    if (event === 'SIGNED_IN') {
        authModal.close();
        onboardingModal.element.classList.add('hidden');
        permissionModal.onComplete = () => showView('home');
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
        showError(UI_MESSAGES.ERROR_NO_IMAGE);
        return;
    }

    setLoading(true);

    const context = {
        sns: store.getPreference('sns') || snsGroup.getValue() || 'Instagram',
        mood: els.style?.value || 'casual',
        temp: store.getPreference('temp') || tempGroup.getValue() || 'Lukewarm',
        language: els.lang?.value || 'Korean',
        tags: els.tagsInput?.value?.trim() || '',
        activity: els.activity?.value || '',
        bodyState: els.bodyState?.value || '',
        relationship: els.relationship?.value || '',
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

        showView('result');
        els.inputView.classList.add('hidden');
        els.resultView.classList.remove('hidden');
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
        showError('AI 생성 중 오류 발생: ' + error.message);
        console.error('Generation error:', error);
    } finally {
        setLoading(false);
    }
};

function setLoading(isLoading) {
    els.genBtn.disabled = isLoading;
    els.loader?.classList.toggle('hidden', !isLoading);
    els.btnText.innerText = isLoading ? UI_MESSAGES.LOADING : UI_MESSAGES.GENERATE_BUTTON;
}

function showError(message) {
    els.error.innerText = message;
    els.error.classList.remove('hidden');
    setTimeout(() => els.error.classList.add('hidden'), 5000);
}

/**
 * App Initialization
 */
async function initApp() {
    store.checkAndResetDaily();
    const launchUrl = await App.getLaunchUrl();
    if (launchUrl?.url) await handleUrl(launchUrl.url);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        onboardingModal.open();
    } else {
        onboardingModal.element.classList.add('hidden');
        authModal.close();
        permissionModal.onComplete = () => showView('home');
        permissionModal.checkAndOpen();
    }
}

initApp();