/**
 * CommonStatsManager — общая статистика по всем играм.
 * Отслеживает серию дней активности (любая игра засчитывается).
 */
import { COMMON_STATS_KEY } from '../constants.js';
function today() {
    return new Date().toISOString().split('T')[0];
}
function daysBetween(a, b) {
    return Math.floor((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}
class CommonStatsManager {
    load() {
        try {
            const raw = localStorage.getItem(COMMON_STATS_KEY);
            return raw ? JSON.parse(raw) : this._empty();
        }
        catch {
            return this._empty();
        }
    }
    save(s) {
        try {
            localStorage.setItem(COMMON_STATS_KEY, JSON.stringify(s));
        }
        catch (e) {
            console.warn('CommonStatsManager: save failed', e);
        }
    }
    _empty() {
        return { currentStreak: 0, longestStreak: 0, lastPlayedDate: '', totalDaysPlayed: 0 };
    }
    /** Вызвать в конце любой игровой сессии */
    recordPlay() {
        const s = this.load();
        const t = today();
        if (s.lastPlayedDate === t)
            return; // уже засчитано сегодня
        const diff = s.lastPlayedDate ? daysBetween(s.lastPlayedDate, t) : null;
        // diff === 1 → серия продолжается; иначе (null или > 1) → начинаем заново
        s.currentStreak = diff === 1 ? s.currentStreak + 1 : 1;
        s.longestStreak = Math.max(s.longestStreak, s.currentStreak);
        s.totalDaysPlayed += 1;
        s.lastPlayedDate = t;
        this.save(s);
    }
    /**
     * Возвращает актуальную статистику.
     * Если с момента последней игры прошло > 1 дня — серия отображается как 0,
     * но запись в storage не трогается до следующего recordPlay().
     */
    getStats() {
        const s = this.load();
        if (s.lastPlayedDate && daysBetween(s.lastPlayedDate, today()) > 1) {
            // Вычисляем effective streak без записи в storage
            return { ...s, currentStreak: 0 };
        }
        return s;
    }
}
export const commonStatsManager = new CommonStatsManager();
//# sourceMappingURL=CommonStatsManager.js.map