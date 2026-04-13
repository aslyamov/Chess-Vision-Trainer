/**
 * Модуль игры «Шахи и взятия».
 * Управляет GameSession, BoardRenderer и CCGameUI.
 * ChessVisionTrainer делегирует всю CC-специфику этому модулю.
 */
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
import type { LocaleData } from '../../types/index.js';
export declare class ChecksAndCapturesModule implements IGameModule {
    readonly descriptor: GameDescriptor;
    private session;
    private boardRenderer;
    private ccUI;
    private ctx;
    private _saveSettingsDebounced;
    private _destroyed;
    init(ctx: AppContext): void;
    onSelected(): void;
    destroy(): void;
    onLanguageChange(langData: LocaleData): void;
    renderStats(): void;
    startSession(): void;
    giveUp(): void;
    redrawBoard(): void;
    flipBoard(): void;
    restart(): void;
    resetProgress(): void;
    confirmReset(): void;
    cancelReset(): void;
    private _applyLiveSettings;
    private _updateAvailableCount;
    private _setupEventListeners;
    private _setupAutoSave;
    private _saveSettings;
    private _loadSettings;
}
//# sourceMappingURL=ChecksAndCapturesModule.d.ts.map