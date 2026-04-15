/**
 * Модуль игры «Материальный перевес».
 * Показывается позиция; игрок угадывает у кого перевес и на сколько очков.
 */

import { MaterialGame } from '../MaterialGame.js';
import { materialStatsManager } from '../MaterialStatsManager.js';
import { setEl } from '../../utils/dom-utils.js';
import { shuffleArray } from '../../utils/chess-utils.js';
import type { IGameModule, GameDescriptor, AppContext } from '../IGame.js';
import type { MaterialConfig, MaterialResult } from '../../types/index.js';

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

    // ─────────────────────────────────────────────────────────────────────────

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

    redrawBoard(): void {
        // Chessground resizes automatically via CSS; no explicit redraw needed.
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private _launch(config: MaterialConfig): void {
        this.destroy();

        const allPuzzles = this.ctx.getPuzzleManager().getAllPuzzles();
        // Use a shuffled copy so each session has a different order
        const puzzles = shuffleArray([...allPuzzles]);

        this.game = new MaterialGame(
            this.ctx.Chessground,
            puzzles,
            config,
            (result) => this._showResults(result),
        );

        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this.game.start();
    }

    private _backToStart(): void {
        this.destroy();
        const config = MaterialGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }

    private _restart(): void {
        const config = MaterialGame.loadConfig();
        this._launch(config);
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
        const s = materialStatsManager.load();
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

    // ── DOM helpers ───────────────────────────────────────────────────────────

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
        const roundInput = document.getElementById('materialRoundCount') as HTMLInputElement | null;
        if (roundInput) roundInput.value = config.roundCount.toString();

        const el = document.querySelector<HTMLInputElement>(
            `input[name="materialOrientation"][value="${config.orientation}"]`);
        if (el) el.checked = true;
    }

    // ── Event wiring ──────────────────────────────────────────────────────────

    private _setupEventListeners(): void {
        document.getElementById('materialBackFromStartBtn')
            ?.addEventListener('click', () => this.ctx.uiManager.showHomeScreen());

        document.getElementById('materialStartGameBtn')
            ?.addEventListener('click', () => {
                const config = this._readConfigFromUI();
                MaterialGame.saveConfig(config);
                this._launch(config);
            });

        document.getElementById('materialBackInGameBtn')
            ?.addEventListener('click', () => this._backToStart());

        document.getElementById('materialEndBtn')
            ?.addEventListener('click', () => this._backToStart());

        // Answer buttons — wired once, delegate to active game
        for (let i = 0; i < 5; i++) {
            document.getElementById(`materialOpt${i}`)
                ?.addEventListener('click', (e) => {
                    const val = Number((e.currentTarget as HTMLButtonElement).dataset['value']);
                    if (!isNaN(val)) this.game?.answer(val);
                });
        }

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
        document.getElementById('materialRoundCount')?.addEventListener('change', onChange);
        document.querySelectorAll('input[name="materialOrientation"]')
            .forEach(el => el.addEventListener('change', onChange));
    }
}
