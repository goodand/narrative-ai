/**
 * InputManager - Handles Image Upload and Context Input
 * 이미지 업로드 및 의미/태그 입력 화면 관리
 */

import { DropZone } from './DropZone.js';
import { store } from '../state/StateManager.js';

export class InputManager {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.dropZone = null;
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <!-- Image Upload Area -->
            <div class="flex flex-col items-center px-6 pt-12 pb-8">
                <div id="drop-zone" class="relative w-40 h-40 overflow-hidden rounded-[2rem] border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors group cursor-pointer flex items-center justify-center">
                    <input type="file" id="image-input" accept="image/*" class="hidden">
                    
                    <!-- Placeholder / Background -->
                    <div id="upload-placeholder" class="flex flex-col items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity">
                        <span class="material-symbols-outlined text-4xl text-white/30">image</span>
                    </div>

                    <!-- Preview Container -->
                    <div id="preview-container" class="hidden w-full h-full absolute top-0 left-0">
                        <img id="image-preview" class="w-full h-full object-cover">
                    </div>
                </div>
                <p class="mt-4 text-muted-lavender text-[10px] font-bold uppercase tracking-[0.2em]">Selected Moment</p>
                
                <!-- Hidden Meta Container for JS compatibility -->
                <div class="hidden" id="meta-container">
                    <div id="meta-date"></div>
                    <div id="meta-gps"></div>
                </div>
            </div>

            <div class="px-6 space-y-8">
                <!-- Meaning Input -->
                <div>
                    <p class="text-[10px] font-bold text-muted-lavender tracking-wider uppercase mb-2 ml-1">Meaning</p>
                    <textarea id="meaning-input" class="w-full bg-field-bg border-none rounded-2xl p-5 text-sm focus:ring-1 focus:ring-primary/30 placeholder:text-muted-lavender/40 text-white outline-none min-h-[120px] resize-none" placeholder="이 순간은 당신에게 어떤 의미인가요?"></textarea>
                </div>

                <!-- Tags -->
                <div>
                    <p class="text-[10px] font-bold text-muted-lavender tracking-wider uppercase mb-2 ml-1">Tags (Optional)</p>
                    <input id="tags-input" class="w-full h-14 bg-field-bg border-none rounded-2xl px-5 text-sm focus:ring-1 focus:ring-primary/30 placeholder:text-muted-lavender/40 text-white outline-none" placeholder="#태그 #키워드 #입력" type="text" />
                </div>
            </div>
        `;

        this._initDropZone();
    }

    _initDropZone() {
        this.dropZone = new DropZone({
            dropZone: 'drop-zone', 
            input: 'image-input', 
            preview: 'image-preview', 
            container: 'preview-container', 
            placeholder: 'upload-placeholder',
            metaElements: { date: 'meta-date', gps: 'meta-gps' },
            onFileLoaded: (data) => {
                store.setState('base64', data.base64);
                store.setState('dataUrl', data.dataUrl);
                store.setState('metadata', data.metadata);
            }
        });
    }

    /**
     * 입력된 데이터(의미, 태그)를 가져옵니다.
     */
    getInputData() {
        const meaningInput = document.getElementById('meaning-input');
        const tagsInput = document.getElementById('tags-input');
        return {
            meaning: meaningInput?.value?.trim() || '',
            tags: tagsInput?.value?.trim() || ''
        };
    }

    /**
     * 화면 초기화 (입력 필드 비우기 등)
     */
    reset() {
        const meaningInput = document.getElementById('meaning-input');
        const tagsInput = document.getElementById('tags-input');
        if (meaningInput) meaningInput.value = '';
        if (tagsInput) tagsInput.value = '';
        
        // DropZone 리셋 로직이 필요하다면 여기에 추가 (현재 DropZone은 상태를 직접 관리하지 않음)
        // 이미지 프리뷰 초기화
        const previewImg = document.getElementById('image-preview');
        const previewContainer = document.getElementById('preview-container');
        const uploadPlaceholder = document.getElementById('upload-placeholder');
        
        if (previewImg) previewImg.src = '';
        if (previewContainer) previewContainer.classList.add('hidden');
        if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');

        store.setState('base64', null);
        store.setState('dataUrl', null);
        store.setState('metadata', null);
    }

    /**
     * 외부(예: HomeManager)에서 선택된 이미지를 프리뷰에 설정합니다.
     * @param {string} dataUrl - 이미지 Data URL
     * @param {Object} metadata - 이미지 메타데이터
     */
    setPreviewImage(dataUrl, metadata) {
        const previewImg = document.getElementById('image-preview');
        const previewContainer = document.getElementById('preview-container');
        const uploadPlaceholder = document.getElementById('upload-placeholder');

        if (previewImg && dataUrl) {
            previewImg.src = dataUrl;
            previewContainer?.classList.remove('hidden');
            uploadPlaceholder?.classList.add('hidden');

            const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
            store.setState('dataUrl', dataUrl);
            store.setState('base64', base64);
            store.setState('metadata', metadata);
        }
    }
}
