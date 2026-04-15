/**
 * Модуль игры «Материальный перевес».
 * Управляет вводом ответа: тогл [Белые / Равно / Чёрные] + степпер числа + кнопка «Проверить».
 */

import { MaterialGame } from '../MaterialGame.js';
import { materialStatsManager } from '../MaterialStatsManager.js';
import { setEl } from '../../utils/dom-utils.js';
import { shuffleArray } from '../../utils/chess-utils.js';
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
import type { MaterialConfig, MaterialResult } from '../../types/index.js';

type Side = 'white' | 'equal' | 'black';

export class MaterialModule implements IGameModule {
    readonly descriptor: GameDescriptor = {
        id:              'material',
        name:            'Материальный перевес',
        selectBtnId:     'selectMaterialGame',
        startScreenId:   'materialStartScreen',
        gameScreenId:    'materialGameScreen',
        statsTabId:      'tabMaterial',
        statsTabPanelId: 'statsTabMaterial',
    };

    private game: MaterialGame | null = null;
    private ctx!: AppContext;

    // ── Input state ───────────────────────────────────────────────────────────
    private selectedSide: Side | null = null;
    private selectedValue = 1;
    private inputLocked = false;   // true during 950ms feedback delay

    // ── IGameModule ───────────────────────────────────────────────────────────

    init(ctx: AppContext): void {
        this.ctx = ctx;
        this._setupEventListeners();
        this._setupAutoSave();
    }

