/**
 * MemoryStatsManager — статистика игры «Запоминание позиции».
 * Единственное место чтения/записи данных в localStorage для этой игры.
 */

import { MEMORY_STATS_KEY } from '../constants.js';
import { commonStatsManager } from './CommonStatsManager.js';
import type { MemoryAllTimeStats, MemoryResult } from '../types/index.js';

const EMPTY: MemoryAllTimeStats = {
    totalSessions:  0,
    totalCorrect:   0,
    totalIncorrect: 0,
    bestAccuracy:   0,
    bestStreak:     0,
};

class MemoryStatsManager {
    load(): MemoryAllTimeStats {
        try {
            const raw = localStorage.getItem(MEMORY_STATS_KEY);
            return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
        } catch {
            return { ...EMPTY };
        }
    }

    private save(s: MemoryAllTimeStats): void {
        try { localStorage.setItem(MEMORY_STATS_KEY, JSON.stringify(s)); }
        catch (e) { console.warn('MemoryStatsManager: save failed', e); }
    }

    record(result: MemoryResult): void {
        const prev = this.load();
        const total = result.correct + result.incorrect + result.timeouts;
        const accuracy = total > 0 ? Math.round(result.correct / total * 100) : 0;
        this.save({
            totalSessions:  prev.totalSessions + 1,
            totalCorrect:   prev.totalCorrect  + result.correct,
            totalIncorrect: prev.totalIncorrect + result.incorrect + result.timeouts,
            bestAccuracy:   Math.max(prev.bestAccuracy, accuracy),
            bestStreak:     Math.max(prev.bestStreak, result.bestStreak),
        });
        commonStatsManager.recordPlay();
    }

    clear(): void {
        try { localStorage.removeItem(MEMORY_STATS_KEY); }
        catch { /* ignore */ }
    }
}

export const memoryStatsManager = new MemoryStatsManager();
