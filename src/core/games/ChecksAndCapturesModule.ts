/**
 * Модуль игры «Шахи и взятия».
 * Управляет GameSession, BoardRenderer и настройками игры.
 * ChessVisionTrainer делегирует всю CC-специфику этому модулю.
 */

import { GameSession } from '../GameSession.js';
import { BoardRenderer } from '../../ui/BoardRenderer.js';
import { soundManager } from '../SoundManager.js';
import { puzzleProgress } from '../PuzzleProgressManager.js';
import { statsManager } from '../StatsManager.js';
import { debounce } from '../../utils/performance-utils.js';
import { SETTINGS_KEY } from '../../constants.js';
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';

export class ChecksAndCapturesModule implements IGameModule {
    readonly descriptor: GameDescriptor = {
        id:            'checks-and-captures',
        name:          'Шахи и взятия',
        selectBtnId:   'selectChecksGame',
        startScreenId: 'startScreen',
        gameScreenId:  'gameScreen',
    };

    private session: GameSession | null = null;
    private boardRenderer: BoardRenderer | null = null;
    private ctx!: AppContext;
    private _saveSettingsDebounced!: () => void;

    // ─────────────────────────────────────────────────────────────────────

    init(ctx: AppContext): void {
        this.ctx = ctx;
        this._saveSettingsDebounced = debounce(this._saveSettings.bind(this), 300);
        this._loadSettings();
        this._updateAvailableCount();
        this._setupEventListeners();
        this._setupAutoSave();
    }

    onSelected(): void {
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    destroy(): void {
        if (this.session) {
            this.session.destroy();
            this.session = null;
        }
        if (this.boardRenderer) {
            this.boardRenderer.destroy();
            this.boardRenderer = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────

    startSession(): void {
        const config = this.ctx.uiManager.getSessionConfig();

        soundManager.preload();
        const soundEnabled = (document.getElementById('setSound') as HTMLInputElement)?.checked ?? true;
        soundManager.setEnabled(soundEnabled);

        this.destroy();

        const puzzles = this.ctx.getPuzzleManager().getPuzzles(config);
        const dom = this.ctx.uiManager.getDOM();
        this.boardRenderer = new BoardRenderer(dom.board!, this.ctx.Chessground);

        this.session = new GameSession(
            puzzles,
            config,
            this.ctx.uiManager,
            this.boardRenderer,
            this.ctx.getStatusManager(),
            this.ctx.getLangData(),
            this.ctx.getCurrentLang(),
            () => this.ctx.getPuzzleManager().getStatsByDifficulty(puzzleProgress.getSolvedIds())
        );

        this.session.start();
        this._saveSettings();
    }

    giveUp(): void {
        this.session?.nextPuzzle();
    }

    redrawBoard(): void {
        this.boardRenderer?.redraw();
    }

    flipBoard(): void {
        this.boardRenderer?.flipBoard();
    }

    restart(): void {
        this.destroy();
        this.ctx.uiManager.showStartScreen();
    }

    resetProgress(): void {
        const modal = document.getElementById('confirmResetModal') as HTMLDialogElement;
        modal?.showModal?.();
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

    // ─────────────────────────────────────────────────────────────────────

    private _applyLiveSettings(): void {
        if (!this.session) return;
        const config = this.ctx.uiManager.getSessionConfig();
        this.ctx.uiManager.applySettings(config);
        this.session.updateLiveConfig(config);
        const soundEnabled = (document.getElementById('setSound') as HTMLInputElement)?.checked ?? true;
        soundManager.setEnabled(soundEnabled);
    }

    private _updateAvailableCount(): void {
        const diffEl = document.querySelector<HTMLInputElement>('input[name="difficulty"]:checked');
        if (!diffEl) return;
        const count = this.ctx.getPuzzleManager().getCount(diffEl.value);
        this.ctx.uiManager.updateAvailableCount(count);
    }

    private _setupEventListeners(): void {
        document.getElementById('startGameBtn')?.addEventListener('click', () => this.startSession());
        document.getElementById('giveUpBtn')?.addEventListener('click', () => this.giveUp());
        document.getElementById('flipBoardBtn')?.addEventListener('click', () => this.flipBoard());
        document.getElementById('restartBtn')?.addEventListener('click', () => this.restart());
        document.getElementById('resetProgressBtn')?.addEventListener('click', () => this.resetProgress());
        document.getElementById('confirmResetBtn')?.addEventListener('click', () => this.confirmReset());
        document.getElementById('cancelResetBtn')?.addEventListener('click', () => this.cancelReset());
    }

    private _setupAutoSave(): void {
        document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
            radio.addEventListener('change', () => {
                this._updateAvailableCount();
                this._saveSettings();
            });
        });

        document.getElementById('taskCountInput')?.addEventListener('change', () => this._saveSettings());
        document.getElementById('timeLimitInput')?.addEventListener('change', () => this._saveSettings());

        const checkboxIds = ['setSequential', 'setHighlights', 'setShowDests',
            'setHints', 'setStatusText', 'setShowLog', 'setGoodMoves', 'setSound'];
        checkboxIds.forEach(id => {
            document.getElementById(id)?.addEventListener('change', () => {
                this._saveSettingsDebounced();
                this._applyLiveSettings();
            });
        });
    }

    private _saveSettings(): void {
        try {
            const settings = {
                difficulty:  (document.querySelector('input[name="difficulty"]:checked') as HTMLInputElement)?.value || 'medium',
                taskCount:   (document.getElementById('taskCountInput') as HTMLInputElement)?.value || '10',
                timeLimit:   (document.getElementById('timeLimitInput') as HTMLInputElement)?.value || '0',
                sequential:  (document.getElementById('setSequential') as HTMLInputElement)?.checked ?? false,
                highlights:  (document.getElementById('setHighlights') as HTMLInputElement)?.checked ?? true,
                hints:       (document.getElementById('setHints') as HTMLInputElement)?.checked ?? true,
                statusText:  (document.getElementById('setStatusText') as HTMLInputElement)?.checked ?? true,
                showLog:     (document.getElementById('setShowLog') as HTMLInputElement)?.checked ?? true,
                goodMoves:   (document.getElementById('setGoodMoves') as HTMLInputElement)?.checked ?? false,
                sound:       (document.getElementById('setSound') as HTMLInputElement)?.checked ?? true,
                showDests:   (document.getElementById('setShowDests') as HTMLInputElement)?.checked ?? true,
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
            setCheckbox('setHints', s.hints);
            setCheckbox('setStatusText', s.statusText);
            setCheckbox('setShowLog', s.showLog);
            setCheckbox('setGoodMoves', s.goodMoves);
            setCheckbox('setSound', s.sound);
            setCheckbox('setShowDests', s.showDests);
        } catch (e) {
            console.warn('Не удалось загрузить настройки:', e);
        }
    }
}
