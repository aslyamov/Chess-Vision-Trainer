/**
 * Manages a single game session - puzzle iteration, move validation, statistics
 * TypeScript версия
 */

import {
    analyzeTargets,
    getMoveKey,
    isBadMove,
    findBadMoveObj,
    clearDestsCache
} from '../utils/chess-utils.js';

import { DELAYS, TIME, BRUSHES, STATUS_COLORS } from '../constants.js';
import { soundManager } from './SoundManager.js';
import { puzzleProgress } from './PuzzleProgressManager.js';
import { statsManager } from './StatsManager.js';
import { commonStatsManager } from './CommonStatsManager.js';

import type { IGameUI } from '../ui/CCGameUI.js';
import type {
    Puzzle,
    SessionConfig,
    MoveData,
    TargetColors,
    LocaleData,
    BadMove,
    ChessgroundConfig,
    DrawShape,
    CCSessionStats,
    CCOverallStats,
} from '../types/index.js';

// ==========================================
// INTERFACES FOR DEPENDENCIES
// ==========================================
// IGameUI импортируется из CCGameUI.ts — там определён контракт между
// GameSession и CC-специфичным UI-слоем.

interface IBoardRenderer {
    initialize(config: { onMove: (orig: string, dest: string) => void }): void;
    setPosition(fen: string, options: Partial<ChessgroundConfig>): void;
    setOrientation(orientation: 'white' | 'black'): void;
    clearPersistentShapes(): void;
    clearUserShapes(): void;
    addPersistentShape(shape: DrawShape): void;
    updateShapes(shapes: DrawShape[]): void;
    undoVisual(fen: string, options: { showDests?: boolean; movableColor?: 'white' | 'black' | 'both' }): void;
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

interface Stage {
    id: string;
    color: 'w' | 'b';
    type: 'checks' | 'captures';
    langKey: string;
    fallback: string;
}

const STAGES: readonly Stage[] = Object.freeze([
    { id: 'w-checks', color: 'w', type: 'checks', langKey: 'stage_w_checks', fallback: 'Белые: Шахи' },
    { id: 'w-captures', color: 'w', type: 'captures', langKey: 'stage_w_captures', fallback: 'Белые: Взятия' },
    { id: 'b-checks', color: 'b', type: 'checks', langKey: 'stage_b_checks', fallback: 'Чёрные: Шахи' },
    { id: 'b-captures', color: 'b', type: 'captures', langKey: 'stage_b_captures', fallback: 'Чёрные: Взятия' }
]);

interface MoveStats {
    found: number;
    total: number;
}

interface SessionStats {
    solvedCount: number;
    newPuzzlesSolved: number;
    totalClicks: number;
    totalErrors: number;
    totalMovesFound: number;
    totalMovesAvailable: number;
    // Move stats by category
    wChecks: MoveStats;
    wCaptures: MoveStats;
    bChecks: MoveStats;
    bCaptures: MoveStats;
}

export class GameSession {
    private puzzles: Puzzle[];
    private config: SessionConfig;
    private ui: IGameUI;
    private board: IBoardRenderer;
    private status: IStatusManager;
    private langData: LocaleData;
    private currentLang: string;

    // Session state
    private currentPuzzleIndex: number = 0;
    private stats: SessionStats;

    // Puzzle state
    private game: Chess;
    private foundMoves: Set<string> = new Set();
    private targets: TargetColors;
    private currentStageIndex: number = 0;
    private isDelayActive: boolean = false;

    // Timer management
    private timers: Set<ReturnType<typeof setTimeout>> = new Set();

    // Track puzzles that were already solved before session started
    private previouslySolvedIds: Set<number>;

    // Callback to get overall stats
    private getOverallStats?: () => CCOverallStats;

