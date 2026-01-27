/**
 * Manages a single game session - puzzle iteration, move validation, statistics
 * TypeScript версия
 */
import type { Puzzle, SessionConfig, LocaleData } from '../types/index.js';
interface IUIManager {
    showGameScreen(): void;
    showResults(stats: {
        solved: number;
        total: number;
        time: number;
        accuracy: number;
        avgTime: number;
    }): void;
    applySettings(config: SessionConfig): void;
    updateProgress(current: number, total: number): void;
    updateTaskIndicator(visible: boolean, name?: string): void;
    updateCounter(id: string, found: number, total: number): void;
    showTimeoutModal(): void;
}
interface IBoardRenderer {
    initialize(config: {
        onMove: (orig: string, dest: string) => void;
    }): void;
    setPosition(fen: string, options: any): void;
    clearPersistentShapes(): void;
    clearUserShapes(): void;
    addPersistentShape(shape: {
        brush: string;
        orig: string;
        dest: string;
    }): void;
    updateShapes(shapes: Array<{
        orig: string;
        dest: string;
        brush: string;
    }>): void;
    undoVisual(fen: string, options: {
        showDests?: boolean;
    }): void;
    destroy(): void;
}
interface IStatusManager {
    updateSettings(config: SessionConfig): void;
    setSessionStartTime(time: number): void;
    setLimitEndTime(time: number): void;
    startTimer(isCountdown: boolean, onTimeout?: () => void): void;
    stopTimer(): void;
    pauseTimer(): void;
    resumeTimer(isCountdown: boolean, onTimeout?: () => void): void;
    getElapsedTime(): number;
    setStatus(message: string, color: string): void;
    logMove(san: string, isCheck: boolean, isCapture: boolean, color: 'w' | 'b', lang: string): void;
    clearLogs(): void;
    readonly limitEndTimeValue: number;
}
export declare class GameSession {
    private puzzles;
    private config;
    private ui;
    private board;
    private status;
    private langData;
    private currentLang;
    private currentPuzzleIndex;
    private stats;
    private game;
    private foundMoves;
    private targets;
    private currentStageIndex;
    private isDelayActive;
    private timers;
    constructor(puzzles: Puzzle[], config: SessionConfig, uiManager: IUIManager, boardRenderer: IBoardRenderer, statusManager: IStatusManager, langData: LocaleData, currentLang: string);
    /**
     * Starts the game session
     */
    start(): void;
    /**
     * Loads next puzzle
     */
    nextPuzzle(): void;
    /**
     * Finishes session and shows results
     */
    finish(): void;
    /**
     * Cleanup - clears all timers
     */
    destroy(): void;
    /**
     * Checks if a move should be counted (not a bad move in goodMovesOnly mode)
     * @private
     */
    private _isValidMove;
    /**
     * Creates empty targets object
     * @private
     */
    private _createEmptyTargets;
    /**
     * Gets bad moves list for current puzzle
     * @private
     */
    private _getCurrentBadMoves;
    /**
     * Counts valid moves (excluding bad moves in goodMovesOnly mode)
     * @private
     */
    private _countValidMoves;
    /**
     * Loads puzzle by index
     * @private
     */
    private _loadPuzzle;
    /**
     * Handles user move
     * @private
     */
    private _handleMove;
    /**
     * Handles bad move with refutation
     * @private
     */
    private _handleBadMoveRefutation;
    /**
     * Updates all game UI elements
     * @private
     */
    private _updateGameUI;
    /**
     * Updates individual counter
     * @private
     */
    private _updateCounter;
    /**
     * Checks if all targets found
     * @private
     */
    private _checkIfAllFound;
    /**
     * Checks stage completion (sequential mode)
     * @private
     */
    private _checkStageCompletion;
    /**
     * Handles timeout
     * @private
     */
    private _handleTimeout;
    /**
     * setTimeout with automatic tracking
     * @private
     */
    private _setTimeout;
}
export {};
//# sourceMappingURL=GameSession.d.ts.map