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

    // Parallax cloud state
    this.clouds = this._createClouds();

    // Bind the game loop so requestAnimationFrame keeps the right `this`
    this._boundLoop = this.gameLoop.bind(this);
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
        this.state = STATES.PLAYING;
        this._flapBird();
      } else if (this.state === STATES.PLAYING) {
        this._flapBird();
      } else if (this.state === STATES.DEAD) {
        this.reset();
        this.state = STATES.PLAYING;
        this._flapBird();
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

    // Scroll clouds
    this._updateClouds();
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
      }
    }
  }

  // ─── Drawing ──────────────────────────────────────────────────────────────

  draw(timestamp) {
    const ctx = this.ctx;

    // Clear
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Sky + ground + clouds
    this.drawBackground(ctx);

    // Pipes (drawn behind bird)
    if (this.pipeManager && typeof this.pipeManager.draw === 'function') {
      this.pipeManager.draw(ctx);
    }

    // Bird
    if (this.bird && typeof this.bird.draw === 'function') {
      this.bird.draw(ctx);
    }

    // UI overlay (score, menus)
    if (this.ui && typeof this.ui.draw === 'function') {
      this.ui.draw(ctx, this.state, this.score, this.highScore);
    } else {
      // Fallback minimal UI when ui.js is a placeholder
      this._drawFallbackUI(ctx);
    }
  }

  drawBackground(ctx) {
    // ── Sky gradient ──────────────────────────────────────────────────────
    const skyGradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT - GROUND_HEIGHT);
    skyGradient.addColorStop(0, COLORS.sky);
    skyGradient.addColorStop(1, COLORS.skyBottom);
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

    // ── Parallax clouds ───────────────────────────────────────────────────
    this._drawClouds(ctx);

    // ── Ground ────────────────────────────────────────────────────────────
    const groundY = CANVAS_HEIGHT - GROUND_HEIGHT;

    // Main ground fill
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, groundY, CANVAS_WIDTH, GROUND_HEIGHT);

    // Darker stripe at the very top of the ground (8 px)
    ctx.fillStyle = COLORS.groundDark;
    ctx.fillRect(0, groundY, CANVAS_WIDTH, 8);
  }

  // ─── Clouds ───────────────────────────────────────────────────────────────

  _createClouds() {
    // Each cloud: { x, y, rx, ry, speed }
    const clouds = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      clouds.push(this._makeCloud((CANVAS_WIDTH / count) * i + Math.random() * 60));
    }
    return clouds;
  }

  _makeCloud(x) {
    const y = 40 + Math.random() * (CANVAS_HEIGHT * 0.35);
    const rx = 30 + Math.random() * 40;
    const ry = 15 + Math.random() * 20;
    const speed = 0.3 + Math.random() * 0.5; // slower than game speed for parallax
    return { x, y, rx, ry, speed };
  }

  _updateClouds() {
    for (const c of this.clouds) {
      if (this.state === STATES.PLAYING) {
        c.x -= c.speed;
      }
      // Wrap cloud when it fully exits on the left
      if (c.x + c.rx < 0) {
        c.x = CANVAS_WIDTH + c.rx;
        c.y = 40 + Math.random() * (CANVAS_HEIGHT * 0.35);
      }
    }
  }

  _drawClouds(ctx) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    for (const c of this.clouds) {
      ctx.beginPath();
      // Draw as three overlapping ellipses for a fluffy look
      ctx.ellipse(c.x, c.y, c.rx, c.ry, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x - c.rx * 0.4, c.y + c.ry * 0.2, c.rx * 0.65, c.ry * 0.8, 0, 0, Math.PI * 2);
      ctx.ellipse(c.x + c.rx * 0.4, c.y + c.ry * 0.2, c.rx * 0.65, c.ry * 0.8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
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
    } else if (this.state === STATES.PLAYING) {
      ctx.font = 'bold 48px Arial';
      ctx.fillText(this.score, CANVAS_WIDTH / 2, 80);
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
