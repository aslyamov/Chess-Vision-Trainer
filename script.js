// --- ЛОКАЛИЗАЦИЯ ---
var currentLang = localStorage.getItem('chess_lang') || 'ru';
var langData = {};

async function loadLanguage(lang) {
    try {
        const response = await fetch(`locales/${lang}.json`);
        if (!response.ok) throw new Error("Ошибка загрузки языка");

        langData = await response.json();
        currentLang = lang;
        localStorage.setItem('chess_lang', lang);

        applyTranslations();

        $(`input[name="language"][value="${lang}"]`).prop('checked', true);

    } catch (error) {
        console.error("Language load failed:", error);
    }
}

function applyTranslations() {
    $('[data-lang]').each(function () {
        let key = $(this).attr('data-lang');
        if (langData[key]) {
            $(this).text(langData[key]);
        }
    });
}

// --- КОНФИГУРАЦИЯ ---
var puzzles = [];
var sessionPuzzles = [];
var currentPuzzleIndex = 0;
var board = null;
var game = new Chess();
var targets = { w: { checks: [], captures: [] }, b: { checks: [], captures: [] } };
var foundMoves = new Set();
var timerInterval = null;
var sessionStartTime = 0;
var limitEndTime = 0;
var sessionStats = {
    totalTimeSeconds: 0, totalClicks: 0, totalErrors: 0, solvedCount: 0,
    wChecks: { found: 0, total: 0 }, wCaps: { found: 0, total: 0 },
    bChecks: { found: 0, total: 0 }, bCaps: { found: 0, total: 0 }
};

var currentStageIndex = 0;
const STAGES = [
    { id: 'w-checks', color: 'w', type: 'checks', name: 'Белые: Шахи' },
    { id: 'w-captures', color: 'w', type: 'captures', name: 'Белые: Взятия' },
    { id: 'b-checks', color: 'b', type: 'checks', name: 'Черные: Шахи' },
    { id: 'b-captures', color: 'b', type: 'captures', name: 'Черные: Взятия' }
];

var settings = {};

$(document).ready(function () {
    loadLanguage(currentLang);
    $('input[name="language"]').on('change', function () {
        loadLanguage($(this).val());
    });

    fetch('puzzles.json')
        .then(response => response.json())
        .then(data => {
            puzzles = data;
            updateAvailableCount();
        })
        .catch(err => {
            console.warn("JSON не найден");
            puzzles = [{ fen: "r1bqkb1r/pppp1ppp/2n5/4P3/2Bp2n1/5N2/PPP2PPP/RNBQK2R w KQkq - 1 5", difficulty: "easy" }];
            updateAvailableCount();
        });

    $('input[name="difficulty"]').on('change', updateAvailableCount);
    $('#startSessionBtn').on('click', startSession);
    $('#giveUpBtn').on('click', skipPuzzle);
    $('#closeModalBtn').on('click', function () {
        $('#timeoutModal').addClass('hidden');
        finishSession();
    });

    $('#flipBoardBtn').on('click', function () {
        if (board) board.flip();
    });

    $('#shareBtn').on('click', async function () {
        let btn = $(this);
        let originalText = btn.find('.btn-text').text();
        btn.find('.btn-text').text('...');
        $('.result-actions').hide();
        try {
            const canvas = await html2canvas(document.querySelector('.result-box'), {
                scale: 2, backgroundColor: "#ffffff", useCORS: true
            });
            canvas.toBlob(async function (blob) {
                try {
                    const item = new ClipboardItem({ "image/png": blob });
                    await navigator.clipboard.write([item]);
                    $('.result-actions').show();
                    btn.find('.btn-text').text('OK!');
                    setTimeout(() => btn.find('.btn-text').text(originalText), 2000);
                } catch (err) {
                    $('.result-actions').show();
                    alert("Error copying");
                }
            });
        } catch (error) {
            $('.result-actions').show();
            alert("Error");
        }
    });

    let resizeTimer;
    $(window).resize(function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () {
            if (board) board.resize();
        }, 100);
    });
});

