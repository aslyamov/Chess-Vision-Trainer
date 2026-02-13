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
    /** Time to show timeout before next puzzle (per_puzzle mode) */
    TIMEOUT_DISPLAY: number;
    /** Delay for shape update (workaround) */
    SHAPE_UPDATE: number;
};
/** Time conversion constants */
export declare const TIME: {
    MS_PER_SECOND: number;
};
/** Arrow brush colors for Chessground */
export declare const BRUSHES: {
    /** Found moves (system arrows) */
    FOUND_MOVE: string;
    /** Bad move refutation */
    REFUTATION: string;
};
/** localStorage keys */
export declare const SETTINGS_KEY = "chess_vision_settings";
export declare const THEME_KEY = "chess_theme";
//# sourceMappingURL=constants.d.ts.map