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

// Components
import { DropZone } from './src/components/DropZone.js';
import { SelectionGroup, DropdownGroup } from './src/components/SelectionGroup.js';
import { ResultViewer } from './src/components/ResultViewer.js';
import { SuggestionModal, SettingsModal, ConfirmModal } from './src/components/Modal.js';
import { OnboardingModal } from './src/components/OnboardingModal.js';
import { AuthModal } from './src/components/AuthModal.js';
import { PermissionModal } from './src/components/PermissionModal.js';

// Initialize Core Services
const store = new StateManager();
const geminiService = new GeminiService();  // API Key는 백엔드에서 관리

// Log initialization status
console.log('RECOCO - Vite project loaded successfully');
console.log('Backend Proxy Mode: API calls routed through /api');

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
    relationship: document.getElementById('relationship-select')
};

// Initialize Components

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
        store.setImageData(data.base64, data.metadata);
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
        activeClass: 'bg-primary text-white rounded-xl text-xs font-semibold sns-item active', // Updated activeClass
        inactiveClass: 'bg-field-bg text-muted-lavender rounded-xl text-xs font-semibold sns-item', // Updated inactiveClass
        onChange: (value) => {
            store.setPreference('sns', value);
        }
    });

    // 3. Emotion Temperature Toggle
    const tempGroup = new SelectionGroup({
        container: '#temp-toggle-group',
        itemSelector: 'button',
        activeClass: 'bg-white/10 shadow-sm', // Updated activeClass
        inactiveClass: 'hover:bg-white/5', // Updated inactiveClass
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

// 5-1. App Flow Initializations (Onboarding -> Auth -> Permission)

const permissionModal = new PermissionModal('permission-modal');
permissionModal.onComplete = () => {
    console.log('App initialization flow complete');
};

const authModal = new AuthModal('auth-modal');
authModal.onLoginSuccess = () => {
    permissionModal.open();
};

const onboardingModal = new OnboardingModal('onboarding-modal', {
    onComplete: () => {
        authModal.open('signup');
    }
});

// Start the app flow
onboardingModal.open();

// 6. Settings Modal Opener
const openSettingsBtn = document.getElementById('open-settings');
if (openSettingsBtn) {
    openSettingsBtn.onclick = () => settingsModal.open();
}

// 7. Edit Button Handler
const editBtn = document.getElementById('edit-btn');
if (editBtn) {
    editBtn.onclick = () => editConfirmModal.open();
}

// 8. Save Button Handler
const saveBtn = document.getElementById('save-btn');
if (saveBtn) {
    saveBtn.onclick = () => resultViewer.exitEditMode();
}

// Handle suggestion selection
function handleSuggestionSelect(suggestion, originalWord) {
    const currentResult = store.getState('currentResult');
    if (!currentResult) return;

    // Update caption with new word
    const newCaption = currentResult.original_caption.replace(originalWord, suggestion);
    currentResult.original_caption = newCaption;

    // Update keyword reference
    const keyword = currentResult.keywords.find(k => k.word === originalWord);
    if (keyword) {
        keyword.word = suggestion;
    }

    store.setResult(currentResult);
    resultViewer.renderCaption(currentResult);
}

// Generate button handler
els.genBtn.onclick = async () => {
    if (!geminiService.isConfigured()) {
        showError(UI_MESSAGES.ERROR_NO_API_KEY);
        return;
    }

    const imageData = store.getState('base64');
    if (!imageData) {
        showError(UI_MESSAGES.ERROR_NO_IMAGE);
        return;
    }

    setLoading(true);

    // [수정] 데이터 생성이 시작되자마자 UI 전환 준비
    const inputView = document.getElementById('input-view');
    const headerTitle = document.getElementById('header-title');
    
    // Build context from UI selections
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
        // Generate story
        const storyResult = await geminiService.generateStory(imageData, context);
        
        // 데이터 수신 성공 로그
        console.log('Main: Story received, now fetching synonyms');

        // Update button text for synonym generation
        els.btnText.innerText = UI_MESSAGES.FINDING_SYNONYMS;

        // Get synonyms for keywords
        const keywordsWithSuggestions = await geminiService.getSynonyms(
            storyResult.keywords,
            context.language
        );

        // Store result
        const result = {
            original_caption: storyResult.original_caption,
            keywords: keywordsWithSuggestions
        };
        store.setResult(result);

        console.log('Main: All data ready, transitioning UI');
        
        // UI 전환: 입력창 숨기고 결과창 보이기
        if (inputView) inputView.classList.add('hidden');
        if (headerTitle) headerTitle.innerText = '리코코 기록 결과';
        resultViewer.show();

        // 렌더링 시도
        resultViewer.renderCaption(result);
        resultViewer.scrollIntoView();

    } catch (error) {
        showError('AI 생성 중 오류 발생: ' + error.message);
        console.error('Generation error:', error);
    } finally {
        setLoading(false);
    }
};

// Utility functions
function setLoading(isLoading) {
    els.genBtn.disabled = isLoading;
    els.loader.classList.toggle('hidden', !isLoading);
    els.btnText.innerText = isLoading
        ? UI_MESSAGES.LOADING
        : UI_MESSAGES.GENERATE_BUTTON;
}

function showError(message) {
    els.error.innerText = message;
    els.error.classList.remove('hidden');
    setTimeout(() => els.error.classList.add('hidden'), 5000);
}
