/**
 * FieldColorStatsManager — статистика игры «Цвет поля».
 * Единственное место чтения/записи данных в localStorage для этой игры.
 * При добавлении новой игры — создаётся аналогичный менеджер.
 */
import type { FieldColorAllTimeStats, FCResult } from '../types/index.js';
declare class FieldColorStatsManager {
    load(): FieldColorAllTimeStats;
    private save;
    /** Записать итог сессии и обновить all-time статистику */
    record(result: FCResult): void;
    /** Сброс (например, из меню «очистить данные») */
    clear(): void;
}
export declare const fcStatsManager: FieldColorStatsManager;
export {};
//# sourceMappingURL=FieldColorStatsManager.d.ts.map