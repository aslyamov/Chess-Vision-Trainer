/**
 * Модуль игры «Материальный перевес» — заглушка.
 * Показывается позиция, игрок оценивает у кого перевес и на сколько очков.
 */
export class MaterialModule {
    constructor() {
        this.descriptor = {
            id: 'material',
            name: 'Материальный перевес',
            selectBtnId: 'selectMaterialGame',
            startScreenId: 'materialStartScreen',
            gameScreenId: 'materialStartScreen', // заглушка — нет игрового экрана
            statsTabId: 'tabMaterial',
            statsTabPanelId: 'statsTabMaterial',
        };
    }
    init(ctx) {
        this.ctx = ctx;
        document.getElementById('materialBackBtn')
            ?.addEventListener('click', () => this.ctx.uiManager.showHomeScreen());
    }
    onSelected() {
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    destroy() { }
    renderStats() { }
}
//# sourceMappingURL=MaterialModule.js.map