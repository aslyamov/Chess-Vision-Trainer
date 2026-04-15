/**
 * Модуль игры «Материальный перевес».
 * Управляет вводом ответа: тогл [Белые / Равно / Чёрные] + степпер числа + кнопка «Проверить».
 */
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
export declare class MaterialModule implements IGameModule {
    readonly descriptor: GameDescriptor;
    private game;
    private ctx;
    private selectedSide;
    private selectedValue;
    private inputLocked;
    init(ctx: AppContext): void;
    onSelected(): void;
    destroy(): void;
    renderStats(): void;
    private _launch;
    private _backToStart;
    private _restart;
    private _showResults;
    private _renderAllTimeStats;
    private _resetInput;
    private _selectSide;
    private _adjustValue;
    private _submitAnswer;
    private _renderInput;
    private _readConfigFromUI;
    private _applyConfigToUI;
    private _setupEventListeners;
    private _setupAutoSave;
}
//# sourceMappingURL=MaterialModule.d.ts.map