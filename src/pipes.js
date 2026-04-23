class PipeManager {
  constructor() {
    this.pipes = [];
    this.lastSpawnTime = 0;
    this.frameCount = 0;
    this._spawnIndex = 0;
  }

  reset() {
    this.pipes = [];
    this.lastSpawnTime = 0;
    this.frameCount = 0;
    this._spawnIndex = 0;
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
      index: this._spawnIndex,
    };

    this._spawnIndex += 1;
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

    this.frameCount += 1;
  }

  draw(ctx) {
    for (const pipe of this.pipes) {
      this._drawTopPipe(ctx, pipe);
      this._drawBottomPipe(ctx, pipe);
    }
    this._drawDangerProximity(ctx);
  }

  // -------------------------------------------------------------------------
  // Premium body rendering — shared helper for top and bottom pipe segments
  // -------------------------------------------------------------------------
  _drawPipeBody(ctx, pipe, pipeX, pipeTop, pipeHeight) {
    // Step 1 — Neon edge glow (additive composite, drawn FIRST)
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = COLORS.pipeNeon;   // rgba(255,0,204,0.12)
    ctx.fillRect(pipeX - 2, pipeTop, PIPE_WIDTH + 4, pipeHeight);
    ctx.fillStyle = COLORS.pipeNeon2;  // rgba(255,0,204,0.06)
    ctx.fillRect(pipeX, pipeTop, PIPE_WIDTH, pipeHeight);
    ctx.globalCompositeOperation = 'source-over';

    // Step 2 — Body gradient (horizontal, 7 stops)
    const bodyGrad = ctx.createLinearGradient(pipeX, 0, pipeX + PIPE_WIDTH, 0);
    bodyGrad.addColorStop(0.00, COLORS.pipeDark);    // #0a0010
    bodyGrad.addColorStop(0.12, COLORS.pipeViolet);  // #1a0030
    bodyGrad.addColorStop(0.30, COLORS.pipeMid);     // #2d0055
    bodyGrad.addColorStop(0.50, COLORS.pipeCenter);  // #3d006e
    bodyGrad.addColorStop(0.70, COLORS.pipeMid);     // #2d0055
    bodyGrad.addColorStop(0.88, COLORS.pipeViolet);  // #1a0030
    bodyGrad.addColorStop(1.00, COLORS.pipeDark);    // #0a0010
    ctx.fillStyle = bodyGrad;
    ctx.fillRect(pipeX, pipeTop, PIPE_WIDTH, pipeHeight);

    // Step 3 — Left highlight strip (2px)
    ctx.fillStyle = COLORS.pipeLeftHighlight; // rgba(160,80,255,0.3)
    ctx.fillRect(pipeX, pipeTop, 2, pipeHeight);

    // Step 4 — Right shadow strip (5px)
    ctx.fillStyle = COLORS.pipeShadow; // rgba(0,0,0,0.55)
    ctx.fillRect(pipeX + PIPE_WIDTH - 5, pipeTop, 5, pipeHeight);

    // Step 5 — Left trim neon line (1.5px at x+4, 80% opacity)
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#cc44ff';
    ctx.fillRect(pipeX + 4, pipeTop, 1.5, pipeHeight);
    ctx.globalAlpha = 1;

    // Step 6 — Right crease line (1px at x+52)
    ctx.fillStyle = 'rgba(100,0,150,0.5)';
    ctx.fillRect(pipeX + 52, pipeTop, 1, pipeHeight);

    // Step 7 — Shimmer scan (clipped to pipe body rect)
    const shimmerH = 40;
    const phasedY = (this.frameCount * 1.2 + pipe.index * 80) % pipeHeight;
    const shimmerY = pipeTop + phasedY - 20;
    const shimGrad = ctx.createLinearGradient(0, shimmerY, 0, shimmerY + shimmerH);
    shimGrad.addColorStop(0,   'rgba(255,180,255,0.00)');
    shimGrad.addColorStop(0.5, 'rgba(255,180,255,0.12)');
    shimGrad.addColorStop(1,   'rgba(255,180,255,0.00)');
    ctx.save();
    ctx.beginPath();
    ctx.rect(pipeX, pipeTop, PIPE_WIDTH, pipeHeight);
    ctx.clip();
    ctx.fillStyle = shimGrad;
    ctx.fillRect(pipeX, shimmerY, PIPE_WIDTH, shimmerH);
    ctx.restore();
  }

  // -------------------------------------------------------------------------
  // Cap rendering helper
  // pipeX          — left edge of the pipe body
  // capY           — top-left y of the cap rectangle
  // facingDown     — true for top-pipe cap (rim is on top, shadow on bottom inner face)
  //                  false for bottom-pipe cap (rim is on bottom, shadow on top inner face)
  // -------------------------------------------------------------------------
  _drawPipeCap(ctx, pipeX, capY, facingDown) {
    const capX = pipeX - 4;
    const capW = PIPE_WIDTH + 8; // 68px
    const capH = 20;

    // Cap body gradient (horizontal, 7 stops across 68px)
    const capGrad = ctx.createLinearGradient(capX, 0, capX + capW, 0);
    capGrad.addColorStop(0.00, COLORS.pipeCapEdge);    // #0d0018
    capGrad.addColorStop(0.08, COLORS.pipeCapDark);    // #280050
    capGrad.addColorStop(0.25, COLORS.pipeCapViolet);  // #4a0090
    capGrad.addColorStop(0.50, COLORS.pipeCapBright);  // #6600cc
    capGrad.addColorStop(0.75, COLORS.pipeCapViolet);  // #4a0090
    capGrad.addColorStop(0.92, COLORS.pipeCapDark);    // #280050
    capGrad.addColorStop(1.00, COLORS.pipeCapEdge);    // #0d0018
    ctx.fillStyle = capGrad;
    ctx.fillRect(capX, capY, capW, capH);

    // Cap stroke
    ctx.strokeStyle = '#9900ee';
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'miter';
    ctx.strokeRect(capX, capY, capW, capH);

    // Cap rim — 3px strip on the outer-facing edge
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = COLORS.pipeCapRim; // #cc00ff
    if (facingDown) {
      // Top pipe cap: rim on top edge
      ctx.fillRect(capX, capY, capW, 3);
    } else {
      // Bottom pipe cap: rim on bottom edge
      ctx.fillRect(capX, capY + capH - 3, capW, 3);
    }
    ctx.globalAlpha = 1;

    // Cap shadow underside (inner face where cap meets pipe body)
    if (facingDown) {
      // Top pipe: inner face is the bottom of the cap (shadow goes top→bottom = darker at bottom)
      const shadowGrad = ctx.createLinearGradient(0, capY + capH - 4, 0, capY + capH);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(capX, capY + capH - 4, capW, 4);
    } else {
      // Bottom pipe: inner face is the top of the cap (shadow goes bottom→top = darker at top)
      const shadowGrad = ctx.createLinearGradient(0, capY, 0, capY + 4);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.7)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.fillRect(capX, capY, capW, 4);
    }

    // Corner notches — 3×3px black squares at each outer corner (4 total)
    ctx.fillStyle = '#000000';
    // Top-left corner
    ctx.fillRect(capX, capY, 3, 3);
    // Top-right corner
    ctx.fillRect(capX + capW - 3, capY, 3, 3);
    // Bottom-left corner
    ctx.fillRect(capX, capY + capH - 3, 3, 3);
    // Bottom-right corner
    ctx.fillRect(capX + capW - 3, capY + capH - 3, 3, 3);
  }

  // -------------------------------------------------------------------------
  // Top pipe: extends from y=0 down to pipe.topHeight
  // Cap sits at the bottom of the body (facing down into the gap)
  // -------------------------------------------------------------------------
  _drawTopPipe(ctx, pipe) {
    const pipeX = pipe.x;
    const pipeTop = 0;
    const pipeHeight = pipe.topHeight;

    this._drawPipeBody(ctx, pipe, pipeX, pipeTop, pipeHeight);

    // Cap at bottom of top pipe body; cap bottom aligns with pipe.topHeight
    const capH = 20;
    const capY = pipe.topHeight - capH;
    this._drawPipeCap(ctx, pipeX, capY, true /* facingDown: rim on top */);
  }

  // -------------------------------------------------------------------------
  // Bottom pipe: extends from pipe.bottomY down to the ground
  // Cap sits at the top of the body (facing up into the gap)
  // -------------------------------------------------------------------------
  _drawBottomPipe(ctx, pipe) {
    const pipeX = pipe.x;
    const pipeTop = pipe.bottomY;
    const pipeHeight = CANVAS_HEIGHT - pipe.bottomY - GROUND_HEIGHT;

    this._drawPipeBody(ctx, pipe, pipeX, pipeTop, pipeHeight);

    // Cap at top of bottom pipe body; cap top aligns with pipe.bottomY
    const capY = pipe.bottomY;
    this._drawPipeCap(ctx, pipeX, capY, false /* not facingDown: rim on bottom */);
  }

  // -------------------------------------------------------------------------
  // Danger proximity indicator
  // -------------------------------------------------------------------------
  _drawDangerProximity(ctx) {
    for (const pipe of this.pipes) {
      const dist = pipe.x - (BIRD_X + 40); // pipe left edge to bird right edge
      if (dist < 120 && dist > 0) {
        const prox = 1 - dist / 120;

        // Gap edge glow
        ctx.fillStyle = `rgba(255,0,100,${prox * 0.55})`;
        // Bottom of top-pipe gap edge
        ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP - 12, PIPE_WIDTH, 12);
        // Top of bottom-pipe gap edge
        ctx.fillRect(pipe.x, pipe.topHeight + PIPE_GAP, PIPE_WIDTH, 12);

        // Red tint over full pipe bodies
        ctx.fillStyle = `rgba(255,0,0,${prox * 0.08})`;
        ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.topHeight);
        ctx.fillRect(
          pipe.x,
          pipe.topHeight + PIPE_GAP,
          PIPE_WIDTH,
          CANVAS_HEIGHT - pipe.topHeight - PIPE_GAP - GROUND_HEIGHT
        );
      }
    }
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
