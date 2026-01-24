/**
 * Chess Vision Trainer - Application Entry Point
 * Main module that initializes the application
 * TypeScript версия
 */

import { ChessVisionTrainer } from './core/ChessVisionTrainer.js';
import { logError } from './utils/error-handler.js';

// Объявляем глобальные интерфейсы для window
declare global {
    interface Window {
        Chessground: any;
        chessApp: ChessVisionTrainer;
        debugLayout: () => void;
    }
}

// Загружаем через CDN динамически или ожидаем загрузку в HTML
// В TypeScript лучше декларировать зависимость, но здесь мы используем подход с window для CDN
// Альтернатива - динамический импорт:
// Ждем пока загрузится библиотека
const waitForChessground = (): Promise<any> => {
    return new Promise((resolve) => {
        if (window.Chessground) return resolve(window.Chessground);
        
        // Либо пробуем импортировать
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
            logError(
                'LIBRARY_LOAD' as any,
                'Не удалось загрузить Chessground',
                new Error('Chessground is undefined')
            );
            alert('Ошибка загрузки библиотеки шахмат. Перезагрузите страницу.');
            return;
        }

        // Create global instance (for console debugging)
        window.chessApp = new ChessVisionTrainer(Chessground);

        // Prevent browser from restoring scroll position on reload
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }
        window.scrollTo(0, 0);

        // Initialize application
        await window.chessApp.init();

        console.log('🚀 Chess Vision Trainer запущен');
        console.log('💡 Доступ через window.chessApp');

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
    } catch (error) {
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
 * Handle window resize (fixes board orientation on mobile address bar collapse)
 */
/**
 * DEBUG: Layout Analysis
 */
function debugLayout() {
    const boardWrapper = document.querySelector('.board-wrapper');
    const gameScreen = document.getElementById('gameScreen');
    const startScreen = document.getElementById('startScreen');
    
    console.group('🔍 LAYOUT DEBUG INFO');
    
    // 1. Viewport & Window
    console.log('📱 Window:', {
        width: window.innerWidth,
        height: window.innerHeight,
        outerHeight: window.outerHeight,
        scrollY: window.scrollY,
        dpr: window.devicePixelRatio
    });
    
    // 2. Visual Viewport (checking for virtual keyboard/address bar)
    if (window.visualViewport) {
        console.log('👁️ VisualViewport:', {
            width: window.visualViewport.width,
            height: window.visualViewport.height,
            offsetTop: window.visualViewport.offsetTop,
            pageTop: window.visualViewport.pageTop,
            scale: window.visualViewport.scale
        });
    }

    // 3. Document & Body
    console.log('📄 Document:', {
        docClientHeight: document.documentElement.clientHeight,
        bodyClientHeight: document.body.clientHeight,
        bodyScrollHeight: document.body.scrollHeight,
        bodyScrollTop: document.body.scrollTop,
        docScrollTop: document.documentElement.scrollTop
    });

    // 4. Target Elements
    if (boardWrapper) {
        const rect = boardWrapper.getBoundingClientRect();
        console.log('♟️ Board Wrapper:', {
            top: rect.top,
            bottom: rect.bottom,
            height: rect.height,
            y: rect.y,
            inViewport: rect.top >= 0 && rect.bottom <= window.innerHeight
        });
    }
    
    if (gameScreen && !gameScreen.classList.contains('hidden')) {
        console.log('🎮 Game View (Active):', {
            scrollTop: gameScreen.scrollTop,
            scrollHeight: gameScreen.scrollHeight,
            clientHeight: gameScreen.clientHeight
        });
    }

    if (startScreen && !startScreen.classList.contains('hidden')) {
        console.log('🏠 Start Screen (Active):', {
            scrollTop: startScreen.scrollTop,
            scrollHeight: startScreen.scrollHeight,
            clientHeight: startScreen.clientHeight
        });
    }

    console.groupEnd();
}

// Run debug on specific events
// Simple debounce implementation to avoid dependency issues if utils not loaded
let timeoutId: any = null;
const debouncedDebug = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(debugLayout, 500);
};

window.addEventListener('resize', () => {
    // Redraw board logic
    if (window.chessApp) {
        (window.chessApp as any).boardRenderer?.ground?.redrawAll();
        
        // Reset scroll on significant resize (orientation change/mobile toggle)
        // This ensures the top-aligned UI stays visible
        window.scrollTo(0, 0);
    }
    console.log('[Event] Resize triggered');
    debouncedDebug();
});

window.addEventListener('scroll', () => {
    // debouncedDebug(); // Optional: uncomment if scroll tracking is needed, usually noisy
});

// Run once on start
setTimeout(debugLayout, 1000);

// Expose globally for manual triggering
(window as any).debugLayout = debugLayout;

/**
 * Global error handler
 */
window.addEventListener('error', (event) => {
    logError(
        'UI_RENDER' as any,
        'Uncaught error',
        event.error,
        { message: event.message, filename: event.filename, lineno: event.lineno }
    );
});

/**
 * Unhandled promise rejection handler
 */
window.addEventListener('unhandledrejection', (event) => {
    logError(
        'GAME_LOGIC' as any,
        'Unhandled promise rejection',
        event.reason
    );
});
