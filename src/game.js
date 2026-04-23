// game.js — Main game engine for Flappy Bird clone
// Depends on: constants.js, bird.js, pipes.js, ui.js (loaded via script tags)

class Game {
  constructor() {
    // Canvas setup
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');

    // State
    this.state = STATES.MENU;
    this.score = 0;
    this.highScore = 0;

    // Sub-systems (instantiated in reset / init)
    this.bird = null;
    this.pipeManager = null;
    this.ui = null;

    // ── Parallax layers ─────────────────────────────────────────────────────
    // Each layer: { xOffset, speed }
    this.parallaxLayers = [
      { xOffset: 0, speed: 0.45 },  // Layer 1: distant islands
      { xOffset: 0, speed: 1.05 },  // Layer 2: treeline
      { xOffset: 0, speed: 1.8  },  // Layer 3: near vegetation
    ];

    // ── Ember mote particles (18) ────────────────────────────────────────────
    this.embers = this._createEmbers();

    // ── Ground scrolling state ───────────────────────────────────────────────
    this.groundOffset = 0;

    // ── Screen shake ─────────────────────────────────────────────────────────
    this.shakeFrames = 0;

    // ── Score pop animation ──────────────────────────────────────────────────
    this.scorePop = { scale: 1.0, frame: 0 };

    // ── Get-ready countdown ──────────────────────────────────────────────────
    // readyStart: timestamp when READY state began; readyStep: current countdown step
    this.readyStart = 0;

    // Bind the game loop so requestAnimationFrame keeps the right `this`
    this._boundLoop = this.gameLoop.bind(this);
  }

  // ─── Ember creation ───────────────────────────────────────────────────────

  _createEmbers() {
    const emberColors = ['#ffd080', '#ffaa55', '#ff8844'];
    const embers = [];
    for (let i = 0; i < 18; i++) {
      embers.push(this._makeEmber(emberColors));
    }
    return embers;
  }

