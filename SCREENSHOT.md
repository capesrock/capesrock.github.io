# Screenshot Tool

Headless Playwright script for capturing the local dev site on demand. Requires the dev server to be running at `http://localhost:4002`.

## Prerequisites

Node.js is managed via nvm. If `node` isn't in your PATH, load it first:

```bash
export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"
```

## Usage

```bash
node screenshot.js                        # viewport (1280×900) at scroll 0 — hero view
node screenshot.js --scroll=800           # viewport scrolled 800px down
node screenshot.js --section=about        # crops to the #about element
node screenshot.js --section=faq          # crops to the #faq element
node screenshot.js --full                 # full-page screenshot (tall)
```

Any element `id` works with `--section`: `hero`, `about`, `legacy-projects`, `baby-wishes`, `other-songs`, `faq`, `newsletter`, `contact`.

Output is always saved to `screenshot.png` in the project root (gitignored).

## How it works

1. Launches headless Chromium via Playwright
2. Navigates to `http://localhost:4002` and waits for `load` + 400ms for fonts
3. Injects CSS to disable all transitions and animations (prevents mid-frame captures)
4. Scrolls to the requested position and manually settles the JS-driven logo animation to match (replicates the `updateLogo()` interpolation inline)
5. Waits one `requestAnimationFrame` for layout to flush
6. Screenshots — either the full element (when `--section` is given) or the viewport/full page

The fixed nav appears at the top of section crops because it's `position: fixed` — this is accurate to what a real user sees.
