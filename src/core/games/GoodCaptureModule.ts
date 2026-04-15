/**
 * Модуль игры «Хорошее взятие» — заглушка.
 * Показывается позиция со стрелкой взятия.
 * Игрок оценивает: приводит ли взятие к преимуществу и на сколько очков.
 */

import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';

export class GoodCaptureModule implements IGameModule {
    readonly descriptor: GameDescriptor = {
        id:              'good-capture',
        name:            'Хорошее взятие',
        selectBtnId:     'selectGoodCaptureGame',
        startScreenId:   'goodCaptureStartScreen',
        gameScreenId:    'goodCaptureStartScreen', // заглушка — нет игрового экрана
        statsTabId:      'tabGoodCapture',
        statsTabPanelId: 'statsTabGoodCapture',
    };

    private ctx!: AppContext;

    init(ctx: AppContext): void {
        this.ctx = ctx;
        document.getElementById('goodCaptureBackBtn')
            ?.addEventListener('click', () => this.ctx.uiManager.showHomeScreen());
    }

    onSelected(): void {
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    destroy(): void { /* нет ресурсов */ }

    renderStats(): void { /* нет статистики */ }
}
