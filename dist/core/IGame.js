/**
 * Общий контракт для всех мини-игр.
 * Каждая игра реализует IGameModule — самодостаточный модуль с собственными
 * event listeners, настройками и жизненным циклом.
 *
 * Добавление игры 3+:
 *   1. Реализовать IGameModule
 *   2. Зарегистрировать в ChessVisionTrainer._registerModules()
 *   3. Добавить HTML-экраны
 *   Всё остальное (tabs, renderStats, язык) подключается автоматически.
 */
export {};
//# sourceMappingURL=IGame.js.map