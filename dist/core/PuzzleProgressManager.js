/**
 * PuzzleProgressManager - управление прогрессом решения задач
 * Хранит информацию о решённых задачах в localStorage
 */
const STORAGE_KEY = 'chess_solved_puzzles';
class PuzzleProgressManager {
    constructor() {
        this.solved = {};
        this.load();
    }
    /**
     * Загружает данные из localStorage
     */
    load() {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                this.solved = JSON.parse(data);
            }
            console.log(`[Progress] Загружено ${Object.keys(this.solved).length} решённых задач`);
        }
        catch (e) {
            console.warn('[Progress] Ошибка загрузки:', e);
            this.solved = {};
        }
    }
    /**
     * Сохраняет данные в localStorage
     */
    save() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.solved));
        }
        catch (e) {
            console.warn('[Progress] Ошибка сохранения:', e);
        }
    }
    /**
     * Отмечает задачу как решённую
     * @param puzzleId - ID задачи
     */
    markSolved(puzzleId) {
        const now = new Date().toISOString();
        if (this.solved[puzzleId]) {
            // Уже решали - обновляем статистику
            this.solved[puzzleId].attempts++;
            this.solved[puzzleId].lastAttempt = now;
        }
        else {
            // Первое решение
            this.solved[puzzleId] = {
                solvedAt: now,
                attempts: 1,
                lastAttempt: now
            };
        }
        this.save();
    }
    /**
     * Проверяет, решена ли задача
     * @param puzzleId - ID задачи
     */
    isSolved(puzzleId) {
        return puzzleId in this.solved;
    }
    /**
     * Возвращает данные о решении задачи
     * @param puzzleId - ID задачи
     */
    getSolvedData(puzzleId) {
        return this.solved[puzzleId] || null;
    }
    /**
     * Возвращает все решённые задачи
     */
    getAllSolved() {
        return { ...this.solved };
    }
    /**
     * Возвращает количество решённых задач
     */
    getSolvedCount() {
        return Object.keys(this.solved).length;
    }
    /**
     * Возвращает Set с ID решённых задач (для быстрой проверки)
     */
    getSolvedIds() {
        return new Set(Object.keys(this.solved).map(Number));
    }
    /**
     * Возвращает статистику прогресса
     * @param totalPuzzles - Общее количество задач
     */
    getStats(totalPuzzles) {
        const solvedCount = this.getSolvedCount();
        return {
            totalPuzzles,
            solvedCount,
            unseenCount: totalPuzzles - solvedCount,
            percentage: totalPuzzles > 0 ? Math.round((solvedCount / totalPuzzles) * 100) : 0
        };
    }
    /**
     * Очищает весь прогресс (сброс)
     */
    reset() {
        this.solved = {};
        this.save();
        console.log('[Progress] Прогресс сброшен');
    }
}
// Глобальный экземпляр (singleton)
export const puzzleProgress = new PuzzleProgressManager();
//# sourceMappingURL=PuzzleProgressManager.js.map