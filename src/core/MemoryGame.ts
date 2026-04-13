/**
 * MemoryGame — тренажёр «Запоминание позиции».
 *
 * Состояния:
 *   SHOWING  → позиция видна, идёт обратный отсчёт (или ∞)
 *   QUESTION → доска скрыта, ждём ответа игрока
 *   FEEDBACK → подсветка правильного/неправильного (800 мс)
 *   RESULT   → сессия завершена, вызывается onFinish
 */

import { MEMORY_SETTINGS_KEY } from '../constants.js';
import { shuffleArray } from '../utils/chess-utils.js';
import type { MemoryConfig, MemoryResult, Puzzle } from '../types/index.js';

// ─── типы вопроса ──────────────────────────────────────────────────────────────

type QuestionType = 'find-piece' | 'name-piece' | 'place-pieces';

/** Один сгенерированный вопрос для позиции */
interface MemoryQuestion {
    type:          QuestionType;
    /** «Где фигура?»: цвет + тип фигуры, например 'wQ' */
    pieceKey?:     string;
    /** Все правильные клетки (для find-piece — их может быть несколько) */
    correctSquares: string[];
    /** «Что на клетке?»: целевая клетка */
    targetSquare?: string;
    /** Текст вопроса для UI */
    questionText:  string;
}

/** Результат ответа */
export type AnswerOutcome = 'correct' | 'incorrect' | 'timeout';

/** DOM-зависимости — всё, что MemoryGame читает/пишет */
interface MemoryDom {
    boardEl:        HTMLElement;
    questionEl:     HTMLElement;
    /** Единый таймер: показывает countdown фазы SHOWING и countdown фазы QUESTION */
    timerEl:        HTMLElement;
    readyBtn:       HTMLButtonElement;
    piecePalette:   HTMLElement;
    placePalette:   HTMLElement;
    placeActions:   HTMLElement;
    feedbackEl:     HTMLElement;
    correctStat:    HTMLElement;
    incorrectStat:  HTMLElement;
    roundStat:      HTMLElement;
}

// ─── маппинг фигур ─────────────────────────────────────────────────────────────

/** Маппинг pieceKey → Chessground CSS-классы */
const CG_COLOR: Record<string, string> = { w: 'white', b: 'black' };
const CG_TYPE:  Record<string, string> = {
    K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn',
};


const PIECE_NAMES_RU: Record<string, string> = {
    wK: 'белый король',   wQ: 'белый ферзь',   wR: 'белая ладья',
    wB: 'белый слон',     wN: 'белый конь',     wP: 'белая пешка',
    bK: 'чёрный король',  bQ: 'чёрный ферзь',  bR: 'чёрная ладья',
    bB: 'чёрный слон',    bN: 'чёрный конь',   bP: 'чёрная пешка',
};

// ─── MemoryGame ────────────────────────────────────────────────────────────────

export class MemoryGame {
    private Chessground: any;
    private ground:      any = null;
    private config:      MemoryConfig;
    private puzzles:     Puzzle[];
    private dom:         MemoryDom;
    private onFinish:    (result: MemoryResult) => void;

    private state:               'idle' | 'showing' | 'question' | 'feedback' = 'idle';
    private boardClickHandler:   ((e: PointerEvent) => void) | null = null;

    // ─── drag-and-drop из палитры ─────────────────────────────────────────────
    private dragGhost:     HTMLElement | null = null;
    private dragKey:       string | null = null;
    private dragMove:      ((e: PointerEvent) => void) | null = null;
    private dragEnd:       ((e: PointerEvent) => void) | null = null;
    private ctxMenuHandler:((e: MouseEvent) => void) | null = null;
    private currentIndex:    number = 0;
    private currentQuestion: MemoryQuestion | null = null;

    private correct:    number = 0;
    private incorrect:  number = 0;
    private timeouts:   number = 0;
    private streak:     number = 0;
    private bestStreak: number = 0;

