/**
 * Менеджер загрузки и выбора пазлов
 * TypeScript версия
 */

import { logError } from '../utils/error-handler.js';
import { shuffleArray } from '../utils/chess-utils.js';
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

            console.log(`✅ Loaded ${this.puzzles.length} puzzles`);
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
     * Получает пазлы, отфильтрованные по сложности и количеству
     * @param config - Конфигурация сессии
     * @returns Перемешанный массив выбранных пазлов
     */
    getPuzzles(config: SessionConfig): Puzzle[] {
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
    getCount(difficulty: string = 'all'): number {
        if (!this.loaded) return 0;

        if (difficulty === 'all') {
            return this.puzzles.length;
        }

        return this.puzzles.filter(p => (p.difficulty || 'medium') === difficulty).length;
    }

    /**
     * Проверяет, загружены ли пазлы
     * @returns true если пазлы загружены
     */
    isLoaded(): boolean {
        return this.loaded;
    }
}
