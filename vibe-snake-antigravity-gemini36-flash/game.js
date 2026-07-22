/**
 * Vibe Snake 3310 - Antigravity Gemini 3.6 Flash Edition
 * Game Logic & Sound Synth Engine
 */

// --- Configuration Constants ---
const GRID_COLS = 20;
const GRID_ROWS = 15;
const CELL_SIZE = 12; // 20 * 12 = 240, 15 * 12 = 180 canvas resolution
const LOCAL_STORAGE_KEY = 'vibe_snake_3310_highscore';

// --- State Variables ---
let canvas, ctx;
let gameState = 'START'; // 'START', 'PLAYING', 'PAUSED', 'GAMEOVER'
let snake = [];
let dir = { x: 1, y: 0 };
let nextDir = { x: 1, y: 0 };
let food = { x: 0, y: 0, type: 'normal' };
let score = 0;
let highScore = 0;
let speedLevel = 2; // 1: Slow (160ms), 2: Normal (110ms), 3: Fast (75ms)
let tickInterval = 110;
let lastTickTime = 0;
let wallSolid = true;
let soundEnabled = true;
let blinkState = true;
let blinkTimer = 0;

// --- Audio Engine (Web Audio API) ---
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playBeep(freq, type = 'square', duration = 0.08, vol = 0.15) {
  if (!soundEnabled) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

function playToneSequence(notes) {
  if (!soundEnabled) return;
  notes.forEach(([freq, delay, dur]) => {
    setTimeout(() => playBeep(freq, 'square', dur, 0.12), delay);
  });
}

const soundFX = {
  click: () => playBeep(600, 'square', 0.03, 0.08),
  eat: () => playToneSequence([[523, 0, 0.05], [659, 50, 0.08]]),
  bonus: () => playToneSequence([[659, 0, 0.06], [783, 60, 0.06], [987, 120, 0.1]]),
  die: () => playToneSequence([[300, 0, 0.1], [240, 100, 0.1], [180, 200, 0.25]]),
  highscore: () => playToneSequence([[440, 0, 0.08], [554, 80, 0.08], [659, 160, 0.08], [880, 240, 0.2]])
};

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
  canvas = document.getElementById('gameCanvas');
  ctx = canvas.getContext('2d');

  // Load persistent high score
  loadHighScore();

  // Keyboard event listeners
  window.addEventListener('keydown', handleKeyDown);

  // Start main animation loop
  requestAnimationFrame(gameLoop);
});

function loadHighScore() {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    highScore = saved ? parseInt(saved, 10) : 0;
    if (isNaN(highScore)) highScore = 0;
  } catch (e) {
    highScore = 0;
  }
  updateHighScoreDisplay();
}

function saveHighScore(val) {
  highScore = val;
  updateHighScoreDisplay();
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, highScore.toString());
  } catch (e) {
    console.warn('LocalStorage save failed', e);
  }
}

function updateHighScoreDisplay() {
  const formatted = highScore.toString().padStart(4, '0');
  document.getElementById('highScoreDisplay').textContent = formatted;
}

function resetHighScore() {
  soundFX.click();
  if (confirm('Reset persistent high score to 0000?')) {
    saveHighScore(0);
  }
}

// --- Game Logic Engine ---
function initGame() {
  snake = [
    { x: 5, y: 7 },
    { x: 4, y: 7 },
    { x: 3, y: 7 }
  ];
  dir = { x: 1, y: 0 };
  nextDir = { x: 1, y: 0 };
  score = 0;
  spawnFood();
  gameState = 'PLAYING';
  soundFX.click();
}

function spawnFood() {
  let valid = false;
  while (!valid) {
    food.x = Math.floor(Math.random() * GRID_COLS);
    food.y = Math.floor(Math.random() * GRID_ROWS);
    valid = !snake.some(segment => segment.x === food.x && segment.y === food.y);
  }
  // 20% chance of bonus item
  food.type = Math.random() < 0.2 ? 'bonus' : 'normal';
}

