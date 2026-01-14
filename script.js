// --- КОНФИГУРАЦИЯ ---
var puzzles = []; 
var sessionPuzzles = []; 
var currentPuzzleIndex = 0;

// Игровые объекты
var board = null;
var game = new Chess();
var targets = { w: { checks: [], captures: [] }, b: { checks: [], captures: [] } };
var foundMoves = new Set(); 

// Таймер
var timerInterval = null;
var sessionStartTime = 0; // Время начала сессии (для статистики)
var limitEndTime = 0;     // Время, когда таймер должен остановиться (для обратного отсчета)

// Статистика
var sessionStats = {
    totalTimeSeconds: 0, totalClicks: 0, totalErrors: 0, solvedCount: 0,
    wChecks: { found: 0, total: 0 }, wCaps: { found: 0, total: 0 },
    bChecks: { found: 0, total: 0 }, bCaps: { found: 0, total: 0 }
};

// Этапы (Sequential Mode)
var currentStageIndex = 0;
const STAGES = [
    { id: 'w-checks', color: 'w', type: 'checks', name: 'Белые: Шахи' },
    { id: 'w-captures', color: 'w', type: 'captures', name: 'Белые: Взятия' },
    { id: 'b-checks', color: 'b', type: 'checks', name: 'Черные: Шахи' },
    { id: 'b-captures', color: 'b', type: 'captures', name: 'Черные: Взятия' }
];

var settings = {};

$(document).ready(function() {
    // 1. Загрузка JSON
    fetch('puzzles.json')
        .then(response => response.json())
        .then(data => {
            puzzles = data;
            $('#maxPuzzlesCount').text(puzzles.length);
            $('#taskCountInput').attr('max', puzzles.length);
            if (puzzles.length < 5) $('#taskCountInput').val(puzzles.length);
        })
        .catch(err => {
            console.warn("JSON не найден.");
            puzzles = [
                { fen: "r1bqkb1r/pppp1ppp/2n5/4P3/2Bp2n1/5N2/PPP2PPP/RNBQK2R w KQkq - 1 5" },
                { fen: "r1b1k1nr/pppp1ppp/2n5/2b1p3/2B1P2q/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 4 4" },
                { fen: "rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8" }
            ];
            $('#maxPuzzlesCount').text(puzzles.length);
            $('#taskCountInput').attr('max', puzzles.length);
            $('#taskCountInput').val(puzzles.length);
        });

    $('#startSessionBtn').on('click', startSession);
    $('#giveUpBtn').on('click', skipPuzzle);
    
    board = Chessboard('board', {
        draggable: true,
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: onDragStart,
        onDrop: onDrop
    });
});

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// --- ЛОГИКА СЕССИИ ---

function startSession() {
    // Чтение настроек
    settings = {
        sequentialMode: $('#setSequential').is(':checked'),
        autoFlip: $('#setAutoFlip').is(':checked'),
        highlightFound: $('#setHighlights').is(':checked'),
        showHints: $('#setHints').is(':checked'),
        showText: $('#setStatusText').is(':checked'),
        // Новые настройки времени
        timeLimit: parseInt($('#timeLimitInput').val()) || 0,
        timeMode: $('input[name="timeMode"]:checked').val() // 'per_puzzle' или 'total'
    };

    // Выбор задач
    let inputVal = parseInt($('#taskCountInput').val());
    let totalAvailable = puzzles.length;
    if (isNaN(inputVal) || inputVal < 1) inputVal = 1;
    if (inputVal > totalAvailable) inputVal = totalAvailable;
    
    let shuffled = shuffleArray([...puzzles]);
    sessionPuzzles = shuffled.slice(0, inputVal);
    
    // Сброс статистики
    currentPuzzleIndex = 0;
    sessionStats = {
        totalTimeSeconds: 0, totalClicks: 0, totalErrors: 0, solvedCount: 0,
        wChecks: { found: 0, total: 0 }, wCaps: { found: 0, total: 0 },
        bChecks: { found: 0, total: 0 }, bCaps: { found: 0, total: 0 }
    };

    $('.view').removeClass('active').addClass('hidden');
    $('#gameScreen').removeClass('hidden').addClass('active');

    // Старт общего времени (для статистики)
    sessionStartTime = Date.now();

    // Если режим "На всю сессию", запускаем таймер один раз здесь
    if (settings.timeLimit > 0 && settings.timeMode === 'total') {
        limitEndTime = sessionStartTime + (settings.timeLimit * 1000);
        startTimer(true); // true = режим обратного отсчета
    } else if (settings.timeLimit === 0) {
        startTimer(false); // Обычный таймер вверх
    }

    loadPuzzle(0);
}

