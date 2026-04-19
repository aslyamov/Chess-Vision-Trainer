/**
 * Модуль игры «Шахи и взятия».
 * Управляет GameSession, BoardRenderer и CCGameUI.
 * ChessVisionTrainer делегирует всю CC-специфику этому модулю.
 */
import { GameSession } from '../GameSession.js';
import { BoardRenderer } from '../../ui/BoardRenderer.js';
import { CCGameUI } from '../../ui/CCGameUI.js';
import { soundManager } from '../SoundManager.js';
import { puzzleProgress } from '../PuzzleProgressManager.js';
import { statsManager } from '../StatsManager.js';
import { debounce } from '../../utils/performance-utils.js';
import { SETTINGS_KEY } from '../../constants.js';
export class ChecksAndCapturesModule {
    constructor() {
        this.descriptor = {
            id: 'checks-and-captures',
            name: 'Шахи и взятия',
            selectBtnId: 'selectChecksGame',
            startScreenId: 'startScreen',
            gameScreenId: 'gameScreen',
            statsTabId: 'tabCC',
            statsTabPanelId: 'statsTabCC',
        };
        this.session = null;
        this.boardRenderer = null;
        this.ccUI = null;
        this._destroyed = false;
        this._listeners = [];
    }
    // ─────────────────────────────────────────────────────────────────────────
    init(ctx) {
        this.ctx = ctx;
        this.ccUI = new CCGameUI(ctx.uiManager, ctx.getLangData());
        this._saveSettingsDebounced = debounce(this._saveSettings.bind(this), 300);
        this._loadSettings();
        this._updateAvailableCount();
        this._setupEventListeners();
        this._setupAutoSave();
    }
    onSelected() {
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    destroy() {
        this._destroyed = true;
        this._listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
        this._listeners = [];
        this.session?.destroy();
        this.session = null;
        this.boardRenderer?.destroy();
        this.boardRenderer = null;
    }
    onLanguageChange(langData) {
        this.ccUI?.updateLanguage(langData);
    }
    renderStats() {
        this.ccUI?.renderStatsTab();
    }
    // ─────────────────────────────────────────────────────────────────────────
    startSession() {
        if (!this.ccUI)
            return;
        const config = this.ccUI.getSessionConfig();
        soundManager.preload();
        const soundEnabled = document.getElementById('setSound')?.checked ?? true;
        soundManager.setEnabled(soundEnabled);
        this.destroy();
        const puzzles = this.ctx.getPuzzleManager().getPuzzles(config);
        this.boardRenderer = new BoardRenderer(this.ccUI.getBoardElement(), this.ctx.Chessground);
        this.session = new GameSession(puzzles, config, this.ccUI, this.boardRenderer, this.ccUI.getStatusManager(), this.ctx.getLangData(), this.ctx.getCurrentLang(), () => this.ctx.getPuzzleManager().getStatsByDifficulty(puzzleProgress.getSolvedIds()));
        this.session.start();
        this._saveSettings();
    }
    giveUp() { this.session?.nextPuzzle(); }
    redrawBoard() { this.boardRenderer?.redraw(); }
    flipBoard() { this.boardRenderer?.flipBoard(); }
    restart() {
        this.destroy();
        this.ctx.uiManager.showStartScreen();
    }
    resetProgress() {
        document.getElementById('confirmResetModal')?.showModal?.();
    }
    confirmReset() {
        document.getElementById('confirmResetModal')?.close?.();
        puzzleProgress.reset();
        statsManager.clearAllStats();
        this.restart();
    }
    cancelReset() {
        document.getElementById('confirmResetModal')?.close?.();
    }
    // ─────────────────────────────────────────────────────────────────────────
    _applyLiveSettings() {
        if (!this.session || !this.ccUI)
            return;
        const config = this.ccUI.getSessionConfig();
        this.ccUI.applySettings(config);
        this.session.updateLiveConfig(config);
        const soundEnabled = document.getElementById('setSound')?.checked ?? true;
        soundManager.setEnabled(soundEnabled);
    }
    _updateAvailableCount() {
        if (!this.ccUI)
            return;
        const diffEl = document.querySelector('input[name="difficulty"]:checked');
        if (!diffEl)
            return;
        const count = this.ctx.getPuzzleManager().getCount(diffEl.value);
        this.ccUI.updateAvailableCount(count);
    }
    /** Registers a tracked event listener that will be removed on destroy(). */
    _on(target, event, handler) {
        if (!target)
            return;
        target.addEventListener(event, handler);
        this._listeners.push([target, event, handler]);
    }
    _setupEventListeners() {
        this._on(document.getElementById('startGameBtn'), 'click', () => this.startSession());
        this._on(document.getElementById('giveUpBtn'), 'click', () => this.giveUp());
        this._on(document.getElementById('flipBoardBtn'), 'click', () => this.flipBoard());
        this._on(document.getElementById('restartBtn'), 'click', () => this.restart());
        this._on(document.getElementById('resetProgressBtn'), 'click', () => this.resetProgress());
        this._on(document.getElementById('confirmResetBtn'), 'click', () => this.confirmReset());
        this._on(document.getElementById('cancelResetBtn'), 'click', () => this.cancelReset());
        this._on(document.getElementById('resGoHomeBtn'), 'click', () => this.ctx.goHome());
        this._on(document.getElementById('resGoStatsBtn'), 'click', () => this.ctx.openStats());
    }
    _setupAutoSave() {
        const onDifficultyChange = () => { this._updateAvailableCount(); this._saveSettings(); };
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => this._on(radio, 'change', onDifficultyChange));
        this._on(document.getElementById('taskCountInput'), 'change', () => this._saveSettings());
        this._on(document.getElementById('timeLimitInput'), 'change', () => this._saveSettings());
        const onSettingChange = () => { this._saveSettingsDebounced(); this._applyLiveSettings(); };
        ['setSequential', 'setHighlights', 'setShowDests',
            'setHints', 'setStatusText', 'setShowLog', 'setGoodMoves', 'setSound'].forEach(id => this._on(document.getElementById(id), 'change', onSettingChange));
    }
    _saveSettings() {
        if (this._destroyed || !this.ccUI)
            return;
        try {
            const cfg = this.ccUI.getSessionConfig();
            const settings = {
                difficulty: cfg.difficulty,
                taskCount: String(cfg.taskCount),
                timeLimit: String(cfg.timeLimit),
                sequential: cfg.sequentialMode,
                highlights: cfg.highlightFound,
                hints: cfg.showHints,
                statusText: cfg.showText,
                showLog: cfg.showLog,
                goodMoves: cfg.goodMovesOnly,
                showDests: !cfg.hideLegalMoves,
                sound: document.getElementById('setSound')?.checked ?? true,
            };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        }
        catch (e) {
            console.warn('Не удалось сохранить настройки:', e);
        }
    }
    _loadSettings() {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (!saved)
                return;
            const s = JSON.parse(saved);
            if (s.difficulty) {
                const el = document.querySelector(`input[name="difficulty"][value="${s.difficulty}"]`);
                if (el)
                    el.checked = true;
            }
            const setInput = (id, val) => {
                if (!val)
                    return;
                const el = document.getElementById(id);
                if (el)
                    el.value = val;
            };
            const setCheckbox = (id, val) => {
                if (val === undefined)
                    return;
                const el = document.getElementById(id);
                if (el)
                    el.checked = val;
            };
            setInput('taskCountInput', s.taskCount);
            setInput('timeLimitInput', s.timeLimit);
            setCheckbox('setSequential', s.sequential);
            setCheckbox('setHighlights', s.highlights);
            setCheckbox('setHints', s.hints);
            setCheckbox('setStatusText', s.statusText);
            setCheckbox('setShowLog', s.showLog);
            setCheckbox('setGoodMoves', s.goodMoves);
            setCheckbox('setSound', s.sound);
            setCheckbox('setShowDests', s.showDests);
        }
        catch (e) {
            console.warn('Не удалось загрузить настройки:', e);
        }
    }
}
//# sourceMappingURL=ChecksAndCapturesModule.js.map