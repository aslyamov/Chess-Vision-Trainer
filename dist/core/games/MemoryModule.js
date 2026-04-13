/**
 * Модуль игры «Запоминание позиции».
 * Управляет жизненным циклом MemoryGame, настройками и статистикой.
 * ChessVisionTrainer делегирует всю Memory-специфику этому модулю.
 */
import { MemoryGame } from '../MemoryGame.js';
import { memoryStatsManager } from '../MemoryStatsManager.js';
import { countPieces } from '../../utils/chess-utils.js';
import { shuffleArray } from '../../utils/chess-utils.js';
import { setEl } from '../../utils/dom-utils.js';
export class MemoryModule {
    constructor() {
        this.descriptor = {
            id: 'memory',
            name: 'Запоминание позиции',
            selectBtnId: 'selectMemoryGame',
            startScreenId: 'memoryStartScreen',
            gameScreenId: 'memoryScreen',
            statsTabId: 'tabMemory',
            statsTabPanelId: 'statsTabMemory',
        };
        this.game = null;
        this._autoSaveListeners = [];
    }
    // ─────────────────────────────────────────────────────────────────────────
    init(ctx) {
        this.ctx = ctx;
        this._setupEventListeners();
        this._setupAutoSave();
    }
    onSelected() {
        const config = MemoryGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    destroy() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        for (const { el, handler } of this._autoSaveListeners) {
            el.removeEventListener('change', handler);
        }
        this._autoSaveListeners = [];
    }
    renderStats() {
        this._renderAllTimeStats();
    }
    // ─────────────────────────────────────────────────────────────────────────
    _launch(config) {
        this.destroy();
        const allPuzzles = this.ctx.getPuzzleManager().getAllPuzzles();
        const filtered = allPuzzles.filter(p => {
            const n = countPieces(p.fen);
            return n >= config.minPieces && n <= config.maxPieces;
        });
        if (filtered.length === 0) {
            alert('Нет позиций с таким количеством фигур. Попробуйте изменить диапазон.');
            return;
        }
        // Ограничиваем пул до roundCount (если не ∞), чтобы не перемешивать лишнее
        const pool = config.roundCount > 0
            ? shuffleArray(filtered).slice(0, config.roundCount)
            : filtered;
        this.game = new MemoryGame(this.ctx.Chessground, pool, config, (result) => {
            memoryStatsManager.record(result);
            this._showResults(result);
        });
        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this.game.start();
    }
    _backToStart() {
        this.destroy();
        const config = MemoryGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    _restart() {
        const config = MemoryGame.loadConfig();
        this._launch(config);
    }
    _showResults(result) {
        const total = result.correct + result.incorrect + result.timeouts;
        const accuracy = total > 0 ? Math.round(result.correct / total * 100) : 0;
        setEl('memResCorrect', String(result.correct));
        setEl('memResIncorrect', String(result.incorrect + result.timeouts));
        setEl('memResAccuracy', `${accuracy}%`);
        setEl('memResBestStreak', String(result.bestStreak));
        this._renderAllTimeStats();
        this.ctx.uiManager.switchView('memoryResultScreen');
    }
    _renderAllTimeStats() {
        const s = memoryStatsManager.load();
        const acc = s.totalSessions > 0 ? `${s.bestAccuracy}%` : '—';
        // Экран результатов
        setEl('memAllTimeSessions', String(s.totalSessions));
        setEl('memAllTimeAccuracy', acc);
        setEl('memAllTimeStreak', `${s.bestStreak} 🔥`);
        // Вкладка статистики
        setEl('memStatsessions', String(s.totalSessions));
        setEl('memStatBestAccuracy', acc);
        setEl('memStatBestStreak', String(s.bestStreak));
        setEl('memStatCorrect', String(s.totalCorrect));
        setEl('memStatIncorrect', String(s.totalIncorrect));
    }
    // ─────────────────────────────────────────────────────────────────────────
    _readConfigFromUI() {
        const radio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value ?? '';
        const int = (id, fallback) => {
            const val = parseInt(document.getElementById(id)?.value ?? '');
            return isNaN(val) || val < 0 ? fallback : val;
        };
        const pieceRange = radio('memPieceRange') || '7-12';
        const [minStr, maxStr] = pieceRange.split('-');
        const minPieces = parseInt(minStr) || 7;
        const maxPieces = parseInt(maxStr) || 12;
        return {
            minPieces,
            maxPieces,
            showSeconds: int('memShowSecondsInput', 5),
            answerSeconds: int('memAnswerSecondsInput', 10),
            roundCount: int('memRoundCountInput', 10),
            questionType: (radio('memQuestionType') || 'mixed'),
            orientation: (radio('memOrientation') || 'white'),
        };
    }
    _applyConfigToUI(config) {
        const setRadio = (name, val) => {
            const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
            if (el)
                el.checked = true;
        };
        const setInput = (id, val) => {
            const el = document.getElementById(id);
            if (el)
                el.value = String(val);
        };
        const rangeValue = `${config.minPieces}-${config.maxPieces}`;
        setRadio('memPieceRange', rangeValue);
        setRadio('memQuestionType', config.questionType);
        setRadio('memOrientation', config.orientation);
        setInput('memShowSecondsInput', config.showSeconds);
        setInput('memAnswerSecondsInput', config.answerSeconds);
        setInput('memRoundCountInput', config.roundCount);
    }
    _setupEventListeners() {
        document.getElementById('memBackFromStartBtn')?.addEventListener('click', () => this.ctx.uiManager.showHomeScreen());
        document.getElementById('memStartGameBtn')?.addEventListener('click', () => {
            const config = this._readConfigFromUI();
            MemoryGame.saveConfig(config);
            this._launch(config);
        });
        document.getElementById('memBackBtn')?.addEventListener('click', () => this._backToStart());
        document.getElementById('memoryReadyBtn')?.addEventListener('click', () => this.game?.ready());
        document.getElementById('memoryCheckBtn')?.addEventListener('click', () => this.game?.checkPlacement());
        document.getElementById('memoryClearBtn')?.addEventListener('click', () => this.game?.clearBoard());
        document.getElementById('memResPlayAgainBtn')?.addEventListener('click', () => this._restart());
        document.getElementById('memResGoHomeBtn')?.addEventListener('click', () => this._backToStart());
        document.getElementById('memResGoGamesBtn')?.addEventListener('click', () => this.ctx.goHome());
        document.getElementById('memResGoStatsBtn')?.addEventListener('click', () => this.ctx.openStats());
    }
    _setupAutoSave() {
        const onChange = () => MemoryGame.saveConfig(this._readConfigFromUI());
        ['memPieceRange', 'memQuestionType', 'memOrientation'].forEach(name => document.querySelectorAll(`input[name="${name}"]`).forEach(el => {
            el.addEventListener('change', onChange);
            this._autoSaveListeners.push({ el, handler: onChange });
        }));
        ['memRoundCountInput', 'memShowSecondsInput', 'memAnswerSecondsInput'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('change', onChange);
                this._autoSaveListeners.push({ el, handler: onChange });
            }
        });
    }
}
//# sourceMappingURL=MemoryModule.js.map