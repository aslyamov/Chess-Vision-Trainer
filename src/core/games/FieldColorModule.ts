/**
 * Модуль игры «Цвет поля».
 * Самодостаточен: управляет своими event listeners, конфигом и жизненным циклом.
 * ChessVisionTrainer не знает деталей этой игры — только вызывает init() и onSelected().
 */

import { FieldColorGame } from '../FieldColorGame.js';
import { fcStatsManager } from '../FieldColorStatsManager.js';
import { setEl } from '../../utils/dom-utils.js';
import type { FieldColorConfig, FCResult } from '../../types/index.js';
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';

export class FieldColorModule implements IGameModule {
    readonly descriptor: GameDescriptor = {
        id:              'field-color',
        name:            'Цвет поля',
        selectBtnId:     'selectFieldColorGame',
        startScreenId:   'fieldColorStartScreen',
        gameScreenId:    'fieldColorScreen',
        statsTabId:      'tabFC',
        statsTabPanelId: 'statsTabFC',
    };

    private game: FieldColorGame | null = null;
    private ctx!: AppContext;
    private _keyHandler: ((e: KeyboardEvent) => void) | null = null;
    private _listeners: Array<[EventTarget, string, EventListener]> = [];

    // ─────────────────────────────────────────────────────────────────────

    init(ctx: AppContext): void {
        this.ctx = ctx;
        this._setupEventListeners();
        this._setupAutoSave();
        this._setupKeyboard();
    }

