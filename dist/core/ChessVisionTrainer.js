/**
 * Главный оркестратор Chess Vision Trainer.
 * Отвечает за: инициализацию, язык, тему, навигацию и регистрацию игровых модулей.
 * Вся игровая логика делегирована модулям (IGameModule) через GameRegistry.
 */
import { PuzzleManager } from './PuzzleManager.js';
import { UIManager } from '../ui/UIManager.js';
import { StatusManager } from '../ui/StatusManager.js';
import { gameRegistry } from './GameRegistry.js';
import { FieldColorModule } from './games/FieldColorModule.js';
import { ChecksAndCapturesModule } from './games/ChecksAndCapturesModule.js';
import { statsScreen } from './StatsScreen.js';
import { loadLanguageData, applyTranslations, saveLanguagePreference, loadLanguagePreference, updateLanguageUI } from '../utils/localization.js';
import { logError } from '../utils/error-handler.js';
import { THEME_KEY } from '../constants.js';
export class ChessVisionTrainer {
    constructor(ChessgroundLib) {
        this.statusManager = null;
        this.langData = {};
        this.currentLang = 'ru';
        this.Chessground = ChessgroundLib;
        this.uiManager = new UIManager();
        this.puzzleManager = new PuzzleManager();
        this._registerModules();
        this._initializeEventListeners();
    }
    // ── AppContext ────────────────────────────────────────────────────────
    getStatusManager() { return this.statusManager; }
    getPuzzleManager() { return this.puzzleManager; }
    getLangData() { return this.langData; }
    getCurrentLang() { return this.currentLang; }
    // ── Инициализация ─────────────────────────────────────────────────────
    async init() {
        try {
            await this.puzzleManager.loadPuzzles('puzzles.json');
            this._loadTheme();
            this.currentLang = loadLanguagePreference('ru');
            await this.loadLanguage(this.currentLang);
            this.statusManager = new StatusManager(this.uiManager.getDOM(), this.langData);
            console.log('✅ Chess Vision Trainer initialized');
            console.log('💡 Доступ через window.chessApp');
        }
        catch (error) {
            logError('INITIALIZATION', 'Ошибка инициализации', error);
            alert('Не удалось запустить приложение. Смотрите консоль для деталей.');
            throw error;
        }
    }
    // ── Язык ─────────────────────────────────────────────────────────────
    async loadLanguage(lang) {
        try {
            this.langData = await loadLanguageData(lang);
            this.currentLang = lang;
            saveLanguagePreference(lang);
            applyTranslations(this.langData);
            updateLanguageUI(lang);
            if (this.statusManager) {
                this.statusManager.updateLanguage(this.langData);
            }
            console.log(`✅ Язык изменен на: ${lang}`);
        }
        catch (error) {
            console.error('Language loading error:', error);
        }
    }
    // ── Навигация ─────────────────────────────────────────────────────────
    goHome() {
        gameRegistry.getAll().forEach(m => m.destroy());
        this.uiManager.showHomeScreen();
    }
    // ── Настройки ─────────────────────────────────────────────────────────
    openSettings() {
        document.getElementById('settingsModal')?.showModal?.();
    }
    closeSettings() {
        document.getElementById('settingsModal')?.close?.();
    }
    _openStats() {
        statsScreen.render();
        this.uiManager.switchView('statsScreen');
    }
    /** Перерисовать активную доску — вызывается при resize окна */
    redrawBoard() {
        gameRegistry.getAll().forEach(m => m.redrawBoard?.());
    }
    // ── Очистка ───────────────────────────────────────────────────────────
    destroy() {
        gameRegistry.getAll().forEach(m => m.destroy());
        if (this.statusManager)
            this.statusManager.destroy();
        this.uiManager.destroy();
        console.log('♻️ Chess Vision Trainer destroyed');
    }
    // ── Приватные ─────────────────────────────────────────────────────────
    /**
     * Регистрирует все игровые модули.
     * Добавить новую игру = создать IGameModule + добавить строчку здесь.
     */
    _registerModules() {
        gameRegistry.register(new ChecksAndCapturesModule());
        gameRegistry.register(new FieldColorModule());
    }
    _initializeEventListeners() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._attachEventListeners());
        }
        else {
            this._attachEventListeners();
        }
    }
    _attachEventListeners() {
        // Инициализировать все модули и подписать кнопки выбора игры
        gameRegistry.getAll().forEach(m => {
            m.init(this);
            document.getElementById(m.descriptor.selectBtnId)
                ?.addEventListener('click', () => m.onSelected());
        });
        // Язык и тема
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', (e) => this.loadLanguage(e.target.value));
        });
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) => this._setTheme(e.target.value));
        });
        // Глобальная навигация
        document.getElementById('backToHomeBtn')?.addEventListener('click', () => this.goHome());
        // Экран статистики
        document.getElementById('openStatsBtn')?.addEventListener('click', () => this._openStats());
        document.getElementById('statsBackBtn')?.addEventListener('click', () => this.uiManager.showHomeScreen());
        // Переключение табов на экране статистики
        document.getElementById('tabCC')?.addEventListener('change', () => {
            document.getElementById('statsTabCC')?.classList.remove('hidden');
            document.getElementById('statsTabFC')?.classList.add('hidden');
        });
        document.getElementById('tabFC')?.addEventListener('change', () => {
            document.getElementById('statsTabFC')?.classList.remove('hidden');
            document.getElementById('statsTabCC')?.classList.add('hidden');
        });
        // Модал настроек
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeSettings());
    }
    // ── Тема ──────────────────────────────────────────────────────────────
    _loadTheme() {
        try {
            const saved = localStorage.getItem(THEME_KEY);
            this._applyTheme(saved === 'light' || saved === 'dark' ? saved : 'dark');
        }
        catch {
            this._applyTheme('dark');
        }
    }
    _setTheme(theme) {
        this._applyTheme(theme);
        try {
            localStorage.setItem(THEME_KEY, theme);
        }
        catch (e) {
            console.warn('Не удалось сохранить тему:', e);
        }
    }
    _applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        const radio = document.querySelector(`input[name="theme"][value="${theme}"]`);
        if (radio)
            radio.checked = true;
    }
}
//# sourceMappingURL=ChessVisionTrainer.js.map