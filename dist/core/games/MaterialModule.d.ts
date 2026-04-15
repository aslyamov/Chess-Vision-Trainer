/**
 * Модуль игры «Материальный перевес» — заглушка.
 * Показывается позиция, игрок оценивает у кого перевес и на сколько очков.
 */
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
export declare class MaterialModule implements IGameModule {
    readonly descriptor: GameDescriptor;
    private ctx;
    init(ctx: AppContext): void;
    onSelected(): void;
    destroy(): void;
    renderStats(): void;
}
//# sourceMappingURL=MaterialModule.d.ts.map