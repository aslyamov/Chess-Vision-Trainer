/**
 * CommonStatsManager — общая статистика по всем играм.
 * Отслеживает серию дней активности (любая игра засчитывается).
 */

import { COMMON_STATS_KEY } from '../constants.js';

interface CommonStats {
    currentStreak:  number;
    longestStreak:  number;
    lastPlayedDate: string; // YYYY-MM-DD
    totalDaysPlayed: number;
}

function today(): string {
    return new Date().toISOString().split('T')[0];
}

function daysBetween(a: string, b: string): number {
    return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86_400_000);
}

class CommonStatsManager {
    private load(): CommonStats {
        try {
            const raw = localStorage.getItem(COMMON_STATS_KEY);
            return raw ? JSON.parse(raw) : this._empty();
        } catch { return this._empty(); }
    }

    private save(s: CommonStats): void {
        try { localStorage.setItem(COMMON_STATS_KEY, JSON.stringify(s)); }
        catch (e) { console.warn('CommonStatsManager: save failed', e); }
    }

    private _empty(): CommonStats {
        return { currentStreak: 0, longestStreak: 0, lastPlayedDate: '', totalDaysPlayed: 0 };
    }

    /** Вызвать в конце любой игровой сессии */
    recordPlay(): void {
        const s = this.load();
        const t = today();

        if (s.lastPlayedDate === t) return; // уже засчитано сегодня

        const diff = s.lastPlayedDate ? daysBetween(s.lastPlayedDate, t) : null;

        s.currentStreak  = diff === 1 ? s.currentStreak + 1 : 1;
        s.longestStreak  = Math.max(s.longestStreak, s.currentStreak);
        s.totalDaysPlayed += 1;
        s.lastPlayedDate = t;

        this.save(s);
    }

    getStats(): CommonStats {
        const s = this.load();
        // Сбросить серию если вчера не играли
        if (s.lastPlayedDate && daysBetween(s.lastPlayedDate, today()) > 1) {
            s.currentStreak = 0;
            this.save(s);
        }
        return s;
    }
}

export const commonStatsManager = new CommonStatsManager();
