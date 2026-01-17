import chess
import chess.pgn
import json
import os
import time

# --- НАСТРОЙКИ ---
INPUT_PGN_FILE = "mega2026_11.pgn"
OUTPUT_JSON_FILE = "puzzles.json"

# Минимальное кол-во целей (шахи + взятия), чтобы считать позицию задачей
MIN_TOTAL_TARGETS = 4 

MAX_PUZZLES = 1000        # Сколько всего задач собрать
SKIP_OPENING = 20         # Пропускать первые 10 ходов (20 полуходов)

def get_tactics_if_valid(board_fen, color):
    """
    Возвращает (checks, captures), если позиция легальна для этого цвета.
    Иначе None.
    """
    board = chess.Board(board_fen)
    board.turn = color 
    
    # Если позиция невозможна (король под шахом в чужой ход), выкидываем
    if not board.is_valid():
        return None

    checks = 0
    captures = 0
    
    for move in board.legal_moves:
        board.push(move)
        if board.is_check():
            checks += 1
        board.pop()
        
        if board.is_capture(move):
            captures += 1
                
    return checks, captures

def determine_difficulty(total_targets):
    """Классификация сложности по числу целей."""
    if total_targets <= 8:
        return "easy"
    elif total_targets <= 14:
        return "medium"
    else:
        return "hard"

def main():
    if not os.path.exists(INPUT_PGN_FILE):
        print(f"❌ Файл {INPUT_PGN_FILE} не найден! Положите PGN файл рядом со скриптом.")
        return

    stats = {"easy": 0, "medium": 0, "hard": 0}
    puzzles = []
    games_processed = 0
    start_time = time.time()
    
    print(f"🚀 Начинаю генерацию задач из {INPUT_PGN_FILE}...")
    
    with open(INPUT_PGN_FILE, encoding="utf-8") as pgn_file:
        while len(puzzles) < MAX_PUZZLES:
            game = chess.pgn.read_game(pgn_file)
            if game is None: break 
            
            games_processed += 1
            board = game.board()
            
            move_count = 0
            for move in game.mainline_moves():
                board.push(move)
                move_count += 1
                
                if move_count < SKIP_OPENING: continue
                if len(puzzles) >= MAX_PUZZLES: break

                current_fen = board.fen()
                
                # Анализ за Белых
                w_stats = get_tactics_if_valid(current_fen, chess.WHITE)
                if w_stats is None: continue
                
                # Анализ за Черных
                b_stats = get_tactics_if_valid(current_fen, chess.BLACK)
                if b_stats is None: continue
                
                # Суммируем
                total_checks = w_stats[0] + b_stats[0]
                total_captures = w_stats[1] + b_stats[1]
                total_targets = total_checks + total_captures
                
                if total_targets >= MIN_TOTAL_TARGETS:
                    # Проверка на дубликаты
                    if not any(p['fen'] == current_fen for p in puzzles):
                        
                        difficulty = determine_difficulty(total_targets)
                        
                        desc = (f"W: {w_stats[0]}ch/{w_stats[1]}cp | "
                                f"B: {b_stats[0]}ch/{b_stats[1]}cp")
                                
                        puzzles.append({
                            "fen": current_fen,
                            "difficulty": difficulty,
                            "description": desc
                        })
                        stats[difficulty] += 1
                        
                        # Периодический отчет в консоль
                        if len(puzzles) % 10 == 0:
                            print(f"--> Собрано {len(puzzles)} (E:{stats['easy']} M:{stats['medium']} H:{stats['hard']})")

    with open(OUTPUT_JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(puzzles, f, indent=2, ensure_ascii=False)
    
    print(f"\n🎉 ГОТОВО! Сохранено в {OUTPUT_JSON_FILE}")
    print(f"📊 Статистика:")
    print(f"   🟢 Легкие (4-8 целей):   {stats['easy']}")
    print(f"   🟡 Средние (9-14 целей): {stats['medium']}")
    print(f"   🔴 Сложные (14+ целей):   {stats['hard']}")
    print(f"⏱ Время работы: {time.time() - start_time:.1f} сек.")

if __name__ == "__main__":
    main()