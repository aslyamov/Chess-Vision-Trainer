/**
 * Application constants
 * Centralized configuration values to avoid magic numbers
 */
/** Delay values in milliseconds */
export declare const DELAYS: {
    /** Time to show move highlight before visual undo */
    MOVE_HIGHLIGHT: number;
    /** Time to show bad move refutation */
    BAD_MOVE_REFUTATION: number;
    /** Pause before loading next puzzle */
    PUZZLE_TRANSITION: number;
    /** Delay for board redraw after initialization */
    BOARD_REDRAW: number;
    /** Time to show timeout before next puzzle (per_puzzle mode) */
    TIMEOUT_DISPLAY: number;
    /** Delay for shape update (workaround) */
    SHAPE_UPDATE: number;
};
/** Time conversion constants */
export declare const TIME: {
    MS_PER_SECOND: number;
    SECONDS_PER_MINUTE: number;
    MINUTES_PER_HOUR: number;
};
/** Arrow brush colors for Chessground */
export declare const BRUSHES: {
    /** Found moves (system arrows) */
    FOUND_MOVE: string;
    /** Bad move refutation */
    REFUTATION: string;
    /** User-drawn arrows (default in Chessground) */
    USER_DEFAULT: string;
};
//# sourceMappingURL=constants.d.ts.map