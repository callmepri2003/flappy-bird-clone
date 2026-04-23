# Flappy Bird — Premium Edition

> A synthwave Flappy Bird clone built with vanilla HTML5 Canvas, no frameworks, no build tools.

**[Play it live →](https://callmepri2003.github.io/flappy-bird-clone/)**

---

## What is this?

Tap (or press Space) to flap. Don't hit the pipes. Try to beat your high score.

That's it. That's Flappy Bird.

Except this one looks like it was designed in a fever dream set in 1984 with a neon budget.

---

## Features

- **Dusk sky** — 7-stop gradient with a sun disc, radial horizon glow, and three parallax scrolling layers
- **Ember particles** — 18 motes drifting upward with additive composite blending
- **Screen shake** — 28-frame decay curve on every death
- **Score pop** — scale + expanding ring pulse on every point
- **Neon bird** — 12-position motion trail, pulsing aurora aura, per-frame wing physics, RGB iris, squish-on-flap lookup table, and a blink cycle every 210–290 frames
- **Crystal pipes** — obsidian gradient body, scrolling shimmer, neon cap rim, red danger glow when you get close
- **Animated menu** — starfield, logo bob, sparkles, bird preview, CRT scan line
- **Staggered game over** — 8-stage entrance animation: overlay → title drop → panel slide → medal pop → divider → scores → NEW BEST badge → retry button
- **Medal system** — Bronze (1–9), Silver (10–19), Gold (20–39), Platinum (40+)
- **Get Ready countdown** — GET READY! → 3 → 2 → 1 → GO! with a white flash

---

## Controls

| Input | Action |
|-------|--------|
| `Space` / `Click` / `Tap` | Flap |

---

## Running locally

```bash
# No build step needed — just open index.html
open index.html

# Or serve with anything
npx serve .
python3 -m http.server 8080
```

---

## Development

```bash
npm install       # install Jest + ESLint

npm test          # run all 105 tests
npm run test:watch  # watch mode
npm run lint      # ESLint
```

### Project structure

```
src/
  constants.js   — game config + shared color palette
  bird.js        — Bird class (physics, rendering, animation)
  pipes.js       — PipeManager class (spawn, scroll, collision)
  game.js        — Game class (state machine, game loop)
  ui.js          — UI class (HUD, menus, game over screen)
tests/
  setup.js       — Jest globals + canvas stub
  bird.test.js
  pipes.test.js
  game.test.js
  ui.test.js
.github/
  workflows/
    ci.yml       — lint + test on every PR
    deploy.yml   — deploy to GitHub Pages on push to main
```

### Architecture

Script tags load in dependency order: `constants → bird → pipes → ui → game`. No bundler. No modules. Just vibes and `requestAnimationFrame`.

Tests load each source file using a `new Function()` trick that evaluates the class definitions in a fresh scope, returns them explicitly, and assigns to `global` — making vanilla browser-targeted JS work inside Jest's Node environment without jsdom.

---

## CI/CD

Every pull request runs lint and the full test suite before merge. Pushing to `main` triggers a deployment to GitHub Pages, gated behind the same test run.

---

## How it was built

Four engineer agents worked in parallel on isolated git worktrees — one per feature area (bird, pipes, world/game, UI). A UI/UX design agent produced the visual spec first. Tests were written alongside the implementation (TDD). PRs were only merged once CI was green.

---

*Built with Claude Code*
