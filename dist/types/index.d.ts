/**
 * Типы и интерфейсы для Chess Vision Trainer
 */
export interface Puzzle {
    id: number;
    fen: string;
    difficulty: 'easy' | 'medium' | 'hard';
    bad_moves?: Array<string | BadMove>;
}
export interface BadMove {
    san: string;
    refutation: string;
}
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
export interface MoveData {
    from: string;
    to: string;
    san: string;
    flags: string;
    piece?: string;
    color?: string;
}
export interface TargetMoves {
    checks: MoveData[];
    captures: MoveData[];
    checksMap: Map<string, MoveData>;
    capturesMap: Map<string, MoveData>;
}
export interface TargetColors {
    w: TargetMoves;
    b: TargetMoves;
}
/** Статистика за сессию «Шахов и взятий», передаваемая в showResults() */
export interface CCSessionStats {
    solved: number;
    total: number;
    time: number;
    accuracy: number;
    avgTime: number;
    newPuzzles: number;
    moveStats: {
        wChecks: {
            found: number;
            total: number;
        };
        wCaptures: {
            found: number;
            total: number;
        };
        bChecks: {
            found: number;
            total: number;
        };
        bCaptures: {
            found: number;
            total: number;
        };
    };
}
/** Общий прогресс по задачникам, передаваемый в showResults() */
export interface CCOverallStats {
    totalSolved: number;
    totalPuzzles: number;
    easy: {
        solved: number;
        total: number;
    };
    medium: {
        solved: number;
        total: number;
    };
    hard: {
        solved: number;
        total: number;
    };
}
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
export interface DrawShape {
    orig: string;
    dest?: string;
    brush: string;
}
export interface ChessgroundAPI {
    set(config: Partial<ChessgroundConfig>): void;
    getFen(): string;
    setOrientation(color: 'white' | 'black'): void;
    move(from: string, to: string): void;
    destroy(): void;
}
/**
 * Глобальный кэш DOM — только экраны для view-routing.
 * CC-специфичные элементы живут в CCGameUI.
 */
export interface CachedDOM {
    homeScreen: HTMLElement | null;
    startScreen: HTMLElement | null;
    gameScreen: HTMLElement | null;
    resultScreen: HTMLElement | null;
}
/**
 * DOM-элементы, нужные StatusManager.
 * Живут в CCGameUI, передаются в StatusManager при инициализации.
 */
export interface CCStatusDom {
    statusMessage: HTMLElement | null;
    logWhite: HTMLElement | null;
    logBlack: HTMLElement | null;
    gameTimer: HTMLElement | null;
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
/** Результат одной сессии «Цвета поля» */
export interface FCResult {
    correct: number;
    incorrect: number;
    bestStreak: number;
}
export interface MemoryConfig {
    minPieces: number;
    maxPieces: number;
    /** Секунд показа позиции. 0 = ∞ (только кнопка «Запомнил») */
    showSeconds: number;
    /** Секунд на ответ. 0 = ∞ */
    answerSeconds: number;
    /** Количество задач. 0 = ∞ */
    roundCount: number;
    questionType: 'find-piece' | 'name-piece' | 'place-pieces';
    orientation: 'white' | 'black' | 'random';
}
export interface MemoryResult {
    correct: number;
    incorrect: number;
    timeouts: number;
    bestStreak: number;
}
export interface MemoryAllTimeStats {
    totalSessions: number;
    totalCorrect: number;
    totalIncorrect: number;
    bestAccuracy: number;
    bestStreak: number;
}
export interface MaterialConfig {
    /** Количество позиций. 0 = бесконечно */
    roundCount: number;
    orientation: 'white' | 'black' | 'random';
}
export interface MaterialResult {
    correct: number;
    incorrect: number;
    bestStreak: number;
}
export interface MaterialAllTimeStats {
    totalSessions: number;
    totalCorrect: number;
    totalIncorrect: number;
    bestStreak: number;
}
export type ErrorCategory = 'INITIALIZATION' | 'LIBRARY_LOAD' | 'DATA_LOAD' | 'VALIDATION' | 'GAME_LOGIC' | 'UI_RENDER';
export interface ErrorLog {
    category: ErrorCategory;
    message: string;
    timestamp: number;
    context?: Record<string, any>;
}
export interface LocaleData {
    [key: string]: string;
}
export type SupportedLocale = 'ru' | 'en';
//# sourceMappingURL=index.d.ts.map