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
    timeMode?: 'total' | 'per_puzzle';
    sequentialMode: boolean;
    autoFlip: boolean;
    highlightFound: boolean;
    showLog: boolean;
    showHints: boolean;
    showText: boolean;
    goodMovesOnly: boolean;
    showCoordinates: boolean;
    hideLegalMoves: boolean;
}
/**
 * Статистика игровой сессии
 */
export interface GameStats {
    solvedCount: number;
    totalTasks: number;
    totalTime: number;
    checksFound: number;
    capturesFound: number;
    badMovesMade: number;
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
    coordinates?: boolean;
    movable?: {
        free?: boolean;
        color?: 'white' | 'black' | 'both';
        events?: {
            after?: (orig: string, dest: string) => void;
        };
    };
    drawable?: {
        enabled?: boolean;
        visible?: boolean;
    };
    highlight?: {
        lastMove?: boolean;
        check?: boolean;
    };
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
    resNewPuzzles: HTMLElement | null;
    startGameBtn: HTMLButtonElement | null;
    restartBtn: HTMLButtonElement | null;
    flipBoardBtn: HTMLButtonElement | null;
    giveUpBtn: HTMLButtonElement | null;
    backToMenuBtn: HTMLButtonElement | null;
    timeoutModal: HTMLElement | null;
    wChecks: HTMLElement | null;
    wCaptures: HTMLElement | null;
    bChecks: HTMLElement | null;
    bCaptures: HTMLElement | null;
    moveLog: HTMLElement | null;
}
/**
 * Категории ошибок
 */
export type ErrorCategory = 'INITIALIZATION' | 'PUZZLE_LOAD' | 'GAME_LOGIC' | 'UI_UPDATE' | 'UNKNOWN';
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
/**
 * Nullable тип
 */
export type Nullable<T> = T | null;
/**
 * Optional тип
 */
export type Optional<T> = T | undefined;
//# sourceMappingURL=index.d.ts.map