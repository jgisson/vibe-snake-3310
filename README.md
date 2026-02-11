# Vibe Snake 3310

A compact, single-file Snake game styled like a Nokia 3310. This repository contains the playable game implemented with HTML, CSS and JavaScript and small test/example folders used for experimenting with different IDEs, agents, or models.

**Project**: Vibe Snake 3310 — a tiny, nostalgic Snake implementation designed for quick iteration and agent-driven experiments.

**What this repo contains:**
- **`index.html`**: Single-file game (HTML, CSS, JS). The main playable build.
- **`game.js`**: Optional separated game logic (if present), helper for iterative development.
- **Other folders**: Each folder represents a test or experiment for a new IDE/Agent/model — use them to try integrations or automated edits.

**Quick Start**

1. Clone the repo:

```bash
git clone https://github.com/jgisson/vibe-snake-3310.git
cd vibe-snake-3310
```

2. Open `index.html`  in your browser to play the game.

**Project creation**

Use this step by step guide to create the the version of the game:

1. Start with a single-file `index.html` that contains the UI, styles, and game loop.
2. Extract logic to `game.js` if you want clearer separation for tests or agent edits.
3. Add the Nokia 3310 photo as a background and ask to place the game canvas in the screen area.
4. Use `localStorage` for persistent high score and keep the game easy to iterate on.
5. Add a beautiful title at the top of the page "Vibe Snake 3310 - XXX Edition"

**Development notes**
- Keep the game tiny and framework-free; vanilla JS + `<canvas>` is preferred.
- Persist high score under the `snake_hiscore` key in `localStorage`.

**Contributing / Experiments**
- If you add a new agent/IDE test folder, include a README inside the folder explaining the experiment and any commands to reproduce it.
- Keep edits small and focused: this repo is best for quick experiments and autonomous-agent playbooks.

**License**
This project is intended for experimentation and learning. Feel free to fork and modify as needed, but please credit the original source if you share your version publicly.

