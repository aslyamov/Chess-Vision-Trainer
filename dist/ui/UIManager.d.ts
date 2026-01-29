/**
 * Central UI management - handles view switching, DOM caching, and UI updates
 * TypeScript версия
 */
import type { CachedDOM, SessionConfig } from '../types/index.js';
export declare class UIManager {
    private dom;
    constructor();
    /**
     * Caches all DOM elements for fast access
     */
    private _cacheDOM;
    /**
     * Switches between views (screens)
     * @param viewId - ID of view to show
     */
    switchView(viewId: string): void;
    /**
     * Shows start screen
     */
    showStartScreen(): void;
    /**
     * Shows game screen
     */
    showGameScreen(): void;
    /**
     * Shows result screen
     * @param stats - Session statistics
     * @param overallStats - Overall progress stats (optional)
     */
    showResults(stats: {
        solved: number;
        total: number;
        time: number;
        accuracy: number;
        avgTime: number;
        newPuzzles: number;
        moveStats: {
            wChecks: {
                found: number;
                total: number;
            };
            wCaptures: {
                found: number;
                total: number;
            };
            bChecks: {
                found: number;
                total: number;
            };
            bCaptures: {
                found: number;
                total: number;
            };
        };
    }, overallStats?: {
        totalSolved: number;
        totalPuzzles: number;
        easy: {
            solved: number;
            total: number;
        };
        medium: {
            solved: number;
            total: number;
        };
        hard: {
            solved: number;
            total: number;
        };
    }): void;
    /**
     * Updates progress display
     * @param current - Current puzzle number (1-indexed)
     * @param total - Total puzzles
     */
    updateProgress(current: number, total: number): void;
    /**
     * Updates task indicator (for sequential mode)
     * @param show - Whether to show indicator
     * @param taskName - Task name to display
     */
    updateTaskIndicator(show: boolean, taskName?: string): void;
    /**
     * Updates counter display
     * @param id - Counter ID ('w-checks', 'w-captures', etc.)
     * @param found - Number found
     * @param total - Total to find
     */
    updateCounter(id: string, found: number, total: number): void;
    /**
     * Shows/hides containers based on settings
     * @param settings - Settings object
     */
    applySettings(settings: SessionConfig): void;
    /**
     * Gets session configuration from form inputs
     * @returns Configuration object
     */
    getSessionConfig(): SessionConfig;
    /**
     * Updates available puzzle count display
     * @param count - Number of available puzzles
     */
    updateAvailableCount(count: number): void;
    /**
     * Updates move stats by category on result screen
     */
    private _updateMoveStats;
    /**
     * Updates all-time stats from StatsManager
     */
    private _updateAllTimeStats;
    /**
     * Updates overall progress bars on result screen
     */
    private _updateOverallProgress;
    /**
     * Shows timeout modal
     */
    showTimeoutModal(): void;
    /**
     * Closes timeout modal
     */
    closeTimeoutModal(): void;
    /**
     * Gets DOM element cache
     * @returns Cached DOM elements
     */
    getDOM(): CachedDOM;
    /**
     * Cleanup
     */
    destroy(): void;
}
//# sourceMappingURL=UIManager.d.ts.map