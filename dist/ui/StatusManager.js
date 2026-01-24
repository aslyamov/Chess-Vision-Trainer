/**
 * Manages status messages, timers, and move logging
 * TypeScript версия
 */
import { formatTime, localizeSAN } from '../utils/chess-utils.js';
export class StatusManager {
    constructor(dom, langData) {
        this.timerInterval = null;
        this.sessionStartTime = 0;
        this.limitEndTime = 0;
        this.limitEndTimePublic = 0; // Public getter/access workaround
        this.settings = {};
        this.isPaused = false;
        this.pauseStartTime = 0;
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
    updateLanguage(langData) {
        this.langData = langData;
    }
    /**
     * Updates settings
     * @param settings - Settings object
     */
    updateSettings(settings) {
        this.settings = settings;
    }
    /**
     * Sets status message
     * @param message - Status message
     * @param color - Text color
     */
    setStatus(message, color = '#333') {
        if (!this.settings.showText)
            return;
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
    logMove(san, isCheck, isCapture, color, currentLang = 'en') {
        if (!this.settings.showLog)
            return;
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
        if (logEl)
            logEl.prepend(logItem);
    }
    /**
     * Clears move logs
     */
    clearLogs() {
        if (this.dom.logWhite)
            this.dom.logWhite.innerHTML = '';
        if (this.dom.logBlack)
            this.dom.logBlack.innerHTML = '';
    }
    /**
     * Starts timer (countdown or stopwatch)
     * @param isCountdown - Whether to countdown
     * @param onTimeout - Callback when time runs out
     */
    startTimer(isCountdown, onTimeout = null) {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        const update = () => {
            let seconds;
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
            }
            else {
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
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    /**
     * Pauses the timer
     */
    pauseTimer() {
        if (this.isPaused)
            return;
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        this.stopTimer();
    }
    /**
     * Resumes the timer
     * @param isCountdown - Whether to countdown
     * @param onTimeout - Callback when time runs out
     */
    resumeTimer(isCountdown, onTimeout = null) {
        if (!this.isPaused)
            return;
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
    setSessionStartTime(timestamp) {
        this.sessionStartTime = timestamp;
    }
    /**
     * Sets limit end time for countdown
     * @param timestamp - End timestamp
     */
    setLimitEndTime(timestamp) {
        this.limitEndTime = timestamp;
    }
    /**
     * Getter for limitEndTime needed by GameSession
     */
    get limitEndTimeValue() {
        return this.limitEndTime;
    }
    /**
     * Gets elapsed time in seconds
     * @returns Seconds elapsed
     */
    getElapsedTime() {
        const endTime = this.isPaused ? this.pauseStartTime : Date.now();
        return Math.floor((endTime - this.sessionStartTime) / 1000);
    }
    /**
     * Cleanup - stops timer
     */
    destroy() {
        this.stopTimer();
    }
}
//# sourceMappingURL=StatusManager.js.map