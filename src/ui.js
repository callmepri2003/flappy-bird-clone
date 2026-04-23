// UI class — handles all canvas overlay rendering, HUD, menus, and game-over screen.
// Depends on constants: CANVAS_WIDTH, CANVAS_HEIGHT, GROUND_HEIGHT, COLORS, STATES

class UI {
  constructor() {
    // Animation timers
    this._startTime = Date.now();
    this.gameOverTime = null; // Set externally (or via notifyGameOver) when state → DEAD
  }

  // Call this when the game transitions to DEAD so the slide-in timer resets cleanly.
  notifyGameOver() {
    this.gameOverTime = Date.now();
  }

  // ─── Main draw dispatcher ───────────────────────────────────────────────────

  draw(ctx, state, score, highScore) {
    if (state === STATES.PLAYING) {
      this.drawHUD(ctx, score);
    } else if (state === STATES.MENU) {
      this.drawMenu(ctx);
    } else if (state === STATES.DEAD) {
      // If notifyGameOver() was never called externally, initialise the timer here.
      if (this.gameOverTime === null) {
        this.gameOverTime = Date.now();
      }
      this.drawGameOver(ctx, score, highScore);
    }
  }

  // ─── In-game HUD ────────────────────────────────────────────────────────────

  drawHUD(ctx, score) {
    const text = String(score);
    const cx = CANVAS_WIDTH / 2;
    const cy = 80;

    ctx.save();

    // Black outline / drop shadow
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.lineJoin = 'round';
    ctx.strokeText(text, cx, cy);

    // White fill
    ctx.fillStyle = '#ffffff';
    ctx.fillText(text, cx, cy);

    ctx.restore();
  }

  // ─── Menu / start screen ────────────────────────────────────────────────────

  drawMenu(ctx) {
    // Semi-transparent overlay — light enough that the game world shows through
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.38)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

    const cx = CANVAS_WIDTH / 2;

    // ── Title ──
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Glow / drop-shadow
    ctx.shadowColor = 'rgba(0,0,0,0.7)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;

    // Yellow stroke outline
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#e8a000';
    ctx.lineJoin = 'round';
    ctx.strokeText('FLAPPY BIRD', cx, 200);

    // Yellow-white fill
    ctx.fillStyle = '#ffe066';
    ctx.fillText('FLAPPY BIRD', cx, 200);

    // ── Decorative bird icon hint ──
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    this._drawBirdIcon(ctx, cx, 275);

    // ── Pulsing subtitle ──
    const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 450);
    ctx.globalAlpha = pulse;
    ctx.shadowBlur = 0;
    ctx.font = 'bold 18px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Click or Press Space to Start', cx, 370);

    ctx.restore();
  }

  // ─── Game-over screen ───────────────────────────────────────────────────────

  drawGameOver(ctx, score, highScore) {
    const cx = CANVAS_WIDTH / 2;
    const elapsed = Date.now() - (this.gameOverTime || Date.now());

    // ── Semi-transparent overlay ──
    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT - GROUND_HEIGHT);

    // ── "GAME OVER" title ──
    ctx.font = 'bold 58px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.shadowColor = 'rgba(0,0,0,0.75)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 5;

    ctx.lineWidth = 6;
    ctx.strokeStyle = '#7a0000';
    ctx.lineJoin = 'round';
    ctx.strokeText('GAME OVER', cx, 145);

    ctx.fillStyle = '#ff4444';
    ctx.fillText('GAME OVER', cx, 145);

    // ── Score panel slide-in ──
    // Panel slides from y=-panelH to its resting position over 400 ms
    const panelW = 300;
    const panelH = 160;
    const panelRestY = 220;
    const slideProgress = Math.min(elapsed / 400, 1);
    // Ease-out cubic
    const eased = 1 - Math.pow(1 - slideProgress, 3);
    const panelY = panelRestY - panelH * (1 - eased);
    const panelX = cx - panelW / 2;

    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Panel background
    this.drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 14, 'rgba(20,20,40,0.88)', '#ffffff');

    // Score text inside panel
    ctx.font = 'bold 24px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#cccccc';
    ctx.textAlign = 'left';
    ctx.fillText('Score', panelX + 24, panelY + 44);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(score), panelX + panelW - 24, panelY + 44);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('Best', panelX + 24, panelY + 86);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffd700';
    ctx.fillText(String(highScore), panelX + panelW - 24, panelY + 86);

    // Divider line
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(panelX + 16, panelY + 65);
    ctx.lineTo(panelX + panelW - 16, panelY + 65);
    ctx.stroke();

    // ── "NEW BEST!" badge ──
    const isNewBest = score > 0 && score >= highScore;
    if (isNewBest && slideProgress >= 0.7) {
      const badgeOpacity = Math.min((slideProgress - 0.7) / 0.3, 1);
      ctx.globalAlpha = badgeOpacity;
      this._drawNewBestBadge(ctx, panelX + panelW - 30, panelY + 16);
      ctx.globalAlpha = 1;
    }

    // ── Pulsing restart prompt ──
    const pulse = 0.55 + 0.45 * Math.sin(Date.now() / 450);
    ctx.globalAlpha = pulse;
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Click or Space to Restart', cx, panelRestY + panelH + 36);

    ctx.restore();
  }

  // ─── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Draws a rounded rectangle.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} w
   * @param {number} h
   * @param {number} r  corner radius
   * @param {string} fillColor
   * @param {string} [strokeColor]
   */
  drawRoundedRect(ctx, x, y, w, h, r, fillColor, strokeColor) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y,     x + w, y + r,     r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x,     y + h, x,     y + h - r, r);
    ctx.lineTo(x,     y + r);
    ctx.arcTo(x,     y,     x + r, y,         r);
    ctx.closePath();

    if (fillColor) {
      ctx.fillStyle = fillColor;
      ctx.fill();
    }
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.restore();
  }

  // Draws a small simplified bird silhouette as a decorative element on the menu.
  _drawBirdIcon(ctx, cx, cy) {
    ctx.save();

    // Body
    ctx.beginPath();
    ctx.ellipse(cx, cy, 22, 16, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#f7d358';
    ctx.fill();
    ctx.strokeStyle = '#c8a000';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Wing
    ctx.beginPath();
    ctx.ellipse(cx - 4, cy + 4, 14, 7, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = '#e8c000';
    ctx.fill();

    // Eye
    ctx.beginPath();
    ctx.arc(cx + 10, cy - 3, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cx + 11, cy - 3, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#333333';
    ctx.fill();

    // Beak
    ctx.beginPath();
    ctx.moveTo(cx + 21, cy - 1);
    ctx.lineTo(cx + 30, cy + 2);
    ctx.lineTo(cx + 21, cy + 5);
    ctx.closePath();
    ctx.fillStyle = '#f0a030';
    ctx.fill();

    ctx.restore();
  }

  // Draws a gold "NEW BEST!" badge, anchored at (x, y) = top-right of badge.
  _drawNewBestBadge(ctx, x, y) {
    const w = 82;
    const h = 28;
    const rx = x - w;
    const ry = y;

    ctx.save();

    // Gold background
    this.drawRoundedRect(ctx, rx, ry, w, h, 8, '#ffd700', '#b8860b');

    // Star
    ctx.fillStyle = '#7a5c00';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#5c3d00';
    ctx.fillText('★ NEW BEST!', rx + w / 2, ry + h / 2);

    ctx.restore();
  }
}
