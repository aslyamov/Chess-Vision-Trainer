/**
 * Утилиты для оптимизации производительности
 * TypeScript версия
 */
type AnyFunction = (...args: any[]) => any;
/**
 * Debounce - откладывает выполнение функции до паузы в вызовах
 * @param fn - Функция для выполнения
 * @param delay - Задержка в миллисекундах
 * @returns Обернутая функция с debounce
 */
export declare function debounce<T extends AnyFunction>(fn: T, delay: number): (...args: Parameters<T>) => void;
export {};
//# sourceMappingURL=performance-utils.d.ts.map