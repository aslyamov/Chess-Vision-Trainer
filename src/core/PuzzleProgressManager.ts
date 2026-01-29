/**
 * PuzzleProgressManager - управление прогрессом решения задач
 * Хранит информацию о решённых задачах в localStorage
 */

const STORAGE_KEY = 'chess_solved_puzzles';

export interface SolvedPuzzleData {
    solvedAt: string;      // ISO timestamp первого решения
    attempts: number;      // Количество попыток
    lastAttempt: string;   // Timestamp последней попытки
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

class PuzzleProgressManager {
    private solved: SolvedPuzzles = {};

    constructor() {
        this.load();
    }

    /**
     * Загружает данные из localStorage
     */
    private load(): void {
        try {
            const data = localStorage.getItem(STORAGE_KEY);
            if (data) {
                this.solved = JSON.parse(data);
            }
            console.log(`[Progress] Загружено ${Object.keys(this.solved).length} решённых задач`);
        } catch (e) {
            console.warn('[Progress] Ошибка загрузки:', e);
            this.solved = {};
        }
    }

    /**
     * Сохраняет данные в localStorage
     */
    private save(): void {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.solved));
        } catch (e) {
            console.warn('[Progress] Ошибка сохранения:', e);
        }
    }

    /**
     * Отмечает задачу как решённую
     * @param puzzleId - ID задачи
     */
    markSolved(puzzleId: number): void {
        const now = new Date().toISOString();

        if (this.solved[puzzleId]) {
            // Уже решали - обновляем статистику
            this.solved[puzzleId].attempts++;
            this.solved[puzzleId].lastAttempt = now;
        } else {
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
    isSolved(puzzleId: number): boolean {
        return puzzleId in this.solved;
    }

    /**
     * Возвращает данные о решении задачи
     * @param puzzleId - ID задачи
     */
    getSolvedData(puzzleId: number): SolvedPuzzleData | null {
        return this.solved[puzzleId] || null;
    }

    /**
     * Возвращает все решённые задачи
     */
    getAllSolved(): SolvedPuzzles {
        return { ...this.solved };
    }

    /**
     * Возвращает количество решённых задач
     */
    getSolvedCount(): number {
        return Object.keys(this.solved).length;
    }

    /**
     * Возвращает Set с ID решённых задач (для быстрой проверки)
     */
    getSolvedIds(): Set<number> {
        return new Set(Object.keys(this.solved).map(Number));
    }

    /**
     * Возвращает статистику прогресса
     * @param totalPuzzles - Общее количество задач
     */
    getStats(totalPuzzles: number): ProgressStats {
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
    reset(): void {
        this.solved = {};
        this.save();
        console.log('[Progress] Прогресс сброшен');
    }
}

// Глобальный экземпляр (singleton)
export const puzzleProgress = new PuzzleProgressManager();