function loadPuzzle(index) {
    if (index >= sessionPuzzles.length) {
        finishSession();
        return;
    }

    let fen = sessionPuzzles[index].fen;
    
    game = new Chess();
    targets = { w: { checks: [], captures: [] }, b: { checks: [], captures: [] } };
    foundMoves.clear();
    currentStageIndex = 0;
    $('.square-55d63').removeClass('highlight-found');
    $('#log').html('');

    if (!game.load(fen) && !game.load_pgn(fen)) {
        console.error("Некорректный FEN:", fen);
        nextPuzzle(); 
        return;
    }

    board.position(game.fen());
    board.orientation('white');

    analyzeTargets(game.fen());
    
    // Статистика "Available"
    sessionStats.wChecks.total += targets.w.checks.length;
    sessionStats.wCaps.total   += targets.w.captures.length;
    sessionStats.bChecks.total += targets.b.checks.length;
    sessionStats.bCaps.total   += targets.b.captures.length;
    
    updateGameUI();
    setStatus("Найдите все шахи и взятия!");

    // Управление таймером "На одну задачу"
    if (settings.timeLimit > 0 && settings.timeMode === 'per_puzzle') {
        limitEndTime = Date.now() + (settings.timeLimit * 1000);
        startTimer(true);
    }

    // Авто-пропуск пустых
    if (settings.sequentialMode) {
        checkStageCompletion();
    } else {
        if (checkIfAllFound()) {
            setTimeout(nextPuzzle, 1000);
        }
    }
}

function skipPuzzle() { nextPuzzle(); }

function nextPuzzle() {
    if (checkIfAllFound()) sessionStats.solvedCount++;
    currentPuzzleIndex++;
    loadPuzzle(currentPuzzleIndex);
}

function finishSession() {
    stopTimer();
    sessionStats.totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

    $('#resTotalSolved').text(`${sessionStats.solvedCount} / ${sessionPuzzles.length}`);
    $('#resTotalTime').text(formatTime(sessionStats.totalTimeSeconds));
    
    let avg = (sessionPuzzles.length > 0) ? Math.floor(sessionStats.totalTimeSeconds / sessionPuzzles.length) : 0;
    $('#resAvgTime').text(formatTime(avg));
    
    $('#resTotalClicks').text(sessionStats.totalClicks);
    $('#resTotalErrors').text(sessionStats.totalErrors);

    updateResRow('WCheck', sessionStats.wChecks);
    updateResRow('WCap', sessionStats.wCaps);
    updateResRow('BCheck', sessionStats.bChecks);
    updateResRow('BCap', sessionStats.bCaps);

    $('.view').removeClass('active').addClass('hidden');
    $('#resultScreen').removeClass('hidden').addClass('active');
}

function updateResRow(prefix, obj) {
    const calcPct = (found, total) => total === 0 ? "—" : Math.round((found / total) * 100) + "%";
    $(`#res${prefix}Found`).text(obj.found);
    $(`#res${prefix}Total`).text(obj.total); 
    $(`#res${prefix}Pct`).text(calcPct(obj.found, obj.total));
}

// --- АНАЛИЗ ---
function analyzeTargets(fen) {
    let wRes = getMovesForColor(fen, 'w');
    targets.w.checks = wRes.checks;
    targets.w.captures = wRes.captures;
    let bRes = getMovesForColor(fen, 'b');
    targets.b.checks = bRes.checks;
    targets.b.captures = bRes.captures;
}

