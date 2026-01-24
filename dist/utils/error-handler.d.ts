/**
 * Централизованная система обработки ошибок
 * TypeScript версия
 */
import type { ErrorCategory } from '../types/index.js';
/** Категории ошибок */
export declare const ErrorCategories: Readonly<{
    LIBRARY_LOAD: "LIBRARY_LOAD";
    DATA_LOAD: "DATA_LOAD";
    VALIDATION: "VALIDATION";
    GAME_LOGIC: "GAME_LOGIC";
    UI_RENDER: "UI_RENDER";
    INITIALIZATION: "INITIALIZATION";
}>;
/**
 * Логирует ошибку с контекстом и полезными подсказками
 * @param category - Категория ошибки
 * @param message - Сообщение об ошибке
 * @param error - Объект ошибки (опционально)
 * @param context - Дополнительный контекст (опционально)
 */
export declare function logError(category: ErrorCategory, message: string, error?: Error | null, context?: Record<string, any>): void;
/**
 * Обёртка обработки ошибок для асинхронных функций
 * @param fn - Асинхронная функция для оборачивания
 * @param category - Категория ошибки
 * @param message - Сообщение об ошибке
 * @returns Обёрнутая функция
 */
export declare function handleAsync<T extends (...args: any[]) => Promise<any>>(fn: T, category: ErrorCategory, message: string): T;
//# sourceMappingURL=error-handler.d.ts.map