    constructor(
        puzzles: Puzzle[],
        config: SessionConfig,
        uiManager: IGameUI,
        boardRenderer: IBoardRenderer,
        statusManager: IStatusManager,
        langData: LocaleData,
        currentLang: string,
        getOverallStats?: () => CCOverallStats
    ) {
        this.puzzles = puzzles;
        this.config = config;
        this.ui = uiManager;
        this.board = boardRenderer;
        this.status = statusManager;
        this.langData = langData;
        this.currentLang = currentLang;
        this.getOverallStats = getOverallStats;

        // Session state
        this.stats = {
            solvedCount: 0,
            newPuzzlesSolved: 0,
            totalClicks: 0,
            totalErrors: 0,
            totalMovesFound: 0,
            totalMovesAvailable: 0,
            wChecks: { found: 0, total: 0 },
            wCaptures: { found: 0, total: 0 },
            bChecks: { found: 0, total: 0 },
            bCaptures: { found: 0, total: 0 }
        };

        // Store which puzzles were already solved before session
        this.previouslySolvedIds = puzzleProgress.getSolvedIds();

        // Puzzle state
        this.game = new Chess();
        this.targets = this._createEmptyTargets();
    }

    /**
     * Starts the game session
     */
    start(): void {
        // Update status manager settings
        this.status.updateSettings(this.config);
        this.status.setSessionStartTime(Date.now());

        // Show game screen
        this.ui.showGameScreen();
        this.ui.applySettings(this.config);

        // Initialize board
        this.board.initialize({
            onMove: this._handleMove.bind(this)
        });

        // Start stopwatch (per-puzzle countdown is set in _loadPuzzle)
        this.status.startTimer(false);

        // Load first puzzle
        this._loadPuzzle(0);
    }

    /**
     * Loads next puzzle
     */
    nextPuzzle(): void {
        this.currentPuzzleIndex++;
        this._loadPuzzle(this.currentPuzzleIndex);
    }

    /**
     * Finishes session and shows results.
     * ВАЖНО: totalTime читается до destroy() — после stopTimer() значение
     * всё ещё корректно, но порядок явно фиксирует намерение.
     */
    finish(): void {
        // Читаем время ПЕРЕД уничтожением, чтобы не зависеть от порядка destroy()
        const totalTime = this.status.getElapsedTime();
        this.destroy();

        const puzzlesCount = Math.max(1, this.currentPuzzleIndex);
        const accuracy = this.stats.totalClicks > 0
            ? (this.stats.totalMovesFound / this.stats.totalClicks) * 100
            : 0;
        const avgTime = totalTime / puzzlesCount;

        const overallStats = this.getOverallStats?.();

        const moveStats: CCSessionStats['moveStats'] = {
            wChecks:   this.stats.wChecks,
            wCaptures: this.stats.wCaptures,
            bChecks:   this.stats.bChecks,
            bCaptures: this.stats.bCaptures,
        };

        this.ui.showResults({
            solved:     this.stats.solvedCount,
            total:      this.puzzles.length,
            time:       totalTime,
            accuracy,
            avgTime,
            newPuzzles: this.stats.newPuzzlesSolved,
            moveStats,
        }, overallStats);

        const mode = this.config.goodMovesOnly ? 'goodMoves'
                   : this.config.sequentialMode ? 'sequential' : 'normal';

        statsManager.saveSession({
            difficulty:       this.config.difficulty || 'all',
            puzzleCount:      this.puzzles.length,
            puzzlesSolved:    this.stats.solvedCount,
            newPuzzlesSolved: this.stats.newPuzzlesSolved,
            totalTime,
            avgTime,
            accuracy,
            moveStats,
            mode,
        });

        commonStatsManager.recordPlay();
        console.log('✅ Сессия завершена. Решено:', this.stats.solvedCount);
    }

    /**
     * Updates config for live settings changes during game
     */
    updateLiveConfig(config: SessionConfig): void {
        const showDestsChanged = this.config.hideLegalMoves !== config.hideLegalMoves;
        const highlightChanged = this.config.highlightFound !== config.highlightFound;

        this.config = { ...this.config, ...config };

        // Apply board changes immediately
        if (showDestsChanged) {
            this.board.undoVisual(this.game.fen(), {
                showDests: !this.config.hideLegalMoves,
                movableColor: this._getMovableColor()
            });
        }

        // Toggle found move arrows
        if (highlightChanged) {
            this.board.clearPersistentShapes();
            if (this.config.highlightFound) {
                // Redraw arrows for all found moves
                for (const key of this.foundMoves) {
                    const [orig, dest] = key.split('-');
                    this.board.addPersistentShape({ brush: BRUSHES.FOUND_MOVE, orig, dest });
                }
            }
        }
    }

