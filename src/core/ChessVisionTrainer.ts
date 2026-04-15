/**
 * Главный оркестратор Chess Vision Trainer.
 * Отвечает за: инициализацию, язык, тему, навигацию и регистрацию модулей.
 *
 * Масштабирование на N игр:
 *   - Добавить модуль в _registerModules()
 *   - Всё остальное (tabs, stats, язык) подключается автоматически через IGameModule.
 */

import { PuzzleManager } from './PuzzleManager.js';
import { UIManager }     from '../ui/UIManager.js';
import { gameRegistry }  from './GameRegistry.js';
import { FieldColorModule }        from './games/FieldColorModule.js';
import { ChecksAndCapturesModule } from './games/ChecksAndCapturesModule.js';
import { MemoryModule }            from './games/MemoryModule.js';
import { GoodCaptureModule }       from './games/GoodCaptureModule.js';
import { MaterialModule }          from './games/MaterialModule.js';
import { statsScreen }   from './StatsScreen.js';
import {
    loadLanguageData,
    applyTranslations,
    saveLanguagePreference,
    loadLanguagePreference,
    updateLanguageUI,
} from '../utils/localization.js';
import { logError } from '../utils/error-handler.js';
import { THEME_KEY } from '../constants.js';
import type { LocaleData, SupportedLocale } from '../types/index.js';
import type { AppContext } from './IGame.js';

type Theme = 'light' | 'dark';

export class ChessVisionTrainer implements AppContext {
    // AppContext публичные поля
    readonly Chessground: any;
    readonly uiManager: UIManager;

    private puzzleManager: PuzzleManager;
    private langData: LocaleData = {};
    private currentLang: SupportedLocale = 'ru';

    constructor(ChessgroundLib: any) {
        this.Chessground  = ChessgroundLib;
        this.uiManager    = new UIManager();
        this.puzzleManager = new PuzzleManager();

        this._registerModules();
        this._initializeEventListeners();
    }

    // ── AppContext ────────────────────────────────────────────────────────────

    getPuzzleManager(): PuzzleManager { return this.puzzleManager; }
    getLangData():      LocaleData    { return this.langData; }
    getCurrentLang():   SupportedLocale { return this.currentLang; }

    // ── Инициализация ─────────────────────────────────────────────────────────

    async init(): Promise<void> {
        try {
            await this.puzzleManager.loadPuzzles('puzzles.json');
            this._loadTheme();

            this.currentLang = loadLanguagePreference('ru');
            await this.loadLanguage(this.currentLang);

            console.log('✅ Chess Vision Trainer initialized');
            console.log('💡 Доступ через window.chessApp');
        } catch (error) {
            logError('INITIALIZATION', 'Ошибка инициализации', error as Error);
            alert('Не удалось запустить приложение. Смотрите консоль для деталей.');
            throw error;
        }
    }

    // ── Язык ─────────────────────────────────────────────────────────────────

    async loadLanguage(lang: SupportedLocale): Promise<void> {
        try {
            this.langData    = await loadLanguageData(lang);
            this.currentLang = lang;
            saveLanguagePreference(lang);
            applyTranslations(this.langData);
            updateLanguageUI(lang);

            // Оповещаем все модули — каждый обновляет свои переводы
            gameRegistry.getAll().forEach(m => m.onLanguageChange?.(this.langData));

            console.log(`✅ Язык изменён на: ${lang}`);
        } catch (error) {
            console.error('Language loading error:', error);
        }
    }

    // ── Навигация ─────────────────────────────────────────────────────────────

    goHome(): void {
        gameRegistry.getAll().forEach(m => m.destroy());
        this.uiManager.showHomeScreen();
    }

    openStats(): void {
        statsScreen.render(gameRegistry.getAll());
        this.uiManager.switchView('statsScreen');
        // Активировать первую доступную вкладку
        const first = gameRegistry.getAll().find(m => m.descriptor.statsTabId);
        if (first?.descriptor.statsTabId) {
            this._activateStatsTab(first.descriptor.statsTabId);
        }
    }

    openSettings(): void {
        (document.getElementById('settingsModal') as HTMLDialogElement)?.showModal?.();
    }

    closeSettings(): void {
        (document.getElementById('settingsModal') as HTMLDialogElement)?.close?.();
    }

    redrawBoard(): void {
        gameRegistry.getAll().forEach(m => m.redrawBoard?.());
    }

    // ── Очистка ───────────────────────────────────────────────────────────────

    destroy(): void {
        gameRegistry.getAll().forEach(m => m.destroy());
        this.uiManager.destroy();
        console.log('♻️ Chess Vision Trainer destroyed');
    }

    // ── Приватные ─────────────────────────────────────────────────────────────

    /**
     * Регистрирует все игровые модули.
     * Добавить игру 3 = реализовать IGameModule + одна строка здесь.
     */
    private _registerModules(): void {
        gameRegistry.register(new ChecksAndCapturesModule());
        gameRegistry.register(new FieldColorModule());
        gameRegistry.register(new MemoryModule());
        gameRegistry.register(new MaterialModule());
        gameRegistry.register(new GoodCaptureModule());
    }

    private _initializeEventListeners(): void {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this._attachEventListeners());
        } else {
            this._attachEventListeners();
        }
    }

    private _attachEventListeners(): void {
        // Инициализировать все модули и подписать кнопки выбора игры
        gameRegistry.getAll().forEach(m => {
            m.init(this);
            document.getElementById(m.descriptor.selectBtnId)
                ?.addEventListener('click', () => m.onSelected());
        });

        // Язык и тема
        document.querySelectorAll('input[name="language"]').forEach(radio =>
            radio.addEventListener('change', (e) =>
                this.loadLanguage((e.target as HTMLInputElement).value as SupportedLocale))
        );
        document.querySelectorAll('input[name="theme"]').forEach(radio =>
            radio.addEventListener('change', (e) =>
                this._setTheme((e.target as HTMLInputElement).value as Theme))
        );

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
    private _activateStatsTab(tabId: string): void {
        const modules = gameRegistry.getAll();

        // Скрыть все панели
        modules.forEach(m => {
            const panelId = m.descriptor.statsTabPanelId;
            if (panelId) document.getElementById(panelId)?.classList.add('hidden');
        });

        // Показать панель активного модуля
        const active = modules.find(m => m.descriptor.statsTabId === tabId);
        if (active?.descriptor.statsTabPanelId) {
            document.getElementById(active.descriptor.statsTabPanelId)?.classList.remove('hidden');
        }

        // Отметить radio checked
        const radio = document.getElementById(tabId) as HTMLInputElement | null;
        if (radio) radio.checked = true;
    }

    // ── Тема ──────────────────────────────────────────────────────────────────

    private _loadTheme(): void {
        try {
            const saved = localStorage.getItem(THEME_KEY) as Theme | null;
            this._applyTheme(saved === 'light' || saved === 'dark' ? saved : 'dark');
        } catch {
            this._applyTheme('dark');
        }
    }

    private _setTheme(theme: Theme): void {
        this._applyTheme(theme);
        try { localStorage.setItem(THEME_KEY, theme); }
        catch (e) { console.warn('Не удалось сохранить тему:', e); }
    }

    private _applyTheme(theme: Theme): void {
        document.documentElement.setAttribute('data-theme', theme);
        const radio = document.querySelector<HTMLInputElement>(`input[name="theme"][value="${theme}"]`);
        if (radio) radio.checked = true;
    }
}
