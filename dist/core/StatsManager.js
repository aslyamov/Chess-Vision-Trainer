/**
 * StatsManager - управление статистикой сессий
 * Сохраняет историю сессий, общую статистику, streaks
 */
const SESSIONS_KEY = 'chess_sessions';
const STATS_KEY = 'chess_all_time_stats';
const MAX_SESSIONS = 100; // Хранить последние 100 сессий
/**
 * Создаёт пустую статистику ходов
 */
function createEmptyMoveStats() {
    return {
        checksFound: 0,
        capturesFound: 0,
        totalChecks: 0,
        totalCaptures: 0,
        wChecks: { found: 0, total: 0 },
        wCaptures: { found: 0, total: 0 },
        bChecks: { found: 0, total: 0 },
        bCaptures: { found: 0, total: 0 }
    };
}
/**
 * Создаёт пустую общую статистику
 */
function createEmptyAllTimeStats() {
    const today = new Date().toISOString().split('T')[0];
    return {
        totalSessions: 0,
        totalPuzzles: 0,
        totalPuzzlesSolved: 0,
        totalTime: 0,
        bestAccuracy: 0,
        avgAccuracy: 0,
        moveStats: createEmptyMoveStats(),
        currentStreak: 0,
        longestStreak: 0,
        lastPlayedDate: '',
        firstPlayedDate: today
    };
}
/**
 * Генерирует UUID v4
 */
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
        this.sessions = this.loadSessions();
        this.allTimeStats = this.loadAllTimeStats();
        console.log(`[Stats] Загружено ${this.sessions.length} сессий`);
    }
    /**
     * Загружает сессии из localStorage
     */
    loadSessions() {
        try {
            const data = localStorage.getItem(SESSIONS_KEY);
            if (data) {
                return JSON.parse(data);
            }
        }
        catch (e) {
            console.warn('[Stats] Ошибка загрузки сессий:', e);
        }
        return [];
    }
    /**
     * Сохраняет сессии в localStorage
     */
    saveSessions() {
        try {
            // Оставляем только последние MAX_SESSIONS
            const toSave = this.sessions.slice(-MAX_SESSIONS);
            localStorage.setItem(SESSIONS_KEY, JSON.stringify(toSave));
        }
        catch (e) {
            console.warn('[Stats] Ошибка сохранения сессий:', e);
        }
    }
    /**
     * Загружает общую статистику из localStorage
     */
    loadAllTimeStats() {
        try {
            const data = localStorage.getItem(STATS_KEY);
            if (data) {
                return JSON.parse(data);
            }
        }
        catch (e) {
            console.warn('[Stats] Ошибка загрузки статистики:', e);
        }
        return createEmptyAllTimeStats();
    }
    /**
     * Сохраняет общую статистику в localStorage
     */
    saveAllTimeStats() {
        try {
            localStorage.setItem(STATS_KEY, JSON.stringify(this.allTimeStats));
        }
        catch (e) {
            console.warn('[Stats] Ошибка сохранения статистики:', e);
        }
    }
    /**
     * Сохраняет результат сессии
     */
    saveSession(sessionData) {
        const now = new Date();
        const session = {
            ...sessionData,
            id: generateUUID(),
            date: now.toISOString().split('T')[0],
            timestamp: now.getTime()
        };
        // Добавляем в историю
        this.sessions.push(session);
        this.saveSessions();
        // Обновляем общую статистику
        this.updateAllTimeStats(session);
        // Обновляем streak
        this.updateStreak(session.date);
        console.log('[Stats] Сессия сохранена:', session.id);
        return session;
    }
    /**
     * Обновляет общую статистику на основе новой сессии
     */
    updateAllTimeStats(session) {
        const stats = this.allTimeStats;
        stats.totalSessions++;
        stats.totalPuzzles += session.puzzleCount;
        stats.totalPuzzlesSolved += session.puzzlesSolved;
        stats.totalTime += session.totalTime;
        // Лучшая точность
        if (session.accuracy > stats.bestAccuracy) {
            stats.bestAccuracy = session.accuracy;
        }
        // Средняя точность (пересчитываем)
        const totalAccuracy = this.sessions.reduce((sum, s) => sum + s.accuracy, 0);
        stats.avgAccuracy = this.sessions.length > 0
            ? Math.round(totalAccuracy / this.sessions.length)
            : 0;
        // Статистика по ходам
        const ms = stats.moveStats;
        const sms = session.moveStats;
        ms.checksFound += sms.checksFound;
        ms.capturesFound += sms.capturesFound;
        ms.totalChecks += sms.totalChecks;
        ms.totalCaptures += sms.totalCaptures;
        ms.wChecks.found += sms.wChecks.found;
        ms.wChecks.total += sms.wChecks.total;
        ms.wCaptures.found += sms.wCaptures.found;
        ms.wCaptures.total += sms.wCaptures.total;
        ms.bChecks.found += sms.bChecks.found;
        ms.bChecks.total += sms.bChecks.total;
        ms.bCaptures.found += sms.bCaptures.found;
        ms.bCaptures.total += sms.bCaptures.total;
        this.saveAllTimeStats();
    }
    /**
     * Обновляет streak
     */
    updateStreak(todayDate) {
        const stats = this.allTimeStats;
        if (stats.lastPlayedDate === todayDate) {
            // Уже играли сегодня
            return;
        }
        // Вычисляем вчерашнюю дату
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        if (stats.lastPlayedDate === yesterday) {
            // Продолжаем streak
            stats.currentStreak++;
        }
        else if (stats.lastPlayedDate === '') {
            // Первая игра
            stats.currentStreak = 1;
        }
        else {
            // Пропустили день - streak сбрасывается
            stats.currentStreak = 1;
        }
        // Обновляем лучший streak
        if (stats.currentStreak > stats.longestStreak) {
            stats.longestStreak = stats.currentStreak;
        }
        stats.lastPlayedDate = todayDate;
        this.saveAllTimeStats();
    }
    /**
     * Возвращает общую статистику
     */
    getAllTimeStats() {
        return { ...this.allTimeStats };
    }
    /**
     * Возвращает историю сессий
     */
    getSessionHistory(limit) {
        const sessions = [...this.sessions].reverse(); // Новые сначала
        return limit ? sessions.slice(0, limit) : sessions;
    }
    /**
     * Возвращает последнюю сессию
     */
    getLastSession() {
        return this.sessions.length > 0
            ? this.sessions[this.sessions.length - 1]
            : null;
    }
    /**
     * Возвращает лучшую сессию по точности
     */
    getBestSession() {
        if (this.sessions.length === 0)
            return null;
        return this.sessions.reduce((best, session) => session.accuracy > best.accuracy ? session : best);
    }
    /**
     * Экспорт всех данных
     */
    exportData() {
        return {
            version: 1,
            exportDate: new Date().toISOString(),
            sessions: this.sessions,
            allTimeStats: this.allTimeStats
        };
    }
    /**
     * Импорт данных
     */
    importData(data) {
        try {
            if (data.version !== 1) {
                console.error('[Stats] Неподдерживаемая версия:', data.version);
                return false;
            }
            this.sessions = data.sessions || [];
            this.allTimeStats = data.allTimeStats || createEmptyAllTimeStats();
            this.saveSessions();
            this.saveAllTimeStats();
            console.log('[Stats] Данные импортированы');
            return true;
        }
        catch (e) {
            console.error('[Stats] Ошибка импорта:', e);
            return false;
        }
    }
    /**
     * Очищает всю статистику
     */
    clearAllStats() {
        this.sessions = [];
        this.allTimeStats = createEmptyAllTimeStats();
        this.saveSessions();
        this.saveAllTimeStats();
        console.log('[Stats] Статистика очищена');
    }
    /**
     * Вычисляет точность по ходам (общую)
     */
    getOverallAccuracy() {
        const ms = this.allTimeStats.moveStats;
        const total = ms.totalChecks + ms.totalCaptures;
        const found = ms.checksFound + ms.capturesFound;
        return total > 0 ? Math.round((found / total) * 100) : 0;
    }
}
// Singleton
export const statsManager = new StatsManager();
//# sourceMappingURL=StatsManager.js.map