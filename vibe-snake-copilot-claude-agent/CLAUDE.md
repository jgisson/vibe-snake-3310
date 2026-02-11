# CLAUDE.md

Instructions for Claude Code when working on this project.

## Project overview

Single-file Snake game styled as a Nokia 3310. Everything lives in `index.html` — HTML structure, CSS styling, and JavaScript game logic are all inline. There is no build system, no package manager, and no external JS dependencies.

## Architecture

The file is organized in three sections:

1. **`<style>`** — CSS for the phone body, LCD screen, d-pad, buttons, and overlays.
2. **HTML body** — Phone shell markup: screen with canvas + overlays, d-pad, action buttons, speaker grille.
3. **`<script>`** — Game engine:
   - Constants (grid size, colors, speed)
   - Drawing helpers (`drawTile`, `drawBorder`, `drawSnake`, `drawFood`)
   - Game logic (`spawnFood`, `resetGame`, `tick`, `gameOver`)
   - Input handling (keyboard + touch d-pad)

## Key constants

| Name | Value | Purpose |
|---|---|---|
| `TILE` | 8 | Pixel size of one grid cell |
| `COLS` / `ROWS` | 33 / 25 | Grid dimensions |
| `INITIAL_SPEED` | 150 | Starting ms per tick |
| `MIN_SPEED` | 60 | Fastest possible tick speed |

## Development

No install or build required. To iterate:

```bash
# Serve locally with live reload
npx serve .
```

Then open `http://localhost:3000` in a browser.

## Conventions

- Keep everything in a single `index.html` file.
- Use the Nokia LCD palette: `#8b9f6e` (background), `#2d3319` (pixels on).
- All game rendering uses the `<canvas>` element with 2D context.
- Prefer vanilla JS — no frameworks, no libraries.
- High score persists via `localStorage` key `snake_hiscore`.
