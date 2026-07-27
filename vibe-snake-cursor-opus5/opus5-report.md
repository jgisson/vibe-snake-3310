Done. The photo is now the phone, with the live screen sitting inside its glass and the real keypad wired up.

![Nokia 3310 with Snake running](./Cursor%20-%20Opus%205%20report%20-%20game.png)

Rather than eyeball the placement, I measured Nokia_3310.png (526×1198, transparent cutout) with a script that finds the LCD's green region: the glass sits at x 103–439, y 324–569. Those became percentage variables so the screen tracks the photo at any size:


style.css
Lines 5-13
/* Screen glass, measured from Nokia_3310.png (526x1198). */
--screen-left: 19.58%;
--screen-top: 27.05%;
--screen-width: 64.07%;
--screen-height: 20.53%;
The same script found the keypad buttons, so instead of drawing a fake D-pad I put invisible hit areas over the phone's own keys and used the authentic Snake controls: 2/4/6/8 to steer, 5 to start and pause, C to clear the high score, and the right soft key to mute. Those keys work on the keyboard too, alongside the arrows and WASD. Here's the alignment with the hotspots temporarily tinted red for verification:

![Hotspots aligned over the real keys](./Cursor%20-%20Opus%205%20report%20-%20touch.png)

Two changes fell out of fitting a real screen. The board is now 34×20 instead of 24×18, which is a 1.7 ratio — essentially the 3310's own 84×48 screen. And because the glass is only ~230 px wide on a desktop, a fixed 10-px-per-cell canvas would have been resampled to something blurry and uneven, so the canvas now sizes its backing store to the pixels it actually occupies (×devicePixelRatio, so 462×272 for a 231×136 box on this display) and draws cells at fractional positions snapped to whole pixels. A ResizeObserver re-fits it when the window changes. Cropping and upscaling a screenshot confirmed the result: hard-edged pixels, solid head, hollow body segments, no seams or uneven cells.

The palette shifted slightly toward the photo's own screen (--lcd: #97b163) with a soft top-edge glow and inner shadow so the lit screen reads as part of the glass instead of a sticker.

Verification: all 24 headless logic checks pass on the new board, including the drawing code now being exercised for finite, non-zero cell rects and a 20,000-step random-steering run. In the browser I confirmed the composite renders, and that clicking the photo's "2" key really queues an upward turn and the direction applies on the next step. I reloaded the tab afterward to clear the frozen clock and zoom I used while inspecting.

One leftover: the high score may read a value from my automated runs. Pressing C (or the C key on the photo) clears it. The local server is still running on port 8412 if you want to keep poking at it.