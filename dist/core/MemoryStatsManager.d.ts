/**
 * MemoryStatsManager — статистика игры «Запоминание позиции».
 * Единственное место чтения/записи данных в localStorage для этой игры.
 */
import type { MemoryAllTimeStats, MemoryResult } from '../types/index.js';
declare class MemoryStatsManager {
    load(): MemoryAllTimeStats;
    private save;
    record(result: MemoryResult): void;
    clear(): void;
}
export declare const memoryStatsManager: MemoryStatsManager;
export {};
//# sourceMappingURL=MemoryStatsManager.d.ts.map