function updateAvailableCount() {
    let diff = $('input[name="difficulty"]:checked').val();
    let count = 0;
    if (diff === 'all') count = puzzles.length;
    else count = puzzles.filter(p => (p.difficulty || 'medium') === diff).length;

    $('#maxPuzzlesCount').text(count);
    $('#taskCountInput').attr('max', count);

    let currentVal = parseInt($('#taskCountInput').val()) || 0;
    if (currentVal > count) $('#taskCountInput').val(count > 0 ? count : 1);
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function startSession() {
    settings = {
        sequentialMode: $('#setSequential').is(':checked'),
        autoFlip: $('#setAutoFlip').is(':checked'),
        highlightFound: $('#setHighlights').is(':checked'),
        showHints: $('#setHints').is(':checked'),
        showText: $('#setStatusText').is(':checked'),
        showLog: $('#setShowLog').is(':checked'),
        showCoords: $('#setCoords').is(':checked'),
        timeLimit: parseInt($('#timeLimitInput').val()) || 0,
        timeMode: $('input[name="timeMode"]:checked').val()
    };

    let diff = $('input[name="difficulty"]:checked').val();
    let filteredPuzzles = puzzles;
    if (diff !== 'all') {
        filteredPuzzles = puzzles.filter(p => (p.difficulty || 'medium') === diff);
        if (filteredPuzzles.length === 0) filteredPuzzles = puzzles;
    }

    let inputVal = parseInt($('#taskCountInput').val());
    let totalAvailable = filteredPuzzles.length;
    if (isNaN(inputVal) || inputVal < 1) inputVal = 1;
    if (inputVal > totalAvailable) inputVal = totalAvailable;

    let shuffled = shuffleArray([...filteredPuzzles]);
    sessionPuzzles = shuffled.slice(0, inputVal);

    sessionStats = {
        totalTimeSeconds: 0, totalClicks: 0, totalErrors: 0, solvedCount: 0,
        wChecks: { found: 0, total: 0 }, wCaps: { found: 0, total: 0 },
        bChecks: { found: 0, total: 0 }, bCaps: { found: 0, total: 0 }
    };
    currentPuzzleIndex = 0;

    if (settings.showLog) $('.log-container').removeClass('hidden');
    else $('.log-container').addClass('hidden');

    if (settings.sequentialMode && settings.autoFlip) {
        $('#flipBoardBtn').prop('disabled', true).css('opacity', '0.5');
    } else {
        $('#flipBoardBtn').prop('disabled', false).css('opacity', '1');
    }

    if (board) board.destroy();
    board = Chessboard('board', {
        draggable: true,
        showNotation: settings.showCoords,
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDragStart: onDragStart,
        onDrop: onDrop
    });

    $('.board-wrapper').on('scroll touchmove touchend', function (e) { e.preventDefault(); }, { passive: false });
    $('.view').removeClass('active').addClass('hidden');
    $('#gameScreen').removeClass('hidden').addClass('active');

    sessionStartTime = Date.now();

    if (settings.timeLimit > 0 && settings.timeMode === 'total') {
        limitEndTime = sessionStartTime + (settings.timeLimit * 1000);
        startTimer(true);
    } else if (settings.timeLimit === 0) {
        startTimer(false);
    }

    setTimeout(() => {
        loadPuzzle(0);
        if (board) board.resize();
    }, 200);
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

    $('#board .square-55d63').removeClass('highlight-found');
    $('#log-white').html('');
    $('#log-black').html('');

    if (!game.load(fen) && !game.load_pgn(fen)) { nextPuzzle(); return; }

    board.position(game.fen());
    board.orientation('white');
    board.resize();

    analyzeTargets(game.fen());

    sessionStats.wChecks.total += targets.w.checks.length;
    sessionStats.wCaps.total += targets.w.captures.length;
    sessionStats.bChecks.total += targets.b.checks.length;
    sessionStats.bCaps.total += targets.b.captures.length;

    updateGameUI();

    setStatus(langData['status_luck'], "#0050b3");

    if (settings.timeLimit > 0 && settings.timeMode === 'per_puzzle') {
        limitEndTime = Date.now() + (settings.timeLimit * 1000);
        startTimer(true);
    }

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

    let successfulClicks = sessionStats.totalClicks - sessionStats.totalErrors;
    if (successfulClicks < 0) successfulClicks = 0;
    let accuracy = (sessionStats.totalClicks > 0)
        ? Math.round((successfulClicks / sessionStats.totalClicks) * 100)
        : 0;

    $('#resAccuracy').text(accuracy + "%");
    if (accuracy >= 90) $('#resAccuracy').css('color', '#28a745');
    else if (accuracy >= 70) $('#resAccuracy').css('color', '#ffc107');
    else $('#resAccuracy').css('color', '#dc3545');

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

function onDragStart(source, piece) {
    if (settings.timeLimit > 0 && Date.now() > limitEndTime) return false;
    if (settings.sequentialMode) {
        let stage = STAGES[currentStageIndex];
        if (piece.charAt(0) !== stage.color) return false;
    }
    return true;
}

// --- НОВАЯ ВЕРСИЯ onDrop ---
let statusTimeout; // Переменная для таймера сброса статуса

function onDrop(source, target) {
    if (source === target) return;
    if (settings.timeLimit > 0 && Date.now() > limitEndTime) return 'snapback';
    if (target === 'offboard') return 'snapback';

    let piece = game.get(source);
    if (!piece) return 'snapback';

    // Проверка легальности
    let tempGame = new Chess(game.fen());
    if (tempGame.turn() !== piece.color) {
        let tokens = tempGame.fen().split(' ');
        tokens[1] = piece.color;
        tokens[3] = '-';
        tempGame.load(tokens.join(' '));
    }

    let moveAttempt = tempGame.move({ from: source, to: target, promotion: 'q' });

    if (moveAttempt === null) {
        // Показываем "Нельзя"
        setStatus(langData['status_illegal'], "#dc3545");

        // Через 1.5 секунды возвращаем "Удачи!" (если не было других сообщений)
        clearTimeout(statusTimeout);
        statusTimeout = setTimeout(() => {
            // Проверяем, не сменился ли статус на что-то другое (например, победу)
            let currentText = $('#statusMessage').text();
            if (currentText === langData['status_illegal']) {
                setStatus(langData['status_luck'], "#0050b3");
            }
        }, 1500);

        return 'snapback';
    }

    sessionStats.totalClicks++;
    let moveKey = source + '-' + target;
    let pieceType = piece.type;
    let pieceColor = piece.color;

    if (settings.sequentialMode) {
        let stage = STAGES[currentStageIndex];
        if (pieceColor !== stage.color) return 'snapback';
    }

    let tColor = targets[pieceColor];
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
            setStatus(langData['status_already'], "orange");
        } else {
            foundMoves.add(moveKey);
            if (settings.highlightFound) $('#board .square-' + target).addClass('highlight-found');

            if (isCheck && pieceColor === 'w') sessionStats.wChecks.found++;
            if (isCapture && pieceColor === 'w') sessionStats.wCaps.found++;
            if (isCheck && pieceColor === 'b') sessionStats.bChecks.found++;
            if (isCapture && pieceColor === 'b') sessionStats.bCaps.found++;

            setStatus(langData['status_correct'], "green");

            let moveObj = [...tColor.checks, ...tColor.captures].find(m => m.from === source && m.to === target);
            let san = moveObj ? moveObj.san : source + '-' + target;

            logMove(san, isCheck, isCapture, pieceColor, pieceType);
            updateGameUI();

            if (settings.sequentialMode) {
                checkStageCompletion();
            } else {
                if (checkIfAllFound()) {
                    setStatus(langData['status_solved'], "green");
                    setTimeout(nextPuzzle, 800);
                }
            }
        }
    } else {
        sessionStats.totalErrors++;
        if (wrongCategory) setStatus(langData['status_wrong_cat'], "#dc3545");
        else setStatus(langData['status_wrong'], "red");
    }
    return 'snapback';
}

