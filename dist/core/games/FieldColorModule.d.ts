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
    private _keyHandler;
    private _listeners;
    init(ctx: AppContext): void;
    onSelected(): void;
    /** Полный снос модуля (вызывается при выходе в главное меню). */
    destroy(): void;
    /** Останавливает текущую игру и клавиатурный обработчик, не трогая слушатели модуля. */
    private _destroyGame;
    private _launch;
    private _backToStart;
    private _restart;
    renderStats(): void;
    private _showResults;
    private _renderAllTimeStats;
    private _readConfigFromUI;
    private _applyConfigToUI;
    /** Registers a tracked event listener that will be removed on destroy(). */
    private _on;
    private _setupEventListeners;
    private _setupKeyboard;
    private _setupAutoSave;
}
//# sourceMappingURL=FieldColorModule.d.ts.map