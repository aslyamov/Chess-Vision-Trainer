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
import { statsManager }  from '../core/StatsManager.js';
import { commonStatsManager } from '../core/CommonStatsManager.js';
import { formatTime }    from '../utils/chess-utils.js';
import type { UIManager } from './UIManager.js';
import type {
    SessionConfig,
    CCSessionStats,
    CCOverallStats,
    CCStatusDom,
    LocaleData,
} from '../types/index.js';

// ─── CC DOM cache ─────────────────────────────────────────────────────────────

interface CCDom {
    board:           HTMLElement;
    progressDisplay: HTMLElement | null;
    taskIndicator:   HTMLElement | null;
    currentTaskName: HTMLElement | null;
    statsContainer:  HTMLElement | null;
    logContainer:    HTMLElement | null;
    wChecks:         HTMLElement | null;
    wCaptures:       HTMLElement | null;
    bChecks:         HTMLElement | null;
    bCaptures:       HTMLElement | null;
}

// ─── IGameUI interface (consumed by GameSession) ──────────────────────────────

/**
 * Интерфейс, ожидаемый GameSession от UI-провайдера.
 * Экспортируется, чтобы GameSession мог использовать его как тип параметра.
 */
export interface IGameUI {
    showGameScreen(): void;
    showResults(stats: CCSessionStats, overallStats?: CCOverallStats): void;
    applySettings(config: SessionConfig): void;
    updateProgress(current: number, total: number): void;
    updateTaskIndicator(visible: boolean, name?: string): void;
    updateCounter(id: string, found: number, total: number): void;
}

// ─── CCGameUI ────────────────────────────────────────────────────────────────

export class CCGameUI implements IGameUI {
    private dom:           CCDom;
    private uiManager:     UIManager;
    private statusManager: StatusManager;

    constructor(uiManager: UIManager, langData: LocaleData) {
        this.uiManager = uiManager;
        this.dom       = this._cacheDom();

        const statusDom: CCStatusDom = {
            statusMessage: document.getElementById('statusMessage'),
            logWhite:      document.getElementById('log-white'),
            logBlack:      document.getElementById('log-black'),
            gameTimer:     document.getElementById('gameTimer'),
        };
        this.statusManager = new StatusManager(statusDom, langData);
    }

    // ── Accessors ─────────────────────────────────────────────────────────────

    getStatusManager(): StatusManager { return this.statusManager; }
    getBoardElement():  HTMLElement   { return this.dom.board; }

    updateLanguage(langData: LocaleData): void {
        this.statusManager.updateLanguage(langData);
    }

    // ── IGameUI ───────────────────────────────────────────────────────────────

    showGameScreen(): void {
        this.uiManager.showGameScreen();
    }

    showResults(stats: CCSessionStats, overallStats?: CCOverallStats): void {
        const set = (id: string, v: string) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
        };

        // Статистика сессии
        set('resTotalSolved', String(stats.solved));
        set('resTotalTime',   formatTime(stats.time));
        set('resAccuracy',    `${Math.round(stats.accuracy)}%`);
        set('resAvgTime',     formatTime(stats.avgTime));

