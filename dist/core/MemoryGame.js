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
// ─── маппинг фигур ─────────────────────────────────────────────────────────────
/** Маппинг pieceKey → Chessground CSS-классы */
const CG_COLOR = { w: 'white', b: 'black' };
const CG_TYPE = {
    K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn',
};
const PIECE_NAMES_RU = {
    wK: 'белый король', wQ: 'белый ферзь', wR: 'белая ладья',
    wB: 'белый слон', wN: 'белый конь', wP: 'белая пешка',
    bK: 'чёрный король', bQ: 'чёрный ферзь', bR: 'чёрная ладья',
    bB: 'чёрный слон', bN: 'чёрный конь', bP: 'чёрная пешка',
};
// ─── MemoryGame ────────────────────────────────────────────────────────────────
export class MemoryGame {
    constructor(ChessgroundLib, puzzles, config, onFinish) {
        this.ground = null;
        this.state = 'idle';
        this.boardClickHandler = null;
        // ─── drag-and-drop из палитры ─────────────────────────────────────────────
        this.dragGhost = null;
        this.dragKey = null;
        this.dragMove = null;
        this.dragEnd = null;
        this.ctxMenuHandler = null;
        this.currentIndex = 0;
        this.currentQuestion = null;
        this.correct = 0;
        this.incorrect = 0;
        this.timeouts = 0;
        this.streak = 0;
        this.bestStreak = 0;
        this.showTimer = null;
        this.answerTimer = null;
        this.countdownInterval = null;
        this.Chessground = ChessgroundLib;
        this.puzzles = shuffleArray(puzzles);
        this.config = config;
        this.onFinish = onFinish;
        this.dom = this._cacheDom();
    }
    start() {
        this.state = 'idle';
        this.currentIndex = 0;
        this.correct = this.incorrect = this.timeouts = this.streak = this.bestStreak = 0;
        this._updateStats();
        this._loadRound(0);
    }
    /** Игрок нажал «Запомнил →» — переходим к вопросу досрочно */
    ready() {
        if (this.state !== 'showing')
            return;
        this._clearShowTimer();
        this._showQuestion();
    }
    /** Ответ кликом по клетке (тип find-piece) */
    answerSquare(square) {
        if (this.state !== 'question' || !this.currentQuestion)
            return;
        if (this.currentQuestion.type !== 'find-piece')
            return;
        const correct = this.currentQuestion.correctSquares.includes(square);
        this._resolveAnswer(correct ? 'correct' : 'incorrect');
    }
    /** Ответ кнопкой из палитры (тип name-piece, pieceKey = 'wQ' / 'empty') */
    answerPiece(pieceKey) {
        if (this.state !== 'question' || !this.currentQuestion)
            return;
        if (this.currentQuestion.type !== 'name-piece')
            return;
        const correct = this.currentQuestion.correctSquares[0] === pieceKey;
        this._resolveAnswer(correct ? 'correct' : 'incorrect');
    }
    destroy() {
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
        this.dom.questionEl.textContent = '';
        this.dom.piecePalette.classList.add('hidden');
        this.dom.placePalette.classList.add('hidden');
        this.dom.placeActions.classList.add('hidden');
        this.dom.feedbackEl.textContent = '';
        if (this.ground) {
            this.ground.destroy();
            this.ground = null;
        }
        this.dom.boardEl.innerHTML = '';
    }
    // ─── private ───────────────────────────────────────────────────────────────
    _loadRound(index) {
        if (this.config.roundCount > 0 && index >= this.config.roundCount) {
            this._finish();
            return;
        }
        if (index >= this.puzzles.length) {
            this._finish();
            return;
        }
        this.currentIndex = index;
        this._updateStats();
        this._showPosition(this.puzzles[index].fen);
    }
    _showPosition(fen) {
        this.state = 'showing';
        const orientation = this.config.orientation === 'random'
            ? (Math.random() < 0.5 ? 'white' : 'black')
            : this.config.orientation;
        // Инициализируем/обновляем доску
        if (this.ground) {
            this.ground.set({ fen, orientation, viewOnly: true });
        }
        else {
            this.ground = this.Chessground(this.dom.boardEl, {
                fen,
                orientation,
                viewOnly: true,
                coordinates: true,
                highlight: { lastMove: false, check: false },
                animation: { enabled: false },
                movable: { free: false },
                drawable: { enabled: false },
            });
        }
        // Показываем доску, сбрасываем палитры
        this.dom.boardEl.classList.remove('memory-hidden');
        this.dom.questionEl.textContent = 'Запомни позицию';
        this.dom.piecePalette.classList.add('hidden');
        this.dom.placePalette.classList.add('hidden');
        this.dom.placeActions.classList.add('hidden');
        this.dom.feedbackEl.textContent = '';
        this.dom.readyBtn.classList.remove('hidden');
        // Таймер фазы SHOWING
        if (this.config.showSeconds > 0) {
            this._startCountdown(this.config.showSeconds);
            this.showTimer = setTimeout(() => this._showQuestion(), this.config.showSeconds * 1000);
        }
        else {
            this._clearCountdown();
            this.dom.timerEl.textContent = '∞';
            this.dom.timerEl.classList.remove('text-error');
        }
    }
    _showQuestion() {
        this.state = 'question';
        this._clearCountdown();
        this.dom.readyBtn.classList.add('hidden');
        const puzzle = this.puzzles[this.currentIndex];
        const qType = this.config.questionType;
        if (qType === 'place-pieces') {
            this._showPlacement(puzzle.fen);
            return;
        }
        // Генерируем вопрос
        const question = this._generateQuestion(puzzle.fen, qType);
        if (!question) {
            this._nextRound();
            return;
        }
        this.currentQuestion = question;
        // Отображаем вопрос
        this.dom.questionEl.textContent = question.questionText;
        if (qType === 'find-piece') {
            this.ground?.set({ fen: '8/8/8/8/8/8/8/8', viewOnly: true });
            this.dom.boardEl.classList.remove('memory-hidden');
            this.dom.boardEl.classList.add('memory-clickable');
            this._attachBoardClick(sq => this.answerSquare(sq));
        }
        else {
            // name-piece: пустая доска с подсветкой клетки
            this.ground?.set({
                fen: '8/8/8/8/8/8/8/8',
                viewOnly: true,
                drawable: {
                    enabled: true,
                    autoShapes: [{ orig: question.targetSquare, brush: 'yellow' }],
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
        }
        else {
            this.dom.timerEl.textContent = '∞';
            this.dom.timerEl.classList.remove('text-error');
        }
    }
    _attachBoardClick(callback) {
        this._detachBoardClick();
        const cgBoard = this.dom.boardEl.querySelector('cg-board');
        if (!cgBoard)
            return;
        this.boardClickHandler = (e) => {
            const sq = this._getSquareAt(e.clientX, e.clientY);
            if (sq)
                callback(sq);
        };
        cgBoard.addEventListener('pointerdown', this.boardClickHandler);
    }
    _detachBoardClick() {
        if (!this.boardClickHandler)
            return;
        const cgBoard = this.dom.boardEl.querySelector('cg-board');
        cgBoard?.removeEventListener('pointerdown', this.boardClickHandler);
        this.boardClickHandler = null;
    }
    _resolveAnswer(outcome) {
        if (this.state !== 'question')
            return;
        this.state = 'feedback';
        this._clearAnswerTimer();
        this._detachBoardClick();
        if (outcome === 'correct') {
            this.correct++;
            this.streak++;
            if (this.streak > this.bestStreak)
                this.bestStreak = this.streak;
            this._showFeedback(true);
        }
        else if (outcome === 'timeout') {
            this.timeouts++;
            this.streak = 0;
            this._showFeedback(false, true);
        }
        else {
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
    _nextRound() {
        this.currentQuestion = null;
        this.dom.piecePalette.classList.add('hidden');
        this.dom.placePalette.classList.add('hidden');
        this.dom.placeActions.classList.add('hidden');
        this.dom.boardEl.classList.remove('memory-hidden', 'memory-clickable');
        this._loadRound(this.currentIndex + 1);
    }
    _finish() {
        this.destroy();
        this.onFinish({
            correct: this.correct,
            incorrect: this.incorrect,
            timeouts: this.timeouts,
            bestStreak: this.bestStreak,
        });
    }
    // ─── вопросы ───────────────────────────────────────────────────────────────
    _generateQuestion(fen, type) {
        const pieces = this._parsePieces(fen);
        if (pieces.length === 0)
            return null;
        if (type === 'find-piece') {
            // Группируем по pieceKey, выбираем случайный тип фигуры
            const byKey = new Map();
            for (const { key, square } of pieces) {
                if (!byKey.has(key))
                    byKey.set(key, []);
                byKey.get(key).push(square);
            }
            const keys = [...byKey.keys()];
            const chosenKey = keys[Math.floor(Math.random() * keys.length)];
            const correctSquares = byKey.get(chosenKey);
            return {
                type: 'find-piece',
                pieceKey: chosenKey,
                correctSquares,
                questionText: `Где стоит ${PIECE_NAMES_RU[chosenKey] ?? chosenKey}?`,
            };
        }
        else {
            // Выбираем случайную занятую клетку
            const { key, square } = pieces[Math.floor(Math.random() * pieces.length)];
            return {
                type: 'name-piece',
                targetSquare: square,
                correctSquares: [key], // правильный ответ — pieceKey
                questionText: `Что стоит на ${square.toUpperCase()}?`,
            };
        }
    }
    /** Разбирает FEN и возвращает список { key: 'wQ', square: 'e1' } */
    _parsePieces(fen) {
        const placement = fen.split(' ')[0];
        const result = [];
        let file = 0, rank = 7;
        for (const ch of placement) {
            if (ch === '/') {
                rank--;
                file = 0;
                continue;
            }
            const n = parseInt(ch);
            if (!isNaN(n)) {
                file += n;
                continue;
            }
            if (file >= 8 || rank < 0)
                continue;
            const color = ch === ch.toUpperCase() ? 'w' : 'b';
            const type = ch.toUpperCase();
            const square = String.fromCharCode(97 + file) + (rank + 1);
            result.push({ key: color + type, square });
            file++;
        }
        return result;
    }
    // ─── place-pieces ─────────────────────────────────────────────────────────
    _showPlacement(_fen) {
        // Пустая доска, фигуры на ней можно перетаскивать свободно
        this.ground?.set({
            fen: '8/8/8/8/8/8/8/8',
            viewOnly: false,
            movable: { free: true, color: 'both' },
            drawable: { enabled: false },
            events: { move: () => { } }, // перетаскивание уже расставленных фигур
        });
        this.dom.boardEl.classList.remove('memory-hidden');
        this._attachPlacementListeners();
        this._renderPlacementPalette();
        this.dom.placePalette.classList.remove('hidden');
        this.dom.placeActions.classList.remove('hidden');
        this.dom.questionEl.textContent = 'Расставьте позицию по памяти';
        if (this.config.answerSeconds > 0) {
            this._startAnswerCountdown(this.config.answerSeconds);
            this.answerTimer = setTimeout(() => this._checkAndResolve(true), this.config.answerSeconds * 1000);
        }
        else {
            this.dom.timerEl.textContent = '∞';
            this.dom.timerEl.classList.remove('text-error');
        }
    }
    /** Правый клик по доске — убрать фигуру с клетки */
    _attachPlacementListeners() {
        this._detachPlacementListeners();
        const cgBoard = this.dom.boardEl.querySelector('cg-board');
        if (!cgBoard)
            return;
        this.ctxMenuHandler = (e) => {
            e.preventDefault();
            const sq = this._getSquareAt(e.clientX, e.clientY);
            if (sq)
                this.ground?.setPieces(new Map([[sq, undefined]]));
        };
        cgBoard.addEventListener('contextmenu', this.ctxMenuHandler);
    }
    _detachPlacementListeners() {
        if (!this.ctxMenuHandler)
            return;
        const cgBoard = this.dom.boardEl.querySelector('cg-board');
        cgBoard?.removeEventListener('contextmenu', this.ctxMenuHandler);
        this.ctxMenuHandler = null;
    }
    /** Очистить доску (кнопка 🗑) */
    clearBoard() {
        if (this.state !== 'question')
            return;
        this.ground?.set({ fen: '8/8/8/8/8/8/8/8' });
    }
    /** Вызывается кнопкой «Проверить» */
    checkPlacement() {
        if (this.state !== 'question')
            return;
        this._checkAndResolve(false);
    }
    _checkAndResolve(timeout) {
        if (this.state !== 'question')
            return;
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
            if (this.streak > this.bestStreak)
                this.bestStreak = this.streak;
        }
        else {
            if (timeout)
                this.timeouts++;
            else
                this.incorrect++;
            this.streak = 0;
        }
        this._updateStats();
        const label = timeout ? `⏱ Время вышло — ${correct}/${total} фигур верно`
            : isCorrect ? `✓ Все ${total} фигур на месте!`
                : `✗ ${correct}/${total} фигур верно`;
        this.dom.feedbackEl.textContent = label;
        this.dom.feedbackEl.className = `memory-feedback text-center font-bold text-base ${isCorrect ? 'text-success' : 'text-error'}`;
        // Восстанавливаем оригинальную позицию
        this.ground?.set({ fen: puzzle.fen, viewOnly: true, drawable: { enabled: false } });
        setTimeout(() => { this._nextRound(); }, 2000);
    }
    _scorePlacement(originalFen) {
        const origPieces = this._parsePieces(originalFen);
        const boardPieces = this.ground?.state?.pieces;
        if (!boardPieces)
            return { correct: 0, total: origPieces.length };
        let correct = 0;
        for (const { key, square } of origPieces) {
            const placed = boardPieces.get(square);
            if (placed && placed.role === CG_TYPE[key[1]] && placed.color === CG_COLOR[key[0]])
                correct++;
        }
        return { correct, total: origPieces.length };
    }
    // ─── drag-and-drop из палитры ──────────────────────────────────────────────
    _renderPlacementPalette() {
        this.dom.placePalette.innerHTML = '';
        const order = ['K', 'Q', 'R', 'B', 'N', 'P'];
        const whiteKeys = order.map(t => 'w' + t);
        const blackKeys = order.map(t => 'b' + t);
        const makeBtn = (key) => {
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
        const makeRow = (keys) => {
            const row = document.createElement('div');
            row.className = 'memory-palette-row';
            keys.forEach(k => row.appendChild(makeBtn(k)));
            return row;
        };
        this.dom.placePalette.appendChild(makeRow(whiteKeys));
        this.dom.placePalette.appendChild(makeRow(blackKeys));
    }
    _startPaletteDrag(key, startEvent) {
        if (this.state !== 'question')
            return;
        this._cleanupDrag();
        this.dragKey = key;
        this.dragGhost = this._createDragGhost(key);
        document.body.appendChild(this.dragGhost);
        this._moveDragGhost(startEvent.clientX, startEvent.clientY);
        this.dragMove = (e) => {
            e.preventDefault();
            this._moveDragGhost(e.clientX, e.clientY);
            const sq = this._getSquareAt(e.clientX, e.clientY);
            this._highlightDropTarget(sq);
        };
        this.dragEnd = (e) => {
            const sq = this._getSquareAt(e.clientX, e.clientY);
            if (sq && this.dragKey) {
                const k = this.dragKey;
                this.ground?.setPieces(new Map([[sq, { role: CG_TYPE[k[1]], color: CG_COLOR[k[0]] }]]));
            }
            this._cleanupDrag();
        };
        document.addEventListener('pointermove', this.dragMove, { passive: false });
        document.addEventListener('pointerup', this.dragEnd);
    }
    _createDragGhost(key) {
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
    _moveDragGhost(x, y) {
        if (!this.dragGhost)
            return;
        this.dragGhost.style.left = `${x}px`;
        this.dragGhost.style.top = `${y}px`;
    }
    _highlightDropTarget(sq) {
        if (!this.ground)
            return;
        if (sq) {
            this.ground.set({ drawable: { enabled: true, autoShapes: [{ orig: sq, brush: 'green' }] } });
        }
        else {
            this.ground.set({ drawable: { enabled: true, autoShapes: [] } });
        }
    }
    _cleanupDrag() {
        this.dragGhost?.remove();
        this.dragGhost = null;
        this.dragKey = null;
        if (this.dragMove) {
            document.removeEventListener('pointermove', this.dragMove);
            this.dragMove = null;
        }
        if (this.dragEnd) {
            document.removeEventListener('pointerup', this.dragEnd);
            this.dragEnd = null;
        }
        // Убираем подсветку
        this.ground?.set({ drawable: { autoShapes: [] } });
    }
    /** Вычисляет клетку по координатам экрана (используется в find-piece и drag) */
    _getSquareAt(clientX, clientY) {
        const cgBoard = this.dom.boardEl.querySelector('cg-board');
        if (!cgBoard)
            return null;
        const rect = cgBoard.getBoundingClientRect();
        if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom)
            return null;
        const xRatio = (clientX - rect.left) / rect.width;
        const yRatio = (clientY - rect.top) / rect.height;
        // orientation-black может быть на cg-wrap или cg-container — ищем в любом месте
        const isBlack = this.dom.boardEl.querySelector('.orientation-black') !== null;
        const file = isBlack ? 7 - Math.floor(xRatio * 8) : Math.floor(xRatio * 8);
        const rank = isBlack ? Math.floor(yRatio * 8) : 7 - Math.floor(yRatio * 8);
        return String.fromCharCode(97 + file) + (rank + 1);
    }
    // ─── палитра для name-piece ────────────────────────────────────────────────
    _renderPalette() {
        this.dom.piecePalette.innerHTML = '';
        // Всегда показываем все 6 типов — не подсказываем что есть в позиции
        const order = ['K', 'Q', 'R', 'B', 'N', 'P'];
        const whiteKeys = order.map(t => 'w' + t);
        const blackKeys = order.map(t => 'b' + t);
        const makeBtn = (key) => {
            const btn = document.createElement('button');
            btn.className = 'memory-piece-btn';
            btn.title = key === 'empty' ? 'Пусто' : (PIECE_NAMES_RU[key] ?? key);
            btn.addEventListener('click', () => this.answerPiece(key));
            if (key === 'empty') {
                btn.textContent = '□';
            }
            else {
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
        const makeRow = (keys) => {
            const row = document.createElement('div');
            row.className = 'memory-palette-row';
            keys.forEach(k => row.appendChild(makeBtn(k)));
            return row;
        };
        this.dom.piecePalette.appendChild(makeRow(whiteKeys));
        this.dom.piecePalette.appendChild(makeRow(blackKeys));
    }
    // ─── таймеры и countdown ───────────────────────────────────────────────────
    _startCountdown(seconds) {
        this._clearCountdown();
        let left = seconds;
        this.dom.timerEl.textContent = String(left);
        this.dom.timerEl.classList.remove('text-error');
        this.countdownInterval = setInterval(() => {
            left--;
            this.dom.timerEl.textContent = String(Math.max(0, left));
            if (left <= 0)
                this._clearCountdown();
        }, 1000);
    }
    _startAnswerCountdown(seconds) {
        this._clearCountdown();
        let left = seconds;
        this.dom.timerEl.textContent = String(left);
        this.dom.timerEl.classList.toggle('text-error', left <= 3);
        this.countdownInterval = setInterval(() => {
            left--;
            this.dom.timerEl.textContent = String(Math.max(0, left));
            this.dom.timerEl.classList.toggle('text-error', left <= 3);
            if (left <= 0)
                this._clearCountdown();
        }, 1000);
    }
    _clearShowTimer() {
        if (this.showTimer) {
            clearTimeout(this.showTimer);
            this.showTimer = null;
        }
    }
    _clearAnswerTimer() {
        if (this.answerTimer) {
            clearTimeout(this.answerTimer);
            this.answerTimer = null;
        }
    }
    _clearCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = null;
        }
    }
    // ─── UI helpers ────────────────────────────────────────────────────────────
    _showFeedback(correct, timeout = false) {
        const el = this.dom.feedbackEl;
        if (timeout) {
            el.textContent = '⏱ Время вышло!';
            el.className = 'memory-feedback text-warning';
        }
        else if (correct) {
            el.textContent = '✓ Верно!';
            el.className = 'memory-feedback text-success';
        }
        else {
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
    _updateStats() {
        this.dom.correctStat.textContent = String(this.correct);
        this.dom.incorrectStat.textContent = String(this.incorrect + this.timeouts);
        this.dom.roundStat.textContent = this.config.roundCount > 0
            ? String(Math.max(0, this.config.roundCount - this.currentIndex))
            : '∞';
    }
    _cacheDom() {
        const get = (id) => document.getElementById(id);
        return {
            boardEl: get('memoryBoard'),
            questionEl: get('memoryQuestion'),
            timerEl: get('memoryTimer'),
            readyBtn: get('memoryReadyBtn'),
            piecePalette: get('memoryPalette'),
            placePalette: get('memoryPlacePalette'),
            placeActions: get('memoryPlaceActions'),
            feedbackEl: get('memoryFeedback'),
            correctStat: get('memoryCorrect'),
            incorrectStat: get('memoryIncorrect'),
            roundStat: get('memoryRound'),
        };
    }
    // ─── config persistence ────────────────────────────────────────────────────
    static loadConfig() {
        const defaults = {
            minPieces: 4,
            maxPieces: 20,
            showSeconds: 5,
            answerSeconds: 10,
            roundCount: 10,
            questionType: 'place-pieces',
            orientation: 'white',
        };
        try {
            const saved = localStorage.getItem(MEMORY_SETTINGS_KEY);
            return saved ? { ...defaults, ...JSON.parse(saved) } : defaults;
        }
        catch {
            return defaults;
        }
    }
    static saveConfig(config) {
        try {
            localStorage.setItem(MEMORY_SETTINGS_KEY, JSON.stringify(config));
        }
        catch (e) {
            console.warn('MemoryGame: config save failed', e);
        }
    }
}
//# sourceMappingURL=MemoryGame.js.map