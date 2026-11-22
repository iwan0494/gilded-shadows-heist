// GILDED SHADOWS — tuning numbers and the night-museum palette.
// One place for every magic number the rest of the game reads.

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

// Playfield (the museum floor) in canvas pixels; the right panel and the
// top/bottom bars frame it.
export const FIELD = { x: 16, y: 76, w: 1018, h: 592 };
export const PANEL = { x: 1042, y: 8, w: 222, h: 704 };
export const TOPBAR = { x: 16, y: 8, w: 1018, h: 60 };
export const BOTBAR = { x: 16, y: 676, w: 1018, h: 36 };

export const PALETTE = {
  bg: '#0c0a12',
  floor: '#2a2733',
  floorAlt: '#26222e',
  marble: '#b8b2a4',
  marbleLine: '#8f887a',
  carpet: '#7a1f2b',
  carpetEdge: '#a83240',
  shadow: '#14101f',
  wall: '#4a4238',
  wallTop: '#6b5f4e',
  gold: '#d9a441',
  goldBright: '#f2c14e',
  statue: '#9a938a',
  guard: '#3d4a5c',
  guardAlert: '#a83226',
  coneCalm: 'rgba(217, 164, 65, 0.20)',
  coneSuspicious: 'rgba(232, 120, 40, 0.30)',
  coneAlert: 'rgba(200, 50, 30, 0.35)',
  cameraArc: 'rgba(220, 60, 50, 0.25)',
  cameraBlind: 'rgba(150, 150, 150, 0.18)',
  player: '#1c1a26',
  playerTrim: '#d9a441',
  smoke: 'rgba(200, 200, 210, 0.35)',
  lootGlow: 'rgba(242, 193, 78, 0.55)',
  exitGreen: '#3fae6a',
  text: '#e8e0cf',
  textDim: '#9d968a',
  panel: '#171420',
  panelEdge: '#3a3348',
  alarmQuiet: '#3fae6a',
  alarmMid: '#d9a441',
  alarmHigh: '#c83226',
};

export const TUNING = {
  playerWalk: 150,
  playerSneak: 72,
  playerRun: 205,
  playerRadius: 12,
  guardSpeed: 58,
  guardChase: 128,
  guardRange: 230,
  guardHalfAngle: 0.56, // ~32 degrees each side
  guardTouch: 26,
  cameraRange: 250,
  cameraHalfAngle: 0.42,
  detectRise: 55, // per second, fully lit inside a cone
  detectFall: 30,
  alarmRiseGuard: 26,
  alarmRiseCamera: 20,
  alarmFall: 9,
  shadowRangeFactor: 0.45, // cones reach much less far into shadow
  shadowDetectFactor: 0.45,
  smokeRadius: 95,
  smokeSeconds: 6,
  pebblesStart: 4,
  smokeStart: 2,
  lockpickSeconds: 2.6,
  paintingSeconds: 1.6,
  carpetNoiseRadius: 150,
  pebbleNoiseRadius: 170,
  rattleChance: 0.25,
};
