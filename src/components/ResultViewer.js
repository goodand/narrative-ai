import { showToast, ErrorLevel } from '../utils/errorHandler.js';

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
        resultImage,
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
        this.resultImage = this._getElement(resultImage);

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
     * @param {Object} data - Caption data with keywords and image
     */
    renderCaption(data) {
        console.log('ResultViewer: renderCaption invoked', { 
            hasImage: !!data.image, 
            captionLength: data.original_caption?.length 
        });

        if (!data || !data.original_caption) {
            console.error('ResultViewer: Invalid caption data provided');
            return;
        }

        this._currentData = data;
        let text = data.original_caption;

        // Update image if provided
        if (data.image && this.resultImage) {
            const img = this.resultImage;
            let imageSrc = data.image;

            // 접두사가 없는 순수 base64인 경우 처리 (안전장치)
            // blob: URL과 data: URL은 그대로 통과
            if (typeof imageSrc === 'string' && !imageSrc.startsWith('data:') && !imageSrc.startsWith('blob:')) {
                console.log('ResultViewer: Prepending data URL prefix to raw base64');
                imageSrc = `data:image/jpeg;base64,${imageSrc}`;
            }
            
            img.onload = () => {
                console.log('ResultViewer: Image successfully loaded');
                img.classList.remove('opacity-0');
            };
            
            img.onerror = (e) => {
                console.error('ResultViewer: Failed to load image. Src length:', imageSrc.length);
            };

            img.src = imageSrc;
        }

        try {
            if (data.keywords && Array.isArray(data.keywords) && data.keywords.length > 0) {
                // word 속성이 있는 유효한 데이터만 필터링
                const validKeywords = data.keywords.filter(item => item && typeof item.word === 'string');
                
                if (validKeywords.length > 0) {
                    const sortedKeywords = [...validKeywords].sort(
                        (a, b) => (b.word?.length || 0) - (a.word?.length || 0)
                    );

                    const pattern = sortedKeywords
                        .map(item => {
                            const escaped = item.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                            return `(${escaped})`;
                        })
                        .filter(p => p !== '()')
                        .join('|');

                    if (pattern) {
                        const regex = new RegExp(pattern, 'gi');
                        text = text.replace(regex, (match) => {
                            const item = validKeywords.find(k => k.word.toLowerCase() === match.toLowerCase()) || { word: match };
                            return `<span class="keyword-highlight" data-word="${item.word}">${match}</span>`;
                        });
                    }
                }
            }
        } catch (err) {
            console.error('ResultViewer: Keyword highlighting failed:', err);
            // 하이라이팅 실패 시 원본 텍스트만 표시하여 중단 방지
            text = data.original_caption;
        }

        if (this.interactiveCaption) {
            this.interactiveCaption.innerHTML = `"${text.replace(/\n/g, '<br>')}"`;
        }

        if (this.editCaption) {
            this.editCaption.value = data.original_caption;
        }

        this._bindKeywordEvents();
        console.log('ResultViewer: renderCaption completed');
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
        // Edit 버튼 클릭 → 편집 모드 진입
        if (this.editBtn) {
            this.editBtn.addEventListener('click', () => this.enterEditMode());
        }

        // Save 버튼 클릭 → 편집 모드 종료 및 저장
        if (this.saveBtn) {
            this.saveBtn.addEventListener('click', () => this.exitEditMode());
        }

        // Copy 버튼 클릭 → 클립보드 복사
        if (this.copyBtn) {
            this.copyBtn.addEventListener('click', () => this.copyToClipboard());
        }

        // Share 버튼 클릭 → 공유
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

        showToast('클립보드에 복사되었습니다.', ErrorLevel.INFO);

        const originalText = this.copyBtn.innerText;
        this.copyBtn.innerText = '복사 완료!';
        this.copyBtn.classList.add('bg-primary', 'text-dark-bg');

        setTimeout(() => {
            this.copyBtn.innerText = originalText;
            this.copyBtn.classList.remove('bg-primary', 'text-dark-bg');
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
