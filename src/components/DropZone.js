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

    async _handleFile(file) {
        // Hide old metadata
        this._hideMetadata();

        try {
            // Process image (extract metadata and resize)
            const result = await this.imageProcessor.process(file);

            // Update preview
            this.setPreview(result.dataUrl);

            // Show metadata
            this.showMetadata(result.metadata);

            // Callback with result
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
            console.error('File handling error:', error);
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
