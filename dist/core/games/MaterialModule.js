/**
 * Модуль игры «Материальный перевес».
 * Показывается позиция; игрок угадывает у кого перевес и на сколько очков.
 */
import { MaterialGame } from '../MaterialGame.js';
import { materialStatsManager } from '../MaterialStatsManager.js';
import { setEl } from '../../utils/dom-utils.js';
import { shuffleArray } from '../../utils/chess-utils.js';
export class MaterialModule {
    constructor() {
        this.descriptor = {
            id: 'material',
            name: 'Материальный перевес',
            selectBtnId: 'selectMaterialGame',
            startScreenId: 'materialStartScreen',
            gameScreenId: 'materialGameScreen',
            statsTabId: 'tabMaterial',
            statsTabPanelId: 'statsTabMaterial',
        };
        this.game = null;
    }
    // ─────────────────────────────────────────────────────────────────────────
    init(ctx) {
        this.ctx = ctx;
        this._setupEventListeners();
        this._setupAutoSave();
    }
    onSelected() {
        const config = MaterialGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    destroy() {
        if (this.game) {
            this.game.destroy();
            this.game = null;
        }
    }
    renderStats() {
        this._renderAllTimeStats();
    }
    redrawBoard() {
        // Chessground resizes automatically via CSS; no explicit redraw needed.
    }
    // ── Private ───────────────────────────────────────────────────────────────
    _launch(config) {
        this.destroy();
        const allPuzzles = this.ctx.getPuzzleManager().getAllPuzzles();
        // Use a shuffled copy so each session has a different order
        const puzzles = shuffleArray([...allPuzzles]);
        this.game = new MaterialGame(this.ctx.Chessground, puzzles, config, (result) => this._showResults(result));
        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this.game.start();
    }
    _backToStart() {
        this.destroy();
        const config = MaterialGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    _restart() {
        const config = MaterialGame.loadConfig();
        this._launch(config);
    }
    _showResults(result) {
        const total = result.correct + result.incorrect;
        setEl('materialResCorrect', String(result.correct));
        setEl('materialResIncorrect', String(result.incorrect));
        setEl('materialResAccuracy', total > 0 ? `${Math.round(result.correct / total * 100)}%` : '—');
        setEl('materialResBestStreak', String(result.bestStreak));
        this._renderAllTimeStats();
        this.ctx.uiManager.switchView('materialResultScreen');
    }
    _renderAllTimeStats() {
        const s = materialStatsManager.load();
        const allTotal = s.totalCorrect + s.totalIncorrect;
        const accuracy = allTotal > 0 ? `${Math.round(s.totalCorrect / allTotal * 100)}%` : '—';
        // Stats tab
        setEl('matStatSessions', String(s.totalSessions));
        setEl('matStatAccuracy', accuracy);
        setEl('matStatStreak', String(s.bestStreak));
        setEl('matStatCorrect', String(s.totalCorrect));
        setEl('matStatIncorrect', String(s.totalIncorrect));
        // Result screen
        setEl('materialAllTimeSessions', String(s.totalSessions));
        setEl('materialAllTimeAccuracy', accuracy);
        setEl('materialAllTimeStreak', String(s.bestStreak));
        setEl('materialAllTimeCorrect', String(s.totalCorrect));
        setEl('materialAllTimeIncorrect', String(s.totalIncorrect));
    }
    // ── DOM helpers ───────────────────────────────────────────────────────────
    _readConfigFromUI() {
        const int = (id, fallback) => {
            const v = parseInt(document.getElementById(id)?.value ?? '');
            return isNaN(v) || v < 0 ? fallback : v;
        };
        const radio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
        return {
            roundCount: int('materialRoundCount', 0),
            orientation: radio('materialOrientation') ?? 'white',
        };
    }
    _applyConfigToUI(config) {
        const roundInput = document.getElementById('materialRoundCount');
        if (roundInput)
            roundInput.value = config.roundCount.toString();
        const el = document.querySelector(`input[name="materialOrientation"][value="${config.orientation}"]`);
        if (el)
            el.checked = true;
    }
    // ── Event wiring ──────────────────────────────────────────────────────────
    _setupEventListeners() {
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
                const val = Number(e.currentTarget.dataset['value']);
                if (!isNaN(val))
                    this.game?.answer(val);
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
    _setupAutoSave() {
        const onChange = () => MaterialGame.saveConfig(this._readConfigFromUI());
        document.getElementById('materialRoundCount')?.addEventListener('change', onChange);
        document.querySelectorAll('input[name="materialOrientation"]')
            .forEach(el => el.addEventListener('change', onChange));
    }
}
//# sourceMappingURL=MaterialModule.js.map