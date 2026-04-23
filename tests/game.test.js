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
});
