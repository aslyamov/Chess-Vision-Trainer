/**
 * MaterialStatsManager — статистика игры «Материальный перевес».
 */

import { MATERIAL_STATS_KEY } from '../constants.js';
import { commonStatsManager } from './CommonStatsManager.js';
import type { MaterialAllTimeStats, MaterialResult } from '../types/index.js';

const EMPTY: MaterialAllTimeStats = {
    totalSessions:  0,
    totalCorrect:   0,
    totalIncorrect: 0,
    bestStreak:     0,
};

class MaterialStatsManager {
    load(): MaterialAllTimeStats {
        try {
            const raw = localStorage.getItem(MATERIAL_STATS_KEY);
            return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
        } catch {
            return { ...EMPTY };
        }
    }

    private save(s: MaterialAllTimeStats): void {
        try { localStorage.setItem(MATERIAL_STATS_KEY, JSON.stringify(s)); }
        catch (e) { console.warn('MaterialStatsManager: save failed', e); }
    }

    record(result: MaterialResult): void {
        const prev = this.load();
        this.save({
            totalSessions:  prev.totalSessions + 1,
            totalCorrect:   prev.totalCorrect  + result.correct,
            totalIncorrect: prev.totalIncorrect + result.incorrect,
            bestStreak:     Math.max(prev.bestStreak, result.bestStreak),
        });
        commonStatsManager.recordPlay();
    }

    clear(): void {
        try { localStorage.removeItem(MATERIAL_STATS_KEY); }
        catch (e) { console.warn('MaterialStatsManager: clear failed', e); }
    }
}

export const materialStatsManager = new MaterialStatsManager();
