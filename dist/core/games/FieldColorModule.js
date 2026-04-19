/**
 * Модуль игры «Цвет поля».
 * Самодостаточен: управляет своими event listeners, конфигом и жизненным циклом.
 * ChessVisionTrainer не знает деталей этой игры — только вызывает init() и onSelected().
 */
import { FieldColorGame } from '../FieldColorGame.js';
import { fcStatsManager } from '../FieldColorStatsManager.js';
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
        this._listeners = [];
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
            window.removeEventListener('keydown', this._keyHandler, { capture: true });
            this._keyHandler = null;
        }
        this._listeners.forEach(([el, ev, fn]) => el.removeEventListener(ev, fn));
        this._listeners = [];
    }
    // ─────────────────────────────────────────────────────────────────────
    _launch(config) {
        this.destroy();
        this._setupKeyboard();
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
        this._launch(FieldColorGame.loadConfig());
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
        setEl('fcAllTimeStreak', String(s.allTimeBestStreak));
    }
    // ─────────────────────────────────────────────────────────────────────
    _readConfigFromUI() {
        const radio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
        const int = (id, fallback) => {
            const v = parseInt(document.getElementById(id)?.value ?? '', 10);
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
    /** Registers a tracked event listener that will be removed on destroy(). */
    _on(target, event, handler) {
        if (!target)
            return;
        target.addEventListener(event, handler);
        this._listeners.push([target, event, handler]);
    }
    _setupEventListeners() {
        this._on(document.getElementById('fcBackFromStartBtn'), 'click', () => this.ctx.uiManager.showHomeScreen());
        this._on(document.getElementById('fcStartGameBtn'), 'click', () => {
            const config = this._readConfigFromUI();
            FieldColorGame.saveConfig(config);
            this._launch(config);
        });
        this._on(document.getElementById('fcBackBtn'), 'click', () => this._backToStart());
        this._on(document.getElementById('fcWhiteBtn'), 'click', () => this.game?.answer(true));
        this._on(document.getElementById('fcBlackBtn'), 'click', () => this.game?.answer(false));
        this._on(document.getElementById('fcResPlayAgainBtn'), 'click', () => this._restart());
        this._on(document.getElementById('fcResGoHomeBtn'), 'click', () => this._backToStart());
        this._on(document.getElementById('fcResGoGamesBtn'), 'click', () => this.ctx.goHome());
        this._on(document.getElementById('fcResGoStatsBtn'), 'click', () => this.ctx.openStats());
    }
    _setupKeyboard() {
        if (this._keyHandler)
            return; // уже зарегистрирован
        this._keyHandler = (e) => {
            if (!this.game)
                return;
            if (e.target.tagName === 'INPUT')
                return;
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                e.stopPropagation();
                this.game.answer(true);
            }
            else if (e.key === 'ArrowDown') {
                e.preventDefault();
                e.stopPropagation();
                this.game.answer(false);
            }
        };
        window.addEventListener('keydown', this._keyHandler, { capture: true });
    }
    _setupAutoSave() {
        const onChange = () => FieldColorGame.saveConfig(this._readConfigFromUI());
        ['fcBoardStyle', 'fcOrientation'].forEach(name => document.querySelectorAll(`input[name="${name}"]`)
            .forEach(el => this._on(el, 'change', onChange)));
        this._on(document.getElementById('fcTimeModeInput'), 'change', onChange);
        this._on(document.getElementById('fcRoundCountInput'), 'change', onChange);
        this._on(document.getElementById('fcShowCoords'), 'change', onChange);
    }
}
//# sourceMappingURL=FieldColorModule.js.map