    /**
     * Cleanup - clears all timers
     */
    destroy(): void {
        this.timers.forEach(clearTimeout);
        this.timers.clear();

        this.status.stopTimer();
        this.board.destroy();
    }

    // ==========================================
    // HELPER METHODS
    // ==========================================

    /**
     * Checks if a move should be counted (not a bad move in goodMovesOnly mode)
     * @private
     */
    private _isValidMove(move: MoveData, badMovesList: Array<string | BadMove>): boolean {
        if (this.config.goodMovesOnly && isBadMove(move.san, badMovesList)) {
            return false;
        }
        return true;
    }

    /**
     * Creates empty targets object
     * @private
     */
    private _createEmptyTargets(): TargetColors {
        return {
            w: { checks: [], captures: [], checksMap: new Map(), capturesMap: new Map() },
            b: { checks: [], captures: [], checksMap: new Map(), capturesMap: new Map() }
        };
    }

    /**
     * Gets bad moves list for current puzzle
     * @private
     */
    private _getCurrentBadMoves(): Array<string | BadMove> {
        return this.puzzles[this.currentPuzzleIndex]?.bad_moves || [];
    }

    /**
     * Gets movable color for current state (sequential mode restricts to stage color)
     * @private
     */
    private _getMovableColor(): 'white' | 'black' | 'both' {
        if (this.config.sequentialMode && this.currentStageIndex < STAGES.length) {
            return STAGES[this.currentStageIndex].color === 'w' ? 'white' : 'black';
        }
        return 'both';
    }

    /**
     * Counts valid moves (excluding bad moves in goodMovesOnly mode)
     * @private
     */
    private _countValidMoves(moves: MoveData[], badMovesList: Array<string | BadMove>): number {
        const unique = new Set<string>();
        moves.forEach(m => {
            if (this._isValidMove(m, badMovesList)) {
                unique.add(getMoveKey(m.from, m.to));
            }
        });
        return unique.size;
    }

    /**
     * Marks current puzzle as solved and updates stats
     * @private
     */
    private _markPuzzleSolved(): void {
        this.stats.solvedCount++;
        const puzzle = this.puzzles[this.currentPuzzleIndex];
        if (puzzle?.id) {
            if (!this.previouslySolvedIds.has(puzzle.id)) {
                this.stats.newPuzzlesSolved++;
            }
            puzzleProgress.markSolved(puzzle.id);
        }
    }

    // ==========================================
    // PRIVATE METHODS
    // ==========================================

