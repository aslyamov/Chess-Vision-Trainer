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
import {
    loadLanguageData,
    applyTranslations,
    saveLanguagePreference,
    loadLanguagePreference,
    updateLanguageUI
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
    private statusManager: StatusManager | null = null;
    private langData: LocaleData = {};
    private currentLang: SupportedLocale = 'ru';

    constructor(ChessgroundLib: any) {
        this.Chessground = ChessgroundLib;
        this.uiManager = new UIManager();
        this.puzzleManager = new PuzzleManager();

        this._registerModules();
        this._initializeEventListeners();
    }

    // ── AppContext ────────────────────────────────────────────────────────

    getStatusManager(): StatusManager { return this.statusManager!; }
    getPuzzleManager(): PuzzleManager { return this.puzzleManager; }
    getLangData(): LocaleData         { return this.langData; }
    getCurrentLang(): SupportedLocale { return this.currentLang; }

    // ── Инициализация ─────────────────────────────────────────────────────

    async init(): Promise<void> {
        try {
            await this.puzzleManager.loadPuzzles('puzzles.json');
            this._loadTheme();

            this.currentLang = loadLanguagePreference('ru');
            await this.loadLanguage(this.currentLang);

            this.statusManager = new StatusManager(this.uiManager.getDOM(), this.langData);

            console.log('✅ Chess Vision Trainer initialized');
            console.log('💡 Доступ через window.chessApp');
        } catch (error) {
            logError('INITIALIZATION', 'Ошибка инициализации', error as Error);
            alert('Не удалось запустить приложение. Смотрите консоль для деталей.');
            throw error;
        }
    }

    // ── Язык ─────────────────────────────────────────────────────────────

    async loadLanguage(lang: SupportedLocale): Promise<void> {
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
        } catch (error) {
            console.error('Language loading error:', error);
        }
    }

    // ── Навигация ─────────────────────────────────────────────────────────

    goHome(): void {
        gameRegistry.getAll().forEach(m => m.destroy());
        this.uiManager.showHomeScreen();
    }

    // ── Настройки ─────────────────────────────────────────────────────────

    openSettings(): void {
        (document.getElementById('settingsModal') as HTMLDialogElement)?.showModal?.();
    }

    closeSettings(): void {
        (document.getElementById('settingsModal') as HTMLDialogElement)?.close?.();
    }

    openStats(): void {
        statsScreen.render();
        this.uiManager.switchView('statsScreen');
    }

    /** Перерисовать активную доску — вызывается при resize окна */
    redrawBoard(): void {
        gameRegistry.getAll().forEach(m => m.redrawBoard?.());
    }

    // ── Очистка ───────────────────────────────────────────────────────────

    destroy(): void {
        gameRegistry.getAll().forEach(m => m.destroy());
        if (this.statusManager) this.statusManager.destroy();
        this.uiManager.destroy();
        console.log('♻️ Chess Vision Trainer destroyed');
    }

    // ── Приватные ─────────────────────────────────────────────────────────

    /**
     * Регистрирует все игровые модули.
     * Добавить новую игру = создать IGameModule + добавить строчку здесь.
     */
    private _registerModules(): void {
        gameRegistry.register(new ChecksAndCapturesModule());
        gameRegistry.register(new FieldColorModule());
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
        document.querySelectorAll('input[name="language"]').forEach(radio => {
            radio.addEventListener('change', (e) =>
                this.loadLanguage((e.target as HTMLInputElement).value as SupportedLocale));
        });
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            radio.addEventListener('change', (e) =>
                this._setTheme((e.target as HTMLInputElement).value as Theme));
        });

        // Глобальная навигация
        document.getElementById('backToHomeBtn')?.addEventListener('click', () => this.goHome());

        // Экран статистики
        document.getElementById('openStatsBtn')?.addEventListener('click', () => this.openStats());
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
        try {
            localStorage.setItem(THEME_KEY, theme);
        } catch (e) {
            console.warn('Не удалось сохранить тему:', e);
        }
    }

    private _applyTheme(theme: Theme): void {
        document.documentElement.setAttribute('data-theme', theme);
        const radio = document.querySelector<HTMLInputElement>(`input[name="theme"][value="${theme}"]`);
        if (radio) radio.checked = true;
    }
}