    private showTimer:   ReturnType<typeof setTimeout> | null = null;
    private answerTimer: ReturnType<typeof setTimeout> | null = null;
    private countdownInterval: ReturnType<typeof setInterval> | null = null;

    constructor(
        ChessgroundLib: any,
        puzzles: Puzzle[],
        config: MemoryConfig,
        onFinish: (result: MemoryResult) => void,
    ) {
        this.Chessground = ChessgroundLib;
        this.puzzles     = shuffleArray(puzzles);
        this.config      = config;
        this.onFinish    = onFinish;
        this.dom         = this._cacheDom();
    }

    start(): void {
        this.state       = 'idle';
        this.currentIndex = 0;
        this.correct = this.incorrect = this.timeouts = this.streak = this.bestStreak = 0;
        this._updateStats();
        this._loadRound(0);
    }

    /** Игрок нажал «Запомнил →» — переходим к вопросу досрочно */
    ready(): void {
        if (this.state !== 'showing') return;
        this._clearShowTimer();
        this._showQuestion();
    }

    /** Ответ кликом по клетке (тип find-piece) */
    answerSquare(square: string): void {
        if (this.state !== 'question' || !this.currentQuestion) return;
        if (this.currentQuestion.type !== 'find-piece') return;
        const correct = this.currentQuestion.correctSquares.includes(square);
        this._resolveAnswer(correct ? 'correct' : 'incorrect');
    }

    /** Ответ кнопкой из палитры (тип name-piece, pieceKey = 'wQ' / 'empty') */
    answerPiece(pieceKey: string): void {
        if (this.state !== 'question' || !this.currentQuestion) return;
        if (this.currentQuestion.type !== 'name-piece') return;
        const correct = this.currentQuestion.correctSquares[0] === pieceKey;
        this._resolveAnswer(correct ? 'correct' : 'incorrect');
    }

    destroy(): void {
        this._clearShowTimer();
        this._clearAnswerTimer();
        this._clearCountdown();
        this._detachBoardClick();
        this._cleanupDrag();
        this._detachPlacementListeners();
        // Сбрасываем весь видимый UI-стейт
        this.dom.timerEl.textContent = '—';
        this.dom.timerEl.classList.remove('text-error');
        this.dom.readyBtn.classList.add('hidden');
        this._setQuestion('', 'showing');
        this.dom.piecePalette.classList.add('hidden');
        this.dom.placePalette.classList.add('hidden');
        this.dom.placeActions.classList.add('hidden');
        this.dom.feedbackEl.textContent = '';
        if (this.ground) { this.ground.destroy(); this.ground = null; }
        this.dom.boardEl.innerHTML = '';
    }

    // ─── private ───────────────────────────────────────────────────────────────

    private _loadRound(index: number): void {
        if (this.config.roundCount > 0 && index >= this.config.roundCount) {
            this._finish(); return;
        }
        if (index >= this.puzzles.length) {
            this._finish(); return;
        }

        this.currentIndex = index;
        this._updateStats();
        this._showPosition(this.puzzles[index].fen);
    }

    private _showPosition(fen: string): void {
        this.state = 'showing';

        const orientation = this.config.orientation === 'random'
            ? (Math.random() < 0.5 ? 'white' : 'black')
            : this.config.orientation;

        // Инициализируем/обновляем доску
        if (this.ground) {
            this.ground.set({ fen, orientation, viewOnly: true });
        } else {
            this.ground = this.Chessground(this.dom.boardEl, {
                fen,
                orientation,
                viewOnly: true,
                coordinates: true,
                highlight:  { lastMove: false, check: false },
                animation:  { enabled: false },
                movable:    { free: false },
                drawable:   { enabled: false },
            });
        }

        // Показываем доску, сбрасываем палитры
        this.dom.boardEl.classList.remove('memory-hidden');
        this._setQuestion('Запомни позицию', 'showing');
        this.dom.piecePalette.classList.add('hidden');
        this.dom.placePalette.classList.add('hidden');
        this.dom.placeActions.classList.add('hidden');
        this.dom.feedbackEl.textContent = '';
        this.dom.readyBtn.classList.remove('hidden');

        // Таймер фазы SHOWING
        if (this.config.showSeconds > 0) {
            this._startCountdown(this.config.showSeconds);
            this.showTimer = setTimeout(() => this._showQuestion(), this.config.showSeconds * 1000);
        } else {
            this._clearCountdown();
            this.dom.timerEl.textContent = '∞';
            this.dom.timerEl.classList.remove('text-error');
        }
    }

