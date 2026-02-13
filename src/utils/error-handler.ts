/**
 * Централизованная система обработки ошибок
 * TypeScript версия
 */

import type { ErrorCategory, ErrorLog } from '../types/index.js';

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
