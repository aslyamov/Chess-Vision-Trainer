/**
 * Менеджер загрузки и выбора пазлов
 * TypeScript версия
 */
import type { Puzzle, SessionConfig } from '../types/index.js';
export declare class PuzzleManager {
    private puzzles;
    private loaded;
    /**
     * Загружает пазлы из JSON файла со стримингом прогресса.
     * @param url        - URL к файлу puzzles.json
     * @param onProgress - колбэк 0–100 (%; вызывается по мере получения байт)
     */
    loadPuzzles(url?: string, onProgress?: (percent: number) => void): Promise<void>;
    /**
     * Получает пазлы с приоритетом новых (нерешённых) задач
     * @param config - Конфигурация сессии
     * @returns Массив выбранных пазлов (новые в приоритете)
     */
    getPuzzles(config: SessionConfig): Puzzle[];
    /**
     * Возвращает все загруженные пазлы без фильтрации
     */
    getAllPuzzles(): Puzzle[];
    /**
     * Получает количество доступных пазлов для сложности
     * @param difficulty - Уровень сложности или 'all'
     * @returns Количество пазлов
     */
    getCount(difficulty?: string): number;
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