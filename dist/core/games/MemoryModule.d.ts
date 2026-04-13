/**
 * Модуль игры «Запоминание позиции».
 * Управляет жизненным циклом MemoryGame, настройками и статистикой.
 * ChessVisionTrainer делегирует всю Memory-специфику этому модулю.
 */
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
export declare class MemoryModule implements IGameModule {
    readonly descriptor: GameDescriptor;
    private game;
    private ctx;
    private _autoSaveListeners;
    init(ctx: AppContext): void;
    onSelected(): void;
    destroy(): void;
    renderStats(): void;
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
//# sourceMappingURL=MemoryModule.d.ts.map