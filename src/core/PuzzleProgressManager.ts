/**
 * PuzzleProgressManager - управление прогрессом решения задач
 * Хранит информацию о решённых задачах в localStorage
 */

import { PUZZLE_PROGRESS_KEY as STORAGE_KEY } from '../constants.js';

export interface SolvedPuzzleData {
    solvedAt: string;      // ISO timestamp первого решения
    attempts: number;      // Количество попыток
    lastAttempt: string;   // Timestamp последней попытки
}

export interface SolvedPuzzles {
    [puzzleId: number]: SolvedPuzzleData;
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
