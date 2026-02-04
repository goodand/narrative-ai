/**
 * RECOCO - Narrative AI Application
 * Entry point that orchestrates all modules
 */

import './style.css';

// Constants
import { UI_MESSAGES, DEFAULT_SYSTEM_PROMPT } from './src/constants/config.js';

// State Management
import { StateManager } from './src/state/StateManager.js';

// Services
import { GeminiService } from './src/services/GeminiService.js';
import { supabase } from './src/services/supabase.js';

// Components
import { DropZone } from './src/components/DropZone.js';
import { SelectionGroup, DropdownGroup } from './src/components/SelectionGroup.js';
import { ResultViewer } from './src/components/ResultViewer.js';
import { SuggestionModal, SettingsModal, ConfirmModal } from './src/components/Modal.js';
import { OnboardingModal } from './src/components/OnboardingModal.js';
import { AuthModal } from './src/components/AuthModal.js';
import { PermissionModal } from './src/components/PermissionModal.js';
import { HomeManager } from './src/components/HomeManager.js';
import { MyPageManager } from './src/components/MyPageManager.js';

// Initialize Core Services
const store = new StateManager();
const geminiService = new GeminiService();

// Log initialization status
console.log('RECOCO - Vite project loaded successfully');

// DOM Elements for UI controls
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
    // Navigation
    navHome: document.getElementById('nav-home'),
    navReport: document.getElementById('nav-report'),
    navMypage: document.getElementById('nav-mypage'),
    // Views
    homeView: document.getElementById('home-view'),
    inputView: document.getElementById('input-view'),
    resultView: document.getElementById('result-view'),
    header: document.querySelector('header'),
    headerTitle: document.getElementById('header-title'),
    bottomBar: document.getElementById('bottom-action-bar')
};

// --- Component Initializations ---

// 1. Drop Zone for image upload
const dropZone = new DropZone({
    dropZone: 'drop-zone',
    input: 'image-input',
    preview: 'image-preview',
    container: 'preview-container',
    placeholder: 'upload-placeholder',
    metaElements: {
        date: 'meta-date',
        gps: 'meta-gps'
    },
    onFileLoaded: (data) => {
        store.setState('base64', data.base64);
        store.setState('dataUrl', data.dataUrl);
        store.setState('metadata', data.metadata);
    },
    onError: (error) => {
        showError(UI_MESSAGES.ERROR_IMAGE_PROCESS);
        console.error('Image upload error:', error);
    }
});

// 2. SNS Platform Selection
const snsGroup = new SelectionGroup({
    container: '.sns-grid',
    itemSelector: '.sns-item',
    activeClass: 'bg-primary text-white rounded-xl text-xs font-semibold sns-item active',
    inactiveClass: 'bg-field-bg text-muted-lavender rounded-xl text-xs font-semibold sns-item',
    onChange: (value) => {
        store.setPreference('sns', value);
    }
});

// 3. Emotion Temperature Toggle
const tempGroup = new SelectionGroup({
    container: '#temp-toggle-group',
    itemSelector: 'button',
    activeClass: 'bg-white/10 shadow-sm',
    inactiveClass: 'hover:bg-white/5',
    onChange: (value) => {
        store.setPreference('temp', value);
    }
});

// 4. Result Viewer
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
        const { shareWithImage, shareCaption } = await import('./src/services/ShareService.js');
        const imageBase64 = store.getState('base64');
        if (imageBase64) {
            await shareWithImage({ imageBase64, caption: captionText });
        } else {
            await shareCaption(captionText);
        }
    }
});

// 5. Modals
const suggestionModal = new SuggestionModal('suggestion-modal', 'suggestion-list');
suggestionModal.setCloseButton('close-modal');

const settingsModal = new SettingsModal('settings-modal', 'system-prompt-input');
settingsModal.setCloseButton('close-settings');
settingsModal.setSaveButton('save-settings', (value) => {
    store.setState('systemPrompt', value);
});
settingsModal.setValue(DEFAULT_SYSTEM_PROMPT);

const editConfirmModal = new ConfirmModal('edit-confirm-modal');
editConfirmModal.setup({
    confirmBtn: 'confirm-edit-btn',
    cancelBtn: 'cancel-edit-btn',
    onConfirm: () => {
        resultViewer.enterEditMode();
    }
});

// 5-1. Flow Modals
const permissionModal = new PermissionModal('permission-modal');
const authModal = new AuthModal('auth-modal');
const onboardingModal = new OnboardingModal('onboarding-modal', {
    onComplete: () => {
        authModal.open('signup');
    }
});

