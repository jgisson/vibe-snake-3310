# Vibe Snake 3310 - Copilot Claude agent edition

A classic Snake game with the look and feel of a Nokia 3310, built with pure HTML, CSS, and JavaScript. No dependencies, no build step — just open and play.

## Play

Open `index.html` in any browser, or serve it:

```bash
npx serve .
# or
python3 -m http.server
```

## Controls

| Input | Action |
|---|---|
| Arrow keys / WASD | Change direction |
| Enter / START button | Start / restart |
| P / Escape / PAUSE button | Pause / resume |
| D-pad (touch/click) | Change direction on mobile |

## Features

- Nokia 3310-style green LCD screen and phone body
- Wall and self-collision detection
- Speed increases as you eat
- High score saved to `localStorage`
- Fully playable on mobile with on-screen d-pad
- Zero dependencies — single HTML file

## Screenshot

Open `index.html` in a browser to see the Nokia phone UI with the game running on its screen.

## Tech

- **HTML5 Canvas** for the game grid
- **CSS** for the phone shell (gradients, shadows, rounded corners)
- **Vanilla JS** for game loop, input handling, and state management
- **Google Fonts** (VT323) for the pixel-art monospace look
