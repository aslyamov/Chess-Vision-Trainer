/**
 * Типы и интерфейсы для Chess Vision Trainer
 * Все типы приложения в одном месте
 */

// ==========================================
// Puzzle Types
// ==========================================

/**
 * Шахматная позиция-задача
 */
export interface Puzzle {
    id: number;
    fen: string;
    difficulty: 'easy' | 'medium' | 'hard';
    bad_moves?: Array<string | BadMove>;
}

/**
 * Плохой ход с опровержением
 */
export interface BadMove {
    san: string;
    refutation: string;
}

// ==========================================
// Game Session Types
// ==========================================

/**
 * Конфигурация игровой сессии
 */
export interface SessionConfig {
    difficulty: string;
    taskCount: number;
    timeLimit: number;
    timeMode?: 'total' | 'per_puzzle';
    sequentialMode: boolean;
    highlightFound: boolean;
    showLog: boolean;
    showHints: boolean;
    showText: boolean;
    goodMovesOnly: boolean;
    showCoordinates: boolean;
    hideLegalMoves: boolean;
}

/**
 * Данные о ходе
 */
export interface MoveData {
    from: string;
    to: string;
    san: string;
    flags: string;
    piece?: string;
    color?: string;
}

/**
 * Целевые ходы (шахи и взятия)
 */
export interface TargetMoves {
    checks: MoveData[];
    captures: MoveData[];
    checksMap: Map<string, MoveData>;
    capturesMap: Map<string, MoveData>;
}

/**
 * Целевые ходы для обоих цветов
 */
export interface TargetColors {
    w: TargetMoves;
    b: TargetMoves;
}

// ==========================================
// Chessground Types
// ==========================================

/**
 * Конфигурация Chessground доски
 */
export interface ChessgroundConfig {
    fen?: string;
    orientation?: 'white' | 'black';
    turnColor?: 'white' | 'black';
    coordinates?: boolean;
    movable?: {
        free?: boolean;
        color?: 'white' | 'black' | 'both';
        showDests?: boolean;
        dests?: Map<string, string[]>;
        events?: {
            after?: (orig: string, dest: string) => void;
        };
    };
    drawable?: {
        enabled?: boolean;
        visible?: boolean;
        shapes?: DrawShape[];
        autoShapes?: DrawShape[];
    };
    highlight?: {
        lastMove?: boolean;
        check?: boolean;
    };
}

/**
 * Фигура для рисования на доске (стрелка/подсветка)
 */
export interface DrawShape {
    orig: string;
    dest: string;
    brush: string;
}

/**
 * API Chessground доски
 */
export interface ChessgroundAPI {
    set(config: Partial<ChessgroundConfig>): void;
    getFen(): string;
    setOrientation(color: 'white' | 'black'): void;
    move(from: string, to: string): void;
    destroy(): void;
}

// ==========================================
// DOM Types
// ==========================================

/**
 * Кэшированные DOM элементы
 */
export interface CachedDOM {
    // Screens
    startScreen: HTMLElement | null;
    gameScreen: HTMLElement | null;
    resultScreen: HTMLElement | null;

    // Game elements
    board: HTMLElement | null;
    progressDisplay: HTMLElement | null;
    taskIndicator: HTMLElement | null;
    currentTaskName: HTMLElement | null;
    statusMessage: HTMLElement | null;
    gameTimer: HTMLElement | null;

    // Stats and logs
    statsContainer: HTMLElement | null;
    logContainer: HTMLElement | null;
    logWhite: HTMLElement | null;
    logBlack: HTMLElement | null;

    // Result screen
    resTotalSolved: HTMLElement | null;
    resTotalTime: HTMLElement | null;
    resAccuracy: HTMLElement | null;
    resAvgTime: HTMLElement | null;

    // Buttons
    startGameBtn: HTMLButtonElement | null;
    restartBtn: HTMLButtonElement | null;
    flipBoardBtn: HTMLButtonElement | null;
    giveUpBtn: HTMLButtonElement | null;

    // Timeout modal
    timeoutModal: HTMLElement | null;

    // Counters
    wChecks: HTMLElement | null;
    wCaptures: HTMLElement | null;
    bChecks: HTMLElement | null;
    bCaptures: HTMLElement | null;
}

// ==========================================
// Error Types
// ==========================================

/**
 * Категории ошибок
 */
export type ErrorCategory =
    | 'INITIALIZATION'
    | 'LIBRARY_LOAD'
    | 'DATA_LOAD'
    | 'VALIDATION'
    | 'GAME_LOGIC'
    | 'UI_RENDER';

/**
 * Лог ошибки
 */
export interface ErrorLog {
    category: ErrorCategory;
    message: string;
    timestamp: number;
    context?: Record<string, any>;
}

// ==========================================
// Localization Types
// ==========================================

/**
 * Словарь переводов
 */
export interface LocaleData {
    [key: string]: string;
}

/**
 * Поддерживаемые языки
 */
export type SupportedLocale = 'ru' | 'en';

