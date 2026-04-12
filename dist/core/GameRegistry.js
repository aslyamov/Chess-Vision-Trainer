/**
 * Реестр игровых модулей.
 * Регистрирует IGameModule и предоставляет доступ к ним оркестратору.
 * Добавить новую игру = реализовать IGameModule + зарегистрировать здесь.
 */
class GameRegistry {
    constructor() {
        this.modules = [];
    }
    register(module) {
        this.modules.push(module);
    }
    getAll() {
        return this.modules;
    }
    get(id) {
        return this.modules.find(m => m.descriptor.id === id);
    }
}
export const gameRegistry = new GameRegistry();
//# sourceMappingURL=GameRegistry.js.map