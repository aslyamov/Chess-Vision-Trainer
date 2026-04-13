/**
 * Общий контракт для всех мини-игр.
 * Каждая игра реализует IGameModule — самодостаточный модуль с собственными
 * event listeners, настройками и жизненным циклом.
 *
 * Добавление игры 3+:
 *   1. Реализовать IGameModule
 *   2. Зарегистрировать в ChessVisionTrainer._registerModules()
 *   3. Добавить HTML-экраны
 *   Всё остальное (tabs, renderStats, язык) подключается автоматически.
 */
import type { UIManager } from '../ui/UIManager.js';
import type { PuzzleManager } from './PuzzleManager.js';
import type { LocaleData, SupportedLocale } from '../types/index.js';
/** Метаданные игры — ID экранов, кнопок и вкладки статистики */
export interface GameDescriptor {
    /** Уникальный идентификатор игры */
    readonly id: string;
    /** Отображаемое название */
    readonly name: string;
    /** ID кнопки выбора на главном экране */
    readonly selectBtnId: string;
    /** ID экрана настроек/старта */
    readonly startScreenId: string;
    /** ID основного игрового экрана */
    readonly gameScreenId: string;
    /**
     * ID radio-input вкладки на экране статистики.
     * Если задан, ChessVisionTrainer автоматически подключит переключение.
     */
    readonly statsTabId?: string;
    /**
     * ID div-контейнера содержимого вкладки статистики.
     * При переключении скрываются все панели кроме активной.
     */
    readonly statsTabPanelId?: string;
}
/**
 * Контекст приложения — предоставляется модулям оркестратором.
 * Модули не импортируют ChessVisionTrainer напрямую.
 */
export interface AppContext {
    readonly Chessground: any;
    readonly uiManager: UIManager;
    getPuzzleManager(): PuzzleManager;
    getLangData(): LocaleData;
    getCurrentLang(): SupportedLocale;
    /** Вернуться на главный экран, уничтожив текущую игру */
    goHome(): void;
    /** Открыть экран общей статистики */
    openStats(): void;
}
/**
 * Самодостаточный модуль игры.
 * Каждый модуль управляет своими event listeners, конфигом и жизненным циклом.
 */
export interface IGameModule {
    readonly descriptor: GameDescriptor;
    /** Вызывается один раз после готовности DOM */
    init(ctx: AppContext): void;
    /** Вызывается когда пользователь выбирает игру на главном экране */
    onSelected(): void;
    /** Уничтожает активный игровой экземпляр (если есть) */
    destroy(): void;
    /** Перерисовать доску при resize */
    redrawBoard?(): void;
    /**
     * Заполнить контент вкладки статистики актуальными данными.
     * Вызывается StatsScreen.render() перед показом экрана статистики.
     */
    renderStats?(): void;
    /**
     * Оповещение о смене языка интерфейса.
     * Модуль обновляет свои переводы (например StatusManager внутри CCM).
     */
    onLanguageChange?(langData: LocaleData): void;
}
//# sourceMappingURL=IGame.d.ts.map