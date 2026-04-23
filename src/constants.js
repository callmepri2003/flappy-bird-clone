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
  // Sky
  skyTop: '#1a1040',
  skyViolet: '#2d2060',
  skyRose: '#7b4f7a',
  skyCoral: '#c4715a',
  skyAmber: '#e8973a',
  skyGold: '#f5c96a',
  skyHorizon: '#fde8a0',
  // Ground
  groundGrass: '#4a7c3f',
  groundTransition1: '#3d6b34',
  groundTransition2: '#8b6340',
  groundDirt: '#7a5535',
  groundDark: '#5c3d22',
  groundRoot: '#3a2410',
  // Parallax layers
  islandFar: '#2a1f4a',
  islandFarDark: '#1a1232',
  treeCanopy: '#1e1535',
  treeCanopyLight: '#2e2252',
  treeTrunk: '#150f28',
  vegRock: '#0f0b1e',
  vegPlant: '#13102a',
  // Pipe (used by pipes.js — export here so all modules share)
  pipeDark: '#0a0010',
  pipeViolet: '#1a0030',
  pipeMid: '#2d0055',
  pipeCenter: '#3d006e',
  pipeCapEdge: '#0d0018',
  pipeCapDark: '#280050',
  pipeCapViolet: '#4a0090',
  pipeCapBright: '#6600cc',
  pipeCapRim: '#cc00ff',
  pipeNeon: 'rgba(255,0,204,0.12)',
  pipeNeon2: 'rgba(255,0,204,0.06)',
  pipeLeftHighlight: 'rgba(160,80,255,0.3)',
  pipeShadow: 'rgba(0,0,0,0.55)',
  // Bird (used by bird.js)
  birdCore: '#ffe8ff',
  birdBody: '#ff6ef7',
  birdMid: '#c732e8',
  birdShadow: '#6a1080',
  birdWing: '#e040fb',
  birdEyeGlow: 'rgba(255,120,255,0.25)',
  birdSclera: '#f5eeff',
  birdIrisOuter: '#00e5ff',
  birdIrisMid: '#0077aa',
  birdIrisInner: '#003344',
  birdPupil: '#000d14',
  birdBeakLight: '#ff9f40',
  birdBeakDark: '#b35a00',
  birdBeakStroke: '#7a3a00',
  // UI
  uiAmberGold: '#FFD166',
  uiTeal: '#06D6A0',
  uiCoral: '#EF476F',
  uiLavender: '#8B9FE8',
  uiNavy: '#0D1B2A',
  uiCream: '#F8F4E3',
  // Particles / misc
  shadow: 'rgba(0,0,0,0.3)',
  score: '#F8F4E3',
};

const STATES = {
  MENU: 'menu',
  READY: 'ready',
  PLAYING: 'playing',
  DEAD: 'dead',
};
