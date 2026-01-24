/**
 * Главный класс приложения Chess Vision Trainer
 * Оркестрирует все подсистемы и управляет жизненным циклом
 * TypeScript версия
 */
import type { SupportedLocale } from '../types/index.js';
export declare class ChessVisionTrainer {
    private Chessground;
    private puzzleManager;
    private uiManager;
    private boardRenderer;
    private statusManager;
    private gameSession;
    private currentLang;
    private langData;
    private _saveSettingsDebounced;
    constructor(ChessgroundLib: any);
    /**
     * Инициализирует приложение
     */
    init(): Promise<void>;
    /**
     * Загружает язык и применяет переводы
     */
    loadLanguage(lang: SupportedLocale): Promise<void>;
    /**
     * Начинает новую игровую сессию
     */
    startSession(): void;
    /**
     * Сдаться - перейти к следующему пазлу
     */
    giveUp(): void;
    /**
     * Перевернуть доску
     */
    flipBoard(): void;
    /**
     * Перезапустить приложение
     */
    restart(): void;
    /**
     * Закрыть модальное окно таймаута
     */
    closeTimeoutModal(): void;
    /**
     * Cleanup - уничтожает все ресурсы
     */
    destroy(): void;
    /**
     * Инициализирует event listeners
     */
    private _initializeEventListeners;
    /**
     * Привязывает event listeners к DOM
     */
    private _attachEventListeners;
    /**
     * Настраивает автосохранение
     */
    private _setupAutoSave;
    /**
     * Сохранение настроек (immediate)
     */
    private _saveSettings;
    /**
     * Сохраняет настройки в localStorage
     */
    private _saveSettingsImmediate;
    /**
     * Загружает настройки из localStorage
     */
    private _loadSettings;
    /**
     * Обновляет количество доступных пазлов
     */
    private _updateAvailableCount;
}
//# sourceMappingURL=ChessVisionTrainer.d.ts.map