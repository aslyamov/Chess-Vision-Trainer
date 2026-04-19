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
    switchView(viewId: string): void {
        document.querySelectorAll<HTMLElement>('.view').forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });

        const target = document.getElementById(viewId);
        if (!target) {
            console.warn(`UIManager.switchView: view "${viewId}" not found in DOM`);
            return;
        }
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');

            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
            if (target.scrollTop) target.scrollTop = 0;
        }
    }

    showHomeScreen():  void { this.switchView('homeScreen');  }
    showStartScreen(): void { this.switchView('startScreen'); }
    showGameScreen():  void { this.switchView('gameScreen');  }

    destroy(): void { /* no-op */ }
}
