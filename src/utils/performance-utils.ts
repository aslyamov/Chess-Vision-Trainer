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
export function debounce<T extends AnyFunction>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return function (this: any, ...args: Parameters<T>): void {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}
