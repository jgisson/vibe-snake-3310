"use strict";

/* Vibe Snake 3310 - game logic. Loaded with `defer`, so the DOM is ready. */
(function () {

  /* Tweak these to change how the game feels. */
  const CONFIG = {
    cols: 34,            // board width in cells (34x20 ~ the 3310's own 84x48 ratio)
    rows: 20,            // board height in cells
    startLength: 4,
    startMs: 130,        // ms per step at score 0
    minMs: 55,           // fastest step
    speedUpPerFood: 3,   // ms shaved off each step per food eaten
    growPerFood: 2,      // cells added per food
    wrapWalls: false,    // true = walk through walls instead of dying
    swipeThreshold: 14,  // px of travel before a drag counts as a swipe
    storageKey: "vibe-snake-3310-best",
  };

  const DIRS = {
    up:    { x:  0, y: -1 },
    down:  { x:  0, y:  1 },
    left:  { x: -1, y:  0 },
    right: { x:  1, y:  0 },
  };

  /* Arrows, WASD, and the 3310's own 2/4/6/8 keys. */
  const KEYS = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
    2: "up", 8: "down", 4: "left", 6: "right",
  };

  /* ---------- dom ---------- */

  const canvas = document.getElementById("board");
  const ctx = canvas.getContext("2d");
  const lcd = document.querySelector(".lcd");
  const els = {
    score: document.getElementById("score"),
    best: document.getElementById("best"),
    overlay: document.getElementById("overlay"),
    title: document.getElementById("overlayTitle"),
    body: document.getElementById("overlayBody"),
    hint: document.getElementById("overlayHint"),
  };

  /* The palette lives in style.css so there is one source of truth. */
  const cssVar = (name, fallback) => {
    const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return value || fallback;
  };
  const COLOR = {
    lcd: cssVar("--lcd", "#97b163"),
    ink: cssVar("--ink", "#1b2410"),
    dim: cssVar("--ink-dim", "rgba(27,36,16,.2)"),
  };

  /* ---------- model ---------- */

  let state = null;    // set by newGame()
  let phase = "idle";  // idle | playing | paused | over
  let best = loadBest();
  let muted = false;
  let lastStep = 0;
  let cell = 10;       // device px per cell, recomputed by fitCanvas()

  function loadBest() {
    try { return Number(localStorage.getItem(CONFIG.storageKey)) || 0; }
    catch { return 0; }
  }

  function saveBest(value) {
    try { localStorage.setItem(CONFIG.storageKey, String(value)); } catch {}
  }

  function newGame() {
    const midY = Math.floor(CONFIG.rows / 2);
    const snake = [];
    for (let i = 0; i < CONFIG.startLength; i++) snake.push({ x: 4 - i, y: midY });

    state = {
      snake,
      dir: DIRS.right,
      queue: [],
      grow: 0,
      score: 0,
      food: null,
      tick: 0,
    };
    state.food = spawnFood();
    lastStep = 0;
    render();
    updateStatus();
  }

  function spawnFood() {
    const taken = new Set(state.snake.map(p => p.x + "," + p.y));
    const free = [];
    for (let y = 0; y < CONFIG.rows; y++) {
      for (let x = 0; x < CONFIG.cols; x++) {
        if (!taken.has(x + "," + y)) free.push({ x, y });
      }
    }
    return free.length ? free[(Math.random() * free.length) | 0] : null;
  }

  function stepMs() {
    return Math.max(CONFIG.minMs, CONFIG.startMs - state.score * CONFIG.speedUpPerFood);
  }

  function turn(name) {
    const next = DIRS[name];
    if (!next) return;
    const last = state.queue.length ? state.queue[state.queue.length - 1] : state.dir;
    if (last.x === -next.x && last.y === -next.y) return;  // no instant 180s
    if (last.x === next.x && last.y === next.y) return;
    if (state.queue.length < 3) state.queue.push(next);
    if (phase === "idle") start();
  }

  function step() {
    if (state.queue.length) state.dir = state.queue.shift();

    const head = state.snake[0];
    let x = head.x + state.dir.x;
    let y = head.y + state.dir.y;

    if (CONFIG.wrapWalls) {
      x = (x + CONFIG.cols) % CONFIG.cols;
      y = (y + CONFIG.rows) % CONFIG.rows;
    } else if (x < 0 || y < 0 || x >= CONFIG.cols || y >= CONFIG.rows) {
      return gameOver();
    }

    const tailFree = state.grow === 0;  // tail moves away this step
    const hitSelf = state.snake.some((p, i) =>
      p.x === x && p.y === y && !(tailFree && i === state.snake.length - 1));
    if (hitSelf) return gameOver();

    state.snake.unshift({ x, y });

    if (state.food && x === state.food.x && y === state.food.y) {
      state.score++;
      state.grow += CONFIG.growPerFood;
      state.food = spawnFood();
      beep(880, 0.05);
      updateStatus();
    }

    if (state.grow > 0) state.grow--;
    else state.snake.pop();

    state.tick++;
    render();
  }

  /* ---------- drawing ---------- */

  /* The board is small on screen, so match the backing store to the real pixels
     it occupies. Cells then land on fractional positions and are rounded here. */
  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : null;
    const cssWidth = (rect && rect.width) || canvas.clientWidth || CONFIG.cols * 10;
    const size = Math.max(3, (cssWidth * dpr) / CONFIG.cols);

    canvas.width = Math.round(size * CONFIG.cols);
    canvas.height = Math.round(size * CONFIG.rows);
    cell = canvas.width / CONFIG.cols;
    render();
  }

  /* Cell rect snapped to whole pixels, so neighbours meet without seams. */
  function rectFor(x, y, inset) {
    const left = Math.round(x * cell + inset);
    const top = Math.round(y * cell + inset);
    return [left, top,
      Math.round((x + 1) * cell - inset) - left,
      Math.round((y + 1) * cell - inset) - top];
  }

  function render() {
    ctx.fillStyle = COLOR.lcd;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!CONFIG.wrapWalls) {
      const w = Math.max(1, Math.round(cell * 0.12));
      ctx.strokeStyle = COLOR.dim;
      ctx.lineWidth = w;
      ctx.strokeRect(w / 2, w / 2, canvas.width - w, canvas.height - w);
    }

    if (!state) return;

    if (state.food && state.tick % 8 < 6) drawFood(state.food);
    drawSnake(state.snake);
  }

  function drawSnake(snake) {
    snake.forEach((p, i) => {
      ctx.fillStyle = COLOR.ink;
      ctx.fillRect(...rectFor(p.x, p.y, i === 0 ? 0 : cell * 0.08));
      if (i > 0) {  // hollow body segment, like the original LCD sprite
        ctx.fillStyle = COLOR.lcd;
        ctx.fillRect(...rectFor(p.x, p.y, cell * 0.34));
      }
    });
  }

  function drawFood(food) {
    const x = food.x * cell;
    const y = food.y * cell;
    const thick = Math.max(1, Math.round(cell * 0.24));
    const pad = Math.round(cell * 0.12);
    const arm = Math.round(cell) - pad * 2;

    ctx.fillStyle = COLOR.ink;
    ctx.fillRect(Math.round(x + (cell - thick) / 2), Math.round(y + pad), thick, arm);
    ctx.fillRect(Math.round(x + pad), Math.round(y + (cell - thick) / 2), arm, thick);
  }

  /* ---------- game flow ---------- */

  function updateStatus() {
    els.score.textContent = state ? state.score : 0;
    els.best.textContent = best;
  }

  function showOverlay(title, body, hint) {
    els.title.textContent = title;
    els.body.innerHTML = body;
    els.hint.textContent = hint;
    els.overlay.hidden = false;
  }

  function start() {
    if (phase === "playing") return;
    if (phase === "over" || !state) newGame();
    phase = "playing";
    els.overlay.hidden = true;
    lastStep = performance.now();
  }

  function pause() {
    if (phase !== "playing") return;
    phase = "paused";
    showOverlay("PAUSED", "Score " + state.score, "PRESS 5");
  }

  function togglePause() {
    if (phase === "playing") pause();
    else start();
  }

  function gameOver() {
    phase = "over";
    beep(160, 0.18, "square");
    const record = state.score > best;
    if (record) { best = state.score; saveBest(best); }
    updateStatus();
    showOverlay("GAME OVER", record
      ? "NEW HIGH SCORE!<br />" + state.score
      : "Score " + state.score + "<br />Best " + best, "PRESS 5");
  }

  function resetBest() {
    best = 0;
    saveBest(0);
    updateStatus();
  }

  function toggleMute() {
    muted = !muted;
    if (!muted) beep(660, 0.05);
  }

  function loop(now) {
    if (phase === "playing" && now - lastStep >= stepMs()) {
      lastStep = now;
      step();
    }
    requestAnimationFrame(loop);
  }

  /* ---------- sound ---------- */

  let audio = null;
  function beep(freq, seconds, type = "sine") {
    if (muted) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const osc = audio.createOscillator();
      const gain = audio.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audio.currentTime + seconds);
      osc.connect(gain).connect(audio.destination);
      osc.start();
      osc.stop(audio.currentTime + seconds);
    } catch {}
  }

  /* ---------- input ---------- */

  /* A direction press resumes a paused or finished game instead of steering it. */
  function steer(dir) {
    if (phase === "over" || phase === "paused") start();
    else turn(dir);
  }

  const ACTIONS = { start: togglePause, reset: resetBest, mute: toggleMute };

  addEventListener("keydown", (e) => {
    const dir = KEYS[e.key] || KEYS[e.key.toLowerCase()];
    if (dir) {
      e.preventDefault();
      steer(dir);
      return;
    }
    if (e.key === " " || e.key === "Enter" || e.key === "5") { e.preventDefault(); togglePause(); }
    if (e.key.toLowerCase() === "m") toggleMute();
    if (e.key.toLowerCase() === "c") resetBest();
  });

  document.querySelectorAll("[data-dir]").forEach(btn => {
    btn.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      steer(btn.dataset.dir);
    });
  });

  document.querySelectorAll("[data-act]").forEach(btn => {
    btn.addEventListener("click", () => ACTIONS[btn.dataset.act]());
  });

  let dragFrom = null;
  lcd.addEventListener("pointerdown", (e) => { dragFrom = { x: e.clientX, y: e.clientY }; });
  lcd.addEventListener("pointerup", (e) => {
    if (!dragFrom) return;
    const dx = e.clientX - dragFrom.x;
    const dy = e.clientY - dragFrom.y;
    dragFrom = null;

    const t = CONFIG.swipeThreshold;
    if (Math.abs(dx) < t && Math.abs(dy) < t) { togglePause(); return; }
    steer(Math.abs(dx) > Math.abs(dy)
      ? (dx > 0 ? "right" : "left")
      : (dy > 0 ? "down" : "up"));
  });

  /* ---------- boot ---------- */

  newGame();
  phase = "idle";
  showOverlay("SNAKE II", "Eat the dots.<br />Don't bite yourself.", "PRESS 5");
  fitCanvas();

  if (typeof ResizeObserver !== "undefined") {
    /* The glass is sized in % of the photo, so it changes with the window. */
    new ResizeObserver(fitCanvas).observe(lcd);
  } else {
    addEventListener("resize", fitCanvas);
  }

  requestAnimationFrame(loop);

  /* Handy from the devtools console, and used by the headless tests. */
  window.SnakeGame = {
    CONFIG,
    step, turn, start, pause, togglePause, resetBest, toggleMute, render, fitCanvas,
    get state() { return state; },
    get phase() { return phase; },
    get best() { return best; },
  };

})();
