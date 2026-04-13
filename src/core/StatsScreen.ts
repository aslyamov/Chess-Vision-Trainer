/**
 * StatsScreen — экран общей статистики.
 * Data-driven: каждый модуль сам рендерит свою вкладку через renderStats().
 * При добавлении игры 3 — реализовать renderStats() в модуле; сюда лезть не надо.
 */

import { commonStatsManager } from './CommonStatsManager.js';
import type { IGameModule } from './IGame.js';

function set(id: string, val: string): void {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}

export class StatsScreen {
    /**
     * Отрисовать экран статистики.
     * @param modules — все зарегистрированные игровые модули
     */
    render(modules: IGameModule[]): void {
        this._renderCommon();
        modules.forEach(m => m.renderStats?.());
    }

    private _renderCommon(): void {
        const s = commonStatsManager.getStats();
        set('commonStreakCurrent', String(s.currentStreak));
        set('commonStreakLongest', String(s.longestStreak));
        set('commonDaysTotal',    String(s.totalDaysPlayed));
    }
}

export const statsScreen = new StatsScreen();
