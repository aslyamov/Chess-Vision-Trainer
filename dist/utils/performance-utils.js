/**
 * Утилиты для оптимизации производительности
 * TypeScript версия
 */
/**
 * Debounce - откладывает выполнение функции до паузы в вызовах
 * @param fn - Функция для выполнения
 * @param delay - Задержка в миллисекундах
 * @returns Обернутая функция с debounce
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}
//# sourceMappingURL=performance-utils.js.map