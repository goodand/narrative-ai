/**
 * DropZone - Image Upload Component
 * 드래그앤드롭 및 클릭 업로드 이미지 처리
 */

import { ImageProcessor } from '../processors/ImageProcessor.js';

export class DropZone {
    /**
     * Create a DropZone
     * @param {Object} options
     * @param {string|HTMLElement} options.dropZone - Drop zone element
     * @param {string|HTMLElement} options.input - File input element
     * @param {string|HTMLElement} options.preview - Preview image element
     * @param {string|HTMLElement} options.container - Preview container element
     * @param {string|HTMLElement} options.placeholder - Placeholder element
     * @param {Object} options.metaElements - Metadata display elements
     * @param {Function} options.onFileLoaded - Callback when file is loaded
     * @param {Function} options.onError - Error callback
     */
    constructor({
        dropZone,
        input,
        preview,
        container,
        placeholder,
        metaElements = {},
        onFileLoaded = null,
        onError = null
    }) {
        this.dropZone = this._getElement(dropZone);
        this.input = this._getElement(input);
        this.preview = this._getElement(preview);
        this.container = this._getElement(container);
        this.placeholder = this._getElement(placeholder);
        this.metaElements = {
            date: this._getElement(metaElements.date),
            gps: this._getElement(metaElements.gps)
        };

        this.onFileLoaded = onFileLoaded;
        this.onError = onError;

        this.imageProcessor = new ImageProcessor();

        this._init();
    }

    /**
     * Reset the drop zone to initial state
     */
    reset() {
        if (this.preview) this.preview.src = '';
        if (this.container) this.container.classList.add('hidden');
        if (this.placeholder) this.placeholder.classList.remove('hidden');
        this._hideMetadata();
    }

    /**
     * Set preview image
     * @param {string} dataUrl - Image data URL
     */
    setPreview(dataUrl) {
        if (this.preview) {
            this.preview.src = dataUrl;
        }
        if (this.container) {
            this.container.classList.remove('hidden');
        }
        if (this.placeholder) {
            this.placeholder.classList.add('hidden');
        }
    }

    /**
     * Display metadata
     * @param {Object} metadata - Metadata object
     */
    showMetadata(metadata) {
        if (metadata.date && this.metaElements.date) {
            this.metaElements.date.innerText = `📅 ${metadata.date}`;
            this.metaElements.date.classList.remove('hidden');
        }

        if (metadata.gps && this.metaElements.gps) {
            this.metaElements.gps.innerText = `📍 ${metadata.gps.formatted}`;
            this.metaElements.gps.classList.remove('hidden');
        }
    }

    // Private methods

    _getElement(el) {
        if (!el) return null;
        return typeof el === 'string' ? document.getElementById(el) : el;
    }

    _init() {
        if (!this.dropZone || !this.input) return;

        // Click to upload
        this.dropZone.addEventListener('click', () => this.input.click());

        // File input change
        this.input.addEventListener('change', (e) => {
            if (e.target.files[0]) {
                this._handleFile(e.target.files[0]);
            }
        });

        // Drag and drop events
        this.dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.dropZone.classList.add('drag-over');
        });

        this.dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
        });

        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('drag-over');
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this._handleFile(file);
            }
        });
    }

    /**
     * 외부에서 전달받은 파일을 처리 파이프라인에 태웁니다.
     * @param {File} file 
     */
    async handleExternalFile(file) {
        return this._handleFile(file);
    }

    async _handleFile(file) {
        // 1. 기존 메타데이터 숨기기 및 초기 로딩 UI 상태 (필요 시)
        this._hideMetadata();

        try {
            // 2. [핵심] 파일을 받자마자 즉시 리사이징 및 메타데이터 추출 실행
            // 사용자가 다른 설정을 만지는 동안 백그라운드에서 이미 처리가 완료됨
            const result = await this.imageProcessor.process(file);

            // 3. 최적화된 리사이징 이미지를 사용하여 미리보기 표시
            // (원본 고해상도 이미지를 렌더링하지 않으므로 메모리 효율성 증대)
            this.setPreview(result.dataUrl);

            // 4. 추출된 메타데이터 표시
            this.showMetadata(result.metadata);

            // 5. 전역 상태(Store)에 즉시 저장하여 '생성' 버튼 클릭 시 지연 최소화
            if (this.onFileLoaded) {
                this.onFileLoaded({
                    base64: result.base64,
                    dataUrl: result.dataUrl,
                    width: result.width,
                    height: result.height,
                    metadata: result.metadata
                });
            }
        } catch (error) {
            console.error('이미지 처리 중 오류 발생:', error);
            if (this.onError) {
                this.onError(error);
            }
        }
    }

    _hideMetadata() {
        Object.values(this.metaElements).forEach(el => {
            if (el) el.classList.add('hidden');
        });
    }
}
