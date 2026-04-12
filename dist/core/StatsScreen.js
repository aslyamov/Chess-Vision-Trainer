/**
 * StatsScreen — экран общей статистики.
 * Читает данные из StatsManager (игра 1) и localStorage (игра 2),
 * а также общую серию дней из CommonStatsManager.
 */
import { statsManager } from './StatsManager.js';
import { commonStatsManager } from './CommonStatsManager.js';
import { FIELD_COLOR_STATS_KEY } from '../constants.js';
function set(id, val) {
    const el = document.getElementById(id);
    if (el)
        el.textContent = val;
}
function pct(num, den) {
    return den > 0 ? `${Math.round(num / den * 100)}%` : '—';
}
export class StatsScreen {
    /** Заполнить все элементы экрана актуальными данными */
    render() {
        this._renderCommon();
        this._renderChecksAndCaptures();
        this._renderFieldColor();
    }
    _renderCommon() {
        const s = commonStatsManager.getStats();
        set('commonStreakCurrent', String(s.currentStreak));
        set('commonStreakLongest', String(s.longestStreak));
        set('commonDaysTotal', String(s.totalDaysPlayed));
    }
    _renderChecksAndCaptures() {
        const s = statsManager.getAllTimeStats();
        set('ccStatsSessions', String(s.totalSessions));
        set('ccStatsAccuracy', `${Math.round(s.avgAccuracy)}%`);
        set('ccStatsPuzzles', String(s.totalPuzzlesSolved));
        const ms = s.moveStats;
        set('ccStatsWChecks', `${ms.wChecks.found}/${ms.wChecks.total}`);
        set('ccStatsWCaptures', `${ms.wCaptures.found}/${ms.wCaptures.total}`);
        set('ccStatsBChecks', `${ms.bChecks.found}/${ms.bChecks.total}`);
        set('ccStatsBCaptures', `${ms.bCaptures.found}/${ms.bCaptures.total}`);
    }
    _renderFieldColor() {
        try {
            const raw = localStorage.getItem(FIELD_COLOR_STATS_KEY);
            const s = raw
                ? JSON.parse(raw)
                : { totalSessions: 0, totalCorrect: 0, totalIncorrect: 0, allTimeBestStreak: 0 };
            const total = s.totalCorrect + s.totalIncorrect;
            set('fcStatsSessions', String(s.totalSessions));
            set('fcStatsCorrect', String(s.totalCorrect));
            set('fcStatsIncorrect', String(s.totalIncorrect));
            set('fcStatsAccuracy', pct(s.totalCorrect, total));
            set('fcStatsBestStreak', String(s.allTimeBestStreak));
        }
        catch { /* ничего — покажем нули из HTML */ }
    }
}
export const statsScreen = new StatsScreen();
//# sourceMappingURL=StatsScreen.js.map