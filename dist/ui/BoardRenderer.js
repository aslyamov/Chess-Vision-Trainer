/**
 * Manages Chessground board rendering and interaction
 * TypeScript версия
 */
import { logError } from '../utils/error-handler.js';
import { getAllDests } from '../utils/chess-utils.js';
export class BoardRenderer {
    constructor(boardElement, ChessgroundLib) {
        this.boardElement = boardElement;
        this.Chessground = ChessgroundLib;
        this.ground = null;
        this.persistentShapes = [];
    }
    /**
     * Initializes Chessground board
     * @param config - Board configuration
     * @returns Chessground instance
     */
    initialize(config = {}) {
        if (!this.boardElement) {
            throw new Error('Board element not found');
        }
        if (!this.Chessground) {
            logError('LIBRARY_LOAD', 'Chessground not loaded', new Error('Chessground is undefined'));
            throw new Error('Chessground library not available');
        }
        // Clear any existing board
        if (this.ground) {
            this.ground.destroy();
        }
        this.boardElement.innerHTML = '';
        this.persistentShapes = [];
        try {
            this.ground = this.Chessground(this.boardElement, {
                fen: 'start',
                coordinates: true,
                movable: {
                    color: 'both',
                    free: false,
                    events: {
                        after: config.onMove || (() => { })
                    }
                }
            });
            console.log('✅ Board initialized');
            return this.ground;
        }
        catch (error) {
            logError('UI_RENDER', 'Failed to initialize board', error, { boardElement: !!this.boardElement, ChessgroundAvailable: !!this.Chessground });
            throw error;
        }
    }
    /**
     * Sets board position and configuration
     * @param fen - Position in FEN notation
     * @param options - Additional options
     */
    setPosition(fen, options = {}) {
        if (!this.ground)
            return;
        const config = {
            fen,
            ...options
        };
        // Add movable dests if not provided
        if (!config.movable?.dests) {
            config.movable = {
                ...config.movable,
                color: 'both',
                free: false,
                dests: getAllDests(fen)
            };
        }
        this.ground.set(config);
    }
    /**
     * Sets board orientation
     * @param orientation - Board orientation
     */
    setOrientation(orientation) {
        if (!this.ground)
            return;
        this.ground.set({ orientation });
    }
    /**
     * Toggles board orientation
     */
    flipBoard() {
        if (!this.ground)
            return;
        // Accessing state via any cast since internal state key might differ or be protected
        const currentOrientation = this.ground.state?.orientation || 'white';
        const newOrientation = currentOrientation === 'white' ? 'black' : 'white';
        this.setOrientation(newOrientation);
    }
    /**
     * Adds persistent shape (highlight/arrow)
     * @param shape - Shape object { orig, dest, brush }
     */
    addPersistentShape(shape) {
        this.persistentShapes.push(shape);
        this.updateShapes();
    }
    /**
     * Clears all persistent shapes
     */
    clearPersistentShapes() {
        this.persistentShapes = [];
        this.updateShapes();
    }
    /**
     * Updates shapes on board
     * @param temporaryShapes - Temporary shapes to show
     */
    updateShapes(temporaryShapes = []) {
        if (!this.ground)
            return;
        const allShapes = [...this.persistentShapes, ...temporaryShapes];
        this.ground.set({
            drawable: { shapes: allShapes, visible: true }
        });
    }
    /**
     * Resets board to current game state (visual undo)
     * @param fen - Current position FEN
     * @param options - Additional options
     */
    undoVisual(fen, options = {}) {
        if (!this.ground)
            return;
        this.ground.set({
            fen,
            drawable: { shapes: this.persistentShapes },
            movable: {
                color: 'both',
                dests: getAllDests(fen),
                showDests: options.showDests !== false
            }
        });
    }
    /**
     * Gets current board orientation
     * @returns Current orientation
     */
    getOrientation() {
        return this.ground?.state.orientation || 'white';
    }
    /**
     * Destroys board instance
     */
    destroy() {
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        this.persistentShapes = [];
    }
}
//# sourceMappingURL=BoardRenderer.js.map