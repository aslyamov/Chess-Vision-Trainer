/**
 * Общий контракт для всех мини-игр.
 * Каждая игра реализует IGameModule — самодостаточный модуль с собственными
 * event listeners, настройками и жизненным циклом.
 */
import type { UIManager } from '../ui/UIManager.js';
import type { StatusManager } from '../ui/StatusManager.js';
import type { PuzzleManager } from './PuzzleManager.js';
import type { LocaleData, SupportedLocale } from '../types/index.js';
/** Минимальный интерфейс игрового экземпляра */
export interface IGame {
    start(): void;
    destroy(): void;
    updateConfig?(config: unknown): void;
}
/** Метаданные игры — ID экранов и кнопок для роутинга */
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
}
/**
 * Контекст приложения — предоставляется модулям оркестратором (ChessVisionTrainer).
 * Модули не импортируют ChessVisionTrainer напрямую, только этот интерфейс.
 */
export interface AppContext {
    readonly Chessground: any;
    readonly uiManager: UIManager;
    getStatusManager(): StatusManager;
    getPuzzleManager(): PuzzleManager;
    getLangData(): LocaleData;
    getCurrentLang(): SupportedLocale;
    /** Вернуться на главный экран, уничтожив текущую игру */
    goHome(): void;
}
/**
 * Самодостаточный модуль игры.
 * Отвечает за свои event listeners, конфиг и жизненный цикл.
 * Оркестратор вызывает init() один раз и onSelected() при выборе из меню.
 */
export interface IGameModule {
    readonly descriptor: GameDescriptor;
    /** Вызывается один раз после готовности DOM — регистрирует event listeners */
    init(ctx: AppContext): void;
    /** Вызывается когда пользователь выбирает игру на главном экране */
    onSelected(): void;
    /** Уничтожает активный игровой экземпляр (если есть) */
    destroy(): void;
    /** Перерисовать доску (например, при resize окна) */
    redrawBoard?(): void;
}
//# sourceMappingURL=IGame.d.ts.map