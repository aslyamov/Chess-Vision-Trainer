/**
 * StatsManager — статистика игры «Шахи и взятия».
 * Хранит историю сессий и агрегированные all-time данные в localStorage.
 */
import type { SessionRecord, AllTimeStats } from '../types/stats.js';
declare class StatsManager {
    private sessions;
    private allTimeStats;
    constructor();
    saveSession(sessionData: Omit<SessionRecord, 'id' | 'date' | 'timestamp'>): SessionRecord;
    getAllTimeStats(): AllTimeStats;
    clearAllStats(): void;
    private _updateAllTimeStats;
    private _loadSessions;
    private _saveSessions;
    private _loadAllTimeStats;
    private _saveAllTimeStats;
}
export declare const statsManager: StatsManager;
export {};
//# sourceMappingURL=StatsManager.d.ts.map