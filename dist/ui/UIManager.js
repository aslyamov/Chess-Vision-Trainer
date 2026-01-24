/**
 * Central UI management - handles view switching, DOM caching, and UI updates
 * TypeScript версия
 */
import { formatTime } from '../utils/chess-utils.js';
export class UIManager {
    constructor() {
        this.dom = this._cacheDOM();
    }
    /**
     * Caches all DOM elements for fast access
     */
    _cacheDOM() {
        return {
            // Screens
            startScreen: document.getElementById('startScreen'),
            gameScreen: document.getElementById('gameScreen'),
            resultScreen: document.getElementById('resultScreen'),
            // Game elements
            board: document.getElementById('board'),
            progressDisplay: document.getElementById('progressDisplay'),
            taskIndicator: document.getElementById('taskIndicator'),
            currentTaskName: document.getElementById('currentTaskName'),
            statusMessage: document.getElementById('statusMessage'),
            gameTimer: document.getElementById('gameTimer'),
            // Stats and logs
            statsContainer: document.getElementById('statsContainer'),
            logContainer: document.getElementById('logContainer'),
            logWhite: document.getElementById('log-white'),
            logBlack: document.getElementById('log-black'),
            // Result screen
            resTotalSolved: document.getElementById('resTotalSolved'),
            resTotalTime: document.getElementById('resTotalTime'),
            resAccuracy: document.getElementById('resAccuracy'),
            resAvgTime: document.getElementById('resAvgTime'),
            // Buttons map for easier access if needed
            startGameBtn: document.getElementById('startGameBtn'),
            restartBtn: document.getElementById('restartBtn'),
            flipBoardBtn: document.getElementById('flipBoardBtn'),
            giveUpBtn: document.getElementById('giveUpBtn'),
            backToMenuBtn: document.getElementById('backToMenuBtn'),
            // Timeout modal
            timeoutModal: document.getElementById('timeoutModal'),
            // Counters
            wChecks: document.getElementById('w-checks'),
            wCaptures: document.getElementById('w-captures'),
            bChecks: document.getElementById('b-checks'),
            bCaptures: document.getElementById('b-captures'),
            // Legacy wrapper for counter access by ID
            moveLog: document.getElementById('moveLog') // Optional
        };
    }
    /**
     * Switches between views (screens)
     * @param viewId - ID of view to show
     */
    switchView(viewId) {
        document.querySelectorAll('.view').forEach(el => {
            el.classList.remove('active');
            el.classList.add('hidden');
        });
        const target = document.getElementById(viewId);
        if (target) {
            target.classList.remove('hidden');
            target.classList.add('active');
            // Reset scroll position to prevent layout shifts
            window.scrollTo(0, 0);
            document.body.scrollTop = 0;
            document.documentElement.scrollTop = 0;
            if (target.scrollTop)
                target.scrollTop = 0;
        }
    }
    /**
     * Shows start screen
     */
    showStartScreen() {
        this.switchView('startScreen');
    }
    /**
     * Shows game screen
     */
    showGameScreen() {
        // Close any open dialogs
        const dialog = document.querySelector('#startScreen dialog');
        if (dialog && dialog.close)
            dialog.close();
        this.switchView('gameScreen');
    }
    /**
     * Shows result screen
     * @param stats - Session statistics
     */
    showResults(stats) {
        if (this.dom.resTotalSolved) {
            this.dom.resTotalSolved.textContent = stats.solved.toString();
        }
        if (this.dom.resTotalTime) {
            this.dom.resTotalTime.textContent = formatTime(stats.time);
        }
        if (this.dom.resAccuracy) {
            this.dom.resAccuracy.textContent = `${Math.round(stats.accuracy)}%`;
        }
        if (this.dom.resAvgTime) {
            this.dom.resAvgTime.textContent = formatTime(stats.avgTime);
        }
        // Special handling - result screen is inside game screen
        const gameScreen = document.getElementById('gameScreen');
        const resultScreen = document.getElementById('resultScreen');
        if (gameScreen && resultScreen) {
            document.querySelectorAll('.view').forEach(el => {
                el.classList.remove('active');
                el.classList.add('hidden');
            });
            gameScreen.classList.remove('hidden');
            gameScreen.classList.remove('active');
            resultScreen.classList.remove('hidden');
            resultScreen.classList.add('active');
        }
    }
    /**
     * Updates progress display
     * @param current - Current puzzle number (1-indexed)
     * @param total - Total puzzles
     */
    updateProgress(current, total) {
        if (this.dom.progressDisplay) {
            this.dom.progressDisplay.textContent = `${current} / ${total}`;
        }
    }
    /**
     * Updates task indicator (for sequential mode)
     * @param show - Whether to show indicator
     * @param taskName - Task name to display
     */
    updateTaskIndicator(show, taskName = '') {
        if (this.dom.taskIndicator) {
            if (show) {
                this.dom.taskIndicator.classList.remove('hidden');
                if (this.dom.currentTaskName) {
                    this.dom.currentTaskName.textContent = taskName;
                }
            }
            else {
                this.dom.taskIndicator.classList.add('hidden');
            }
        }
    }
    /**
     * Updates counter display
     * @param id - Counter ID ('w-checks', 'w-captures', etc.)
     * @param found - Number found
     * @param total - Total to find
     */
    updateCounter(id, found, total) {
        // Map ID to DOM elements manually since CachedDOM structure is flat for efficiency
        let el = null;
        if (id === 'w-checks')
            el = this.dom.wChecks;
        else if (id === 'w-captures')
            el = this.dom.wCaptures;
        else if (id === 'b-checks')
            el = this.dom.bChecks;
        else if (id === 'b-captures')
            el = this.dom.bCaptures;
        if (!el)
            return;
        el.textContent = `${found}/${total}`;
        // Highlight when completed
        if (found === total && total > 0) {
            el.classList.add('counter-completed');
        }
        else {
            el.classList.remove('counter-completed');
        }
    }
    /**
     * Shows/hides containers based on settings
     * @param settings - Settings object
     */
    applySettings(settings) {
        if (this.dom.statsContainer) {
            this.dom.statsContainer.classList.toggle('hidden', !settings.showHints);
        }
        if (this.dom.logContainer) {
            this.dom.logContainer.classList.toggle('hidden', !settings.showLog);
        }
    }
    /**
     * Gets session configuration from form inputs
     * @returns Configuration object
     */
    getSessionConfig() {
        const getDifficultyValue = () => {
            const checked = document.querySelector('input[name="difficulty"]:checked');
            return checked?.value || 'medium';
        };
        const isChecked = (id) => document.getElementById(id)?.checked ?? false;
        const countInput = document.getElementById('taskCountInput');
        const rawCount = countInput ? parseInt(countInput.value) : 10;
        const validatedCount = Math.max(1, Math.min(100, isNaN(rawCount) ? 10 : rawCount));
        // Update input with validated value
        if (countInput)
            countInput.value = validatedCount.toString();
        const timeLimitInput = document.getElementById('timeLimitInput');
        return {
            difficulty: getDifficultyValue(),
            taskCount: validatedCount,
            timeLimit: parseInt(timeLimitInput?.value || '0'),
            sequentialMode: isChecked('setSequential'),
            autoFlip: isChecked('setAutoFlip'),
            highlightFound: isChecked('setHighlights'),
            showLog: isChecked('setShowLog'),
            showHints: isChecked('setHints'),
            showText: isChecked('setStatusText'),
            goodMovesOnly: isChecked('setGoodMoves'),
            showCoordinates: true,
            hideLegalMoves: false,
            timeMode: 'per_puzzle' // Always per puzzle for now
        };
    }
    /**
     * Updates available puzzle count display
     * @param count - Number of available puzzles
     */
    updateAvailableCount(count) {
        const countLabel = document.getElementById('maxPuzzlesCount');
        if (countLabel) {
            countLabel.textContent = count.toString();
        }
        const taskInput = document.getElementById('taskCountInput');
        if (taskInput) {
            taskInput.setAttribute('max', count.toString());
        }
    }
    /**
     * Shows timeout modal
     */
    showTimeoutModal() {
        const modal = this.dom.timeoutModal;
        if (modal && modal.showModal) {
            modal.showModal();
        }
    }
    /**
     * Closes timeout modal
     */
    closeTimeoutModal() {
        const modal = this.dom.timeoutModal;
        if (modal && modal.close) {
            modal.close();
        }
    }
    /**
     * Gets DOM element cache
     * @returns Cached DOM elements
     */
    getDOM() {
        return this.dom;
    }
    /**
     * Cleanup
     */
    destroy() {
        // Cleanup if needed
    }
}
//# sourceMappingURL=UIManager.js.map