/**
 * Application constants
 * Centralized configuration values to avoid magic numbers
 */

/** Delay values in milliseconds */
export const DELAYS = {
    /** Time to show move highlight before visual undo */
    MOVE_HIGHLIGHT: 300,

    /** Time to show bad move refutation */
    BAD_MOVE_REFUTATION: 2000,

    /** Pause before loading next puzzle */
    PUZZLE_TRANSITION: 800,

    /** Delay for board redraw after initialization */
    BOARD_REDRAW: 50,

    /** Time to show timeout before next puzzle (per_puzzle mode) */
    TIMEOUT_DISPLAY: 1000,

    /** Delay for shape update (workaround) */
    SHAPE_UPDATE: 50
};

/** Time conversion constants */
export const TIME = {
    MS_PER_SECOND: 1000,
    SECONDS_PER_MINUTE: 60,
    MINUTES_PER_HOUR: 60
};

/** Arrow brush colors for Chessground */
export const BRUSHES = {
    /** Found moves (system arrows) */
    FOUND_MOVE: 'blue',

    /** Bad move refutation */
    REFUTATION: 'red',

    /** User-drawn arrows (default in Chessground) */
    USER_DEFAULT: 'green'
};
