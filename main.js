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

// View History Management
const viewHistory = ['home'];
let currentView = 'home';

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
    backBtn: document.getElementById('back-btn'),
    bottomBar: document.getElementById('bottom-action-bar'),
    mypageView: document.getElementById('mypage-view')
};

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

const snsGroup = new SelectionGroup({ container: '.sns-grid', itemSelector: '.sns-item', activeClass: 'bg-primary text-white rounded-xl text-xs font-semibold sns-item active', inactiveClass: 'bg-field-bg text-muted-lavender rounded-xl text-xs font-semibold sns-item' });
const tempGroup = new SelectionGroup({ container: '#temp-toggle-group', itemSelector: 'button', activeClass: 'bg-white/10 shadow-sm', inactiveClass: 'hover:bg-white/5' });

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
            console.error('Share error:', err);
            alert('공유 중 오류가 발생했습니다.');
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

                // Store에 데이터 저장 (dataUrl에서 base64 추출)
                const dataUrl = currentPhoto.imageUrl;
                const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;

                store.setState('dataUrl', dataUrl);
                store.setState('base64', base64);
                store.setState('metadata', homeManager.getCurrentPhotoMeta());
            }
        }
        showView('input');
    }
});
const reportManager = new ReportManager('report-view');
// MyPage View is now static in index.html, accessed via els.mypageView
const mypageManager = new MyPageManager('mypage-view', { onLogout: () => window.location.reload() });

function showView(viewName, addToHistory = true) {
    console.log(`[VIEW] Switching to: ${viewName}`);

    // 히스토리 관리 (뒤로가기용)
    if (addToHistory && viewName !== currentView) {
        viewHistory.push(viewName);
    }
    currentView = viewName;

    // 1. 모든 메인 뷰 숨기기 (클래스와 인라인 스타일 모두 적용)
    [els.homeView, els.reportView, els.inputView, els.resultView, els.mypageView].forEach(el => {
        if (el) {
            el.classList.add('hidden');
            el.style.display = 'none';
        }
    });

    // 2. 하단 생성 버튼 영역 제어
    const genBtnContainer = els.bottomBar.querySelector('div:first-child');
    if (genBtnContainer) {
        genBtnContainer.style.display = (viewName === 'input') ? 'block' : 'none';
    }

    // 3. 헤더 가시성 제어 (input, result 뷰에서만 표시)
    const isMainTab = ['home', 'report', 'mypage'].includes(viewName);
    els.header.style.display = isMainTab ? 'none' : 'flex';

    // 4. 바텀바 전체 가시성 제어
    els.bottomBar.style.display = (viewName === 'mypage') ? 'none' : 'block';

    // 4.5 네비게이션 탭 활성 상태 업데이트
    [els.navHome, els.navReport, els.navMypage].forEach(nav => {
        if (nav) {
            nav.classList.remove('text-primary');
            nav.classList.add('opacity-40');
            const icon = nav.querySelector('.material-symbols-outlined');
            if (icon) icon.style.fontVariationSettings = "'FILL' 0";
        }
    });

    let activeNav = null;
    if (viewName === 'home' || viewName === 'input' || viewName === 'result') activeNav = els.navHome;
    else if (viewName === 'report') activeNav = els.navReport;
    else if (viewName === 'mypage') activeNav = els.navMypage;

    if (activeNav) {
        activeNav.classList.add('text-primary');
        activeNav.classList.remove('opacity-40');
        const icon = activeNav.querySelector('.material-symbols-outlined');
        if (icon) icon.style.fontVariationSettings = "'FILL' 1";
    }

    // 5. 대상 뷰 활성화
    let targetEl = null;
    if (viewName === 'home') targetEl = els.homeView;
    else if (viewName === 'input') targetEl = els.inputView;
    else if (viewName === 'report') targetEl = els.reportView;
    else if (viewName === 'mypage') targetEl = els.mypageView;
    else if (viewName === 'result') targetEl = els.resultView;

    if (targetEl) {
        targetEl.classList.remove('hidden');
        targetEl.style.display = 'block';

        // 뷰별 렌더링/타이틀 업데이트
        if (viewName === 'home') homeManager.render();
        else if (viewName === 'input') els.headerTitle.innerText = '리코코 상세 기록 설정';
        else if (viewName === 'report') reportManager.render();
        else if (viewName === 'mypage') mypageManager.render();
        else if (viewName === 'result') els.headerTitle.innerText = '리코코 기록 결과';
    }

    window.scrollTo(0, 0);
}

// 뒤로가기 버튼 핸들러
function goBack() {
    // 현재 뷰를 히스토리에서 제거
    if (viewHistory.length > 1) {
        viewHistory.pop();
        const previousView = viewHistory[viewHistory.length - 1];
        showView(previousView, false); // 히스토리에 추가하지 않음
    } else {
        // 히스토리가 없으면 홈으로
        showView('home', false);
    }
}

// 뒤로가기 버튼 이벤트 연결
if (els.backBtn) {
    els.backBtn.onclick = goBack;
}

els.navHome.onclick = () => showView('home');
els.navReport.onclick = () => showView('report');
els.navMypage.onclick = () => showView('mypage');

// MyPageManager의 뒤로가기 이벤트 처리
window.addEventListener('nav-change', (e) => {
    if (e.detail) showView(e.detail);
});

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