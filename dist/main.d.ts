/**
 * Chess Vision Trainer - Application Entry Point
 * Main module that initializes the application
 * TypeScript версия
 */
import { ChessVisionTrainer } from './core/ChessVisionTrainer.js';
declare global {
    interface Window {
        Chessground: any;
        chessApp: ChessVisionTrainer;
        debugLayout: () => void;
    }
}
//# sourceMappingURL=main.d.ts.map