    /**
     * Loads puzzle by index
     * @private
     */
    private _loadPuzzle(index: number): void {
        if (index >= this.puzzles.length) {
            this.finish();
            return;
        }

        const puzzle = this.puzzles[index];
        this.game.load(puzzle.fen);

        // Clear dests cache for new puzzle
        clearDestsCache();

        // Reset state
        this.foundMoves.clear();
        this.board.clearPersistentShapes();
        this.targets = this._createEmptyTargets();
        this.currentStageIndex = 0;
        this.isDelayActive = false;

        // Clear logs
        this.status.clearLogs();

        // Analyze targets (checks and captures)
        this.targets = analyzeTargets(this.game.fen());

        // Count available moves for statistics (by category)
        const badMovesList = puzzle.bad_moves || [];

        const wChecksCount = this._countValidMoves(this.targets.w.checks, badMovesList);
        const wCapturesCount = this._countValidMoves(this.targets.w.captures, badMovesList);
        const bChecksCount = this._countValidMoves(this.targets.b.checks, badMovesList);
        const bCapturesCount = this._countValidMoves(this.targets.b.captures, badMovesList);

        this.stats.wChecks.total += wChecksCount;
        this.stats.wCaptures.total += wCapturesCount;
        this.stats.bChecks.total += bChecksCount;
        this.stats.bCaptures.total += bCapturesCount;

        this.stats.totalMovesAvailable += wChecksCount + wCapturesCount + bChecksCount + bCapturesCount;

        // In sequential mode, skip stages with no valid moves (e.g. all moves are bad)
        if (this.config.sequentialMode) {
            const stageCounts = [wChecksCount, wCapturesCount, bChecksCount, bCapturesCount];
            while (this.currentStageIndex < STAGES.length && stageCounts[this.currentStageIndex] === 0) {
                this.currentStageIndex++;
            }
            // All stages empty — auto-complete puzzle
            if (this.currentStageIndex >= STAGES.length) {
                this._markPuzzleSolved();
                this._setTimeout(() => this.nextPuzzle(), DELAYS.PUZZLE_TRANSITION);
                return;
            }
        }

        // Set board orientation and movable color
        const movableColor = this._getMovableColor();
        const orientation = movableColor !== 'both' ? movableColor : 'white';

        this.board.setPosition(this.game.fen(), {
            orientation,
            coordinates: this.config.showCoordinates,
            movable: {
                color: movableColor,
                showDests: !this.config.hideLegalMoves
            }
        });

        // Update UI
        this._updateGameUI();
        this.status.setStatus(this.langData.status_luck || 'Удачи!', STATUS_COLORS.INFO);

        // Per-puzzle countdown timer
        if (this.config.timeLimit > 0) {
            this.status.setLimitEndTime(Date.now() + (this.config.timeLimit * TIME.MS_PER_SECOND));
            this.status.startTimer(true, () => this._handleTimeout());
        }
    }

    /**
     * Handles user move
     * @private
     */
    private _handleMove(orig: string, dest: string): void {
        // Check if time expired
        if (this.config.timeLimit > 0 && Date.now() > this.status.limitEndTimeValue) {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves, movableColor: this._getMovableColor() });
            return;
        }

