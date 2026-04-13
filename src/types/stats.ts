/**
 * Типы для системы статистики игры «Шахи и взятия»
 */

/**
 * Статистика ходов с разбивкой по цвету и типу.
 * Избыточные агрегаты (checksFound/totalChecks и т.д.) удалены —
 * они вычисляются как wChecks.found + bChecks.found при необходимости.
 */
export interface MoveStatsRecord {
    wChecks:   { found: number; total: number };
    wCaptures: { found: number; total: number };
    bChecks:   { found: number; total: number };
    bCaptures: { found: number; total: number };
}

/**
 * Запись одной сессии «Шахов и взятий»
 */
export interface SessionRecord {
    id: string;               // UUID
    date: string;             // ISO date "2026-01-27"
    timestamp: number;        // Unix ms
    difficulty: string;       // easy / medium / hard / all
    puzzleCount: number;
    puzzlesSolved: number;
    newPuzzlesSolved: number;
    totalTime: number;        // секунды
    avgTime: number;          // секунды на задачу
    accuracy: number;         // 0–100
    moveStats: MoveStatsRecord;
    mode: 'normal' | 'sequential' | 'goodMoves';
}

/**
 * Общая статистика за всё время (CC)
 */
export interface AllTimeStats {
    totalSessions: number;
    totalPuzzles: number;
    totalPuzzlesSolved: number;
    totalTime: number;        // секунды
    bestAccuracy: number;
    avgAccuracy: number;
    moveStats: MoveStatsRecord;
    firstPlayedDate: string;  // ISO date
}
