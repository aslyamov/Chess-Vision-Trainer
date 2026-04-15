/**
 * Модуль игры «Хорошее взятие» — заглушка.
 * Показывается позиция со стрелкой взятия.
 * Игрок оценивает: приводит ли взятие к преимуществу и на сколько очков.
 */
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
export declare class GoodCaptureModule implements IGameModule {
    readonly descriptor: GameDescriptor;
    private ctx;
    init(ctx: AppContext): void;
    onSelected(): void;
    destroy(): void;
    renderStats(): void;
}
//# sourceMappingURL=GoodCaptureModule.d.ts.map