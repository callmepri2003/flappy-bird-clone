class PipeManager {
  constructor() {
    this.pipes = [];
    this.lastSpawnTime = 0;
  }

  reset() {
    this.pipes = [];
    this.lastSpawnTime = 0;
  }

  spawnPipe() {
    const minTopHeight = 60;
    const maxTopHeight = CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60;
    const topHeight = Math.floor(Math.random() * (maxTopHeight - minTopHeight + 1)) + minTopHeight;

    const pipe = {
      x: CANVAS_WIDTH + 10,
      topHeight: topHeight,
      get bottomY() { return this.topHeight + PIPE_GAP; },
      passed: false,
    };

    this.pipes.push(pipe);
  }

  update(timestamp) {
    // Move all pipes left by GAME_SPEED each frame
    for (const pipe of this.pipes) {
      pipe.x -= GAME_SPEED;
    }

    // Remove pipes that have gone fully off-screen
    this.pipes = this.pipes.filter(pipe => pipe.x + PIPE_WIDTH >= 0);

    // Spawn a new pipe if enough time has passed
    if (timestamp - this.lastSpawnTime > PIPE_SPAWN_INTERVAL) {
      this.spawnPipe();
      this.lastSpawnTime = timestamp;
    }
  }

  draw(ctx) {
    for (const pipe of this.pipes) {
      this._drawTopPipe(ctx, pipe);
      this._drawBottomPipe(ctx, pipe);
    }
  }

  _drawTopPipe(ctx, pipe) {
    const x = pipe.x;
    const y = 0;
    const w = PIPE_WIDTH;
    const h = pipe.topHeight;

    // Green gradient for body — darker on edges, lighter in center
    const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
    gradient.addColorStop(0, COLORS.pipeDark);
    gradient.addColorStop(0.2, COLORS.pipe);
    gradient.addColorStop(0.8, COLORS.pipe);
    gradient.addColorStop(1, COLORS.pipeDark);

    // Draw pipe body
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    // Border stroke on pipe body
    ctx.strokeStyle = COLORS.pipeBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Subtle shadow on right side for 3D effect
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(x + w - 8, y, 8, h);

    // Cap at the bottom of the top pipe — 8px wider, centered
    const capX = x - 4;
    const capW = w + 8;
    const capH = 16;
    const capY = h - capH;

    // Cap gradient
    const capGradient = ctx.createLinearGradient(capX, 0, capX + capW, 0);
    capGradient.addColorStop(0, COLORS.pipeDark);
    capGradient.addColorStop(0.2, COLORS.pipe);
    capGradient.addColorStop(0.8, COLORS.pipe);
    capGradient.addColorStop(1, COLORS.pipeDark);

    ctx.fillStyle = capGradient;
    ctx.fillRect(capX, capY, capW, capH);

    ctx.strokeStyle = COLORS.pipeBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(capX, capY, capW, capH);

    // Shadow on right side of cap
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(capX + capW - 8, capY, 8, capH);
  }

  _drawBottomPipe(ctx, pipe) {
    const x = pipe.x;
    const y = pipe.bottomY;
    const w = PIPE_WIDTH;
    const h = CANVAS_HEIGHT - pipe.bottomY - GROUND_HEIGHT;

    // Green gradient for body — darker on edges, lighter in center
    const gradient = ctx.createLinearGradient(x, 0, x + w, 0);
    gradient.addColorStop(0, COLORS.pipeDark);
    gradient.addColorStop(0.2, COLORS.pipe);
    gradient.addColorStop(0.8, COLORS.pipe);
    gradient.addColorStop(1, COLORS.pipeDark);

    // Draw pipe body
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, w, h);

    // Border stroke on pipe body
    ctx.strokeStyle = COLORS.pipeBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // Subtle shadow on right side for 3D effect
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(x + w - 8, y, 8, h);

    // Cap at the top of the bottom pipe — 8px wider, centered
    const capX = x - 4;
    const capW = w + 8;
    const capH = 16;
    const capY = y;

    // Cap gradient
    const capGradient = ctx.createLinearGradient(capX, 0, capX + capW, 0);
    capGradient.addColorStop(0, COLORS.pipeDark);
    capGradient.addColorStop(0.2, COLORS.pipe);
    capGradient.addColorStop(0.8, COLORS.pipe);
    capGradient.addColorStop(1, COLORS.pipeDark);

    ctx.fillStyle = capGradient;
    ctx.fillRect(capX, capY, capW, capH);

    ctx.strokeStyle = COLORS.pipeBorder;
    ctx.lineWidth = 2;
    ctx.strokeRect(capX, capY, capW, capH);

    // Shadow on right side of cap
    ctx.fillStyle = COLORS.shadow;
    ctx.fillRect(capX + capW - 8, capY, 8, capH);
  }

  checkBirdCollision(birdX, birdY, birdW, birdH) {
    // Shrink hitbox by 30% for fairer gameplay (15% per side)
    const shrinkX = birdW * 0.15;
    const shrinkY = birdH * 0.15;
    const bx = birdX + shrinkX;
    const by = birdY + shrinkY;
    const bw = birdW * 0.7;
    const bh = birdH * 0.7;

    for (const pipe of this.pipes) {
      // Check collision with top pipe rect
      const topPipeRect = {
        x: pipe.x,
        y: 0,
        w: PIPE_WIDTH,
        h: pipe.topHeight,
      };

      if (this._rectsOverlap(bx, by, bw, bh, topPipeRect.x, topPipeRect.y, topPipeRect.w, topPipeRect.h)) {
        return true;
      }

      // Check collision with bottom pipe rect
      const bottomPipeRect = {
        x: pipe.x,
        y: pipe.bottomY,
        w: PIPE_WIDTH,
        h: CANVAS_HEIGHT - pipe.bottomY - GROUND_HEIGHT,
      };

      if (this._rectsOverlap(bx, by, bw, bh, bottomPipeRect.x, bottomPipeRect.y, bottomPipeRect.w, bottomPipeRect.h)) {
        return true;
      }
    }

    return false;
  }

  _rectsOverlap(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw &&
           ax + aw > bx &&
           ay < by + bh &&
           ay + ah > by;
  }
}
