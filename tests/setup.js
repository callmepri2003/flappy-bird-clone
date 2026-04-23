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
  // Sky
  skyTop: '#1a1040', skyViolet: '#2d2060', skyRose: '#7b4f7a',
  skyCoral: '#c4715a', skyAmber: '#e8973a', skyGold: '#f5c96a',
  skyHorizon: '#fde8a0',
  // Ground
  groundGrass: '#4a7c3f', groundTransition1: '#3d6b34',
  groundTransition2: '#8b6340', groundDirt: '#7a5535',
  groundDark: '#5c3d22', groundRoot: '#3a2410',
  // Parallax layers
  islandFar: '#2a1f4a', islandFarDark: '#1a1232',
  treeCanopy: '#1e1535', treeCanopyLight: '#2e2252',
  treeTrunk: '#150f28', vegRock: '#0f0b1e', vegPlant: '#13102a',
  // Pipe
  pipeDark: '#0a0010', pipeViolet: '#1a0030', pipeMid: '#2d0055',
  pipeCenter: '#3d006e', pipeCapEdge: '#0d0018', pipeCapDark: '#280050',
  pipeCapViolet: '#4a0090', pipeCapBright: '#6600cc', pipeCapRim: '#cc00ff',
  pipeNeon: 'rgba(255,0,204,0.12)', pipeNeon2: 'rgba(255,0,204,0.06)',
  pipeLeftHighlight: 'rgba(160,80,255,0.3)', pipeShadow: 'rgba(0,0,0,0.55)',
  // Bird
  birdCore: '#ffe8ff', birdBody: '#ff6ef7', birdMid: '#c732e8',
  birdShadow: '#6a1080', birdWing: '#e040fb',
  birdEyeGlow: 'rgba(255,120,255,0.25)', birdSclera: '#f5eeff',
  birdIrisOuter: '#00e5ff', birdIrisMid: '#0077aa', birdIrisInner: '#003344',
  birdPupil: '#000d14', birdBeakLight: '#ff9f40', birdBeakDark: '#b35a00',
  birdBeakStroke: '#7a3a00',
  // UI
  uiAmberGold: '#FFD166', uiTeal: '#06D6A0', uiCoral: '#EF476F',
  uiLavender: '#8B9FE8', uiNavy: '#0D1B2A', uiCream: '#F8F4E3',
  // Misc
  shadow: 'rgba(0,0,0,0.3)', score: '#F8F4E3',
};
global.STATES = { MENU: 'menu', READY: 'ready', PLAYING: 'playing', DEAD: 'dead' };

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
    clip: noop, rect: noop,
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
