/**
 * Главный оркестратор Chess Vision Trainer.
 * Отвечает за: инициализацию, язык, тему, навигацию и регистрацию модулей.
 *
 * Масштабирование на N игр:
 *   - Добавить модуль в _registerModules()
 *   - Всё остальное (tabs, stats, язык) подключается автоматически через IGameModule.
 */
import { PuzzleManager } from './PuzzleManager.js';
import { UIManager } from '../ui/UIManager.js';
import type { LocaleData, SupportedLocale } from '../types/index.js';
import type { AppContext } from './IGame.js';
export declare class ChessVisionTrainer implements AppContext {
    readonly Chessground: any;
    readonly uiManager: UIManager;
    private puzzleManager;
    private langData;
    private currentLang;
    constructor(ChessgroundLib: any);
    getPuzzleManager(): PuzzleManager;
    getLangData(): LocaleData;
    getCurrentLang(): SupportedLocale;
    init(): Promise<void>;
    loadLanguage(lang: SupportedLocale): Promise<void>;
    goHome(): void;
    openStats(): void;
    openSettings(): void;
    closeSettings(): void;
    redrawBoard(): void;
    destroy(): void;
    /**
     * Регистрирует все игровые модули.
     * Добавить игру 3 = реализовать IGameModule + одна строка здесь.
     */
    private _registerModules;
    private _initializeEventListeners;
    private _attachEventListeners;
    /**
     * Переключить активную вкладку статистики.
     * Скрывает все панели, показывает панель указанного модуля.
     */
    private _activateStatsTab;
    private _loadTheme;
    private _setTheme;
    private _applyTheme;
}
//# sourceMappingURL=ChessVisionTrainer.d.ts.map