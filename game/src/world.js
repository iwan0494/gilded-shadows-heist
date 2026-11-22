// world.js — the three museum rooms: furniture, loot, doors, guards, cameras.
// Every room fills the same play area; doors move the thief between rooms.
import { PLAY, GUARDS } from './config.js';
import { makeGuard } from './guards.js';
import { makeCamera } from './cameras.js';

function roomBase(id, name, label, seed) {
  return {
    id, name, label, seed,
    paintings: [], cases: [], statues: [], plants: [],
    carpet: null, lights: [], shadows: [], doors: [],
    exit: null, pedestal: null, lasers: [],
    guards: [], cameras: [],
    entryNorth: { x: 520, y: 150 }, entrySouth: { x: 520, y: 560 },
  };
}

export function buildRoom(id) {
  if (id === 'atrium') return buildAtrium();
  if (id === 'gallery') return buildGallery();
  return buildVault();
}

function buildAtrium() {
  const r = roomBase('atrium', 'The Marble Atrium', 'THE MARBLE ATRIUM', 11);
  r.paintings = [
    { x: 60, y: 86, w: 150, h: 92, title: 'Sunflowers at Dusk', kind: 'sunflower' },
    { x: 441, y: 86, w: 150, h: 92, title: 'The Duchess', kind: 'portrait' },
    { x: 822, y: 86, w: 150, h: 92, title: 'Harbor in Gold', kind: 'landscape' },
  ];
  r.carpet = { x: 486, y: 100, w: 88, h: 520 };
  r.statues = [{ x: 300, y: 300, r: 17 }, { x: 740, y: 300, r: 17 }];
  r.plants = [{ x: 56, y: 580 }, { x: 976, y: 580 }];
  r.cases = [
    { x: 70, y: 320, w: 92, h: 112, lootId: 'scarab', label: 'Emerald Scarab', empty: false },
    { x: 878, y: 320, w: 92, h: 112, lootId: null, label: 'On loan', empty: true },
  ];
  r.lights = [{ x: 520, y: 200, r: 130 }, { x: 520, y: 480, r: 130 }];
  r.shadows = [{ x: 8, y: 480, w: 180, h: 168, label: 'SHADOW' }];
  r.doors = [
    // Door label well inside the play area (y 210), below the paintings.
    { x: 470, y: 72, w: 120, h: 16, label: 'GALLERY ↑', labelY: 210, to: 'gallery' },
  ];
  r.exit = { x: 470, y: 566, w: 120, h: 62, open: false };
  r.guards = [
    makeGuard(GUARDS.marlow, [[220, 170], [820, 170], [820, 470], [220, 470]]),
    makeGuard(GUARDS.kell, [[940, 150], [940, 530]]),
  ];
  r.cameras = [makeCamera(950, 230, Math.PI, 0.7, 0.5)]; // clear of the paintings
  return r;
}

function buildGallery() {
  const r = roomBase('gallery', 'The Gilded Gallery', 'THE GILDED GALLERY', 23);
  r.paintings = [
    { x: 60, y: 86, w: 150, h: 92, title: 'The Duchess', kind: 'portrait' },
    { x: 280, y: 86, w: 150, h: 92, title: 'Still Life, Pears', kind: 'still' },
    { x: 500, y: 86, w: 150, h: 92, title: 'Harbor in Gold', kind: 'landscape' },
    { x: 720, y: 86, w: 150, h: 92, title: 'Abstract No. 9', kind: 'abstract' },
  ];
  r.carpet = { x: 96, y: 300, w: 848, h: 84 };
  r.statues = [{ x: 520, y: 190, r: 17 }, { x: 520, y: 480, r: 17 }];
  r.plants = [{ x: 56, y: 580 }, { x: 976, y: 580 }];
  r.cases = [
    { x: 300, y: 300, w: 92, h: 112, lootId: 'idol', label: 'Ruby Idol', empty: false },
    { x: 700, y: 300, w: 92, h: 112, lootId: 'crown', label: 'The Brass Crown', empty: false },
  ];
  r.lights = [{ x: 300, y: 200, r: 110 }, { x: 740, y: 200, r: 110 }, { x: 520, y: 470, r: 110 }];
  r.shadows = [{ x: 8, y: 480, w: 180, h: 168, label: 'SHADOW' }];
  r.doors = [
    { x: 470, y: 72, w: 120, h: 16, label: 'VAULT ↓', labelY: 250, to: 'vault' },
    { x: 470, y: 632, w: 120, h: 16, label: 'ATRIUM ↓', labelY: PLAY.y + PLAY.h - 34, to: 'atrium' },
  ];
  r.guards = [
    makeGuard(GUARDS.dara, [[220, 180], [820, 180], [820, 460], [220, 460]]),
    makeGuard(GUARDS.kell, [[120, 150], [120, 530]]),
  ];
  r.cameras = [makeCamera(82, 230, 0, 0.7, 0.45)]; // clear of the paintings
  return r;
}