// 5-2. Page Managers
const homeManager = new HomeManager('home-view', {
    onPreciousClick: async () => {
        try {
            console.log('main.js: HomeManager의 "소중해" 액션 감지');
            const file = await homeManager.getCurrentImageAsFile();
            if (file) {
                await dropZone.handleExternalFile(file);
                const curationMeta = homeManager.getCurrentPhotoMeta();
                const currentMeta = store.getState('metadata') || {};
                const mergedMeta = { ...currentMeta, ...curationMeta };
                store.setState('metadata', mergedMeta);
                dropZone.showMetadata(mergedMeta);
                console.log('main.js: 큐레이션 이미지 파이프라인 처리 완료');
            }
        } catch (error) {
            console.error('main.js: 큐레이션 처리 중 오류 발생:', error);
        }
        showView('input');
    },
    onThanksClick: (photo) => {
        console.log('삭제 대상 사진:', photo);
        alert('사진 비우기(삭제) 기능은 구현 중입니다.');
    }
});

const mypageContainer = document.createElement('div');
mypageContainer.id = 'mypage-view';
mypageContainer.className = 'hidden min-h-screen bg-dark-bg';
document.body.appendChild(mypageContainer);

const mypageManager = new MyPageManager('mypage-view', {
    onLogout: () => window.location.reload()
});

// --- View Navigation Logic ---

function showView(viewName) {
    els.homeView.classList.add('hidden');
    els.inputView.classList.add('hidden');
    els.resultView.classList.add('hidden');
    mypageContainer.classList.add('hidden');
    
    els.header.classList.toggle('hidden', viewName === 'mypage' || viewName === 'home');
    els.bottomBar.classList.toggle('hidden', viewName === 'mypage');

    const isDashboard = viewName === 'home';
    els.navHome.classList.toggle('text-primary', isDashboard);
    els.navHome.classList.toggle('opacity-40', !isDashboard);
    els.navMypage.classList.toggle('text-primary', viewName === 'mypage');
    els.navMypage.classList.toggle('opacity-40', viewName !== 'mypage');

    if (viewName === 'home') {
        els.homeView.classList.remove('hidden');
        homeManager.render();
    } else if (viewName === 'input') {
        els.inputView.classList.remove('hidden');
        els.header.classList.remove('hidden');
        els.headerTitle.innerText = '리코코 상세 기록 설정';
    } else if (viewName === 'mypage') {
        mypageContainer.classList.remove('hidden');
        mypageManager.render();
    }
}

els.navHome.onclick = () => showView('home');
els.navMypage.onclick = () => showView('mypage');
window.addEventListener('nav-change', (e) => showView(e.detail));

/**
 * Handle Auth State Changes
 */
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        authModal.close();
        onboardingModal.element.classList.add('hidden');
        showView('home');
        permissionModal.checkAndOpen();
    } else if (event === 'SIGNED_OUT') {
        onboardingModal.open();
    }
});

/**
 * App Initialization
 */
async function initApp() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) console.error('Session error:', error.message);

    if (!session) {
        onboardingModal.open();
    } else {
        onboardingModal.element.classList.add('hidden');
        authModal.close();
        showView('home');
    }
}

// --- Event Handlers ---

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

// Generate button handler
els.genBtn.onclick = async () => {
    const imageData = store.getState('base64');
    if (!imageData) {
        showError(UI_MESSAGES.ERROR_NO_IMAGE);
        return;
    }

    setLoading(true);

    const context = {
        sns: store.getPreference('sns') || snsGroup.getValue() || 'Instagram',
        mood: els.style.value,
        temp: store.getPreference('temp') || tempGroup.getValue() || 'Lukewarm',
        language: els.lang.value,
        tags: els.tagsInput.value.trim(),
        activity: els.activity.value,
        bodyState: els.bodyState.value,
        relationship: els.relationship.value,
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
        if (resultDate && metadata.date) resultDate.innerText = metadata.date;
        if (resultLoc && metadata.gps) resultLoc.innerText = metadata.gps.formatted;

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
    els.loader.classList.toggle('hidden', !isLoading);
    els.btnText.innerText = isLoading ? UI_MESSAGES.LOADING : UI_MESSAGES.GENERATE_BUTTON;
}

function showError(message) {
    els.error.innerText = message;
    els.error.classList.remove('hidden');
    setTimeout(() => els.error.classList.add('hidden'), 5000);
}

// Start the app
initApp();
