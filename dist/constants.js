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
    /** Time to show timeout before next puzzle (per_puzzle mode) */
    TIMEOUT_DISPLAY: 1000,
    /** Delay for shape update (workaround) */
    SHAPE_UPDATE: 50
};
/** Time conversion constants */
export const TIME = {
    MS_PER_SECOND: 1000
};
/** Arrow brush colors for Chessground */
export const BRUSHES = {
    /** Found moves (system arrows) */
    FOUND_MOVE: 'blue',
    /** Bad move refutation */
    REFUTATION: 'red'
};
/** localStorage keys */
export const SETTINGS_KEY = 'chess_vision_settings';
export const THEME_KEY = 'chess_theme';
export const PUZZLE_PROGRESS_KEY = 'chess_solved_puzzles';
export const SESSIONS_KEY = 'chess_sessions';
export const ALL_TIME_STATS_KEY = 'chess_all_time_stats';
export const ERROR_LOG_KEY = 'chess_error_log';
export const FIELD_COLOR_SETTINGS_KEY = 'chess_field_color_settings';
export const FIELD_COLOR_STATS_KEY = 'chess_field_color_stats';
export const COMMON_STATS_KEY = 'chess_common_stats';
//# sourceMappingURL=constants.js.map