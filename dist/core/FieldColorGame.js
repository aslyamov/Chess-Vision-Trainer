/**
 * FieldColorGame — тренажёр «Цвет поля»
 * Использует Chessground для рендера пустой доски.
 * Целевое поле подсвечивается через lastMove.
 */
import { FIELD_COLOR_SETTINGS_KEY, FIELD_COLOR_STATS_KEY } from '../constants.js';
import { commonStatsManager } from './CommonStatsManager.js';
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ALL_SQUARES = FILES.flatMap(f => [1, 2, 3, 4, 5, 6, 7, 8].map(r => `${f}${r}`));
function isWhiteSquare(sq) {
    const fileIdx = sq.charCodeAt(0) - 97;
    const rankIdx = parseInt(sq[1]) - 1;
    return (fileIdx + rankIdx) % 2 !== 0;
}
export class FieldColorGame {
    constructor(ChessgroundLib, config) {
        this.ground = null;
        this.currentSquare = '';
        this.correct = 0;
        this.incorrect = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.timeLeft = 0;
        this.timerInterval = null;
        this.answering = false;
        this.active = false;
        this.Chessground = ChessgroundLib;
        this.config = config;
        this.dom = this._cacheDom();
    }
    start() {
        this.active = true;
        this.correct = 0;
        this.incorrect = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.currentSquare = '';
        this.answering = false;
        this._stopTimer();
        this._initBoard();
        this._updateStatsDisplay();
        if (this.config.timeMode > 0) {
            this.timeLeft = this.config.timeMode;
            this._startTimer();
        }
        this._updateTimerDisplay();
        this._nextSquare();
    }
    answer(guessWhite) {
        if (!this.active || this.answering)
            return;
        this.answering = true;
        const correct = guessWhite === isWhiteSquare(this.currentSquare);
        const label = isWhiteSquare(this.currentSquare) ? 'Белое' : 'Чёрное';
        if (correct) {
            this.correct++;
            this.streak++;
            if (this.streak > this.bestStreak)
                this.bestStreak = this.streak;
        }
        else {
            this.incorrect++;
            this.streak = 0;
        }
        this._showFeedback(correct, label);
        this._updateStatsDisplay();
        setTimeout(() => { if (this.active)
            this._nextSquare(); }, 550);
    }
    updateConfig(config) {
        this.config = config;
        if (this.ground)
            this.ground.set({ coordinates: config.showCoordinates });
        this._applyStyle();
        if (this.currentSquare && config.boardStyle !== 'none') {
            this.ground?.set({ lastMove: [this.currentSquare, this.currentSquare] });
        }
    }
    destroy() {
        this.active = false;
        this._stopTimer();
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        this.dom.boardEl.innerHTML = '';
    }
    // ─────────────────────────────────────────────────────────────────────────
    _cacheDom() {
        const get = (id) => document.getElementById(id);
        return {
            boardEl: get('fcBoard'),
            boardWrapper: get('fcBoardWrapper'),
            coordText: get('fcCoordText'),
            correct: get('fcCorrect'),
            incorrect: get('fcIncorrect'),
            streak: get('fcStreak'),
            timer: get('fcTimer'),
            feedback: get('fcFeedback'),
            whiteBtn: get('fcWhiteBtn'),
            blackBtn: get('fcBlackBtn'),
        };
    }
    _initBoard() {
        const el = this.dom.boardEl;
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        el.innerHTML = '';
        const orientation = this.config.orientation === 'random'
            ? (Math.random() < 0.5 ? 'white' : 'black')
            : this.config.orientation;
        if (this.config.boardStyle === 'none') {
            this._applyStyle();
            return;
        }
        this.ground = this.Chessground(el, {
            fen: '8/8/8/8/8/8/8/8 w - - 0 1',
            orientation,
            viewOnly: true,
            coordinates: this.config.showCoordinates,
            highlight: { lastMove: true, check: false },
            animation: { enabled: false },
            movable: { free: false },
            drawable: { enabled: false },
        });
        this._applyStyle();
        setTimeout(() => { this.ground?.redrawAll?.(); }, 50);
    }
    _applyStyle() {
        if (this.config.boardStyle === 'none') {
            this.dom.boardEl.style.display = 'none';
            this.dom.coordText.style.display = 'flex';
            this.dom.boardWrapper.classList.remove('fc-board-mono');
        }
        else {
            this.dom.boardEl.style.display = '';
            this.dom.coordText.style.display = 'none';
            this.dom.boardWrapper.classList.toggle('fc-board-mono', this.config.boardStyle === 'monochrome');
        }
    }
    _nextSquare() {
        let sq;
        do {
            sq = ALL_SQUARES[Math.floor(Math.random() * 64)];
        } while (sq === this.currentSquare);
        this.currentSquare = sq;
        const fb = this.dom.feedback;
        fb.textContent = '—';
        fb.classList.remove('bg-success/10', 'text-success', 'bg-error/10', 'text-error');
        fb.classList.add('bg-base-200', 'text-base-content/50');
        this.answering = false;
        if (this.config.boardStyle === 'none') {
            this.dom.coordText.style.opacity = '0';
            setTimeout(() => {
                this.dom.coordText.textContent = sq.toUpperCase();
                this.dom.coordText.style.opacity = '1';
            }, 180);
        }
        else {
            // Подсветить поле. lastMove принимает [from, to]; при from===to
            // Chessground красит одну клетку highlight-цветом.
            this.ground?.set({ lastMove: [sq, sq] });
        }
    }
    _showFeedback(correct, label) {
        const el = this.dom.feedback;
        el.textContent = correct ? '✓ Верно!' : `✗ ${label}`;
        el.classList.remove('bg-base-200', 'text-base-content/50', 'bg-success/10', 'text-success', 'bg-error/10', 'text-error');
        el.classList.add(correct ? 'bg-success/10' : 'bg-error/10', correct ? 'text-success' : 'text-error');
    }
    _updateStatsDisplay() {
        this.dom.correct.textContent = String(this.correct);
        this.dom.incorrect.textContent = String(this.incorrect);
        this.dom.streak.textContent = String(this.streak);
    }
    _startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.active)
                return;
            this.timeLeft--;
            this._updateTimerDisplay();
            if (this.timeLeft <= 0)
                this._finish();
        }, 1000);
    }
    _stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    _updateTimerDisplay() {
        if (this.config.timeMode === 0) {
            this.dom.timer.textContent = '∞';
            this.dom.timer.classList.remove('text-error');
        }
        else {
            this.dom.timer.textContent = String(this.timeLeft);
            this.dom.timer.classList.toggle('text-error', this.timeLeft <= 5);
        }
    }
    _finish() {
        if (!this.active)
            return;
        this.active = false;
        this._stopTimer();
        this._saveStats();
        this._showResultModal();
    }
    _saveStats() {
        try {
            const raw = localStorage.getItem(FIELD_COLOR_STATS_KEY);
            const prev = raw ? JSON.parse(raw)
                : { totalSessions: 0, totalCorrect: 0, totalIncorrect: 0, allTimeBestStreak: 0 };
            localStorage.setItem(FIELD_COLOR_STATS_KEY, JSON.stringify({
                totalSessions: prev.totalSessions + 1,
                totalCorrect: prev.totalCorrect + this.correct,
                totalIncorrect: prev.totalIncorrect + this.incorrect,
                allTimeBestStreak: Math.max(prev.allTimeBestStreak, this.bestStreak),
            }));
        }
        catch (e) {
            console.warn('Could not save field color stats', e);
        }
        commonStatsManager.recordPlay();
    }
    _showResultModal() {
        const modal = document.getElementById('fcResultModal');
        if (!modal)
            return;
        const set = (id, v) => { const el = document.getElementById(id); if (el)
            el.textContent = v; };
        const total = this.correct + this.incorrect;
        set('fcResCorrect', String(this.correct));
        set('fcResIncorrect', String(this.incorrect));
        set('fcResAccuracy', `${total > 0 ? Math.round(this.correct / total * 100) : 0}%`);
        set('fcResBestStreak', String(this.bestStreak));
        modal.showModal();
    }
    static loadConfig() {
        const defaults = { boardStyle: 'colored', showCoordinates: true, orientation: 'white', timeMode: 0 };
        try {
            const saved = localStorage.getItem(FIELD_COLOR_SETTINGS_KEY);
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        }
        catch {
            return defaults;
        }
    }
    static saveConfig(config) {
        try {
            localStorage.setItem(FIELD_COLOR_SETTINGS_KEY, JSON.stringify(config));
        }
        catch (e) {
            console.warn('Could not save field color config', e);
        }
    }
}
//# sourceMappingURL=FieldColorGame.js.map