/**
 * StatsManager - управление статистикой сессий
 * Сохраняет историю сессий, общую статистику, streaks
 */
import type { SessionRecord, AllTimeStats, StatsExportData } from '../types/stats.js';
declare class StatsManager {
    private sessions;
    private allTimeStats;
    constructor();
    /**
     * Загружает сессии из localStorage
     */
    private loadSessions;
    /**
     * Сохраняет сессии в localStorage
     */
    private saveSessions;
    /**
     * Загружает общую статистику из localStorage
     */
    private loadAllTimeStats;
    /**
     * Сохраняет общую статистику в localStorage
     */
    private saveAllTimeStats;
    /**
     * Сохраняет результат сессии
     */
    saveSession(sessionData: Omit<SessionRecord, 'id' | 'date' | 'timestamp'>): SessionRecord;
    /**
     * Обновляет общую статистику на основе новой сессии
     */
    private updateAllTimeStats;
    /**
     * Обновляет streak
     */
    private updateStreak;
    /**
     * Возвращает общую статистику
     */
    getAllTimeStats(): AllTimeStats;
    /**
     * Возвращает историю сессий
     */
    getSessionHistory(limit?: number): SessionRecord[];
    /**
     * Возвращает последнюю сессию
     */
    getLastSession(): SessionRecord | null;
    /**
     * Возвращает лучшую сессию по точности
     */
    getBestSession(): SessionRecord | null;
    /**
     * Экспорт всех данных
     */
    exportData(): StatsExportData;
    /**
     * Импорт данных
     */
    importData(data: StatsExportData): boolean;
    /**
     * Очищает всю статистику
     */
    clearAllStats(): void;
    /**
     * Вычисляет точность по ходам (общую)
     */
    getOverallAccuracy(): number;
}
export declare const statsManager: StatsManager;
export {};
//# sourceMappingURL=StatsManager.d.ts.map