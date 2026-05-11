/**
 * InputManager - Handles Image Upload and Context Input.
 *
 * Slice 5c: legacy state import removed. All image and text state flows
 * through `core.input` (`processFile / setTextFields / setPreviewImage /
 * reset / getInputData / getViewModel`). DropZone receives `{ core }` and
 * directly invokes `core.input.processFile()`.
 */

import { DropZone } from './DropZone.js';

export class InputManager {
    constructor(containerId, { core } = {}) {
        this.container = document.getElementById(containerId);
        this.core = core || null;
        this.dropZone = null;
        this.render();
    }

    render() {
        if (!this.container) return;

        this.container.innerHTML = `
            <!-- Image Upload Area -->
            <div class="flex flex-col items-center px-6 mx-6 pt-12 pb-8">
                <div id="drop-zone" class="relative w-full max-w-[240px] aspect-[2/3] overflow-hidden rounded-[2rem] border-2 border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors duration-200 ease-in-out group cursor-pointer flex items-center justify-center">
                    <input type="file" id="image-input" accept="image/*" class="hidden">

                    <!-- Placeholder / Background -->
                    <div id="upload-placeholder" class="flex flex-col items-center justify-center opacity-50 group-hover:opacity-100 transition-opacity duration-200 ease-in-out">
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

            <div class="px-6 mx-6 space-y-8">
                <!-- Meaning Input -->
                <div>
                    <p class="text-[10px] font-bold text-muted-lavender tracking-wider uppercase mb-2 ml-1">Meaning</p>
                    <textarea id="meaning-input" class="w-full bg-field-bg border border-white/5 rounded-2xl p-4 text-sm focus:border-primary placeholder:text-[#6B696D] text-white outline-none min-h-[120px] resize-none transition-colors duration-200" placeholder="이 순간은 당신에게 어떤 의미인가요?"></textarea>
                </div>

                <!-- Tags -->
                <div>
                    <p class="text-[10px] font-bold text-muted-lavender tracking-wider uppercase mb-2 ml-1">Tags (Optional)</p>
                    <input id="tags-input" class="w-full h-14 bg-field-bg border border-white/5 rounded-2xl px-4 text-sm focus:border-primary placeholder:text-[#6B696D] text-white outline-none transition-colors duration-200" placeholder="#태그 #키워드 #입력" type="text" />
                </div>
            </div>
        `;

        this._initDropZone();
        this._bindTextInputs();
    }

    _initDropZone() {
        this.dropZone = new DropZone({
            core: this.core,
            dropZone: 'drop-zone',
            input: 'image-input',
            preview: 'image-preview',
            container: 'preview-container',
            placeholder: 'upload-placeholder',
            metaElements: { date: 'meta-date', gps: 'meta-gps' }
        });
    }

    _bindTextInputs() {
        const meaningInput = document.getElementById('meaning-input');
        const tagsInput = document.getElementById('tags-input');

        if (meaningInput) {
            meaningInput.oninput = (e) => {
                if (this.core && this.core.input) {
                    this.core.input.setTextFields({ meaning: e.target.value });
                }
            };
        }

        if (tagsInput) {
            tagsInput.oninput = (e) => {
                if (this.core && this.core.input) {
                    this.core.input.setTextFields({ tags: e.target.value });
                }
            };
        }
    }

    /**
     * 입력된 데이터(의미, 태그)를 가져옵니다. 호환성용 래퍼.
     */
    getInputData() {
        if (this.core && this.core.input) {
            const data = this.core.input.getInputData();
            return { meaning: data.meaning, tags: data.tags };
        }
        const meaningInput = document.getElementById('meaning-input');
        const tagsInput = document.getElementById('tags-input');
        return {
            meaning: meaningInput?.value?.trim() || '',
            tags: tagsInput?.value?.trim() || ''
        };
    }

    /**
     * 화면 초기화 (입력 필드 비우기 + 이미지 프리뷰 해제 + core.input 리셋).
     */
    reset() {
        const meaningInput = document.getElementById('meaning-input');
        const tagsInput = document.getElementById('tags-input');
        if (meaningInput) meaningInput.value = '';
        if (tagsInput) tagsInput.value = '';

        const previewImg = document.getElementById('image-preview');
        const previewContainer = document.getElementById('preview-container');
        const uploadPlaceholder = document.getElementById('upload-placeholder');

        if (previewImg) previewImg.src = '';
        if (previewContainer) previewContainer.classList.add('hidden');
        if (uploadPlaceholder) uploadPlaceholder.classList.remove('hidden');

        if (this.core && this.core.input) this.core.input.reset();
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

            if (this.core && this.core.input) {
                this.core.input.setPreviewImage({ dataUrl, metadata });
            }
        }
    }
}
