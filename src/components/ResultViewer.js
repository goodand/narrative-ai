/**
 * ResultViewer — caption display, edit mode, keyword highlight, copy/share.
 *
 * Slice 5d (Decisions #1A, #3C, #7C): direct toast / clipboard fallback
 * removed. All actions route through `core.result`:
 *   - copy   → `core.result.copyCaption()`
 *   - share  → `core.result.shareCaption()`
 *   - save   → `core.result.exitEditMode(text)`
 *   - keyword replace → `core.result.replaceKeyword({ originalWord, suggestion })`
 * Caption rendering uses `getViewModel().captionSegments` so keyword
 * highlighting is computed by the controller and the component only emits DOM.
 * Copy success status is read from `vm.copyStatus === 'copied'`.
 */

import { presentToast, ErrorLevel } from '../ui/dom/toastPresenter.js';

export class ResultViewer {
    constructor({
        core,
        resultArea,
        interactiveCaption,
        editCaption,
        editBtn,
        saveBtn,
        copyBtn,
        shareBtn,
        resultImage,
        onKeywordSelected = null
    } = {}) {
        this.core = core || null;
        this.resultArea = this._getElement(resultArea);
        this.interactiveCaption = this._getElement(interactiveCaption);
        this.editCaption = this._getElement(editCaption);
        this.editBtn = this._getElement(editBtn);
        this.saveBtn = this._getElement(saveBtn);
        this.copyBtn = this._getElement(copyBtn);
        this.shareBtn = this._getElement(shareBtn);
        this.resultImage = this._getElement(resultImage);

        this.onKeywordSelected = onKeywordSelected;

        this._lastCopyStatus = 'idle';
        this._unsubscribeStore = null;

        this._init();

        if (this.core && this.core.store) {
            this._unsubscribeStore = this.core.store.subscribe(() => this._reactToVm());
        }
    }

    destroy() {
        if (typeof this._unsubscribeStore === 'function') {
            this._unsubscribeStore();
            this._unsubscribeStore = null;
        }
    }

    show() {
        this.resultArea?.classList.remove('hidden');
    }

    hide() {
        this.resultArea?.classList.add('hidden');
    }

    scrollIntoView() {
        this.resultArea?.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Render caption from VM. Image source falls back to legacy `data` arg
     * for the home → result handoff flow until slice 5e moves that into
     * the home/input controller pipeline.
     * @param {Object} [data] - optional legacy payload carrying `image`
     */
    renderCaption(data) {
        if (data && data.image && this.resultImage) {
            let imageSrc = data.image;
            if (typeof imageSrc === 'string' && !imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
                imageSrc = `data:image/jpeg;base64,${imageSrc}`;
            }
            const img = this.resultImage;
            img.onload = () => img.classList.remove('opacity-0');
            img.onerror = () => console.error('ResultViewer: image load failed');
            img.src = imageSrc;
        }

        this._renderFromVm();
    }

    _renderFromVm() {
        if (!this.core || !this.core.result) return;
        const vm = this.core.result.getViewModel();

        if (this.interactiveCaption) {
            const segments = Array.isArray(vm.captionSegments) ? vm.captionSegments : [];
            const html = segments.map((seg) => {
                const escaped = this._escapeHtml(seg.text || '').replace(/\n/g, '<br>');
                if (seg.type === 'keyword') {
                    const word = this._escapeHtmlAttr(seg.word || seg.text || '');
                    return `<span class="keyword-highlight" data-word="${word}">${escaped}</span>`;
                }
                return escaped;
            }).join('');
            this.interactiveCaption.innerHTML = `"${html}"`;
        }

        if (this.editCaption) {
            this.editCaption.value = vm.originalCaption || '';
        }

        // Edit mode visibility
        if (vm.isEditMode) {
            this.interactiveCaption?.classList.add('hidden');
            this.editCaption?.classList.remove('hidden');
            this.editBtn?.classList.add('hidden');
            this.saveBtn?.classList.remove('hidden');
        } else {
            this.interactiveCaption?.classList.remove('hidden');
            this.editCaption?.classList.add('hidden');
            this.editBtn?.classList.remove('hidden');
            this.saveBtn?.classList.add('hidden');
        }

        this._bindKeywordEvents();
    }

    _reactToVm() {
        if (!this.core || !this.core.result) return;
        const vm = this.core.result.getViewModel();

        // copyStatus terminal transitions → toast + button feedback
        if (vm.copyStatus !== this._lastCopyStatus) {
            this._lastCopyStatus = vm.copyStatus;
            if (vm.copyStatus === 'copied') {
                this._showCopySuccess();
            }
        }

        this._renderFromVm();
    }

    enterEditMode() {
        if (this.core && this.core.result) this.core.result.enterEditMode();
        this._renderFromVm();
        this.editCaption?.focus();
    }

    exitEditMode() {
        const newText = this.editCaption?.value || '';
        if (this.core && this.core.result) this.core.result.exitEditMode(newText);
        this._renderFromVm();
    }

    updateCaption() {
        // Kept for legacy callers; rendering is driven by VM now.
        this._renderFromVm();
    }

    getCurrentText() {
        if (!this.core || !this.core.result) return '';
        return this.core.result.getViewModel().originalCaption || '';
    }

    async copyToClipboard() {
        if (!this.core || !this.core.result) return;
        await this.core.result.copyCaption();
    }

    _getElement(el) {
        if (!el) return null;
        return typeof el === 'string' ? document.getElementById(el) : el;
    }

    _init() {
        if (this.editBtn) {
            this.editBtn.addEventListener('click', () => this.enterEditMode());
        }
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.exitEditMode());
        }
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        }
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', async () => {
                if (!this.core || !this.core.result) return;
                await this.core.result.shareCaption();
            });
        }
    }

    _bindKeywordEvents() {
        const highlights = document.querySelectorAll('.keyword-highlight');
        highlights.forEach((el) => {
            el.onclick = () => {
                const word = el.dataset.word;
                if (!word) return;
                if (this.onKeywordSelected) {
                    this.onKeywordSelected(word);
                }
            };
        });
    }

    _showCopySuccess() {
        if (!this.copyBtn) return;
        presentToast('클립보드에 복사되었습니다.', ErrorLevel.INFO);

        const originalText = this.copyBtn.innerText;
        this.copyBtn.innerText = '복사 완료!';
        this.copyBtn.classList.add('bg-primary', 'text-dark-bg');

        setTimeout(() => {
            this.copyBtn.innerText = originalText;
            this.copyBtn.classList.remove('bg-primary', 'text-dark-bg');
        }, 2000);
    }

    _escapeHtml(s) {
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    _escapeHtmlAttr(s) {
        return this._escapeHtml(s);
    }
}
