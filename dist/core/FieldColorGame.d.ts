/**
 * FieldColorGame — тренажёр «Цвет поля»
 * Использует Chessground для рендера пустой доски.
 * Целевое поле подсвечивается через lastMove.
 */
import type { FieldColorConfig } from '../types/index.js';
export declare class FieldColorGame {
    private Chessground;
    private ground;
    private config;
    private dom;
    private currentSquare;
    private correct;
    private incorrect;
    private streak;
    private bestStreak;
    private timeLeft;
    private timerInterval;
    private answering;
    private active;
    constructor(ChessgroundLib: any, config: FieldColorConfig);
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
    private _showResultModal;
    static loadConfig(): FieldColorConfig;
    static saveConfig(config: FieldColorConfig): void;
}
//# sourceMappingURL=FieldColorGame.d.ts.map