/**
 * CCGameUI — UI-слой для игры «Шахи и взятия».
 *
 * Отвечает за:
 *   - CC-специфичный DOM-кэш (доска, счётчики, логи, экран результатов)
 *   - Реализацию интерфейса IGameUI, который потребляет GameSession
 *   - getSessionConfig() / updateAvailableCount() — чтение настроек из формы
 *   - Владение StatusManager (создаёт и хранит его)
 *
 * UIManager знает только о переключении view; всё CC-специфичное — здесь.
 * При добавлении игры 3 создаётся аналогичный файл (Game3UI.ts).
 */
import { StatusManager } from './StatusManager.js';
import { statsManager } from '../core/StatsManager.js';
import { commonStatsManager } from '../core/CommonStatsManager.js';
import { formatTime } from '../utils/chess-utils.js';
import { setEl } from '../utils/dom-utils.js';
// ─── CCGameUI ────────────────────────────────────────────────────────────────
export class CCGameUI {
    constructor(uiManager, langData) {
        this.uiManager = uiManager;
        this.dom = this._cacheDom();
        const statusDom = {
            statusMessage: document.getElementById('statusMessage'),
            logWhite: document.getElementById('log-white'),
            logBlack: document.getElementById('log-black'),
            gameTimer: document.getElementById('gameTimer'),
        };
        this.statusManager = new StatusManager(statusDom, langData);
    }
    // ── Accessors ─────────────────────────────────────────────────────────────
    getStatusManager() { return this.statusManager; }
    getBoardElement() { return this.dom.board; }
    updateLanguage(langData) {
        this.statusManager.updateLanguage(langData);
    }
    // ── IGameUI ───────────────────────────────────────────────────────────────
    showGameScreen() {
        this.uiManager.showGameScreen();
    }
    showResults(stats, overallStats) {
        // Статистика сессии
        setEl('resTotalSolved', String(stats.solved));
        setEl('resTotalTime', formatTime(stats.time));
        setEl('resAccuracy', `${Math.round(stats.accuracy)}%`);
        setEl('resAvgTime', formatTime(stats.avgTime));
        // Ходы по категориям
        const ms = stats.moveStats;
        const upd = (fId, tId, found, total) => {
            setEl(fId, String(found));
            setEl(tId, String(total));
        };
        upd('resWChecks', 'resWChecksTotal', ms.wChecks.found, ms.wChecks.total);
        upd('resWCaptures', 'resWCapturesTotal', ms.wCaptures.found, ms.wCaptures.total);
        upd('resBChecks', 'resBChecksTotal', ms.bChecks.found, ms.bChecks.total);
        upd('resBCaptures', 'resBCapturesTotal', ms.bCaptures.found, ms.bCaptures.total);
        // Прогресс по задачнику
        if (overallStats) {
            this._updateOverallProgress(overallStats);
        }
        // Статистика за всё время
        this._updateAllTimeStats();
        // Переключаем на экран результатов (он внутри gameScreen)
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });
        const gameScreen = document.getElementById('gameScreen');
        const resultScreen = document.getElementById('resultScreen');
        if (gameScreen && resultScreen) {
            gameScreen.classList.remove('hidden');
            resultScreen.classList.remove('hidden');
            resultScreen.classList.add('active');
        }
    }
    applySettings(config) {
        this.dom.statsContainer?.classList.toggle('hidden', !config.showHints);
        this.dom.logContainer?.classList.toggle('hidden', !config.showLog);
        const statusMsg = document.getElementById('statusMessage');
        statusMsg?.classList.toggle('invisible', !config.showText);
    }
    updateProgress(current, total) {
        const el = this.dom.progressDisplay;
        if (el)
            el.textContent = `${current} / ${total}`;
    }
    updateTaskIndicator(visible, name = '') {
        const ind = this.dom.taskIndicator;
        if (!ind)
            return;
        if (visible) {
            ind.classList.remove('hidden');
            if (this.dom.currentTaskName)
                this.dom.currentTaskName.textContent = name;
        }
        else {
            ind.classList.add('hidden');
        }
    }
    updateCounter(id, found, total) {
        const map = {
            'w-checks': this.dom.wChecks,
            'w-captures': this.dom.wCaptures,
            'b-checks': this.dom.bChecks,
            'b-captures': this.dom.bCaptures,
        };
        const el = map[id];
        if (!el)
            return;
        const remaining = total - found;
        el.textContent = (total === 0 || remaining === 0) ? '' : String(remaining);
    }
    // ── CC-specific ───────────────────────────────────────────────────────────
    getSessionConfig() {
        const radio = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value || '';
        const checked = (id) => document.getElementById(id)?.checked ?? false;
        const countInput = document.getElementById('taskCountInput');
        const limitInput = document.getElementById('timeLimitInput');
        const rawCount = countInput ? parseInt(countInput.value) : 10;
        const validCount = Math.max(1, Math.min(100, isNaN(rawCount) ? 10 : rawCount));
        if (countInput)
            countInput.value = String(validCount);
        return {
            difficulty: radio('difficulty') || 'medium',
            taskCount: validCount,
            timeLimit: parseInt(limitInput?.value || '0'),
            sequentialMode: checked('setSequential'),
            highlightFound: checked('setHighlights'),
            showLog: checked('setShowLog'),
            showHints: checked('setHints'),
            showText: checked('setStatusText'),
            goodMovesOnly: checked('setGoodMoves'),
            showCoordinates: true,
            hideLegalMoves: !checked('setShowDests'),
        };
    }
    updateAvailableCount(count) {
        const label = document.getElementById('maxPuzzlesCount');
        if (label)
            label.textContent = String(count);
        const input = document.getElementById('taskCountInput');
        input?.setAttribute('max', String(count));
    }
    /** Рендер вкладки CC на экране статистики */
    renderStatsTab() {
        const s = statsManager.getAllTimeStats();
        setEl('ccStatsSessions', String(s.totalSessions));
        setEl('ccStatsAccuracy', `${Math.round(s.avgAccuracy)}%`);
        setEl('ccStatsPuzzles', String(s.totalPuzzlesSolved));
        const ms = s.moveStats;
        setEl('ccStatsWChecks', `${ms.wChecks.found}/${ms.wChecks.total}`);
        setEl('ccStatsWCaptures', `${ms.wCaptures.found}/${ms.wCaptures.total}`);
        setEl('ccStatsBChecks', `${ms.bChecks.found}/${ms.bChecks.total}`);
        setEl('ccStatsBCaptures', `${ms.bCaptures.found}/${ms.bCaptures.total}`);
    }
    // ── Private ───────────────────────────────────────────────────────────────
    _cacheDom() {
        const board = document.getElementById('board');
        if (!board)
            throw new Error('CCGameUI: #board element not found');
        return {
            board,
            progressDisplay: document.getElementById('progressDisplay'),
            taskIndicator: document.getElementById('taskIndicator'),
            currentTaskName: document.getElementById('currentTaskName'),
            statsContainer: document.getElementById('statsContainer'),
            logContainer: document.getElementById('logContainer'),
            wChecks: document.getElementById('w-checks'),
            wCaptures: document.getElementById('w-captures'),
            bChecks: document.getElementById('b-checks'),
            bCaptures: document.getElementById('b-captures'),
        };
    }
    _updateAllTimeStats() {
        const s = statsManager.getAllTimeStats();
        setEl('allTimeSessions', String(s.totalSessions));
        setEl('allTimeAccuracy', `${Math.round(s.avgAccuracy)}%`);
        setEl('allTimeStreak', String(commonStatsManager.getStats().currentStreak));
        const ms = s.moveStats;
        const upd = (fId, tId, found, total) => {
            setEl(fId, String(found));
            setEl(tId, String(total));
        };
        upd('allWChecks', 'allWChecksTotal', ms.wChecks.found, ms.wChecks.total);
        upd('allWCaptures', 'allWCapturesTotal', ms.wCaptures.found, ms.wCaptures.total);
        upd('allBChecks', 'allBChecksTotal', ms.bChecks.found, ms.bChecks.total);
        upd('allBCaptures', 'allBCapturesTotal', ms.bCaptures.found, ms.bCaptures.total);
    }
    _updateOverallProgress(stats) {
        const setBar = (barId, cntId, totId, solved, total) => {
            const bar = document.getElementById(barId);
            if (bar)
                bar.value = total > 0 ? (solved / total) * 100 : 0;
            const cnt = document.getElementById(cntId);
            const tot = document.getElementById(totId);
            if (cnt)
                cnt.textContent = String(solved);
            if (tot)
                tot.textContent = String(total);
        };
        setBar('overallProgressBar', 'overallSolved', 'overallTotal', stats.totalSolved, stats.totalPuzzles);
        setBar('easyProgressBar', 'easyCount', 'easyTotal', stats.easy.solved, stats.easy.total);
        setBar('mediumProgressBar', 'mediumCount', 'mediumTotal', stats.medium.solved, stats.medium.total);
        setBar('hardProgressBar', 'hardCount', 'hardTotal', stats.hard.solved, stats.hard.total);
    }
}
//# sourceMappingURL=CCGameUI.js.map