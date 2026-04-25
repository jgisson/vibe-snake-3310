// --- Game Constants ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const GRID_SIZE = 20; // Size of one cell in pixels
const GRID_COUNT = canvas.width / GRID_SIZE; // Number of cells (e.g., 300/20 = 15)
const GAME_SPEED = 100; // Milliseconds per frame (lower is faster)

// --- Game State ---
let snake = [{ x: 10, y: 10 }]; // Initial snake position (center)
let food = generateFood();
let dx = 1; // Direction x: 1 right, -1 left, 0 vertical
let dy = 0; // Direction y: 1 down, -1 up, 0 horizontal
let score = 0;
let gameInterval = null;
let isGameRunning = false;
let highscore = parseInt(localStorage.getItem('snakeHighScore')) || 0;

// --- DOM Elements ---
const scoreDisplay = document.getElementById('score');
const highScoreDisplay = document.getElementById('high-score');
const startButton = document.getElementById('start-button');

// --- Initialization ---
function initGame() {
    // Reset state
    snake = [{ x: 10, y: 10 }];
    dx = 1;
    dy = 0;
    score = 0;
    food = generateFood();
    isGameRunning = false;
    
    // Update UI
    scoreDisplay.textContent = 'Score: 0';
    highScoreDisplay.textContent = 'High Score: ' + highscore;
    startButton.textContent = 'Start Game';
    startButton.disabled = false;

    // Clear any existing interval
    if (gameInterval) {
        clearInterval(gameInterval);
    }
    
    // Draw initial state
    drawGame();
}

function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * GRID_COUNT),
            y: Math.floor(Math.random() * GRID_COUNT)
        };
    } while (isSnakeBody(newFood)); // Ensure food doesn't spawn on the snake
    return newFood;
}

function isSnakeBody(pos) {
    return snake.some(segment => segment.x === pos.x && segment.y === pos.y);
}

// --- Drawing Functions ---
function drawGame() {
    // 1. Clear canvas
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2. Draw Food (Apple/Dot)
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * GRID_SIZE, food.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);

    // 3. Draw Snake
    snake.forEach((segment, index) => {
        if (index === 0) {
            // Head
            ctx.fillStyle = '#006400'; // Dark green for head
        } else {
            // Body
            ctx.fillStyle = '#3cb371'; // Medium sea green for body
        }
        // Draw with a slight gap for pixelated effect
        ctx.fillRect(segment.x * GRID_SIZE, segment.y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
    });
}

// --- Game Logic ---
function moveSnake() {
    // 1. Calculate new head position
    const head = { x: snake[0].x + dx, y: snake[0].y + dy };

    // 2. Check for collisions
    if (checkCollision(head)) {
        gameOver();
        return;
    }

    // 3. Add new head to the front
    snake.unshift(head);

    // 4. Check for food consumption
    if (head.x === food.x && head.y === food.y) {
        score += 10;
        scoreDisplay.textContent = 'Score: ' + score;
        food = generateFood(); // Generate new food
        // Don't remove the tail, effectively making the snake longer
    } else {
        // If no food eaten, remove the tail segment
        snake.pop();
    }

    // 5. Redraw and update
    drawGame();
    updateHighScore();
}

function checkCollision(head) {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_COUNT || head.y < 0 || head.y >= GRID_COUNT) {
        return true;
    }

    // Self collision (check if the new head position matches any body segment)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    return false;
}

function gameOver() {
    isGameRunning = false;
    clearInterval(gameInterval);
    
    // Update high score if necessary
    if (score > highscore) {
        highscore = score;
        localStorage.setItem('snakeHighScore', highscore);
        highScoreDisplay.textContent = 'High Score: ' + highscore;
        alert(`Game Over! Your Score: ${score}. New High Score!`);
    } else {
        alert(`Game Over! Your Score: ${score}.`);
    }
    
    startButton.textContent = 'Play Again';
    startButton.disabled = false;
}

function updateHighScore() {
    highScoreDisplay.textContent = 'High Score: ' + highscore;
}

// --- Input Handling ---
function changeDirection(newDx, newDy) {
    // Prevent immediate reversal (e.g., moving right then immediately pressing left)
    if (dx !== -newDx || dy !== -newDy) {
        dx = newDx;
        dy = newDy;
    }
}

document.addEventListener('keydown', e => {
    if (!isGameRunning) return;

    switch (e.key) {
        case 'ArrowLeft':
        case 'a':
            changeDirection(-1, 0);
            break;
        case 'ArrowUp':
        case 'w':
            changeDirection(0, -1);
            break;
        case 'ArrowRight':
        case 'd':
            changeDirection(1, 0);
            break;
        case 'ArrowDown':
        case 's':
            changeDirection(0, 1);
            break;
        default:
            return;
    }
    e.preventDefault();
});

// --- Game Loop Control ---
function startGame() {
    if (isGameRunning) return;
    
    // Reset and start
    initGame();
    isGameRunning = true;
    startButton.textContent = 'Playing...';
    startButton.disabled = true;
    
    // Start the game loop
    gameInterval = setInterval(moveSnake, GAME_SPEED);
}

// --- Event Listeners ---
startButton.addEventListener('click', startGame);

// Initialize the game state when the page loads
window.onload = initGame;