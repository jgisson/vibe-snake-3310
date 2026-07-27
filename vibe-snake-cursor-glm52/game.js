(function () {
  "use strict";

  // --- Tuning constants (edit these to iterate quickly) ---
  const CELL = 8;
  const TICK_MS = 120;
  const HIGH_KEY = "vibe-snake-3310-glm52-high";

  // --- DOM refs ---
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const highEl = document.getElementById("high");
  const overlay = document.getElementById("overlay");

  const COLS = canvas.width / CELL;   // 21
  const ROWS = canvas.height / CELL;   // 18

  // --- Game state ---
  let snake, dir, nextDir, food, score, high, running, paused, loopId;

  // --- Persistence ---
  function loadHigh() {
    const v = parseInt(localStorage.getItem(HIGH_KEY), 10);
    return isNaN(v) ? 0 : v;
  }

  function saveHigh(v) {
    localStorage.setItem(HIGH_KEY, String(v));
  }

  // --- Core game ---
  function reset() {
    snake = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 }
    ];
    dir = { x: 1, y: 0 };
    nextDir = { x: 1, y: 0 };
    score = 0;
    placeFood();
    updateHud();
  }

  function placeFood() {
    while (true) {
      const f = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS)
      };
      if (!snake.some(s => s.x === f.x && s.y === f.y)) {
        food = f;
        return;
      }
    }
  }

  function step() {
    dir = nextDir;
    const head = { x: snake[0].x + dir.x, y: snake[0].y + dir.y };

    if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) {
      return gameOver();
    }
    if (snake.some(s => s.x === head.x && s.y === head.y)) {
      return gameOver();
    }

    snake.unshift(head);

    if (head.x === food.x && head.y === food.y) {
      score++;
      if (score > high) {
        high = score;
        saveHigh(high);
      }
      updateHud();
      placeFood();
    } else {
      snake.pop();
    }

    draw();
  }

  function gameOver() {
    running = false;
    clearInterval(loopId);
    loopId = null;
    if (score >= high) {
      showOverlay("GAME OVER", "New high: " + score, "Press 5 to retry");
    } else {
      showOverlay("GAME OVER", "Score " + score + " · HI " + high, "Press 5 to retry");
    }
  }

  // --- Rendering ---
  function draw() {
    const screenColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--nokia-screen").trim() || "#c7e09b";
    const dark = getComputedStyle(document.documentElement)
      .getPropertyValue("--nokia-screen-dark").trim() || "#4a5d2a";

    ctx.fillStyle = screenColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = dark;
    ctx.fillRect(food.x * CELL, food.y * CELL, CELL, CELL);

    ctx.fillStyle = dark;
    for (let i = 0; i < snake.length; i++) {
      const s = snake[i];
      ctx.fillRect(s.x * CELL, s.y * CELL, CELL, CELL);
    }

    // head highlight (tiny pixel) to distinguish
    ctx.fillStyle = "rgba(155, 188, 15, 0.9)";
    ctx.fillRect(snake[0].x * CELL + 2, snake[0].y * CELL + 2, 2, 2);
  }

  // --- UI helpers ---
  function updateHud() {
    scoreEl.textContent = "SCORE " + score;
    highEl.textContent = "HI " + high;
  }

  function showOverlay(big, line, small) {
    overlay.classList.remove("hidden");
    overlay.innerHTML =
      '<div class="big">' + big + "</div>" +
      '<div>' + line + "</div>" +
      (small ? '<div class="small">' + small + "</div>" : "");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
  }

  // --- Flow control ---
  function start() {
    if (running) return;
    reset();
    hideOverlay();
    running = true;
    paused = false;
    draw();
    loopId = setInterval(step, TICK_MS);
  }

  function togglePause() {
    if (!running) return;
    paused = !paused;
    if (paused) {
      clearInterval(loopId);
      loopId = null;
      showOverlay("PAUSED", "Press 0 to resume", "");
    } else {
      hideOverlay();
      loopId = setInterval(step, TICK_MS);
    }
  }

  function setDir(x, y) {
    // disallow reversing
    if (dir.x === -x && dir.y === -y) return;
    if (dir.x === x && dir.y === y) return;
    nextDir = { x, y };
  }

  // --- Input: keyboard ---
  document.addEventListener("keydown", function (e) {
    switch (e.key) {
      case "ArrowUp": case "2": setDir(0, -1); e.preventDefault(); break;
      case "ArrowDown": case "8": setDir(0, 1); e.preventDefault(); break;
      case "ArrowLeft": case "4": setDir(-1, 0); e.preventDefault(); break;
      case "ArrowRight": case "6": setDir(1, 0); e.preventDefault(); break;
      case "5": case "Enter": case " ": start(); e.preventDefault(); break;
      case "0": case "p": case "P": togglePause(); e.preventDefault(); break;
    }
  });

  // --- Input: touch swipe on canvas ---
  let touchStart = null;
  canvas.addEventListener("touchstart", function (e) {
    if (e.touches.length === 1) {
      touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  }, { passive: true });

  canvas.addEventListener("touchend", function (e) {
    if (!touchStart) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.x;
    const dy = t.clientY - touchStart.y;
    if (Math.abs(dx) < 16 && Math.abs(dy) < 16) {
      start(); // tap = start
    } else if (Math.abs(dx) > Math.abs(dy)) {
      setDir(dx > 0 ? 1 : -1, 0);
    } else {
      setDir(0, dy > 0 ? 1 : -1);
    }
    touchStart = null;
  }, { passive: true });

  // --- Init ---
  high = loadHigh();
  reset();
  draw();
  updateHud();
})();
