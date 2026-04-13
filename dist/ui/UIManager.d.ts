/**
 * UIManager — глобальный view-роутер.
 *
 * Единственная ответственность: переключение видимых экранов (.view).
 * Вся CC-специфичная UI-логика (DOM игры, счётчики, результаты) живёт в CCGameUI.
 * Для новых игр создаётся свой *GameUI файл — UIManager не трогается.
 */
export declare class UIManager {
    /**
     * Показывает указанный view, скрывает все остальные.
     * Сбрасывает скролл страницы.
     */
    switchView(viewId: string): void;
    showHomeScreen(): void;
    showStartScreen(): void;
    showGameScreen(): void;
    destroy(): void;
}
//# sourceMappingURL=UIManager.d.ts.map