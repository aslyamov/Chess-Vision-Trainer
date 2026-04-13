/**
 * StatsScreen — экран общей статистики.
 * Data-driven: каждый модуль сам рендерит свою вкладку через renderStats().
 * При добавлении игры 3 — реализовать renderStats() в модуле; сюда лезть не надо.
 */
import { commonStatsManager } from './CommonStatsManager.js';
function set(id, val) {
    const el = document.getElementById(id);
    if (el)
        el.textContent = val;
}
export class StatsScreen {
    /**
     * Отрисовать экран статистики.
     * @param modules — все зарегистрированные игровые модули
     */
    render(modules) {
        this._renderCommon();
        modules.forEach(m => m.renderStats?.());
    }
    _renderCommon() {
        const s = commonStatsManager.getStats();
        set('commonStreakCurrent', String(s.currentStreak));
        set('commonStreakLongest', String(s.longestStreak));
        set('commonDaysTotal', String(s.totalDaysPlayed));
    }
}
export const statsScreen = new StatsScreen();
//# sourceMappingURL=StatsScreen.js.map