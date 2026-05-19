# CLAUDE.md — Custom Life Songs

## Skills

Always use the `frontend-design` skill when doing any UI or frontend work on this project.

## Project Overview

This is a static site clone of customlifesongs.com (originally on Wix), rebuilt for hosting on Cloudflare Pages. It belongs to Jen, a custom songwriter in the Pacific Northwest. Jacob is helping her migrate off Wix.

- **GitHub:** https://github.com/jacoblast/customlifesongs.git
- **Branch:** `main`
- **Hosting:** Cloudflare Pages (not yet connected — repo is ready, just needs to be wired up in the Cloudflare dashboard)

## Dev Server

```bash
python3 serve.py
```

Serves at `http://localhost:4002` (and LAN at `http://192.168.0.28:4002`). Includes SSE-based auto-reload — the browser refreshes automatically whenever any project file changes.

For external access during development, use cloudflared:
```bash
cloudflared tunnel --url http://localhost:4002
```

## Screenshot Tool

To visually inspect the site, run:

```bash
node screenshot.js                   # hero view
node screenshot.js --section=about   # crop to a specific section
node screenshot.js --scroll=800      # specific scroll position
node screenshot.js --full            # full-page
```

Then read `screenshot.png` to see the result. See [SCREENSHOT.md](SCREENSHOT.md) for full documentation. Node is managed via nvm — if `node` isn't found, run `export NVM_DIR="$HOME/.nvm" && source "$NVM_DIR/nvm.sh"` first.

## File Structure

This is a **single-page site** — all content lives in `index.html` as anchor sections.

```
/
├── index.html       — Single page with sections: #hero, #about, #legacy-projects,
│                      #baby-wishes, #other-songs, #faq, #newsletter, #contact
├── styles.css       — All styles (no inline styles, no Tailwind)
├── script.js        — Nav JS: mobile menu, logo scroll animation, scroll-spy
├── serve.py         — Dev server with SSE auto-reload (python3 serve.py)
├── screenshot.js    — On-demand Playwright screenshot tool
├── _redirects       — Cloudflare Pages redirect rules (old paths → /)
└── images/
    ├── logo.png             — Circular tree logo (primary brand mark)
    ├── hero-couple.jpg      — Hero image
    ├── guitar-woman.jpg     — About section image
    └── about-portrait.jpg   — Jen's portrait
```

## Design System

### Font
**Jost** (Google Fonts) — used for everything. It was chosen as the closest free substitute for DIN Neuzeit Grotesk LT W01 (the original Wix font, which is commercial and inaccessible).

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `--c-bg` | `#020202` | Base dark |
| `--c-moss` | `#a8c860` | Accent green — active links, CTAs |
| `--c-text` | `#e2edc8` | Primary text |
| `--c-text-dim` | `rgba(226, 237, 200, 0.60)` | Secondary text |
| `--c-nav-bg` | `rgba(5, 9, 2, 0.93)` | Nav bar background |
| `--c-overlay` | `rgba(0, 0, 0, 0.40)` | Hero overlay |

### Background Gradient
Extracted directly from the original Wix site via browser DevTools. Applied on `body` with `background-size: 100% 100%` so it scrolls with the page (not fixed).

```css
background:
  radial-gradient(circle at 3.68% 6.94%, #4D6001 0%, 11.55%, rgba(77,96,1,0) 35%),
  radial-gradient(circle at 92.97% 9.55%, #FAAA63 0%, 17.5%, rgba(250,170,99,0) 35%),
  radial-gradient(circle at 95.21% 90.48%, #C9C6FF 0%, 34.1%, rgba(201,198,255,0) 55%),
  radial-gradient(circle at 4.31% 93.35%, #97B49D 0%, 29.9%, rgba(151,180,157,0) 65%),
  radial-gradient(circle at 46.56% 11.50%, rgba(214,222,72,0.99) 0%, 25%, rgba(214,222,72,0) 50%),
  radial-gradient(circle at 51.12% 89.99%, #93C3FF 0%, 42%, rgba(147,195,255,0) 70%),
  radial-gradient(circle at 48.90% 49.52%, #020202 0%, 100%, rgba(2,2,2,0) 100%);
```

Do not modify this gradient — it matches the original exactly.

## Nav Architecture

The nav is the most complex part. Read this carefully before touching it.

### Layout
`.nav-inner` uses a **2-column grid** (`1fr 1fr`) — left nav-links and right nav-links. The logo is **absolutely positioned** (`position: absolute; left: 50%; transform: translateX(-50%)`) so it doesn't affect column sizing. This was critical: putting the logo in a grid `auto` column caused the nav to overflow the viewport on load because the large hero logo (280px) forced the column wide.

`grid-template-rows: var(--nav-h)` is explicit (70px) so the grid row height never stretches to match the large logo, keeping nav-links vertically centered at all times.

### Logo Animation

The logo starts large (280px) in the hero and tracks scroll continuously until it docks small (50px) into the navbar. Driven entirely by JS (`script.js`) with linear interpolation on `scrollY`.

- `LOGO_LARGE = 280` — initial hero size
- `LOGO_SMALL = 50` — final nav size
- `START_Y = 150` — how far (px) below nav center the logo starts
- `SCROLL_RANGE = 280` — px of scroll to complete the animation

**Do not add CSS transitions to `.nav-logo-wrap img`** — JS drives width, height, and transform directly each scroll frame. CSS transitions would fight it.

`.site-nav` has `overflow: visible` so the large hero logo can hang below the nav bar without being clipped.

### Mobile Nav
At `max-width: 820px`:
- `.nav-links` are hidden (`display: none`)
- `.nav-toggle` (hamburger) is `position: absolute; right: 16px`
- Logo remains centered via its `position: absolute; left: 50%` rule (inherited from desktop)
- Mobile menu (`#nav-mobile`) drops below the nav bar as a full-width overlay

## Pending TODOs

These need action from Jen:

1. **Patrick's Song video** (`#legacy-projects` section in `index.html`): The original video was hosted on Wix and is inaccessible. There's a placeholder `<div class="video-placeholder">` with instructions. Jen needs to upload the video to YouTube or Vimeo, then replace the placeholder with an `<iframe>` embed.

2. **Newsletter form** (`#newsletter` section in `index.html`): Form has `action="#"` and a `<!-- TODO -->` comment. Replace with a Mailchimp embed URL (or similar) once Jen sets up her list.

3. **Cloudflare Pages**: Repo is live at https://github.com/jacoblast/customlifesongs.git on `main`. Just needs to be connected in the Cloudflare dashboard (Pages → Create project → Connect to Git).

## Committing & Pushing

Never auto-commit or auto-push. Always ask first. Remote is set up:
```bash
git push  # pushes main to origin
```
