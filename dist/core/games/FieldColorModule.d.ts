/**
 * Модуль игры «Цвет поля».
 * Самодостаточен: управляет своими event listeners, конфигом и жизненным циклом.
 * ChessVisionTrainer не знает деталей этой игры — только вызывает init() и onSelected().
 */
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
export declare class FieldColorModule implements IGameModule {
    readonly descriptor: GameDescriptor;
    private game;
    private ctx;
    init(ctx: AppContext): void;
    onSelected(): void;
    destroy(): void;
    private _launch;
    private _backToStart;
    private _restart;
    renderStats(): void;
    private _showResults;
    private _renderAllTimeStats;
    private _readConfigFromUI;
    private _applyConfigToUI;
    private _setupEventListeners;
    private _setupAutoSave;
}
//# sourceMappingURL=FieldColorModule.d.ts.map