// --- Constants ---
const TILE = 8;
const COLS = 33;  // 264 / 8
const ROWS = 25;  // 200 / 8
const PIXEL_ON = '#2d3319';
const PIXEL_OFF = '#8b9f6e';
const INITIAL_SPEED = 150; // ms per tick
const SPEED_INCREMENT = 2;
const MIN_SPEED = 60;

// --- State ---
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const hiscoreEl = document.getElementById('hiscore');
const startOverlay = document.getElementById('start-overlay');
const gameoverOverlay = document.getElementById('gameover-overlay');
const pauseOverlay = document.getElementById('pause-overlay');
const finalScoreEl = document.getElementById('final-score');

let snake, dir, nextDir, food, score, hiscore, speed, loop, running, paused;

hiscore = parseInt(localStorage.getItem('snake_hiscore') || '0', 10);
hiscoreEl.textContent = hiscore;

// --- Drawing helpers ---
function drawTile(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
}

function drawBorder() {
    ctx.fillStyle = PIXEL_ON;
    for (let x = 0; x < COLS; x++) {
        drawTile(x, 0, PIXEL_ON);
        drawTile(x, ROWS - 1, PIXEL_ON);
    }
    for (let y = 0; y < ROWS; y++) {
        drawTile(0, y, PIXEL_ON);
        drawTile(COLS - 1, y, PIXEL_ON);
    }
}

function drawSnake() {
    for (const seg of snake) {
        drawTile(seg.x, seg.y, PIXEL_ON);
    }
}

function drawFood() {
    // blinking food: draw a small cross pattern
    const f = food;
    ctx.fillStyle = PIXEL_ON;
    ctx.fillRect(f.x * TILE + 2, f.y * TILE, TILE - 4, TILE);
    ctx.fillRect(f.x * TILE, f.y * TILE + 2, TILE, TILE - 4);
}

function clearScreen() {
    ctx.fillStyle = PIXEL_OFF;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// --- Game logic ---
function spawnFood() {
    let pos;
    do {
        pos = {
            x: 1 + Math.floor(Math.random() * (COLS - 2)),
            y: 1 + Math.floor(Math.random() * (ROWS - 2))
        };
    } while (snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
}

function resetGame() {
    const cx = Math.floor(COLS / 2);
    const cy = Math.floor(ROWS / 2);
    snake = [
        { x: cx, y: cy },
        { x: cx - 1, y: cy },
        { x: cx - 2, y: cy },
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    speed = INITIAL_SPEED;
    scoreEl.textContent = score;
    food = spawnFood();
}

function tick() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision
    if (head.x <= 0 || head.x >= COLS - 1 || head.y <= 0 || head.y >= ROWS - 1) {
        return gameOver();
    }
    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
        return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreEl.textContent = score;
        food = spawnFood();
        speed = Math.max(MIN_SPEED, speed - SPEED_INCREMENT);
        restartLoop();
    } else {
        snake.pop();
    }

    render();
}

function render() {
    clearScreen();
    drawBorder();
    drawSnake();
    drawFood();
}

function gameOver() {
    running = false;
    clearInterval(loop);
    if (score > hiscore) {
        hiscore = score;
        localStorage.setItem('snake_hiscore', hiscore);
        hiscoreEl.textContent = hiscore;
    }
    finalScoreEl.textContent = 'Score: ' + score;
    gameoverOverlay.classList.remove('hidden');
}

function startGame() {
    startOverlay.classList.add('hidden');
    gameoverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
    paused = false;
    running = true;
    resetGame();
    render();
    restartLoop();
}

function restartLoop() {
    clearInterval(loop);
    loop = setInterval(tick, speed);
}

function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) {
        clearInterval(loop);
        pauseOverlay.classList.remove('hidden');
    } else {
        pauseOverlay.classList.add('hidden');
        restartLoop();
    }
}

function setDirection(dx, dy) {
    // Prevent reversing
    if (dir.x === -dx && dir.y === -dy) return;
    if (dx !== 0 && dir.x === dx) return;
    if (dy !== 0 && dir.y === dy) return;
    nextDir = { x: dx, y: dy };
}

// --- Input ---
document.addEventListener('keydown', (e) => {
    switch (e.key) {
        case 'ArrowUp':    case 'w': case 'W': setDirection(0, -1); e.preventDefault(); break;
        case 'ArrowDown':  case 's': case 'S': setDirection(0, 1);  e.preventDefault(); break;
        case 'ArrowLeft':  case 'a': case 'A': setDirection(-1, 0); e.preventDefault(); break;
        case 'ArrowRight': case 'd': case 'D': setDirection(1, 0);  e.preventDefault(); break;
        case 'Enter': if (!running) startGame(); break;
        case 'p': case 'P': togglePause(); break;
        case 'Escape': togglePause(); break;
    }
});

// D-pad touch/click
document.getElementById('btn-up').addEventListener('click', () => setDirection(0, -1));
document.getElementById('btn-down').addEventListener('click', () => setDirection(0, 1));
document.getElementById('btn-left').addEventListener('click', () => setDirection(-1, 0));
document.getElementById('btn-right').addEventListener('click', () => setDirection(1, 0));
document.getElementById('btn-start').addEventListener('click', () => { if (!running) startGame(); });
document.getElementById('btn-pause').addEventListener('click', togglePause);

// Touch support - prevent scrolling on d-pad
document.querySelectorAll('.touch-btn, .touch-softkey').forEach(btn => {
    btn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        btn.click();
    }, { passive: false });
});

// --- Initial render ---
clearScreen();
drawBorder();
