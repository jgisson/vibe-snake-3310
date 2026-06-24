// ==== SETUP ====
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highscoreEl = document.getElementById('highscore');
const gameoverEl = document.getElementById('gameover');
const restartBtn = document.getElementById('restart');

// Game config - canvas is 222x222, GRID_SIZE x CELL should fit
const GRID_SIZE = 12;
const CELL = 18;
const SPEED = 150;

// Game state
let snake = [{x: 6, y: 6}];
let food = {x: 3, y: 3};
let direction = {x: 0, y: 0};
let nextDirection = {x: 0, y: 0};
let score = 0;
let highscore = parseInt(localStorage.getItem('snake3310_highscore') || '0');
let gameRunning = false;
let gameLoop;

// ==== INIT ====
function init() {
    highscoreEl.textContent = highscore;
    restartBtn.addEventListener('click', reset);
    document.addEventListener('keydown', handleKey);
    reset();
}

// ==== RESET ====
function reset() {
    clearInterval(gameLoop);
    snake = [{x: 6, y: 6}];
    direction = {x: 0, y: 0};
    nextDirection = {x: 0, y: 0};
    score = 0;
    scoreEl.textContent = score;
    gameoverEl.style.display = 'none';
    placeFood();
    gameRunning = true;
    gameLoop = setInterval(update, SPEED);
}

// ==== UPDATE ====
function update() {
    direction = {...nextDirection};

    // Move snake
    const head = {x: snake[0].x + direction.x, y: snake[0].y + direction.y};
    snake.unshift(head);

    // Check food
    if (head.x === food.x && head.y === food.y) {
        score++;
        scoreEl.textContent = score;
        placeFood();
    } else {
        snake.pop();
    }

    // Check collisions
    if (
        head.x < 0 || head.x >= GRID_SIZE ||
        head.y < 0 || head.y >= GRID_SIZE ||
        snake.slice(1).some(s => s.x === head.x && s.y === head.y)
    ) {
        gameOver();
        return;
    }

    // Update highscore
    if (score > highscore) {
        highscore = score;
        highscoreEl.textContent = highscore;
        localStorage.setItem('snake3310_highscore', highscore);
    }

    draw();
}

// ==== DRAW ====
function draw() {
    // Clear
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw snake
    snake.forEach((s, i) => {
        const alpha = i === 0 ? 1 : 0.7;
        ctx.fillStyle = i === 0 ? '#0f0' : `rgba(0, 255, 0, ${alpha})`;
        ctx.fillRect(s.x * CELL, s.y * CELL, CELL - 2, CELL - 2);
    });

    // Draw food
    ctx.fillStyle = '#f00';
    ctx.beginPath();
    const centerX = food.x * CELL + CELL / 2;
    const centerY = food.y * CELL + CELL / 2;
    const radius = CELL / 2 - 2;
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Grid lines
    ctx.strokeStyle = '#0f02';
    ctx.lineWidth = 1;
    for (let i = 0; i < GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL, 0);
        ctx.lineTo(i * CELL, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL);
        ctx.lineTo(canvas.width, i * CELL);
        ctx.stroke();
    }
}

// ==== FOOD ====
function placeFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE)
        };
    } while (snake.some(s => s.x === newFood.x && s.y === newFood.y));
    food = newFood;
}

// ==== GAME OVER ====
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    gameoverEl.style.display = 'block';
}

// ==== INPUT ====
function handleKey(e) {
    const keyMap = {
        'ArrowUp': {x: 0, y: -1},
        'ArrowDown': {x: 0, y: 1},
        'ArrowLeft': {x: -1, y: 0},
        'ArrowRight': {x: 1, y: 0},
        'w': {x: 0, y: -1},
        's': {x: 0, y: 1},
        'a': {x: -1, y: 0},
        'd': {x: 1, y: 0}
    };
    const newDir = keyMap[e.key];
    if (newDir) {
        // Prevent 180-degree turns
        if (
            !(direction.x === -newDir.x && direction.y === -newDir.y) &&
            !(direction.x === newDir.x && direction.y === newDir.y)
        ) {
            nextDirection = newDir;
        }
        if (!gameRunning) {
            reset();
        }
    }
}

// ==== START ====
init();
