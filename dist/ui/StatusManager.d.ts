/**
 * StatusManager — таймер, статус-сообщения и лог ходов для «Шахов и взятий».
 * Принимает CCStatusDom вместо полного CachedDOM — не зависит от UIManager.
 */
import type { LocaleData, SessionConfig, CCStatusDom } from '../types/index.js';
export declare class StatusManager {
    private dom;
    private langData;
    private timerInterval;
    private sessionStartTime;
    private limitEndTime;
    private settings;
    private isPaused;
    private pauseStartTime;
    constructor(dom: CCStatusDom, langData: LocaleData);
    updateLanguage(langData: LocaleData): void;
    updateSettings(settings: SessionConfig): void;
    setStatus(message: string, color?: string): void;
    logMove(san: string, isCheck: boolean, isCapture: boolean, color: 'w' | 'b', lang?: string): void;
    clearLogs(): void;
    setSessionStartTime(ts: number): void;
    setLimitEndTime(ts: number): void;
    get limitEndTimeValue(): number;
    startTimer(isCountdown: boolean, onTimeout?: (() => void) | null): void;
    stopTimer(): void;
    pauseTimer(): void;
    resumeTimer(isCountdown: boolean, onTimeout?: (() => void) | null): void;
    getElapsedTime(): number;
    destroy(): void;
}
//# sourceMappingURL=StatusManager.d.ts.map