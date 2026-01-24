/**
 * Утилиты для оптимизации производительности
 * TypeScript версия
 */
/**
 * Debounce - откладывает выполнение функции до паузы в вызовах
 *
 * Полезно для событий, которые происходят часто (ввод текста, изменение размера окна),
 * но обработка нужна только после завершения серии событий.
 *
 * @param fn - Функция для выполнения
 * @param delay - Задержка в миллисекундах
 * @returns Обернутая функция с debounce
 *
 * @example
 * const saveSettings = debounce(() => {
 *   localStorage.setItem('settings', JSON.stringify(settings));
 * }, 500);
 *
 * checkbox.addEventListener('change', saveSettings);
 */
export function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}
/**
 * Throttle - ограничивает частоту вызовов функции
 *
 * Гарантирует, что функция вызывается не чаще указанного интервала,
 * даже если событие происходит чаще.
 *
 * @param fn - Функция для выполнения
 * @param delay - Минимальный интервал между вызовами (мс)
 * @returns Обернутая функция с throttle
 *
 * @example
 * const updateUI = throttle(() => {
 *   counter.textContent = count;
 * }, 16); // Максимум 60 FPS (1000ms / 60 = 16.67ms)
 */
export function throttle(fn, delay) {
    let lastCall = 0;
    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            lastCall = now;
            fn.apply(this, args);
        }
    };
}
/**
 * RequestAnimationFrame throttle - оптимизированный для анимаций
 *
 * Использует requestAnimationFrame для синхронизации с частотой обновления экрана.
 * Идеально для визуальных обновлений.
 *
 * @param fn - Функция для выполнения
 * @returns Обернутая функция
 *
 * @example
 * const updateAnimation = rafThrottle(() => {
 *   element.style.transform = `translateX(${position}px)`;
 * });
 *
 * window.addEventListener('scroll', updateAnimation);
 */
export function rafThrottle(fn) {
    let rafId = null;
    return function (...args) {
        if (rafId !== null)
            return;
        rafId = requestAnimationFrame(() => {
            fn.apply(this, args);
            rafId = null;
        });
    };
}
/**
 * Memoize - кэширует результаты функции
 *
 * Сохраняет результаты вызовов функции и возвращает кэшированный результат
 * при повторных вызовах с теми же аргументами.
 *
 * @param fn - Функция для мемоизации
 * @returns Мемоизированная функция
 *
 * @example
 * const expensiveCalculation = memoize((n: number) => {
 *   // Сложные вычисления
 *   return n * n;
 * });
 *
 * expensiveCalculation(5); // Вычисляется
 * expensiveCalculation(5); // Возвращается из кэша
 */
export function memoize(fn) {
    const cache = new Map();
    return function (...args) {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key);
        }
        const result = fn.apply(this, args);
        cache.set(key, result);
        return result;
    };
}
//# sourceMappingURL=performance-utils.js.map