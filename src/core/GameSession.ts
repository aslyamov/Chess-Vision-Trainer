/**
 * Manages a single game session - puzzle iteration, move validation, statistics
 * TypeScript версия
 */

import {
    analyzeTargets,
    getMoveKey,
    isBadMove,
    findBadMoveObj
} from '../utils/chess-utils.js';

import type { 
    Puzzle, 
    SessionConfig, 
    MoveData,
    TargetColors,
    LocaleData
} from '../types/index.js';

interface Stage {
    id: string;
    color: 'w' | 'b';
    type: 'checks' | 'captures';
    name: string;
}

const STAGES: readonly Stage[] = Object.freeze([
    { id: 'w-checks', color: 'w', type: 'checks', name: 'Белые: Шахи' },
    { id: 'w-captures', color: 'w', type: 'captures', name: 'Белые: Взятия' },
    { id: 'b-checks', color: 'b', type: 'checks', name: 'Черные: Шахи' },
    { id: 'b-captures', color: 'b', type: 'captures', name: 'Черные: Взятия' }
]);

interface SessionStats {
    solvedCount: number;
    totalClicks: number;
    totalErrors: number;
    totalMovesFound: number;
    totalMovesAvailable: number;
}

export class GameSession {
    private puzzles: Puzzle[];
    private config: SessionConfig;
    private ui: any; // TODO: import UIManager type
    private board: any; // TODO: import BoardRenderer type
    private status: any; // TODO: import StatusManager type
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
    private intervals: Set<ReturnType<typeof setInterval>> = new Set();