    private _showQuestion(): void {
        this.state = 'question';
        this._clearCountdown();

        this.dom.readyBtn.classList.add('hidden');

        const puzzle = this.puzzles[this.currentIndex];
        const qType  = this.config.questionType;

        if (qType === 'place-pieces') {
            this._showPlacement(puzzle.fen);
            return;
        }

        // Генерируем вопрос
        const question = this._generateQuestion(puzzle.fen, qType);
        if (!question) { this._nextRound(); return; }
        this.currentQuestion = question;

        // Отображаем вопрос
        this._setQuestion(question.questionText, 'asking');

        if (qType === 'find-piece') {
            this.ground?.set({ fen: '8/8/8/8/8/8/8/8', viewOnly: true });
            this.dom.boardEl.classList.remove('memory-hidden');
            this.dom.boardEl.classList.add('memory-clickable');
            this._attachBoardClick(sq => this.answerSquare(sq));
        } else {
            // name-piece: пустая доска с подсветкой клетки
            this.ground?.set({
                fen:      '8/8/8/8/8/8/8/8',
                viewOnly: true,
                drawable: {
                    enabled:    true,
                    autoShapes: [{ orig: question.targetSquare!, brush: 'yellow' }],
                },
            });
            this.dom.boardEl.classList.remove('memory-hidden');
            this._renderPalette();
            this.dom.piecePalette.classList.remove('hidden');
        }

        // Таймер на ответ
        if (this.config.answerSeconds > 0) {
            this._startAnswerCountdown(this.config.answerSeconds);
            this.answerTimer = setTimeout(() => this._resolveAnswer('timeout'), this.config.answerSeconds * 1000);
        } else {
            this.dom.timerEl.textContent = '∞';
            this.dom.timerEl.classList.remove('text-error');
        }
    }

    private _attachBoardClick(callback: (sq: string) => void): void {
        this._detachBoardClick();
        const cgBoard = this.dom.boardEl.querySelector('cg-board') as HTMLElement | null;
        if (!cgBoard) return;
        this.boardClickHandler = (e: PointerEvent) => {
            const sq = this._getSquareAt(e.clientX, e.clientY);
            if (sq) callback(sq);
        };
        cgBoard.addEventListener('pointerdown', this.boardClickHandler);
    }

    private _detachBoardClick(): void {
        if (!this.boardClickHandler) return;
        const cgBoard = this.dom.boardEl.querySelector('cg-board') as HTMLElement | null;
        cgBoard?.removeEventListener('pointerdown', this.boardClickHandler);
        this.boardClickHandler = null;
    }

    private _resolveAnswer(outcome: AnswerOutcome): void {
        if (this.state !== 'question') return;
        this.state = 'feedback';
        this._clearAnswerTimer();
        this._detachBoardClick();

        if (outcome === 'correct') {
            this.correct++;
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
            this._showFeedback(true);
        } else if (outcome === 'timeout') {
            this.timeouts++;
            this.streak = 0;
            this._showFeedback(false, true);
        } else {
            this.incorrect++;
            this.streak = 0;
            this._showFeedback(false);
        }

        this._updateStats();

        // Подсвечиваем правильный ответ на доске
        if (this.currentQuestion?.type === 'find-piece') {
            const shapes = this.currentQuestion.correctSquares.map(sq => ({
                orig: sq, brush: outcome === 'correct' ? 'green' : 'red',
            }));
            this.ground?.set({ drawable: { enabled: true, shapes } });
            this.dom.boardEl.classList.remove('memory-clickable');
            this.ground?.set({ viewOnly: true });
        }

        setTimeout(() => {
            this.ground?.set({ drawable: { shapes: [], autoShapes: [] } });
            this._nextRound();
        }, 800);
    }

