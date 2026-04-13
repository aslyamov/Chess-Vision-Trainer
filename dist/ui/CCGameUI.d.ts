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
import type { UIManager } from './UIManager.js';
import type { SessionConfig, CCSessionStats, CCOverallStats, LocaleData } from '../types/index.js';
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
export declare class CCGameUI implements IGameUI {
    private dom;
    private uiManager;
    private statusManager;
    constructor(uiManager: UIManager, langData: LocaleData);
    getStatusManager(): StatusManager;
    getBoardElement(): HTMLElement;
    updateLanguage(langData: LocaleData): void;
    showGameScreen(): void;
    showResults(stats: CCSessionStats, overallStats?: CCOverallStats): void;
    applySettings(config: SessionConfig): void;
    updateProgress(current: number, total: number): void;
    updateTaskIndicator(visible: boolean, name?: string): void;
    updateCounter(id: string, found: number, total: number): void;
    getSessionConfig(): SessionConfig;
    updateAvailableCount(count: number): void;
    /** Рендер вкладки CC на экране статистики */
    renderStatsTab(): void;
    private _cacheDom;
    private _updateAllTimeStats;
    private _updateOverallProgress;
}
//# sourceMappingURL=CCGameUI.d.ts.map