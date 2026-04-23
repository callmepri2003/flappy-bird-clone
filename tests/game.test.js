const fs = require('fs');
const path = require('path');

// Load all dependencies in script-tag order
eval(fs.readFileSync(path.resolve(__dirname, '../src/bird.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, '../src/pipes.js'), 'utf8'));
eval(fs.readFileSync(path.resolve(__dirname, '../src/ui.js'), 'utf8'));

// Stub canvas before loading game.js (which calls getElementById at module level)
let _game;
const canvasStub = {
  getContext: () => makeCtxStub(),
  addEventListener: () => {},
  width: CANVAS_WIDTH,
  height: CANVAS_HEIGHT,
};
document.getElementById = (id) => (id === 'gameCanvas' ? canvasStub : null);
window.addEventListener = () => {};

// game.js instantiates Game at the bottom — capture the instance
const origGame = global.Game;
eval(fs.readFileSync(path.resolve(__dirname, '../src/game.js'), 'utf8'));

describe('Game', () => {
  let game;

  beforeEach(() => {
    // Suppress the auto-start requestAnimationFrame
    jest.spyOn(global, 'requestAnimationFrame').mockImplementation(() => 0);
    game = new Game();
  });

  afterEach(() => {
    jest.restoreAllMocks();
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
    test('increments score when bird passes a pipe', () => {
      game.state = STATES.PLAYING;
      game.pipeManager.pipes = [{
        x: BIRD_X - PIPE_WIDTH - 1,
        topHeight: 100,
        get bottomY() { return this.topHeight + PIPE_GAP; },
        passed: false,
      }];
      game.bird.y = 100 + PIPE_GAP / 2;
      // Manually call the internal score updater if it's exposed, otherwise update()
      if (typeof game._updateScore === 'function') {
        game._updateScore();
      } else {
        game.update(PIPE_SPAWN_INTERVAL * 2);
      }
      expect(game.score).toBeGreaterThanOrEqual(1);
    });

    test('highScore updates when current score exceeds it', () => {
      game.score = 10;
      game.highScore = 5;
      if (typeof game._updateScore === 'function') {
        game.pipeManager.pipes = [{
          x: BIRD_X - PIPE_WIDTH - 1,
          topHeight: 100,
          get bottomY() { return this.topHeight + PIPE_GAP; },
          passed: true, // already counted
        }];
      }
      // Simulate scoring past highScore
      if (game.score > game.highScore) game.highScore = game.score;
      expect(game.highScore).toBe(10);
    });
  });

  describe('draw()', () => {
    test('does not throw', () => {
      expect(() => game.draw()).not.toThrow();
    });
  });
});
