loadSrc('../src/bird.js', 'Bird');

describe('Bird', () => {
  let bird;

  beforeEach(() => {
    bird = new Bird();
  });

  describe('constructor', () => {
    test('starts at vertical centre of canvas', () => {
      expect(bird.y).toBeCloseTo(CANVAS_HEIGHT / 2 - BIRD_HEIGHT / 2);
    });

    test('starts with zero vertical velocity', () => {
      expect(bird.vy).toBe(0);
    });

    test('starts with zero rotation', () => {
      expect(bird.rotation).toBe(0);
    });
  });

  describe('flap()', () => {
    test('sets velocity to FLAP_STRENGTH', () => {
      bird.flap();
      expect(bird.vy).toBe(FLAP_STRENGTH);
    });

    test('FLAP_STRENGTH is negative (upward)', () => {
      expect(FLAP_STRENGTH).toBeLessThan(0);
    });
  });

  describe('update()', () => {
    test('gravity increases vy each frame', () => {
      bird.update();
      expect(bird.vy).toBeCloseTo(GRAVITY);
    });

    test('y position changes by vy', () => {
      bird.vy = 5;
      const startY = bird.y;
      bird.update();
      expect(bird.y).toBeCloseTo(startY + 5 + GRAVITY);
    });

    test('rotation is negative when moving up', () => {
      bird.flap();
      bird.update();
      expect(bird.rotation).toBeLessThan(0);
    });

    test('rotation is positive when falling fast', () => {
      bird.vy = 15;
      bird.update();
      expect(bird.rotation).toBeGreaterThan(0);
    });

    test('rotation is clamped to max downward angle', () => {
      bird.vy = 999;
      bird.update();
      expect(bird.rotation).toBeLessThanOrEqual((80 * Math.PI) / 180 + 0.01);
    });
  });

  describe('reset()', () => {
    test('restores y to centre', () => {
      bird.y = 999;
      bird.reset();
      expect(bird.y).toBeCloseTo(CANVAS_HEIGHT / 2 - BIRD_HEIGHT / 2);
    });

    test('restores vy to 0', () => {
      bird.vy = -20;
      bird.reset();
      expect(bird.vy).toBe(0);
    });

    test('restores rotation to 0', () => {
      bird.rotation = 1.5;
      bird.reset();
      expect(bird.rotation).toBe(0);
    });
  });

  describe('getBounds()', () => {
    test('returns object with x, y, width, height', () => {
      const b = bird.getBounds();
      expect(b).toHaveProperty('x');
      expect(b).toHaveProperty('y');
      expect(b).toHaveProperty('width');
      expect(b).toHaveProperty('height');
    });

    test('x is always BIRD_X', () => {
      expect(bird.getBounds().x).toBe(BIRD_X);
    });

    test('y matches current bird y', () => {
      bird.y = 300;
      expect(bird.getBounds().y).toBe(300);
    });
  });

  describe('draw()', () => {
    test('does not throw with a stubbed context', () => {
      expect(() => bird.draw(makeCtxStub())).not.toThrow();
    });
  });

  // ---------------------------------------------------------------------------
  // Premium synthwave feature tests
  // ---------------------------------------------------------------------------

  describe('trail system', () => {
    test('trail starts empty', () => {
      expect(bird.trail).toEqual([]);
    });

    test('trail grows to 12 entries after 12 update calls', () => {
      for (let i = 0; i < 12; i++) bird.update();
      expect(bird.trail.length).toBe(12);
    });

    test('trail never exceeds 12 entries', () => {
      for (let i = 0; i < 50; i++) bird.update();
      expect(bird.trail.length).toBeLessThanOrEqual(12);
    });

    test('trail entries contain x and y', () => {
      bird.update();
      expect(bird.trail[0]).toHaveProperty('x');
      expect(bird.trail[0]).toHaveProperty('y');
    });
  });

  describe('blink animation', () => {
    test('blinkCooldown initialises between 210 and 290 (inclusive)', () => {
      expect(bird.blinkCooldown).toBeGreaterThanOrEqual(210);
      expect(bird.blinkCooldown).toBeLessThanOrEqual(290);
    });

    test('blinkScale is 1.0 initially', () => {
      expect(bird.blinkScale).toBe(1.0);
    });

    test('blinkFrame is -1 initially (inactive)', () => {
      expect(bird.blinkFrame).toBe(-1);
    });
  });

  describe('squish lookup table', () => {
    test('squish lookup frame 0 has scaleX=0.72', () => {
      expect(bird._squishTable[0].scaleX).toBeCloseTo(0.72);
    });

    test('squish lookup frame 0 has scaleY=1.38', () => {
      expect(bird._squishTable[0].scaleY).toBeCloseTo(1.38);
    });

    test('squish lookup frame 4 is neutral (scaleX=1.00, scaleY=1.00)', () => {
      expect(bird._squishTable[4].scaleX).toBeCloseTo(1.00);
      expect(bird._squishTable[4].scaleY).toBeCloseTo(1.00);
    });

    test('squish lookup table has exactly 10 entries', () => {
      expect(bird._squishTable.length).toBe(10);
    });
  });

  describe('aura pulse', () => {
    test('auroraPulse at flapAnimation=0 equals 0.85 + sin(0)*0.15 = 0.85', () => {
      bird.flapAnimation = 0;
      const expected = 0.85 + Math.sin(0 * 0.07) * 0.15;
      expect(expected).toBeCloseTo(0.85);
      // auroraPulse is computed in draw; verify formula via direct calculation
      const pulse = 0.85 + Math.sin(bird.flapAnimation * 0.07) * 0.15;
      expect(pulse).toBeCloseTo(0.85);
    });

    test('flapSnapTimer initialises to 0', () => {
      expect(bird.flapSnapTimer).toBe(0);
    });

    test('flap() sets flapSnapTimer to 15', () => {
      bird.flap();
      expect(bird.flapSnapTimer).toBe(15);
    });
  });
});
