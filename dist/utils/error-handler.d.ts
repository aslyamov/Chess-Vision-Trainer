/**
 * Централизованная система обработки ошибок
 * TypeScript версия
 */
import type { ErrorCategory } from '../types/index.js';
/**
 * Логирует ошибку с контекстом и полезными подсказками
 * @param category - Категория ошибки
 * @param message - Сообщение об ошибке
 * @param error - Объект ошибки (опционально)
 * @param context - Дополнительный контекст (опционально)
 */
export declare function logError(category: ErrorCategory, message: string, error?: Error | null, context?: Record<string, any>): void;
//# sourceMappingURL=error-handler.d.ts.map