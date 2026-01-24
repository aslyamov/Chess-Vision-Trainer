/**
 * Утилиты для работы с шахматными позициями и ходами
 * TypeScript версия
 */

import type { MoveData, TargetMoves, TargetColors, BadMove } from '../types/index.js';

// Все 64 поля на шахматной доске
export const SQUARES: readonly string[] = Object.freeze(
    Array.from({ length: 64 }, (_, i) => {
        const file = String.fromCharCode(97 + (i % 8)); // a-h
        const rank = 8 - Math.floor(i / 8); // 8-1
        return file + rank;
    })
);

/**
 * Создаёт уникальный ключ для хода из координат
 * @param from - Начальное поле
 * @param to - Конечное поле
 * @returns Ключ хода (например, "e2-e4")
 */
export function getMoveKey(from: string, to: string): string {
    return `${from}-${to}`;
}

/**
 * Форматирует секунды в MM:SS
 * @param seconds - Количество секунд
 * @returns Отформатированная строка времени
 */
export function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

/**
 * Перемешивание массива по алгоритму Фишера-Йетса
 * @template T
 * @param array - Массив для перемешивания
 * @returns Новый перемешанный массив (оригинал не изменяется)
 */
export function shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Локализует шахматную нотацию (SAN) на указанный язык
 * @param san - Стандартная алгебраическая нотация
 * @param lang - Код языка ('ru' или 'en')
 * @returns Локализованная нотация
 */
export function localizeSAN(san: string, lang: string = 'en'): string {
    if (lang !== 'ru') return san;

    const map: Record<string, string> = {
        'K': 'Кр',
        'Q': 'Ф',
        'R': 'Л',
        'B': 'С',
        'N': 'К'
    };

    return san.replace(/[KQRBN]/g, match => map[match]).replace(/x/g, ':');
}

/**
 * Проверяет, является ли ход "плохим" (ошибкой)
 * @param san - Ход в SAN нотации
 * @param badMovesList - Список плохих ходов
 * @returns true если ход плохой
 */
export function isBadMove(san: string, badMovesList: Array<string | BadMove>): boolean {
    return badMovesList.some(bm =>
        (typeof bm === 'string' ? bm : bm.san) === san
    );
}

/**
 * Находит объект плохого хода по SAN
 * @param san - Ход в SAN нотации
 * @param badMovesList - Список плохих ходов
 * @returns Объект плохого хода или undefined
 */
export function findBadMoveObj(san: string, badMovesList: Array<string | BadMove>): string | BadMove | undefined {
    return badMovesList.find(bm => {
        if (typeof bm === 'string') return bm === san;
        return bm.san === san;
    });
}

/**
 * Получает все возможные ходы для всех фигур на доске
 * Включает ходы для ОБОИХ цветов (для режима свободной игры)
 * @param fen - Позиция в FEN нотации
 * @returns Map: поле → возможные назначения
 */
export function getAllDests(fen: string): Map<string, string[]> {
    const dests = new Map<string, string[]>();

    // Добавляем ходы для текущей стороны
    const g1 = new Chess(fen);
    addDests(g1, dests);

    // Добавляем ходы для противоположной стороны
    const parts = fen.split(' ');
    parts[1] = parts[1] === 'w' ? 'b' : 'w';
    parts[3] = '-'; // Убираем en passant

    try {
        const g2 = new Chess(parts.join(' '));
        addDests(g2, dests);
    } catch (e) {
        // Невалидная позиция для противоположной стороны
    }

    return dests;
}

/**
 * Вспомогательная функция для добавления ходов в map
 * @param chessGame - Экземпляр Chess.js
 * @param destsMap - Map для заполнения
 */
function addDests(chessGame: any, destsMap: Map<string, string[]>): void {
    SQUARES.forEach(s => {
        const moves = chessGame.moves({ square: s, verbose: true });
        if (moves.length) {
            const existing = destsMap.get(s) || [];
            const newMoves = moves.map((m: any) => m.to);
            const combined = [...new Set([...existing, ...newMoves])];
            destsMap.set(s, combined);
        }
    });
}

/**
 * Анализирует позицию и находит все шахи и взятия для обоих цветов
 * @param fen - Позиция в FEN нотации
 * @returns Объект с целевыми ходами для белых и чёрных
 */
export function analyzeTargets(fen: string): TargetColors {
    return {
        w: getMovesForColor(fen, 'w'),
        b: getMovesForColor(fen, 'b')
    };
}

/**
 * Получает все шахи и взятия для указанного цвета
 * 
 * ОПТИМИЗАЦИЯ: Возвращает как массивы, так и Map для O(1) поиска
 * 
 * @param fen - Позиция в FEN нотации
 * @param color - Цвет для анализа ('w' = белые, 'b' = чёрные)
 * @returns Объект с массивами ходов и Map для быстрого поиска
 */
export function getMovesForColor(fen: string, color: 'w' | 'b'): TargetMoves {
    const tokens = fen.split(' ');
    tokens[1] = color;
    tokens[3] = '-'; // Убираем en passant

    try {
        const tempGame = new Chess(tokens.join(' '));
        const checks: MoveData[] = [];
        const captures: MoveData[] = [];

        tempGame.moves({ verbose: true }).forEach((m: any) => {
            // Проверяем взятия (включая en passant)
            if (m.flags.includes('c') || m.flags.includes('e')) {
                captures.push(m as MoveData);
            }

            // Проверяем шахи
            tempGame.move(m);
            if (tempGame.in_check()) {
                checks.push(m as MoveData);
            }
            tempGame.undo();
        });

        // ОПТИМИЗАЦИЯ: Создаем Map для O(1) поиска по ключу хода
        // Вместо Array.find() (O(n)) используем Map.get() (O(1))
        const checksMap = new Map<string, MoveData>(
            checks.map(m => [getMoveKey(m.from, m.to), m])
        );
        const capturesMap = new Map<string, MoveData>(
            captures.map(m => [getMoveKey(m.from, m.to), m])
        );

        return {
            checks,      // Массив для итерации
            captures,    // Массив для итерации
            checksMap,   // Map для быстрого поиска (O(1))
            capturesMap  // Map для быстрого поиска (O(1))
        };
    } catch (e) {
        // Возвращаем пустые структуры при ошибке
        return {
            checks: [],
            captures: [],
            checksMap: new Map(),
            capturesMap: new Map()
        };
    }
}
