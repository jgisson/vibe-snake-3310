const canvas = document.getElementById('game-board');
const ctx = canvas.getContext('2d');
const scoreElement = document.getElementById('score');

// Game Settings
const gridSize = 8; // Smaller snake (was 20)
const tileCountX = canvas.width / gridSize;
const tileCountY = canvas.height / gridSize;
// Target: Cross screen (240px) in 10 seconds.
// 240 / 8 = 30 tiles.
// 10s / 30 tiles = 0.333s per tile.
const GAME_SPEED = 333;

// Colors
const COLOR_BG = '#c7f0d8';
const COLOR_SNAKE = '#43523d';
const COLOR_FOOD = '#43523d';

// Game State
let score = 0;
let snake = [];
let food = { x: 0, y: 0 };
let dx = 0;
let dy = 0;
let gameInterval;
let isGameRunning = false;
let nextDirection = { dx: 0, dy: 0 }; // Buffer for next input to prevent reversal suicide

// Initialize Game
function initGame() {
    snake = [
        { x: 10, y: 10 }, // Head
        { x: 9, y: 10 },
        { x: 8, y: 10 }
    ];
    score = 0;
    dx = 1; // Moving right initially
    dy = 0;
    nextDirection = { dx: 1, dy: 0 };
    scoreElement.innerText = score;
    placeFood();
    isGameRunning = true;
    
    if (gameInterval) clearInterval(gameInterval);
    gameInterval = setInterval(gameLoop, GAME_SPEED);
}

function gameLoop() {
    if (!isGameRunning) return;

    update();
    draw();
}

function update() {
    // Apply buffered direction
    dx = nextDirection.dx;
    dy = nextDirection.dy;

    // Calculate new head position
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // Collision with Walls
    if (head.x < 0 || head.x >= tileCountX || head.y < 0 || head.y >= tileCountY) {
        gameOver();
        return;
    }

    // Collision with Self
    for (let i = 0; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameOver();
            return;
        }
    }

    snake.unshift(head); // Add new head

    // Check if Ate Food
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreElement.innerText = score;
        placeFood();
        // Don't pop tail, so snake grows
    } else {
        snake.pop(); // Remove tail
    }
}

function draw() {
    // Clear Screen
    ctx.fillStyle = COLOR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Food
    ctx.fillStyle = COLOR_FOOD;
    // Draw food as a slightly rounded square or just a square
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize - 1, gridSize - 1);

    // Draw Snake
    ctx.fillStyle = COLOR_SNAKE;
    snake.forEach((segment) => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 1, gridSize - 1);
    });
}

function placeFood() {
    let valid = false;
    while (!valid) {
        food.x = Math.floor(Math.random() * tileCountX);
        food.y = Math.floor(Math.random() * tileCountY);

        valid = true;
        // Check if food spawned on snake body
        for (let segment of snake) {
            if (segment.x === food.x && segment.y === food.y) {
                valid = false;
                break;
            }
        }
    }
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameInterval);
    alert(`Game Over! Score: ${score}`);
    initGame(); // Restart immediately
}

// Input Handling
document.addEventListener('keydown', handleInput);

function handleInput(e) {
    if (!isGameRunning) return;

    switch (e.key) {
        case 'ArrowUp':
            if (dy === 0) nextDirection = { dx: 0, dy: -1 };
            break;
        case 'ArrowDown':
            if (dy === 0) nextDirection = { dx: 0, dy: 1 };
            break;
        case 'ArrowLeft':
            if (dx === 0) nextDirection = { dx: -1, dy: 0 };
            break;
        case 'ArrowRight':
            if (dx === 0) nextDirection = { dx: 1, dy: 0 };
            break;
    }
}

// On-screen Controls
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');
const btnAction = document.getElementById('btn-action');

// Touch/Click support for buttons
btnUp.addEventListener('click', () => { if (dy === 0) nextDirection = { dx: 0, dy: -1 }; });
btnDown.addEventListener('click', () => { if (dy === 0) nextDirection = { dx: 0, dy: 1 }; });
btnLeft.addEventListener('click', () => { if (dx === 0) nextDirection = { dx: -1, dy: 0 }; });
btnRight.addEventListener('click', () => { if (dx === 0) nextDirection = { dx: 1, dy: 0 }; });
btnAction.addEventListener('click', () => {
    if (!isGameRunning) initGame();
});

// Start the game
initGame();
