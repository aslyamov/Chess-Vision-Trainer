/**
 * StatsScreen — экран общей статистики.
 * Data-driven: каждый модуль сам рендерит свою вкладку через renderStats().
 * При добавлении игры 3 — реализовать renderStats() в модуле; сюда лезть не надо.
 */
import type { IGameModule } from './IGame.js';
export declare class StatsScreen {
    /**
     * Отрисовать экран статистики.
     * @param modules — все зарегистрированные игровые модули
     */
    render(modules: IGameModule[]): void;
    private _renderCommon;
}
export declare const statsScreen: StatsScreen;
//# sourceMappingURL=StatsScreen.d.ts.map