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
     * Очищает весь прогресс (сброс)
     */
    reset(): void;
}
export declare const puzzleProgress: PuzzleProgressManager;
export {};
//# sourceMappingURL=PuzzleProgressManager.d.ts.map