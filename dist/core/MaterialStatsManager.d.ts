/**
 * MaterialStatsManager — статистика игры «Материальный перевес».
 */
import type { MaterialAllTimeStats, MaterialResult } from '../types/index.js';
declare class MaterialStatsManager {
    load(): MaterialAllTimeStats;
    private save;
    record(result: MaterialResult): void;
    clear(): void;
}
export declare const materialStatsManager: MaterialStatsManager;
export {};
//# sourceMappingURL=MaterialStatsManager.d.ts.map