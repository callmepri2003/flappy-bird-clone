const fs = require('fs');
const path = require('path');

eval(fs.readFileSync(path.resolve(__dirname, '../src/pipes.js'), 'utf8'));

describe('PipeManager', () => {
  let pm;

  beforeEach(() => {
    pm = new PipeManager();
  });

  describe('constructor', () => {
    test('starts with empty pipes array', () => {
      expect(pm.pipes).toEqual([]);
    });

    test('lastSpawnTime starts at 0', () => {
      expect(pm.lastSpawnTime).toBe(0);
    });
  });

  describe('spawnPipe()', () => {
    test('adds a pipe to the array', () => {
      pm.spawnPipe();
      expect(pm.pipes).toHaveLength(1);
    });

    test('pipe spawns off right edge of canvas', () => {
      pm.spawnPipe();
      expect(pm.pipes[0].x).toBeGreaterThanOrEqual(CANVAS_WIDTH);
    });

    test('topHeight is within safe bounds', () => {
      for (let i = 0; i < 50; i++) {
        pm.spawnPipe();
      }
      pm.pipes.forEach(pipe => {
        expect(pipe.topHeight).toBeGreaterThanOrEqual(60);
        expect(pipe.topHeight).toBeLessThanOrEqual(
          CANVAS_HEIGHT - GROUND_HEIGHT - PIPE_GAP - 60
        );
      });
    });

    test('bottomY equals topHeight + PIPE_GAP', () => {
      pm.spawnPipe();
      const pipe = pm.pipes[0];
      expect(pipe.bottomY).toBe(pipe.topHeight + PIPE_GAP);
    });

    test('gap bottom is above ground', () => {
      for (let i = 0; i < 50; i++) {
        pm.spawnPipe();
      }
      pm.pipes.forEach(pipe => {
        expect(pipe.bottomY + PIPE_GAP).toBeLessThanOrEqual(
          CANVAS_HEIGHT - GROUND_HEIGHT
        );
      });
    });

    test('pipe has passed=false on creation', () => {
      pm.spawnPipe();
      expect(pm.pipes[0].passed).toBe(false);
    });
  });

  describe('update()', () => {
    test('moves pipes left by GAME_SPEED', () => {
      pm.spawnPipe();
      const startX = pm.pipes[0].x;
      pm.update(PIPE_SPAWN_INTERVAL + 1);
      expect(pm.pipes[0].x).toBe(startX - GAME_SPEED);
    });

    test('removes pipes that scroll off screen', () => {
      pm.spawnPipe();
      pm.pipes[0].x = -PIPE_WIDTH - 1;
      pm.update(PIPE_SPAWN_INTERVAL + 2);
      // The out-of-bounds pipe should be gone (a new one may be spawned)
      const offscreen = pm.pipes.filter(p => p.x + PIPE_WIDTH < 0);
      expect(offscreen).toHaveLength(0);
    });

    test('spawns a new pipe after PIPE_SPAWN_INTERVAL ms', () => {
      // First update at t=0 may spawn immediately; reset
      pm.reset();
      pm.lastSpawnTime = 1000;
      pm.update(1000 + PIPE_SPAWN_INTERVAL + 1);
      expect(pm.pipes.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('reset()', () => {
    test('clears all pipes', () => {
      pm.spawnPipe();
      pm.spawnPipe();
      pm.reset();
      expect(pm.pipes).toHaveLength(0);
    });

    test('resets lastSpawnTime', () => {
      pm.lastSpawnTime = 9999;
      pm.reset();
      expect(pm.lastSpawnTime).toBe(0);
    });
  });

  describe('checkBirdCollision()', () => {
    test('returns false when no pipes', () => {
      expect(pm.checkBirdCollision(BIRD_X, 200, BIRD_WIDTH, BIRD_HEIGHT)).toBe(false);
    });

    test('returns true when bird overlaps top pipe', () => {
      pm.pipes = [{
        x: BIRD_X - PIPE_WIDTH / 2,
        topHeight: 300,
        get bottomY() { return this.topHeight + PIPE_GAP; },
        passed: false,
      }];
      // Bird at y=0 — squarely inside the top pipe region
      expect(pm.checkBirdCollision(BIRD_X, 0, BIRD_WIDTH, BIRD_HEIGHT)).toBe(true);
    });

    test('returns true when bird overlaps bottom pipe', () => {
      pm.pipes = [{
        x: BIRD_X - PIPE_WIDTH / 2,
        topHeight: 100,
        get bottomY() { return this.topHeight + PIPE_GAP; },
        passed: false,
      }];
      // Bird well below gap
      const belowGap = 100 + PIPE_GAP + 10;
      expect(pm.checkBirdCollision(BIRD_X, belowGap, BIRD_WIDTH, BIRD_HEIGHT)).toBe(true);
    });

    test('returns false when bird passes cleanly through gap', () => {
      pm.pipes = [{
        x: BIRD_X - PIPE_WIDTH / 2,
        topHeight: 200,
        get bottomY() { return this.topHeight + PIPE_GAP; },
        passed: false,
      }];
      const midGap = 200 + PIPE_GAP / 2 - BIRD_HEIGHT / 2;
      expect(pm.checkBirdCollision(BIRD_X, midGap, BIRD_WIDTH, BIRD_HEIGHT)).toBe(false);
    });
  });

  describe('draw()', () => {
    test('does not throw with a stubbed context', () => {
      pm.spawnPipe();
      expect(() => pm.draw(makeCtxStub())).not.toThrow();
    });
  });
});
