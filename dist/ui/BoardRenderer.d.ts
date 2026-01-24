/**
 * Manages Chessground board rendering and interaction
 * TypeScript версия
 */
import type { ChessgroundConfig, ChessgroundAPI } from '../types/index.js';
interface BoardConfig {
    onMove?: (orig: string, dest: string) => void;
}
interface Shape {
    orig: string;
    dest?: string;
    brush?: string;
}
export declare class BoardRenderer {
    private boardElement;
    private Chessground;
    private ground;
    private persistentShapes;
    constructor(boardElement: HTMLElement, ChessgroundLib: any);
    /**
     * Initializes Chessground board
     * @param config - Board configuration
     * @returns Chessground instance
     */
    initialize(config?: BoardConfig): ChessgroundAPI;
    /**
     * Sets board position and configuration
     * @param fen - Position in FEN notation
     * @param options - Additional options
     */
    setPosition(fen: string, options?: Partial<ChessgroundConfig>): void;
    /**
     * Sets board orientation
     * @param orientation - Board orientation
     */
    setOrientation(orientation: 'white' | 'black'): void;
    /**
     * Toggles board orientation
     */
    flipBoard(): void;
    /**
     * Adds persistent shape (highlight/arrow)
     * @param shape - Shape object { orig, dest, brush }
     */
    addPersistentShape(shape: Shape): void;
    /**
     * Clears all persistent shapes
     */
    clearPersistentShapes(): void;
    /**
     * Updates shapes on board
     * @param temporaryShapes - Temporary shapes to show
     */
    updateShapes(temporaryShapes?: Shape[]): void;
    /**
     * Resets board to current game state (visual undo)
     * @param fen - Current position FEN
     * @param options - Additional options
     */
    undoVisual(fen: string, options?: {
        showDests?: boolean;
    }): void;
    /**
     * Gets current board orientation
     * @returns Current orientation
     */
    getOrientation(): 'white' | 'black';
    /**
     * Destroys board instance
     */
    destroy(): void;
}
export {};
//# sourceMappingURL=BoardRenderer.d.ts.map