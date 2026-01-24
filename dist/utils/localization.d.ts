/**
 * Утилиты локализации
 * TypeScript версия
 */
import type { LocaleData, SupportedLocale } from '../types/index.js';
/**
 * Загружает файл языка и возвращает данные перевода
 * @param lang - Код языка ('ru' или 'en')
 * @returns Promise с данными перевода
 */
export declare function loadLanguageData(lang: SupportedLocale): Promise<LocaleData>;
/**
 * Применяет переводы к DOM элементам с атрибутом data-lang
 * @param langData - Объект с данными перевода
 */
export declare function applyTranslations(langData: LocaleData): void;
/**
 * Сохраняет текущий язык в localStorage
 * @param lang - Код языка
 */
export declare function saveLanguagePreference(lang: SupportedLocale): void;
/**
 * Загружает сохранённый язык из localStorage
 * @param defaultLang - Язык по умолчанию если ничего не сохранено
 * @returns Код языка
 */
export declare function loadLanguagePreference(defaultLang?: SupportedLocale): SupportedLocale;
/**
 * Устанавливает чекбокс языка как выбранный
 * @param lang - Код языка
 */
export declare function updateLanguageUI(lang: SupportedLocale): void;
//# sourceMappingURL=localization.d.ts.map