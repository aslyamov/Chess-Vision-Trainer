import chess
import chess.pgn
import chess.engine
import json
import os
import time
import datetime

# --- НАСТРОЙКИ ---

# Файл с партиями
INPUT_PGN_FILE = "mega.pgn" # Или "mega2026_11.pgn"
STOCKFISH_PATH = "stockfish-windows-x86-64-avx2.exe" # <-- УКАЖИТЕ ПУТЬ К ДВИЖКУ

# Настройки генератора
MAX_PUZZLES = 10000        # Сколько задач собрать
MIN_PIECES = 12            # Минимум фигур на доске
ENGINE_DEPTH = 25         # Глубина анализа Stockfish
BAD_MOVE_THRESHOLD = 100  # Порог ошибки (1.2 пешки)
WINNING_SCORE = 150       # Порог выигрыша
STRICT_WIN_CHECK = True   # Строго следить за упущенной победой

# Настройки отбора (как в старом файле)
MIN_TOTAL_TARGETS = 4     # Минимум целей (Good + Bad), чтобы сохранить задачу

# ----------------------------

def determine_difficulty(total_targets):
    """
    Определяет сложность на основе общего количества целей.
    Как в generate_puzzles_strict.py
    """
    if total_targets <= 8:
        return "easy"
    elif total_targets <= 14:
        return "medium"
    else:
        return "hard"

def count_games_in_pgn(file_path):
    print("📊 Подсчет общего количества партий...", end="\r")
    count = 0
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.startswith("[Event "): count += 1
    except: pass
    print(f"📊 Всего партий в файле: {count}            ")
    return count

def get_engine_score(board, engine, depth):
    info = engine.analyse(board, chess.engine.Limit(depth=depth))
    score = info["score"].relative
    if score.is_mate():
        return 10000 if score.mate() > 0 else -10000
    return score.score()

def format_time(seconds):
    return str(datetime.timedelta(seconds=int(seconds)))

def analyze_position_for_side(board, engine):
    """
    Ищет ходы (шахи и взятия) для стороны, чей сейчас ход на доске.
    Возвращает два списка: good_moves_san, bad_moves_san.
    """
    legal_moves = list(board.legal_moves)
    targets = []
    
    # 1. Отбираем кандидатов (шах или взятие)
    for m in legal_moves:
        if board.is_capture(m) or board.gives_check(m):
            targets.append(m)
    
    if not targets:
        return [], []

    # 2. Оценка базовой позиции
    base_score = get_engine_score(board, engine, depth=10)
    
    # Если позиция уже безнадежно проиграна (-3.0), не ищем ходы (экономим время)
    if base_score < -300: 
        return [], []

    good = []
    bad = []

    for m in targets:
        board.push(m)
        move_score = -get_engine_score(board, engine, depth=ENGINE_DEPTH)
        board.pop()

        san = board.san(m)
        diff = base_score - move_score 
        
        is_bad = False

        # Критерий 1: Сильное ухудшение оценки
        if diff > BAD_MOVE_THRESHOLD: 
            is_bad = True
        
        # Критерий 2: Смена статуса (упустили победу или зевнули проигрыш)
        if STRICT_WIN_CHECK:
            if base_score >= WINNING_SCORE and move_score < WINNING_SCORE and move_score < 9000:
                is_bad = True
            if base_score > -50 and move_score < -150:
                is_bad = True

        if is_bad: bad.append(san)
        else: good.append(san)
        
    return good, bad

