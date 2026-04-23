class UI {
  constructor() {
    this._startTime = Date.now();
    this.gameOverTime = null;

    // Pre-computed star positions for menu (deterministic)
    this.stars = Array.from({ length: 14 }, (_, i) => ({
      x: ((i * 137 + 60) % 440) + 20,
      y: ((i * 97 + 40) % 480) + 20,
      outerR: 4 + (i % 4),
      innerR: 2 + (i % 2),
      color: ['#FFD166', '#FFFFFF', '#8B9FE8', '#06D6A0'][i % 4],
      period: 1800 + i * 100,
      phase: (i / 14) * Math.PI * 2,
    }));

    // Logo shimmer state
    this._shimmerX = 160;
    this._shimmerNext = Date.now() + 4500;
    this._shimmerActive = false;
    this._lastFrame = Date.now();

    // Best beaten flash
    this._bestBeatenFrame = -1;
    this._lastScore = 0;
  }

  notifyGameOver() {
    this.gameOverTime = Date.now();
  }

  // ─── Main dispatcher ──────────────────────────────────────────────────────

  draw(ctx, state, score, highScore, scorePop) {
    const now = Date.now();
    const dt = now - this._lastFrame;
    this._lastFrame = now;

    if (state === STATES.PLAYING) {
      this.drawHUD(ctx, score, highScore, scorePop);
    } else if (state === STATES.MENU || state === STATES.READY) {
      this.drawMenu(ctx);
      if (state === STATES.READY) {
        const elapsed = now - (this._readyStart || now);
        this.drawGetReady(ctx, elapsed);
      }
    } else if (state === STATES.DEAD) {
      if (this.gameOverTime === null) this.gameOverTime = now;
      this.drawGameOver(ctx, score, highScore);
    }
  }

  startReady() {
    this._readyStart = Date.now();
  }

  // ─── HUD ──────────────────────────────────────────────────────────────────

  drawHUD(ctx, score, highScore, scorePop) {
    const cx = CANVAS_WIDTH / 2;
    const cy = 68;
    const text = String(score);
    const digits = text.length;
    const pillW = Math.max(80, digits * 34 + 32);

    ctx.save();

    // Score pop scale
    const sc = (scorePop && scorePop.scale) ? scorePop.scale : 1.0;
    const isFlash = scorePop && scorePop.frame < 4;

    ctx.translate(cx, cy);
    ctx.scale(sc, sc);

    // Pill backing
    this.drawRoundedRect(ctx, -pillW / 2, -26, pillW, 52, 26,
      'rgba(0,0,0,0.28)', 'rgba(255,255,255,0.08)');

    // Score pop ring
    if (scorePop && scorePop.frame > 0) {
      const ringR = scorePop.frame * 5.4;
      const ringA = Math.max(0, 0.6 - scorePop.frame * 0.04);
      const ringW = Math.max(0.5, 3 - scorePop.frame * 0.2);
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,209,102,${ringA})`;
      ctx.lineWidth = ringW;
      ctx.stroke();
    }

    // Score text
    ctx.font = 'bold 58px Arial Black, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 4;
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#000000';
    ctx.lineJoin = 'round';
    ctx.strokeText(text, 0, 0);
    ctx.fillStyle = isFlash ? '#FFD166' : '#F8F4E3';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillText(text, 0, 0);

    ctx.restore();

    // Ghost best score
    if (typeof highScore === 'number' && score < highScore) {
      ctx.save();
      ctx.font = 'bold 13px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#8B9FE8';
      ctx.shadowBlur = 6;
      ctx.fillStyle = '#8B9FE8';
      ctx.globalAlpha = 0.7;
      ctx.fillText(`BEST  ${highScore}`, cx, 118);
      ctx.restore();
    }
  }

  // ─── Menu ─────────────────────────────────────────────────────────────────

  drawMenu(ctx) {
    const now = Date.now();
    const cx = CANVAS_WIDTH / 2;

    // Radial vignette overlay
    ctx.save();
    const vign = ctx.createRadialGradient(cx, 320, 80, cx, 320, 480);
    vign.addColorStop(0, 'rgba(13,27,42,0.0)');
    vign.addColorStop(0.55, 'rgba(13,27,42,0.25)');
    vign.addColorStop(1.0, 'rgba(13,27,42,0.78)');
    ctx.fillStyle = vign;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.restore();

    // Stars
    this.stars.forEach(s => {
      const opacity = 0.2 + 0.5 * Math.sin(now / s.period + s.phase);
      ctx.save();
      ctx.globalAlpha = Math.max(0, opacity);
      this._drawStar(ctx, s.x, s.y, s.outerR, s.innerR, 5, s.color);
      ctx.restore();
    });

    // Logo bob
    const bob = Math.sin((now / 3200) * Math.PI * 2) * 7;

    // "FLAPPY"
    ctx.save();
    const gFlappy = ctx.createLinearGradient(220, 200 + bob, 220, 252 + bob);
    gFlappy.addColorStop(0, '#FFE566');
    gFlappy.addColorStop(1, '#FF9A00');
    ctx.font = 'bold 56px Arial Black, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FFD166';
    ctx.shadowBlur = 28;
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#7A3A00';
    ctx.lineJoin = 'round';
    ctx.strokeText('FLAPPY', cx, 200 + bob);
    ctx.shadowBlur = 28;
    ctx.fillStyle = gFlappy;
    ctx.fillText('FLAPPY', cx, 200 + bob);
    ctx.restore();

    // "BIRD"
    ctx.save();
    const gBird = ctx.createLinearGradient(220, 252 + bob, 220, 310 + bob);
    gBird.addColorStop(0, '#FFFFFF');
    gBird.addColorStop(1, '#C8E6FF');
    ctx.font = 'bold 68px Arial Black, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FFD166';
    ctx.shadowBlur = 28;
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#1A3A5C';
    ctx.lineJoin = 'round';
    ctx.strokeText('BIRD', cx, 266 + bob);
    ctx.fillStyle = gBird;
    ctx.fillText('BIRD', cx, 266 + bob);
    ctx.restore();

    // Separator
    ctx.save();
    ctx.strokeStyle = 'rgba(255,209,102,0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(160, 296 + bob);
    ctx.lineTo(320, 296 + bob);
    ctx.stroke();
    ctx.restore();

    // Sparkles around logo
    const sparklePos = [
      [80, 148], [240, 148], [400, 148],
      [80, 258], [240, 258], [400, 258],
    ];
    sparklePos.forEach(([sx, sy], i) => {
      const op = 0.3 + 0.7 * Math.sin(now / 2000 + (i / 6) * Math.PI * 2);
      ctx.save();
      ctx.globalAlpha = Math.max(0, op);
      this._drawStar(ctx, sx, sy + bob, 8, 3, 4, i % 2 === 0 ? '#FFD166' : '#FFFFFF');
      ctx.restore();
    });

    // Bird preview
    const birdBob = Math.sin((now / 900) * Math.PI * 2) * 9;
    const birdX = cx;
    const birdY = 370 + birdBob;
    ctx.save();
    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(birdX, 395, 18 - birdBob * 0.3, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(birdX, birdY);
    ctx.scale(1.4, 1.4);
    // Body
    const bodyG = ctx.createRadialGradient(-6, -5, 0, 0, 0, 20);
    bodyG.addColorStop(0, '#ffe8ff');
    bodyG.addColorStop(0.25, '#ff6ef7');
    bodyG.addColorStop(1, '#6a1080');
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyG;
    ctx.fill();
    // Wing
    ctx.beginPath();
    ctx.ellipse(-3, 5 + Math.sin(now / 300) * 4, 10, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e040fb';
    ctx.fill();
    // Eye
    ctx.beginPath();
    ctx.arc(8, -5, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#f5eeff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -5, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#00e5ff';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, -5, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = '#000d14';
    ctx.fill();
    // Beak
    ctx.fillStyle = '#ff9f40';
    ctx.fillRect(16, -4, 10, 7);
    ctx.restore();

    // TAP TO PLAY button
    const pulse = 1.0 + Math.sin((now / 700) * Math.PI) * 0.02;
    ctx.save();
    ctx.translate(cx, 488);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = '#06D6A0';
    ctx.shadowBlur = 18;
    const btnG = ctx.createLinearGradient(0, -27, 0, 27);
    btnG.addColorStop(0, '#09E8AD');
    btnG.addColorStop(1, '#04A87D');
    this.drawRoundedRect(ctx, -110, -27, 220, 54, 27, btnG, '#034D3A');
    ctx.shadowBlur = 0;
    // Inner highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-100, -19);
    ctx.lineTo(100, -19);
    ctx.stroke();
    // Label
    ctx.font = 'bold 22px Arial Black, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#0D1B2A';
    ctx.fillText('TAP TO PLAY', 0, 0);
    ctx.restore();

    // CRT scan line
    ctx.save();
    const scanY = ((now % 6000) / 6000) * CANVAS_HEIGHT;
    ctx.fillStyle = 'rgba(255,255,255,0.03)';
    ctx.fillRect(0, scanY, CANVAS_WIDTH, 2);
    ctx.restore();
  }

  // ─── Game Over ────────────────────────────────────────────────────────────

  drawGameOver(ctx, score, highScore) {
    const cx = CANVAS_WIDTH / 2;
    const elapsed = this.gameOverTime !== null ? Date.now() - this.gameOverTime : 5000;

    ctx.save();

    // Overlay
    const overlayT = Math.min(elapsed / 200, 1);
    ctx.globalAlpha = (1 - Math.pow(1 - overlayT, 3));
    ctx.fillStyle = 'rgba(13,27,42,0.72)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const vig = ctx.createRadialGradient(cx, 320, 100, cx, 320, 400);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    ctx.globalAlpha = 1;

    // "GAME OVER" title
    if (elapsed >= 120) {
      const titleT = Math.min((elapsed - 120) / 320, 1);
      const titleEased = 1 - Math.pow(1 - titleT, 3);
      const titleY = 108 + titleEased * 40;
      ctx.globalAlpha = titleT;
      ctx.save();
      const titleG = ctx.createLinearGradient(cx, titleY - 27, cx, titleY + 27);
      titleG.addColorStop(0, '#FF6B6B');
      titleG.addColorStop(1, '#CC0033');
      ctx.font = 'bold 54px Arial Black, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FF4466';
      ctx.shadowBlur = 22;
      ctx.lineWidth = 7;
      ctx.strokeStyle = '#5A0010';
      ctx.lineJoin = 'round';
      ctx.strokeText('GAME OVER', cx, titleY);
      ctx.fillStyle = titleG;
      ctx.fillText('GAME OVER', cx, titleY);
      ctx.restore();
      ctx.globalAlpha = 1;
    }

    // Score panel slide-in
    if (elapsed >= 200) {
      const panelT = Math.min((elapsed - 200) / 440, 1);
      const panelEased = 1 - Math.pow(1 - panelT, 3);
      const panelW = 320;
      const panelH = 200;
      const panelRestY = 210;
      const panelY = -100 + panelEased * (panelRestY + 100);
      const panelX = cx - panelW / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(139,159,232,0.5)';
      ctx.shadowBlur = 24;
      const panelG = ctx.createLinearGradient(panelX, panelY, panelX, panelY + panelH);
      panelG.addColorStop(0, '#1A2E4A');
      panelG.addColorStop(1, '#0D1B2A');
      this.drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 18, panelG, 'rgba(255,255,255,0.18)');
      // Inner top highlight
      const hlG = ctx.createLinearGradient(panelX, panelY, panelX, panelY + 40);
      hlG.addColorStop(0, 'rgba(255,255,255,0.10)');
      hlG.addColorStop(1, 'rgba(255,255,255,0.00)');
      ctx.fillStyle = hlG;
      ctx.beginPath();
      ctx.rect(panelX + 2, panelY + 2, panelW - 4, 38);
      ctx.fill();
      ctx.restore();

      // Medal (left column)
      if (elapsed >= 560) {
        const medT = Math.min((elapsed - 560) / 280, 1);
        const medEased = 1 + 2.7 * Math.pow(medT - 1, 3) + 1.7 * Math.pow(medT - 1, 2);
        ctx.save();
        ctx.globalAlpha = medT;
        ctx.translate(panelX + 80, panelY + 100);
        ctx.scale(medEased, medEased);
        this._drawMedal(ctx, score);
        ctx.restore();
      }

      // Divider
      if (elapsed >= 620) {
        const divT = Math.min((elapsed - 620) / 180, 1);
        const divW = divT * 150;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(panelX + 170, panelY + 88);
        ctx.lineTo(panelX + 170 + divW, panelY + 88);
        ctx.stroke();
        ctx.restore();
      }

      // Score label + value
      if (elapsed >= 640) {
        const sT = Math.min((elapsed - 640) / 200, 1);
        const sOff = (1 - sT) * 8;
        ctx.save();
        ctx.globalAlpha = sT;
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#8B9FE8';
        ctx.shadowColor = 'rgba(0,0,0,0.4)';
        ctx.shadowBlur = 3;
        ctx.fillText('SCORE', panelX + 170, panelY + 58 + sOff);
        ctx.font = 'bold 38px Arial Black, Arial, sans-serif';
        ctx.fillStyle = '#F8F4E3';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 5;
        ctx.fillText(String(score), panelX + 170, panelY + 80 + sOff);
        ctx.restore();
      }

      // Best label + value
      if (elapsed >= 720) {
        const bT = Math.min((elapsed - 720) / 200, 1);
        const bOff = (1 - bT) * 8;
        ctx.save();
        ctx.globalAlpha = bT;
        ctx.font = 'bold 16px Arial, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#8B9FE8';
        ctx.fillText('BEST', panelX + 170, panelY + 110 + bOff);
        ctx.font = 'bold 38px Arial Black, Arial, sans-serif';
        ctx.fillStyle = '#FFD166';
        ctx.fillText(String(highScore), panelX + 170, panelY + 132 + bOff);
        ctx.restore();
      }

      // NEW BEST badge
      const isNewBest = score > 0 && score >= highScore;
      if (isNewBest && elapsed >= 820) {
        const nbT = Math.min((elapsed - 820) / 240, 1);
        const nbEased = 1 + 2.7 * Math.pow(nbT - 1, 3) + 1.7 * Math.pow(nbT - 1, 2);
        ctx.save();
        ctx.globalAlpha = nbT;
        ctx.translate(cx, panelY + panelH - 30);
        ctx.scale(nbEased, nbEased);
        ctx.shadowColor = '#FFD166';
        ctx.shadowBlur = 16;
        const badgeG = ctx.createLinearGradient(-55, -14, -55, 14);
        badgeG.addColorStop(0, '#FFE566');
        badgeG.addColorStop(1, '#FF9A00');
        this.drawRoundedRect(ctx, -55, -14, 110, 28, 14, badgeG, '#7A3A00');
        ctx.shadowBlur = 0;
        ctx.font = 'bold 14px Arial Black, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#0D1B2A';
        ctx.fillText('★ NEW BEST! ★', 0, 0);
        ctx.restore();
      }
    }

    // Retry button
    if (elapsed >= 880) {
      const rT = Math.min((elapsed - 880) / 220, 1);
      const rEased = 1 - Math.pow(1 - rT, 3);
      const rPulse = 1 + Math.sin((Date.now() / 800) * Math.PI) * 0.015;
      ctx.save();
      ctx.globalAlpha = rEased;
      ctx.translate(cx, 490);
      ctx.scale(rPulse, rPulse);
      ctx.shadowColor = '#06D6A0';
      ctx.shadowBlur = 16;
      const retG = ctx.createLinearGradient(0, -26, 0, 26);
      retG.addColorStop(0, '#06D6A0');
      retG.addColorStop(1, '#04A87D');
      this.drawRoundedRect(ctx, -100, -26, 200, 52, 26, retG, '#034D3A');
      ctx.shadowBlur = 0;
      ctx.font = 'bold 22px Arial Black, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#0D1B2A';
      ctx.fillText('↺  RETRY', 0, 0);
      ctx.restore();
    }

    // Pulsing restart prompt (always after death)
    ctx.save();
    const prompt = 0.55 + 0.45 * Math.sin(Date.now() / 450);
    ctx.globalAlpha = prompt * Math.min(elapsed / 500, 1);
    ctx.font = 'bold 17px Arial Black, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#F8F4E3';
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = 4;
    ctx.fillText('Click or Space to Restart', cx, 552);
    ctx.restore();

    ctx.restore();
  }

  // ─── Get Ready ────────────────────────────────────────────────────────────

  drawGetReady(ctx, elapsedMs) {
    const cx = CANVAS_WIDTH / 2;
    const e = elapsedMs;

    ctx.save();

    // "GET READY!" banner — 0 to 700ms
    if (e < 700) {
      const dropT = Math.min(e / 250, 1);
      const dropEased = 1 - Math.pow(1 - dropT, 3);
      const ty = 260 + dropEased * 60;
      let alpha = 1;
      if (e > 500) alpha = Math.max(0, 1 - (e - 500) / 200);
      const scale = e > 500 ? 1 + ((e - 500) / 200) * 0.3 : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, ty);
      ctx.scale(scale, scale);
      ctx.font = 'bold 44px Arial Black, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#FFD166';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#000000';
      ctx.lineJoin = 'round';
      ctx.strokeText('GET READY!', 0, 0);
      ctx.fillStyle = '#F8F4E3';
      ctx.fillText('GET READY!', 0, 0);
      ctx.restore();
    }

    // Countdown digits: 3 at 700ms, 2 at 1100ms, 1 at 1500ms
    const digits = [
      { label: '3', start: 700 },
      { label: '2', start: 1100 },
      { label: '1', start: 1500 },
    ];
    digits.forEach(({ label, start }) => {
      if (e >= start && e < start + 400) {
        const dt = e - start;
        let sc, alpha;
        if (dt < 120) {
          sc = 1 + (1 - dt / 120) * 0.2; // 1.2 → 1.0
          alpha = 1;
        } else if (dt < 380) {
          sc = 1;
          alpha = 1;
        } else {
          const fade = (dt - 380) / 20;
          sc = 1 + fade * 0.5;
          alpha = Math.max(0, 1 - fade);
        }
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(cx, 320);
        ctx.scale(sc, sc);
        ctx.font = 'bold 82px Arial Black, Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = '#FFD166';
        ctx.shadowBlur = 20;
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#000000';
        ctx.lineJoin = 'round';
        ctx.strokeText(label, 0, 0);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(label, 0, 0);
        ctx.restore();
      }
    });

    // "GO!" — 1900ms to 2220ms
    if (e >= 1900 && e < 2220) {
      const gt = e - 1900;
      let sc, alpha;
      if (gt < 120) {
        sc = gt / 120 * 1.4;
        alpha = sc / 1.4;
      } else {
        const fade = (gt - 120) / 200;
        sc = 1.4 + fade * 0.4;
        alpha = Math.max(0, 1 - fade);
      }
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(cx, 320);
      ctx.scale(sc, sc);
      ctx.font = 'bold 88px Arial Black, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = '#06D6A0';
      ctx.shadowBlur = 36;
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#034D3A';
      ctx.lineJoin = 'round';
      ctx.strokeText('GO!', 0, 0);
      ctx.fillStyle = '#06D6A0';
      ctx.fillText('GO!', 0, 0);
      ctx.restore();

      // White flash at GO!
      if (gt < 80) {
        const flashA = Math.sin((gt / 80) * Math.PI) * 0.18;
        ctx.save();
        ctx.fillStyle = `rgba(255,255,255,${flashA})`;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
        ctx.restore();
      }
    }

    ctx.restore();
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  drawRoundedRect(ctx, x, y, w, h, r, fillColor, strokeColor) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
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

  _drawStar(ctx, x, y, outerR, innerR, points, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = color;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
      else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  _drawMedal(ctx, score) {
    let gradColors, borderColor, glowColor;
    let shape = 'circle';

    if (score >= 40) {
      gradColors = ['#C0F0FF', '#7B9FFF'];
      borderColor = '#4A6AEE';
      glowColor = 'rgba(140,190,255,0.8)';
      shape = 'diamond';
    } else if (score >= 20) {
      gradColors = ['#FFD166', '#FF9A00'];
      borderColor = '#AA6A00';
      glowColor = 'rgba(255,180,50,0.7)';
      shape = 'star';
    } else if (score >= 10) {
      gradColors = ['#9EACB5', '#D6E0E4'];
      borderColor = '#7A9099';
      glowColor = 'rgba(190,210,220,0.6)';
      shape = 'ring';
    } else {
      gradColors = ['#8B5E3C', '#C4843A'];
      borderColor = '#7A4E2D';
      glowColor = 'rgba(180,120,60,0.6)';
      shape = 'circle';
    }

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 14;

    const g = ctx.createLinearGradient(-20, -20, 20, 20);
    g.addColorStop(0, gradColors[0]);
    g.addColorStop(1, gradColors[1]);

    if (shape === 'diamond') {
      ctx.fillStyle = g;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, -22);
      ctx.lineTo(18, 0);
      ctx.lineTo(0, 22);
      ctx.lineTo(-18, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (shape === 'star') {
      ctx.fillStyle = g;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = i % 2 === 0 ? 22 : 10;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        if (i === 0) ctx.moveTo(Math.cos(angle) * r, Math.sin(angle) * r);
        else ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.fill();
    } else if (shape === 'ring') {
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(0, 0, 14, 0, Math.PI * 2);
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    } else {
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
}
