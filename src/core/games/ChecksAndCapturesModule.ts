/**
 * Модуль игры «Шахи и взятия».
 * Управляет GameSession, BoardRenderer и CCGameUI.
 * ChessVisionTrainer делегирует всю CC-специфику этому модулю.
 */

import { GameSession }    from '../GameSession.js';
import { BoardRenderer }  from '../../ui/BoardRenderer.js';
import { CCGameUI }       from '../../ui/CCGameUI.js';
import { soundManager }   from '../SoundManager.js';
import { puzzleProgress } from '../PuzzleProgressManager.js';
import { statsManager }   from '../StatsManager.js';
import { debounce }       from '../../utils/performance-utils.js';
import { SETTINGS_KEY }   from '../../constants.js';
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
import type { LocaleData } from '../../types/index.js';

export class ChecksAndCapturesModule implements IGameModule {
    readonly descriptor: GameDescriptor = {
        id:              'checks-and-captures',
        name:            'Шахи и взятия',
        selectBtnId:     'selectChecksGame',
        startScreenId:   'startScreen',
        gameScreenId:    'gameScreen',
        statsTabId:      'tabCC',
        statsTabPanelId: 'statsTabCC',
    };

    private session:       GameSession   | null = null;
    private boardRenderer: BoardRenderer | null = null;
    private ccUI:          CCGameUI      | null = null;
    private ctx!:          AppContext;
    private _saveSettingsDebounced!: () => void;
    private _destroyed = false;
    private _listeners: Array<[EventTarget, string, EventListener]> = [];

    // ─────────────────────────────────────────────────────────────────────────

    init(ctx: AppContext): void {
        this.ctx  = ctx;
        this.ccUI = new CCGameUI(ctx.uiManager, ctx.getLangData());
        this._saveSettingsDebounced = debounce(this._saveSettings.bind(this), 300);
        this._loadSettings();
        this._updateAvailableCount();
        this._setupEventListeners();
        this._setupAutoSave();
    }

