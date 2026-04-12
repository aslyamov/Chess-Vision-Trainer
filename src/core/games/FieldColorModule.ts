/**
 * Модуль игры «Цвет поля».
 * Самодостаточен: управляет своими event listeners, конфигом и жизненным циклом.
 * ChessVisionTrainer не знает деталей этой игры — только вызывает init() и onSelected().
 */

import { FieldColorGame } from '../FieldColorGame.js';
import type { FieldColorConfig } from '../../types/index.js';
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';

export class FieldColorModule implements IGameModule {
    readonly descriptor: GameDescriptor = {
        id:            'field-color',
        name:          'Цвет поля',
        selectBtnId:   'selectFieldColorGame',
        startScreenId: 'fieldColorStartScreen',
        gameScreenId:  'fieldColorScreen',
    };

    private game: FieldColorGame | null = null;
    private ctx!: AppContext;

    // ─────────────────────────────────────────────────────────────────────

    init(ctx: AppContext): void {
        this.ctx = ctx;
        this._setupEventListeners();
        this._setupAutoSave();
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
    }

    // ─────────────────────────────────────────────────────────────────────

    private _launch(config: FieldColorConfig): void {
        this.destroy();
        this.game = new FieldColorGame(this.ctx.Chessground, config);
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
        (document.getElementById('fcResultModal') as HTMLDialogElement | null)?.close();
        const config = FieldColorGame.loadConfig();
        this.destroy();
        this.game = new FieldColorGame(this.ctx.Chessground, config);
        this.game.start();
    }

    // ─────────────────────────────────────────────────────────────────────

    private _readConfigFromUI(): FieldColorConfig {
        const radio = (name: string) =>
            (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value;
        return {
            boardStyle:      (radio('fcBoardStyle') as FieldColorConfig['boardStyle']) ?? 'colored',
            orientation:     (radio('fcOrientation') as FieldColorConfig['orientation']) ?? 'white',
            showCoordinates: (document.getElementById('fcShowCoords') as HTMLInputElement)?.checked ?? true,
            timeMode:        Math.max(0, parseInt(
                (document.getElementById('fcTimeModeInput') as HTMLInputElement)?.value ?? '0'
            ) || 0),
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

        document.getElementById('fcResGoHomeBtn')?.addEventListener('click', () => {
            (document.getElementById('fcResultModal') as HTMLDialogElement | null)?.close();
            this._backToStart();
        });
    }

    private _setupAutoSave(): void {
        const onChange = () => FieldColorGame.saveConfig(this._readConfigFromUI());
        ['fcBoardStyle', 'fcOrientation'].forEach(name =>
            document.querySelectorAll(`input[name="${name}"]`)
                .forEach(el => el.addEventListener('change', onChange))
        );
        document.getElementById('fcTimeModeInput')?.addEventListener('change', onChange);
        document.getElementById('fcShowCoords')?.addEventListener('change', onChange);
    }
}
