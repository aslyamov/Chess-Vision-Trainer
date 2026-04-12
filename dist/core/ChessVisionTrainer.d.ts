/**
 * Главный оркестратор Chess Vision Trainer.
 * Отвечает за: инициализацию, язык, тему, навигацию и регистрацию игровых модулей.
 * Вся игровая логика делегирована модулям (IGameModule) через GameRegistry.
 */
import { PuzzleManager } from './PuzzleManager.js';
import { UIManager } from '../ui/UIManager.js';
import { StatusManager } from '../ui/StatusManager.js';
import type { LocaleData, SupportedLocale } from '../types/index.js';
import type { AppContext } from './IGame.js';
export declare class ChessVisionTrainer implements AppContext {
    readonly Chessground: any;
    readonly uiManager: UIManager;
    private puzzleManager;
    private statusManager;
    private langData;
    private currentLang;
    constructor(ChessgroundLib: any);
    getStatusManager(): StatusManager;
    getPuzzleManager(): PuzzleManager;
    getLangData(): LocaleData;
    getCurrentLang(): SupportedLocale;
    init(): Promise<void>;
    loadLanguage(lang: SupportedLocale): Promise<void>;
    goHome(): void;
    openSettings(): void;
    closeSettings(): void;
    private _openStats;
    /** Перерисовать активную доску — вызывается при resize окна */
    redrawBoard(): void;
    destroy(): void;
    /**
     * Регистрирует все игровые модули.
     * Добавить новую игру = создать IGameModule + добавить строчку здесь.
     */
    private _registerModules;
    private _initializeEventListeners;
    private _attachEventListeners;
    private _loadTheme;
    private _setTheme;
    private _applyTheme;
}
//# sourceMappingURL=ChessVisionTrainer.d.ts.map