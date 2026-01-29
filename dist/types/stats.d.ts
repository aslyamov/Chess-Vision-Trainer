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
    wChecks: {
        found: number;
        total: number;
    };
    wCaptures: {
        found: number;
        total: number;
    };
    bChecks: {
        found: number;
        total: number;
    };
    bCaptures: {
        found: number;
        total: number;
    };
}
/**
 * Запись одной сессии
 */
export interface SessionRecord {
    id: string;
    date: string;
    timestamp: number;
    difficulty: string;
    puzzleCount: number;
    puzzlesSolved: number;
    newPuzzlesSolved: number;
    totalTime: number;
    avgTime: number;
    accuracy: number;
    moveStats: MoveStatsRecord;
    mode: 'normal' | 'sequential' | 'goodMoves';
}
/**
 * Статистика за день
 */
export interface DailyStats {
    date: string;
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
    totalTime: number;
    bestAccuracy: number;
    avgAccuracy: number;
    moveStats: MoveStatsRecord;
    currentStreak: number;
    longestStreak: number;
    lastPlayedDate: string;
    firstPlayedDate: string;
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
//# sourceMappingURL=stats.d.ts.map