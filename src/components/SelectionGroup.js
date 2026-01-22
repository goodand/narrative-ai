/**
 * SelectionGroup - Toggle Group Component
 * SNS 선택, 감정 온도 등 상호 배타적 옵션 그룹 관리
 */

export class SelectionGroup {
    /**
     * Create a SelectionGroup
     * @param {Object} options
     * @param {string|HTMLElement} options.container - Container element or selector
     * @param {string} options.itemSelector - CSS selector for items
     * @param {string} options.activeClass - Class to add when active
     * @param {string} options.inactiveClass - Class to add when inactive (optional)
     * @param {Function} options.onChange - Callback when selection changes
     */
    constructor({
        container,
        itemSelector,
        activeClass = 'active',
        inactiveClass = '',
        onChange = null
    }) {
        this.container = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        this.itemSelector = itemSelector;
        this.activeClass = activeClass.split(' ').filter(Boolean);
        this.inactiveClass = inactiveClass.split(' ').filter(Boolean);
        this.onChange = onChange;
        this._currentValue = null;

        if (this.container) {
            this._init();
        }
    }

    /**
     * Get current selected value
     * @returns {string|null}
     */
    getValue() {
        return this._currentValue;
    }

    /**
     * Set selected value programmatically
     * @param {string} value
     */
    setValue(value) {
        const items = this.container.querySelectorAll(this.itemSelector);
        items.forEach(item => {
            if (item.dataset.value === value) {
                this._selectItem(item);
            }
        });
    }

    /**
     * Get all items in the group
     * @returns {NodeList}
     */
    getItems() {
        return this.container.querySelectorAll(this.itemSelector);
    }

    // Private methods

    _init() {
        const items = this.getItems();

        items.forEach(item => {
            item.addEventListener('click', () => this._selectItem(item));

            // Initialize current value from pre-selected item
            if (this._hasActiveClass(item)) {
                this._currentValue = item.dataset.value;
            }
        });
    }

    _selectItem(selectedItem) {
        const items = this.getItems();
        const newValue = selectedItem.dataset.value;

        items.forEach(item => {
            if (item === selectedItem) {
                this._addActiveClass(item);
            } else {
                this._removeActiveClass(item);
            }
        });

        const oldValue = this._currentValue;
        this._currentValue = newValue;

        if (this.onChange && oldValue !== newValue) {
            this.onChange(newValue, oldValue);
        }
    }

    _hasActiveClass(item) {
        return this.activeClass.every(cls => item.classList.contains(cls));
    }

    _addActiveClass(item) {
        this.activeClass.forEach(cls => item.classList.add(cls));
        this.inactiveClass.forEach(cls => item.classList.remove(cls));
    }

    _removeActiveClass(item) {
        this.activeClass.forEach(cls => item.classList.remove(cls));
        this.inactiveClass.forEach(cls => item.classList.add(cls));
    }
}

/**
 * DropdownGroup - Standard select element wrapper
 */
export class DropdownGroup {
    /**
     * Create a DropdownGroup
     * @param {Object} options
     * @param {string|HTMLElement} options.element - Select element or ID
     * @param {Function} options.onChange - Callback when selection changes
     */
    constructor({ element, onChange = null }) {
        this.element = typeof element === 'string'
            ? document.getElementById(element)
            : element;

        this.onChange = onChange;

        if (this.element) {
            this._init();
        }
    }

    /**
     * Get current selected value
     * @returns {string}
     */
    getValue() {
        return this.element?.value || '';
    }

    /**
     * Set selected value
     * @param {string} value
     */
    setValue(value) {
        if (this.element) {
            this.element.value = value;
        }
    }

    /**
     * Get all options
     * @returns {Array}
     */
    getOptions() {
        if (!this.element) return [];
        return Array.from(this.element.options).map(opt => ({
            value: opt.value,
            text: opt.text
        }));
    }

    // Private methods

    _init() {
        this.element.addEventListener('change', (e) => {
            if (this.onChange) {
                this.onChange(e.target.value);
            }
        });
    }
}
