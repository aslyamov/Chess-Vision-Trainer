/**
 * MemoryGame — тренажёр «Запоминание позиции».
 *
 * Состояния:
 *   SHOWING  → позиция видна, идёт обратный отсчёт (или ∞)
 *   QUESTION → доска скрыта, ждём ответа игрока
 *   FEEDBACK → подсветка правильного/неправильного (800 мс)
 *   RESULT   → сессия завершена, вызывается onFinish
 */
import type { MemoryConfig, MemoryResult, Puzzle } from '../types/index.js';
/** Результат ответа */
export type AnswerOutcome = 'correct' | 'incorrect' | 'timeout';
export declare class MemoryGame {
    private Chessground;
    private ground;
    private config;
    private puzzles;
    private dom;
    private onFinish;
    private state;
    private boardClickHandler;
    private dragGhost;
    private dragKey;
    private dragMove;
    private dragEnd;
    private ctxMenuHandler;
    private currentIndex;
    private currentQuestion;
    private correct;
    private incorrect;
    private timeouts;
    private streak;
    private bestStreak;
    private showTimer;
    private answerTimer;
    private countdownInterval;
    constructor(ChessgroundLib: any, puzzles: Puzzle[], config: MemoryConfig, onFinish: (result: MemoryResult) => void);
    start(): void;
    /** Игрок нажал «Запомнил →» — переходим к вопросу досрочно */
    ready(): void;
    /** Ответ кликом по клетке (тип find-piece) */
    answerSquare(square: string): void;
    /** Ответ кнопкой из палитры (тип name-piece, pieceKey = 'wQ' / 'empty') */
    answerPiece(pieceKey: string): void;
    destroy(): void;
    private _loadRound;
    private _showPosition;
    private _showQuestion;
    private _attachBoardClick;
    private _detachBoardClick;
    private _resolveAnswer;
    private _nextRound;
    private _finish;
    private _generateQuestion;
    /** Разбирает FEN и возвращает список { key: 'wQ', square: 'e1' } */
    private _parsePieces;
    private _showPlacement;
    /** Правый клик по доске — убрать фигуру с клетки */
    private _attachPlacementListeners;
    private _detachPlacementListeners;
    /** Очистить доску (кнопка 🗑) */
    clearBoard(): void;
    /** Вызывается кнопкой «Проверить» */
    checkPlacement(): void;
    private _checkAndResolve;
    private _scorePlacement;
    private _renderPlacementPalette;
    private _startPaletteDrag;
    private _createDragGhost;
    private _moveDragGhost;
    private _highlightDropTarget;
    private _cleanupDrag;
    /** Вычисляет клетку по координатам экрана (используется в find-piece и drag) */
    private _getSquareAt;
    private _renderPalette;
    private _startCountdown;
    private _startAnswerCountdown;
    private _clearShowTimer;
    private _clearAnswerTimer;
    private _clearCountdown;
    /** Обновляет блок вопроса с нужным цветовым стилем */
    private _setQuestion;
    private _showFeedback;
    private _updateStats;
    private _cacheDom;
    static loadConfig(): MemoryConfig;
    static saveConfig(config: MemoryConfig): void;
}
//# sourceMappingURL=MemoryGame.d.ts.map