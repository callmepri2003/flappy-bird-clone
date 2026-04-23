const fs = require('fs');
const path = require('path');

// Load the Bird class into scope
eval(fs.readFileSync(path.resolve(__dirname, '../src/bird.js'), 'utf8'));

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
      // 80 degrees in radians
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
});
