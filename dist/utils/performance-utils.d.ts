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
export declare function debounce<T extends AnyFunction>(fn: T, delay: number): (...args: Parameters<T>) => void;
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
export declare function throttle<T extends AnyFunction>(fn: T, delay: number): (...args: Parameters<T>) => void;
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
export declare function rafThrottle<T extends AnyFunction>(fn: T): (...args: Parameters<T>) => void;
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
export declare function memoize<T extends AnyFunction>(fn: T): (...args: Parameters<T>) => ReturnType<T>;
export {};
//# sourceMappingURL=performance-utils.d.ts.map