/**
 * FieldColorGame — тренажёр «Цвет поля»
 * Использует Chessground для рендера пустой доски.
 * Целевое поле подсвечивается через lastMove.
 */

import { FIELD_COLOR_SETTINGS_KEY } from '../constants.js';
import { fcStatsManager } from './FieldColorStatsManager.js';
import type { FieldColorConfig, FCResult } from '../types/index.js';

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
const ALL_SQUARES: string[] = FILES.flatMap(f =>
    [1, 2, 3, 4, 5, 6, 7, 8].map(r => `${f}${r}`)
);

function isWhiteSquare(sq: string): boolean {
    const fileIdx = sq.charCodeAt(0) - 97;
    const rankIdx = parseInt(sq[1]) - 1;
    return (fileIdx + rankIdx) % 2 !== 0;
}

interface FCDom {
    boardEl: HTMLElement;
    boardWrapper: HTMLElement;
    coordText: HTMLElement;
    correct: HTMLElement;
    incorrect: HTMLElement;
    streak: HTMLElement;
    accuracy: HTMLElement;
    timer: HTMLElement;
    feedback: HTMLElement;
    whiteBtn: HTMLButtonElement;
    blackBtn: HTMLButtonElement;
}

export class FieldColorGame {
    private Chessground: any;
    private ground: any = null;
    private config: FieldColorConfig;
    private dom: FCDom;
    private onFinish: (result: FCResult) => void;

    private currentSquare = '';
    private correct = 0;
    private incorrect = 0;
    private streak = 0;
    private bestStreak = 0;
    private currentRound = 0;
    private timeLeft = 0;
    private timerInterval: ReturnType<typeof setInterval> | null = null;
    private answering = false;
    private active = false;

    constructor(ChessgroundLib: any, config: FieldColorConfig, onFinish: (result: FCResult) => void) {
        this.Chessground = ChessgroundLib;
        this.config = config;
        this.onFinish = onFinish;
        this.dom = this._cacheDom();
    }

    start(): void {
        this.active = true;
        this.correct = 0;
        this.incorrect = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.currentRound = 0;
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

    answer(guessWhite: boolean): void {
        if (!this.active || this.answering) return;
        this.answering = true;

        const correct = guessWhite === isWhiteSquare(this.currentSquare);
        const label = isWhiteSquare(this.currentSquare) ? 'Белое' : 'Чёрное';

        if (correct) {
            this.correct++;
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
        } else {
            this.incorrect++;
            this.streak = 0;
        }

        this.currentRound++;
        this._showFeedback(correct, label);
        this._updateStatsDisplay();
        setTimeout(() => {
            if (!this.active) return;
            if (this.config.roundCount > 0 && this.currentRound >= this.config.roundCount) {
                this._finish();
            } else {
                this._nextSquare();
            }
        }, 550);
    }

    updateConfig(config: FieldColorConfig): void {
        this.config = config;
        if (this.ground) this.ground.set({ coordinates: config.showCoordinates });
        this._applyStyle();
        if (this.currentSquare && config.boardStyle !== 'none') {
            this.ground?.set({ drawable: { shapes: [{ orig: this.currentSquare, brush: 'blue' }] } });
        }
    }

    destroy(): void {
        this.active = false;
        this._stopTimer();
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        this.dom.boardEl.innerHTML = '';
    }

    // ─────────────────────────────────────────────────────────────────────────

    private _cacheDom(): FCDom {
        const get = (id: string): HTMLElement => {
            const el = document.getElementById(id);
            if (!el) throw new Error(`FieldColorGame: element #${id} not found in DOM`);
            return el;
        };
        return {
            boardEl:      get('fcBoard'),
            boardWrapper: get('fcBoardWrapper'),
            coordText:    get('fcCoordText'),
            correct:   get('fcCorrect'),
            incorrect: get('fcIncorrect'),
            streak:    get('fcStreak'),
            accuracy:  get('fcAccuracy'),
            timer:     get('fcTimer'),
            feedback:  get('fcFeedback'),
            whiteBtn:  get('fcWhiteBtn') as HTMLButtonElement,
            blackBtn:  get('fcBlackBtn') as HTMLButtonElement,
        };
    }

    private _initBoard(): void {
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
            highlight: { lastMove: false, check: false },
            animation:  { enabled: false },
            movable:    { free: false },
            drawable:   { enabled: false, visible: true, shapes: [] },
        });