        // Prevent moves during delay (bad move refutation)
        if (this.isDelayActive) {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves, movableColor: this._getMovableColor() });
            return;
        }

        const piece = this.game.get(orig);
        if (!piece) {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves, movableColor: this._getMovableColor() });
            return;
        }

        const pieceColor = piece.color as 'w' | 'b';
        const tColor = this.targets[pieceColor];

        // ОПТИМИЗАЦИЯ: Используем Map.get() вместо Array.find()
        // O(1) вместо O(n) - в 10-100x быстрее на сложных позициях
        const moveKey = getMoveKey(orig, dest);
        const foundCheck = tColor.checksMap?.get(moveKey);
        const foundCapture = tColor.capturesMap?.get(moveKey);

        // In sequential mode, only accept moves matching current stage type and color
        let targetMove: MoveData | undefined;
        if (this.config.sequentialMode && this.currentStageIndex < STAGES.length) {
            const stage = STAGES[this.currentStageIndex];
            if (stage.color !== pieceColor) {
                targetMove = undefined;
            } else {
                targetMove = stage.type === 'checks' ? foundCheck : foundCapture;
            }
        } else {
            targetMove = foundCheck || foundCapture;
        }

        // Get SAN of move
        let san: string | null = null;
        if (targetMove) {
            san = targetMove.san;
        } else {
            const moves = this.game.moves({ verbose: true });
            const realMove = moves.find((m: MoveData) => m.from === orig && m.to === dest);
            if (realMove) san = realMove.san;
        }

        if (!san) {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves, movableColor: this._getMovableColor() });
            return;
        }

        this.stats.totalClicks++;
        const currentPuzzle = this.puzzles[this.currentPuzzleIndex];
        const badMovesList = currentPuzzle.bad_moves || [];
        const badMoveObj = findBadMoveObj(san, badMovesList);
        const moveIsBad = !!badMoveObj;

        // --- GOOD MOVES ONLY MODE ---
        if (this.config.goodMovesOnly) {
            if (moveIsBad) {
                this.stats.totalErrors++;

                // Try to make the move (chess.js 1.x throws on illegal move instead of returning null)
                let moveSuccessful = false;
                try {
                    const result = this.game.move({ from: orig, to: dest, promotion: 'q' });
                    moveSuccessful = !!result;
                } catch { moveSuccessful = false; }

                const refutation = (typeof badMoveObj === 'string') ? null : badMoveObj.refutation;
                this._handleBadMoveRefutation(refutation, pieceColor, { from: orig, to: dest }, moveSuccessful);
                return;
            }

            if (!targetMove) {
                this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves, movableColor: this._getMovableColor() });
                this.status.setStatus(this.langData.status_wrong || 'Мимо!', STATUS_COLORS.WARNING);
                return;
            }
        } else {
            // Normal mode - only target moves count
            if (!targetMove) {
                this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves, movableColor: this._getMovableColor() });
                this.status.setStatus(this.langData.status_wrong || 'Мимо!', STATUS_COLORS.WARNING);
                return;
            }
        }

        // --- SUCCESS ---
        if (this.foundMoves.has(moveKey)) {
            this.stats.totalClicks--; // Don't count repeated moves
            soundManager.playAlready();
            this.status.setStatus(this.langData.status_already || 'Было!', STATUS_COLORS.ALREADY);
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves, movableColor: this._getMovableColor() });
            return;
        }

        // Play sound for found move (check has priority)
        if (foundCheck) {
            soundManager.playCheck();
        } else if (foundCapture) {
            soundManager.playCapture();
        }

        this.foundMoves.add(moveKey);
        this.stats.totalMovesFound++;

        // Track found moves by category
        if (foundCheck) {
            if (pieceColor === 'w') {
                this.stats.wChecks.found++;
            } else {
                this.stats.bChecks.found++;
            }
        }
        if (foundCapture) {
            if (pieceColor === 'w') {
                this.stats.wCaptures.found++;
            } else {
                this.stats.bCaptures.found++;
            }
        }

        this.status.logMove(san, !!foundCheck, !!foundCapture, pieceColor, this.currentLang);

        // Clear user-drawn arrows
        this.board.clearUserShapes();

        // Highlight found move
        if (this.config.highlightFound) {
            this.board.addPersistentShape({ brush: BRUSHES.FOUND_MOVE, orig, dest });
        }

        // Status message
        if (this.config.goodMovesOnly) {
            this.status.setStatus(this.langData.status_correct || 'Верно!', STATUS_COLORS.SUCCESS);
        } else {
            const statusText = moveIsBad
                ? (this.langData.status_dangerous || 'Опасно!')
                : (this.langData.status_correct || 'Верно!');
            const statusColor = moveIsBad ? STATUS_COLORS.DANGER : STATUS_COLORS.SUCCESS;
            this.status.setStatus(statusText, statusColor);
        }

        this._updateGameUI();

        this._setTimeout(() => {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves, movableColor: this._getMovableColor() });
        }, DELAYS.MOVE_HIGHLIGHT);

        // Check completion
        if (this.config.sequentialMode) {
            this._checkStageCompletion();
        } else if (this._checkIfAllFound()) {
            this.status.setStatus(this.langData.status_done || 'Всё!', STATUS_COLORS.SUCCESS);
            this._markPuzzleSolved();
            this._setTimeout(() => this.nextPuzzle(), DELAYS.PUZZLE_TRANSITION);
        }
    }

    /**
     * Handles bad move with refutation
     * @private
     */
    private _handleBadMoveRefutation(
        refutationSan: string | null | undefined,
        playerColor: 'w' | 'b',
        userMove: { from: string; to: string },
        moveSuccessful: boolean
    ): void {
        this.isDelayActive = true;
        this.status.pauseTimer();
        soundManager.playError();
        this.status.setStatus(this.langData.status_error || 'Зевок!', STATUS_COLORS.ERROR);

        const shapes: DrawShape[] = [];

        if (refutationSan) {
            // Simulate position after bad move
            const initialFen = this.game.fen();
            const tempGame = new Chess(initialFen);

            // Force player's turn
            const parts = tempGame.fen().split(' ');
            parts[1] = playerColor;
            parts[3] = '-';
            tempGame.load(parts.join(' '));

            // Apply bad move
            tempGame.move({ from: userMove.from, to: userMove.to, promotion: 'q' });

            // Force opponent's turn
            const opponentColor: 'w' | 'b' = playerColor === 'w' ? 'b' : 'w';
            const parts2 = tempGame.fen().split(' ');
            parts2[1] = opponentColor;
            parts2[3] = '-';
            const fenForRefutation = parts2.join(' ');

            const refutationGame = new Chess(fenForRefutation);

            try {
                // Try to find refutation move (chess.js 1.x throws on invalid SAN instead of returning null)
                let move: any = null;
                try { move = refutationGame.move(refutationSan); } catch { /* fall through to fuzzy match */ }

                if (!move) {
                    const moves = refutationGame.moves({ verbose: true });
                    const cleanRef = refutationSan.replace(/[+#x]/g, '');
                    move = moves.find((m: MoveData) => m.san.replace(/[+#x]/g, '') === cleanRef);

                    // Fallback: match by destination
                    if (!move) {
                        const destMatch = refutationSan.match(/([a-h][1-8])/);
                        if (destMatch) {
                            const targetSq = destMatch[0];
                            const pieceChar = refutationSan.match(/^[KQRBN]/) ? refutationSan[0] : 'p';
                            const pieceTypeMap: Record<string, string> = { 
                                'K': 'k', 'Q': 'q', 'R': 'r', 'B': 'b', 'N': 'n', 'p': 'p' 
                            };
                            const targetPiece = pieceTypeMap[pieceChar] || 'p';

                            const candidates = moves.filter((m: MoveData) =>
                                m.to === targetSq && m.piece === targetPiece
                            );
                            if (candidates.length > 0) {
                                move = candidates[0];
                            }
                        }
                    }
                }

                if (move) {
                    shapes.push({ orig: move.from, dest: move.to, brush: BRUSHES.REFUTATION });
                } else {
                    this.status.setStatus(
                        (this.langData.status_refutation_error || 'Ошибка') + ' ' + refutationSan,
                        STATUS_COLORS.ERROR
                    );
                }
            } catch (e) {
                console.error('Refutation logic error:', e);
            }
        }

        // Draw shapes
        if (shapes.length > 0) {
            this.board.updateShapes(shapes);
            this._setTimeout(() => this.board.updateShapes(shapes), DELAYS.SHAPE_UPDATE);
        }

        this._setTimeout(() => {
            if (moveSuccessful) {
                this.game.undo();
            }
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves, movableColor: this._getMovableColor() });
            this.status.setStatus(this.langData.status_try_another || 'Ищи ещё', STATUS_COLORS.NEUTRAL);
            this.isDelayActive = false;

            const isCountdown = this.config.timeLimit > 0;
            this.status.resumeTimer(isCountdown, () => this._handleTimeout());
        }, DELAYS.BAD_MOVE_REFUTATION);
    }

    /**
     * Updates all game UI elements
     * @private
     */
    private _updateGameUI(): void {
        this.ui.updateProgress(this.currentPuzzleIndex + 1, this.puzzles.length);

        // Task indicator (sequential mode)
        if (this.config.sequentialMode && this.currentStageIndex < STAGES.length) {
            const stage = STAGES[this.currentStageIndex];
            const targetLabel = this.langData.target_label || 'Цель:';
            const stageName = this.langData[stage.langKey] || stage.fallback;
            this.ui.updateTaskIndicator(true, `${targetLabel} ${stageName}`);
        } else {
            this.ui.updateTaskIndicator(false);
        }

        // Update counters
        this._updateCounter('w-checks', this.targets.w.checks);
        this._updateCounter('w-captures', this.targets.w.captures);
        this._updateCounter('b-checks', this.targets.b.checks);
        this._updateCounter('b-captures', this.targets.b.captures);
    }

    /**
     * Updates individual counter
     * @private
     */
    private _updateCounter(id: string, list: MoveData[]): void {
        const badMovesList = this._getCurrentBadMoves();
        const uniqueMoves = new Map<string, MoveData>();

        list.forEach(m => uniqueMoves.set(getMoveKey(m.from, m.to), m));

        let total = 0;
        let found = 0;

        uniqueMoves.forEach((moveObj, key) => {
            if (!this._isValidMove(moveObj, badMovesList)) {
                return;
            }
            total++;
            if (this.foundMoves.has(key)) found++;
        });

        this.ui.updateCounter(id, found, total);
    }

    /**
     * Checks if all targets found
     * @private
     */
    private _checkIfAllFound(): boolean {
        const allTargets: MoveData[] = [
            ...this.targets.w.checks,
            ...this.targets.w.captures,
            ...this.targets.b.checks,
            ...this.targets.b.captures
        ];

        const badMovesList = this._getCurrentBadMoves();
        const requiredMoves = new Set<string>();

        allTargets.forEach(m => {
            if (this._isValidMove(m, badMovesList)) {
                requiredMoves.add(getMoveKey(m.from, m.to));
            }
        });

        for (const req of requiredMoves) {
            if (!this.foundMoves.has(req)) return false;
        }

        return true;
    }

    /**
     * Checks stage completion (sequential mode)
     * @private
     */
    private _checkStageCompletion(): void {
        const badMovesList = this._getCurrentBadMoves();
        const prevColor = this.currentStageIndex < STAGES.length ? STAGES[this.currentStageIndex].color : null;

        while (this.currentStageIndex < STAGES.length) {
            const stage = STAGES[this.currentStageIndex];
            const rawList = (stage.type === 'checks')
                ? this.targets[stage.color].checks
                : this.targets[stage.color].captures;

            let required = 0;
            let found = 0;

            rawList.forEach(m => {
                if (!this._isValidMove(m, badMovesList)) return;
                required++;
                if (this.foundMoves.has(getMoveKey(m.from, m.to))) found++;
            });

            if (found >= required) {
                this.currentStageIndex++;
            } else {
                break;
            }
        }

        this._updateGameUI();

        // Flip board when stage color changes (sequential mode auto-flip)
        if (this.currentStageIndex < STAGES.length) {
            const newColor = STAGES[this.currentStageIndex].color;
            if (newColor !== prevColor) {
                const movableColor = this._getMovableColor();
                const orientation = movableColor !== 'both' ? movableColor : 'white';
                this.board.setOrientation(orientation);
                this.board.undoVisual(this.game.fen(), {
                    showDests: !this.config.hideLegalMoves,
                    movableColor
                });
            }
        }

        if (this.currentStageIndex >= STAGES.length) {
            this.status.setStatus(this.langData.status_solved || 'Решено!', STATUS_COLORS.SUCCESS);
            this._markPuzzleSolved();
            this._setTimeout(() => this.nextPuzzle(), DELAYS.PUZZLE_TRANSITION);
        }
    }

    /**
     * Handles timeout
     * @private
     */
    private _handleTimeout(): void {
        this.isDelayActive = true; // block further move processing until next puzzle
        this.status.pauseTimer();
        this.status.setStatus(this.langData.status_timeout || 'Время!', STATUS_COLORS.ERROR);
        this._setTimeout(() => this.nextPuzzle(), DELAYS.TIMEOUT_DISPLAY);
    }

    // ==========================================
    // TIMER MANAGEMENT (with automatic cleanup)
    // ==========================================

    /**
     * setTimeout with automatic tracking
     * @private
     */
    private _setTimeout(fn: () => void, delay: number): ReturnType<typeof setTimeout> {
        const id = setTimeout(() => {
            this.timers.delete(id);
            fn();
        }, delay);
        this.timers.add(id);
        return id;
    }
}
