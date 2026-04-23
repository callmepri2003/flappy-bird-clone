loadSrc('../src/ui.js', 'UI');

describe('UI', () => {
  let ui;
  let ctx;

  beforeEach(() => {
    ui = new UI();
    ctx = makeCtxStub();
  });

  describe('constructor', () => {
    test('instantiates without throwing', () => {
      expect(() => new UI()).not.toThrow();
    });
  });

  describe('draw()', () => {
    test('does not throw in MENU state', () => {
      expect(() => ui.draw(ctx, STATES.MENU, 0, 0, null)).not.toThrow();
    });

    test('does not throw in PLAYING state', () => {
      expect(() => ui.draw(ctx, STATES.PLAYING, 5, 10, null)).not.toThrow();
    });

    test('does not throw in DEAD state', () => {
      expect(() => ui.draw(ctx, STATES.DEAD, 3, 10, null)).not.toThrow();
    });

    test('does not throw in READY state', () => {
      expect(() => ui.draw(ctx, STATES.READY, 0, 0, null)).not.toThrow();
    });
  });

  describe('drawHUD()', () => {
    test('calls fillText at least once for the score', () => {
      const spy = jest.spyOn(ctx, 'fillText');
      ui.drawHUD(ctx, 42, 100, null);
      expect(spy).toHaveBeenCalled();
    });

    test('does not throw with scorePop animation object', () => {
      expect(() => ui.drawHUD(ctx, 5, 10, { scale: 1.2, frame: 3 })).not.toThrow();
    });

    test('does not throw with null scorePop', () => {
      expect(() => ui.drawHUD(ctx, 5, 10, null)).not.toThrow();
    });

    test('does not throw when score equals highScore', () => {
      expect(() => ui.drawHUD(ctx, 10, 10, null)).not.toThrow();
    });
  });

  describe('drawMenu()', () => {
    test('calls fillText for title', () => {
      const spy = jest.spyOn(ctx, 'fillText');
      ui.drawMenu(ctx);
      expect(spy).toHaveBeenCalled();
    });

    test('calls fillRect for overlay', () => {
      const spy = jest.spyOn(ctx, 'fillRect');
      ui.drawMenu(ctx);
      expect(spy).toHaveBeenCalled();
    });

    test('does not throw', () => {
      expect(() => ui.drawMenu(ctx)).not.toThrow();
    });
  });

  describe('drawGameOver()', () => {
    test('calls fillText for GAME OVER title', () => {
      const spy = jest.spyOn(ctx, 'fillText');
      ui.drawGameOver(ctx, 5, 10);
      const calls = spy.mock.calls.map(c => String(c[0]).toUpperCase());
      expect(calls.some(t => t.includes('GAME') || t.includes('OVER'))).toBe(true);
    });

    test('renders score value somewhere in text calls', () => {
      const spy = jest.spyOn(ctx, 'fillText');
      ui.drawGameOver(ctx, 7, 12);
      const calls = spy.mock.calls.map(c => String(c[0]));
      expect(calls.some(t => t.includes('7') || t.includes('12'))).toBe(true);
    });

    test('does not throw when score equals highScore (new best)', () => {
      expect(() => ui.drawGameOver(ctx, 10, 10)).not.toThrow();
    });

    test('shows NEW BEST when score >= highScore and score > 0', () => {
      const spy = jest.spyOn(ctx, 'fillText');
      // Force gameOverTime to be well in the past so the badge is rendered
      ui.gameOverTime = Date.now() - 2000;
      ui.drawGameOver(ctx, 15, 15);
      const calls = spy.mock.calls.map(c => String(c[0]).toUpperCase());
      expect(calls.some(t => t.includes('BEST'))).toBe(true);
    });

    test('does not show NEW BEST when score is 0', () => {
      const spy = jest.spyOn(ctx, 'fillText');
      ui.gameOverTime = Date.now() - 2000;
      ui.drawGameOver(ctx, 0, 5);
      const calls = spy.mock.calls.map(c => String(c[0]).toUpperCase());
      // Should not have NEW BEST badge text (just the BEST label is OK)
      expect(calls.some(t => t.includes('NEW BEST'))).toBe(false);
    });

    test('medal is drawn for score=5 (Bronze) without throwing', () => {
      expect(() => {
        ui.gameOverTime = Date.now() - 2000;
        ui.drawGameOver(ctx, 5, 10);
      }).not.toThrow();
    });

    test('medal is drawn for score=15 (Silver) without throwing', () => {
      expect(() => {
        ui.gameOverTime = Date.now() - 2000;
        ui.drawGameOver(ctx, 15, 20);
      }).not.toThrow();
    });

    test('medal is drawn for score=25 (Gold) without throwing', () => {
      expect(() => {
        ui.gameOverTime = Date.now() - 2000;
        ui.drawGameOver(ctx, 25, 30);
      }).not.toThrow();
    });

    test('medal is drawn for score=45 (Platinum) without throwing', () => {
      expect(() => {
        ui.gameOverTime = Date.now() - 2000;
        ui.drawGameOver(ctx, 45, 50);
      }).not.toThrow();
    });
  });

  describe('drawGetReady()', () => {
    test('does not throw at elapsed=0ms', () => {
      expect(() => ui.drawGetReady(ctx, 0)).not.toThrow();
    });

    test('does not throw at elapsed=1000ms', () => {
      expect(() => ui.drawGetReady(ctx, 1000)).not.toThrow();
    });

    test('does not throw at elapsed=2000ms', () => {
      expect(() => ui.drawGetReady(ctx, 2000)).not.toThrow();
    });

    test('does not throw at elapsed=2220ms (GO! phase)', () => {
      expect(() => ui.drawGetReady(ctx, 2220)).not.toThrow();
    });

    test('does not throw after sequence completes (elapsed=3000ms)', () => {
      expect(() => ui.drawGetReady(ctx, 3000)).not.toThrow();
    });
  });

  describe('drawRoundedRect()', () => {
    test('is a callable method', () => {
      expect(typeof ui.drawRoundedRect).toBe('function');
    });

    test('does not throw with valid arguments', () => {
      expect(() => ui.drawRoundedRect(ctx, 10, 10, 100, 60, 8, '#fff', '#000')).not.toThrow();
    });
  });

  describe('notifyGameOver()', () => {
    test('resets gameOverTime', () => {
      ui.gameOverTime = null;
      ui.notifyGameOver();
      expect(ui.gameOverTime).not.toBeNull();
      expect(typeof ui.gameOverTime).toBe('number');
    });
  });
});
