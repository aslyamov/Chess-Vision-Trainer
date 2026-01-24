/**
 * Менеджер загрузки и выбора пазлов
 * TypeScript версия
 */
import type { Puzzle, SessionConfig } from '../types/index.js';
export declare class PuzzleManager {
    private puzzles;
    private loaded;
    /**
     * Загружает пазлы из JSON файла
     * @param url - URL к файлу puzzles.json
     * @returns Promise
     */
    loadPuzzles(url?: string): Promise<void>;
    /**
     * Получает пазлы, отфильтрованные по сложности и количеству
     * @param config - Конфигурация сессии
     * @returns Перемешанный массив выбранных пазлов
     */
    getPuzzles(config: SessionConfig): Puzzle[];
    /**
     * Получает количество доступных пазлов для сложности
     * @param difficulty - Уровень сложности или 'all'
     * @returns Количество пазлов
     */
    getCount(difficulty?: string): number;
    /**
     * Проверяет, загружены ли пазлы
     * @returns true если пазлы загружены
     */
    isLoaded(): boolean;
}
//# sourceMappingURL=PuzzleManager.d.ts.map