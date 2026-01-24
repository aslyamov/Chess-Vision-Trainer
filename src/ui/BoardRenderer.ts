/**
 * Manages Chessground board rendering and interaction
 * TypeScript версия
 */

import { logError } from '../utils/error-handler.js';
import { getAllDests } from '../utils/chess-utils.js';
import type { ChessgroundConfig, ChessgroundAPI } from '../types/index.js';

interface BoardConfig {
    onMove?: (orig: string, dest: string) => void;
}

interface Shape {
    orig: string;
    dest?: string;
    brush?: string;
}

export class BoardRenderer {
    private boardElement: HTMLElement;
    private Chessground: any; // Глобальный объект
    private ground: ChessgroundAPI | null;
    private persistentShapes: Shape[];

    constructor(boardElement: HTMLElement, ChessgroundLib: any) {
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
    initialize(config: BoardConfig = {}): ChessgroundAPI {
        if (!this.boardElement) {
            throw new Error('Board element not found');
        }

        if (!this.Chessground) {
            logError(
                'LIBRARY_LOAD' as any,
                'Chessground not loaded',
                new Error('Chessground is undefined')
            );
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
                        after: config.onMove || (() => {})
                    }
                }
            });

            console.log('✅ Board initialized');
            return this.ground!;
        } catch (error) {
            logError(
                'UI_RENDER' as any,
                'Failed to initialize board',
                error as Error,
                { boardElement: !!this.boardElement, ChessgroundAvailable: !!this.Chessground }
            );
            throw error;
        }
    }

    /**
     * Sets board position and configuration
     * @param fen - Position in FEN notation
     * @param options - Additional options
     */
    setPosition(fen: string, options: Partial<ChessgroundConfig> = {}): void {
        if (!this.ground) return;

        const config: any = {
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
    setOrientation(orientation: 'white' | 'black'): void {
        if (!this.ground) return;
        this.ground.setOrientation(orientation);
    }

    /**
     * Toggles board orientation
     */
    flipBoard(): void {
        if (!this.ground) return;
        // Accessing state via any cast since internal state key might differ or be protected
        const currentOrientation = (this.ground as any).state?.orientation || 'white';
        const newOrientation = currentOrientation === 'white' ? 'black' : 'white';
        this.setOrientation(newOrientation);
    }

    /**
     * Adds persistent shape (highlight/arrow)
     * @param shape - Shape object { orig, dest, brush }
     */
    addPersistentShape(shape: Shape): void {
        this.persistentShapes.push(shape);
        this.updateShapes();
    }

    /**
     * Clears all persistent shapes
     */
    clearPersistentShapes(): void {
        this.persistentShapes = [];
        this.updateShapes();
    }

    /**
     * Updates shapes on board
     * @param temporaryShapes - Temporary shapes to show
     */
    updateShapes(temporaryShapes: Shape[] = []): void {
        if (!this.ground) return;

        const allShapes = [...this.persistentShapes, ...temporaryShapes];
        this.ground.set({
            drawable: { shapes: allShapes, visible: true }
        } as any);
    }

    /**
     * Resets board to current game state (visual undo)
     * @param fen - Current position FEN
     * @param options - Additional options
     */
    undoVisual(fen: string, options: { showDests?: boolean } = {}): void {
        if (!this.ground) return;

        this.ground.set({
            fen,
            drawable: { shapes: this.persistentShapes },
            movable: {
                color: 'both',
                dests: getAllDests(fen),
                showDests: options.showDests !== false
            }
        } as any);
    }

    /**
     * Gets current board orientation
     * @returns Current orientation
     */
    getOrientation(): 'white' | 'black' {
        return (this.ground as any)?.state.orientation || 'white';
    }

    /**
     * Destroys board instance
     */
    destroy(): void {
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        this.persistentShapes = [];
    }
}
