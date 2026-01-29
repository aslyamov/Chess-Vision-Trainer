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
     * Получает пазлы с приоритетом новых (нерешённых) задач
     * @param config - Конфигурация сессии
     * @returns Массив выбранных пазлов (новые в приоритете)
     */
    getPuzzles(config: SessionConfig): Puzzle[];
    /**
     * Получает количество доступных пазлов для сложности
     * @param difficulty - Уровень сложности или 'all'
     * @returns Количество пазлов
     */
    getCount(difficulty?: string): number;
    /**
     * Возвращает общее количество задач
     */
    getTotalCount(): number;
    /**
     * Проверяет, загружены ли пазлы
     * @returns true если пазлы загружены
     */
    isLoaded(): boolean;
    /**
     * Возвращает статистику по сложности на основе решённых задач
     * @param solvedIds - Set с ID решённых задач
     */
    getStatsByDifficulty(solvedIds: Set<number>): {
        totalSolved: number;
        totalPuzzles: number;
        easy: {
            solved: number;
            total: number;
        };
        medium: {
            solved: number;
            total: number;
        };
        hard: {
            solved: number;
            total: number;
        };
    };
}
//# sourceMappingURL=PuzzleManager.d.ts.map