function getMovesForColor(fen, color) {
    let tempGame = new Chess(fen);
    let tokens = fen.split(' ');
    tokens[1] = color; 
    
    if (!tempGame.load(tokens.join(' '))) return { checks: [], captures: [] };

    let checks = [], captures = [];
    tempGame.moves({ verbose: true }).forEach(m => {
        if (m.flags.includes('c') || m.flags.includes('e')) captures.push(m);
        tempGame.move(m);
        if (tempGame.in_check()) checks.push(m);
        tempGame.undo();
    });
    return { checks, captures };
}

// --- ВЗАИМОДЕЙСТВИЕ ---
function onDragStart(source, piece) {
    // Блокируем, если время вышло (на всякий случай)
    if (settings.timeLimit > 0 && Date.now() > limitEndTime) return false;

    if (settings.sequentialMode) {
        let stage = STAGES[currentStageIndex];
        if (piece.charAt(0) !== stage.color) return false;
    }
    return true;
}

function onDrop(source, target) {
    if (source === target) return;
    
    // Доп. проверка времени
    if (settings.timeLimit > 0 && Date.now() > limitEndTime) return 'snapback';

    sessionStats.totalClicks++;

    let moveKey = source + '-' + target;
    let piece = board.position()[source];
    let color = piece.charAt(0);
    
    if (settings.sequentialMode) {
        let stage = STAGES[currentStageIndex];
        if (color !== stage.color) return 'snapback';
    }

    let tColor = targets[color];
    let isCheck = tColor.checks.some(m => m.from === source && m.to === target);
    let isCapture = tColor.captures.some(m => m.from === source && m.to === target);

    let isValid = false;
    let wrongCategory = false;

    if (settings.sequentialMode) {
        let stage = STAGES[currentStageIndex];
        if (stage.type === 'checks' && isCheck) isValid = true;
        else if (stage.type === 'captures' && isCapture) isValid = true;
        if (!isValid && (isCheck || isCapture)) wrongCategory = true;
    } else {
        if (isCheck || isCapture) isValid = true;
    }

    if (isValid) {
        if (foundMoves.has(moveKey)) {
            setStatus("Уже найдено", "orange");
        } else {
            foundMoves.add(moveKey);
            if (settings.highlightFound) $('#board .square-' + target).addClass('highlight-found');
            
            if (isCheck && color === 'w') sessionStats.wChecks.found++;
            if (isCapture && color === 'w') sessionStats.wCaps.found++;
            if (isCheck && color === 'b') sessionStats.bChecks.found++;
            if (isCapture && color === 'b') sessionStats.bCaps.found++;

            setStatus("Верно!", "green");
            logMove(source + "-" + target, isCheck, isCapture);
            
            updateGameUI();

            if (settings.sequentialMode) {
                checkStageCompletion();
            } else {
                if (checkIfAllFound()) {
                    setStatus("Задача решена!", "green");
                    setTimeout(nextPuzzle, 800);
                }
            }
        }
    } else {
        sessionStats.totalErrors++;
        if (wrongCategory) setStatus("Не та категория", "#dc3545");
        else setStatus("Мимо", "red");
    }
    return 'snapback';
}

function checkIfAllFound() {
    let allTargets = [...targets.w.checks, ...targets.w.captures, ...targets.b.checks, ...targets.b.captures];
    let uniqueNeeded = new Set(allTargets.map(m => m.from + '-' + m.to));
    return foundMoves.size === uniqueNeeded.size && uniqueNeeded.size > 0;
}

