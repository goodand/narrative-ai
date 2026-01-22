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

// Initialize API Key
const apiKey = import.meta.env?.VITE_GEMINI_API_KEY;

// Initialize Core Services
const store = new StateManager();
const geminiService = new GeminiService(apiKey);

// Log initialization status
console.log('RECOCO - Vite project loaded successfully');
if (apiKey) {
    console.log('API Key loaded');
} else {
    console.warn('API Key not found. Check VITE_GEMINI_API_KEY in .env file');
}

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
    activeClass: 'active',
    onChange: (value) => {
        store.setPreference('sns', value);
    }
});

// 3. Emotion Temperature Toggle
const tempGroup = new SelectionGroup({
    container: '#temp-toggle-group',
    itemSelector: 'button',
    activeClass: 'bg-white shadow-sm',
    inactiveClass: 'hover:bg-white/50',
    onChange: (value) => {
        store.setPreference('temp', value);
    }
});

// 4. Result Viewer
const resultViewer = new ResultViewer({
    resultArea: 'result-area',
    interactiveCaption: 'caption-interactive',
    editCaption: 'caption-edit',
    editBtn: 'edit-btn',
    saveBtn: 'save-btn',
    copyBtn: 'copy-btn',
    onKeywordClick: (wordData) => {
        suggestionModal.renderSuggestions(wordData, handleSuggestionSelect);
    },
    onSave: (newText) => {
        const currentResult = store.getState('currentResult');
        if (currentResult) {
            currentResult.original_caption = newText;
            store.setResult(currentResult);
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

        // Render result
        resultViewer.renderCaption(result);
        resultViewer.show();
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
