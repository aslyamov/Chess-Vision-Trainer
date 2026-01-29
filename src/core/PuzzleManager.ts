/**
 * Менеджер загрузки и выбора пазлов
 * TypeScript версия
 */

import { logError } from '../utils/error-handler.js';
import { shuffleArray } from '../utils/chess-utils.js';
import { puzzleProgress } from './PuzzleProgressManager.js';
import type { Puzzle, SessionConfig } from '../types/index.js';

export class PuzzleManager {
    private puzzles: Puzzle[] = [];
    private loaded: boolean = false;

    /**
     * Загружает пазлы из JSON файла
     * @param url - URL к файлу puzzles.json
     * @returns Promise
     */
    async loadPuzzles(url: string = 'puzzles.json'): Promise<void> {
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

            console.log(`[Puzzles] Загружено ${this.puzzles.length} задач`);
        } catch (error) {
            logError(
                'DATA_LOAD' as any,
                'Ошибка загрузки puzzles.json',
                error as Error,
                {
                    url,
                    suggestion: 'Запустите через веб-сервер (Live Server)'
                }
            );
            throw error;
        }
    }

    /**
     * Получает пазлы с приоритетом новых (нерешённых) задач
     * @param config - Конфигурация сессии
     * @returns Массив выбранных пазлов (новые в приоритете)
     */
    getPuzzles(config: SessionConfig): Puzzle[] {
        if (!this.loaded) {
            throw new Error('Puzzles not loaded yet');
        }

        const { difficulty = 'all', taskCount = 10 } = config;
        const count = Math.max(1, Math.min(100, taskCount));

        // Фильтрация по сложности
        const filtered = (difficulty === 'all')
            ? this.puzzles
            : this.puzzles.filter(p => (p.difficulty || 'medium') === difficulty);

        // Получаем ID решённых задач
        const solvedIds = puzzleProgress.getSolvedIds();
        const solvedData = puzzleProgress.getAllSolved();

        // Разделяем на новые и решённые
        const unseen: Puzzle[] = [];
        const seen: Puzzle[] = [];

        for (const puzzle of filtered) {
            if (solvedIds.has(puzzle.id)) {
                seen.push(puzzle);
            } else {
                unseen.push(puzzle);
            }
        }

        // Собираем результат: приоритет новым
        const result: Puzzle[] = [];

        // 1. Сначала добавляем новые (перемешанные)
        const shuffledUnseen = shuffleArray(unseen);
        result.push(...shuffledUnseen.slice(0, count));

        // 2. Если новых не хватает - добавляем старые (по давности решения)
        if (result.length < count) {
            const remaining = count - result.length;

            // Сортируем решённые по давности (старые сначала - spaced repetition)
            const sortedSeen = seen.sort((a, b) => {
                const aTime = new Date(solvedData[a.id]?.solvedAt || 0).getTime();
                const bTime = new Date(solvedData[b.id]?.solvedAt || 0).getTime();
                return aTime - bTime; // Старые сначала
            });

            result.push(...sortedSeen.slice(0, remaining));
        }

        console.log(`[Puzzles] Выбрано ${result.length} задач (новых: ${Math.min(shuffledUnseen.length, count)}, повтор: ${Math.max(0, result.length - Math.min(shuffledUnseen.length, count))})`);

        return result;
    }

    /**
     * Получает количество доступных пазлов для сложности
     * @param difficulty - Уровень сложности или 'all'
     * @returns Количество пазлов
     */
    getCount(difficulty: string = 'all'): number {
        if (!this.loaded) return 0;

        if (difficulty === 'all') {
            return this.puzzles.length;
        }

        return this.puzzles.filter(p => (p.difficulty || 'medium') === difficulty).length;
    }

    /**
     * Возвращает общее количество задач
     */
    getTotalCount(): number {
        return this.puzzles.length;
    }

    /**
     * Проверяет, загружены ли пазлы
     * @returns true если пазлы загружены
     */
    isLoaded(): boolean {
        return this.loaded;
    }

    /**
     * Возвращает статистику по сложности на основе решённых задач
     * @param solvedIds - Set с ID решённых задач
     */
    getStatsByDifficulty(solvedIds: Set<number>): {
        totalSolved: number;
        totalPuzzles: number;
        easy: { solved: number; total: number };
        medium: { solved: number; total: number };
        hard: { solved: number; total: number };
    } {
        const stats = {
            totalSolved: 0,
            totalPuzzles: this.puzzles.length,
            easy: { solved: 0, total: 0 },
            medium: { solved: 0, total: 0 },
            hard: { solved: 0, total: 0 }
        };

        for (const puzzle of this.puzzles) {
            const diff = puzzle.difficulty || 'medium';

            if (diff === 'easy') {
                stats.easy.total++;
                if (solvedIds.has(puzzle.id)) {
                    stats.easy.solved++;
                    stats.totalSolved++;
                }
            } else if (diff === 'medium') {
                stats.medium.total++;
                if (solvedIds.has(puzzle.id)) {
                    stats.medium.solved++;
                    stats.totalSolved++;
                }
            } else if (diff === 'hard') {
                stats.hard.total++;
                if (solvedIds.has(puzzle.id)) {
                    stats.hard.solved++;
                    stats.totalSolved++;
                }
            }
        }

        return stats;
    }
}