    constructor(
        puzzles: Puzzle[],
        config: SessionConfig,
        uiManager: any,
        boardRenderer: any,
        statusManager: any,
        langData: LocaleData,
        currentLang: string
    ) {
        this.puzzles = puzzles;
        this.config = config;
        this.ui = uiManager;
        this.board = boardRenderer;
        this.status = statusManager;
        this.langData = langData;
        this.currentLang = currentLang;

        // Session state
        this.stats = {
            solvedCount: 0,
            totalClicks: 0,
            totalErrors: 0,
            totalMovesFound: 0,
            totalMovesAvailable: 0
        };

        // Puzzle state
        this.game = new Chess();
        this.targets = { 
            w: { checks: [], captures: [], checksMap: new Map(), capturesMap: new Map() }, 
            b: { checks: [], captures: [], checksMap: new Map(), capturesMap: new Map() }
        };
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

        // Start timer
        if (this.config.timeLimit > 0 && this.config.timeMode === 'total') {
            this.status.setLimitEndTime(Date.now() + (this.config.timeLimit * 1000));
            this.status.startTimer(true, () => this._handleTimeout());
        } else {
            this.status.startTimer(false);
        }

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
     * Finishes session and shows results
     */
    finish(): void {
        this.destroy();

        const totalTime = this.status.getElapsedTime();

        const puzzlesCount = Math.max(1, this.currentPuzzleIndex);
        
        const accuracy = this.stats.totalMovesAvailable > 0 
            ? (this.stats.totalMovesFound / this.stats.totalMovesAvailable) * 100 
            : 0;
            
        const avgTime = puzzlesCount > 0 
            ? totalTime / puzzlesCount 
            : 0;

        this.ui.showResults({
            solved: this.stats.solvedCount,
            total: this.puzzles.length,
            time: totalTime,
            accuracy: accuracy,
            avgTime: avgTime
        });

        console.log('✅ Сессия завершена. Решено:', this.stats.solvedCount);
    }

    /**
     * Cleanup - clears all timers and intervals
     */
    destroy(): void {
        this.timers.forEach(clearTimeout);
        this.intervals.forEach(clearInterval);
        this.timers.clear();
        this.intervals.clear();

        this.status.stopTimer();
        this.board.destroy();
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

        // Reset state
        this.foundMoves.clear();
        this.board.clearPersistentShapes();
        this.targets = { 
            w: { checks: [], captures: [], checksMap: new Map(), capturesMap: new Map() }, 
            b: { checks: [], captures: [], checksMap: new Map(), capturesMap: new Map() }
        };
        this.currentStageIndex = 0;
        this.isDelayActive = false;

        // Clear logs
        this.status.clearLogs();

        // Analyze targets (checks and captures)
        this.targets = analyzeTargets(this.game.fen());

        // Count available moves for statistics
        const badMovesList = puzzle.bad_moves || [];
        let taskMovesCount = 0;
        
        // Helper to count valid moves
        const countValid = (moves: MoveData[]) => {
            const unique = new Set();
            moves.forEach(m => {
                if (this.config.goodMovesOnly && isBadMove(m.san, badMovesList)) return;
                unique.add(getMoveKey(m.from, m.to));
            });
            return unique.size;
        };

        taskMovesCount += countValid(this.targets.w.checks);
        taskMovesCount += countValid(this.targets.w.captures);
        taskMovesCount += countValid(this.targets.b.checks);
        taskMovesCount += countValid(this.targets.b.captures);
        
        this.stats.totalMovesAvailable += taskMovesCount;

        // Set board orientation
        const orientation = this.config.autoFlip
            ? (this.game.turn() === 'w' ? 'white' : 'black')
            : 'white';

        this.board.setPosition(this.game.fen(), {
            orientation,
            coordinates: this.config.showCoordinates,
            movable: {
                showDests: !this.config.hideLegalMoves
            }
        });

        // Update UI
        this._updateGameUI();
        this.status.setStatus(this.langData.status_luck || 'Удачи!', '#0050b3');

        // Per-puzzle timer
        if (this.config.timeLimit > 0 && this.config.timeMode === 'per_puzzle') {
            this.status.setLimitEndTime(Date.now() + (this.config.timeLimit * 1000));
            this.status.startTimer(true, () => this._handleTimeout());
        }
    }

    /**
     * Handles user move
     * @private
     */
    private _handleMove(orig: string, dest: string): void {
        // Check if time expired
        if (this.config.timeLimit > 0 && Date.now() > this.status.limitEndTime) {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
            return;
        }

        // Prevent moves during delay (bad move refutation)
        if (this.isDelayActive) {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
            return;
        }

        const piece = this.game.get(orig);
        if (!piece) {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
            return;
        }

        const pieceColor = piece.color as 'w' | 'b';
        const tColor = this.targets[pieceColor];

        // ОПТИМИЗАЦИЯ: Используем Map.get() вместо Array.find()
        // O(1) вместо O(n) - в 10-100x быстрее на сложных позициях
        const moveKey = getMoveKey(orig, dest);
        const foundCheck = tColor.checksMap?.get(moveKey);
        const foundCapture = tColor.capturesMap?.get(moveKey);
        const targetMove = foundCheck || foundCapture;

        // Get SAN of move
        let san: string | null = null;
        if (targetMove) {
            san = targetMove.san;
        } else {
            const moves = this.game.moves({ verbose: true });
            const realMove = moves.find((m: any) => m.from === orig && m.to === dest);
            if (realMove) san = realMove.san;
        }

        if (!san) {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
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

                // Try to make the move
                const result = this.game.move({ from: orig, to: dest, promotion: 'q' });
                const moveSuccessful = !!result;

                const refutation = (typeof badMoveObj === 'string') ? null : badMoveObj.refutation;
                this._handleBadMoveRefutation(refutation, pieceColor, { from: orig, to: dest }, moveSuccessful);
                return;
            }

            if (!targetMove) {
                this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
                this.status.setStatus('Мимо! Это не цель.', 'orange');
                return;
            }
        } else {
            // Normal mode - only target moves count
            if (!targetMove) {
                this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
                this.status.setStatus(this.langData.status_wrong || 'Мимо! Это не цель.', 'orange');
                return;
            }
        }

        // --- SUCCESS ---
        if (this.foundMoves.has(moveKey)) {
            this.status.setStatus(this.langData.status_already || 'Уже нашли!', 'blue');
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
            return;
        }

        this.foundMoves.add(moveKey);
        this.stats.totalMovesFound++;
        this.status.logMove(san, !!foundCheck, !!foundCapture, pieceColor, this.currentLang);

        // Highlight found move
        if (this.config.highlightFound) {
            this.board.addPersistentShape({ brush: 'green', orig, dest });
        }

        // Status message
        if (this.config.goodMovesOnly) {
            this.status.setStatus(this.langData.status_correct || 'Верно!', 'green');
        } else {
            const statusText = moveIsBad
                ? (this.langData.status_dangerous || 'Взятие (но опасное!)')
                : (this.langData.status_correct || 'Верно!');
            const statusColor = moveIsBad ? '#d97706' : 'green';
            this.status.setStatus(statusText, statusColor);
        }

        this._updateGameUI();

        this._setTimeout(() => {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
        }, 300);

        // Check completion
        if (this.config.sequentialMode) {
            this._checkStageCompletion();
        } else if (this._checkIfAllFound()) {
            this.status.setStatus(this.langData.status_done || 'Всё найдено! Следующая...', 'green');
            this.stats.solvedCount++;
            this._setTimeout(() => this.nextPuzzle(), 800);
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
        this.status.setStatus(this.langData.status_error || 'ОШИБКА! Смотри почему...', 'red');

        const shapes: any[] = [];

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
                // Try to find refutation move
                let move = refutationGame.move(refutationSan);

                if (!move) {
                    const moves = refutationGame.moves({ verbose: true });
                    const cleanRef = refutationSan.replace(/[+#x]/g, '');
                    move = moves.find((m: any) => m.san.replace(/[+#x]/g, '') === cleanRef);

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

                            const candidates = moves.filter((m: any) => 
                                m.to === targetSq && m.piece === targetPiece
                            );
                            if (candidates.length > 0) {
                                move = candidates[0];
                            }
                        }
                    }
                }

                if (move) {
                    shapes.push({ orig: move.from, dest: move.to, brush: 'red' });
                } else {
                    this.status.setStatus(
                        (this.langData.status_refutation_error || 'Ошибка: Не могу показать ход') + ' ' + refutationSan,
                        'red'
                    );
                }
            } catch (e) {
                console.error('Refutation logic error:', e);
            }
        }

        // Draw shapes
        if (shapes.length > 0) {
            this.board.updateShapes(shapes);
            this._setTimeout(() => this.board.updateShapes(shapes), 50);
        }

        this._setTimeout(() => {
            if (moveSuccessful) {
                this.game.undo();
            }
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
            this.status.setStatus(this.langData.status_try_another || 'Ищи другой ход', '#333');
            this.isDelayActive = false;
            
            const isCountdown = this.config.timeLimit > 0;
            this.status.resumeTimer(isCountdown, () => this._handleTimeout());
        }, 2000);
    }

    /**
     * Updates all game UI elements
     * @private
     */
    private _updateGameUI(): void {
        this.ui.updateProgress(this.currentPuzzleIndex + 1, this.puzzles.length);

        // Task indicator (sequential mode)
        if (this.config.sequentialMode && this.currentStageIndex < STAGES.length) {
            this.ui.updateTaskIndicator(true, STAGES[this.currentStageIndex].name);
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
        const badMovesList = this.puzzles[this.currentPuzzleIndex]?.bad_moves || [];
        const uniqueMoves = new Map<string, MoveData>();

        list.forEach(m => uniqueMoves.set(getMoveKey(m.from, m.to), m));

        let total = 0;
        let found = 0;

        uniqueMoves.forEach((moveObj, key) => {
            if (this.config.goodMovesOnly && isBadMove(moveObj.san, badMovesList)) {
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

        const badMovesList = this.puzzles[this.currentPuzzleIndex]?.bad_moves || [];
        const requiredMoves = new Set<string>();

        allTargets.forEach(m => {
            if (this.config.goodMovesOnly && isBadMove(m.san, badMovesList)) return;
            requiredMoves.add(getMoveKey(m.from, m.to));
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
        const badMovesList = this.puzzles[this.currentPuzzleIndex]?.bad_moves || [];

        while (this.currentStageIndex < STAGES.length) {
            const stage = STAGES[this.currentStageIndex];
            const rawList = (stage.type === 'checks')
                ? this.targets[stage.color].checks
                : this.targets[stage.color].captures;

            let required = 0;
            let found = 0;

            rawList.forEach(m => {
                if (this.config.goodMovesOnly && isBadMove(m.san, badMovesList)) return;
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

        if (this.currentStageIndex >= STAGES.length) {
            this.status.setStatus(this.langData.status_solved || 'Готово!', 'green');
            this.stats.solvedCount++;
            this._setTimeout(() => this.nextPuzzle(), 800);
        }
    }

    /**
     * Handles timeout
     * @private
     */
    private _handleTimeout(): void {
        this.status.pauseTimer(); // Stop counting time immediately
        if (this.config.timeMode === 'total') {
            this.ui.showTimeoutModal();
        } else {
            this.status.setStatus(this.langData.status_timeout || 'Время вышло!', 'red');
            this._setTimeout(() => this.nextPuzzle(), 1000);
        }
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
