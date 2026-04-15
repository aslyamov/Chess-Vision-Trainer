/**
 * Модуль игры «Хорошее взятие» — заглушка.
 * Показывается позиция со стрелкой взятия.
 * Игрок оценивает: приводит ли взятие к преимуществу и на сколько очков.
 */
export class GoodCaptureModule {
    constructor() {
        this.descriptor = {
            id: 'good-capture',
            name: 'Хорошее взятие',
            selectBtnId: 'selectGoodCaptureGame',
            startScreenId: 'goodCaptureStartScreen',
            gameScreenId: 'goodCaptureStartScreen', // заглушка — нет игрового экрана
            statsTabId: 'tabGoodCapture',
            statsTabPanelId: 'statsTabGoodCapture',
        };
    }
    init(ctx) {
        this.ctx = ctx;
        document.getElementById('goodCaptureBackBtn')
            ?.addEventListener('click', () => this.ctx.uiManager.showHomeScreen());
    }
    onSelected() {
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    destroy() { }
    renderStats() { }
}
//# sourceMappingURL=GoodCaptureModule.js.map