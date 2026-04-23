// Bird class — Synthwave Neon cyber-sparrow
// Physics, flap mechanic, and premium animated character rendering

class Bird {
  constructor() {
    this.x = BIRD_X;
    this.y = CANVAS_HEIGHT / 2 - BIRD_HEIGHT / 2;
    this.vy = 0;
    this.rotation = 0;       // radians
    this.flapAnimation = 0;  // increments each frame, drives wing + squish

    // ---- Trail system ----
    this.trail = [];          // stores last 12 {x,y} bird centre positions

    // ---- Squish / stretch lookup table (10-frame cycle) ----
    // Indexed by squishTimer frame counting DOWN from 9 → 0.
    // squishTimer=9 → table[9], squishTimer=0 → table[0]
    this._squishTable = [
      { scaleX: 0.72, scaleY: 1.38 }, // frame 0 (end of cycle)
      { scaleX: 0.78, scaleY: 1.28 }, // frame 1
      { scaleX: 0.86, scaleY: 1.16 }, // frame 2
      { scaleX: 0.94, scaleY: 1.06 }, // frame 3
      { scaleX: 1.00, scaleY: 1.00 }, // frame 4 (neutral)
      { scaleX: 1.08, scaleY: 0.93 }, // frame 5
      { scaleX: 1.08, scaleY: 0.93 }, // frame 6
      { scaleX: 1.08, scaleY: 0.93 }, // frame 7
      { scaleX: 1.04, scaleY: 0.97 }, // frame 8
      { scaleX: 1.00, scaleY: 1.00 }, // frame 9
    ];
    this._squishTimer = 0;   // frames remaining in squish animation (0=inactive)

    // ---- Wing snap animation ----
    this.flapSnapTimer = 0;  // counts down from 15 on flap

    // ---- Aura pulse ----
    this._auraPulseBoost = 0;    // 0 normally; 1.0 right after flap, decays

    // ---- Blink animation ----
    this.blinkTimer = 0;
    this.blinkCooldown = this._randomInt(210, 290);
    this.blinkScale = 1.0;
    this.blinkFrame = -1;         // -1 = inactive

    // ---- One-frame flash after flap ----
    this._flashFrame = false;
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------
  _randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // ---------------------------------------------------------------------------
  // reset — called when restarting the game
  // ---------------------------------------------------------------------------
  reset() {
    this.y = CANVAS_HEIGHT / 2 - BIRD_HEIGHT / 2;
    this.vy = 0;
    this.rotation = 0;
    this.flapAnimation = 0;
    this.trail = [];
    this._squishTimer = 0;
    this.flapSnapTimer = 0;
    this._auraPulseBoost = 0;
    this.blinkTimer = 0;
    this.blinkCooldown = this._randomInt(210, 290);
    this.blinkScale = 1.0;
    this.blinkFrame = -1;
    this._flashFrame = false;
  }

  // ---------------------------------------------------------------------------
  // flap — player input: jump upward
  // ---------------------------------------------------------------------------
  flap() {
    this.vy = FLAP_STRENGTH;
    this._squishTimer = 9;  // start squish at frame index 9, counts down to 0
    this.flapSnapTimer = 15; // 15 frames total: 0-6 rotate up, 7-15 ease back
    this._auraPulseBoost = 1.0; // spike aura; decays over 12 frames
    this._flashFrame = true;    // one-frame white additive flash
  }

  // ---------------------------------------------------------------------------
  // update — advance physics and animation each frame
  // ---------------------------------------------------------------------------
  update() {
    // Physics
    this.vy += GRAVITY;
    this.y += this.vy;

    // Rotation: clamp(vy * 3, -30, 80) degrees → radians
    const deg = Math.max(-30, Math.min(80, this.vy * 3));
    this.rotation = (deg * Math.PI) / 180;

    // Advance animation counter (drives wing sine wave, aura pulse)
    this.flapAnimation++;

    // ---- Trail ----
    const cx = BIRD_X + BIRD_WIDTH / 2;
    const cy = this.y + BIRD_HEIGHT / 2;
    this.trail.push({ x: cx, y: cy });
    if (this.trail.length > 12) {
      this.trail.shift();
    }

    // ---- Squish timer ----
    if (this._squishTimer > 0) {
      this._squishTimer--;
    }

    // ---- Wing snap timer ----
    if (this.flapSnapTimer > 0) {
      this.flapSnapTimer--;
    }

    // ---- Aura pulse boost decay ----
    // Spikes to 1.3 for 4 frames then decays linearly over 12 frames
    if (this._auraPulseBoost > 0) {
      this._auraPulseBoost = Math.max(0, this._auraPulseBoost - (1.0 / 12));
    }

    // ---- Blink animation ----
    this.blinkTimer++;
    if (this.blinkFrame >= 0) {
      // Blink in progress (9-frame duration)
      this.blinkFrame++;
      if (this.blinkFrame <= 3) {
        // Frames 0-3: ease-in quad, blinkScale 1 → 0.05
        const t = this.blinkFrame / 3;
        this.blinkScale = 1.0 - (1.0 - 0.05) * (t * t);
      } else if (this.blinkFrame <= 5) {
        // Frames 4-5: hold at 0.05
        this.blinkScale = 0.05;
      } else if (this.blinkFrame <= 9) {
        // Frames 6-9: ease-out quad, blinkScale 0.05 → 1.0
        const t = (this.blinkFrame - 6) / 3;
        this.blinkScale = 0.05 + (1.0 - 0.05) * (1 - (1 - t) * (1 - t));
      } else {
        // Done
        this.blinkScale = 1.0;
        this.blinkFrame = -1;
        this.blinkTimer = 0;
        this.blinkCooldown = this._randomInt(210, 290);
      }
    } else if (this.blinkTimer >= this.blinkCooldown) {
      // Start a new blink
      this.blinkFrame = 0;
      this.blinkTimer = 0;
    }
  }

  // ---------------------------------------------------------------------------
  // draw — render the bird on the canvas
  // ---------------------------------------------------------------------------
  draw(ctx) {
    const cx = BIRD_X + BIRD_WIDTH / 2;
    const cy = this.y + BIRD_HEIGHT / 2;

    // =========================================================================
    // 1. Trail segments — drawn BEFORE translate/rotate, at absolute canvas coords
    // =========================================================================
    for (let i = 0; i < this.trail.length; i++) {
      const seg = this.trail[i];
      const t = i / 11;                                   // 0=oldest, 1=newest
      const opacity = t * 0.45;

      let radiusX = 18 * t;
      let radiusY = 10 * t;
      if (i % 3 === 0) {
        radiusY *= 0.7;
        radiusX *= 1.1;
      }

      // Linear interp #6a1080 → #ff6ef7 in RGB space
      const r = Math.round(0x6a + (0xff - 0x6a) * t);
      const g = Math.round(0x10 + (0x6e - 0x10) * t);
      const b = Math.round(0x80 + (0xf7 - 0x80) * t);

      ctx.save();
      ctx.globalAlpha = opacity;
      ctx.beginPath();
      ctx.ellipse(seg.x, seg.y, Math.max(radiusX, 0.1), Math.max(radiusY, 0.1), 0, 0, Math.PI * 2);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fill();
      ctx.restore();
    }

    // =========================================================================
    // Main transform: translate to bird centre, rotate, then squish scale
    // =========================================================================
    // Squish scale from lookup table
    let scaleX = 1.0;
    let scaleY = 1.0;
    if (this._squishTimer > 0) {
      const entry = this._squishTable[this._squishTimer];
      if (entry) {
        scaleX = entry.scaleX;
        scaleY = entry.scaleY;
      }
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.scale(scaleX, scaleY);

    // =========================================================================
    // 2. Aura — large pulsing ellipse, drawn before body
    // =========================================================================
    const sinePulse = 0.85 + Math.sin(this.flapAnimation * 0.07) * 0.15;
    // On flap spike to 1.3, blended with sine formula
    const auroraPulse = this._auraPulseBoost > 0
      ? sinePulse + (1.3 - sinePulse) * this._auraPulseBoost
      : sinePulse;

    ctx.save();
    const auraRx = 30;
    const auraRy = 22 * auroraPulse;
    const auraGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, auraRx);
    auraGrad.addColorStop(0,   'rgba(220,60,255,0)');
    auraGrad.addColorStop(0.5, 'rgba(220,60,255,0.18)');
    auraGrad.addColorStop(0.8, 'rgba(160,0,220,0.10)');
    auraGrad.addColorStop(1.0, 'rgba(160,0,220,0)');
    // Scale Y to match the ellipse aspect
    ctx.scale(1, auraRy / auraRx);
    ctx.beginPath();
    ctx.arc(0, 0, auraRx, 0, Math.PI * 2);
    ctx.fillStyle = auraGrad;
    ctx.fill();
    ctx.restore();

    // =========================================================================
    // 3. Wing — drawn behind body
    // =========================================================================
    const wingYOffset = Math.sin(this.flapAnimation * 0.18) * 5;
    const wingRotBase = Math.sin(this.flapAnimation * 0.18) * (12 * Math.PI / 180);

    // Snap animation: frames 0-6 rotate +35°, frames 7-15 ease back
    let wingSnapRot = 0;
    if (this.flapSnapTimer > 0) {
      const snap = this.flapSnapTimer; // counts down: 15→0
      if (snap > 9) {
        // frames where snap is 15..10 → early phase (0-6 of 0-indexed cycle)
        const phase = (15 - snap) / 6; // 0→1
        wingSnapRot = phase * (35 * Math.PI / 180);
      } else {
        // frames where snap is 9..1 → ease back phase
        const phase = snap / 9; // 1→0
        wingSnapRot = phase * (35 * Math.PI / 180);
      }
    }
    const wingRotation = wingRotBase + wingSnapRot;

    ctx.save();
    ctx.translate(0, wingYOffset);
    ctx.rotate(wingRotation);

    // Wing fill gradient
    const wingGrad = ctx.createLinearGradient(-2, 4, -8, 20);
    wingGrad.addColorStop(0, COLORS.birdWing);    // #e040fb
    wingGrad.addColorStop(1, COLORS.birdShadow);  // #6a1080

    ctx.beginPath();
    ctx.moveTo(-2, 4);
    ctx.quadraticCurveTo(-18, 22, -6, 18);
    ctx.quadraticCurveTo(4, 14, -2, 4);
    ctx.fillStyle = wingGrad;
    ctx.fill();

    // Highlight sliver
    ctx.beginPath();
    ctx.moveTo(-2, 4);
    ctx.quadraticCurveTo(-14, 10, -10, 14);
    ctx.lineTo(-6, 10);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255,200,255,0.55)';
    ctx.fill();

    ctx.restore();

    // =========================================================================
    // 4. Body — two overlapping ellipses, radial gradient fill
    // =========================================================================
    const bodyGrad = ctx.createRadialGradient(-6, -5, 0, -6, -5, 28);
    bodyGrad.addColorStop(0.00, COLORS.birdCore);    // #ffe8ff
    bodyGrad.addColorStop(0.25, COLORS.birdBody);    // #ff6ef7
    bodyGrad.addColorStop(0.60, COLORS.birdMid);     // #c732e8
    bodyGrad.addColorStop(1.00, COLORS.birdShadow);  // #6a1080

    // Primary ellipse
    ctx.beginPath();
    ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
    // Chest ellipse (blended by filling both in the same path is not possible
    // without clipping; instead draw them sequentially with same fill color)
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // Chest bump
    ctx.beginPath();
    ctx.ellipse(-4, 3, 13, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = bodyGrad;
    ctx.fill();

    // ---- One-frame additive flash on flap ----
    if (this._flashFrame) {
      const prevComposite = ctx.globalCompositeOperation;
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.ellipse(0, 0, 20, 14, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(-4, 3, 13, 10, 0, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fill();
      ctx.globalCompositeOperation = prevComposite;
      this._flashFrame = false;
    }

    // =========================================================================
    // 5. Eye (at offset 7,-5 from bird origin)
    // =========================================================================
    ctx.save();
    ctx.translate(7, -5);

    // Apply blink scale vertically, centered on eye
    if (this.blinkScale < 1.0) {
      ctx.scale(1, this.blinkScale);
    }

    // Outer glow
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.birdEyeGlow;  // rgba(255,120,255,0.25)
    ctx.fill();

    // Sclera
    ctx.beginPath();
    ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.birdSclera;  // #f5eeff
    ctx.fill();

    // Iris — radial gradient
    const irisGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 3.8);
    irisGrad.addColorStop(0,   COLORS.birdIrisOuter);  // #00e5ff
    irisGrad.addColorStop(0.5, COLORS.birdIrisMid);    // #0077aa
    irisGrad.addColorStop(1.0, COLORS.birdIrisInner);  // #003344
    ctx.beginPath();
    ctx.arc(0, 0, 3.8, 0, Math.PI * 2);
    ctx.fillStyle = irisGrad;
    ctx.fill();

    // Pupil
    ctx.beginPath();
    ctx.arc(0, 0, 1.8, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.birdPupil;  // #000d14
    ctx.fill();

    // Specular 1
    ctx.beginPath();
    ctx.arc(-1.2, -1.2, 1.1, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();

    // Specular 2
    ctx.beginPath();
    ctx.arc(1.5, 1.0, 0.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fill();

    ctx.restore();

    // =========================================================================
    // 6. Beak — parallelogram
    // =========================================================================
    const beakGrad = ctx.createLinearGradient(13, -3, 22, 4);
    beakGrad.addColorStop(0, COLORS.birdBeakLight);  // #ff9f40
    beakGrad.addColorStop(1, COLORS.birdBeakDark);   // #b35a00

    ctx.beginPath();
    ctx.moveTo(13, -3);
    ctx.lineTo(22, 0);
    ctx.lineTo(21, 4);
    ctx.lineTo(12, 3);
    ctx.closePath();
    ctx.fillStyle = beakGrad;
    ctx.fill();
    ctx.strokeStyle = COLORS.birdBeakStroke;  // #7a3a00
    ctx.lineWidth = 1;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Mouth line
    ctx.beginPath();
    ctx.moveTo(13.5, 0.5);
    ctx.lineTo(21, 2);
    ctx.strokeStyle = 'rgba(88,40,0,0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore(); // end main transform
  }

  // ---------------------------------------------------------------------------
  // getBounds — axis-aligned bounding box for collision detection
  // ---------------------------------------------------------------------------
  getBounds() {
    return {
      x: BIRD_X,
      y: this.y,
      width: BIRD_WIDTH,
      height: BIRD_HEIGHT,
    };
  }
}
