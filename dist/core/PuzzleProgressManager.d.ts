/**
 * PuzzleProgressManager - управление прогрессом решения задач
 * Хранит информацию о решённых задачах в localStorage
 */
export interface SolvedPuzzleData {
    solvedAt: string;
    attempts: number;
    lastAttempt: string;
}
export interface SolvedPuzzles {
    [puzzleId: number]: SolvedPuzzleData;
}
export interface ProgressStats {
    totalPuzzles: number;
    solvedCount: number;
    unseenCount: number;
    percentage: number;
}
declare class PuzzleProgressManager {
    private solved;
    constructor();
    /**
     * Загружает данные из localStorage
     */
    private load;
    /**
     * Сохраняет данные в localStorage
     */
    private save;
    /**
     * Отмечает задачу как решённую
     * @param puzzleId - ID задачи
     */
    markSolved(puzzleId: number): void;
    /**
     * Проверяет, решена ли задача
     * @param puzzleId - ID задачи
     */
    isSolved(puzzleId: number): boolean;
    /**
     * Возвращает данные о решении задачи
     * @param puzzleId - ID задачи
     */
    getSolvedData(puzzleId: number): SolvedPuzzleData | null;
    /**
     * Возвращает все решённые задачи
     */
    getAllSolved(): SolvedPuzzles;
    /**
     * Возвращает количество решённых задач
     */
    getSolvedCount(): number;
    /**
     * Возвращает Set с ID решённых задач (для быстрой проверки)
     */
    getSolvedIds(): Set<number>;
    /**
     * Возвращает статистику прогресса
     * @param totalPuzzles - Общее количество задач
     */
    getStats(totalPuzzles: number): ProgressStats;
    /**
     * Очищает весь прогресс (сброс)
     */
    reset(): void;
}
export declare const puzzleProgress: PuzzleProgressManager;
export {};
//# sourceMappingURL=PuzzleProgressManager.d.ts.map