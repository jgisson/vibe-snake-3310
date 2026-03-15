(function () {
  // ── CONFIG ──────────────────────────────────────────────────────────────────
  const COLS = 22, ROWS = 14;
  const CELL = 10; // px per grid cell
  const BASE_INTERVAL  = 200; // ms, level 1 speed
  const MIN_INTERVAL   = 60;  // ms, max speed
  const POINTS_PER_FOOD = 10;
  const LEVEL_EVERY    = 5;   // foods per level-up

  // Nokia LCD palette
  const CLR_BG    = '#7a9a40';
  const CLR_GRID  = '#6a8a35';
  const CLR_SNAKE = '#1a2a08';
  const CLR_HEAD  = '#0a1804';
  const CLR_FOOD  = '#2a3a10';
  const CLR_FOOD2 = '#4a6020'; // food blink alt

  // ── STATE ───────────────────────────────────────────────────────────────────
  let snake, dir, nextDir, food, score, hiScore, level, foodCount;
  let gameState = 'idle'; // idle | running | paused | dead
  let loopTimer = null;
  let foodBlink = false, blinkTimer = null;

  const canvas  = document.getElementById('game');
  const ctx     = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');

  // ── PERSISTENCE ─────────────────────────────────────────────────────────────
  function loadHi() {
    return parseInt(localStorage.getItem('snake3310_hi') || '0', 10);
  }
  function saveHi(s) {
    localStorage.setItem('snake3310_hi', s);
  }

  // ── INIT ────────────────────────────────────────────────────────────────────
  function initGame() {
    const midX = Math.floor(COLS / 2);
    const midY = Math.floor(ROWS / 2);
    snake = [
      { x: midX,     y: midY },
      { x: midX - 1, y: midY },
      { x: midX - 2, y: midY },
    ];
    dir     = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score     = 0;
    level     = 1;
    foodCount = 0;
    hiScore   = loadHi();
    placeFood();
    updateHUD();
  }

  function placeFood() {
    const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
    let f;
    do {
      f = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) };
    } while (occupied.has(`${f.x},${f.y}`));
    food = f;
  }

  // ── GAME LOOP ────────────────────────────────────────────────────────────────
  function startLoop() {
    clearInterval(loopTimer);
    const interval = Math.max(MIN_INTERVAL, BASE_INTERVAL - (level - 1) * 18);
    loopTimer = setInterval(tick, interval);
  }

  function tick() {
    dir = { ...nextDir };
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    // Wall collision — hard walls like the original 3310
    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return endGame();
    }
    // Self collision
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      return endGame();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score += POINTS_PER_FOOD * level;
      foodCount++;
      if (score > hiScore) { hiScore = score; saveHi(hiScore); }
      if (foodCount % LEVEL_EVERY === 0) { level++; startLoop(); }
      placeFood();
      updateHUD();
    } else {
      snake.pop();
    }

    draw();
  }

  function endGame() {
    clearInterval(loopTimer);
    clearInterval(blinkTimer);
    gameState = 'dead';
    draw();
    showOverlay('GAME OVER', 'Press OK to retry', `Score: ${score}  Hi: ${hiScore}`);
  }

  // ── DRAWING ──────────────────────────────────────────────────────────────────
  function draw() {
    ctx.fillStyle = CLR_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Subtle checkerboard grid
    ctx.fillStyle = CLR_GRID;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if ((r + c) % 2 === 0) ctx.fillRect(c * CELL, r * CELL, CELL, CELL);
      }
    }

    // Food body + cross sprite
    ctx.fillStyle = foodBlink ? CLR_FOOD2 : CLR_FOOD;
    ctx.fillRect(food.x * CELL + 2, food.y * CELL + 2, CELL - 4, CELL - 4);
    ctx.fillStyle = foodBlink ? CLR_FOOD : CLR_FOOD2;
    ctx.fillRect(food.x * CELL + 4, food.y * CELL + 1, 2, CELL - 2);
    ctx.fillRect(food.x * CELL + 1, food.y * CELL + 4, CELL - 2, 2);

    // Snake body
    ctx.fillStyle = CLR_SNAKE;
    for (let i = 1; i < snake.length; i++) {
      const s = snake[i];
      ctx.fillRect(s.x * CELL + 1, s.y * CELL + 1, CELL - 2, CELL - 2);
    }

    // Snake head + directional eyes
    const h = snake[0];
    ctx.fillStyle = CLR_HEAD;
    ctx.fillRect(h.x * CELL, h.y * CELL, CELL, CELL);
    ctx.fillStyle = CLR_BG;
    const [e1x, e1y, e2x, e2y] = getEyeOffsets();
    ctx.fillRect(h.x * CELL + e1x, h.y * CELL + e1y, 2, 2);
    ctx.fillRect(h.x * CELL + e2x, h.y * CELL + e2y, 2, 2);

    // Death dim overlay
    if (gameState === 'dead') {
      ctx.fillStyle = 'rgba(26,42,8,0.35)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  }

  function getEyeOffsets() {
    // Returns [eye1x, eye1y, eye2x, eye2y] relative to head cell top-left
    if (dir.x === 1)  return [6, 2, 6, 6]; // right
    if (dir.x === -1) return [2, 2, 2, 6]; // left
    if (dir.y === -1) return [2, 2, 6, 2]; // up
    return [2, 6, 6, 6];                   // down
  }

  // ── HUD ──────────────────────────────────────────────────────────────────────
  function updateHUD() {
    document.getElementById('score-display').textContent = `SCR: ${score}`;
    document.getElementById('hi-display').textContent    = `HI: ${hiScore}`;
    document.getElementById('speed-display').textContent = `LVL: ${level}`;
  }

  // ── OVERLAY ──────────────────────────────────────────────────────────────────
  function showOverlay(title, sub, extra) {
    overlay.classList.remove('hidden');
    document.getElementById('overlay-title').textContent = title;
    document.getElementById('overlay-sub').textContent   = sub   || '';
    document.getElementById('overlay-score').textContent = extra || '';
  }

  function hideOverlay() {
    overlay.classList.add('hidden');
  }

  // ── CONTROLS ─────────────────────────────────────────────────────────────────
  function handleAction() {
    if (gameState === 'idle' || gameState === 'dead') {
      initGame();
      hideOverlay();
      gameState = 'running';
      startFoodBlink();
      startLoop();
      draw();
    } else if (gameState === 'paused') {
      resumeGame();
    }
  }

  function handlePause() {
    if (gameState === 'running') {
      clearInterval(loopTimer);
      clearInterval(blinkTimer);
      gameState = 'paused';
      showOverlay('PAUSED', 'Press OK or P');
    } else if (gameState === 'paused') {
      resumeGame();
    }
  }

  function resumeGame() {
    hideOverlay();
    gameState = 'running';
    startFoodBlink();
    startLoop();
  }

  function setDir(dx, dy) {
    // Prevent 180° reversal
    if (dx !== 0 && dir.x !== 0) return;
    if (dy !== 0 && dir.y !== 0) return;
    nextDir = { x: dx, y: dy };
  }

  function startFoodBlink() {
    clearInterval(blinkTimer);
    blinkTimer = setInterval(() => {
      foodBlink = !foodBlink;
      if (gameState === 'running') draw();
    }, 500);
  }

  function resetToIdle() {
    clearInterval(loopTimer);
    clearInterval(blinkTimer);
    gameState = 'idle';
    initGame();
    draw();
    showOverlay('SNAKE', 'Press OK to start');
  }

  // ── INPUT: keyboard ──────────────────────────────────────────────────────────
  document.addEventListener('keydown', e => {
    switch (e.key) {
      case 'ArrowUp':    case 'w': case 'W': e.preventDefault(); if (gameState === 'running') setDir(0, -1);  break;
      case 'ArrowDown':  case 's': case 'S': e.preventDefault(); if (gameState === 'running') setDir(0,  1);  break;
      case 'ArrowLeft':  case 'a': case 'A': e.preventDefault(); if (gameState === 'running') setDir(-1, 0);  break;
      case 'ArrowRight': case 'd': case 'D': e.preventDefault(); if (gameState === 'running') setDir(1,  0);  break;
      case 'Enter': case ' ':                e.preventDefault(); handleAction(); break;
      case 'p': case 'P':                    e.preventDefault(); handlePause();  break;
      case 'r': case 'R':                    e.preventDefault(); resetToIdle();  break;
    }
  });

  // ── INPUT: on-screen buttons ─────────────────────────────────────────────────
  function bindBtn(id, fn) {
    const el = document.getElementById(id);
    el.addEventListener('click', fn);
    el.addEventListener('touchstart', e => { e.preventDefault(); fn(); }, { passive: false });
  }

  bindBtn('btn-up',    () => { if (gameState === 'running') setDir(0, -1); });
  bindBtn('btn-down',  () => { if (gameState === 'running') setDir(0,  1); });
  bindBtn('btn-left',  () => { if (gameState === 'running') setDir(-1, 0); });
  bindBtn('btn-right', () => { if (gameState === 'running') setDir(1,  0); });
  bindBtn('btn-ok',    () => handleAction());
  bindBtn('btn-pause', () => handlePause());
  bindBtn('btn-reset', () => resetToIdle());

  // ── BOOT ────────────────────────────────────────────────────────────────────
  initGame();
  draw();
  showOverlay('SNAKE', 'Press OK to start');

})();