// --- UI ---
function updateGameUI() {
    $('#progressDisplay').text(`Задача ${currentPuzzleIndex + 1} из ${sessionPuzzles.length}`);
    
    if (settings.sequentialMode) {
        if (currentStageIndex < STAGES.length) {
            let stage = STAGES[currentStageIndex];
            $('#taskIndicator').removeClass('hidden');
            $('#currentTaskName').text(stage.name);
            $('.stat-row').removeClass('active-stage');
            $('#row-' + stage.id).addClass('active-stage');
            if (settings.autoFlip) board.orientation(stage.color === 'w' ? 'white' : 'black');
        }
    } else {
        $('#taskIndicator').addClass('hidden');
        $('.stat-row').removeClass('active-stage');
    }

    updateCounter('w-checks', targets.w.checks);
    updateCounter('w-captures', targets.w.captures);
    updateCounter('b-checks', targets.b.checks);
    updateCounter('b-captures', targets.b.captures);
}

function updateCounter(id, list) {
    let found = 0;
    list.forEach(m => { if (foundMoves.has(m.from+'-'+m.to)) found++; });
    let total = list.length;
    let el = $('#' + id);
    if (settings.showHints) {
        el.text(`${found}/${total}`);
        if (found === total && total > 0) el.css('color', 'green').css('font-weight', 'bold');
        else el.css('color', 'inherit');
    } else {
        el.text(found === total && total > 0 ? "✓" : "?");
    }
}

function checkStageCompletion() {
    while (currentStageIndex < STAGES.length) {
        let stage = STAGES[currentStageIndex];
        let list = (stage.type === 'checks') ? targets[stage.color].checks : targets[stage.color].captures;
        let foundCount = 0;
        list.forEach(m => { if (foundMoves.has(m.from + '-' + m.to)) foundCount++; });

        if (foundCount >= list.length) currentStageIndex++;
        else break; 
    }
    updateGameUI();
    if (currentStageIndex >= STAGES.length) {
         setStatus("Все цели найдены!", "green");
         setTimeout(nextPuzzle, 800);
    }
}

function setStatus(msg, color) {
    if (settings.showText) $('#statusMessage').text(msg).css('color', color || '#333');
}

function logMove(san, isCheck, isCapture) {
    let badges = '';
    if (isCheck && isCapture) badges = '<span class="badge bg-both">Шах+Взятие</span>';
    else if (isCheck) badges = '<span class="badge bg-check">Шах</span>';
    else if (isCapture) badges = '<span class="badge bg-capture">Взятие</span>';
    $('#log').prepend(`<div class="log-item">${badges} <b>${san}</b></div>`);
}

// --- ТАЙМЕР (НОВАЯ ЛОГИКА) ---

function startTimer(isCountdown) {
    if (timerInterval) clearInterval(timerInterval);
    
    // Функция обновления UI
    const update = () => {
        let seconds;
        if (isCountdown) {
            // Считаем вниз
            let remaining = Math.ceil((limitEndTime - Date.now()) / 1000);
            if (remaining <= 0) {
                remaining = 0;
                handleTimeOut(); // Время вышло!
            }
            seconds = remaining;
            $('#gameTimer').css('color', seconds <= 10 ? '#ff4444' : 'white'); // Краснеет в конце
        } else {
            // Считаем вверх
            seconds = Math.floor((Date.now() - sessionStartTime) / 1000);
            $('#gameTimer').css('color', 'white');
        }
        $('#gameTimer').text(formatTime(seconds));
    };

    update(); // Сразу обновить
    timerInterval = setInterval(update, 1000);
}

function stopTimer() {
    if (timerInterval) clearInterval(timerInterval);
}

function handleTimeOut() {
    stopTimer();
    
    if (settings.timeMode === 'total') {
        alert("Время сессии вышло!");
        finishSession();
    } else {
        // Если время на задачу
        setStatus("Время вышло!", "red");
        // Красная вспышка или звук здесь были бы уместны
        setTimeout(() => {
            nextPuzzle(); // Просто переходим к следующей, solvedCount не увеличиваем
        }, 1000);
    }
}

function formatTime(s) {
    let m = Math.floor(s / 60);
    let sec = s % 60;
    return (m<10?"0"+m:m) + ":" + (sec<10?"0"+sec:sec);
}