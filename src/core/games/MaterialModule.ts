/**
 * Модуль игры «Материальный перевес» — заглушка.
 * Показывается позиция, игрок оценивает у кого перевес и на сколько очков.
 */

import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';

export class MaterialModule implements IGameModule {
    readonly descriptor: GameDescriptor = {
        id:              'material',
        name:            'Материальный перевес',
        selectBtnId:     'selectMaterialGame',
        startScreenId:   'materialStartScreen',
        gameScreenId:    'materialStartScreen', // заглушка — нет игрового экрана
        statsTabId:      'tabMaterial',
        statsTabPanelId: 'statsTabMaterial',
    };

    private ctx!: AppContext;

    init(ctx: AppContext): void {
        this.ctx = ctx;
        document.getElementById('materialBackBtn')
            ?.addEventListener('click', () => this.ctx.uiManager.showHomeScreen());
    }

    onSelected(): void {
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    destroy(): void { /* нет ресурсов */ }

    renderStats(): void { /* нет статистики */ }
}
