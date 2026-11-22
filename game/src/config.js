// config.js — layout, palettes, crew, loot and guard definitions.
// All layout numbers live here so render, HUD and staging agree on one canvas.
export const W = 1280;
export const H = 720;
export const TOPBAR_H = 64;
export const PLAY = { x: 8, y: 72, w: 1024, h: 576 }; // play area: y 72..648
export const RIGHT = { x: 1040, y: 72, w: 232, h: 576 };
export const DIALOG = { x: 8, y: 656, w: 1264, h: 56 };
export const MISSION_SECONDS = 300; // DAWN IN 05:00
export const EDGE = 12; // minimum inset for any label from a canvas edge (R3 fix)

// Floor palettes. The alarm palette is deliberately a touch LIGHTER than R2's
// so Sable and the exit pad stay readable when the whole room goes red (R3 fix #4).
export const FLOOR = {
  calm: ['#2e3348', '#272b3d'],
  alarm: ['#4a3a4e', '#3e3244'],
};
export const CARPET = { fill: '#7a1f2b', border: '#c9a24a', diamond: '#c9a24a' };
export const GOLD = '#d9a441';
export const TEAL = '#2ec4b6';
export const INK = '#0e1220';

export const LOOT = [
  { id: 'sunflower', name: 'The Midnight Sunflower', value: 500000 },
  { id: 'scarab', name: 'Emerald Scarab', value: 120000 },
  { id: 'idol', name: 'Ruby Idol', value: 180000 },
  { id: 'crown', name: 'The Brass Crown', value: 250000 },
  { id: 'sapphires', name: 'Vault Sapphires', value: 150000 },
];
export const LOOT_TOTAL = 1200000;

export const CREW = [
  { name: 'SABLE', role: 'infiltrator', you: true, note: 'On the floor. Hood up, hands steady.' },
  { name: 'WREN', role: 'handler', you: false, note: 'In your ear. Sees the whole museum.' },
  { name: 'JINX', role: 'getaway driver', you: false, note: 'Outside, engine running. Do not keep her waiting.' },
];

export const GUARDS = {
  marlow: { id: 'marlow', name: 'SGT. MARLOW', short: 'MARLOW', color: '#e8b64c', speed: 52 },
  dara: { id: 'dara', name: 'OFFICER DARA', short: 'DARA', color: '#7fb3e8', speed: 58 },
  voss: { id: 'voss', name: 'CURATOR VOSS', short: 'VOSS', color: '#e87f7f', speed: 46 },
  kell: { id: 'kell', name: 'NIGHT WATCHMAN KELL', short: 'KELL', color: '#9fd8a4', speed: 64 },
};

export const fmtMoney = (n) => '$' + n.toLocaleString('en-US');
export const fmtClock = (s) => {
  const t = Math.max(0, Math.floor(s));
  return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0');
};
export const alarmWord = (a) => (a >= 70 ? 'ALARMED' : a >= 30 ? 'SUSPICIOUS' : 'QUIET');
export const alarmColor = (a) => (a >= 70 ? '#e5484d' : a >= 30 ? '#e8a13c' : '#2ec4b6');
