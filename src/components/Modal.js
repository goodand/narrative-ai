/**
 * Modal - Base Modal Component
 * 모달 다이얼로그 기본 클래스 및 파생 클래스들
 */

export class Modal {
    constructor(element) {
        this.element = typeof element === 'string'
            ? document.getElementById(element)
            : element;

        if (!this.element) {
            console.warn('Modal element not found');
            return;
        }

        this._setupCloseOnOutsideClick();
    }

    /**
     * Open the modal
     */
    open() {
        this.element?.classList.remove('hidden');
    }

    /**
     * Close the modal
     */
    close() {
        this.element?.classList.add('hidden');
    }

    /**
     * Toggle modal visibility
     */
    toggle() {
        this.element?.classList.toggle('hidden');
    }

    /**
     * Check if modal is open
     * @returns {boolean}
     */
    isOpen() {
        return !this.element?.classList.contains('hidden');
    }

    /**
     * Setup close button
     * @param {string|HTMLElement} closeButton - Close button element or ID
     */
    setCloseButton(closeButton) {
        const btn = typeof closeButton === 'string'
            ? document.getElementById(closeButton)
            : closeButton;

        if (btn) {
            btn.onclick = () => this.close();
        }
    }

    // Private methods

    _setupCloseOnOutsideClick() {
        this.element?.addEventListener('click', (e) => {
            if (e.target === this.element) {
                this.close();
            }
        });
    }
}

/**
 * SuggestionModal - Modal for displaying synonym suggestions
 */
export class SuggestionModal extends Modal {
    constructor(element, listElement) {
        super(element);
        this.listElement = typeof listElement === 'string'
            ? document.getElementById(listElement)
            : listElement;
    }

    /**
     * Render suggestions list
     * @param {Object} wordData - Word data with suggestions
     * @param {Function} onSelect - Callback when suggestion is selected
     */
    renderSuggestions(wordData, onSelect) {
        if (!this.listElement) return;

        this.listElement.innerHTML = '';

        // API 응답 구조: { word: "단어", alternatives: ["유의어1", ...] }
        const suggestions = wordData.alternatives || wordData.suggestions || [];

        if (suggestions.length === 0) {
            const noResult = document.createElement('p');
            noResult.className = "text-muted-lavender text-center py-4";
            noResult.innerText = "추천 유의어가 없습니다.";
            this.listElement.appendChild(noResult);
        } else {
            suggestions.forEach(suggestion => {
                const button = document.createElement('button');
                button.className = "w-full text-left p-4 hover:bg-primary hover:text-dark-bg rounded-3xl font-bold border border-white/10 bg-field-bg text-white mb-2 transition-colors duration-200 ease-in-out";
                button.innerText = suggestion;
                button.onclick = () => {
                    onSelect(suggestion, wordData.word);
                    this.close();
                };
                this.listElement.appendChild(button);
            });
        }

        this.open();
    }
}

// SettingsModal removed in slice 6 (M4): no callers remained after slice 5e.
// Re-add via dedicated component file if a future settings route needs it.

/**
 * ConfirmModal - Modal for confirmation dialogs
 */
export class ConfirmModal extends Modal {
    constructor(element) {
        super(element);
    }

    /**
     * 동적으로 내용을 채우고 모달을 표시
     */
    show({ title, message, confirmText = '확인', cancelText = '취소', onConfirm, onCancel }) {
        if (!this.element) return;
        const container = this.element.querySelector('div');
        if (container) {
            container.innerHTML = `
                <div class="mb-6">
                    <h3 class="text-lg font-bold text-white mb-2">${title}</h3>
                    <p class="text-muted-lavender text-sm leading-relaxed">${message}</p>
                </div>
                <div class="flex gap-3">
                    <button id="dyn-modal-cancel" class="flex-1 h-14 rounded-3xl font-bold bg-transparent border border-white/10 text-[#B2B0B5] hover:bg-white/5 transition-colors duration-200 ease-in-out">${cancelText}</button>
                    <button id="dyn-modal-confirm" class="flex-1 h-14 rounded-3xl font-bold bg-primary text-dark-bg hover:bg-primary/90 transition-colors duration-200 ease-in-out">${confirmText}</button>
                </div>
            `;
            this.setup({
                confirmBtn: 'dyn-modal-confirm',
                cancelBtn: 'dyn-modal-cancel',
                onConfirm,
                onCancel
            });
        }
        this.open();
    }

    /**
     * Setup confirm and cancel buttons
     * @param {Object} options
     */
    setup({ confirmBtn, cancelBtn, onConfirm, onCancel }) {
        const confirm = typeof confirmBtn === 'string'
            ? document.getElementById(confirmBtn)
            : confirmBtn;

        const cancel = typeof cancelBtn === 'string'
            ? document.getElementById(cancelBtn)
            : cancelBtn;

        if (confirm) {
            confirm.onclick = () => {
                this.close();
                onConfirm?.();
            };
        }

        if (cancel) {
            cancel.onclick = () => {
                this.close();
                onCancel?.();
            };
        }
    }
}
