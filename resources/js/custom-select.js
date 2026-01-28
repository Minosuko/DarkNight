/**
 * Custom Select Pure JS Component
 * Replaces default select elements with stylized dropdowns
 */

class CustomSelect {
    constructor(element) {
        if (!element || element.nextElementSibling?.classList.contains('custom-select-container')) {
            return; // Already initialized or invalid
        }

        this.select = element;
        this.container = null;
        this.trigger = null;
        this.dropdown = null;
        this.options = [];

        this.init();
    }

    init() {
        // Create DOM Structure
        this.container = document.createElement('div');
        this.container.className = 'custom-select-container';

        this.trigger = document.createElement('div');
        this.trigger.className = 'custom-select-trigger';

        const selectedOption = this.select.options[this.select.selectedIndex];
        this.trigger.innerHTML = `
            <span>${selectedOption ? selectedOption.textContent : 'Select...'}</span>
            <i class="fa-solid fa-chevron-down"></i>
        `;

        this.dropdown = document.createElement('div');
        this.dropdown.className = 'custom-select-dropdown';

        // Build Options
        Array.from(this.select.options).forEach(opt => {
            const optUI = document.createElement('div');
            optUI.className = 'custom-select-option';
            optUI.textContent = opt.textContent;
            optUI.dataset.value = opt.value;

            if (opt.selected) {
                optUI.classList.add('selected');
            }

            optUI.addEventListener('click', (e) => {
                e.stopPropagation();
                this.selectOption(optUI);
            });

            this.dropdown.appendChild(optUI);
            this.options.push(optUI);
        });

        // Event Listeners
        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Assemble
        this.container.appendChild(this.trigger);
        this.container.appendChild(this.dropdown);

        // Insert after original select
        this.select.parentNode.insertBefore(this.container, this.select.nextSibling);

        // Hide original
        this.select.style.display = 'none';

        // Hide old sibling icons if any (compatibility)
        const oldIcon = this.select.parentNode.querySelector('.select-icon');
        if (oldIcon) oldIcon.style.display = 'none';
    }

    selectOption(optionElement) {
        // Update UI
        this.options.forEach(o => o.classList.remove('selected'));
        optionElement.classList.add('selected');

        this.trigger.querySelector('span').textContent = optionElement.textContent;

        // Update Original Select
        this.select.value = optionElement.dataset.value;
        this.select.dispatchEvent(new Event('change'));

        // Close
        this.close();
    }

    toggle() {
        // Close all other selects first
        document.querySelectorAll('.custom-select-container').forEach(el => {
            if (el !== this.container) el.classList.remove('open');
        });

        this.container.classList.toggle('open');
    }

    close() {
        this.container.classList.remove('open');
    }
}

// Global Initializer
window.initCustomSelects = function () {
    const selectors = [
        '.premium-select',
        '.setting-select',
        '.premium-select-sm',
        '.index_input_box',
        '.modal-privacy-select',
        '.custom-select',
        '.tos-select'
    ];

    document.querySelectorAll(selectors.join(',')).forEach(el => {
        new CustomSelect(el);
    });
};

// Close on outside click
document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select-container').forEach(el => {
        el.classList.remove('open');
    });
});
