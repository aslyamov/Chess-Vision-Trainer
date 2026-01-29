/**
 * Типы для системы статистики
 * Фаза 1: Базовая статистика
 */

/**
 * Статистика по ходам (шахи/взятия)
 */
export interface MoveStatsRecord {
    checksFound: number;
    capturesFound: number;
    totalChecks: number;
    totalCaptures: number;
    // По цветам
    wChecks: { found: number; total: number };
    wCaptures: { found: number; total: number };
    bChecks: { found: number; total: number };
    bCaptures: { found: number; total: number };
}

/**
 * Запись одной сессии
 */
export interface SessionRecord {
    id: string;                // UUID
    date: string;              // ISO date "2026-01-27"
    timestamp: number;         // Unix timestamp
    difficulty: string;        // easy/medium/hard/all
    puzzleCount: number;       // Количество задач в сессии
    puzzlesSolved: number;     // Решено задач
    newPuzzlesSolved: number;  // Новых задач решено
    totalTime: number;         // Время в секундах
    avgTime: number;           // Среднее время на задачу
    accuracy: number;          // Точность 0-100
    moveStats: MoveStatsRecord;
    mode: 'normal' | 'sequential' | 'goodMoves';
}

/**
 * Статистика за день
 */
export interface DailyStats {
    date: string;              // "2026-01-27"
    sessions: number;
    puzzlesSolved: number;
    totalTime: number;
    avgAccuracy: number;
    bestAccuracy: number;
    moveStats: MoveStatsRecord;
}

/**
 * Общая статистика за всё время
 */
export interface AllTimeStats {
    totalSessions: number;
    totalPuzzles: number;
    totalPuzzlesSolved: number;
    totalTime: number;         // В секундах
    bestAccuracy: number;
    avgAccuracy: number;
    // Статистика по ходам
    moveStats: MoveStatsRecord;
    // Streaks
    currentStreak: number;     // Дней подряд
    longestStreak: number;
    lastPlayedDate: string;    // ISO date
    firstPlayedDate: string;   // ISO date
}

/**
 * Данные для экспорта/импорта
 */
export interface StatsExportData {
    version: number;
    exportDate: string;
    sessions: SessionRecord[];
    allTimeStats: AllTimeStats;
}
