/**
 * Глобальные типы для внешних библиотек
 */

// ==========================================
// Chess.js Types
// ==========================================

/**
 * Глобальный класс Chess из chess.js библиотеки
 */
declare class Chess {
    constructor(fen?: string);
    load(fen: string): void;
    fen(): string;
    turn(): 'w' | 'b';
    moves(options?: { square?: string; verbose?: boolean }): any[];
    move(move: string | object): any;
    undo(): any;
    get(square: string): any;
    inCheck(): boolean;
    isCheckmate(): boolean;
    isStalemate(): boolean;
    isGameOver(): boolean;
    isInsufficientMaterial(): boolean;
    isDraw(): boolean;
}

// ==========================================
// Chessground Types
// ==========================================

/**
 * Глобальная функция Chessground
 */
declare function Chessground(element: HTMLElement, config: any): any;