function updateGame() {
  if (gameState !== 'PLAYING') return;

  // Apply pending direction change
  dir = { ...nextDir };

  // Calculate new head coordinate
  let headX = snake[0].x + dir.x;
  let headY = snake[0].y + dir.y;

  // Handle Wall Logic
  if (wallSolid) {
    if (headX < 0 || headX >= GRID_COLS || headY < 0 || headY >= GRID_ROWS) {
      triggerGameOver();
      return;
    }
  } else {
    // Portal wrap-around
    if (headX < 0) headX = GRID_COLS - 1;
    if (headX >= GRID_COLS) headX = 0;
    if (headY < 0) headY = GRID_ROWS - 1;
    if (headY >= GRID_ROWS) headY = 0;
  }

  // Self-collision check
  if (snake.some(segment => segment.x === headX && segment.y === headY)) {
    triggerGameOver();
    return;
  }

  // Add new head segment
  const newHead = { x: headX, y: headY };
  snake.unshift(newHead);

  // Check Food Collision
  if (headX === food.x && headY === food.y) {
    const points = food.type === 'bonus' ? 30 : 10;
    score += points;

    if (food.type === 'bonus') {
      soundFX.bonus();
    } else {
      soundFX.eat();
    }

    // Check New High Score
    if (score > highScore) {
      saveHighScore(score);
    }

    spawnFood();
  } else {
    // Remove tail segment if no food eaten
    snake.pop();
  }
}

function triggerGameOver() {
  gameState = 'GAMEOVER';
  soundFX.die();
}

// --- Input Processing ---
function handleKeyDown(e) {
  // Get audio context on first user touch/key
  getAudioContext();

  const key = e.key;

  if (key === 'ArrowUp' || key === 'w' || key === 'W' || key === '2') {
    if (dir.y === 0) nextDir = { x: 0, y: -1 };
    e.preventDefault();
  } else if (key === 'ArrowDown' || key === 's' || key === 'S' || key === '8') {
    if (dir.y === 0) nextDir = { x: 0, y: 1 };
    e.preventDefault();
  } else if (key === 'ArrowLeft' || key === 'a' || key === 'A' || key === '4') {
    if (dir.x === 0) nextDir = { x: -1, y: 0 };
    e.preventDefault();
  } else if (key === 'ArrowRight' || key === 'd' || key === 'D' || key === '6') {
    if (dir.x === 0) nextDir = { x: 1, y: 0 };
    e.preventDefault();
  } else if (key === ' ' || key === 'Enter' || key === '5') {
    handleSoftRight();
    e.preventDefault();
  } else if (key === 'r' || key === 'R') {
    initGame();
    e.preventDefault();
  } else if (key === 'm' || key === 'M') {
    toggleMute();
    e.preventDefault();
  }
}

function triggerKey(keyName) {
  handleKeyDown({ key: keyName, preventDefault: () => {} });
}

function handleSoftLeft() {
  soundFX.click();
  if (gameState === 'PLAYING') {
    gameState = 'PAUSED';
  } else if (gameState === 'PAUSED') {
    gameState = 'PLAYING';
  } else {
    initGame();
  }
}

function handleSoftRight() {
  soundFX.click();
  if (gameState === 'START' || gameState === 'GAMEOVER') {
    initGame();
  } else if (gameState === 'PLAYING') {
    gameState = 'PAUSED';
  } else if (gameState === 'PAUSED') {
    gameState = 'PLAYING';
  }
}

function handleNaviKey() {
  handleSoftRight();
}

// --- Settings & UI Handlers ---
function setLCDTheme(themeName, btnEl) {
  soundFX.click();
  document.body.className = '';
  if (themeName !== 'green') {
    document.body.classList.add('theme-' + themeName);
  }
  
  const parent = btnEl.parentElement;
  parent.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
}

function setSpeed(level, btnEl) {
  soundFX.click();
  speedLevel = level;
  tickInterval = level === 1 ? 160 : (level === 2 ? 110 : 70);
  document.getElementById('lcdSpeedState').textContent = `SPD: ${level}`;

  const parent = btnEl.parentElement;
  parent.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
}

function setWallMode(isSolid, btnEl) {
  soundFX.click();
  wallSolid = isSolid;
  document.getElementById('lcdModeState').textContent = isSolid ? 'WALL: ON' : 'WALL: OFF';

  const parent = btnEl.parentElement;
  parent.querySelectorAll('.btn-toggle').forEach(b => b.classList.remove('active'));
  btnEl.classList.add('active');
}

function setAudioMute(mute) {
  soundEnabled = !mute;
  document.getElementById('lcdSoundState').textContent = soundEnabled ? '🔊 ON' : '🔇 OFF';
  document.getElementById('btnAudioOn').classList.toggle('active', soundEnabled);
  document.getElementById('btnAudioOff').classList.toggle('active', !soundEnabled);
  soundFX.click();
}

function toggleMute() {
  setAudioMute(soundEnabled);
}

