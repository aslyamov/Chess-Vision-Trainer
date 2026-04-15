/**
 * MaterialGame — тренажёр «Материальный перевес».
 * Показывает позицию; игрок угадывает у кого материальный перевес и на сколько.
 *
 * Правила подсчёта: пешка=1, конь=3, слон=3, ладья=5, ферзь=9. Короли не считаются.
 * Ответ: белые +N / равно / чёрные +N.
 * Предлагается 5 вариантов ответа, центрованных вокруг правильного.
 */
import { materialStatsManager } from './MaterialStatsManager.js';
import { MATERIAL_SETTINGS_KEY } from '../constants.js';
// ── Piece values ──────────────────────────────────────────────────────────────
const PIECE_VALUES = { p: 1, n: 3, b: 3, r: 5, q: 9 };
/** Calculates white - black material balance from a FEN string. */
function calcBalance(fen) {
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
/** Human-readable label for a balance value. */
export function balanceLabel(balance) {
    if (balance === 0)
        return 'Равно';
    if (balance > 0)
        return `Белые +${balance}`;
    return `Чёрные +${Math.abs(balance)}`;
}
/**
 * Generates 5 answer options centred on the correct balance.
 * Sorted ascending (most negative first).
 */
function generateOptions(balance) {
    const set = new Set([balance]);
    for (const d of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5]) {
        if (set.size >= 5)
            break;
        set.add(balance + d);
    }
    return [...set].sort((a, b) => a - b);
}
// ── Main class ────────────────────────────────────────────────────────────────
export class MaterialGame {
    constructor(ChessgroundLib, puzzles, config, onFinish) {
        this.ground = null;
        this.currentIndex = 0;
        this.correct = 0;
        this.incorrect = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.currentBalance = 0;
        this.answering = false; // blocks double-clicks
        this.active = false;
        this.Chessground = ChessgroundLib;
        this.puzzles = puzzles;
        this.config = config;
        this.onFinish = onFinish;
        this.dom = this._cacheDom();
    }
    // ── Public ─────────────────────────────────────────────────────────────────
    start() {
        this.active = true;
        this._initBoard();
        this._updateStats();
        this._loadPuzzle();
    }
    answer(chosen) {
        this._onAnswer(chosen);
    }
    destroy() {
        this.active = false;
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        // Reset feedback
        const fb = this.dom.feedback;
        fb.textContent = '';
        fb.className = 'text-center text-sm font-semibold h-5 transition-all';
        // Disable buttons
        this.dom.opts.forEach(b => {
            b.disabled = true;
            b.className = this._btnBase();
        });
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
            opts: [0, 1, 2, 3, 4].map(i => document.getElementById(`materialOpt${i}`)),
            feedback: q('materialFeedback'),
        };
    }
    _initBoard() {
        const orientation = this.config.orientation === 'random'
            ? (Math.random() < 0.5 ? 'white' : 'black')
            : this.config.orientation;
        this.ground = this.Chessground(this.dom.boardEl, {
            fen: '8/8/8/8/8/8/8/8', // blank; will be set in _loadPuzzle
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
            // Ran out of puzzles — wrap around
            this.currentIndex = 0;
        }
        const puzzle = this.puzzles[this.currentIndex];
        this.currentBalance = calcBalance(puzzle.fen);
        this.answering = false;
        // Update board
        this.ground.set({ fen: puzzle.fen });
        // Render answer buttons
        const options = generateOptions(this.currentBalance);
        this.dom.opts.forEach((btn, i) => {
            const val = options[i];
            btn.textContent = balanceLabel(val);
            btn.dataset['value'] = String(val);
            btn.disabled = false;
            btn.className = this._btnBase();
        });
        // Clear feedback
        const fb = this.dom.feedback;
        fb.textContent = '';
        fb.className = 'text-center text-sm font-semibold h-5 transition-all';
        this._updateStats();
    }
    _onAnswer(chosen) {
        if (!this.active || this.answering)
            return;
        this.answering = true;
        const correct = chosen === this.currentBalance;
        if (correct) {
            this.correct++;
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
        }
        else {
            this.incorrect++;
            this.streak = 0;
        }
        // Highlight buttons
        this.dom.opts.forEach(btn => {
            btn.disabled = true;
            const val = Number(btn.dataset['value']);
            if (val === this.currentBalance) {
                btn.className = this._btnBase() + ' btn-success text-success-content border-success';
            }
            else if (val === chosen && !correct) {
                btn.className = this._btnBase() + ' btn-error text-error-content border-error';
            }
        });
        // Feedback text
        const fb = this.dom.feedback;
        if (correct) {
            fb.textContent = '✓ Верно!';
            fb.className = 'text-center text-sm font-semibold h-5 text-success';
        }
        else {
            fb.textContent = `✗ Правильно: ${balanceLabel(this.currentBalance)}`;
            fb.className = 'text-center text-sm font-semibold h-5 text-error';
        }
        this._updateStats();
        this.currentIndex++;
        setTimeout(() => {
            if (this.active)
                this._loadPuzzle();
        }, 900);
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
    _btnBase() {
        return 'btn btn-outline w-full text-base font-bold transition-colors duration-150';
    }
}
//# sourceMappingURL=MaterialGame.js.map