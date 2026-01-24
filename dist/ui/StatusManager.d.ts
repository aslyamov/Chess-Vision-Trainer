/**
 * Manages status messages, timers, and move logging
 * TypeScript версия
 */
import type { LocaleData, SessionConfig, CachedDOM } from '../types/index.js';
export declare class StatusManager {
    private dom;
    private langData;
    private timerInterval;
    private sessionStartTime;
    private limitEndTime;
    limitEndTimePublic: number;
    private settings;
    private isPaused;
    private pauseStartTime;
    constructor(dom: CachedDOM, langData: LocaleData);
    /**
     * Updates language data
     * @param langData - Translation data
     */
    updateLanguage(langData: LocaleData): void;
    /**
     * Updates settings
     * @param settings - Settings object
     */
    updateSettings(settings: SessionConfig): void;
    /**
     * Sets status message
     * @param message - Status message
     * @param color - Text color
     */
    setStatus(message: string, color?: string): void;
    /**
     * Logs a move to the appropriate log panel
     * @param san - Move in SAN notation
     * @param isCheck - Whether move gives check
     * @param isCapture - Whether move captures
     * @param color - Color that made the move
     * @param currentLang - Current language
     */
    logMove(san: string, isCheck: boolean, isCapture: boolean, color: 'w' | 'b', currentLang?: string): void;
    /**
     * Clears move logs
     */
    clearLogs(): void;
    /**
     * Starts timer (countdown or stopwatch)
     * @param isCountdown - Whether to countdown
     * @param onTimeout - Callback when time runs out
     */
    startTimer(isCountdown: boolean, onTimeout?: (() => void) | null): void;
    /**
     * Stops timer
     */
    stopTimer(): void;
    /**
     * Pauses the timer
     */
    pauseTimer(): void;
    /**
     * Resumes the timer
     * @param isCountdown - Whether to countdown
     * @param onTimeout - Callback when time runs out
     */
    resumeTimer(isCountdown: boolean, onTimeout?: (() => void) | null): void;
    /**
     * Sets session start time
     * @param timestamp - Start timestamp
     */
    setSessionStartTime(timestamp: number): void;
    /**
     * Sets limit end time for countdown
     * @param timestamp - End timestamp
     */
    setLimitEndTime(timestamp: number): void;
    /**
     * Getter for limitEndTime needed by GameSession
     */
    get limitEndTimeValue(): number;
    /**
     * Gets elapsed time in seconds
     * @returns Seconds elapsed
     */
    getElapsedTime(): number;
    /**
     * Cleanup - stops timer
     */
    destroy(): void;
}
//# sourceMappingURL=StatusManager.d.ts.map