// --- Render Engine ---
function gameLoop(timestamp) {
  // Handle blink timer for retro menu text
  if (timestamp - blinkTimer > 450) {
    blinkState = !blinkState;
    blinkTimer = timestamp;
  }

  // Handle game ticks
  if (gameState === 'PLAYING') {
    if (timestamp - lastTickTime > tickInterval) {
      updateGame();
      lastTickTime = timestamp;
    }
  }

  draw();
  requestAnimationFrame(gameLoop);
}

function drawLCDBackground() {
  const darkColor = getComputedStyle(document.body).getPropertyValue('--lcd-dark').trim() || '#0f380f';
  ctx.fillStyle = darkColor;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw outer LCD border inset line
  ctx.strokeStyle = darkColor;
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, canvas.width, canvas.height);
}

function drawPixelSquare(x, y, filled = true, inset = false) {
  const darkColor = getComputedStyle(document.body).getPropertyValue('--lcd-dark').trim() || '#0f380f';
  const px = x * CELL_SIZE;
  const py = y * CELL_SIZE;

  if (filled) {
    ctx.fillStyle = darkColor;
    ctx.fillRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
    
    // Classic Nokia dot-matrix segment gap line
    ctx.clearRect(px + 3, py + 3, CELL_SIZE - 6, CELL_SIZE - 6);
    ctx.fillRect(px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8);
  } else {
    // Subtle outline for food or objects
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
  }
}

function draw() {
  const darkColor = getComputedStyle(document.body).getPropertyValue('--lcd-dark').trim() || '#0f380f';
  drawLCDBackground();

  if (gameState === 'START') {
    // Draw Retro Snake Logo & Start Text
    ctx.fillStyle = darkColor;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    
    ctx.fillText('S N A K E  3310', canvas.width / 2, 40);

    // Draw mini decorative snake graphic
    const logoPoints = [{x:6,y:6},{x:7,y:6},{x:8,y:6},{x:9,y:6},{x:9,y:7},{x:9,y:8},{x:10,y:8},{x:11,y:8}];
    logoPoints.forEach(p => drawPixelSquare(p.x, p.y, true));
    drawPixelSquare(13, 8, false); // Food

    ctx.font = '8px "Press Start 2P", monospace';
    if (blinkState) {
      ctx.fillText('PRESS [5] / OK', canvas.width / 2, 125);
      ctx.fillText('TO PLAY', canvas.width / 2, 140);
    }

    ctx.font = '7px "Press Start 2P", monospace';
    ctx.fillText(`BEST: ${highScore.toString().padStart(4, '0')}`, canvas.width / 2, 168);

  } else if (gameState === 'PLAYING' || gameState === 'PAUSED') {
    
    // Draw Food
    if (food.type === 'bonus') {
      // Blinking star / bonus food
      if (blinkState) {
        drawPixelSquare(food.x, food.y, true);
      } else {
        drawPixelSquare(food.x, food.y, false);
      }
    } else {
      drawPixelSquare(food.x, food.y, true);
    }

    // Draw Snake
    snake.forEach((segment, idx) => {
      drawPixelSquare(segment.x, segment.y, true);
    });

    // Draw HUD score line inside LCD bottom
    ctx.fillStyle = darkColor;
    ctx.font = '8px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`SCR:${score}`, 4, canvas.height - 4);
    ctx.textAlign = 'right';
    ctx.fillText(`HI:${highScore}`, canvas.width - 4, canvas.height - 4);

    // Draw Pause overlay
    if (gameState === 'PAUSED') {
      ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--lcd-bg').trim() || '#9bbc0f';
      ctx.fillRect(40, 60, 160, 50);
      ctx.strokeStyle = darkColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(40, 60, 160, 50);

      ctx.fillStyle = darkColor;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('P A U S E D', canvas.width / 2, 90);
    }

  } else if (gameState === 'GAMEOVER') {
    // Draw dead snake
    snake.forEach((segment) => {
      drawPixelSquare(segment.x, segment.y, true);
    });

    // Game over dialog banner
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--lcd-bg').trim() || '#9bbc0f';
    ctx.fillRect(20, 35, 200, 110);
    ctx.strokeStyle = darkColor;
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 35, 200, 110);

    ctx.fillStyle = darkColor;
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER!', canvas.width / 2, 60);

    ctx.font = '8px "Press Start 2P", monospace';
    ctx.fillText(`SCORE: ${score}`, canvas.width / 2, 85);
    ctx.fillText(`HIGH: ${highScore}`, canvas.width / 2, 102);

    if (blinkState) {
      ctx.fillText('PRESS OK / 5', canvas.width / 2, 130);
    }
  }
}
