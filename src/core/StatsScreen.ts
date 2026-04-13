/**
 * StatsScreen — экран общей статистики.
 * Читает данные из StatsManager (игра 1) и localStorage (игра 2),
 * а также общую серию дней из CommonStatsManager.
 */

import { statsManager } from './StatsManager.js';
import { commonStatsManager } from './CommonStatsManager.js';
import { FIELD_COLOR_STATS_KEY } from '../constants.js';
import type { FieldColorAllTimeStats } from '../types/index.js';

function set(id: string, val: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

function pct(num: number, den: number): string {
    return den > 0 ? `${Math.round(num / den * 100)}%` : '—';
}

export class StatsScreen {
    /** Заполнить все элементы экрана актуальными данными */
    render(): void {
        this._renderCommon();
        this._renderChecksAndCaptures();
        this._renderFieldColor();
    }

    private _renderCommon(): void {
        const s = commonStatsManager.getStats();
        set('commonStreakCurrent', String(s.currentStreak));
        set('commonStreakLongest', String(s.longestStreak));
        set('commonDaysTotal',    String(s.totalDaysPlayed));
    }

    private _renderChecksAndCaptures(): void {
        const s = statsManager.getAllTimeStats();
        set('ccStatsSessions',  String(s.totalSessions));
        set('ccStatsAccuracy',  `${Math.round(s.avgAccuracy)}%`);
        set('ccStatsPuzzles',   String(s.totalPuzzlesSolved));

        const ms = s.moveStats;
        set('ccStatsWChecks',    `${ms.wChecks.found}/${ms.wChecks.total}`);
        set('ccStatsWCaptures',  `${ms.wCaptures.found}/${ms.wCaptures.total}`);
        set('ccStatsBChecks',    `${ms.bChecks.found}/${ms.bChecks.total}`);
        set('ccStatsBCaptures',  `${ms.bCaptures.found}/${ms.bCaptures.total}`);
    }

    private _renderFieldColor(): void {
        try {
            const raw = localStorage.getItem(FIELD_COLOR_STATS_KEY);
            const s: FieldColorAllTimeStats = raw
                ? JSON.parse(raw)
                : { totalSessions: 0, totalCorrect: 0, totalIncorrect: 0, allTimeBestStreak: 0 };

            const total = s.totalCorrect + s.totalIncorrect;
            set('fcStatsSessions',   String(s.totalSessions));
            set('fcStatsTotal',      String(total));
            set('fcStatsCorrect',    String(s.totalCorrect));
            set('fcStatsIncorrect',  String(s.totalIncorrect));
            set('fcStatsAccuracy',   pct(s.totalCorrect, total));
            set('fcStatsBestStreak', String(s.allTimeBestStreak));
        } catch { /* ничего — покажем нули из HTML */ }
    }
}

export const statsScreen = new StatsScreen();
