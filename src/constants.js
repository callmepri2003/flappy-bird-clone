// Game constants shared across all modules
const CANVAS_WIDTH = 480;
const CANVAS_HEIGHT = 640;

const GRAVITY = 0.5;
const FLAP_STRENGTH = -10;
const GAME_SPEED = 3;

const BIRD_X = 80;
const BIRD_WIDTH = 40;
const BIRD_HEIGHT = 30;

const PIPE_WIDTH = 60;
const PIPE_GAP = 160;
const PIPE_SPAWN_INTERVAL = 1800; // ms

const GROUND_HEIGHT = 80;

const COLORS = {
  sky: '#70c5ce',
  skyBottom: '#a8e6cf',
  ground: '#ded895',
  groundDark: '#c8b560',
  pipe: '#73bf2e',
  pipeDark: '#0a0010',
  pipeViolet: '#1a0030',
  pipeMid: '#2d0055',
  pipeCenter: '#3d006e',
  pipeBorder: '#4a8a1a',
  pipeCapEdge: '#0d0018',
  pipeCapDark: '#280050',
  pipeCapViolet: '#4a0090',
  pipeCapBright: '#6600cc',
  pipeCapRim: '#cc00ff',
  pipeNeon: 'rgba(255,0,204,0.12)',
  pipeNeon2: 'rgba(255,0,204,0.06)',
  pipeLeftHighlight: 'rgba(160,80,255,0.3)',
  pipeShadow: 'rgba(0,0,0,0.55)',
  bird: '#f7d358',
  birdWing: '#e8c000',
  birdEye: '#ffffff',
  birdPupil: '#333333',
  birdBeak: '#f0a030',
  score: '#ffffff',
  shadow: 'rgba(0,0,0,0.3)',
};

const STATES = {
  MENU: 'menu',
  PLAYING: 'playing',
  DEAD: 'dead',
};
