/**
 * StatsManager - управление статистикой сессий
 * Сохраняет историю сессий, общую статистику, streaks
 */
import type { SessionRecord, AllTimeStats } from '../types/stats.js';
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
     * Очищает всю статистику
     */
    clearAllStats(): void;
}
export declare const statsManager: StatsManager;
export {};
//# sourceMappingURL=StatsManager.d.ts.map