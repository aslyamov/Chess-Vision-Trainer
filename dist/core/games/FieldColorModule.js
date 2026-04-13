/**
 * Модуль игры «Цвет поля».
 * Самодостаточен: управляет своими event listeners, конфигом и жизненным циклом.
 * ChessVisionTrainer не знает деталей этой игры — только вызывает init() и onSelected().
 */
import { FieldColorGame } from '../FieldColorGame.js';
import { FIELD_COLOR_STATS_KEY } from '../../constants.js';
import { commonStatsManager } from '../CommonStatsManager.js';
export class FieldColorModule {
    constructor() {
        this.descriptor = {
            id: 'field-color',
            name: 'Цвет поля',
            selectBtnId: 'selectFieldColorGame',
            startScreenId: 'fieldColorStartScreen',
            gameScreenId: 'fieldColorScreen',
        };
        this.game = null;
    }
    // ─────────────────────────────────────────────────────────────────────
    init(ctx) {
        this.ctx = ctx;
        this._setupEventListeners();
        this._setupAutoSave();
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
    _showResults(result) {
        const set = (id, v) => {
            const el = document.getElementById(id);
            if (el)
                el.textContent = v;
        };
        const total = result.correct + result.incorrect;
        // Session stats
        set('fcResCorrect', String(result.correct));
        set('fcResIncorrect', String(result.incorrect));
        set('fcResAccuracy', `${total > 0 ? Math.round(result.correct / total * 100) : 0}%`);
        set('fcResBestStreak', String(result.bestStreak));
        // All-time stats
        try {
            const raw = localStorage.getItem(FIELD_COLOR_STATS_KEY);
            const s = raw ? JSON.parse(raw)
                : { totalSessions: 0, totalCorrect: 0, totalIncorrect: 0, allTimeBestStreak: 0 };
            const allTotal = s.totalCorrect + s.totalIncorrect;
            set('fcAllTimeSessions', String(s.totalSessions));
            set('fcAllTimeAccuracy', allTotal > 0 ? `${Math.round(s.totalCorrect / allTotal * 100)}%` : '—');
            set('fcAllTimeCorrect', String(s.totalCorrect));
            set('fcAllTimeIncorrect', String(s.totalIncorrect));
            set('fcAllTimeStreak', String(commonStatsManager.getStats().currentStreak));
        }
        catch { /* нули из HTML */ }
        this.ctx.uiManager.switchView('fcResultScreen');
    }
    // ─────────────────────────────────────────────────────────────────────
    _readConfigFromUI() {
        const radio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
        const int = (id, fallback) => Math.max(0, parseInt(document.getElementById(id)?.value ?? '') || fallback);
        return {
            boardStyle: radio('fcBoardStyle') ?? 'colored',
            orientation: radio('fcOrientation') ?? 'white',
            showCoordinates: document.getElementById('fcShowCoords')?.checked ?? true,
            timeMode: int('fcTimeModeInput', 0),
            roundCount: int('fcRoundCountInput', 20),
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