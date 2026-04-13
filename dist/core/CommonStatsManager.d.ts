/**
 * CommonStatsManager — общая статистика по всем играм.
 * Отслеживает серию дней активности (любая игра засчитывается).
 */
interface CommonStats {
    currentStreak: number;
    longestStreak: number;
    lastPlayedDate: string;
    totalDaysPlayed: number;
}
declare class CommonStatsManager {
    private load;
    private save;
    private _empty;
    /** Вызвать в конце любой игровой сессии */
    recordPlay(): void;
    /**
     * Возвращает актуальную статистику.
     * Если с момента последней игры прошло > 1 дня — серия отображается как 0,
     * но запись в storage не трогается до следующего recordPlay().
     */
    getStats(): CommonStats;
}
export declare const commonStatsManager: CommonStatsManager;
export {};
//# sourceMappingURL=CommonStatsManager.d.ts.map