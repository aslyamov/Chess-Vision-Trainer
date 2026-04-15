/**
 * Модуль игры «Материальный перевес».
 * Управляет вводом ответа: тогл [Белые / Равно / Чёрные] + степпер числа + кнопка «Проверить».
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
        // ── Input state ───────────────────────────────────────────────────────────
        this.selectedSide = null;
        this.selectedValue = 1;
        this.inputLocked = false; // true during 950ms feedback delay
    }
    // ── IGameModule ───────────────────────────────────────────────────────────
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
    // ── Private: game lifecycle ───────────────────────────────────────────────
    _launch(config) {
        this.destroy();
        const allPuzzles = this.ctx.getPuzzleManager().getAllPuzzles();
        const puzzles = shuffleArray([...allPuzzles]);
        this.game = new MaterialGame(this.ctx.Chessground, puzzles, config, (result) => this._showResults(result), () => this._resetInput());
        this.ctx.uiManager.switchView(this.descriptor.gameScreenId);
        this._resetInput();
        this.game.start();
    }
    _backToStart() {
        this.destroy();
        const config = MaterialGame.loadConfig();
        this._applyConfigToUI(config);
        this.ctx.uiManager.switchView(this.descriptor.startScreenId);
    }
    _restart() {
        this._launch(MaterialGame.loadConfig());
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
    // ── Private: answer input ─────────────────────────────────────────────────
    _resetInput() {
        this.selectedSide = null;
        this.selectedValue = 1;
        this.inputLocked = false;
        this._renderInput();
    }
    _selectSide(side) {
        if (this.inputLocked)
            return;
        this.selectedSide = side;
        this._renderInput();
    }
    _adjustValue(delta) {
        if (this.inputLocked)
            return;
        this.selectedValue = Math.max(1, Math.min(9, this.selectedValue + delta));
        this._renderInput();
    }
    _submitAnswer() {
        if (this.inputLocked || !this.selectedSide || !this.game)
            return;
        const balance = this.selectedSide === 'white' ? this.selectedValue
            : this.selectedSide === 'black' ? -this.selectedValue
                : 0;
        if (!this.game.answer(balance))
            return;
        this.inputLocked = true;
        this._renderInput();
        // Re-enable after transition (game fires onPuzzleReady at ~950ms)
        // If game ended, onPuzzleReady won't fire; that's fine — game screen hides anyway.
    }
    _renderInput() {
        const hasSide = this.selectedSide !== null;
        const isEqual = this.selectedSide === 'equal';
        // Side buttons
        const sides = [
            { id: 'materialSideWhite', side: 'white', activeClass: 'btn-warning' },
            { id: 'materialSideEqual', side: 'equal', activeClass: 'btn-neutral' },
            { id: 'materialSideBlack', side: 'black', activeClass: 'btn-secondary' },
        ];
        sides.forEach(({ id, side, activeClass }) => {
            const btn = document.getElementById(id);
            if (!btn)
                return;
            btn.disabled = this.inputLocked;
            const active = this.selectedSide === side;
            // Remove all active classes, then add if needed
            btn.classList.remove('btn-warning', 'btn-neutral', 'btn-secondary');
            btn.classList.toggle('btn-outline', !active);
            if (active)
                btn.classList.add(activeClass);
        });
        // Value row visibility
        const valueRow = document.getElementById('materialValueRow');
        if (valueRow)
            valueRow.classList.toggle('hidden', isEqual);
        // Value display
        setEl('materialValueDisplay', String(this.selectedValue));
        // Stepper buttons
        const minus = document.getElementById('materialValueMinus');
        const plus = document.getElementById('materialValuePlus');
        if (minus)
            minus.disabled = this.inputLocked || this.selectedValue <= 1;
        if (plus)
            plus.disabled = this.inputLocked || this.selectedValue >= 9;
        // Submit button
        const submit = document.getElementById('materialSubmit');
        if (submit)
            submit.disabled = !hasSide || this.inputLocked;
    }
    // ── Private: config UI helpers ────────────────────────────────────────────
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
        const el = document.getElementById('materialRoundCount');
        if (el)
            el.value = config.roundCount.toString();
        const radio = document.querySelector(`input[name="materialOrientation"][value="${config.orientation}"]`);
        if (radio)
            radio.checked = true;
    }
    // ── Private: event listeners ──────────────────────────────────────────────
    _setupEventListeners() {
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
    _setupAutoSave() {
        const onChange = () => MaterialGame.saveConfig(this._readConfigFromUI());
        document.getElementById('materialRoundCount')
            ?.addEventListener('change', onChange);
        document.querySelectorAll('input[name="materialOrientation"]')
            .forEach(el => el.addEventListener('change', onChange));
    }
}
//# sourceMappingURL=MaterialModule.js.map