  _makeEmber(emberColors) {
    const colors = emberColors || ['#ffd080', '#ffaa55', '#ff8844'];
    return {
      x: Math.random() * 480,
      y: 480 + Math.random() * 79,   // y in [480, 559)
      radius: 1 + Math.random() * 1.2, // [1, 2.2]
      opacity: 0.3 + Math.random() * 0.4, // [0.3, 0.7]
      vx: (Math.random() * 2 - 1) * 0.15,
      vy: -(0.4 + Math.random() * 0.4), // [-0.8, -0.4]
      life: Math.random(),              // start at random phase
      decay: 0.003,
      color: colors[Math.floor(Math.random() * colors.length)],
    };
  }

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  init() {
    // Create sub-system instances
    this.bird = (typeof Bird !== 'undefined') ? new Bird() : null;
    this.pipeManager = (typeof PipeManager !== 'undefined') ? new PipeManager() : null;
    this.ui = (typeof UI !== 'undefined') ? new UI() : null;

    // Input: click, spacebar, touch all do the same thing
    const onInput = (e) => {
      // Prevent default scroll on space
      if (e.type === 'keydown' && e.code !== 'Space') return;
      if (e.type === 'keydown') e.preventDefault();

      if (this.state === STATES.MENU) {
        this.state = STATES.READY;
        this.readyStart = performance.now();
      } else if (this.state === STATES.PLAYING) {
        this._flapBird();
      } else if (this.state === STATES.DEAD) {
        this.reset();
        this.state = STATES.READY;
        this.readyStart = performance.now();
      }
    };

    document.addEventListener('keydown', onInput);
    this.canvas.addEventListener('click', onInput);
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      onInput(e);
    }, { passive: false });

    // Kick off the loop
    requestAnimationFrame(this._boundLoop);
  }

  reset() {
    this.score = 0;
    this.scorePop = { scale: 1.0, frame: 0 };
    this.shakeFrames = 0;
    // Reset parallax
    for (const layer of this.parallaxLayers) {
      layer.xOffset = 0;
    }
    this.groundOffset = 0;

    // Reset bird
    if (this.bird && typeof this.bird.reset === 'function') {
      this.bird.reset();
    } else if (typeof Bird !== 'undefined') {
      this.bird = new Bird();
    }

    // Reset pipes
    if (this.pipeManager && typeof this.pipeManager.reset === 'function') {
      this.pipeManager.reset();
    } else if (typeof PipeManager !== 'undefined') {
      this.pipeManager = new PipeManager();
    }
  }

  // ─── Game Loop ────────────────────────────────────────────────────────────

  gameLoop(timestamp) {
    this.update(timestamp);
    this.draw(timestamp);
    requestAnimationFrame(this._boundLoop);
  }

  update(timestamp) {
    // Handle READY countdown transition
    if (this.state === STATES.READY) {
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - this.readyStart;
      if (elapsed >= 2220) {
        this.state = STATES.PLAYING;
        this._flapBird();
      }
      // Scroll parallax + ground during READY for visual continuity
      this._updateParallax();
      this._updateGround();
      this._updateEmbers();
      return;
    }

    if (this.state !== STATES.PLAYING) return;

    // Update bird physics
    if (this.bird && typeof this.bird.update === 'function') {
      this.bird.update();
    }

    // Update pipes (spawn + scroll)
    if (this.pipeManager && typeof this.pipeManager.update === 'function') {
      this.pipeManager.update(timestamp);
    }

    // Scoring — increment when bird clears the right edge of a pipe
    this._updateScore();

    // Collision detection
    this.checkCollisions();

    // Scroll parallax layers
    this._updateParallax();

    // Scroll ground
    this._updateGround();

    // Update ember particles
    this._updateEmbers();

    // Advance scorePop frame
    this._updateScorePop();
  }

  // ─── Parallax update ─────────────────────────────────────────────────────

  _updateParallax() {
    for (const layer of this.parallaxLayers) {
      layer.xOffset -= layer.speed;
      if (layer.xOffset <= -960) {
        layer.xOffset = 0;
      }
    }
  }

  // ─── Ground update ───────────────────────────────────────────────────────

  _updateGround() {
    this.groundOffset -= GAME_SPEED;
    if (this.groundOffset <= -960) {
      this.groundOffset = 0;
    }
  }

  // ─── Ember update ────────────────────────────────────────────────────────

  _updateEmbers() {
    const emberColors = ['#ffd080', '#ffaa55', '#ff8844'];
    for (const e of this.embers) {
      e.x += e.vx;
      e.y += e.vy;
      e.life -= e.decay;
      if (e.life <= 0 || e.y < 0) {
        // Reset to a new ember at the bottom area
        Object.assign(e, this._makeEmber(emberColors));
        e.y = 480 + Math.random() * 79;
        e.life = 0.5 + Math.random() * 0.5;
      }
    }
  }

  // ─── Score pop update ────────────────────────────────────────────────────

  _updateScorePop() {
    if (this.scorePop.scale > 1.0) {
      // Ease back to 1.0 over ~200ms (assuming ~60fps = 12 frames)
      const t = this.scorePop.frame / 12;
      if (t < 1) {
        // ease-in-out decay
        this.scorePop.scale = 1.0 + (1.32 - 1.0) * (1 - t * t);
        this.scorePop.frame++;
      } else {
        this.scorePop.scale = 1.0;
      }
    }
  }

  // ─── Collision Detection ──────────────────────────────────────────────────

  checkCollisions() {
    if (!this.bird) return;

    const birdY = this.bird.y;

    // Shrink hitbox to ~70% centred on the sprite for fairness
    const hbW = BIRD_WIDTH * 0.7;
    const hbH = BIRD_HEIGHT * 0.7;
    const hbX = BIRD_X + (BIRD_WIDTH - hbW) / 2;
    const hbY = birdY + (BIRD_HEIGHT - hbH) / 2;

    // Ground collision
    if (birdY + BIRD_HEIGHT > CANVAS_HEIGHT - GROUND_HEIGHT) {
      this._killBird();
      return;
    }

    // Ceiling collision
    if (birdY < 0) {
      this._killBird();
      return;
    }

    // Pipe collisions
    if (this.pipeManager && Array.isArray(this.pipeManager.pipes)) {
      for (const pipe of this.pipeManager.pipes) {
        const pipeRight = pipe.x + PIPE_WIDTH;
        const bottomY = pipe.topHeight + PIPE_GAP;

        // Only test pipes that overlap the bird's x range
        if (pipe.x < hbX + hbW && pipeRight > hbX) {
          // Top pipe: 0 → pipe.topHeight
          if (hbY < pipe.topHeight) {
            this._killBird();
            return;
          }
          // Bottom pipe: bottomY → canvas bottom
          if (hbY + hbH > bottomY) {
            this._killBird();
            return;
          }
        }
      }
    }
  }

  // ─── Scoring ──────────────────────────────────────────────────────────────

  _updateScore() {
    if (!this.pipeManager || !Array.isArray(this.pipeManager.pipes)) return;

    for (const pipe of this.pipeManager.pipes) {
      // Bird's leading edge is BIRD_X; pipe is fully passed when its right edge < BIRD_X
      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        this.score += 1;
        if (this.score > this.highScore) {
          this.highScore = this.score;
        }
        // Trigger score pop
        this.scorePop = { scale: 1.32, frame: 0 };
      }
    }
  }

  // ─── Drawing ──────────────────────────────────────────────────────────────

  draw(timestamp) {
    const ctx = this.ctx;

    // ── Screen shake ──────────────────────────────────────────────────────
    let shakeX = 0;
    let shakeY = 0;
    if (this.shakeFrames > 0) {
      let intensity;
      const f = 28 - this.shakeFrames; // frames since shake started (0 = first shake frame)
      if (f <= 5) {
        intensity = 8;
      } else if (f <= 14) {
        intensity = 5;
      } else {
        // lerp from 5 → 0 over frames 15–28
        const t = (f - 15) / 13;
        intensity = 5 * (1 - t);
      }
      shakeX = (Math.random() * 2 - 1) * intensity;
      shakeY = (Math.random() * 2 - 1) * intensity * 0.6;
      this.shakeFrames--;
    }

    // Advance scorePop decay on every draw frame (so it works even in non-PLAYING states)
    if (this.scorePop.scale > 1.0) {
      this.scorePop.frame++;
      const t = this.scorePop.frame / 12;
      if (t < 1) {
        this.scorePop.scale = 1.0 + (1.32 - 1.0) * (1 - t * t);
      } else {
        this.scorePop.scale = 1.0;
      }
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. Clear canvas
    ctx.clearRect(-Math.abs(shakeX) - 10, -Math.abs(shakeY) - 10,
                  CANVAS_WIDTH + 20, CANVAS_HEIGHT + 20);

    // 2. Sky gradient (full canvas)
    this._drawSky(ctx);

    // 3. Sun glow + sun disc
    this._drawSun(ctx);

    // 4. Horizon radial glow (lighter composite)
    this._drawHorizonGlow(ctx);

    // 5–7. Parallax layers
    this._drawParallaxLayer1(ctx);
    this._drawParallaxLayer2(ctx);
    this._drawParallaxLayer3(ctx);

    // 8. Ground layers + texture + tufts
    this._drawGround(ctx);

    // 9. Pipe manager
    if (this.pipeManager && typeof this.pipeManager.draw === 'function') {
      this.pipeManager.draw(ctx);
    }

    // 10. Bird
    if (this.bird && typeof this.bird.draw === 'function') {
      this.bird.draw(ctx);
    }

    // 11. Ember particles (lighter composite)
    this._drawEmbers(ctx);

    // 12. Vignette
    this._drawVignette(ctx);

    // 13. UI overlay
    if (this.ui && typeof this.ui.draw === 'function') {
      this.ui.draw(ctx, this.state, this.score, this.highScore, this.scorePop);
    } else {
      this._drawFallbackUI(ctx);
    }

    ctx.restore();
  }

  // ─── Background drawing helpers ───────────────────────────────────────────

  drawBackground(ctx) {
    this._drawSky(ctx);
    this._drawSun(ctx);
    this._drawHorizonGlow(ctx);
    this._drawParallaxLayer1(ctx);
    this._drawParallaxLayer2(ctx);
    this._drawParallaxLayer3(ctx);
    this._drawGround(ctx);
  }

  _drawSky(ctx) {
    const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    grad.addColorStop(0,    COLORS.skyTop);
    grad.addColorStop(0.18, COLORS.skyViolet);
    grad.addColorStop(0.38, COLORS.skyRose);
    grad.addColorStop(0.55, COLORS.skyCoral);
    grad.addColorStop(0.70, COLORS.skyAmber);
    grad.addColorStop(0.85, COLORS.skyGold);
    grad.addColorStop(1.0,  COLORS.skyHorizon);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  _drawSun(ctx) {
    const sunX = 240;
    const sunY = 522;

    // Outer glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(sunX, sunY, 44, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,210,80,0.22)';
    ctx.fill();

    // Sun disc
    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#ffe566';
    ctx.fill();
    ctx.restore();
  }

  _drawHorizonGlow(ctx) {
    ctx.save();
    const radGrad = ctx.createRadialGradient(240, 540, 0, 240, 540, 320);
    radGrad.addColorStop(0,    'rgba(255,210,100,0.45)');
    radGrad.addColorStop(0.45, 'rgba(240,140,60,0.18)');
    radGrad.addColorStop(1,    'rgba(0,0,0,0)');
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  _drawParallaxLayer1(ctx) {
    // Distant island humps — 4 humps per 960px tile
    const layer = this.parallaxLayers[0];
    ctx.save();

    const drawTile = (offsetX) => {
      // Island A: peak near x=100, base from 0 to 220
      ctx.beginPath();
      ctx.moveTo(offsetX + 0, 560);
      ctx.quadraticCurveTo(offsetX + 100, 438, offsetX + 220, 560);
      ctx.closePath();

      // Island B: peak near x=330, base from 180 to 480
      ctx.moveTo(offsetX + 180, 560);
      ctx.quadraticCurveTo(offsetX + 330, 432, offsetX + 480, 560);
      ctx.closePath();

      // Island C: peak near x=560, base from 420 to 700
      ctx.moveTo(offsetX + 420, 560);
      ctx.quadraticCurveTo(offsetX + 560, 445, offsetX + 700, 560);
      ctx.closePath();

      // Island D: peak near x=800, base from 640 to 960
      ctx.moveTo(offsetX + 640, 560);
      ctx.quadraticCurveTo(offsetX + 800, 428, offsetX + 960, 560);
      ctx.closePath();

      const islandGrad = ctx.createLinearGradient(0, 428, 0, 560);
      islandGrad.addColorStop(0, COLORS.islandFar);
      islandGrad.addColorStop(1, COLORS.islandFarDark);
      ctx.fillStyle = islandGrad;
      ctx.fill();
    };

    drawTile(layer.xOffset);
    drawTile(layer.xOffset + 960);
    ctx.restore();
  }

  _drawParallaxLayer2(ctx) {
    // Treeline — 14 trees per 960px tile
    const layer = this.parallaxLayers[1];
    ctx.save();

    // Deterministic tree layout (fixed seed-like positions within tile)
    const trees = [
      { x: 20,  trunkH: 45, r: 22 },
      { x: 80,  trunkH: 50, r: 28 },
      { x: 145, trunkH: 38, r: 20 },
      { x: 195, trunkH: 55, r: 30 },
      { x: 265, trunkH: 42, r: 24 },
      { x: 330, trunkH: 48, r: 26 },
      { x: 390, trunkH: 36, r: 19 },
      { x: 445, trunkH: 52, r: 29 },
      { x: 510, trunkH: 40, r: 22 },
      { x: 580, trunkH: 55, r: 32 },
      { x: 645, trunkH: 44, r: 24 },
      { x: 710, trunkH: 50, r: 27 },
      { x: 775, trunkH: 38, r: 21 },
      { x: 840, trunkH: 48, r: 25 },
    ];

    const drawTreeTile = (offsetX) => {
      for (const t of trees) {
        const bx = offsetX + t.x;
        const baseY = 560;

        // Trunk
        ctx.fillStyle = COLORS.treeTrunk;
        ctx.fillRect(bx - 2, baseY - t.trunkH, 4, t.trunkH);

        // Main canopy circle
        ctx.beginPath();
        ctx.arc(bx, baseY - t.trunkH, t.r, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.treeCanopy;
        ctx.fill();

        // Secondary lighter circle (70% opacity, 8px up)
        ctx.save();
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(bx - 4, baseY - t.trunkH - 8, t.r * 0.65, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.treeCanopyLight;
        ctx.fill();
        ctx.restore();
      }
    };

    drawTreeTile(layer.xOffset);
    drawTreeTile(layer.xOffset + 960);
    ctx.restore();
  }

  _drawParallaxLayer3(ctx) {
    // Near vegetation — rock clusters + plant clusters
    const layer = this.parallaxLayers[2];
    ctx.save();

    // Fixed layout for deterministic look
    const rocks = [
      { x: 50,  ellipses: [{ rx: 38, ry: 22, dx: 0, dy: 0 }, { rx: 28, ry: 18, dx: 28, dy: 5 }, { rx: 25, ry: 16, dx: -22, dy: 4 }] },
      { x: 185, ellipses: [{ rx: 32, ry: 20, dx: 0, dy: 0 }, { rx: 26, ry: 15, dx: 22, dy: 6 }] },
      { x: 330, ellipses: [{ rx: 40, ry: 25, dx: 0, dy: 0 }, { rx: 30, ry: 20, dx: -28, dy: 3 }, { rx: 27, ry: 18, dx: 30, dy: 2 }] },
      { x: 490, ellipses: [{ rx: 35, ry: 22, dx: 0, dy: 0 }, { rx: 28, ry: 17, dx: 26, dy: 5 }] },
      { x: 640, ellipses: [{ rx: 45, ry: 28, dx: 0, dy: 0 }, { rx: 32, ry: 20, dx: -30, dy: 4 }, { rx: 28, ry: 18, dx: 32, dy: 3 }] },
      { x: 820, ellipses: [{ rx: 36, ry: 22, dx: 0, dy: 0 }, { rx: 27, ry: 16, dx: 25, dy: 6 }] },
    ];

    const plants = [
      { x: 120,  blades: 5 },
      { x: 260,  blades: 6 },
      { x: 420,  blades: 4 },
      { x: 570,  blades: 7 },
      { x: 740,  blades: 5 },
    ];

    const drawVegTile = (offsetX) => {
      // Rocks
      ctx.fillStyle = COLORS.vegRock;
      for (const rock of rocks) {
        for (const el of rock.ellipses) {
          ctx.beginPath();
          ctx.ellipse(offsetX + rock.x + el.dx, 560 + el.dy, el.rx, el.ry, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Plants — elongated ellipses radiating from a base point
      ctx.fillStyle = COLORS.vegPlant;
      for (const plant of plants) {
        const baseX = offsetX + plant.x;
        const baseY = 560;
        const bladeCount = plant.blades;
        const angleStep = 140 / (bladeCount - 1); // spread -70° to +70°
        for (let b = 0; b < bladeCount; b++) {
          const angleDeg = -70 + b * angleStep;
          const angleRad = (angleDeg * Math.PI) / 180;
          ctx.save();
          ctx.translate(baseX, baseY);
          ctx.rotate(angleRad);
          ctx.beginPath();
          ctx.ellipse(0, -18, 3, 18, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
      }
    };

    drawVegTile(layer.xOffset);
    drawVegTile(layer.xOffset + 960);
    ctx.restore();
  }

  _drawGround(ctx) {
    // ── Grass cap: y=560–568 ─────────────────────────────────────────────
    ctx.fillStyle = COLORS.groundGrass;
    ctx.fillRect(0, 560, CANVAS_WIDTH, 8);

    // ── Transition: y=568–578 ────────────────────────────────────────────
    const transGrad = ctx.createLinearGradient(0, 568, 0, 578);
    transGrad.addColorStop(0, COLORS.groundTransition1);
    transGrad.addColorStop(1, COLORS.groundTransition2);
    ctx.fillStyle = transGrad;
    ctx.fillRect(0, 568, CANVAS_WIDTH, 10);

    // ── Dirt body: y=578–630 ─────────────────────────────────────────────
    const dirtGrad = ctx.createLinearGradient(0, 578, 0, 630);
    dirtGrad.addColorStop(0,   COLORS.groundTransition2);
    dirtGrad.addColorStop(0.5, COLORS.groundDirt);
    dirtGrad.addColorStop(1,   COLORS.groundDark);
    ctx.fillStyle = dirtGrad;
    ctx.fillRect(0, 578, CANVAS_WIDTH, 52);

    // ── Root shadow: y=630–640 ───────────────────────────────────────────
    ctx.fillStyle = COLORS.groundRoot;
    ctx.fillRect(0, 630, CANVAS_WIDTH, 10);

    // ── Scrolling stone texture (brick-bond pattern) ──────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    const brickW = 30;
    const brickH = 14;
    const gap = 2;
    const rows = [
      { y: 580, offset: 0 },
      { y: 596, offset: 16 },
      { y: 612, offset: 0 },
    ];
    for (const row of rows) {
      const startX = (this.groundOffset + row.offset) % (brickW + gap);
      for (let bx = startX - (brickW + gap); bx < CANVAS_WIDTH + brickW; bx += brickW + gap) {
        ctx.fillRect(bx, row.y, brickW, brickH);
      }
    }

    // ── Grass tufts (12) scrolling with ground ───────────────────────────
    ctx.fillStyle = '#5a9450';
    const tuftSpacing = 960 / 12;
    const tuftOffset = this.groundOffset % 960;

    for (let i = 0; i < 14; i++) {
      const bx = (i * tuftSpacing + tuftOffset) % 960;
      if (bx < 0 || bx > CANVAS_WIDTH + tuftSpacing) continue;
      const baseX = bx;
      const baseY = 560;

      // 3 blades: -15°, 0°, +15°
      const angles = [-15, 0, 15];
      for (const deg of angles) {
        const rad = (deg * Math.PI) / 180;
        const tipX = baseX + Math.sin(rad) * 12;
        const tipY = baseY - Math.cos(rad) * 12;
        ctx.beginPath();
        ctx.moveTo(baseX - 1.5, baseY);
        ctx.lineTo(baseX + 1.5, baseY);
        ctx.lineTo(tipX, tipY);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  _drawEmbers(ctx) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const e of this.embers) {
      ctx.save();
      ctx.globalAlpha = e.opacity * e.life;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
      ctx.fillStyle = e.color;
      ctx.fill();
      ctx.restore();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }

  _drawVignette(ctx) {
    ctx.save();

    // Radial vignette
    const radVig = ctx.createRadialGradient(240, 320, 160, 240, 320, 460);
    radVig.addColorStop(0, 'rgba(0,0,0,0)');
    radVig.addColorStop(1, 'rgba(0,0,0,0.52)');
    ctx.fillStyle = radVig;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Top vignette
    const topVig = ctx.createLinearGradient(0, 0, 0, 80);
    topVig.addColorStop(0, 'rgba(0,0,20,0.38)');
    topVig.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topVig;
    ctx.fillRect(0, 0, CANVAS_WIDTH, 80);

    // Bottom vignette
    const botVig = ctx.createLinearGradient(0, 580, 0, 640);
    botVig.addColorStop(0, 'rgba(0,0,0,0)');
    botVig.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = botVig;
    ctx.fillRect(0, 580, CANVAS_WIDTH, 60);

    ctx.restore();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  _flapBird() {
    if (this.bird && typeof this.bird.flap === 'function') {
      this.bird.flap();
    }
  }

  _killBird() {
    if (this.state !== STATES.DEAD) {
      this.state = STATES.DEAD;
      this.shakeFrames = 28;
    }
  }

  // Minimal fallback UI rendered directly — used when ui.js is a placeholder
  _drawFallbackUI(ctx) {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.score;
    ctx.shadowColor = COLORS.shadow;
    ctx.shadowBlur = 4;

    if (this.state === STATES.MENU) {
      ctx.font = 'bold 36px Arial';
      ctx.fillText('Flappy Bird', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
      ctx.font = '20px Arial';
      ctx.fillText('Click or press Space to start', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else if (this.state === STATES.READY) {
      ctx.font = 'bold 40px Arial';
      ctx.fillText('GET READY!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
      const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - this.readyStart;
      const steps = ['3', '2', '1', 'GO!'];
      const stepIdx = Math.min(Math.floor(elapsed / 555), 3);
      ctx.font = 'bold 60px Arial';
      ctx.fillText(steps[stepIdx], CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    } else if (this.state === STATES.PLAYING) {
      ctx.font = 'bold 48px Arial';
      ctx.save();
      if (this.scorePop.scale !== 1.0) {
        ctx.translate(CANVAS_WIDTH / 2, 80);
        ctx.scale(this.scorePop.scale, this.scorePop.scale);
        ctx.fillText(this.score, 0, 0);
      } else {
        ctx.fillText(this.score, CANVAS_WIDTH / 2, 80);
      }
      ctx.restore();
    } else if (this.state === STATES.DEAD) {
      ctx.font = 'bold 36px Arial';
      ctx.fillText('Game Over', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
      ctx.font = '24px Arial';
      ctx.fillText(`Score: ${this.score}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 50);
      ctx.fillText(`Best: ${this.highScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3 + 85);
      ctx.font = '18px Arial';
      ctx.fillText('Click or press Space to restart', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 60);
    }

    ctx.restore();
  }
}

// Bootstrap
new Game().init();
