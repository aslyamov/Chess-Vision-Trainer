/**
 * Главный класс приложения Chess Vision Trainer
 * Оркестрирует все подсистемы и управляет жизненным циклом
 * TypeScript версия
 */

import { PuzzleManager } from './PuzzleManager.js';
import { GameSession } from './GameSession.js';
import { UIManager } from '../ui/UIManager.js';
import { BoardRenderer } from '../ui/BoardRenderer.js';
import { StatusManager } from '../ui/StatusManager.js';
import {
    loadLanguageData,
    applyTranslations,
    saveLanguagePreference,
    loadLanguagePreference,
    updateLanguageUI
} from '../utils/localization.js';
import { logError } from '../utils/error-handler.js';
import { debounce } from '../utils/performance-utils.js';
import type { LocaleData, SupportedLocale } from '../types/index.js';

// Ключ для localStorage
const SETTINGS_KEY = 'chess_vision_settings';

export class ChessVisionTrainer {
    private Chessground: any;
    private puzzleManager: PuzzleManager;
    private uiManager: UIManager;
    private boardRenderer: BoardRenderer | null = null;
    private statusManager: StatusManager | null = null;
    private gameSession: GameSession | null = null;
    private currentLang: SupportedLocale = 'ru';
    private langData: LocaleData = {};
    private _saveSettingsDebounced: ReturnType<typeof debounce>;

    constructor(ChessgroundLib: any) {
        this.Chessground = ChessgroundLib;

        // Managers
        this.puzzleManager = new PuzzleManager();
        this.uiManager = new UIManager();

        // ОПТИМИЗАЦИЯ: Debounce для сохранения настроек
        // Откладывает сохранение до паузы в изменениях (300мс)
        this._saveSettingsDebounced = debounce(this._saveSettingsImmediate.bind(this), 300);

        this._initializeEventListeners();
    }

    /**
     * Инициализирует приложение
     */
    async init(): Promise<void> {
        try {
            // Load puzzles
            await this.puzzleManager.loadPuzzles('puzzles.json');

            // Load saved language
            this.currentLang = loadLanguagePreference('ru');

            // Load language data
            await this.loadLanguage(this.currentLang);

            // Initialize status manager
            const dom = this.uiManager.getDOM();
            this.statusManager = new StatusManager(dom, this.langData);

            // Restore settings
            this._loadSettings();

            // Update puzzle count
            this._updateAvailableCount();

            console.log('✅ Chess Vision Trainer initialized');
            console.log('💡 Доступ через window.chessApp');
        } catch (error) {
            logError('INITIALIZATION' as any, 'Ошибка инициализации', error as Error);
            alert('Не удалось запустить приложение. Смотрите консоль для деталей.');
            throw error;
        }
    }

    /**
     * Загружает язык и применяет переводы
     */
    async loadLanguage(lang: SupportedLocale): Promise<void> {
        try {
            this.langData = await loadLanguageData(lang);
            this.currentLang = lang;

            saveLanguagePreference(lang);
            applyTranslations(this.langData);
            updateLanguageUI(lang);

            // Update status manager
            if (this.statusManager) {
                this.statusManager.updateLanguage(this.langData);
            }

            console.log(`✅ Язык изменен на: ${lang}`);
        } catch (error) {
            console.error('Language loading error:', error);
        }
    }

    /**
     * Начинает новую игровую сессию
     */
    startSession(): void {
        // Get config
        const config = this.uiManager.getSessionConfig();

        // Destroy existing
        if (this.gameSession) {
            this.gameSession.destroy();
        }

        // Get puzzles
        const puzzles = this.puzzleManager.getPuzzles(config);

        // Create board
        const dom = this.uiManager.getDOM();
        this.boardRenderer = new BoardRenderer(dom.board!, this.Chessground);

        // Create session
        this.gameSession = new GameSession(
            puzzles,
            config,
            this.uiManager,
            this.boardRenderer,
            this.statusManager!,
            this.langData,
            this.currentLang
        );

        this.gameSession.start();

        // Save settings
        this._saveSettings();
    }

    /**
     * Сдаться - перейти к следующему пазлу
     */
    giveUp(): void {
        if (this.gameSession) {
            this.gameSession.nextPuzzle();
        }
    }

    /**
     * Перевернуть доску
     */
    flipBoard(): void {
        if (this.boardRenderer) {
            this.boardRenderer.flipBoard();
        }
    }

    /**
     * Перезапустить приложение
     */
    restart(): void {
        location.reload();
    }

    /**
     * Закрыть модальное окно таймаута
     */
    closeTimeoutModal(): void {
        this.uiManager.closeTimeoutModal();
        if (this.gameSession) {
            this.gameSession.finish();
        }
    }

    /**
     * Cleanup - уничтожает все ресурсы
     */
    destroy(): void {
        if (this.gameSession) {
            this.gameSession.destroy();
            this.gameSession = null;
        }
        if (this.boardRenderer) {
            this.boardRenderer.destroy();
            this.boardRenderer = null;
        }
        if (this.statusManager) {
            this.statusManager.destroy();
        }
        this.uiManager.destroy();

        console.log('♻️ Chess Vision Trainer destroyed');
    }

    // ====================
    // PRIVATE METHODS
    // ====================