        // Ходы по категориям
        const ms = stats.moveStats;
        const upd = (fId: string, tId: string, found: number, total: number) => {
            set(fId, String(found));
            set(tId, String(total));
        };
        upd('resWChecks',    'resWChecksTotal',    ms.wChecks.found,    ms.wChecks.total);
        upd('resWCaptures',  'resWCapturesTotal',  ms.wCaptures.found,  ms.wCaptures.total);
        upd('resBChecks',    'resBChecksTotal',    ms.bChecks.found,    ms.bChecks.total);
        upd('resBCaptures',  'resBCapturesTotal',  ms.bCaptures.found,  ms.bCaptures.total);

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
        const gameScreen   = document.getElementById('gameScreen');
        const resultScreen = document.getElementById('resultScreen');
        if (gameScreen && resultScreen) {
            gameScreen.classList.remove('hidden');
            resultScreen.classList.remove('hidden');
            resultScreen.classList.add('active');
        }
    }

    applySettings(config: SessionConfig): void {
        this.dom.statsContainer?.classList.toggle('hidden', !config.showHints);
        this.dom.logContainer?.classList.toggle('hidden',   !config.showLog);
        const statusMsg = document.getElementById('statusMessage');
        statusMsg?.classList.toggle('invisible', !config.showText);
    }

    updateProgress(current: number, total: number): void {
        const el = this.dom.progressDisplay;
        if (el) el.textContent = `${current} / ${total}`;
    }

    updateTaskIndicator(visible: boolean, name = ''): void {
        const ind = this.dom.taskIndicator;
        if (!ind) return;
        if (visible) {
            ind.classList.remove('hidden');
            if (this.dom.currentTaskName) this.dom.currentTaskName.textContent = name;
        } else {
            ind.classList.add('hidden');
        }
    }

    updateCounter(id: string, found: number, total: number): void {
        const map: Record<string, HTMLElement | null> = {
            'w-checks':   this.dom.wChecks,
            'w-captures': this.dom.wCaptures,
            'b-checks':   this.dom.bChecks,
            'b-captures': this.dom.bCaptures,
        };
        const el = map[id];
        if (!el) return;
        const remaining = total - found;
        el.textContent = (total === 0 || remaining === 0) ? '' : String(remaining);
    }

    // ── CC-specific ───────────────────────────────────────────────────────────

    getSessionConfig(): SessionConfig {
        const radio = (name: string): string =>
            (document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement)?.value || '';
        const checked = (id: string): boolean =>
            (document.getElementById(id) as HTMLInputElement)?.checked ?? false;

        const countInput  = document.getElementById('taskCountInput')  as HTMLInputElement | null;
        const limitInput  = document.getElementById('timeLimitInput')  as HTMLInputElement | null;
        const rawCount    = countInput ? parseInt(countInput.value) : 10;
        const validCount  = Math.max(1, Math.min(100, isNaN(rawCount) ? 10 : rawCount));
        if (countInput) countInput.value = String(validCount);

        return {
            difficulty:      radio('difficulty') || 'medium',
            taskCount:       validCount,
            timeLimit:       parseInt(limitInput?.value || '0'),
            sequentialMode:  checked('setSequential'),
            highlightFound:  checked('setHighlights'),
            showLog:         checked('setShowLog'),
            showHints:       checked('setHints'),
            showText:        checked('setStatusText'),
            goodMovesOnly:   checked('setGoodMoves'),
            showCoordinates: true,
            hideLegalMoves:  !checked('setShowDests'),
        };
    }

    updateAvailableCount(count: number): void {
        const label = document.getElementById('maxPuzzlesCount');
        if (label) label.textContent = String(count);
        const input = document.getElementById('taskCountInput');
        input?.setAttribute('max', String(count));
    }

    /** Рендер вкладки CC на экране статистики */
    renderStatsTab(): void {
        const s   = statsManager.getAllTimeStats();
        const set = (id: string, v: string) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
        };

        set('ccStatsSessions',  String(s.totalSessions));
        set('ccStatsAccuracy',  `${Math.round(s.avgAccuracy)}%`);
        set('ccStatsPuzzles',   String(s.totalPuzzlesSolved));

        const ms = s.moveStats;
        set('ccStatsWChecks',   `${ms.wChecks.found}/${ms.wChecks.total}`);
        set('ccStatsWCaptures', `${ms.wCaptures.found}/${ms.wCaptures.total}`);
        set('ccStatsBChecks',   `${ms.bChecks.found}/${ms.bChecks.total}`);
        set('ccStatsBCaptures', `${ms.bCaptures.found}/${ms.bCaptures.total}`);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private _cacheDom(): CCDom {
        const board = document.getElementById('board');
        if (!board) throw new Error('CCGameUI: #board element not found');

        return {
            board,
            progressDisplay: document.getElementById('progressDisplay'),
            taskIndicator:   document.getElementById('taskIndicator'),
            currentTaskName: document.getElementById('currentTaskName'),
            statsContainer:  document.getElementById('statsContainer'),
            logContainer:    document.getElementById('logContainer'),
            wChecks:         document.getElementById('w-checks'),
            wCaptures:       document.getElementById('w-captures'),
            bChecks:         document.getElementById('b-checks'),
            bCaptures:       document.getElementById('b-captures'),
        };
    }

    private _updateAllTimeStats(): void {
        const s   = statsManager.getAllTimeStats();
        const set = (id: string, v: string) => {
            const el = document.getElementById(id);
            if (el) el.textContent = v;
        };

        set('allTimeSessions', String(s.totalSessions));
        set('allTimeAccuracy', `${Math.round(s.avgAccuracy)}%`);
        set('allTimeStreak',   String(commonStatsManager.getStats().currentStreak));

        const ms = s.moveStats;
        const upd = (fId: string, tId: string, found: number, total: number) => {
            set(fId, String(found));
            set(tId, String(total));
        };
        upd('allWChecks',    'allWChecksTotal',    ms.wChecks.found,    ms.wChecks.total);
        upd('allWCaptures',  'allWCapturesTotal',  ms.wCaptures.found,  ms.wCaptures.total);
        upd('allBChecks',    'allBChecksTotal',    ms.bChecks.found,    ms.bChecks.total);
        upd('allBCaptures',  'allBCapturesTotal',  ms.bCaptures.found,  ms.bCaptures.total);
    }

    private _updateOverallProgress(stats: CCOverallStats): void {
        const setBar = (barId: string, cntId: string, totId: string, solved: number, total: number) => {
            const bar = document.getElementById(barId) as HTMLProgressElement | null;
            if (bar) bar.value = total > 0 ? (solved / total) * 100 : 0;
            const cnt = document.getElementById(cntId);
            const tot = document.getElementById(totId);
            if (cnt) cnt.textContent = String(solved);
            if (tot) tot.textContent = String(total);
        };

        setBar('overallProgressBar', 'overallSolved', 'overallTotal',   stats.totalSolved,    stats.totalPuzzles);
        setBar('easyProgressBar',    'easyCount',     'easyTotal',      stats.easy.solved,    stats.easy.total);
        setBar('mediumProgressBar',  'mediumCount',   'mediumTotal',    stats.medium.solved,  stats.medium.total);
        setBar('hardProgressBar',    'hardCount',     'hardTotal',      stats.hard.solved,    stats.hard.total);
    }
}
