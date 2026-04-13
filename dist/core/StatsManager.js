/**
 * StatsManager — статистика игры «Шахи и взятия».
 * Хранит историю сессий и агрегированные all-time данные в localStorage.
 */
import { SESSIONS_KEY, ALL_TIME_STATS_KEY as STATS_KEY } from '../constants.js';
const MAX_SESSIONS = 100;
function createEmptyMoveStats() {
    return {
        wChecks: { found: 0, total: 0 },
        wCaptures: { found: 0, total: 0 },
        bChecks: { found: 0, total: 0 },
        bCaptures: { found: 0, total: 0 },
    };
}
function createEmptyAllTimeStats() {
    return {
        totalSessions: 0,
        totalPuzzles: 0,
        totalPuzzlesSolved: 0,
        totalTime: 0,
        bestAccuracy: 0,
        avgAccuracy: 0,
        moveStats: createEmptyMoveStats(),
        firstPlayedDate: new Date().toISOString().split('T')[0],
    };
}
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
class StatsManager {
    constructor() {
        this.sessions = [];
        this.sessions = this._loadSessions();
        this.allTimeStats = this._loadAllTimeStats();
        console.log(`[Stats] Загружено ${this.sessions.length} сессий`);
    }
    // ─── CRUD ────────────────────────────────────────────────────────────────
    saveSession(sessionData) {
        const now = new Date();
        const session = {
            ...sessionData,
            id: generateUUID(),
            date: now.toISOString().split('T')[0],
            timestamp: now.getTime(),
        };
        this.sessions.push(session);
        this._saveSessions();
        this._updateAllTimeStats(session);
        this._saveAllTimeStats();
        console.log('[Stats] Сессия сохранена:', session.id);
        return session;
    }
    getAllTimeStats() {
        return { ...this.allTimeStats };
    }
    clearAllStats() {
        this.sessions = [];
        this.allTimeStats = createEmptyAllTimeStats();
        this._saveSessions();
        this._saveAllTimeStats();
        console.log('[Stats] Статистика очищена');
    }
    // ─── Private ─────────────────────────────────────────────────────────────
    _updateAllTimeStats(session) {
        const s = this.allTimeStats;
        const ms = s.moveStats;
        const sm = session.moveStats;
        s.totalSessions++;
        s.totalPuzzles += session.puzzleCount;
        s.totalPuzzlesSolved += session.puzzlesSolved;
        s.totalTime += session.totalTime;
        if (session.accuracy > s.bestAccuracy) {
            s.bestAccuracy = session.accuracy;
        }
        // avgAccuracy пересчитывается по всем сессиям точно
        const totalAcc = this.sessions.reduce((sum, r) => sum + r.accuracy, 0);
        s.avgAccuracy = this.sessions.length > 0
            ? Math.round(totalAcc / this.sessions.length)
            : 0;
        // Move stats по цветам (без избыточных агрегатов)
        ms.wChecks.found += sm.wChecks.found;
        ms.wChecks.total += sm.wChecks.total;
        ms.wCaptures.found += sm.wCaptures.found;
        ms.wCaptures.total += sm.wCaptures.total;
        ms.bChecks.found += sm.bChecks.found;
        ms.bChecks.total += sm.bChecks.total;
        ms.bCaptures.found += sm.bCaptures.found;
        ms.bCaptures.total += sm.bCaptures.total;
    }
    _loadSessions() {
        try {
            const data = localStorage.getItem(SESSIONS_KEY);
            return data ? JSON.parse(data) : [];
        }
        catch (e) {
            console.warn('[Stats] Ошибка загрузки сессий:', e);
            return [];
        }
    }
    _saveSessions() {
        try {
            localStorage.setItem(SESSIONS_KEY, JSON.stringify(this.sessions.slice(-MAX_SESSIONS)));
        }
        catch (e) {
            console.warn('[Stats] Ошибка сохранения сессий:', e);
        }
    }
    _loadAllTimeStats() {
        try {
            const data = localStorage.getItem(STATS_KEY);
            if (data) {
                const parsed = JSON.parse(data);
                // Миграция: если в старых данных нет moveStats — подставить пустые
                if (!parsed.moveStats)
                    parsed.moveStats = createEmptyMoveStats();
                return parsed;
            }
        }
        catch (e) {
            console.warn('[Stats] Ошибка загрузки статистики:', e);
        }
        return createEmptyAllTimeStats();
    }
    _saveAllTimeStats() {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(this.allTimeStats));
        }
        catch (e) {
            console.warn('[Stats] Ошибка сохранения статистики:', e);
        }
    }
}
export const statsManager = new StatsManager();
//# sourceMappingURL=StatsManager.js.map