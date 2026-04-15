/**
 * MaterialGame — тренажёр «Материальный перевес».
 * Показывает позицию; модуль собирает ответ игрока (кто + сколько) и вызывает answer().
 *
 * Правила: пешка=1, конь=3, слон=3, ладья=5, ферзь=9. Короли не считаются.
 * balance = white_material − black_material.
 */
import { materialStatsManager } from './MaterialStatsManager.js';
import { MATERIAL_SETTINGS_KEY } from '../constants.js';
// ── Material helpers ──────────────────────────────────────────────────────────
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };
export function calcBalance(fen) {
    const placement = fen.split(' ')[0];
    let white = 0, black = 0;
    for (const ch of placement) {
        const v = PIECE_VALUES[ch.toLowerCase()];
        if (v === undefined)
            continue;
        if (ch === ch.toUpperCase())
            white += v;
        else
            black += v;
    }
    return white - black;
}
export function balanceLabel(balance) {
    if (balance === 0)
        return 'Равно';
    if (balance > 0)
        return `Белые +${balance}`;
    return `Чёрные +${Math.abs(balance)}`;
}
// ── Main class ────────────────────────────────────────────────────────────────
export class MaterialGame {
    /** The correct balance for the current puzzle (public read). */
    get currentBalance() { return this._currentBalance; }
    constructor(ChessgroundLib, puzzles, config, onFinish, onPuzzleReady = () => { }) {
        this.ground = null;
        this.currentIndex = 0;
        this.correct = 0;
        this.incorrect = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.active = false;
        this.answering = false;
        this._currentBalance = 0;
        this.Chessground = ChessgroundLib;
        this.puzzles = puzzles;
        this.config = config;
        this.onFinish = onFinish;
        this.onPuzzleReady = onPuzzleReady;
        this.dom = this._cacheDom();
    }
    // ── Public ─────────────────────────────────────────────────────────────────
    start() {
        this.active = true;
        this._initBoard();
        this._updateStats();
        this._loadPuzzle();
    }
    /**
     * Submit an answer from the module's input UI.
     * @param chosen balance: positive = white leads, negative = black leads, 0 = equal
     * @returns true if accepted (not already answering / not finished)
     */
    answer(chosen) {
        if (!this.active || this.answering)
            return false;
        this.answering = true;
        const correct = chosen === this._currentBalance;
        if (correct) {
            this.correct++;
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
        }
        else {
            this.incorrect++;
            this.streak = 0;
        }
        // Show feedback
        const fb = this.dom.feedback;
        if (correct) {
            fb.textContent = '✓ Верно!';
            fb.className = 'text-center text-sm font-semibold transition-all text-success';
        }
        else {
            fb.textContent = `✗ Правильно: ${balanceLabel(this._currentBalance)}`;
            fb.className = 'text-center text-sm font-semibold transition-all text-error';
        }
        this._updateStats();
        this.currentIndex++;
        setTimeout(() => {
            if (this.active)
                this._loadPuzzle();
        }, 950);
        return true;
    }
    destroy() {
        this.active = false;
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        const fb = this.dom.feedback;
        fb.textContent = '';
        fb.className = 'text-center text-sm font-semibold transition-all';
    }
    // ── Config persistence ────────────────────────────────────────────────────
    static loadConfig() {
        try {
            const raw = localStorage.getItem(MATERIAL_SETTINGS_KEY);
            if (raw)
                return { ...MaterialGame.defaultConfig(), ...JSON.parse(raw) };
        }
        catch { /* ignore */ }
        return MaterialGame.defaultConfig();
    }
    static saveConfig(cfg) {
        try {
            localStorage.setItem(MATERIAL_SETTINGS_KEY, JSON.stringify(cfg));
        }
        catch { /* ignore */ }
    }
    static defaultConfig() {
        return { roundCount: 0, orientation: 'white' };
    }
    // ── Private ───────────────────────────────────────────────────────────────
    _cacheDom() {
        const q = (id) => document.getElementById(id);
        return {
            boardEl: q('materialBoard'),
            boardWrapper: q('materialBoardWrapper'),
            correct: q('materialCorrect'),
            incorrect: q('materialIncorrect'),
            streak: q('materialStreak'),
            accuracy: q('materialAccuracy'),
            remaining: q('materialRemaining'),
            feedback: q('materialFeedback'),
        };
    }
    _initBoard() {
        const orientation = this.config.orientation === 'random'
            ? (Math.random() < 0.5 ? 'white' : 'black')
            : this.config.orientation;
        this.ground = this.Chessground(this.dom.boardEl, {
            fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
            orientation,
            coordinates: true,
            movable: { free: false, color: undefined },
            draggable: { enabled: false },
            selectable: { enabled: false },
            drawable: { enabled: false },
            highlight: { lastMove: false, check: false },
        });
    }
    _loadPuzzle() {
        if (!this.active)
            return;
        if (this.config.roundCount > 0 && this.currentIndex >= this.config.roundCount) {
            this._finish();
            return;
        }
        if (this.currentIndex >= this.puzzles.length) {
            this.currentIndex = 0;
        }
        const puzzle = this.puzzles[this.currentIndex];
        this._currentBalance = calcBalance(puzzle.fen);
        this.answering = false;
        this.ground.set({ fen: puzzle.fen });
        // Clear feedback
        const fb = this.dom.feedback;
        fb.textContent = '';
        fb.className = 'text-center text-sm font-semibold transition-all';
        this._updateStats();
        // Let the module reset its input UI
        this.onPuzzleReady();
    }
    _finish() {
        this.active = false;
        const result = {
            correct: this.correct,
            incorrect: this.incorrect,
            bestStreak: this.bestStreak,
        };
        materialStatsManager.record(result);
        this.onFinish(result);
    }
    _updateStats() {
        const total = this.correct + this.incorrect;
        const acc = total > 0 ? Math.round(this.correct / total * 100) : 0;
        const rem = this.config.roundCount > 0
            ? String(this.config.roundCount - this.currentIndex)
            : '∞';
        this.dom.correct.textContent = String(this.correct);
        this.dom.incorrect.textContent = String(this.incorrect);
        this.dom.streak.textContent = String(this.streak);
        this.dom.accuracy.textContent = total > 0 ? `${acc}%` : '—';
        this.dom.remaining.textContent = rem;
    }
}
//# sourceMappingURL=MaterialGame.js.map