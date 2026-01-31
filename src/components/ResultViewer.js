/**
 * ResultViewer - Caption Result Display Component
 * AI 생성 결과 표시 및 편집 모드 관리
 */

export class ResultViewer {
    /**
     * Create a ResultViewer
     * @param {Object} options
     * @param {string|HTMLElement} options.resultArea - Result area container
     * @param {string|HTMLElement} options.interactiveCaption - Interactive caption element
     * @param {string|HTMLElement} options.editCaption - Edit textarea element
     * @param {string|HTMLElement} options.editBtn - Edit button
     * @param {string|HTMLElement} options.saveBtn - Save button
     * @param {string|HTMLElement} options.copyBtn - Copy button
     * @param {string|HTMLElement} options.shareBtn - Share button
     * @param {Function} options.onKeywordClick - Callback when keyword is clicked
     * @param {Function} options.onSave - Callback when save is clicked
     * @param {Function} options.onShare - Callback when share is clicked
     */
    constructor({
        resultArea,
        interactiveCaption,
        editCaption,
        editBtn,
        saveBtn,
        copyBtn,
        shareBtn,
        onKeywordClick = null,
        onSave = null,
        onShare = null
    }) {
        this.resultArea = this._getElement(resultArea);
        this.interactiveCaption = this._getElement(interactiveCaption);
        this.editCaption = this._getElement(editCaption);
        this.editBtn = this._getElement(editBtn);
        this.saveBtn = this._getElement(saveBtn);
        this.copyBtn = this._getElement(copyBtn);
        this.shareBtn = this._getElement(shareBtn);

        this.onKeywordClick = onKeywordClick;
        this.onSave = onSave;
        this.onShare = onShare;

        this._currentData = null;
        this._isEditMode = false;

        this._init();
    }

    /**
     * Show result area
     */
    show() {
        this.resultArea?.classList.remove('hidden');
    }

    /**
     * Hide result area
     */
    hide() {
        this.resultArea?.classList.add('hidden');
    }

    /**
     * Scroll result into view
     */
    scrollIntoView() {
        this.resultArea?.scrollIntoView({ behavior: 'smooth' });
    }

    /**
     * Render caption with highlighted keywords
     * @param {Object} data - Caption data with keywords
     */
    renderCaption(data) {
        this._currentData = data;
        let text = data.original_caption;

        if (data.keywords && data.keywords.length > 0) {
            // Sort keywords by length (longest first) to avoid partial matches
            const sortedKeywords = [...data.keywords].sort(
                (a, b) => b.word.length - a.word.length
            );

            // Build a single regex to match all keywords at once
            // This prevents HTML tags from being corrupted by subsequent replaces
            const pattern = sortedKeywords
                .map(item => {
                    const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    return `(${escaped})`;
                })
                .join('|');

            const regex = new RegExp(pattern, 'gi');

            text = text.replace(regex, (match) => {
                // Find the original item to maintain correct data-word mapping
                // case-insensitive matching for the word itself
                const item = data.keywords.find(k => k.word.toLowerCase() === match.toLowerCase()) || { word: match };
                return `<span class="keyword-highlight" data-word="${item.word}">${match}</span>`;
            });
        }

        if (this.interactiveCaption) {
            this.interactiveCaption.innerHTML = `"${text}"`;
        }

        if (this.editCaption) {
            this.editCaption.value = data.original_caption;
        }

        // Bind keyword click events
        this._bindKeywordEvents();
    }

    /**
     * Enter edit mode
     */
    enterEditMode() {
        this._isEditMode = true;

        if (this.interactiveCaption) {
            this.interactiveCaption.classList.add('hidden');
        }

        if (this.editCaption) {
            this.editCaption.classList.remove('hidden');
            this.editCaption.value = this._currentData?.original_caption || '';
            this.editCaption.focus();
        }

        if (this.editBtn) {
            this.editBtn.classList.add('hidden');
        }

        if (this.saveBtn) {
            this.saveBtn.classList.remove('hidden');
        }
    }

    /**
     * Exit edit mode and save changes
     */
    exitEditMode() {
        this._isEditMode = false;

        const newText = this.editCaption?.value || '';

        if (this._currentData) {
            this._currentData.original_caption = newText;
        }

        // Show plain text (no highlights after edit)
        if (this.interactiveCaption) {
            this.interactiveCaption.innerHTML = `"${newText.replace(/\n/g, '<br>')}"`;
            this.interactiveCaption.classList.remove('hidden');
        }

        if (this.editCaption) {
            this.editCaption.classList.add('hidden');
        }

        if (this.saveBtn) {
            this.saveBtn.classList.add('hidden');
        }

        if (this.editBtn) {
            this.editBtn.classList.remove('hidden');
        }

        if (this.onSave) {
            this.onSave(newText);
        }
    }

    /**
     * Update caption text (e.g., after keyword replacement)
     * @param {string} newCaption
     */
    updateCaption(newCaption) {
        if (this._currentData) {
            this._currentData.original_caption = newCaption;
            this.renderCaption(this._currentData);
        }
    }

    /**
     * Get current caption text
     * @returns {string}
     */
    getCurrentText() {
        return this._currentData?.original_caption || '';
    }

    /**
     * Copy caption to clipboard
     */
    copyToClipboard() {
        const text = this.getCurrentText();

        navigator.clipboard.writeText(text).then(() => {
            this._showCopySuccess();
        }).catch(() => {
            // Fallback for older browsers
            this._copyFallback(text);
        });
    }

    // Private methods

    _getElement(el) {
        if (!el) return null;
        return typeof el === 'string' ? document.getElementById(el) : el;
    }

    _init() {
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        }
        if (this.shareBtn) {
            this.shareBtn.addEventListener('click', () => {
                if (this.onShare) {
                    this.onShare(this.getCurrentText());
                }
            });
        }
    }

    _bindKeywordEvents() {
        const highlights = document.querySelectorAll('.keyword-highlight');

        highlights.forEach(el => {
            el.addEventListener('click', () => {
                if (this.onKeywordClick && this._currentData) {
                    const wordData = this._currentData.keywords.find(
                        k => k.word === el.dataset.word
                    );
                    if (wordData) {
                        this.onKeywordClick(wordData);
                    }
                }
            });
        });
    }

    _showCopySuccess() {
        if (!this.copyBtn) return;

        const originalText = this.copyBtn.innerText;
        this.copyBtn.innerText = '복사 완료!';
        this.copyBtn.classList.add('bg-primary', 'text-white');

        setTimeout(() => {
            this.copyBtn.innerText = originalText;
            this.copyBtn.classList.remove('bg-[#B2A5CF]', 'text-white');
        }, 2000);
    }

    _copyFallback(text) {
        const tempInput = document.createElement('textarea');
        tempInput.value = text;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
        this._showCopySuccess();
    }
}
