/**
 * Утилиты для оптимизации производительности
 * TypeScript версия
 */

type AnyFunction = (...args: any[]) => any;

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
export function debounce<T extends AnyFunction>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    return function (this: any, ...args: Parameters<T>): void {
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
export function throttle<T extends AnyFunction>(fn: T, delay: number): (...args: Parameters<T>) => void {
    let lastCall = 0;
    return function (this: any, ...args: Parameters<T>): void {
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
export function rafThrottle<T extends AnyFunction>(fn: T): (...args: Parameters<T>) => void {
    let rafId: number | null = null;
    return function (this: any, ...args: Parameters<T>): void {
        if (rafId !== null) return;

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
export function memoize<T extends AnyFunction>(fn: T): (...args: Parameters<T>) => ReturnType<T> {
    const cache = new Map<string, ReturnType<T>>();
    return function (this: any, ...args: Parameters<T>): ReturnType<T> {
        const key = JSON.stringify(args);
        if (cache.has(key)) {
            return cache.get(key)!;
        }
        const result = fn.apply(this, args) as ReturnType<T>;
        cache.set(key, result);
        return result;
    };
}
