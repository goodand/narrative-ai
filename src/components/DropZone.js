/**
 * DropZone - Image Upload Component
 * 드래그앤드롭 및 클릭 업로드 이미지 처리.
 *
 * Slice 5c: image-processing direct construction removed. The component
 * delegates file processing to `core.input.processFile(file)`, which writes
 * `input.base64 / dataUrl / metadata` into the store and returns the same
 * payload for DOM preview rendering.
 */

export class DropZone {
    constructor({
        core,
        dropZone,
        input,
        preview,
        container,
        placeholder,
        metaElements = {},
        onFileLoaded = null,
        onError = null
    } = {}) {
        this.core = core || null;
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

        this._init();
    }

    reset() {
        if (this.preview) this.preview.src = '';
        if (this.container) this.container.classList.add('hidden');
        if (this.placeholder) this.placeholder.classList.remove('hidden');
        this._hideMetadata();
    }

    setPreview(dataUrl) {
        if (this.preview) this.preview.src = dataUrl;
        if (this.container) this.container.classList.remove('hidden');
        if (this.placeholder) this.placeholder.classList.add('hidden');
    }

    showMetadata(metadata) {
        if (!metadata) return;
        if (metadata.date && this.metaElements.date) {
            this.metaElements.date.innerText = `📅 ${metadata.date}`;
            this.metaElements.date.classList.remove('hidden');
        }
        if (metadata.gps && this.metaElements.gps) {
            this.metaElements.gps.innerText = `📍 ${metadata.gps.formatted}`;
            this.metaElements.gps.classList.remove('hidden');
        }
    }

    _getElement(el) {
        if (!el) return null;
        return typeof el === 'string' ? document.getElementById(el) : el;
    }

    _init() {
        if (!this.dropZone || !this.input) return;

        this.dropZone.addEventListener('click', () => this.input.click());

        this.input.addEventListener('change', (e) => {
            if (e.target.files[0]) this._handleFile(e.target.files[0]);
        });

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
            if (file && file.type.startsWith('image/')) this._handleFile(file);
        });
    }

    async handleExternalFile(file) {
        return this._handleFile(file);
    }

    async _handleFile(file) {
        this._hideMetadata();

        if (!this.core || !this.core.input) {
            const err = new Error('core.input not available');
            console.error('[DropZone]', err);
            if (this.onError) this.onError(err);
            return;
        }

        const result = await this.core.input.processFile(file);
        if (!result) {
            // Controller already wrote error state; surface to caller if wired.
            const vm = this.core.input.getViewModel();
            if (this.onError && vm.error) this.onError(vm.error);
            return;
        }

        this.setPreview(result.dataUrl);
        this.showMetadata(result.metadata);

        if (this.onFileLoaded) {
            this.onFileLoaded({
                base64: result.base64,
                dataUrl: result.dataUrl,
                width: result.width,
                height: result.height,
                metadata: result.metadata
            });
        }
    }

    _hideMetadata() {
        Object.values(this.metaElements).forEach((el) => {
            if (el) el.classList.add('hidden');
        });
    }
}
