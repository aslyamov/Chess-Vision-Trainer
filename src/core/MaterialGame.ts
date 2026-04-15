/**
 * MaterialGame — тренажёр «Материальный перевес».
 * Показывает позицию; модуль собирает ответ игрока (кто + сколько) и вызывает answer().
 *
 * Правила: пешка=1, конь=3, слон=3, ладья=5, ферзь=9. Короли не считаются.
 * balance = white_material − black_material.
 */

import { materialStatsManager } from './MaterialStatsManager.js';
import { MATERIAL_SETTINGS_KEY } from '../constants.js';
import type { MaterialConfig, MaterialResult } from '../types/index.js';
import type { Puzzle } from '../types/index.js';

// ── Material helpers ──────────────────────────────────────────────────────────

const PIECE_VALUES: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9 };

export function calcBalance(fen: string): number {
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

export function balanceLabel(balance: number): string {
    if (balance === 0) return 'Равно';
    if (balance > 0)   return `Белые +${balance}`;
    return `Чёрные +${Math.abs(balance)}`;
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
    feedback:     HTMLElement;
}

// ── Main class ────────────────────────────────────────────────────────────────

export class MaterialGame {
    private Chessground: any;
    private ground: any = null;
    private config: MaterialConfig;
    private puzzles: Puzzle[];
    private onFinish: (result: MaterialResult) => void;
    /** Called whenever a new puzzle is loaded — lets the module reset its input UI. */
    private onPuzzleReady: () => void;

    private dom: MaterialDom;

    private currentIndex = 0;
    private correct = 0;
    private incorrect = 0;
    private streak = 0;
    private bestStreak = 0;
    private active = false;
    private answering = false;

    /** The correct balance for the current puzzle (public read). */
    get currentBalance(): number { return this._currentBalance; }
    private _currentBalance = 0;

    constructor(
        ChessgroundLib: any,
        puzzles: Puzzle[],
        config: MaterialConfig,
        onFinish: (result: MaterialResult) => void,
        onPuzzleReady: () => void = () => { /* noop */ },
    ) {
        this.Chessground   = ChessgroundLib;
        this.puzzles       = puzzles;
        this.config        = config;
        this.onFinish      = onFinish;
        this.onPuzzleReady = onPuzzleReady;
        this.dom           = this._cacheDom();
    }

    // ── Public ─────────────────────────────────────────────────────────────────

    start(): void {
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
    answer(chosen: number): boolean {
        if (!this.active || this.answering) return false;
        this.answering = true;

        const correct = chosen === this._currentBalance;
        if (correct) {
            this.correct++;
            this.streak++;
            this.bestStreak = Math.max(this.bestStreak, this.streak);
        } else {
            this.incorrect++;
            this.streak = 0;
        }

        // Show feedback
        const fb = this.dom.feedback;
        if (correct) {
            fb.textContent = '✓ Верно!';
            fb.className   = 'text-center text-sm font-semibold transition-all text-success';
        } else {
            fb.textContent = `✗ Правильно: ${balanceLabel(this._currentBalance)}`;
            fb.className   = 'text-center text-sm font-semibold transition-all text-error';
        }

        this._updateStats();

        this.currentIndex++;
        setTimeout(() => {
            if (this.active) this._loadPuzzle();
        }, 950);

        return true;
    }

    destroy(): void {
        this.active = false;
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        const fb = this.dom.feedback;
        fb.textContent = '';
        fb.className   = 'text-center text-sm font-semibold transition-all';
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
            feedback:     q('materialFeedback'),
        };
    }

    private _initBoard(): void {
        const orientation = this.config.orientation === 'random'
            ? (Math.random() < 0.5 ? 'white' : 'black')
            : this.config.orientation;

        this.ground = this.Chessground(this.dom.boardEl, {
            fen:         'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR',
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
            this.currentIndex = 0;
        }

        const puzzle = this.puzzles[this.currentIndex];
        this._currentBalance = calcBalance(puzzle.fen);
        this.answering = false;

        this.ground.set({ fen: puzzle.fen });

        // Clear feedback
        const fb = this.dom.feedback;
        fb.textContent = '';
        fb.className   = 'text-center text-sm font-semibold transition-all';

        this._updateStats();

        // Let the module reset its input UI
        this.onPuzzleReady();
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
}