function checkIfAllFound() {
    let allTargets = [...targets.w.checks, ...targets.w.captures, ...targets.b.checks, ...targets.b.captures];
    let uniqueNeeded = new Set(allTargets.map(m => m.from + '-' + m.to));
    return foundMoves.size === uniqueNeeded.size && uniqueNeeded.size > 0;
}

function updateGameUI() {
    $('#progressDisplay').text(`${currentPuzzleIndex + 1} / ${sessionPuzzles.length}`);

    if (settings.sequentialMode) {
        if (currentStageIndex < STAGES.length) {
            let stage = STAGES[currentStageIndex];
            $('#taskIndicator').removeClass('hidden');
            $('#currentTaskName').text(stage.name);
            if (settings.autoFlip) board.orientation(stage.color === 'w' ? 'white' : 'black');
        }
    } else {
        $('#taskIndicator').addClass('hidden');
    }

    updateCounter('w-checks', targets.w.checks);
    updateCounter('w-captures', targets.w.captures);
    updateCounter('b-checks', targets.b.checks);
    updateCounter('b-captures', targets.b.captures);
}

function updateCounter(id, list) {
    let found = 0;
    list.forEach(m => { if (foundMoves.has(m.from + '-' + m.to)) found++; });
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
        setStatus(langData['status_done'], "green");
        setTimeout(nextPuzzle, 800);
    }
}