    onSelected(): void {
        const config = MaterialGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    destroy(): void {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
    }

    renderStats(): void {
        this._renderAllTimeStats();
    }

    // ── Private: game lifecycle ───────────────────────────────────────────────

    private _launch(config: MaterialConfig): void {
        this.destroy();

        const allPuzzles = this.ctx.getPuzzleManager().getAllPuzzles();
        const puzzles    = shuffleArray([...allPuzzles]);

        this.game = new MaterialGame(
            this.ctx.Chessground,
            puzzles,
            config,
            (result) => this._showResults(result),
            ()       => this._resetInput(),         // onPuzzleReady
        );

        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this._resetInput();
        this.game.start();
    }

    private _backToStart(): void {
        this.destroy();
        const config = MaterialGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    private _restart(): void {
        this._launch(MaterialGame.loadConfig());
    }

    private _showResults(result: MaterialResult): void {
        const total = result.correct + result.incorrect;
        setEl('materialResCorrect',    String(result.correct));
        setEl('materialResIncorrect',  String(result.incorrect));
        setEl('materialResAccuracy',   total > 0 ? `${Math.round(result.correct / total * 100)}%` : '—');
        setEl('materialResBestStreak', String(result.bestStreak));
        this._renderAllTimeStats();
        this.ctx.uiManager.switchView('materialResultScreen');
    }

    private _renderAllTimeStats(): void {
        const s        = materialStatsManager.load();
        const allTotal = s.totalCorrect + s.totalIncorrect;
        const accuracy = allTotal > 0 ? `${Math.round(s.totalCorrect / allTotal * 100)}%` : '—';

        // Stats tab
        setEl('matStatSessions',  String(s.totalSessions));
        setEl('matStatAccuracy',  accuracy);
        setEl('matStatStreak',    String(s.bestStreak));
        setEl('matStatCorrect',   String(s.totalCorrect));
        setEl('matStatIncorrect', String(s.totalIncorrect));

        // Result screen
        setEl('materialAllTimeSessions',  String(s.totalSessions));
        setEl('materialAllTimeAccuracy',  accuracy);
        setEl('materialAllTimeStreak',    String(s.bestStreak));
        setEl('materialAllTimeCorrect',   String(s.totalCorrect));
        setEl('materialAllTimeIncorrect', String(s.totalIncorrect));
    }

    // ── Private: answer input ─────────────────────────────────────────────────

    private _resetInput(): void {
        this.selectedSide  = null;
        this.selectedValue = 1;
        this.inputLocked   = false;
        this._renderInput();
    }

    private _selectSide(side: Side): void {
        if (this.inputLocked) return;
        this.selectedSide = side;
        this._renderInput();
    }

    private _adjustValue(delta: number): void {
        if (this.inputLocked) return;
        this.selectedValue = Math.max(1, Math.min(9, this.selectedValue + delta));
        this._renderInput();
    }

    private _submitAnswer(): void {
        if (this.inputLocked || !this.selectedSide || !this.game) return;

        const balance = this.selectedSide === 'white' ?  this.selectedValue
                      : this.selectedSide === 'black' ? -this.selectedValue
                      : 0;

        if (!this.game.answer(balance)) return;

        this.inputLocked = true;
        this._renderInput();

        // Re-enable after transition (game fires onPuzzleReady at ~950ms)
        // If game ended, onPuzzleReady won't fire; that's fine — game screen hides anyway.
    }

    private _renderInput(): void {
        const hasSide = this.selectedSide !== null;
        const isEqual = this.selectedSide === 'equal';

        // Side buttons
        const sides: { id: string; side: Side; activeClass: string }[] = [
            { id: 'materialSideWhite', side: 'white', activeClass: 'btn-warning' },
            { id: 'materialSideEqual', side: 'equal', activeClass: 'btn-neutral' },
            { id: 'materialSideBlack', side: 'black', activeClass: 'btn-secondary' },
        ];
        sides.forEach(({ id, side, activeClass }) => {
            const btn = document.getElementById(id) as HTMLButtonElement | null;
            if (!btn) return;
            btn.disabled = this.inputLocked;
            const active = this.selectedSide === side;
            // Remove all active classes, then add if needed
            btn.classList.remove('btn-warning', 'btn-neutral', 'btn-secondary');
            btn.classList.toggle('btn-outline', !active);
            if (active) btn.classList.add(activeClass);
        });

        // Value row visibility
        const valueRow = document.getElementById('materialValueRow');
        if (valueRow) valueRow.classList.toggle('hidden', isEqual);

        // Value display
        setEl('materialValueDisplay', String(this.selectedValue));

        // Stepper buttons
        const minus = document.getElementById('materialValueMinus') as HTMLButtonElement | null;
        const plus  = document.getElementById('materialValuePlus')  as HTMLButtonElement | null;
        if (minus) minus.disabled = this.inputLocked || this.selectedValue <= 1;
        if (plus)  plus.disabled  = this.inputLocked || this.selectedValue >= 9;

        // Submit button
        const submit = document.getElementById('materialSubmit') as HTMLButtonElement | null;
        if (submit) submit.disabled = !hasSide || this.inputLocked;
    }

    // ── Private: config UI helpers ────────────────────────────────────────────

    private _readConfigFromUI(): MaterialConfig {
        const int = (id: string, fallback: number) => {
            const v = parseInt((document.getElementById(id) as HTMLInputElement)?.value ?? '');
            return isNaN(v) || v < 0 ? fallback : v;
        };
        const radio = (name: string) =>
            (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value;
        return {
            roundCount:  int('materialRoundCount', 0),
            orientation: (radio('materialOrientation') as MaterialConfig['orientation']) ?? 'white',
        };
    }

    private _applyConfigToUI(config: MaterialConfig): void {
        const el = document.getElementById('materialRoundCount') as HTMLInputElement | null;
        if (el) el.value = config.roundCount.toString();
        const radio = document.querySelector<HTMLInputElement>(
            `input[name="materialOrientation"][value="${config.orientation}"]`);
        if (radio) radio.checked = true;
    }

    // ── Private: event listeners ──────────────────────────────────────────────

    private _setupEventListeners(): void {
        // Start screen
        document.getElementById('materialBackFromStartBtn')
            ?.addEventListener('click', () => this.ctx.uiManager.showHomeScreen());
        document.getElementById('materialStartGameBtn')
            ?.addEventListener('click', () => {
                const config = this._readConfigFromUI();
                MaterialGame.saveConfig(config);
                this._launch(config);
            });

        // In-game header back button
        document.getElementById('materialBackInGameBtn')
            ?.addEventListener('click', () => this._backToStart());

        // End session button
        document.getElementById('materialEndBtn')
            ?.addEventListener('click', () => this._backToStart());

        // Side toggle
        document.getElementById('materialSideWhite')
            ?.addEventListener('click', () => this._selectSide('white'));
        document.getElementById('materialSideEqual')
            ?.addEventListener('click', () => this._selectSide('equal'));
        document.getElementById('materialSideBlack')
            ?.addEventListener('click', () => this._selectSide('black'));

        // Stepper
        document.getElementById('materialValueMinus')
            ?.addEventListener('click', () => this._adjustValue(-1));
        document.getElementById('materialValuePlus')
            ?.addEventListener('click', () => this._adjustValue(+1));

        // Submit
        document.getElementById('materialSubmit')
            ?.addEventListener('click', () => this._submitAnswer());

        // Result screen
        document.getElementById('materialResPlayAgainBtn')
            ?.addEventListener('click', () => this._restart());
        document.getElementById('materialResGoHomeBtn')
            ?.addEventListener('click', () => this._backToStart());
        document.getElementById('materialResGoGamesBtn')
            ?.addEventListener('click', () => this.ctx.goHome());
        document.getElementById('materialResGoStatsBtn')
            ?.addEventListener('click', () => this.ctx.openStats());
    }

    private _setupAutoSave(): void {
        const onChange = () => MaterialGame.saveConfig(this._readConfigFromUI());
        document.getElementById('materialRoundCount')
            ?.addEventListener('change', onChange);
        document.querySelectorAll('input[name="materialOrientation"]')
            .forEach(el => el.addEventListener('change', onChange));
    }
}