def generate():
    if not os.path.exists(STOCKFISH_PATH):
        print(f"❌ Ошибка: Не найден Stockfish: {STOCKFISH_PATH}")
        return
    if not os.path.exists(INPUT_PGN_FILE):
        print(f"❌ Ошибка: Не найден PGN файл: {INPUT_PGN_FILE}")
        return

    puzzles = []
    stats = {"easy": 0, "medium": 0, "hard": 0}

    total_games = count_games_in_pgn(INPUT_PGN_FILE)

    print(f"🚀 Генератор запущен (Умный анализ + Жесткий отбор)")
    print(f"🎯 Цель: {MAX_PUZZLES} задач")
    print(f"⚙️ Мин. целей: {MIN_TOTAL_TARGETS} | Мин. фигур: {MIN_PIECES}")
    print("-" * 60)

    try:
        engine = chess.engine.SimpleEngine.popen_uci(STOCKFISH_PATH)
    except Exception as e:
        print(f"❌ Ошибка запуска движка: {e}")
        return

    pgn = open(INPUT_PGN_FILE, encoding="utf-8")
    games_processed = 0
    start_time = time.time()
    
    while len(puzzles) < MAX_PUZZLES:
        # Читаем партию с обработкой ошибок
        try:
            game = chess.pgn.read_game(pgn)
        except Exception:
            continue # Если партия битая, пропускаем
            
        if game is None: break

        board = game.board()
        games_processed += 1
        
        print(f"\n♟️ Партия {games_processed}/{total_games}")

        move_count = 0
        for move in game.mainline_moves():
            board.push(move)
            move_count += 1
            
            # Пропускаем дебют и позиции с малым числом фигур
            if move_count < 10: continue
            if len(board.piece_map()) < MIN_PIECES: continue

            # === АНАЛИЗ ЗА ОБЕ СТОРОНЫ ===
            
            # 1. За текущую сторону
            g1, b1 = analyze_position_for_side(board, engine)

            # 2. За обратную сторону (переворачиваем ход)
            fen_parts = board.fen().split(' ')
            fen_parts[1] = 'w' if fen_parts[1] == 'b' else 'b'
            fen_parts[3] = '-' 
            board_flipped = chess.Board(" ".join(fen_parts))
            
            if board_flipped.is_valid():
                g2, b2 = analyze_position_for_side(board_flipped, engine)
            else:
                g2, b2 = [], []

            # Объединяем
            all_good = g1 + g2
            all_bad = b1 + b2
            total_targets = len(all_good) + len(all_bad)

            print(f"   ↳ Ход {move_count}: Целей {total_targets} (Good:{len(all_good)} Bad:{len(all_bad)})... ", end="", flush=True)

            # === ФИЛЬТРАЦИЯ И СОХРАНЕНИЕ ===
            
            # 1. Должен быть хотя бы 1 хороший ход (иначе задача нерешаемая/скучная)
            # 2. Общее число целей должно быть >= MIN_TOTAL_TARGETS (как в старом файле)
            # 3. Убираем дубликаты (по FEN)
            if len(all_good) > 0 and total_targets >= MIN_TOTAL_TARGETS:
                if not any(p['fen'] == board.fen() for p in puzzles):
                    
                    difficulty = determine_difficulty(total_targets)
                    stats[difficulty] += 1
                    
                    print(f"✅ [{difficulty.upper()}]")
                    
                    puzzles.append({
                        "fen": board.fen(),
                        "difficulty": difficulty,
                        "good_moves": all_good,
                        "bad_moves": all_bad
                    })
                    
                    # Статистика времени
                    elapsed = time.time() - start_time
                    avg = elapsed / len(puzzles)
                    rem = MAX_PUZZLES - len(puzzles)
                    print(f"      [Итого: {len(puzzles)}/{MAX_PUZZLES}] [ETA: {format_time(avg * rem)}]")

                    if len(puzzles) >= MAX_PUZZLES: break
            else:
                print(f"❌", end="\r")

    engine.quit()
    
    with open("puzzles.json", "w", encoding="utf-8") as f:
        json.dump(puzzles, f, indent=4, ensure_ascii=False)
    
    total_time = time.time() - start_time
    print(f"\n\n🎉 Готово! Сохранено {len(puzzles)} задач.")
    print(f"📊 Статистика сложности:")
    print(f"   🟢 Легкие (<=8):   {stats['easy']}")
    print(f"   🟡 Средние (<=14): {stats['medium']}")
    print(f"   🔴 Сложные (>14):  {stats['hard']}")
    print(f"⏱ Общее время: {format_time(total_time)}")

if __name__ == "__main__":
    generate()