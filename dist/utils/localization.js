/**
 * Утилиты локализации
 * TypeScript версия
 */
import { logError } from './error-handler.js';
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
        logError('DATA_LOAD', // Временно используем as any
        `Ошибка загрузки языка: ${lang}`, error, { file: `locales/${lang}.json` });
        throw error;
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
}
/**
 * Сохраняет текущий язык в localStorage
 * @param lang - Код языка
 */
export function saveLanguagePreference(lang) {
    try {
        localStorage.setItem('chess_lang', lang);
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
        const saved = localStorage.getItem('chess_lang');
        return (saved === 'ru' || saved === 'en') ? saved : defaultLang;
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