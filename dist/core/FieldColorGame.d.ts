/**
 * FieldColorGame — тренажёр «Цвет поля»
 * Использует Chessground для рендера пустой доски.
 * Целевое поле подсвечивается через lastMove.
 */
import type { FieldColorConfig, FCResult } from '../types/index.js';
export declare class FieldColorGame {
    private Chessground;
    private ground;
    private config;
    private dom;
    private onFinish;
    private currentSquare;
    private correct;
    private incorrect;
    private streak;
    private bestStreak;
    private currentRound;
    private timeLeft;
    private timerInterval;
    private answering;
    private active;
    constructor(ChessgroundLib: any, config: FieldColorConfig, onFinish: (result: FCResult) => void);
    start(): void;
    answer(guessWhite: boolean): void;
    updateConfig(config: FieldColorConfig): void;
    destroy(): void;
    private _cacheDom;
    private _initBoard;
    private _applyStyle;
    private _nextSquare;
    private _showFeedback;
    private _updateStatsDisplay;
    private _startTimer;
    private _stopTimer;
    private _updateTimerDisplay;
    private _finish;
    private _saveStats;
    static loadConfig(): FieldColorConfig;
    static saveConfig(config: FieldColorConfig): void;
}
//# sourceMappingURL=FieldColorGame.d.ts.map