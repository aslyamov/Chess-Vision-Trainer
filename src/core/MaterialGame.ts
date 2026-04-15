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
import type { MaterialConfig, MaterialResult } from '../types/index.js';
import type { Puzzle } from '../types/index.js';

// ── Piece values ──────────────────────────────────────────────────────────────

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

/** Calculates white - black material balance from a FEN string. */
function calcBalance(fen: string): number {
    const placement = fen.split(' ')[0];
    let white = 0, black = 0;
    for (const ch of placement) {
        const v = PIECE_VALUES[ch.toLowerCase()];
        if (v === undefined) continue;
        if (ch === ch.toUpperCase()) white += v;
        else black += v;
    }
    return white - black;
}

/** Human-readable label for a balance value. */
export function balanceLabel(balance: number): string {
    if (balance === 0) return 'Равно';
    if (balance > 0)   return `Белые +${balance}`;
    return `Чёрные +${Math.abs(balance)}`;
}

/**
 * Generates 5 answer options centred on the correct balance.
 * Sorted ascending (most negative first).
 */
function generateOptions(balance: number): number[] {
    const set = new Set<number>([balance]);
    for (const d of [1, -1, 2, -2, 3, -3, 4, -4, 5, -5]) {
        if (set.size >= 5) break;
        set.add(balance + d);
    }
    return [...set].sort((a, b) => a - b);
}

// ── DOM cache ─────────────────────────────────────────────────────────────────

interface MaterialDom {
    boardEl:      HTMLElement;
    boardWrapper: HTMLElement;
    correct:      HTMLElement;
    incorrect:    HTMLElement;
    streak:       HTMLElement;
    accuracy:     HTMLElement;
    remaining:    HTMLElement;
    opts:         HTMLButtonElement[];   // 5 answer buttons
    feedback:     HTMLElement;
}

// ── Main class ────────────────────────────────────────────────────────────────

export class MaterialGame {
    private Chessground: any;
    private ground: any = null;
    private config: MaterialConfig;
    private puzzles: Puzzle[];
    private onFinish: (result: MaterialResult) => void;

    private dom: MaterialDom;

    private currentIndex = 0;
    private correct = 0;
    private incorrect = 0;
    private streak = 0;
    private bestStreak = 0;
    private currentBalance = 0;
    private answering = false;    // blocks double-clicks
    private active = false;

    constructor(
        ChessgroundLib: any,
        puzzles: Puzzle[],
        config: MaterialConfig,
        onFinish: (result: MaterialResult) => void,
    ) {
        this.Chessground = ChessgroundLib;
        this.puzzles     = puzzles;
        this.config      = config;
        this.onFinish    = onFinish;
        this.dom         = this._cacheDom();
    }

    // ── Public ─────────────────────────────────────────────────────────────────

    start(): void {
        this.active = true;
        this._initBoard();
        this._updateStats();
        this._loadPuzzle();
    }

    answer(chosen: number): void {
        this._onAnswer(chosen);
    }

    destroy(): void {
        this.active = false;
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        // Reset feedback
        const fb = this.dom.feedback;
        fb.textContent = '';
        fb.className   = 'text-center text-sm font-semibold h-5 transition-all';
        // Disable buttons
        this.dom.opts.forEach(b => {
            b.disabled = true;
            b.className = this._btnBase();
        });
    }

    // ── Config persistence ────────────────────────────────────────────────────

    static loadConfig(): MaterialConfig {
        try {
            const raw = localStorage.getItem(MATERIAL_SETTINGS_KEY);
            if (raw) return { ...MaterialGame.defaultConfig(), ...JSON.parse(raw) };
        } catch { /* ignore */ }
        return MaterialGame.defaultConfig();
    }

    static saveConfig(cfg: MaterialConfig): void {
        try { localStorage.setItem(MATERIAL_SETTINGS_KEY, JSON.stringify(cfg)); }
        catch { /* ignore */ }
    }

    static defaultConfig(): MaterialConfig {
        return { roundCount: 0, orientation: 'white' };
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private _cacheDom(): MaterialDom {
        const q = (id: string) => document.getElementById(id) as HTMLElement;
        return {
            boardEl:      q('materialBoard'),
            boardWrapper: q('materialBoardWrapper'),
            correct:      q('materialCorrect'),
            incorrect:    q('materialIncorrect'),
            streak:       q('materialStreak'),
            accuracy:     q('materialAccuracy'),
            remaining:    q('materialRemaining'),
            opts: [0, 1, 2, 3, 4].map(i =>
                document.getElementById(`materialOpt${i}`) as HTMLButtonElement),
            feedback:     q('materialFeedback'),
        };
    }

    private _initBoard(): void {
        const orientation = this.config.orientation === 'random'
            ? (Math.random() < 0.5 ? 'white' : 'black')
            : this.config.orientation;

        this.ground = this.Chessground(this.dom.boardEl, {
            fen:         '8/8/8/8/8/8/8/8',  // blank; will be set in _loadPuzzle
            orientation,
            coordinates: true,
            movable:     { free: false, color: undefined },
            draggable:   { enabled: false },
            selectable:  { enabled: false },
            drawable:    { enabled: false },
            highlight:   { lastMove: false, check: false },
        });
    }

    private _loadPuzzle(): void {
        if (!this.active) return;

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
        fb.className   = 'text-center text-sm font-semibold h-5 transition-all';

        this._updateStats();
    }

    private _onAnswer(chosen: number): void {
        if (!this.active || this.answering) return;
        this.answering = true;

        const correct = chosen === this.currentBalance;
        if (correct) {
            this.correct++;
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
        } else {
            this.incorrect++;
            this.streak = 0;
        }

        // Highlight buttons
        this.dom.opts.forEach(btn => {
            btn.disabled = true;
            const val = Number(btn.dataset['value']);
            if (val === this.currentBalance) {
                btn.className = this._btnBase() + ' btn-success text-success-content border-success';
            } else if (val === chosen && !correct) {
                btn.className = this._btnBase() + ' btn-error text-error-content border-error';
            }
        });

        // Feedback text
        const fb = this.dom.feedback;
        if (correct) {
            fb.textContent = '✓ Верно!';
            fb.className   = 'text-center text-sm font-semibold h-5 text-success';
        } else {
            fb.textContent = `✗ Правильно: ${balanceLabel(this.currentBalance)}`;
            fb.className   = 'text-center text-sm font-semibold h-5 text-error';
        }

        this._updateStats();

        this.currentIndex++;
        setTimeout(() => {
            if (this.active) this._loadPuzzle();
        }, 900);
    }

    private _finish(): void {
        this.active = false;
        const result: MaterialResult = {
            correct:    this.correct,
            incorrect:  this.incorrect,
            bestStreak: this.bestStreak,
        };
        materialStatsManager.record(result);
        this.onFinish(result);
    }

    private _updateStats(): void {
        const total = this.correct + this.incorrect;
        const acc   = total > 0 ? Math.round(this.correct / total * 100) : 0;
        const rem   = this.config.roundCount > 0
            ? String(this.config.roundCount - this.currentIndex)
            : '∞';

        this.dom.correct.textContent   = String(this.correct);
        this.dom.incorrect.textContent = String(this.incorrect);
        this.dom.streak.textContent    = String(this.streak);
        this.dom.accuracy.textContent  = total > 0 ? `${acc}%` : '—';
        this.dom.remaining.textContent = rem;
    }

    private _btnBase(): string {
        return 'btn btn-outline w-full text-base font-bold transition-colors duration-150';
    }

}
