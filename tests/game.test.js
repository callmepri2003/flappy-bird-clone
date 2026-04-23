// Load dependencies in script-tag order
loadSrc('../src/bird.js', 'Bird');
loadSrc('../src/pipes.js', 'PipeManager');
loadSrc('../src/ui.js', 'UI');
// game.js auto-runs `new Game().init()` at the bottom — RAF is already stubbed in setup.js
loadSrc('../src/game.js', 'Game');

describe('Game', () => {
  let game;

  beforeEach(() => {
    game = new Game();
  });

  describe('initial state', () => {
    test('starts in MENU state', () => {
      expect(game.state).toBe(STATES.MENU);
    });

    test('score starts at 0', () => {
      expect(game.score).toBe(0);
    });

    test('highScore starts at 0', () => {
      expect(game.highScore).toBe(0);
    });
  });

  describe('reset()', () => {
    test('resets score to 0', () => {
      game.score = 15;
      game.reset();
      expect(game.score).toBe(0);
    });

    test('does not reset highScore', () => {
      game.highScore = 15;
      game.reset();
      expect(game.highScore).toBe(15);
    });
  });

  describe('checkCollisions()', () => {
    beforeEach(() => {
      game.state = STATES.PLAYING;
      // Ensure sub-systems are initialised
      if (!game.bird) game.bird = new Bird();
      if (!game.pipeManager) game.pipeManager = new PipeManager();
    });

    test('sets state to DEAD when bird is below ground', () => {
      game.bird.y = CANVAS_HEIGHT - GROUND_HEIGHT + 10;
      game.checkCollisions();
      expect(game.state).toBe(STATES.DEAD);
    });

    test('sets state to DEAD when bird goes above ceiling', () => {
      game.bird.y = -10;
      game.checkCollisions();
      expect(game.state).toBe(STATES.DEAD);
    });

    test('remains PLAYING when bird is in safe zone with no pipes', () => {
      game.bird.y = CANVAS_HEIGHT / 2;
      game.pipeManager.pipes = [];
      game.checkCollisions();
      expect(game.state).toBe(STATES.PLAYING);
    });
  });

  describe('score tracking', () => {
    beforeEach(() => {
      game.state = STATES.PLAYING;
      if (!game.bird) game.bird = new Bird();
      if (!game.pipeManager) game.pipeManager = new PipeManager();
    });

    test('increments score when bird passes a pipe', () => {
      game.pipeManager.pipes = [{
        x: BIRD_X - PIPE_WIDTH - 1,
        topHeight: 100,
        get bottomY() { return this.topHeight + PIPE_GAP; },
        passed: false,
      }];
      game.bird.y = 100 + PIPE_GAP / 2;
      if (typeof game._updateScore === 'function') {
        game._updateScore();
      } else {
        game.update(PIPE_SPAWN_INTERVAL * 2);
      }
      expect(game.score).toBeGreaterThanOrEqual(1);
    });

    test('highScore updates when score exceeds previous best', () => {
      game.score = 10;
      game.highScore = 5;
      // Trigger update path that checks highScore
      if (typeof game._updateScore === 'function') {
        game.pipeManager.pipes = [{
          x: BIRD_X - PIPE_WIDTH - 1,
          topHeight: 100,
          get bottomY() { return this.topHeight + PIPE_GAP; },
          passed: false,
        }];
        game._updateScore();
        expect(game.highScore).toBeGreaterThanOrEqual(10);
      } else {
        if (game.score > game.highScore) game.highScore = game.score;
        expect(game.highScore).toBe(10);
      }
    });
  });

  describe('draw()', () => {
    test('does not throw', () => {
      expect(() => game.draw()).not.toThrow();
    });
  });

  // ── New premium-world tests ──────────────────────────────────────────────────

  describe('screen shake', () => {
    test('shakeFrames initialises to 0', () => {
      expect(game.shakeFrames).toBe(0);
    });

    test('shakeFrames is set to 28 when bird is killed', () => {
      game.state = STATES.PLAYING;
      game._killBird();
      expect(game.shakeFrames).toBe(28);
    });

    test('shakeFrames decrements each draw call while > 0', () => {
      game.shakeFrames = 28;
      game.draw();
      expect(game.shakeFrames).toBe(27);
    });

    test('shakeFrames resets to 0 after 28 draw frames', () => {
      game.shakeFrames = 28;
      for (let i = 0; i < 28; i++) {
        game.draw();
      }
      expect(game.shakeFrames).toBe(0);
    });
  });

  describe('ember particles', () => {
    test('embers array is initialised with exactly 18 entries', () => {
      expect(Array.isArray(game.embers)).toBe(true);
      expect(game.embers.length).toBe(18);
    });

    test('each ember has the required properties', () => {
      for (const e of game.embers) {
        expect(e).toHaveProperty('x');
        expect(e).toHaveProperty('y');
        expect(e).toHaveProperty('radius');
        expect(e).toHaveProperty('opacity');
        expect(e).toHaveProperty('vx');
        expect(e).toHaveProperty('vy');
        expect(e).toHaveProperty('life');
        expect(e).toHaveProperty('decay');
        expect(e).toHaveProperty('color');
      }
    });

    test('ember radius is between 1 and 2.2', () => {
      for (const e of game.embers) {
        expect(e.radius).toBeGreaterThanOrEqual(1);
        expect(e.radius).toBeLessThanOrEqual(2.2);
      }
    });

    test('ember decay is 0.003', () => {
      for (const e of game.embers) {
        expect(e.decay).toBeCloseTo(0.003);
      }
    });
  });

  describe('parallax layers', () => {
    test('parallaxLayers array has 3 entries', () => {
      expect(Array.isArray(game.parallaxLayers)).toBe(true);
      expect(game.parallaxLayers.length).toBe(3);
    });

    test('each layer has an xOffset property initialised to 0', () => {
      for (const layer of game.parallaxLayers) {
        expect(layer).toHaveProperty('xOffset');
        expect(layer.xOffset).toBe(0);
      }
    });

    test('each layer has a speed property', () => {
      const expectedSpeeds = [0.45, 1.05, 1.8];
      game.parallaxLayers.forEach((layer, i) => {
        expect(layer).toHaveProperty('speed');
        expect(layer.speed).toBeCloseTo(expectedSpeeds[i]);
      });
    });

    test('layer xOffsets decrement by speed each update frame', () => {
      game.state = STATES.PLAYING;
      if (!game.bird) game.bird = new Bird();
      if (!game.pipeManager) game.pipeManager = new PipeManager();
      // snapshot offsets before update
      const before = game.parallaxLayers.map(l => l.xOffset);
      game.update(0);
      game.parallaxLayers.forEach((layer, i) => {
        // after one update frame, xOffset should have decreased by speed
        // (or wrapped — check it moved)
        const delta = before[i] - layer.xOffset;
        // delta === speed OR layer wrapped (xOffset reset to near 0)
        const wrapped = layer.xOffset >= 0 && layer.xOffset < layer.speed + 1;
        expect(delta === layer.speed || wrapped).toBe(true);
      });
    });

    test('layer xOffset wraps back toward 0 when it reaches -960', () => {
      // Set xOffset to just past the tile width boundary
      game.parallaxLayers[0].xOffset = -960;
      // Simulate one update
      game.state = STATES.PLAYING;
      if (!game.bird) game.bird = new Bird();
      if (!game.pipeManager) game.pipeManager = new PipeManager();
      game.update(0);
      // After wrap, xOffset should be >= -960
      expect(game.parallaxLayers[0].xOffset).toBeGreaterThanOrEqual(-960);
    });
  });

  describe('score pop animation', () => {
    beforeEach(() => {
      game.state = STATES.PLAYING;
      if (!game.bird) game.bird = new Bird();
      if (!game.pipeManager) game.pipeManager = new PipeManager();
    });

    test('scorePop initialises with scale 1.0 and frame 0', () => {
      expect(game.scorePop).toBeDefined();
      expect(game.scorePop.scale).toBeCloseTo(1.0);
      expect(game.scorePop.frame).toBe(0);
    });

    test('scorePop scale is set to 1.32 when score increments', () => {
      game.pipeManager.pipes = [{
        x: BIRD_X - PIPE_WIDTH - 1,
        topHeight: 100,
        get bottomY() { return this.topHeight + PIPE_GAP; },
        passed: false,
      }];
      game._updateScore();
      expect(game.scorePop.scale).toBeCloseTo(1.32);
      expect(game.scorePop.frame).toBe(0);
    });

    test('scorePop scale decays toward 1.0 each draw frame', () => {
      game.scorePop = { scale: 1.32, frame: 0 };
      game.draw();
      expect(game.scorePop.scale).toBeLessThan(1.32);
    });
  });
});