function setStatus(msg, color) {
    if (settings.showText) $('#statusMessage').text(msg).css('color', color || '#333');
}

function toRussianSAN(san) {
    if (san === 'O-O' || san === 'O-O-O') return san;
    return san.replace(/N/g, 'К').replace(/B/g, 'С').replace(/R/g, 'Л')
        .replace(/Q/g, 'Ф').replace(/K/g, 'Кр').replace(/x/g, ':');
}

function logMove(san, isCheck, isCapture, color, pieceType) {
    let moveText = san;
    if (currentLang === 'ru') {
        moveText = toRussianSAN(san);
    }

    let badges = '';
    if (isCapture) badges += `<span class="badge bg-capture">${langData['log_capture']}</span>`;
    if (isCheck) badges += `<span class="badge bg-check">${langData['log_check']}</span>`;

    let html = `
        <div class="log-item">
            <span class="move-text">${moveText}</span>
            <div style="display:flex;">${badges}</div>
        </div>
    `;

    if (color === 'w') $('#log-white').prepend(html);
    else $('#log-black').prepend(html);
}

function startTimer(isCountdown) {
    if (timerInterval) clearInterval(timerInterval);
    const update = () => {
        let seconds;
        if (isCountdown) {
            let remaining = Math.ceil((limitEndTime - Date.now()) / 1000);
            if (remaining <= 0) {
                remaining = 0;
                handleTimeOut();
            }
            seconds = remaining;
            $('#gameTimer').css('color', seconds <= 10 ? '#ff4444' : 'white');
        } else {
            seconds = Math.floor((Date.now() - sessionStartTime) / 1000);
            $('#gameTimer').css('color', 'white');
        }
        $('#gameTimer').text(formatTime(seconds));
    };
    update();
    timerInterval = setInterval(update, 1000);
}

function stopTimer() { if (timerInterval) clearInterval(timerInterval); }

function handleTimeOut() {
    stopTimer();
    if (settings.timeMode === 'total') {
        $('#timeoutModal').removeClass('hidden');
    } else {
        setStatus(langData['status_timeout'], "red");
        setTimeout(() => { nextPuzzle(); }, 1000);
    }
}

function formatTime(s) {
    let m = Math.floor(s / 60);
    let sec = s % 60;
    return (m < 10 ? "0" + m : m) + ":" + (sec < 10 ? "0" + sec : sec);
}