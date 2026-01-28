/**
 * Manages a single game session - puzzle iteration, move validation, statistics
 * TypeScript версия
 */
import { analyzeTargets, getMoveKey, isBadMove, findBadMoveObj, clearDestsCache } from '../utils/chess-utils.js';
import { DELAYS, TIME, BRUSHES } from '../constants.js';
import { soundManager } from './SoundManager.js';
const STAGES = Object.freeze([
    { id: 'w-checks', color: 'w', type: 'checks', name: 'Белые: Шахи' },
    { id: 'w-captures', color: 'w', type: 'captures', name: 'Белые: Взятия' },
    { id: 'b-checks', color: 'b', type: 'checks', name: 'Черные: Шахи' },
    { id: 'b-captures', color: 'b', type: 'captures', name: 'Черные: Взятия' }
]);
export class GameSession {
    constructor(puzzles, config, uiManager, boardRenderer, statusManager, langData, currentLang) {
        // Session state
        this.currentPuzzleIndex = 0;
        this.foundMoves = new Set();
        this.currentStageIndex = 0;
        this.isDelayActive = false;
        // Timer management
        this.timers = new Set();
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
        this.targets = this._createEmptyTargets();
    }
    /**
     * Starts the game session
     */
    start() {
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
            this.status.setLimitEndTime(Date.now() + (this.config.timeLimit * TIME.MS_PER_SECOND));
            this.status.startTimer(true, () => this._handleTimeout());
        }
        else {
            this.status.startTimer(false);
        }
        // Load first puzzle
        this._loadPuzzle(0);
    }
    /**
     * Loads next puzzle
     */
    nextPuzzle() {
        this.currentPuzzleIndex++;
        this._loadPuzzle(this.currentPuzzleIndex);
    }
    /**
     * Finishes session and shows results
     */
    finish() {
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
     * Cleanup - clears all timers
     */
    destroy() {
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
    _isValidMove(move, badMovesList) {
        if (this.config.goodMovesOnly && isBadMove(move.san, badMovesList)) {
            return false;
        }
        return true;
    }
    /**
     * Creates empty targets object
     * @private
     */
    _createEmptyTargets() {
        return {
            w: { checks: [], captures: [], checksMap: new Map(), capturesMap: new Map() },
            b: { checks: [], captures: [], checksMap: new Map(), capturesMap: new Map() }
        };
    }
    /**
     * Gets bad moves list for current puzzle
     * @private
     */
    _getCurrentBadMoves() {
        return this.puzzles[this.currentPuzzleIndex]?.bad_moves || [];
    }
    /**
     * Counts valid moves (excluding bad moves in goodMovesOnly mode)
     * @private
     */
    _countValidMoves(moves, badMovesList) {
        const unique = new Set();
        moves.forEach(m => {
            if (this._isValidMove(m, badMovesList)) {
                unique.add(getMoveKey(m.from, m.to));
            }
        });
        return unique.size;
    }
    // ==========================================
    // PRIVATE METHODS
    // ==========================================
    /**
     * Loads puzzle by index
     * @private
     */
    _loadPuzzle(index) {
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
        // Count available moves for statistics
        const badMovesList = puzzle.bad_moves || [];
        let taskMovesCount = 0;
        taskMovesCount += this._countValidMoves(this.targets.w.checks, badMovesList);
        taskMovesCount += this._countValidMoves(this.targets.w.captures, badMovesList);
        taskMovesCount += this._countValidMoves(this.targets.b.checks, badMovesList);
        taskMovesCount += this._countValidMoves(this.targets.b.captures, badMovesList);
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
            this.status.setLimitEndTime(Date.now() + (this.config.timeLimit * TIME.MS_PER_SECOND));
            this.status.startTimer(true, () => this._handleTimeout());
        }
    }
    /**
     * Handles user move
     * @private
     */
    _handleMove(orig, dest) {
        // Check if time expired
        if (this.config.timeLimit > 0 && Date.now() > this.status.limitEndTimeValue) {
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
        const pieceColor = piece.color;
        const tColor = this.targets[pieceColor];
        // ОПТИМИЗАЦИЯ: Используем Map.get() вместо Array.find()
        // O(1) вместо O(n) - в 10-100x быстрее на сложных позициях
        const moveKey = getMoveKey(orig, dest);
        const foundCheck = tColor.checksMap?.get(moveKey);
        const foundCapture = tColor.capturesMap?.get(moveKey);
        const targetMove = foundCheck || foundCapture;
        // Get SAN of move
        let san = null;
        if (targetMove) {
            san = targetMove.san;
        }
        else {
            const moves = this.game.moves({ verbose: true });
            const realMove = moves.find((m) => m.from === orig && m.to === dest);
            if (realMove)
                san = realMove.san;
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
        }
        else {
            // Normal mode - only target moves count
            if (!targetMove) {
                this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
                this.status.setStatus(this.langData.status_wrong || 'Мимо! Это не цель.', 'orange');
                return;
            }
        }
        // --- SUCCESS ---
        if (this.foundMoves.has(moveKey)) {
            soundManager.playAlready();
            this.status.setStatus(this.langData.status_already || 'Уже нашли!', 'blue');
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
            return;
        }
        // Play sound for found move (check has priority)
        if (foundCheck) {
            soundManager.playCheck();
        }
        else if (foundCapture) {
            soundManager.playCapture();
        }
        this.foundMoves.add(moveKey);
        this.stats.totalMovesFound++;
        this.status.logMove(san, !!foundCheck, !!foundCapture, pieceColor, this.currentLang);
        // Clear user-drawn arrows
        this.board.clearUserShapes();
        // Highlight found move
        if (this.config.highlightFound) {
            this.board.addPersistentShape({ brush: BRUSHES.FOUND_MOVE, orig, dest });
        }
        // Status message
        if (this.config.goodMovesOnly) {
            this.status.setStatus(this.langData.status_correct || 'Верно!', 'green');
        }
        else {
            const statusText = moveIsBad
                ? (this.langData.status_dangerous || 'Взятие (но опасное!)')
                : (this.langData.status_correct || 'Верно!');
            const statusColor = moveIsBad ? '#d97706' : 'green';
            this.status.setStatus(statusText, statusColor);
        }
        this._updateGameUI();
        this._setTimeout(() => {
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
        }, DELAYS.MOVE_HIGHLIGHT);
        // Check completion
        if (this.config.sequentialMode) {
            this._checkStageCompletion();
        }
        else if (this._checkIfAllFound()) {
            this.status.setStatus(this.langData.status_done || 'Всё найдено! Следующая...', 'green');
            this.stats.solvedCount++;
            this._setTimeout(() => this.nextPuzzle(), DELAYS.PUZZLE_TRANSITION);
        }
    }
    /**
     * Handles bad move with refutation
     * @private
     */
    _handleBadMoveRefutation(refutationSan, playerColor, userMove, moveSuccessful) {
        this.isDelayActive = true;
        this.status.pauseTimer();
        soundManager.playError();
        this.status.setStatus(this.langData.status_error || 'ОШИБКА! Смотри почему...', 'red');
        const shapes = [];
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
            const opponentColor = playerColor === 'w' ? 'b' : 'w';
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
                    move = moves.find((m) => m.san.replace(/[+#x]/g, '') === cleanRef);
                    // Fallback: match by destination
                    if (!move) {
                        const destMatch = refutationSan.match(/([a-h][1-8])/);
                        if (destMatch) {
                            const targetSq = destMatch[0];
                            const pieceChar = refutationSan.match(/^[KQRBN]/) ? refutationSan[0] : 'p';
                            const pieceTypeMap = {
                                'K': 'k', 'Q': 'q', 'R': 'r', 'B': 'b', 'N': 'n', 'p': 'p'
                            };
                            const targetPiece = pieceTypeMap[pieceChar] || 'p';
                            const candidates = moves.filter((m) => m.to === targetSq && m.piece === targetPiece);
                            if (candidates.length > 0) {
                                move = candidates[0];
                            }
                        }
                    }
                }
                if (move) {
                    shapes.push({ orig: move.from, dest: move.to, brush: BRUSHES.REFUTATION });
                }
                else {
                    this.status.setStatus((this.langData.status_refutation_error || 'Ошибка: Не могу показать ход') + ' ' + refutationSan, 'red');
                }
            }
            catch (e) {
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
            this.board.undoVisual(this.game.fen(), { showDests: !this.config.hideLegalMoves });
            this.status.setStatus(this.langData.status_try_another || 'Ищи другой ход', '#333');
            this.isDelayActive = false;
            const isCountdown = this.config.timeLimit > 0;
            this.status.resumeTimer(isCountdown, () => this._handleTimeout());
        }, DELAYS.BAD_MOVE_REFUTATION);
    }
    /**
     * Updates all game UI elements
     * @private
     */
    _updateGameUI() {
        this.ui.updateProgress(this.currentPuzzleIndex + 1, this.puzzles.length);
        // Task indicator (sequential mode)
        if (this.config.sequentialMode && this.currentStageIndex < STAGES.length) {
            this.ui.updateTaskIndicator(true, STAGES[this.currentStageIndex].name);
        }
        else {
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
    _updateCounter(id, list) {
        const badMovesList = this._getCurrentBadMoves();
        const uniqueMoves = new Map();
        list.forEach(m => uniqueMoves.set(getMoveKey(m.from, m.to), m));
        let total = 0;
        let found = 0;
        uniqueMoves.forEach((moveObj, key) => {
            if (!this._isValidMove(moveObj, badMovesList)) {
                return;
            }
            total++;
            if (this.foundMoves.has(key))
                found++;
        });
        this.ui.updateCounter(id, found, total);
    }
    /**
     * Checks if all targets found
     * @private
     */
    _checkIfAllFound() {
        const allTargets = [
            ...this.targets.w.checks,
            ...this.targets.w.captures,
            ...this.targets.b.checks,
            ...this.targets.b.captures
        ];
        const badMovesList = this._getCurrentBadMoves();
        const requiredMoves = new Set();
        allTargets.forEach(m => {
            if (this._isValidMove(m, badMovesList)) {
                requiredMoves.add(getMoveKey(m.from, m.to));
            }
        });
        for (const req of requiredMoves) {
            if (!this.foundMoves.has(req))
                return false;
        }
        return true;
    }
    /**
     * Checks stage completion (sequential mode)
     * @private
     */
    _checkStageCompletion() {
        const badMovesList = this._getCurrentBadMoves();
        while (this.currentStageIndex < STAGES.length) {
            const stage = STAGES[this.currentStageIndex];
            const rawList = (stage.type === 'checks')
                ? this.targets[stage.color].checks
                : this.targets[stage.color].captures;
            let required = 0;
            let found = 0;
            rawList.forEach(m => {
                if (!this._isValidMove(m, badMovesList))
                    return;
                required++;
                if (this.foundMoves.has(getMoveKey(m.from, m.to)))
                    found++;
            });
            if (found >= required) {
                this.currentStageIndex++;
            }
            else {
                break;
            }
        }
        this._updateGameUI();
        if (this.currentStageIndex >= STAGES.length) {
            this.status.setStatus(this.langData.status_solved || 'Готово!', 'green');
            this.stats.solvedCount++;
            this._setTimeout(() => this.nextPuzzle(), DELAYS.PUZZLE_TRANSITION);
        }
    }
    /**
     * Handles timeout
     * @private
     */
    _handleTimeout() {
        this.status.pauseTimer(); // Stop counting time immediately
        if (this.config.timeMode === 'total') {
            this.ui.showTimeoutModal();
        }
        else {
            this.status.setStatus(this.langData.status_timeout || 'Время вышло!', 'red');
            this._setTimeout(() => this.nextPuzzle(), DELAYS.TIMEOUT_DISPLAY);
        }
    }
    // ==========================================
    // TIMER MANAGEMENT (with automatic cleanup)
    // ==========================================
    /**
     * setTimeout with automatic tracking
     * @private
     */
    _setTimeout(fn, delay) {
        const id = setTimeout(() => {
            this.timers.delete(id);
            fn();
        }, delay);
        this.timers.add(id);
        return id;
    }
}
//# sourceMappingURL=GameSession.js.map