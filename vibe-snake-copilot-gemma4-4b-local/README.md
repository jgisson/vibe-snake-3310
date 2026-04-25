# Vibe Snake 3310 - Copilot + Gemma4 4b Edition (Ollama)

A retro-styled Snake game implemented in a single, self-contained HTML file. Inspired by the classic look and feel of the Nokia 3310, this game uses vanilla JavaScript and the HTML Canvas API for performance and simplicity.

## 🎮 Features

*   **Nokia 3310 Aesthetic:** Styled with classic grey plastic elements and pixelated graphics.
*   **Vanilla JS & Canvas:** Entirely contained in `index.html`, requiring no external frameworks or libraries.
*   **Persistent High Scores:** Uses `localStorage` to save and display the highest score achieved across sessions.
*   **Simple Controls:** Playable using keyboard arrow keys or WASD.
*   **Easy Iteration:** Designed to be small and easy to modify for further development.

## 🚀 Getting Started

Since the game is entirely contained within `index.html`, running it is straightforward.

1.  **Download:** Ensure you have the `index.html` file in your project directory.
2.  **Run:** Open `index.html` directly in any modern web browser (e.g., Chrome, Firefox).

## 🕹️ How to Play

The goal of the game is to guide the snake (the green body) to consume the red food pellets.

*   **Movement:** Use the **Arrow Keys** or **WASD** keys to change direction.
*   **Objective:** Eat as many food pellets as possible to increase your score.
*   **Game Over:** The game ends if the snake hits the canvas boundary or collides with its own body.

## 🛠️ Development Notes

This project is designed for maximum simplicity and minimal dependencies.

*   **File Structure:** All UI, styling, and logic are contained within `index.html`.
*   **Canvas:** The game uses a 20x20 pixel grid system on a 300x300 canvas.
*   **High Score:** The high score is stored locally in the browser's `localStorage`.

## 💡 Ideas for Improvement

*   Add different types of food (e.g., speed boosts, temporary shields).
*   Implement a difficulty curve (decreasing `GAME_SPEED` over time).
*   Add sound effects for eating food or game over.
*   Allow the user to customize the snake's color or size.

## Notes:
- The game is fully playable, the score is correctly stored in `localStorage` (but the speed needs adjustment to improve the overall gameplay experience).
- The style is not fully representative of the Nokia 3310 aesthetic, except for the apple and the snake body represented as green squares.
- Often the same issue, Gemma4 uses the wrong path when using the VS Code create file tool:
> Invalid input path: README.md. Be sure to use an absolute path.: Error: Invalid input path: README.md. Be sure to use an absolute path.
- Can split the single file correctly in html, js, style evan with multiple prompt