    /**
     * Инициализирует event listeners
     */
    private _initializeEventListeners(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._attachEventListeners());
        } else {
            this._attachEventListeners();
        }
    }

    /**
     * Привязывает event listeners к DOM
     */
    private _attachEventListeners(): void {
        // Language switching
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.loadLanguage((e.target as HTMLInputElement).value as SupportedLocale));
        });

        // Difficulty change
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
            radio.addEventListener('change', () => this._updateAvailableCount());
        });

        // Buttons
        const startBtn = document.getElementById('startGameBtn') || document.getElementById('startSessionBtn');
        startBtn?.addEventListener('click', () => this.startSession());

        document.getElementById('giveUpBtn')?.addEventListener('click', () => this.giveUp());
        document.getElementById('flipBoardBtn')?.addEventListener('click', () => this.flipBoard());
        document.getElementById('closeModalBtn')?.addEventListener('click', () => this.closeTimeoutModal());
        document.getElementById('restartBtn')?.addEventListener('click', () => this.restart());

        // Auto-save
        this._setupAutoSave();
    }

    /**
     * Настраивает автосохранение
     */
    private _setupAutoSave(): void {
        // Difficulty
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
            radio.addEventListener('change', () => this._saveSettings());
        });

        // Inputs
        document.getElementById('taskCountInput')?.addEventListener('change', () => this._saveSettings());
        document.getElementById('timeLimitInput')?.addEventListener('change', () => this._saveSettings());

        // Checkboxes
        const checkboxIds = ['setSequential', 'setAutoFlip', 'setHighlights',
            'setHints', 'setStatusText', 'setShowLog', 'setGoodMoves'];
        checkboxIds.forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this._saveSettingsDebounced());
        });

        console.log('✅ Автосохранение настроено');
    }

    /**
     * Сохранение настроек (immediate)
     */
    private _saveSettings(): void {
        this._saveSettingsImmediate();
    }

    /**
     * Сохраняет настройки в localStorage
     */
    private _saveSettingsImmediate(): void {
        try {
            const settings = {
                language: this.currentLang,
                difficulty: (document.querySelector('input[name="difficulty"]:checked') as HTMLInputElement)?.value || 'medium',
                taskCount: (document.getElementById('taskCountInput') as HTMLInputElement)?.value || '10',
                timeLimit: (document.getElementById('timeLimitInput') as HTMLInputElement)?.value || '0',
                sequential: (document.getElementById('setSequential') as HTMLInputElement)?.checked ?? false,
                autoFlip: (document.getElementById('setAutoFlip') as HTMLInputElement)?.checked ?? true,
                highlights: (document.getElementById('setHighlights') as HTMLInputElement)?.checked ?? true,
                hints: (document.getElementById('setHints') as HTMLInputElement)?.checked ?? true,
                statusText: (document.getElementById('setStatusText') as HTMLInputElement)?.checked ?? true,
                showLog: (document.getElementById('setShowLog') as HTMLInputElement)?.checked ?? true,
                goodMoves: (document.getElementById('setGoodMoves') as HTMLInputElement)?.checked ?? false
            };

            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            console.log('💾 Настройки сохранены:', settings);
        } catch (e) {
            console.warn('Не удалось сохранить настройки:', e);
        }
    }

    /**
     * Загружает настройки из localStorage
     */
    private _loadSettings(): void {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (!saved) return;

            const settings = JSON.parse(saved);
            console.log('📂 Восстановление настроек:', settings);

            // Difficulty
            if (settings.difficulty) {
                const diffRadio = document.querySelector<HTMLInputElement>(`input[name="difficulty"][value="${settings.difficulty}"]`);
                if (diffRadio) diffRadio.checked = true;
            }

            // Inputs
            if (settings.taskCount) {
                const taskInput = document.getElementById('taskCountInput') as HTMLInputElement;
                if (taskInput) taskInput.value = settings.taskCount;
            }
            if (settings.timeLimit) {
                const timeInput = document.getElementById('timeLimitInput') as HTMLInputElement;
                if (timeInput) timeInput.value = settings.timeLimit;
            }

            // Checkboxes
            const setCheckbox = (id: string, value: boolean) => {
                const checkbox = document.getElementById(id) as HTMLInputElement;
                if (checkbox !== null) checkbox.checked = value;
            };

            if (settings.sequential !== undefined) setCheckbox('setSequential', settings.sequential);
            if (settings.autoFlip !== undefined) setCheckbox('setAutoFlip', settings.autoFlip);
            if (settings.highlights !== undefined) setCheckbox('setHighlights', settings.highlights);
            if (settings.hints !== undefined) setCheckbox('setHints', settings.hints);
            if (settings.statusText !== undefined) setCheckbox('setStatusText', settings.statusText);
            if (settings.showLog !== undefined) setCheckbox('setShowLog', settings.showLog);
            if (settings.goodMoves !== undefined) setCheckbox('setGoodMoves', settings.goodMoves);

            console.log('✅ Настройки восстановлены');
        } catch (e) {
            console.warn('Не удалось загрузить настройки:', e);
        }
    }

    /**
     * Обновляет количество доступных пазлов
     */
    private _updateAvailableCount(): void {
        const diffEl = document.querySelector<HTMLInputElement>('input[name="difficulty"]:checked');
        if (!diffEl) return;

        const difficulty = diffEl.value;
        const count = this.puzzleManager.getCount(difficulty);

        this.uiManager.updateAvailableCount(count);
    }
}