function buildVault() {
  const r = roomBase('vault', 'The Vault Below', 'THE VAULT BELOW', 37);
  r.paintings = [
    { x: 60, y: 86, w: 150, h: 92, title: 'Midnight Study', kind: 'portrait' },
    { x: 822, y: 86, w: 150, h: 92, title: 'Gold Leaf', kind: 'abstract' },
  ];
  r.pedestal = { x: 520, y: 330 };
  // Laser square around the pedestal; the south edge has a 64px gap — the safe way in.
  r.lasers = [
    { x1: 420, y1: 230, x2: 620, y2: 230, live: true },
    { x1: 420, y1: 230, x2: 420, y2: 430, live: true },
    { x1: 620, y1: 230, x2: 620, y2: 430, live: true },
    { x1: 420, y1: 430, x2: 488, y2: 430, live: true },
    { x1: 552, y1: 430, x2: 620, y2: 430, live: true },
  ];
  r.statues = [
    { x: 300, y: 180, r: 17 },
    { x: 740, y: 180, r: 17 },
    { x: 520, y: 566, r: 17 }, // R3: bottom of the vault is furnished, not empty
  ];
  r.plants = [{ x: 120, y: 566 }, { x: 920, y: 566 }];
  r.cases = [
    { x: 878, y: 300, w: 92, h: 112, lootId: 'sapphires', label: 'Vault Sapphires', empty: false },
    // R3: two decorative cases fill the lower vault.
    { x: 280, y: 520, w: 92, h: 100, lootId: null, label: 'Jade Vase', empty: true },
    { x: 660, y: 520, w: 92, h: 100, lootId: null, label: 'Ivory Fan', empty: true },
  ];
  r.lights = [
    { x: 300, y: 180, r: 90 }, { x: 740, y: 180, r: 90 },
    { x: 520, y: 540, r: 100 }, // R3: warm pool over the lower vault
  ];
  r.shadows = [{ x: 8, y: 480, w: 180, h: 168, label: 'SHADOW' }];
  r.doors = [
    // R3 fix #2: the back label sits well inside the play area (y 608, 40px above the edge).
    { x: 470, y: 632, w: 120, h: 16, label: '↓ BACK TO GALLERY', labelY: PLAY.y + PLAY.h - 40, to: 'gallery' },
  ];
  r.guards = [
    makeGuard(GUARDS.voss, [[300, 180], [740, 180], [740, 520], [300, 520]]),
    makeGuard(GUARDS.kell, [[200, 600], [840, 600]]),
  ];
  r.cameras = [makeCamera(64, 230, 0, 0.7, 0.5)]; // clear of the paintings
  return r;
}

// Circle blockers for line of sight: statues and the vault pedestal.
export function losBlockers(room) {
  const circles = room.statues.map((s) => ({ x: s.x, y: s.y, r: s.r + 2 }));
  if (room.pedestal) circles.push({ x: room.pedestal.x, y: room.pedestal.y, r: 36 });
  return { circles, rects: [] };
}
