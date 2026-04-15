/**
 * Модуль игры «Цвет поля».
 * Самодостаточен: управляет своими event listeners, конфигом и жизненным циклом.
 * ChessVisionTrainer не знает деталей этой игры — только вызывает init() и onSelected().
 */
import { FieldColorGame } from '../FieldColorGame.js';
import { fcStatsManager } from '../FieldColorStatsManager.js';
import { commonStatsManager } from '../CommonStatsManager.js';
import { setEl } from '../../utils/dom-utils.js';
export class FieldColorModule {
    constructor() {
        this.descriptor = {
            id: 'field-color',
            name: 'Цвет поля',
            selectBtnId: 'selectFieldColorGame',
            startScreenId: 'fieldColorStartScreen',
            gameScreenId: 'fieldColorScreen',
            statsTabId: 'tabFC',
            statsTabPanelId: 'statsTabFC',
        };
        this.game = null;
        this._keyHandler = null;
    }
    // ─────────────────────────────────────────────────────────────────────
    init(ctx) {
        this.ctx = ctx;
        this._setupEventListeners();
        this._setupAutoSave();
        this._setupKeyboard();
    }
    onSelected() {
        const config = FieldColorGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    destroy() {
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
    _launch(config) {
        this.destroy();
        this.game = new FieldColorGame(this.ctx.Chessground, config, (result) => {
            this._showResults(result);
        });
        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this.game.start();
    }
    _backToStart() {
        this.destroy();
        const config = FieldColorGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    _restart() {
        const config = FieldColorGame.loadConfig();
        this.destroy();
        this.game = new FieldColorGame(this.ctx.Chessground, config, (result) => {
            this._showResults(result);
        });
        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this.game.start();
    }
    renderStats() {
        this._renderAllTimeStats();
    }
    _showResults(result) {
        const total = result.correct + result.incorrect;
        setEl('fcResCorrect', String(result.correct));
        setEl('fcResIncorrect', String(result.incorrect));
        setEl('fcResAccuracy', `${total > 0 ? Math.round(result.correct / total * 100) : 0}%`);
        setEl('fcResBestStreak', String(result.bestStreak));
        this._renderAllTimeStats();
        this.ctx.uiManager.switchView('fcResultScreen');
    }
    _renderAllTimeStats() {
        const s = fcStatsManager.load();
        const allTotal = s.totalCorrect + s.totalIncorrect;
        setEl('fcAllTimeSessions', String(s.totalSessions));
        setEl('fcAllTimeAccuracy', allTotal > 0 ? `${Math.round(s.totalCorrect / allTotal * 100)}%` : '—');
        setEl('fcAllTimeCorrect', String(s.totalCorrect));
        setEl('fcAllTimeIncorrect', String(s.totalIncorrect));
        setEl('fcAllTimeStreak', String(commonStatsManager.getStats().currentStreak));
    }
    // ─────────────────────────────────────────────────────────────────────
    _readConfigFromUI() {
        const radio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
        const int = (id, fallback) => {
            const v = parseInt(document.getElementById(id)?.value ?? '');
            return isNaN(v) || v < 0 ? fallback : v;
        };
        return {
            boardStyle: radio('fcBoardStyle') ?? 'colored',
            orientation: radio('fcOrientation') ?? 'white',
            showCoordinates: document.getElementById('fcShowCoords')?.checked ?? true,
            timeMode: int('fcTimeModeInput', 0),
            roundCount: int('fcRoundCountInput', 0),
        };
    }
    _applyConfigToUI(config) {
        const setRadio = (name, val) => {
            const el = document.querySelector(`input[name="${name}"][value="${val}"]`);
            if (el)
                el.checked = true;
        };
        setRadio('fcBoardStyle', config.boardStyle);
        setRadio('fcOrientation', config.orientation);
        const timeModeInput = document.getElementById('fcTimeModeInput');
        if (timeModeInput)
            timeModeInput.value = config.timeMode.toString();
        const roundInput = document.getElementById('fcRoundCountInput');
        if (roundInput)
            roundInput.value = config.roundCount.toString();
        const coords = document.getElementById('fcShowCoords');
        if (coords)
            coords.checked = config.showCoordinates;
    }
    _setupEventListeners() {
        document.getElementById('fcBackFromStartBtn')?.addEventListener('click', () => this.ctx.uiManager.showHomeScreen());
        document.getElementById('fcStartGameBtn')?.addEventListener('click', () => {
            const config = this._readConfigFromUI();
            FieldColorGame.saveConfig(config);
            this._launch(config);
        });
        document.getElementById('fcBackBtn')?.addEventListener('click', () => this._backToStart());
        document.getElementById('fcWhiteBtn')?.addEventListener('click', () => this.game?.answer(true));
        document.getElementById('fcBlackBtn')?.addEventListener('click', () => this.game?.answer(false));
        document.getElementById('fcResPlayAgainBtn')?.addEventListener('click', () => this._restart());
        document.getElementById('fcResGoHomeBtn')?.addEventListener('click', () => this._backToStart());
        document.getElementById('fcResGoGamesBtn')?.addEventListener('click', () => this.ctx.goHome());
        document.getElementById('fcResGoStatsBtn')?.addEventListener('click', () => this.ctx.openStats());
    }
    _setupKeyboard() {
        this._keyHandler = (e) => {
            if (!this.game)
                return;
            if (e.target.tagName === 'INPUT')
                return;
            const key = e.key.toLowerCase();
            if (key === 'w')
                this.game.answer(true);
            else if (key === 'b')
                this.game.answer(false);
        };
        document.addEventListener('keydown', this._keyHandler);
    }
    _setupAutoSave() {
        const onChange = () => FieldColorGame.saveConfig(this._readConfigFromUI());
        ['fcBoardStyle', 'fcOrientation'].forEach(name => document.querySelectorAll(`input[name="${name}"]`)
            .forEach(el => el.addEventListener('change', onChange)));
        document.getElementById('fcTimeModeInput')?.addEventListener('change', onChange);
        document.getElementById('fcRoundCountInput')?.addEventListener('change', onChange);
        document.getElementById('fcShowCoords')?.addEventListener('change', onChange);
    }
}
//# sourceMappingURL=FieldColorModule.js.map