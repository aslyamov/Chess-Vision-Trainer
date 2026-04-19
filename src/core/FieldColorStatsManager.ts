/**
 * FieldColorStatsManager — статистика игры «Цвет поля».
 * Единственное место чтения/записи данных в localStorage для этой игры.
 * При добавлении новой игры — создаётся аналогичный менеджер.
 */

import { FIELD_COLOR_STATS_KEY } from '../constants.js';
import { commonStatsManager } from './CommonStatsManager.js';
import type { FieldColorAllTimeStats, FCResult } from '../types/index.js';

const EMPTY: FieldColorAllTimeStats = {
    totalSessions:     0,
    totalCorrect:      0,
    totalIncorrect:    0,
    allTimeBestStreak: 0,
};

class FieldColorStatsManager {
    load(): FieldColorAllTimeStats {
        try {
            const raw = localStorage.getItem(FIELD_COLOR_STATS_KEY);
            return raw ? { ...EMPTY, ...JSON.parse(raw) } : { ...EMPTY };
        } catch {
            return { ...EMPTY };
        }
    }

    private save(s: FieldColorAllTimeStats): void {
        try { localStorage.setItem(FIELD_COLOR_STATS_KEY, JSON.stringify(s)); }
        catch (e) { console.warn('FieldColorStatsManager: save failed', e); }
    }

    /** Записать итог сессии и обновить all-time статистику */
    record(result: FCResult): void {
        const prev = this.load();
        this.save({
            totalSessions:     prev.totalSessions + 1,
            totalCorrect:      prev.totalCorrect  + result.correct,
            totalIncorrect:    prev.totalIncorrect + result.incorrect,
            allTimeBestStreak: Math.max(prev.allTimeBestStreak, result.bestStreak),
        });
        commonStatsManager.recordPlay();
    }

    /** Сброс (например, из меню «очистить данные») */
    clear(): void {
        try { localStorage.removeItem(FIELD_COLOR_STATS_KEY); }
        catch (e) { console.warn('FieldColorStatsManager: clear failed', e); }
    }
}

export const fcStatsManager = new FieldColorStatsManager();
