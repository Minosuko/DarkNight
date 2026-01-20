/**
 * i18n.js - Modernized Internationalization Module
 * Centralizes language loading, translation, and DOM updates.
 */

const i18n = (function () {
    let currentLang = localStorage.getItem("language") || "en-us";
    let langData = {};

    // Initialize by loading language data
    function init() {
        const cachedData = localStorage.getItem("language_data");
        if (cachedData) {
            try {
                langData = JSON.parse(cachedData);
            } catch (e) {
                console.error("i18n: Failed to parse cached language data", e);
                fetchLanguage(currentLang);
                return;
            }
        } else {
            fetchLanguage(currentLang);
            return;
        }

        // Apply translations to existing DOM
        updateDOM();

        // Watch for new content and translate it automatically
        observeDOM();
    }

    function fetchLanguage(lang) {
        currentLang = lang;
        localStorage.setItem("language", lang);

        // Note: Using fetch instead of $.get for zero-dependency initialization
        fetch(`resources/language/${lang}.json`)
            .then(response => response.json())
            .then(data => {
                langData = data;
                localStorage.setItem("language_data", JSON.stringify(data));

                // If we're loading a new language, we usually want to refresh 
                // to ensure everything (including JS-rendered strings) updates.
                // But for initial load, we just update the DOM.
                if (window.location.reload) {
                    window.location.reload();
                } else {
                    updateDOM();
                }
            })
            .catch(err => {
                console.error("i18n: Failed to fetch language file", err);
            });
    }

    /**
     * Translate a key with optional placeholder replacement.
     * Use case: i18n.t('lang__001', { name: 'Alice' }) -> "Hello Alice" if string is "Hello {{name}}"
     */
    function t(key, placeholders = {}) {
        let text = langData[key] || key;

        if (placeholders) {
            Object.keys(placeholders).forEach(p => {
                text = text.replace(new RegExp(`{{${p}}}`, 'g'), placeholders[p]);
            });
        }

        return text;
    }

    /**
     * Scans the document for <lang> tags and [data-lang] attributes and translates them.
     */
    function updateDOM(root = document) {
        // 1. Handle <lang lang="key"> elements
        const langTags = root.querySelectorAll('lang[lang]');
        langTags.forEach(el => {
            const key = el.getAttribute('lang');
            if (el.getAttribute('lang_set') === 'true') return;

            const translated = t(key);
            if (translated !== key) {
                const tagName = el.tagName.toLowerCase();
                // Special handling for legacy input inside lang tags (though <lang> usually wraps text)
                if (tagName === 'input') {
                    const type = el.getAttribute('type');
                    if (type === 'submit' || type === 'button') {
                        el.value = translated;
                    } else {
                        el.placeholder = translated;
                    }
                } else {
                    el.innerHTML = translated;
                }
                el.setAttribute('lang_set', 'true');
            }
        });

        // 2. Handle [data-lang] attributes (modern approach)
        const dataLangTags = root.querySelectorAll('[data-lang]');
        dataLangTags.forEach(el => {
            const key = el.getAttribute('data-lang');
            const target = el.getAttribute('data-lang-target') || 'innerHTML';
            const translated = t(key);

            if (translated !== key) {
                if (target === 'placeholder') {
                    el.placeholder = translated;
                } else if (target === 'value') {
                    el.value = translated;
                } else if (target === 'title') {
                    el.title = translated;
                } else {
                    el.innerHTML = translated;
                }
            }
        });

        // 3. Legacy: Handle <input lang="key">
        const inputs = root.querySelectorAll('input[lang]');
        inputs.forEach(el => {
            const key = el.getAttribute('lang');
            if (el.getAttribute('lang_set') === 'true') return;

            const translated = t(key);
            if (translated !== key) {
                const type = el.getAttribute('type');
                if (type === 'submit' || type === 'button') {
                    el.value = translated;
                } else {
                    el.placeholder = translated;
                }
                el.setAttribute('lang_set', 'true');
            }
        });
    }

    function observeDOM() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === 1) { // Element node
                            updateDOM(node);
                        }
                    });
                }
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function changeLanguage(lang) {
        localStorage.removeItem("language_data");
        fetchLanguage(lang);
    }

    function getLang() {
        return currentLang;
    }

    // Expose public API
    return {
        init,
        t,
        updateDOM,
        changeLanguage,
        getLang,
        data: () => langData // For debugging or direct access if needed
    };
})();

// Auto-initialize i18n
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', i18n.init);
} else {
    i18n.init();
}

// For backward compatibility while we refactor
window.load_lang = i18n.updateDOM;
window.changeLanguage = i18n.changeLanguage;
