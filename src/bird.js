// Bird class — physics, flap mechanic, and animated character rendering
class Bird {
  constructor() {
    this.x = BIRD_X;
    this.y = CANVAS_HEIGHT / 2 - BIRD_HEIGHT / 2;
    this.vy = 0;
    this.rotation = 0;      // radians
    this.flapAnimation = 0; // increments each frame, drives wing + squish

    // Squish/stretch state
    this._squishTimer = 0;  // frames remaining in squish animation
  }

  // ---------------------------------------------------------------------------
  // reset — called when restarting the game
  // ---------------------------------------------------------------------------
  reset() {
    this.y = CANVAS_HEIGHT / 2 - BIRD_HEIGHT / 2;
    this.vy = 0;
    this.rotation = 0;
    this.flapAnimation = 0;
    this._squishTimer = 0;
  }

  // ---------------------------------------------------------------------------
  // flap — player input: jump upward
  // ---------------------------------------------------------------------------
  flap() {
    this.vy = FLAP_STRENGTH;
    this._squishTimer = 10; // 10 frames of squish/stretch
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

    // Advance animation counter (drives wing sine wave)
    this.flapAnimation++;

    // Decay squish timer
    if (this._squishTimer > 0) {
      this._squishTimer--;
    }
  }

  // ---------------------------------------------------------------------------
  // draw — render the bird on the canvas
  // ---------------------------------------------------------------------------
  draw(ctx) {
    // Bird centre in canvas space
    const cx = BIRD_X + BIRD_WIDTH / 2;
    const cy = this.y + BIRD_HEIGHT / 2;

    // --- Squish / stretch scale ---
    // t goes 1 → 0 over _squishTimer frames
    const squishT = this._squishTimer / 10; // 1 at peak, 0 when done
    // On flap: briefly squish vertically (scaleY < 1) and stretch horizontally (scaleX > 1)
    const squishAmount = Math.sin(squishT * Math.PI); // smooth bell curve
    const scaleX = 1 + squishAmount * 0.25;  // up to +25 % wider
    const scaleY = 1 - squishAmount * 0.20;  // up to -20 % shorter

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.rotation);
    ctx.scale(scaleX, scaleY);

    // -------------------------------------------------------------------------
    // Wing (drawn first so it appears behind the body)
    // -------------------------------------------------------------------------
    // Wing bobs up and down using a sine of flapAnimation
    const wingBob = Math.sin(this.flapAnimation * 0.35) * 6; // ±6 px
    const wingW = BIRD_WIDTH * 0.50;
    const wingH = BIRD_HEIGHT * 0.40;
    const wingOffsetX = -2;
    const wingOffsetY = BIRD_HEIGHT * 0.20 + wingBob; // hangs below centre

    ctx.beginPath();
    ctx.ellipse(wingOffsetX, wingOffsetY, wingW / 2, wingH / 2, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.birdWing;
    ctx.fill();

    // -------------------------------------------------------------------------
    // Body — yellow ellipse
    // -------------------------------------------------------------------------
    const bodyHalfW = BIRD_WIDTH / 2;
    const bodyHalfH = BIRD_HEIGHT / 2;

    ctx.beginPath();
    ctx.ellipse(0, 0, bodyHalfW, bodyHalfH, 0, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.bird;
    ctx.fill();

    // Subtle dark underside shading
    const underGrad = ctx.createLinearGradient(0, -bodyHalfH, 0, bodyHalfH);
    underGrad.addColorStop(0, 'rgba(255,255,255,0.15)');
    underGrad.addColorStop(1, 'rgba(0,0,0,0.10)');
    ctx.beginPath();
    ctx.ellipse(0, 0, bodyHalfW, bodyHalfH, 0, 0, Math.PI * 2);
    ctx.fillStyle = underGrad;
    ctx.fill();

    // -------------------------------------------------------------------------
    // Eye — white sclera + dark pupil
    // -------------------------------------------------------------------------
    const eyeX = bodyHalfW * 0.45;
    const eyeY = -bodyHalfH * 0.20;
    const eyeR = BIRD_HEIGHT * 0.22;

    // White
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, eyeR, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.birdEye;
    ctx.fill();

    // Pupil (offset slightly toward beak for a looking-forward feel)
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.25, eyeY + eyeR * 0.10, eyeR * 0.55, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.birdPupil;
    ctx.fill();

    // Eye shine
    ctx.beginPath();
    ctx.arc(eyeX + eyeR * 0.05, eyeY - eyeR * 0.30, eyeR * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.fill();

    // -------------------------------------------------------------------------
    // Beak — small orange triangle pointing right
    // -------------------------------------------------------------------------
    const beakX = bodyHalfW * 0.80;
    const beakY = -bodyHalfH * 0.05;
    const beakLen = BIRD_WIDTH * 0.28;
    const beakHalfH = BIRD_HEIGHT * 0.14;

    ctx.beginPath();
    ctx.moveTo(beakX, beakY - beakHalfH);   // top-left corner
    ctx.lineTo(beakX + beakLen, beakY);       // tip (right)
    ctx.lineTo(beakX, beakY + beakHalfH);    // bottom-left corner
    ctx.closePath();
    ctx.fillStyle = COLORS.birdBeak;
    ctx.fill();

    // Beak edge line for definition
    ctx.beginPath();
    ctx.moveTo(beakX, beakY);
    ctx.lineTo(beakX + beakLen, beakY);
    ctx.strokeStyle = 'rgba(0,0,0,0.18)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
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
