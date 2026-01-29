/**
 * Главный класс приложения Chess Vision Trainer
 * Оркестрирует все подсистемы и управляет жизненным циклом
 * TypeScript версия
 */
import { PuzzleManager } from './PuzzleManager.js';
import { GameSession } from './GameSession.js';
import { soundManager } from './SoundManager.js';
import { puzzleProgress } from './PuzzleProgressManager.js';
import { UIManager } from '../ui/UIManager.js';
import { BoardRenderer } from '../ui/BoardRenderer.js';
import { StatusManager } from '../ui/StatusManager.js';
import { loadLanguageData, applyTranslations, saveLanguagePreference, loadLanguagePreference, updateLanguageUI } from '../utils/localization.js';
import { logError } from '../utils/error-handler.js';
import { debounce } from '../utils/performance-utils.js';
// Ключи для localStorage
const SETTINGS_KEY = 'chess_vision_settings';
const THEME_KEY = 'chess_theme';
export class ChessVisionTrainer {
    constructor(ChessgroundLib) {
        this.boardRenderer = null;
        this.statusManager = null;
        this.gameSession = null;
        this.currentLang = 'ru';
        this.langData = {};
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
    async init() {
        try {
            // Load puzzles
            await this.puzzleManager.loadPuzzles('puzzles.json');
            // Load and apply theme
            this._loadTheme();
            // Load saved language
            this.currentLang = loadLanguagePreference('ru');
            // Load language data
            await this.loadLanguage(this.currentLang);
            // Initialize status manager
            const dom = this.uiManager.getDOM();
            this.statusManager = new StatusManager(dom, this.langData);
            // Restore settings
            this._loadSettings();
            // Update puzzle count and progress
            this._updateAvailableCount();
            this._updateProgress();
            console.log('✅ Chess Vision Trainer initialized');
            console.log('💡 Доступ через window.chessApp');
        }
        catch (error) {
            logError('INITIALIZATION', 'Ошибка инициализации', error);
            alert('Не удалось запустить приложение. Смотрите консоль для деталей.');
            throw error;
        }
    }
    /**
     * Загружает язык и применяет переводы
     */
    async loadLanguage(lang) {
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
        }
        catch (error) {
            console.error('Language loading error:', error);
        }
    }
    /**
     * Начинает новую игровую сессию
     */
    startSession() {
        // Get config
        const config = this.uiManager.getSessionConfig();
        // Preload sounds after user interaction (to avoid browser autoplay block)
        soundManager.preload();
        // Update sound setting
        const soundEnabled = document.getElementById('setSound')?.checked ?? true;
        soundManager.setEnabled(soundEnabled);
        // Destroy existing
        if (this.gameSession) {
            this.gameSession.destroy();
        }
        // Get puzzles
        const puzzles = this.puzzleManager.getPuzzles(config);
        // Create board
        const dom = this.uiManager.getDOM();
        this.boardRenderer = new BoardRenderer(dom.board, this.Chessground);
        // Create session with callback for overall stats
        this.gameSession = new GameSession(puzzles, config, this.uiManager, this.boardRenderer, this.statusManager, this.langData, this.currentLang, () => this.puzzleManager.getStatsByDifficulty(puzzleProgress.getSolvedIds()));
        this.gameSession.start();
        // Save settings
        this._saveSettings();
    }
    /**
     * Сдаться - перейти к следующему пазлу
     */
    giveUp() {
        if (this.gameSession) {
            this.gameSession.nextPuzzle();
        }
    }
    /**
     * Перевернуть доску
     */
    flipBoard() {
        if (this.boardRenderer) {
            this.boardRenderer.flipBoard();
        }
    }
    /**
     * Перезапустить приложение
     */
    restart() {
        location.reload();
    }
    /**
     * Закрыть модальное окно таймаута
     */
    closeTimeoutModal() {
        this.uiManager.closeTimeoutModal();
        if (this.gameSession) {
            this.gameSession.finish();
        }
    }
    /**
     * Показать модал подтверждения сброса прогресса
     */
    resetProgress() {
        const modal = document.getElementById('confirmResetModal');
        if (modal && modal.showModal) {
            modal.showModal();
        }
    }
    /**
     * Подтверждение сброса прогресса
     */
    confirmReset() {
        const modal = document.getElementById('confirmResetModal');
        if (modal && modal.close) {
            modal.close();
        }
        puzzleProgress.reset();
        this._updateProgress();
        this.restart();
    }
    /**
     * Отмена сброса прогресса
     */
    cancelReset() {
        const modal = document.getElementById('confirmResetModal');
        if (modal && modal.close) {
            modal.close();
        }
    }
    /**
     * Cleanup - уничтожает все ресурсы
     */
    destroy() {
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
    _initializeEventListeners() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._attachEventListeners());
        }
        else {
            this._attachEventListeners();
        }
    }
    /**
     * Привязывает event listeners к DOM
     */
    _attachEventListeners() {
        // Language switching
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.loadLanguage(e.target.value));
        });
        // Theme switching
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => this._setTheme(e.target.value));
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
        document.getElementById('resetProgressBtn')?.addEventListener('click', () => this.resetProgress());
        document.getElementById('confirmResetBtn')?.addEventListener('click', () => this.confirmReset());
        document.getElementById('cancelResetBtn')?.addEventListener('click', () => this.cancelReset());
        // Auto-save
        this._setupAutoSave();
    }
    /**
     * Настраивает автосохранение
     */
    _setupAutoSave() {
        // Difficulty
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
            radio.addEventListener('change', () => this._saveSettings());
        });
        // Inputs
        document.getElementById('taskCountInput')?.addEventListener('change', () => this._saveSettings());
        document.getElementById('timeLimitInput')?.addEventListener('change', () => this._saveSettings());
        // Checkboxes
        const checkboxIds = ['setSequential', 'setAutoFlip', 'setHighlights',
            'setHints', 'setStatusText', 'setShowLog', 'setGoodMoves', 'setSound'];
        checkboxIds.forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => this._saveSettingsDebounced());
        });
        console.log('✅ Автосохранение настроено');
    }
    /**
     * Сохранение настроек (immediate)
     */
    _saveSettings() {
        this._saveSettingsImmediate();
    }
    /**
     * Сохраняет настройки в localStorage
     */
    _saveSettingsImmediate() {
        try {
            const settings = {
                language: this.currentLang,
                difficulty: document.querySelector('input[name="difficulty"]:checked')?.value || 'medium',
                taskCount: document.getElementById('taskCountInput')?.value || '10',
                timeLimit: document.getElementById('timeLimitInput')?.value || '0',
                sequential: document.getElementById('setSequential')?.checked ?? false,
                autoFlip: document.getElementById('setAutoFlip')?.checked ?? true,
                highlights: document.getElementById('setHighlights')?.checked ?? true,
                hints: document.getElementById('setHints')?.checked ?? true,
                statusText: document.getElementById('setStatusText')?.checked ?? true,
                showLog: document.getElementById('setShowLog')?.checked ?? true,
                goodMoves: document.getElementById('setGoodMoves')?.checked ?? false,
                sound: document.getElementById('setSound')?.checked ?? true
            };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            console.log('💾 Настройки сохранены:', settings);
        }
        catch (e) {
            console.warn('Не удалось сохранить настройки:', e);
        }
    }
    /**
     * Загружает настройки из localStorage
     */
    _loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (!saved)
                return;
            const settings = JSON.parse(saved);
            console.log('📂 Восстановление настроек:', settings);
            // Difficulty
            if (settings.difficulty) {
                const diffRadio = document.querySelector(`input[name="difficulty"][value="${settings.difficulty}"]`);
                if (diffRadio)
                    diffRadio.checked = true;
            }
            // Inputs
            if (settings.taskCount) {
                const taskInput = document.getElementById('taskCountInput');
                if (taskInput)
                    taskInput.value = settings.taskCount;
            }
            if (settings.timeLimit) {
                const timeInput = document.getElementById('timeLimitInput');
                if (timeInput)
                    timeInput.value = settings.timeLimit;
            }
            // Checkboxes
            const setCheckbox = (id, value) => {
                const checkbox = document.getElementById(id);
                if (checkbox !== null)
                    checkbox.checked = value;
            };
            if (settings.sequential !== undefined)
                setCheckbox('setSequential', settings.sequential);
            if (settings.autoFlip !== undefined)
                setCheckbox('setAutoFlip', settings.autoFlip);
            if (settings.highlights !== undefined)
                setCheckbox('setHighlights', settings.highlights);
            if (settings.hints !== undefined)
                setCheckbox('setHints', settings.hints);
            if (settings.statusText !== undefined)
                setCheckbox('setStatusText', settings.statusText);
            if (settings.showLog !== undefined)
                setCheckbox('setShowLog', settings.showLog);
            if (settings.goodMoves !== undefined)
                setCheckbox('setGoodMoves', settings.goodMoves);
            if (settings.sound !== undefined)
                setCheckbox('setSound', settings.sound);
            console.log('✅ Настройки восстановлены');
        }
        catch (e) {
            console.warn('Не удалось загрузить настройки:', e);
        }
    }
    /**
     * Обновляет количество доступных пазлов
     */
    _updateAvailableCount() {
        const diffEl = document.querySelector('input[name="difficulty"]:checked');
        if (!diffEl)
            return;
        const difficulty = diffEl.value;
        const count = this.puzzleManager.getCount(difficulty);
        this.uiManager.updateAvailableCount(count);
    }
    /**
     * Обновляет индикатор прогресса (решённые задачи)
     */
    _updateProgress() {
        const total = this.puzzleManager.getTotalCount();
        const stats = puzzleProgress.getStats(total);
        const progressBar = document.getElementById('progressBar');
        if (progressBar)
            progressBar.value = stats.percentage;
    }
    // ====================
    // THEME METHODS
    // ====================
    /**
     * Загружает и применяет сохранённую тему
     */
    _loadTheme() {
        try {
            const savedTheme = localStorage.getItem(THEME_KEY);
            const theme = savedTheme === 'light' || savedTheme === 'dark' ? savedTheme : 'dark';
            this._applyTheme(theme);
        }
        catch (e) {
            this._applyTheme('dark');
        }
    }
    /**
     * Устанавливает тему и сохраняет в localStorage
     */
    _setTheme(theme) {
        this._applyTheme(theme);
        try {
            localStorage.setItem(THEME_KEY, theme);
            console.log(`🎨 Тема изменена на: ${theme}`);
        }
        catch (e) {
            console.warn('Не удалось сохранить тему:', e);
        }
    }
    /**
     * Применяет тему к документу
     */
    _applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        // Update radio button
        const themeRadio = document.querySelector(`input[name="theme"][value="${theme}"]`);
        if (themeRadio) {
            themeRadio.checked = true;
        }
    }
}
//# sourceMappingURL=ChessVisionTrainer.js.map