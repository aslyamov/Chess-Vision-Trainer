/**
 * Модуль игры «Материальный перевес».
 * Показывается позиция; игрок угадывает у кого перевес и на сколько очков.
 */
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
export declare class MaterialModule implements IGameModule {
    readonly descriptor: GameDescriptor;
    private game;
    private ctx;
    init(ctx: AppContext): void;
    onSelected(): void;
    destroy(): void;
    renderStats(): void;
    redrawBoard(): void;
    private _launch;
    private _backToStart;
    private _restart;
    private _showResults;
    private _renderAllTimeStats;
    private _readConfigFromUI;
    private _applyConfigToUI;
    private _setupEventListeners;
    private _setupAutoSave;
}
//# sourceMappingURL=MaterialModule.d.ts.map