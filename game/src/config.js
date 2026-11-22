// GILDED SHADOWS — constants: layout, palettes, crew, loot, mission rules.
// One job: every number the rest of the game agrees on lives here.
export const W = 1280;
export const H = 720;
export const TOP = 56; // top bar height
export const PLAY = { x: 8, y: 64, w: 1014, h: 596 }; // playfield (local coords 0..1014, 0..596)
export const PANEL = { x: 1030, y: 64, w: 242, h: 596 }; // right HUD panel
export const DIALOG = { x: 8, y: 664, w: 1264, h: 48 }; // Wren radio strip

// Stealth palette (deep navy + warm gold). Alarm flips the room red (see render).
export const C = {
  bg: '#0b1220',
  panel: '#101a2e',
  panelEdge: '#2a3a58',
  gold: '#d8a94e',
  goldDim: '#9a7a35',
  teal: '#3fb8a6',
  red: '#d64541',
  amber: '#e8a33d',
  ink: '#e8e2d2',
  dim: '#8b96ab',
  floorA: '#1b2639',
  floorB: '#151f30',
  carpet: '#7e1f2a',
  carpetEdge: '#d8a94e',
  shadow: '#0a0f1c',
  smoke: '#9aa3b2',
};

export const CREW = [
  { name: 'SABLE', role: 'infiltrator — you', note: 'On the floor. Hood up, hands steady.' },
  { name: 'WREN', role: 'handler — radio', note: 'In your ear. Sees the whole museum.' },
  { name: 'JINX', role: 'getaway driver', note: 'Outside, engine running. Do not keep her waiting.' },
];

export const LOOT = [
  { id: 'sunflower', name: 'The Midnight Sunflower', value: 500000, room: 2 },
  { id: 'scarab', name: 'Emerald Scarab', value: 120000, room: 0 },
  { id: 'idol', name: 'Ruby Idol', value: 180000, room: 1 },
  { id: 'crown', name: 'The Brass Crown', value: 250000, room: 1 },
  { id: 'sapphires', name: 'Vault Sapphires', value: 150000, room: 2 },
];
export const LOOT_TOTAL = LOOT.reduce((s, l) => s + l.value, 0); // 1,200,000

export const DAWN_LIMIT = 300; // 5:00 mission countdown, seconds
export const PEBBLES = 4;
export const SMOKES = 2;
export const GUARD_TOUCH = 20; // guard catches you inside this distance
export const PLAYER_R = 12;
