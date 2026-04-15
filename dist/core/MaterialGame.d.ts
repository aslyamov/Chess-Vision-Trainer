/**
 * MaterialGame — тренажёр «Материальный перевес».
 * Показывает позицию; модуль собирает ответ игрока (кто + сколько) и вызывает answer().
 *
 * Правила: пешка=1, конь=3, слон=3, ладья=5, ферзь=9. Короли не считаются.
 * balance = white_material − black_material.
 */
import type { MaterialConfig, MaterialResult } from '../types/index.js';
import type { Puzzle } from '../types/index.js';
export declare function calcBalance(fen: string): number;
export declare function balanceLabel(balance: number): string;
export declare class MaterialGame {
    private Chessground;
    private ground;
    private config;
    private puzzles;
    private onFinish;
    /** Called whenever a new puzzle is loaded — lets the module reset its input UI. */
    private onPuzzleReady;
    private dom;
    private currentIndex;
    private correct;
    private incorrect;
    private streak;
    private bestStreak;
    private active;
    private answering;
    /** The correct balance for the current puzzle (public read). */
    get currentBalance(): number;
    private _currentBalance;
    constructor(ChessgroundLib: any, puzzles: Puzzle[], config: MaterialConfig, onFinish: (result: MaterialResult) => void, onPuzzleReady?: () => void);
    start(): void;
    /**
     * Submit an answer from the module's input UI.
     * @param chosen balance: positive = white leads, negative = black leads, 0 = equal
     * @returns true if accepted (not already answering / not finished)
     */
    answer(chosen: number): boolean;
    destroy(): void;
    static loadConfig(): MaterialConfig;
    static saveConfig(cfg: MaterialConfig): void;
    static defaultConfig(): MaterialConfig;
    private _cacheDom;
    private _initBoard;
    private _loadPuzzle;
    private _finish;
    private _updateStats;
}
//# sourceMappingURL=MaterialGame.d.ts.map