/**
 * Утилиты локализации
 * TypeScript версия
 */
import { logError } from './error-handler.js';
import { SETTINGS_KEY } from '../constants.js';
/**
 * Загружает файл языка и возвращает данные перевода
 * @param lang - Код языка ('ru' или 'en')
 * @returns Promise с данными перевода
 */
export async function loadLanguageData(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return await response.json();
    }
    catch (error) {
        logError('DATA_LOAD', `Ошибка загрузки языка: ${lang}`, error, { file: `locales/${lang}.json` });
        // Fallback: try Russian, then return empty object so app still works
        if (lang !== 'ru') {
            try {
                const fallback = await fetch('locales/ru.json');
                if (fallback.ok)
                    return await fallback.json();
            }
            catch { /* ignore */ }
        }
        return {};
    }
}
/**
 * Применяет переводы к DOM элементам с атрибутом data-lang
 * @param langData - Объект с данными перевода
 */
export function applyTranslations(langData) {
    document.querySelectorAll('[data-lang]').forEach(el => {
        const key = el.getAttribute('data-lang');
        if (key && langData[key]) {
            if (el.tagName === 'INPUT' && el.getAttribute('aria-label')) {
                el.setAttribute('aria-label', langData[key]);
            }
            else {
                el.textContent = langData[key];
            }
        }
    });
    // Handle data-lang-aria (aria-label translations for non-text elements)
    document.querySelectorAll('[data-lang-aria]').forEach(el => {
        const key = el.getAttribute('data-lang-aria');
        if (key && langData[key]) {
            el.setAttribute('aria-label', langData[key]);
        }
    });
}
/**
 * Сохраняет текущий язык в localStorage (внутри chess_vision_settings)
 * @param lang - Код языка
 */
export function saveLanguagePreference(lang) {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        const settings = raw ? JSON.parse(raw) : {};
        settings.language = lang;
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
    catch (e) {
        console.warn('localStorage недоступен:', e);
    }
}
/**
 * Загружает сохранённый язык из localStorage
 * @param defaultLang - Язык по умолчанию если ничего не сохранено
 * @returns Код языка
 */
export function loadLanguagePreference(defaultLang = 'ru') {
    try {
        const raw = localStorage.getItem(SETTINGS_KEY);
        if (raw) {
            const settings = JSON.parse(raw);
            if (settings.language === 'ru' || settings.language === 'en')
                return settings.language;
        }
        return defaultLang;
    }
    catch (e) {
        return defaultLang;
    }
}
/**
 * Устанавливает чекбокс языка как выбранный
 * @param lang - Код языка
 */
export function updateLanguageUI(lang) {
    const input = document.querySelector(`input[name="language"][value="${lang}"]`);
    if (input) {
        input.checked = true;
    }
}
//# sourceMappingURL=localization.js.map