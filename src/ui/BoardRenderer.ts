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
                'LIBRARY_LOAD',
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
            
            // Force redraw after a microtask to handle layout shifts
            setTimeout(() => {
                (this.ground as any).redrawAll?.();
            }, 50);

            return this.ground!;
        } catch (error) {
            logError(
                'UI_RENDER',
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
            const movableColor = config.movable?.color || 'both';
            config.movable = {
                ...config.movable,
                color: movableColor,
                free: false,
                dests: getAllDests(fen)
            };
        }

        // Chessground requires turnColor to match movable.color for single-color mode
        if (config.movable?.color && config.movable.color !== 'both') {
            config.turnColor = config.movable.color;
        }

        this.ground.set(config);
    }

    /**
     * Sets board orientation
     * @param orientation - Board orientation
     */
    setOrientation(orientation: 'white' | 'black'): void {
        if (!this.ground) return;
        this.ground.set({ orientation });
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
     * Clears user-drawn shapes (right-click arrows)
     */
    clearUserShapes(): void {
        if (!this.ground) return;
        // shapes = user drawings, autoShapes = system arrows
        this.ground.set({
            drawable: { shapes: [] }
        } as any);
    }

    /**
     * Updates shapes on board
     * @param temporaryShapes - Temporary shapes to show
     */
    updateShapes(temporaryShapes: Shape[] = []): void {
        if (!this.ground) return;

        const allShapes = [...this.persistentShapes, ...temporaryShapes];
        // Use autoShapes for system arrows (not shapes - those are for user drawing)
        this.ground.set({
            drawable: { autoShapes: allShapes, visible: true }
        } as any);
    }

    /**
     * Resets board to current game state (visual undo)
     * @param fen - Current position FEN
     * @param options - Additional options
     */
    undoVisual(fen: string, options: { showDests?: boolean; movableColor?: 'white' | 'black' | 'both' } = {}): void {
        if (!this.ground) return;

        const movableColor = options.movableColor || 'both';

        this.ground.set({
            fen,
            // Chessground requires turnColor to match movable.color for single-color mode
            ...(movableColor !== 'both' ? { turnColor: movableColor } : {}),
            drawable: {
                shapes: [],  // Clear user-drawn shapes
                autoShapes: this.persistentShapes  // Keep system shapes
            },
            movable: {
                color: movableColor,
                dests: getAllDests(fen),
                showDests: options.showDests !== false
            }
        } as any);
    }

    /**
     * Forces a redraw (e.g. after window resize)
     */
    redraw(): void {
        (this.ground as any)?.redrawAll?.();
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
