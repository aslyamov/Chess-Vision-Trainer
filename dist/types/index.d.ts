/**
 * Типы и интерфейсы для Chess Vision Trainer
 * Все типы приложения в одном месте
 */
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
/**
 * Конфигурация игровой сессии
 */
export interface SessionConfig {
    difficulty: string;
    taskCount: number;
    timeLimit: number;
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
/**
 * Кэшированные DOM элементы
 */
export interface CachedDOM {
    homeScreen: HTMLElement | null;
    startScreen: HTMLElement | null;
    gameScreen: HTMLElement | null;
    resultScreen: HTMLElement | null;
    board: HTMLElement | null;
    progressDisplay: HTMLElement | null;
    taskIndicator: HTMLElement | null;
    currentTaskName: HTMLElement | null;
    statusMessage: HTMLElement | null;
    gameTimer: HTMLElement | null;
    statsContainer: HTMLElement | null;
    logContainer: HTMLElement | null;
    logWhite: HTMLElement | null;
    logBlack: HTMLElement | null;
    resTotalSolved: HTMLElement | null;
    resTotalTime: HTMLElement | null;
    resAccuracy: HTMLElement | null;
    resAvgTime: HTMLElement | null;
    startGameBtn: HTMLButtonElement | null;
    restartBtn: HTMLButtonElement | null;
    flipBoardBtn: HTMLButtonElement | null;
    giveUpBtn: HTMLButtonElement | null;
    wChecks: HTMLElement | null;
    wCaptures: HTMLElement | null;
    bChecks: HTMLElement | null;
    bCaptures: HTMLElement | null;
}
export interface FieldColorConfig {
    boardStyle: 'colored' | 'monochrome' | 'none';
    showCoordinates: boolean;
    orientation: 'white' | 'black' | 'random';
    /** Seconds. 0 = infinite */
    timeMode: number;
    /** Rounds count. 0 = infinite */
    roundCount: number;
}
export interface FieldColorAllTimeStats {
    totalSessions: number;
    totalCorrect: number;
    totalIncorrect: number;
    allTimeBestStreak: number;
}
/**
 * Категории ошибок
 */
export type ErrorCategory = 'INITIALIZATION' | 'LIBRARY_LOAD' | 'DATA_LOAD' | 'VALIDATION' | 'GAME_LOGIC' | 'UI_RENDER';
/**
 * Лог ошибки
 */
export interface ErrorLog {
    category: ErrorCategory;
    message: string;
    timestamp: number;
    context?: Record<string, any>;
}
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
//# sourceMappingURL=index.d.ts.map