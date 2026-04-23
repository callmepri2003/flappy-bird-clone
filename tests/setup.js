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
  pipe: '#73bf2e', pipeDark: '#5a9922', pipeBorder: '#4a8a1a',
  bird: '#f7d358', birdWing: '#e8c000', birdEye: '#ffffff',
  birdPupil: '#333333', birdBeak: '#f0a030',
  score: '#ffffff', shadow: 'rgba(0,0,0,0.3)',
};
global.STATES = { MENU: 'menu', PLAYING: 'playing', DEAD: 'dead' };

// Minimal canvas 2D context stub so rendering code doesn't throw in Node
function makeCtxStub() {
  const noop = () => {};
  const stub = {
    save: noop, restore: noop, translate: noop, rotate: noop,
    scale: noop, beginPath: noop, closePath: noop, fill: noop, stroke: noop,
    fillRect: noop, clearRect: noop, arc: noop, ellipse: noop,
    moveTo: noop, lineTo: noop, fillText: noop, strokeText: noop,
    measureText: () => ({ width: 0 }),
    createLinearGradient: () => ({ addColorStop: noop }),
    fillStyle: '', strokeStyle: '', lineWidth: 1,
    shadowBlur: 0, shadowColor: '', font: '', textAlign: '',
    textBaseline: '', globalAlpha: 1,
  };
  return stub;
}
global.makeCtxStub = makeCtxStub;
