/**
 * Chess Vision Trainer - Application Entry Point
 * Main module that initializes the application
 * TypeScript версия
 */
import { ChessVisionTrainer } from './core/ChessVisionTrainer.js';
import { logError } from './utils/error-handler.js';
const waitForChessground = () => {
    return new Promise((resolve) => {
        if (window.Chessground)
            return resolve(window.Chessground);
        // @ts-ignore
        import('https://cdn.jsdelivr.net/npm/@lichess-org/chessground@10.0.1/+esm')
            .then(module => {
            const cg = module.Chessground || module.default?.Chessground || module.default;
            resolve(cg);
        })
            .catch(() => resolve(null));
    });
};
/**
 * Initialize application on DOM ready
 */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const Chessground = await waitForChessground();
        if (!Chessground) {
            logError('LIBRARY_LOAD', 'Не удалось загрузить Chessground', new Error('Chessground is undefined'));
            alert('Ошибка загрузки библиотеки шахмат. Перезагрузите страницу.');
            return;
        }
        window.chessApp = new ChessVisionTrainer(Chessground);
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);
        await window.chessApp.init();
        console.log('🚀 Chess Vision Trainer запущен');
        // Register Service Worker for PWA
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('./sw.js')
                .then(registration => {
                console.log('SW registered: ', registration);
            })
                .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
        }
    }
    catch (error) {
        console.error('❌ Ошибка инициализации:', error);
        alert('Не удалось запустить приложение. Смотрите консоль для деталей.');
    }
});
/**
 * Graceful shutdown on page unload
 */
window.addEventListener('beforeunload', () => {
    if (window.chessApp) {
        window.chessApp.destroy();
    }
});
/**
 * Handle window resize — redraw board only.
 * Do NOT scrollTo(0,0) here: on iOS Safari the address bar
 * collapse/expand fires resize, which would yank the page to top.
 */
window.addEventListener('resize', () => {
    if (window.chessApp) {
        window.chessApp.boardRenderer?.ground?.redrawAll();
    }
});
/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    logError('UI_RENDER', 'Uncaught error', event.error, { message: event.message, filename: event.filename, lineno: event.lineno });
});
/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
    logError('GAME_LOGIC', 'Unhandled promise rejection', event.reason);
});
//# sourceMappingURL=main.js.map