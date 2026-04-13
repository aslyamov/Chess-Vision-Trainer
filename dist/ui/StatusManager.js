/**
 * StatusManager — таймер, статус-сообщения и лог ходов для «Шахов и взятий».
 * Принимает CCStatusDom вместо полного CachedDOM — не зависит от UIManager.
 */
import { formatTime, localizeSAN } from '../utils/chess-utils.js';
export class StatusManager {
    constructor(dom, langData) {
        this.timerInterval = null;
        this.sessionStartTime = 0;
        this.limitEndTime = 0;
        this.settings = {};
        this.isPaused = false;
        this.pauseStartTime = 0;
        this.dom = dom;
        this.langData = langData;
    }
    updateLanguage(langData) {
        this.langData = langData;
    }
    updateSettings(settings) {
        this.settings = settings;
    }
    // ── Status message ────────────────────────────────────────────────────────
    setStatus(message, color = '#333') {
        if (!this.settings.showText)
            return;
        if (this.dom.statusMessage) {
            this.dom.statusMessage.textContent = message;
            this.dom.statusMessage.style.color = color;
        }
    }
    // ── Move log ──────────────────────────────────────────────────────────────
    logMove(san, isCheck, isCapture, color, lang = 'en') {
        if (!this.settings.showLog)
            return;
        const item = document.createElement('div');
        item.className = 'log-item';
        const sanSpan = document.createElement('span');
        sanSpan.textContent = localizeSAN(san, lang);
        const badges = document.createElement('span');
        if (isCapture) {
            const b = document.createElement('span');
            b.className = 'log-badge log-badge-capture';
            b.textContent = this.langData.log_capture || 'ВЗЯТИЕ';
            badges.appendChild(b);
        }
        if (isCheck) {
            const b = document.createElement('span');
            b.className = 'log-badge log-badge-check';
            b.textContent = this.langData.log_check || 'ШАХ';
            badges.appendChild(b);
        }
        item.appendChild(sanSpan);
        item.appendChild(badges);
        const logEl = color === 'w' ? this.dom.logWhite : this.dom.logBlack;
        if (logEl) {
            const header = logEl.firstElementChild;
            header
                ? header.insertAdjacentElement('afterend', item)
                : logEl.appendChild(item);
        }
    }
    clearLogs() {
        this.dom.logWhite?.querySelectorAll('.log-item').forEach(el => el.remove());
        this.dom.logBlack?.querySelectorAll('.log-item').forEach(el => el.remove());
    }
    // ── Timer ─────────────────────────────────────────────────────────────────
    setSessionStartTime(ts) { this.sessionStartTime = ts; }
    setLimitEndTime(ts) { this.limitEndTime = ts; }
    get limitEndTimeValue() { return this.limitEndTime; }
    startTimer(isCountdown, onTimeout = null) {
        if (this.timerInterval)
            clearInterval(this.timerInterval);
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
            if (this.dom.gameTimer)
                this.dom.gameTimer.textContent = formatTime(seconds);
        };
        update();
        this.timerInterval = setInterval(update, 1000);
    }
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    pauseTimer() {
        if (this.isPaused)
            return;
        this.isPaused = true;
        this.pauseStartTime = Date.now();
        this.stopTimer();
    }
    resumeTimer(isCountdown, onTimeout = null) {
        if (!this.isPaused)
            return;
        const pauseDuration = Date.now() - this.pauseStartTime;
        if (isCountdown)
            this.limitEndTime += pauseDuration;
        // Сдвигаем начало сессии, чтобы getElapsedTime() не считал паузу
        this.sessionStartTime += pauseDuration;
        this.isPaused = false;
        this.startTimer(isCountdown, onTimeout);
    }
    getElapsedTime() {
        const end = this.isPaused ? this.pauseStartTime : Date.now();
        return Math.floor((end - this.sessionStartTime) / 1000);
    }
    destroy() { this.stopTimer(); }
}
//# sourceMappingURL=StatusManager.js.map