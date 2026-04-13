/**
 * UIManager — глобальный view-роутер.
 *
 * Единственная ответственность: переключение видимых экранов (.view).
 * Вся CC-специфичная UI-логика (DOM игры, счётчики, результаты) живёт в CCGameUI.
 * Для новых игр создаётся свой *GameUI файл — UIManager не трогается.
 */
export class UIManager {
    /**
     * Показывает указанный view, скрывает все остальные.
     * Сбрасывает скролл страницы.
     */
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
            if (target.scrollTop)
                target.scrollTop = 0;
        }
    }
    showHomeScreen() { this.switchView('homeScreen'); }
    showStartScreen() { this.switchView('startScreen'); }
    showGameScreen() { this.switchView('gameScreen'); }
    destroy() { }
}
//# sourceMappingURL=UIManager.js.map