        this._applyStyle();
        setTimeout(() => { this.ground?.redrawAll?.(); }, 50);
    }

    private _applyStyle(): void {
        if (this.config.boardStyle === 'none') {
            this.dom.boardEl.style.display = 'none';
            this.dom.coordText.style.display = 'flex';
            this.dom.boardWrapper.classList.remove('fc-board-mono');
        } else {
            this.dom.boardEl.style.display = '';
            this.dom.coordText.style.display = 'none';
            this.dom.boardWrapper.classList.toggle('fc-board-mono', this.config.boardStyle === 'monochrome');
        }
    }

    private _nextSquare(): void {
        let sq: string;
        do { sq = ALL_SQUARES[Math.floor(Math.random() * 64)]; }
        while (sq === this.currentSquare);
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
        } else {
            // Случайная ориентация — новая для каждого поля
            if (this.config.orientation === 'random') {
                this.ground?.set({ orientation: Math.random() < 0.5 ? 'white' : 'black' });
            }
            this.ground?.set({ drawable: { shapes: [{ orig: sq, brush: 'blue' }] } });
        }
    }

    private _showFeedback(correct: boolean, label: string): void {
        const el = this.dom.feedback;
        el.textContent = correct ? '✓ Верно!' : `✗ ${label}`;
        el.classList.remove('bg-base-200', 'text-base-content/50', 'bg-success/10', 'text-success', 'bg-error/10', 'text-error');
        el.classList.add(correct ? 'bg-success/10' : 'bg-error/10', correct ? 'text-success' : 'text-error');
    }

    private _updateStatsDisplay(): void {
        const total = this.correct + this.incorrect;
        this.dom.correct.textContent   = String(this.correct);
        this.dom.incorrect.textContent = String(this.incorrect);
        this.dom.streak.textContent    = String(this.streak);
        this.dom.accuracy.textContent  = total > 0 ? `${Math.round(this.correct / total * 100)}%` : '—';
    }

    private _startTimer(): void {
        this._stopTimer();
        this.timerInterval = setInterval(() => {
            if (!this.active) return;
            this.timeLeft--;
            this._updateTimerDisplay();
            if (this.timeLeft <= 0) this._finish();
        }, 1000);
    }

    private _stopTimer(): void {
        if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
    }

    private _updateTimerDisplay(): void {
        if (this.config.timeMode === 0) {
            this.dom.timer.textContent = '∞';
            this.dom.timer.classList.remove('text-error');
        } else {
            this.dom.timer.textContent = String(this.timeLeft);
            this.dom.timer.classList.toggle('text-error', this.timeLeft <= 5);
        }
    }

    private _finish(): void {
        if (!this.active) return;
        this.active = false;
        this._stopTimer();
        this._saveStats();
        this.onFinish({ correct: this.correct, incorrect: this.incorrect, bestStreak: this.bestStreak });
    }

    private _saveStats(): void {
        fcStatsManager.record({ correct: this.correct, incorrect: this.incorrect, bestStreak: this.bestStreak });
    }

    static loadConfig(): FieldColorConfig {
        const defaults: FieldColorConfig = { boardStyle: 'colored', showCoordinates: true, orientation: 'white', timeMode: 0, roundCount: 0 };
        try {
            const saved = localStorage.getItem(FIELD_COLOR_SETTINGS_KEY);
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch { return defaults; }
    }

    static saveConfig(config: FieldColorConfig): void {
        try { localStorage.setItem(FIELD_COLOR_SETTINGS_KEY, JSON.stringify(config)); }
        catch (e) { console.warn('Could not save field color config', e); }
    }
}