    onSelected(): void {
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    /** Полный снос модуля (вызывается при выходе в главное меню). */
    destroy(): void {
        this._destroyed = true;
        this._destroyGame();
        this._listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
        this._listeners = [];
    }

    /** Останавливает текущую сессию/доску, не трогая слушатели модуля. */
    private _destroyGame(): void {
        this.session?.destroy();
        this.session = null;
        this.boardRenderer?.destroy();
        this.boardRenderer = null;
    }

    onLanguageChange(langData: LocaleData): void {
        this.ccUI?.updateLanguage(langData);
    }

    renderStats(): void {
        this.ccUI?.renderStatsTab();
    }

    // ─────────────────────────────────────────────────────────────────────────

    startSession(): void {
        if (!this.ccUI) return;

        const config = this.ccUI.getSessionConfig();

        soundManager.preload();
        const soundEnabled = (document.getElementById('setSound') as HTMLInputElement)?.checked ?? true;
        soundManager.setEnabled(soundEnabled);

        this._destroyGame();

        const puzzles = this.ctx.getPuzzleManager().getPuzzles(config);
        this.boardRenderer = new BoardRenderer(this.ccUI.getBoardElement(), this.ctx.Chessground);

        this.session = new GameSession(
            puzzles,
            config,
            this.ccUI,
            this.boardRenderer,
            this.ccUI.getStatusManager(),
            this.ctx.getLangData(),
            this.ctx.getCurrentLang(),
            () => this.ctx.getPuzzleManager().getStatsByDifficulty(puzzleProgress.getSolvedIds())
        );

        this.session.start();
        this._saveSettings();
    }

    giveUp():      void { this.session?.nextPuzzle(); }
    redrawBoard(): void { this.boardRenderer?.redraw(); }
    flipBoard():   void { this.boardRenderer?.flipBoard(); }

    restart(): void {
        this._destroyGame();
        this.ctx.uiManager.showStartScreen();
    }

    resetProgress(): void {
        (document.getElementById('confirmResetModal') as HTMLDialogElement)?.showModal?.();
    }

    confirmReset(): void {
        (document.getElementById('confirmResetModal') as HTMLDialogElement)?.close?.();
        puzzleProgress.reset();
        statsManager.clearAllStats();
        this.restart();
    }

    cancelReset(): void {
        (document.getElementById('confirmResetModal') as HTMLDialogElement)?.close?.();
    }

    // ─────────────────────────────────────────────────────────────────────────

    private _applyLiveSettings(): void {
        if (!this.session || !this.ccUI) return;
        const config = this.ccUI.getSessionConfig();
        this.ccUI.applySettings(config);
        this.session.updateLiveConfig(config);
        const soundEnabled = (document.getElementById('setSound') as HTMLInputElement)?.checked ?? true;
        soundManager.setEnabled(soundEnabled);
    }

    private _updateAvailableCount(): void {
        if (!this.ccUI) return;
        const diffEl = document.querySelector<HTMLInputElement>('input[name="difficulty"]:checked');
        if (!diffEl) return;
        const count = this.ctx.getPuzzleManager().getCount(diffEl.value);
        this.ccUI.updateAvailableCount(count);
    }

    /** Registers a tracked event listener that will be removed on destroy(). */
    private _on(target: EventTarget | null | undefined, event: string, handler: EventListener): void {
        if (!target) return;
        target.addEventListener(event, handler);
        this._listeners.push([target, event, handler]);
    }

    private _setupEventListeners(): void {
        this._on(document.getElementById('startGameBtn'), 'click', () => this.startSession());
        this._on(document.getElementById('giveUpBtn'),    'click', () => this.giveUp());
        this._on(document.getElementById('flipBoardBtn'), 'click', () => this.flipBoard());
        this._on(document.getElementById('restartBtn'),   'click', () => this.restart());
        this._on(document.getElementById('resetProgressBtn'), 'click', () => this.resetProgress());
        this._on(document.getElementById('confirmResetBtn'),  'click', () => this.confirmReset());
        this._on(document.getElementById('cancelResetBtn'),   'click', () => this.cancelReset());
        this._on(document.getElementById('resGoHomeBtn'),     'click', () => this.ctx.goHome());
        this._on(document.getElementById('resGoStatsBtn'),    'click', () => this.ctx.openStats());
    }

    private _setupAutoSave(): void {
        const onDifficultyChange = () => { this._updateAvailableCount(); this._saveSettings(); };
        document.querySelectorAll<HTMLInputElement>('input[name="difficulty"]').forEach(radio =>
            this._on(radio, 'change', onDifficultyChange)
        );

        this._on(document.getElementById('taskCountInput'), 'change', () => this._saveSettings());
        this._on(document.getElementById('timeLimitInput'), 'change', () => this._saveSettings());

        const onSettingChange = () => { this._saveSettingsDebounced(); this._applyLiveSettings(); };
        ['setSequential', 'setHighlights', 'setShowDests',
            'setHints', 'setStatusText', 'setShowLog', 'setGoodMoves', 'setSound'].forEach(id =>
            this._on(document.getElementById(id), 'change', onSettingChange)
        );
    }

    private _saveSettings(): void {
        if (this._destroyed || !this.ccUI) return;
        try {
            const cfg = this.ccUI.getSessionConfig();
            const settings = {
                difficulty:  cfg.difficulty,
                taskCount:   String(cfg.taskCount),
                timeLimit:   String(cfg.timeLimit),
                sequential:  cfg.sequentialMode,
                highlights:  cfg.highlightFound,
                hints:       cfg.showHints,
                statusText:  cfg.showText,
                showLog:     cfg.showLog,
                goodMoves:   cfg.goodMovesOnly,
                showDests:   !cfg.hideLegalMoves,
                sound: (document.getElementById('setSound') as HTMLInputElement)?.checked ?? true,
            };
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) {
            console.warn('Не удалось сохранить настройки:', e);
        }
    }

    private _loadSettings(): void {
        try {
            const saved = localStorage.getItem(SETTINGS_KEY);
            if (!saved) return;
            const s = JSON.parse(saved);

            if (s.difficulty) {
                const el = document.querySelector<HTMLInputElement>(`input[name="difficulty"][value="${s.difficulty}"]`);
                if (el) el.checked = true;
            }

            const setInput = (id: string, val: string | undefined) => {
                if (!val) return;
                const el = document.getElementById(id) as HTMLInputElement | null;
                if (el) el.value = val;
            };
            const setCheckbox = (id: string, val: boolean | undefined) => {
                if (val === undefined) return;
                const el = document.getElementById(id) as HTMLInputElement | null;
                if (el) el.checked = val;
            };

            setInput('taskCountInput', s.taskCount);
            setInput('timeLimitInput', s.timeLimit);
            setCheckbox('setSequential', s.sequential);
            setCheckbox('setHighlights', s.highlights);
            setCheckbox('setHints',      s.hints);
            setCheckbox('setStatusText', s.statusText);
            setCheckbox('setShowLog',    s.showLog);
            setCheckbox('setGoodMoves',  s.goodMoves);
            setCheckbox('setSound',      s.sound);
            setCheckbox('setShowDests',  s.showDests);
        } catch (e) {
            console.warn('Не удалось загрузить настройки:', e);
        }
    }
}
