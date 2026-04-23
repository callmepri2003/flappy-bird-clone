// Inject all shared constants into the global scope (mirrors the browser script-tag load order)
global.CANVAS_WIDTH = 480;
global.CANVAS_HEIGHT = 640;
global.GRAVITY = 0.5;
global.FLAP_STRENGTH = -10;
global.GAME_SPEED = 3;
global.BIRD_X = 80;
global.BIRD_WIDTH = 40;
global.BIRD_HEIGHT = 30;
global.PIPE_WIDTH = 60;
global.PIPE_GAP = 160;
global.PIPE_SPAWN_INTERVAL = 1800;
global.GROUND_HEIGHT = 80;
global.COLORS = {
  sky: '#70c5ce', skyBottom: '#a8e6cf',
  ground: '#ded895', groundDark: '#c8b560',
  pipe: '#73bf2e', pipeDark: '#0a0010', pipeBorder: '#4a8a1a',
  pipeViolet: '#1a0030', pipeMid: '#2d0055', pipeCenter: '#3d006e',
  pipeCapEdge: '#0d0018', pipeCapDark: '#280050',
  pipeCapViolet: '#4a0090', pipeCapBright: '#6600cc',
  pipeCapRim: '#cc00ff',
  pipeNeon: 'rgba(255,0,204,0.12)', pipeNeon2: 'rgba(255,0,204,0.06)',
  pipeLeftHighlight: 'rgba(160,80,255,0.3)', pipeShadow: 'rgba(0,0,0,0.55)',
  bird: '#f7d358', birdWing: '#e8c000', birdEye: '#ffffff',
  birdPupil: '#333333', birdBeak: '#f0a030',
  score: '#ffffff', shadow: 'rgba(0,0,0,0.3)',
};
global.STATES = { MENU: 'menu', PLAYING: 'playing', DEAD: 'dead' };

// Stub requestAnimationFrame so game.js bootstrap doesn't spin a real RAF loop
global.requestAnimationFrame = jest.fn(() => 0);
global.cancelAnimationFrame = jest.fn();

/**
 * Load a vanilla-JS source file and assign the named classes to global.
 * new Function() evaluates in sloppy-mode function scope so `class` declarations
 * are visible as local variables; we return them and assign to global explicitly.
 * This works inside Jest's sandboxed global unlike vm.runInThisContext().
 */
global.loadSrc = function loadSrc(relPath, ...classNames) {
  const fs = require('fs');
  const path = require('path');
  const code = fs.readFileSync(path.resolve(__dirname, relPath), 'utf8');
  // Build: "<source code>; return { Bird, PipeManager, ... };"
  const exportedObj = (new Function(`${code}; return {${classNames.join(',')}};`))();
  Object.assign(global, exportedObj);
};

// Provide document/window stubs (not available in node testEnvironment)
const canvasStub = {
  getContext: () => global.makeCtxStub(),
  addEventListener: jest.fn(),
  width: global.CANVAS_WIDTH,
  height: global.CANVAS_HEIGHT,
};
global.document = {
  getElementById: jest.fn((id) => (id === 'gameCanvas' ? canvasStub : null)),
  addEventListener: jest.fn(),
};
global.window = {
  addEventListener: jest.fn(),
};

// Minimal canvas 2D context stub so rendering code doesn't throw in Node
function makeCtxStub() {
  const noop = () => {};
  return {
    save: noop, restore: noop, translate: noop, rotate: noop,
    scale: noop, beginPath: noop, closePath: noop, fill: noop, stroke: noop,
    fillRect: noop, clearRect: noop, strokeRect: noop, arc: noop, arcTo: noop, ellipse: noop,
    moveTo: noop, lineTo: noop, quadraticCurveTo: noop, bezierCurveTo: noop,
    rect: noop, clip: noop,
    fillText: jest.fn(), strokeText: noop,
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    createRadialGradient: () => ({ addColorStop: noop }),
    fillStyle: '', strokeStyle: '', lineWidth: 1, lineJoin: '', lineCap: '',
    shadowBlur: 0, shadowColor: '', shadowOffsetX: 0, shadowOffsetY: 0,
    font: '', textAlign: '', textBaseline: '', globalAlpha: 1,
    globalCompositeOperation: 'source-over',
  };
}
global.makeCtxStub = makeCtxStub;