    private _nextRound(): void {
        this.currentQuestion = null;
        this.dom.piecePalette.classList.add('hidden');
        this.dom.placePalette.classList.add('hidden');
        this.dom.placeActions.classList.add('hidden');
        this.dom.boardEl.classList.remove('memory-hidden', 'memory-clickable');
        this._loadRound(this.currentIndex + 1);
    }

    private _finish(): void {
        this.destroy();
        this.onFinish({
            correct:    this.correct,
            incorrect:  this.incorrect,
            timeouts:   this.timeouts,
            bestStreak: this.bestStreak,
        });
    }

    // ─── вопросы ───────────────────────────────────────────────────────────────

    private _generateQuestion(fen: string, type: QuestionType): MemoryQuestion | null {
        const pieces = this._parsePieces(fen);
        if (pieces.length === 0) return null;

        if (type === 'find-piece') {
            // Группируем по pieceKey, выбираем случайный тип фигуры
            const byKey = new Map<string, string[]>();
            for (const { key, square } of pieces) {
                if (!byKey.has(key)) byKey.set(key, []);
                byKey.get(key)!.push(square);
            }
            const keys = [...byKey.keys()];
            const chosenKey = keys[Math.floor(Math.random() * keys.length)];
            const correctSquares = byKey.get(chosenKey)!;
            return {
                type: 'find-piece',
                pieceKey: chosenKey,
                correctSquares,
                questionText: `Где стоит ${PIECE_NAMES_RU[chosenKey] ?? chosenKey}?`,
            };
        } else {
            // Выбираем случайную занятую клетку
            const { key, square } = pieces[Math.floor(Math.random() * pieces.length)];
            return {
                type: 'name-piece',
                targetSquare: square,
                correctSquares: [key],   // правильный ответ — pieceKey
                questionText: `Что стоит на ${square.toUpperCase()}?`,
            };
        }
    }

    /** Разбирает FEN и возвращает список { key: 'wQ', square: 'e1' } */
    private _parsePieces(fen: string): { key: string; square: string }[] {
        const placement = fen.split(' ')[0];
        const result: { key: string; square: string }[] = [];
        let file = 0, rank = 7;

        for (const ch of placement) {
            if (ch === '/') { rank--; file = 0; continue; }
            const n = parseInt(ch);
            if (!isNaN(n)) { file += n; continue; }
            if (file >= 8 || rank < 0) continue;
            const color = ch === ch.toUpperCase() ? 'w' : 'b';
            const type  = ch.toUpperCase();
            const square = String.fromCharCode(97 + file) + (rank + 1);
            result.push({ key: color + type, square });
            file++;
        }
        return result;
    }

    // ─── place-pieces ─────────────────────────────────────────────────────────

    private _showPlacement(_fen: string): void {
        // Пустая доска, фигуры на ней можно перетаскивать свободно
        this.ground?.set({
            fen:      '8/8/8/8/8/8/8/8',
            viewOnly: false,
            movable:  { free: true, color: 'both' },
            drawable: { enabled: false },
            events:   { move: () => {} }, // перетаскивание уже расставленных фигур
        });
        this.dom.boardEl.classList.remove('memory-hidden');

        this._attachPlacementListeners();
        this._renderPlacementPalette();
        this.dom.placePalette.classList.remove('hidden');
        this.dom.placeActions.classList.remove('hidden');
        this._setQuestion('Расставьте позицию по памяти', 'asking');

        if (this.config.answerSeconds > 0) {
            this._startAnswerCountdown(this.config.answerSeconds);
            this.answerTimer = setTimeout(() => this._checkAndResolve(true), this.config.answerSeconds * 1000);
        } else {
            this.dom.timerEl.textContent = '∞';
            this.dom.timerEl.classList.remove('text-error');
        }
    }

