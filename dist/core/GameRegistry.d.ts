/**
 * Реестр игровых модулей.
 * Регистрирует IGameModule и предоставляет доступ к ним оркестратору.
 * Добавить новую игру = реализовать IGameModule + зарегистрировать здесь.
 */
import type { IGameModule } from './IGame.js';
declare class GameRegistry {
    private readonly modules;
    register(module: IGameModule): void;
    getAll(): IGameModule[];
    get(id: string): IGameModule | undefined;
}
export declare const gameRegistry: GameRegistry;
export {};
//# sourceMappingURL=GameRegistry.d.ts.map