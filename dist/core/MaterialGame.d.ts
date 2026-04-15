/**
 * MaterialGame — тренажёр «Материальный перевес».
 * Показывает позицию; игрок угадывает у кого материальный перевес и на сколько.
 *
 * Правила подсчёта: пешка=1, конь=3, слон=3, ладья=5, ферзь=9. Короли не считаются.
 * Ответ: белые +N / равно / чёрные +N.
 * Предлагается 5 вариантов ответа, центрованных вокруг правильного.
 */
import type { MaterialConfig, MaterialResult } from '../types/index.js';
import type { Puzzle } from '../types/index.js';
/** Human-readable label for a balance value. */
export declare function balanceLabel(balance: number): string;
export declare class MaterialGame {
    private Chessground;
    private ground;
    private config;
    private puzzles;
    private onFinish;
    private dom;
    private currentIndex;
    private correct;
    private incorrect;
    private streak;
    private bestStreak;
    private currentBalance;
    private answering;
    private active;
    constructor(ChessgroundLib: any, puzzles: Puzzle[], config: MaterialConfig, onFinish: (result: MaterialResult) => void);
    start(): void;
    answer(chosen: number): void;
    destroy(): void;
    static loadConfig(): MaterialConfig;
    static saveConfig(cfg: MaterialConfig): void;
    static defaultConfig(): MaterialConfig;
    private _cacheDom;
    private _initBoard;
    private _loadPuzzle;
    private _onAnswer;
    private _finish;
    private _updateStats;
    private _btnBase;
}
//# sourceMappingURL=MaterialGame.d.ts.map