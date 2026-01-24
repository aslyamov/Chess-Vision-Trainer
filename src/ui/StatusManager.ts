/**
 * Manages status messages, timers, and move logging
 * TypeScript версия
 */

import { formatTime, localizeSAN } from '../utils/chess-utils.js';
import type { LocaleData, SessionConfig, CachedDOM } from '../types/index.js';

export class StatusManager {
    private dom: CachedDOM;
    private langData: LocaleData;
    private timerInterval: ReturnType<typeof setInterval> | null = null;
    private sessionStartTime: number = 0;
    private limitEndTime: number = 0;
    public limitEndTimePublic: number = 0; // Public getter/access workaround
    private settings: Partial<SessionConfig> = {};
    private isPaused: boolean = false;
    private pauseStartTime: number = 0;

    constructor(dom: CachedDOM, langData: LocaleData) {
        this.dom = dom;
        this.langData = langData;
        this.timerInterval = null;
        this.sessionStartTime = 0;
        this.limitEndTime = 0;
        this.settings = {};
    }

    /**
     * Updates language data
     * @param langData - Translation data
     */
    updateLanguage(langData: LocaleData): void {
        this.langData = langData;
    }

    /**
     * Updates settings
     * @param settings - Settings object
     */
    updateSettings(settings: SessionConfig): void {
        this.settings = settings;
    }

    /**
     * Sets status message
     * @param message - Status message
     * @param color - Text color
     */
    setStatus(message: string, color: string = '#333'): void {
        if (!this.settings.showText) return;
        if (this.dom.statusMessage) {
            this.dom.statusMessage.textContent = message;
            this.dom.statusMessage.style.color = color;
        }
    }

    /**
     * Logs a move to the appropriate log panel
     * @param san - Move in SAN notation
     * @param isCheck - Whether move gives check
     * @param isCapture - Whether move captures
     * @param color - Color that made the move
     * @param currentLang - Current language
     */
    logMove(san: string, isCheck: boolean, isCapture: boolean, color: 'w' | 'b', currentLang: string = 'en'): void {
        if (!this.settings.showLog) return;

        // Create elements safely
        const logItem = document.createElement('div');
        logItem.className = 'log-item';
        logItem.style.display = 'flex';
        logItem.style.justifyContent = 'space-between';

        const localizedSan = localizeSAN(san, currentLang);
        const sanSpan = document.createElement('span');
        sanSpan.textContent = localizedSan;

        const badgesSpan = document.createElement('span');

        if (isCapture) {
            const captureBadge = document.createElement('span');
            captureBadge.textContent = this.langData.log_capture || 'ВЗЯТИЕ';
            captureBadge.style.cssText = 'background:#007bff; color:white; padding:2px 4px; border-radius:3px; font-size:0.7em; margin-left:5px;';
            badgesSpan.appendChild(captureBadge);
        }

        if (isCheck) {
            const checkBadge = document.createElement('span');
            checkBadge.textContent = this.langData.log_check || 'ШАХ';
            checkBadge.style.cssText = 'background:#dc3545; color:white; padding:2px 4px; border-radius:3px; font-size:0.7em; margin-left:5px;';
            badgesSpan.appendChild(checkBadge);
        }

        logItem.appendChild(sanSpan);
        logItem.appendChild(badgesSpan);

        const logEl = color === 'w' ? this.dom.logWhite : this.dom.logBlack;
        if (logEl) logEl.prepend(logItem);
    }

    /**
     * Clears move logs
     */
    clearLogs(): void {
        if (this.dom.logWhite) this.dom.logWhite.innerHTML = '';
        if (this.dom.logBlack) this.dom.logBlack.innerHTML = '';
    }

    /**
     * Starts timer (countdown or stopwatch)
     * @param isCountdown - Whether to countdown
     * @param onTimeout - Callback when time runs out
     */
    startTimer(isCountdown: boolean, onTimeout: (() => void) | null = null): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }

        const update = () => {
            let seconds: number;

            if (isCountdown) {
                const remaining = Math.ceil((this.limitEndTime - Date.now()) / 1000);
                seconds = Math.max(0, remaining);
                
                if (remaining <= 0 && onTimeout) {
                    this.stopTimer();
                    onTimeout();
                    return;
                }
                
                if (this.dom.gameTimer) {
                    this.dom.gameTimer.style.color = seconds <= 10 ? '#ff4444' : '#fff';
                }
            } else {
                seconds = Math.floor((Date.now() - this.sessionStartTime) / 1000);
                if (this.dom.gameTimer) {
                    this.dom.gameTimer.style.color = '#fff';
                }
            }

            if (this.dom.gameTimer) {
                this.dom.gameTimer.textContent = formatTime(seconds);
            }
        };

        update();
        this.timerInterval = setInterval(update, 1000);
    }

    /**
     * Stops timer
     */
    stopTimer(): void {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    /**
     * Pauses the timer
     */
    pauseTimer(): void {
        if (this.isPaused) return;
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        this.stopTimer();
    }

    /**
     * Resumes the timer
     * @param isCountdown - Whether to countdown
     * @param onTimeout - Callback when time runs out
     */
    resumeTimer(isCountdown: boolean, onTimeout: (() => void) | null = null): void {
        if (!this.isPaused) return;
        
        const pauseDuration = Date.now() - this.pauseStartTime;
        
        if (isCountdown) {
            this.limitEndTime += pauseDuration;
        }
        
        // Всегда сдвигаем время начала сессии, чтобы статистика (getElapsedTime) 
        // не учитывала время паузы
        this.sessionStartTime += pauseDuration;
        
        this.isPaused = false;
        this.startTimer(isCountdown, onTimeout);
    }

    /**
     * Sets session start time
     * @param timestamp - Start timestamp
     */
    setSessionStartTime(timestamp: number): void {
        this.sessionStartTime = timestamp;
    }

    /**
     * Sets limit end time for countdown
     * @param timestamp - End timestamp
     */
    setLimitEndTime(timestamp: number): void {
        this.limitEndTime = timestamp;
    }

    /**
     * Getter for limitEndTime needed by GameSession
     */
    get limitEndTimeValue(): number {
        return this.limitEndTime;
    }

    /**
     * Gets elapsed time in seconds
     * @returns Seconds elapsed
     */
    getElapsedTime(): number {
        const endTime = this.isPaused ? this.pauseStartTime : Date.now();
        return Math.floor((endTime - this.sessionStartTime) / 1000);
    }

    /**
     * Cleanup - stops timer
     */
    destroy(): void {
        this.stopTimer();
    }
}
