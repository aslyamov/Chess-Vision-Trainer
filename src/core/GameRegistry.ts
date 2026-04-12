/**
 * Реестр игровых модулей.
 * Регистрирует IGameModule и предоставляет доступ к ним оркестратору.
 * Добавить новую игру = реализовать IGameModule + зарегистрировать здесь.
 */

import type { IGameModule } from './IGame.js';

class GameRegistry {
    private readonly modules: IGameModule[] = [];

    register(module: IGameModule): void {
        this.modules.push(module);
    }

    getAll(): IGameModule[] {
        return this.modules;
    }

    get(id: string): IGameModule | undefined {
        return this.modules.find(m => m.descriptor.id === id);
    }
}

export const gameRegistry = new GameRegistry();