    /** Правый клик по доске — убрать фигуру с клетки */
    private _attachPlacementListeners(): void {
        this._detachPlacementListeners();
        const cgBoard = this.dom.boardEl.querySelector('cg-board') as HTMLElement | null;
        if (!cgBoard) return;
        this.ctxMenuHandler = (e: MouseEvent) => {
            e.preventDefault();
            const sq = this._getSquareAt(e.clientX, e.clientY);
            if (sq) this.ground?.setPieces(new Map([[sq, undefined]]));
        };
        cgBoard.addEventListener('contextmenu', this.ctxMenuHandler);
    }

    private _detachPlacementListeners(): void {
        if (!this.ctxMenuHandler) return;
        const cgBoard = this.dom.boardEl.querySelector('cg-board') as HTMLElement | null;
        cgBoard?.removeEventListener('contextmenu', this.ctxMenuHandler);
        this.ctxMenuHandler = null;
    }

    /** Очистить доску (кнопка 🗑) */
    clearBoard(): void {
        if (this.state !== 'question') return;
        this.ground?.set({ fen: '8/8/8/8/8/8/8/8' });
    }

    /** Вызывается кнопкой «Проверить» */
    checkPlacement(): void {
        if (this.state !== 'question') return;
        this._checkAndResolve(false);
    }

    private _checkAndResolve(timeout: boolean): void {
        if (this.state !== 'question') return;
        this.state = 'feedback';
        this._clearAnswerTimer();
        this._detachPlacementListeners();
        this._cleanupDrag();
        this.dom.placeActions.classList.add('hidden');
        this.dom.placePalette.classList.add('hidden');

        const puzzle = this.puzzles[this.currentIndex];
        const { correct, total } = this._scorePlacement(puzzle.fen);
        const isCorrect = !timeout && correct === total;

        if (isCorrect) {
            this.correct++;
            this.streak++;
            if (this.streak > this.bestStreak) this.bestStreak = this.streak;
        } else {
            if (timeout) this.timeouts++; else this.incorrect++;
            this.streak = 0;
        }
        this._updateStats();

        const label = timeout ? `⏱ Время вышло — ${correct}/${total} фигур верно`
            : isCorrect      ? `✓ Все ${total} фигур на месте!`
                             : `✗ ${correct}/${total} фигур верно`;
        this.dom.feedbackEl.textContent = label;
        this.dom.feedbackEl.className = `memory-feedback text-center font-bold text-base ${isCorrect ? 'text-success' : 'text-error'}`;

        // Восстанавливаем оригинальную позицию
        this.ground?.set({ fen: puzzle.fen, viewOnly: true, drawable: { enabled: false } });
        setTimeout(() => { this._nextRound(); }, 2000);
    }

    private _scorePlacement(originalFen: string): { correct: number; total: number } {
        const origPieces  = this._parsePieces(originalFen);
        const boardPieces = this.ground?.state?.pieces as Map<string, { role: string; color: string }> | undefined;
        if (!boardPieces) return { correct: 0, total: origPieces.length };

        let correct = 0;
        for (const { key, square } of origPieces) {
            const placed = boardPieces.get(square);
            if (placed && placed.role === CG_TYPE[key[1]] && placed.color === CG_COLOR[key[0]]) correct++;
        }
        return { correct, total: origPieces.length };
    }

    // ─── drag-and-drop из палитры ──────────────────────────────────────────────

