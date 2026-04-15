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
/** Status message colors (used in GameSession.setStatus calls) */
export declare const STATUS_COLORS: {
    readonly SUCCESS: "green";
    readonly ERROR: "red";
    readonly WARNING: "orange";
    readonly ALREADY: "blue";
    readonly INFO: "#0050b3";
    readonly NEUTRAL: "#555";
    readonly DANGER: "#d97706";
};
/** localStorage keys */
export declare const SETTINGS_KEY = "chess_vision_settings";
export declare const THEME_KEY = "chess_theme";
export declare const PUZZLE_PROGRESS_KEY = "chess_solved_puzzles";
export declare const SESSIONS_KEY = "chess_sessions";
export declare const ALL_TIME_STATS_KEY = "chess_all_time_stats";
export declare const ERROR_LOG_KEY = "chess_error_log";
export declare const FIELD_COLOR_SETTINGS_KEY = "chess_field_color_settings";
export declare const FIELD_COLOR_STATS_KEY = "chess_field_color_stats";
export declare const MEMORY_SETTINGS_KEY = "chess_memory_settings";
export declare const MEMORY_STATS_KEY = "chess_memory_stats";
export declare const COMMON_STATS_KEY = "chess_common_stats";
export declare const MATERIAL_SETTINGS_KEY = "chess_material_settings";
export declare const MATERIAL_STATS_KEY = "chess_material_stats";
//# sourceMappingURL=constants.d.ts.map