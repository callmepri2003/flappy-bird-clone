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
      expect(() => ui.draw(ctx, STATES.MENU, 0, 0)).not.toThrow();
    });

    test('does not throw in PLAYING state', () => {
      expect(() => ui.draw(ctx, STATES.PLAYING, 5, 10)).not.toThrow();
    });

    test('does not throw in DEAD state', () => {
      expect(() => ui.draw(ctx, STATES.DEAD, 3, 10)).not.toThrow();
    });
  });

  describe('drawHUD()', () => {
    test('calls fillText at least once for the score', () => {
      const spy = jest.spyOn(ctx, 'fillText');
      ui.drawHUD(ctx, 42);
      expect(spy).toHaveBeenCalled();
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
  });

  describe('drawRoundedRect()', () => {
    test('is a callable method', () => {
      expect(typeof ui.drawRoundedRect).toBe('function');
    });

    test('does not throw with valid arguments', () => {
      expect(() => ui.drawRoundedRect(ctx, 10, 10, 100, 60, 8, '#fff', '#000')).not.toThrow();
    });
  });
});