    private _renderPlacementPalette(): void {
        this.dom.placePalette.innerHTML = '';

        const order     = ['K','Q','R','B','N','P'];
        const whiteKeys = order.map(t => 'w' + t);
        const blackKeys = order.map(t => 'b' + t);

        const makeBtn = (key: string) => {
            const btn = document.createElement('button');
            btn.className = 'memory-piece-btn';
            btn.title = PIECE_NAMES_RU[key] ?? key;

            const wrap = document.createElement('div');
            wrap.className = 'cg-wrap';
            wrap.style.cssText = 'position:relative;width:2.2rem;height:2.2rem;display:block;flex-shrink:0;';
            const pieceEl = document.createElement('piece');
            pieceEl.className = `${CG_TYPE[key[1]]} ${CG_COLOR[key[0]]}`;
            wrap.appendChild(pieceEl);
            btn.appendChild(wrap);

            // Начало перетаскивания
            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                this._startPaletteDrag(key, e);
            });
            return btn;
        };

        const makeRow = (keys: string[]) => {
            const row = document.createElement('div');
            row.className = 'memory-palette-row';
            keys.forEach(k => row.appendChild(makeBtn(k)));
            return row;
        };

        this.dom.placePalette.appendChild(makeRow(whiteKeys));
        this.dom.placePalette.appendChild(makeRow(blackKeys));
    }

    private _startPaletteDrag(key: string, startEvent: PointerEvent): void {
        if (this.state !== 'question') return;
        this._cleanupDrag();

        this.dragKey   = key;
        this.dragGhost = this._createDragGhost(key);
        document.body.appendChild(this.dragGhost);
        this._moveDragGhost(startEvent.clientX, startEvent.clientY);

        this.dragMove = (e: PointerEvent) => {
            e.preventDefault();
            this._moveDragGhost(e.clientX, e.clientY);
            const sq = this._getSquareAt(e.clientX, e.clientY);
            this._highlightDropTarget(sq);
        };
        this.dragEnd = (e: PointerEvent) => {
            const sq = this._getSquareAt(e.clientX, e.clientY);
            if (sq && this.dragKey) {
                const k = this.dragKey;
                this.ground?.setPieces(new Map([[sq, { role: CG_TYPE[k[1]], color: CG_COLOR[k[0]] }]]));
            }
            this._cleanupDrag();
        };

        document.addEventListener('pointermove', this.dragMove,  { passive: false });
        document.addEventListener('pointerup',   this.dragEnd);
    }

    private _createDragGhost(key: string): HTMLElement {
        // Размер = ширина клетки доски
        const boardSize = this.dom.boardEl.getBoundingClientRect().width;
        const sz = Math.round(boardSize / 8);

        const ghost = document.createElement('div');
        ghost.style.cssText = [
            'position:fixed',
            'pointer-events:none',
            'z-index:9999',
            `width:${sz}px`,
            `height:${sz}px`,
            'transform:translate(-50%,-50%)',
            'opacity:0.9',
        ].join(';');

        const wrap = document.createElement('div');
        wrap.className = 'cg-wrap';
        wrap.style.cssText = `position:relative;width:${sz}px;height:${sz}px;display:block;`;
        const pieceEl = document.createElement('piece');
        pieceEl.className = `${CG_TYPE[key[1]]} ${CG_COLOR[key[0]]}`;
        // Убираем position:absolute от Chessground
        pieceEl.style.cssText = `position:relative;width:100%;height:100%;background-size:cover;`;
        wrap.appendChild(pieceEl);
        ghost.appendChild(wrap);
        return ghost;
    }

    private _moveDragGhost(x: number, y: number): void {
        if (!this.dragGhost) return;
        this.dragGhost.style.left = `${x}px`;
        this.dragGhost.style.top  = `${y}px`;
    }

    private _highlightDropTarget(sq: string | null): void {
        if (!this.ground) return;
        if (sq) {
            this.ground.set({ drawable: { enabled: true, autoShapes: [{ orig: sq, brush: 'green' }] } });
        } else {
            this.ground.set({ drawable: { enabled: true, autoShapes: [] } });
        }
    }

    private _cleanupDrag(): void {
        this.dragGhost?.remove();
        this.dragGhost = null;
        this.dragKey   = null;
        if (this.dragMove) { document.removeEventListener('pointermove', this.dragMove); this.dragMove = null; }
        if (this.dragEnd)  { document.removeEventListener('pointerup',   this.dragEnd);  this.dragEnd  = null; }
        // Убираем подсветку
        this.ground?.set({ drawable: { autoShapes: [] } });
    }

    /** Вычисляет клетку по координатам экрана (используется в find-piece и drag) */
    private _getSquareAt(clientX: number, clientY: number): string | null {
        const cgBoard = this.dom.boardEl.querySelector('cg-board') as HTMLElement | null;
        if (!cgBoard) return null;
        const rect = cgBoard.getBoundingClientRect();
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return null;
        const xRatio = (clientX - rect.left) / rect.width;
        const yRatio = (clientY - rect.top)  / rect.height;
        // orientation-black может быть на cg-wrap или cg-container — ищем в любом месте
        const isBlack = this.dom.boardEl.querySelector('.orientation-black') !== null;
        const file = isBlack ? 7 - Math.floor(xRatio * 8) : Math.floor(xRatio * 8);
        const rank = isBlack ? Math.floor(yRatio * 8)      : 7 - Math.floor(yRatio * 8);
        return String.fromCharCode(97 + file) + (rank + 1);
    }

    // ─── палитра для name-piece ────────────────────────────────────────────────

    private _renderPalette(): void {
        this.dom.piecePalette.innerHTML = '';

        // Всегда показываем все 6 типов — не подсказываем что есть в позиции
        const order     = ['K','Q','R','B','N','P'];
        const whiteKeys = order.map(t => 'w' + t);
        const blackKeys = order.map(t => 'b' + t);

        const makeBtn = (key: string) => {
            const btn = document.createElement('button');
            btn.className = 'memory-piece-btn';
            btn.title = key === 'empty' ? 'Пусто' : (PIECE_NAMES_RU[key] ?? key);
            btn.addEventListener('click', () => this.answerPiece(key));
            if (key === 'empty') {
                btn.textContent = '□';
            } else {
                const wrap = document.createElement('div');
                wrap.className = 'cg-wrap';
                wrap.style.cssText = 'position:relative;width:2.2rem;height:2.2rem;display:block;flex-shrink:0;';
                const pieceEl = document.createElement('piece');
                pieceEl.className = `${CG_TYPE[key[1]]} ${CG_COLOR[key[0]]}`;
                wrap.appendChild(pieceEl);
                btn.appendChild(wrap);
            }
            return btn;
        };

        const makeRow = (keys: string[]) => {
            const row = document.createElement('div');
            row.className = 'memory-palette-row';
            keys.forEach(k => row.appendChild(makeBtn(k)));
            return row;
        };

        this.dom.piecePalette.appendChild(makeRow(whiteKeys));
        this.dom.piecePalette.appendChild(makeRow(blackKeys));
    }

    // ─── таймеры и countdown ───────────────────────────────────────────────────

    private _startCountdown(seconds: number): void {
        this._clearCountdown();
        let left = seconds;
        this.dom.timerEl.textContent = String(left);
        this.dom.timerEl.classList.remove('text-error');
        this.countdownInterval = setInterval(() => {
            left--;
            this.dom.timerEl.textContent = String(Math.max(0, left));
            if (left <= 0) this._clearCountdown();
        }, 1000);
    }

    private _startAnswerCountdown(seconds: number): void {
        this._clearCountdown();
        let left = seconds;
        this.dom.timerEl.textContent = String(left);
        this.dom.timerEl.classList.toggle('text-error', left <= 3);
        this.countdownInterval = setInterval(() => {
            left--;
            this.dom.timerEl.textContent = String(Math.max(0, left));
            this.dom.timerEl.classList.toggle('text-error', left <= 3);
            if (left <= 0) this._clearCountdown();
        }, 1000);
    }

    private _clearShowTimer(): void {
        if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
    }

    private _clearAnswerTimer(): void {
        if (this.answerTimer) { clearTimeout(this.answerTimer); this.answerTimer = null; }
    }

    private _clearCountdown(): void {
        if (this.countdownInterval) { clearInterval(this.countdownInterval); this.countdownInterval = null; }
    }

    // ─── UI helpers ────────────────────────────────────────────────────────────

    /** Обновляет блок вопроса с нужным цветовым стилем */
    private _setQuestion(text: string, style: 'showing' | 'asking'): void {
        this.dom.questionEl.textContent = text;
        const base = 'flex-1 rounded-xl p-3 text-center font-bold border flex items-center justify-center h-14';
        this.dom.questionEl.className = style === 'showing'
            ? `${base} bg-success/10 text-success border-base-content/10`
            : `${base} bg-base-200 text-base-content border-base-content/10`;
    }

    private _showFeedback(correct: boolean, timeout = false): void {
        const el = this.dom.feedbackEl;
        if (timeout) {
            el.textContent = '⏱ Время вышло!';
            el.className = 'memory-feedback text-warning';
        } else if (correct) {
            el.textContent = '✓ Верно!';
            el.className = 'memory-feedback text-success';
        } else {
            const q = this.currentQuestion;
            if (!q) {
                el.textContent = '✗ Неверно';
                el.className = 'memory-feedback text-error';
                return;
            }
            const hint = q.type === 'find-piece'
                ? q.correctSquares.join(', ').toUpperCase()
                : (PIECE_NAMES_RU[q.correctSquares[0]] ?? q.correctSquares[0]);
            el.textContent = `✗ Неверно — ${hint}`;
            el.className = 'memory-feedback text-error';
        }
    }

    private _updateStats(): void {
        this.dom.correctStat.textContent   = String(this.correct);
        this.dom.incorrectStat.textContent = String(this.incorrect + this.timeouts);
        this.dom.roundStat.textContent = this.config.roundCount > 0
            ? String(Math.max(0, this.config.roundCount - this.currentIndex))
            : '∞';
    }

    private _cacheDom(): MemoryDom {
        const get = (id: string) => document.getElementById(id)!;
        return {
            boardEl:       get('memoryBoard'),
            questionEl:    get('memoryQuestion'),
            timerEl:       get('memoryTimer'),
            readyBtn:      get('memoryReadyBtn') as HTMLButtonElement,
            piecePalette:  get('memoryPalette'),
            placePalette:  get('memoryPlacePalette'),
            placeActions:  get('memoryPlaceActions'),
            feedbackEl:    get('memoryFeedback'),
            correctStat:   get('memoryCorrect'),
            incorrectStat: get('memoryIncorrect'),
            roundStat:     get('memoryRound'),
        };
    }

    // ─── config persistence ────────────────────────────────────────────────────

    static loadConfig(): MemoryConfig {
        const defaults: MemoryConfig = {
            minPieces:     4,
            maxPieces:     20,
            showSeconds:   5,
            answerSeconds: 10,
            roundCount:    10,
            questionType:  'place-pieces',
            orientation:   'white',
        };
        try {
            const saved = localStorage.getItem(MEMORY_SETTINGS_KEY);
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        } catch { return defaults; }
    }

    static saveConfig(config: MemoryConfig): void {
        try { localStorage.setItem(MEMORY_SETTINGS_KEY, JSON.stringify(config)); }
        catch (e) { console.warn('MemoryGame: config save failed', e); }
    }
}
