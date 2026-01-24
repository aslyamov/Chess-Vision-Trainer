/**
 * Менеджер загрузки и выбора пазлов
 * TypeScript версия
 */
import { logError } from '../utils/error-handler.js';
import { shuffleArray } from '../utils/chess-utils.js';
export class PuzzleManager {
    constructor() {
        this.puzzles = [];
        this.loaded = false;
    }
    /**
     * Загружает пазлы из JSON файла
     * @param url - URL к файлу puzzles.json
     * @returns Promise
     */
    async loadPuzzles(url = 'puzzles.json') {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            const data = await response.json();
            if (!Array.isArray(data) || data.length === 0) {
                throw new Error('Puzzles data is empty or invalid');
            }
            this.puzzles = data;
            this.loaded = true;
            console.log(`✅ Loaded ${this.puzzles.length} puzzles`);
        }
        catch (error) {
            logError('DATA_LOAD', 'Ошибка загрузки puzzles.json', error, {
                url,
                suggestion: 'Запустите через веб-сервер (Live Server)'
            });
            throw error;
        }
    }
    /**
     * Получает пазлы, отфильтрованные по сложности и количеству
     * @param config - Конфигурация сессии
     * @returns Перемешанный массив выбранных пазлов
     */
    getPuzzles(config) {
        if (!this.loaded) {
            throw new Error('Puzzles not loaded yet');
        }
        const { difficulty = 'all', taskCount = 10 } = config;
        // Фильтрация по сложности
        const filtered = (difficulty === 'all')
            ? this.puzzles
            : this.puzzles.filter(p => (p.difficulty || 'medium') === difficulty);
        // Перемешиваем и берём нужное количество
        const count = Math.max(1, Math.min(100, taskCount));
        return shuffleArray(filtered).slice(0, count);
    }
    /**
     * Получает количество доступных пазлов для сложности
     * @param difficulty - Уровень сложности или 'all'
     * @returns Количество пазлов
     */
    getCount(difficulty = 'all') {
        if (!this.loaded)
            return 0;
        if (difficulty === 'all') {
            return this.puzzles.length;
        }
        return this.puzzles.filter(p => (p.difficulty || 'medium') === difficulty).length;
    }
    /**
     * Проверяет, загружены ли пазлы
     * @returns true если пазлы загружены
     */
    isLoaded() {
        return this.loaded;
    }
}
//# sourceMappingURL=PuzzleManager.js.map