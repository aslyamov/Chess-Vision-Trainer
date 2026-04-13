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
import { gameRegistry } from './GameRegistry.js';
import { FieldColorModule } from './games/FieldColorModule.js';
import { ChecksAndCapturesModule } from './games/ChecksAndCapturesModule.js';
import { MemoryModule } from './games/MemoryModule.js';
import { statsScreen } from './StatsScreen.js';
import { loadLanguageData, applyTranslations, saveLanguagePreference, loadLanguagePreference, updateLanguageUI, } from '../utils/localization.js';
import { logError } from '../utils/error-handler.js';
import { THEME_KEY } from '../constants.js';
export class ChessVisionTrainer {
    constructor(ChessgroundLib) {
        this.langData = {};
        this.currentLang = 'ru';
        this.Chessground = ChessgroundLib;
        this.uiManager = new UIManager();
        this.puzzleManager = new PuzzleManager();
        this._registerModules();
        this._initializeEventListeners();
    }
    // ── AppContext ────────────────────────────────────────────────────────────
    getPuzzleManager() { return this.puzzleManager; }
    getLangData() { return this.langData; }
    getCurrentLang() { return this.currentLang; }
    // ── Инициализация ─────────────────────────────────────────────────────────
    async init() {
        try {
            await this.puzzleManager.loadPuzzles('puzzles.json');
            this._loadTheme();
            this.currentLang = loadLanguagePreference('ru');
            await this.loadLanguage(this.currentLang);
            console.log('✅ Chess Vision Trainer initialized');
            console.log('💡 Доступ через window.chessApp');
        }
        catch (error) {
            logError('INITIALIZATION', 'Ошибка инициализации', error);
            alert('Не удалось запустить приложение. Смотрите консоль для деталей.');
            throw error;
        }
    }
    // ── Язык ─────────────────────────────────────────────────────────────────
    async loadLanguage(lang) {
        try {
            this.langData = await loadLanguageData(lang);
            this.currentLang = lang;
            saveLanguagePreference(lang);
            applyTranslations(this.langData);
            updateLanguageUI(lang);
            // Оповещаем все модули — каждый обновляет свои переводы
            gameRegistry.getAll().forEach(m => m.onLanguageChange?.(this.langData));
            console.log(`✅ Язык изменён на: ${lang}`);
        }
        catch (error) {
            console.error('Language loading error:', error);
        }
    }
    // ── Навигация ─────────────────────────────────────────────────────────────
    goHome() {
        gameRegistry.getAll().forEach(m => m.destroy());
        this.uiManager.showHomeScreen();
    }
    openStats() {
        statsScreen.render(gameRegistry.getAll());
        this.uiManager.switchView('statsScreen');
        // Активировать первую доступную вкладку
        const first = gameRegistry.getAll().find(m => m.descriptor.statsTabId);
        if (first?.descriptor.statsTabId) {
            this._activateStatsTab(first.descriptor.statsTabId);
        }
    }
    openSettings() {
        document.getElementById('settingsModal')?.showModal?.();
    }
    closeSettings() {
        document.getElementById('settingsModal')?.close?.();
    }
    redrawBoard() {
        gameRegistry.getAll().forEach(m => m.redrawBoard?.());
    }
    // ── Очистка ───────────────────────────────────────────────────────────────
    destroy() {
        gameRegistry.getAll().forEach(m => m.destroy());
        this.uiManager.destroy();
        console.log('♻️ Chess Vision Trainer destroyed');
    }
    // ── Приватные ─────────────────────────────────────────────────────────────
    /**
     * Регистрирует все игровые модули.
     * Добавить игру 3 = реализовать IGameModule + одна строка здесь.
     */
    _registerModules() {
        gameRegistry.register(new ChecksAndCapturesModule());
        gameRegistry.register(new FieldColorModule());
        gameRegistry.register(new MemoryModule());
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
        document.querySelectorAll('input[name="language"]').forEach(radio => radio.addEventListener('change', (e) => this.loadLanguage(e.target.value)));
        document.querySelectorAll('input[name="theme"]').forEach(radio => radio.addEventListener('change', (e) => this._setTheme(e.target.value)));
        // Глобальная навигация
        document.getElementById('backToHomeBtn')?.addEventListener('click', () => this.goHome());
        // Экран статистики
        document.getElementById('openStatsBtn')?.addEventListener('click', () => this.openStats());
        document.getElementById('statsBackBtn')?.addEventListener('click', () => this.uiManager.showHomeScreen());
        // Data-driven tabs: каждый модуль с statsTabId получает обработчик автоматически
        gameRegistry.getAll().forEach(m => {
            const tabId = m.descriptor.statsTabId;
            if (tabId) {
                document.getElementById(tabId)?.addEventListener('change', () => {
                    this._activateStatsTab(tabId);
                });
            }
        });
        // Настройки
        document.getElementById('settingsBtn')?.addEventListener('click', () => this.openSettings());
        document.getElementById('closeSettingsBtn')?.addEventListener('click', () => this.closeSettings());
    }
    /**
     * Переключить активную вкладку статистики.
     * Скрывает все панели, показывает панель указанного модуля.
     */
    _activateStatsTab(tabId) {
        const modules = gameRegistry.getAll();
        // Скрыть все панели
        modules.forEach(m => {
            const panelId = m.descriptor.statsTabPanelId;
            if (panelId)
                document.getElementById(panelId)?.classList.add('hidden');
        });
        // Показать панель активного модуля
        const active = modules.find(m => m.descriptor.statsTabId === tabId);
        if (active?.descriptor.statsTabPanelId) {
            document.getElementById(active.descriptor.statsTabPanelId)?.classList.remove('hidden');
        }
        // Отметить radio checked
        const radio = document.getElementById(tabId);
        if (radio)
            radio.checked = true;
    }
    // ── Тема ──────────────────────────────────────────────────────────────────
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