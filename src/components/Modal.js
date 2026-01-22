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

        wordData.suggestions.forEach(suggestion => {
            const button = document.createElement('button');
            button.className = "w-full text-left p-4 hover:bg-[#B2A5CF] hover:text-white rounded-xl font-bold border border-slate-100 mb-2 transition-colors";
            button.innerText = suggestion;
            button.onclick = () => {
                onSelect(suggestion, wordData.word);
                this.close();
            };
            this.listElement.appendChild(button);
        });

        this.open();
    }
}

/**
 * SettingsModal - Modal for system settings
 */
export class SettingsModal extends Modal {
    constructor(element, inputElement) {
        super(element);
        this.inputElement = typeof inputElement === 'string'
            ? document.getElementById(inputElement)
            : inputElement;
    }

    /**
     * Get the current input value
     * @returns {string}
     */
    getValue() {
        return this.inputElement?.value.trim() || '';
    }

    /**
     * Set the input value
     * @param {string} value
     */
    setValue(value) {
        if (this.inputElement) {
            this.inputElement.value = value;
        }
    }

    /**
     * Setup save button with callback
     * @param {string|HTMLElement} saveButton
     * @param {Function} onSave
     */
    setSaveButton(saveButton, onSave) {
        const btn = typeof saveButton === 'string'
            ? document.getElementById(saveButton)
            : saveButton;

        if (btn) {
            btn.onclick = () => {
                const value = this.getValue();
                if (value) {
                    onSave(value);
                }
                this.close();
            };
        }
    }
}

/**
 * ConfirmModal - Modal for confirmation dialogs
 */
export class ConfirmModal extends Modal {
    constructor(element) {
        super(element);
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
