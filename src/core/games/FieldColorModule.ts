/**
 * Модуль игры «Цвет поля».
 * Самодостаточен: управляет своими event listeners, конфигом и жизненным циклом.
 * ChessVisionTrainer не знает деталей этой игры — только вызывает init() и onSelected().
 */

import { FieldColorGame } from '../FieldColorGame.js';
import { fcStatsManager } from '../FieldColorStatsManager.js';
import { commonStatsManager } from '../CommonStatsManager.js';
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

    destroy(): void {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
        if (this._keyHandler) {
            document.removeEventListener('keydown', this._keyHandler);
            this._keyHandler = null;
        }
    }

    // ─────────────────────────────────────────────────────────────────────

    private _launch(config: FieldColorConfig): void {
        this.destroy();
        this.game = new FieldColorGame(this.ctx.Chessground, config, (result) => {
            this._showResults(result);
        });
        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this.game.start();
    }

    private _backToStart(): void {
        this.destroy();
        const config = FieldColorGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    private _restart(): void {
        const config = FieldColorGame.loadConfig();
        this.destroy();
        this.game = new FieldColorGame(this.ctx.Chessground, config, (result) => {
            this._showResults(result);
        });
        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this.game.start();
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
        setEl('fcAllTimeStreak',    String(commonStatsManager.getStats().currentStreak));
    }

    // ─────────────────────────────────────────────────────────────────────

    private _readConfigFromUI(): FieldColorConfig {
        const radio = (name: string) =>
            (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value;
        const int = (id: string, fallback: number) => {
            const v = parseInt((document.getElementById(id) as HTMLInputElement)?.value ?? '');
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

    private _setupEventListeners(): void {
        document.getElementById('fcBackFromStartBtn')?.addEventListener('click',
            () => this.ctx.uiManager.showHomeScreen());

        document.getElementById('fcStartGameBtn')?.addEventListener('click', () => {
            const config = this._readConfigFromUI();
            FieldColorGame.saveConfig(config);
            this._launch(config);
        });

        document.getElementById('fcBackBtn')?.addEventListener('click',
            () => this._backToStart());

        document.getElementById('fcWhiteBtn')?.addEventListener('click',
            () => this.game?.answer(true));

        document.getElementById('fcBlackBtn')?.addEventListener('click',
            () => this.game?.answer(false));

        document.getElementById('fcResPlayAgainBtn')?.addEventListener('click',
            () => this._restart());

        document.getElementById('fcResGoHomeBtn')?.addEventListener('click',
            () => this._backToStart());

        document.getElementById('fcResGoGamesBtn')?.addEventListener('click',
            () => this.ctx.goHome());

        document.getElementById('fcResGoStatsBtn')?.addEventListener('click',
            () => this.ctx.openStats());
    }

    private _setupKeyboard(): void {
        this._keyHandler = (e: KeyboardEvent) => {
            if (!this.game) return;
            if ((e.target as HTMLElement).tagName === 'INPUT') return;
            const key = e.key.toLowerCase();
            if (key === 'w') this.game.answer(true);
            else if (key === 'b') this.game.answer(false);
        };
        document.addEventListener('keydown', this._keyHandler);
    }

    private _setupAutoSave(): void {
        const onChange = () => FieldColorGame.saveConfig(this._readConfigFromUI());
        ['fcBoardStyle', 'fcOrientation'].forEach(name =>
            document.querySelectorAll(`input[name="${name}"]`)
                .forEach(el => el.addEventListener('change', onChange))
        );
        document.getElementById('fcTimeModeInput')?.addEventListener('change', onChange);
        document.getElementById('fcRoundCountInput')?.addEventListener('change', onChange);
        document.getElementById('fcShowCoords')?.addEventListener('change', onChange);
    }
}
