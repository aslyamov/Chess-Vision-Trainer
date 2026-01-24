/**
 * Централизованная система обработки ошибок
 * TypeScript версия
 */

import type { ErrorCategory, ErrorLog } from '../types/index.js';

/** Категории ошибок */
export const ErrorCategories = Object.freeze({
    LIBRARY_LOAD: 'LIBRARY_LOAD' as const,
    DATA_LOAD: 'DATA_LOAD' as const,
    VALIDATION: 'VALIDATION' as const,
    GAME_LOGIC: 'GAME_LOGIC' as const,
    UI_RENDER: 'UI_RENDER' as const,
    INITIALIZATION: 'INITIALIZATION' as const
});

/**
 * Логирует ошибку с контекстом и полезными подсказками
 * @param category - Категория ошибки
 * @param message - Сообщение об ошибке
 * @param error - Объект ошибки (опционально)
 * @param context - Дополнительный контекст (опционально)
 */
export function logError(
    category: ErrorCategory,
    message: string,
    error: Error | null = null,
    context: Record<string, any> = {}
): void {
    console.group(`🔴 [${category}] ${message}`);
    console.error('Время:', new Date().toISOString());
    if (error) console.error('Ошибка:', error);
    if (Object.keys(context).length > 0) console.table(context);

    const tips: Record<string, string> = {
        LIBRARY_LOAD: 'Проверьте интернет и CDN',
        DATA_LOAD: 'Проверьте puzzles.json и веб-сервер',
        VALIDATION: 'Проверьте корректность данных',
        GAME_LOGIC: 'Проверьте FEN и ход',
        UI_RENDER: 'Проверьте DOM элементы',
        INITIALIZATION: 'Проверьте инициализацию приложения'
    };

    if (tips[category]) {
        console.info('💡', tips[category]);
    }
    console.groupEnd();

    // Сохраняем ошибки в localStorage
    try {
        const log: ErrorLog[] = JSON.parse(localStorage.getItem('chess_error_log') || '[]');
        log.push({
            category,
            message,
            timestamp: Date.now(),
            context: {
                error: error?.message,
                stack: error?.stack
            }
        });
        localStorage.setItem('chess_error_log', JSON.stringify(log.slice(-10)));
    } catch (e) {
        // localStorage недоступен
    }
}

/**
 * Обёртка обработки ошибок для асинхронных функций
 * @param fn - Асинхронная функция для оборачивания
 * @param category - Категория ошибки
 * @param message - Сообщение об ошибке
 * @returns Обёрнутая функция
 */
export function handleAsync<T extends (...args: any[]) => Promise<any>>(
    fn: T,
    category: ErrorCategory,
    message: string
): T {
    return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
        try {
            return await fn(...args);
        } catch (error) {
            logError(category, message, error as Error);
            throw error;
        }
    }) as T;
}