    onSelected(): void {
        const config = FieldColorGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    /** Полный снос модуля (вызывается при выходе в главное меню). */
    destroy(): void {
        this._destroyGame();
        this._listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
        this._listeners = [];
    }

    /** Останавливает текущую игру и клавиатурный обработчик, не трогая слушатели модуля. */
    private _destroyGame(): void {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        if (this._keyHandler) {
            window.removeEventListener('keydown', this._keyHandler, { capture: true });
            this._keyHandler = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────

    private _launch(config: FieldColorConfig): void {
        this._destroyGame();
        this._setupKeyboard();
        this.game = new FieldColorGame(this.ctx.Chessground, config, (result) => {
            this._showResults(result);
        });
        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this.game.start();
    }

    private _backToStart(): void {
        this._destroyGame();
        const config = FieldColorGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    private _restart(): void {
        this._launch(FieldColorGame.loadConfig());
    }

    renderStats(): void {
        this._renderAllTimeStats();
    }

    private _showResults(result: FCResult): void {
        const total = result.correct + result.incorrect;
        setEl('fcResCorrect',    String(result.correct));
        setEl('fcResIncorrect',  String(result.incorrect));
        setEl('fcResAccuracy',   `${total > 0 ? Math.round(result.correct / total * 100) : 0}%`);
        setEl('fcResBestStreak', String(result.bestStreak));

        this._renderAllTimeStats();
        this.ctx.uiManager.switchView('fcResultScreen');
    }

    private _renderAllTimeStats(): void {
        const s = fcStatsManager.load();
        const allTotal = s.totalCorrect + s.totalIncorrect;
        setEl('fcAllTimeSessions',  String(s.totalSessions));
        setEl('fcAllTimeAccuracy',  allTotal > 0 ? `${Math.round(s.totalCorrect / allTotal * 100)}%` : '—');
        setEl('fcAllTimeCorrect',   String(s.totalCorrect));
        setEl('fcAllTimeIncorrect', String(s.totalIncorrect));
        setEl('fcAllTimeStreak',    String(s.allTimeBestStreak));
    }

    // ─────────────────────────────────────────────────────────────────────

    private _readConfigFromUI(): FieldColorConfig {
        const radio = (name: string) =>
            (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value;
        const int = (id: string, fallback: number) => {
            const v = parseInt((document.getElementById(id) as HTMLInputElement)?.value ?? '', 10);
            return isNaN(v) || v < 0 ? fallback : v;
        };
        return {
            boardStyle:      (radio('fcBoardStyle') as FieldColorConfig['boardStyle']) ?? 'colored',
            orientation:     (radio('fcOrientation') as FieldColorConfig['orientation']) ?? 'white',
            showCoordinates: (document.getElementById('fcShowCoords') as HTMLInputElement)?.checked ?? true,
            timeMode:        int('fcTimeModeInput', 0),
            roundCount:      int('fcRoundCountInput', 0),
        };
    }

    private _applyConfigToUI(config: FieldColorConfig): void {
        const setRadio = (name: string, val: string) => {
            const el = document.querySelector<HTMLInputElement>(`input[name="${name}"][value="${val}"]`);
            if (el) el.checked = true;
        };
        setRadio('fcBoardStyle', config.boardStyle);
        setRadio('fcOrientation', config.orientation);
        const timeModeInput = document.getElementById('fcTimeModeInput') as HTMLInputElement | null;
        if (timeModeInput) timeModeInput.value = config.timeMode.toString();
        const roundInput = document.getElementById('fcRoundCountInput') as HTMLInputElement | null;
        if (roundInput) roundInput.value = config.roundCount.toString();
        const coords = document.getElementById('fcShowCoords') as HTMLInputElement | null;
        if (coords) coords.checked = config.showCoordinates;
    }

    /** Registers a tracked event listener that will be removed on destroy(). */
    private _on(target: EventTarget | null | undefined, event: string, handler: EventListener): void {
        if (!target) return;
        target.addEventListener(event, handler);
        this._listeners.push([target, event, handler]);
    }

    private _setupEventListeners(): void {
        this._on(document.getElementById('fcBackFromStartBtn'), 'click',
            () => this.ctx.uiManager.showHomeScreen());

        this._on(document.getElementById('fcStartGameBtn'), 'click', () => {
            const config = this._readConfigFromUI();
            FieldColorGame.saveConfig(config);
            this._launch(config);
        });

        this._on(document.getElementById('fcBackBtn'),       'click', () => this._backToStart());
        this._on(document.getElementById('fcWhiteBtn'),      'click', () => this.game?.answer(true));
        this._on(document.getElementById('fcBlackBtn'),      'click', () => this.game?.answer(false));
        this._on(document.getElementById('fcResPlayAgainBtn'),'click', () => this._restart());
        this._on(document.getElementById('fcResGoHomeBtn'),  'click', () => this._backToStart());
        this._on(document.getElementById('fcResGoGamesBtn'), 'click', () => this.ctx.goHome());
        this._on(document.getElementById('fcResGoStatsBtn'), 'click', () => this.ctx.openStats());
    }

    private _setupKeyboard(): void {
        if (this._keyHandler) return; // уже зарегистрирован
        this._keyHandler = (e: KeyboardEvent) => {
            if (!this.game) return;
            if ((e.target as HTMLElement).tagName === 'INPUT') return;
            if (e.key === 'ArrowUp')   { e.preventDefault(); e.stopPropagation(); this.game.answer(true); }
            else if (e.key === 'ArrowDown') { e.preventDefault(); e.stopPropagation(); this.game.answer(false); }
        };
        window.addEventListener('keydown', this._keyHandler, { capture: true });
    }

    private _setupAutoSave(): void {
        const onChange = () => FieldColorGame.saveConfig(this._readConfigFromUI());
        ['fcBoardStyle', 'fcOrientation'].forEach(name =>
            document.querySelectorAll<HTMLInputElement>(`input[name="${name}"]`)
                .forEach(el => this._on(el, 'change', onChange))
        );
        this._on(document.getElementById('fcTimeModeInput'),  'change', onChange);
        this._on(document.getElementById('fcRoundCountInput'),'change', onChange);
        this._on(document.getElementById('fcShowCoords'),     'change', onChange);
    }
}
