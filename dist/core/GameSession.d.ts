/**
 * Manages a single game session - puzzle iteration, move validation, statistics
 * TypeScript версия
 */
import type { Puzzle, SessionConfig, LocaleData } from '../types/index.js';
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
    private intervals;
    constructor(puzzles: Puzzle[], config: SessionConfig, uiManager: any, boardRenderer: any, statusManager: any, langData: LocaleData, currentLang: string);
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
     * Cleanup - clears all timers and intervals
     */
    destroy(): void;
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
//# sourceMappingURL=GameSession.d.ts.map