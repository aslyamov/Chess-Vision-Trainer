/**
 * Утилиты для работы с шахматными позициями и ходами
 * TypeScript версия
 */
import type { TargetMoves, TargetColors, BadMove } from '../types/index.js';
export declare const SQUARES: readonly string[];
/**
 * Создаёт уникальный ключ для хода из координат
 * @param from - Начальное поле
 * @param to - Конечное поле
 * @returns Ключ хода (например, "e2-e4")
 */
export declare function getMoveKey(from: string, to: string): string;
/**
 * Форматирует секунды в MM:SS
 * @param seconds - Количество секунд
 * @returns Отформатированная строка времени
 */
export declare function formatTime(seconds: number): string;
/**
 * Перемешивание массива по алгоритму Фишера-Йетса
 * @template T
 * @param array - Массив для перемешивания
 * @returns Новый перемешанный массив (оригинал не изменяется)
 */
export declare function shuffleArray<T>(array: T[]): T[];
/**
 * Локализует шахматную нотацию (SAN) на указанный язык
 * @param san - Стандартная алгебраическая нотация
 * @param lang - Код языка ('ru' или 'en')
 * @returns Локализованная нотация
 */
export declare function localizeSAN(san: string, lang?: string): string;
/**
 * Проверяет, является ли ход "плохим" (ошибкой)
 * @param san - Ход в SAN нотации
 * @param badMovesList - Список плохих ходов
 * @returns true если ход плохой
 */
export declare function isBadMove(san: string, badMovesList: Array<string | BadMove>): boolean;
/**
 * Находит объект плохого хода по SAN
 * @param san - Ход в SAN нотации
 * @param badMovesList - Список плохих ходов
 * @returns Объект плохого хода или undefined
 */
export declare function findBadMoveObj(san: string, badMovesList: Array<string | BadMove>): string | BadMove | undefined;
/**
 * Получает все возможные ходы для всех фигур на доске
 * Включает ходы для ОБОИХ цветов (для режима свободной игры)
 * @param fen - Позиция в FEN нотации
 * @returns Map: поле → возможные назначения
 */
export declare function getAllDests(fen: string): Map<string, string[]>;
/**
 * Анализирует позицию и находит все шахи и взятия для обоих цветов
 * @param fen - Позиция в FEN нотации
 * @returns Объект с целевыми ходами для белых и чёрных
 */
export declare function analyzeTargets(fen: string): TargetColors;
/**
 * Получает все шахи и взятия для указанного цвета
 *
 * ОПТИМИЗАЦИЯ: Возвращает как массивы, так и Map для O(1) поиска
 *
 * @param fen - Позиция в FEN нотации
 * @param color - Цвет для анализа ('w' = белые, 'b' = чёрные)
 * @returns Объект с массивами ходов и Map для быстрого поиска
 */
export declare function getMovesForColor(fen: string, color: 'w' | 'b'): TargetMoves;
//# sourceMappingURL=chess-utils.d.ts.map