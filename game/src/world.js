// GILDED SHADOWS — the museum. One job: the three rooms, furnished.
// Coordinates are playfield-local (0..1014, 0..596). Walls block movement;
// sight blockers (statues, pedestals, wall segments) also block vision cones.
import { mulberry32 } from './random.js';

function wall(x, y, w, h, sight = true) {
  return { x, y, w, h, sight };
}
function painting(x, y, w, h, title, art) {
  return { x, y, w, h, title, art };
}
function guardDef(name, short, role, waypoints, wait, speed) {
  return { name, short, role, waypoints, wait, speed };
}

export function buildRooms() {
  const rng = mulberry32(20261122);
  void rng;

  const atrium = {
    name: 'The Marble Atrium',
    sub: 'Wide patrols, long pauses, generous gaps — read the room first',
    carpet: { x: 460, y: 120, w: 94, h: 420 },
    exitPad: { x: 460, y: 540, w: 94, h: 44 },
    doorNorth: { x: 470, y: 0, w: 74, h: 10 },
    doorSouth: null,
    walls: [
      wall(180, 330, 120, 14, false), // low bench, blocks feet not sight
      wall(714, 330, 120, 14, false),
      wall(430, 120, 30, 60), // plinth under the north wall
      wall(554, 120, 30, 60),
    ],
    paintings: [
      painting(110, 20, 116, 72, 'Sunflowers at Dusk', 'sunflower'),
      painting(449, 20, 116, 72, 'The Duchess', 'portrait'),
      painting(788, 20, 116, 72, 'Harbor in Gold', 'landscape'),
      painting(940, 220, 62, 96, 'Abstract No. 9', 'abstract'),
    ],
    cases: [
      { x: 36, y: 260, w: 56, h: 52, loot: 'scarab' },
    ],
    statues: [
      { x: 250, y: 180, r: 26, kind: 'bust' },
      { x: 764, y: 180, r: 26, kind: 'horse' },
    ],
    plants: [
      { x: 60, y: 60 }, { x: 954, y: 60 }, { x: 60, y: 536 }, { x: 954, y: 536 },
    ],
    lamps: [
      { x: 300, y: 90, r: 95 }, { x: 714, y: 90, r: 95 }, { x: 507, y: 420, r: 85 },
    ],
    shadows: [
      { x: 30, y: 430, w: 170, h: 130 },
      { x: 820, y: 60, w: 164, h: 120 },
    ],
    loot: [
      { id: 'scarab', x: 64, y: 286, locked: true },
    ],
    guards: [
      guardDef('SGT. MARLOW', 'MARLOW', 'Atrium patrol', [{ x: 300, y: 300 }, { x: 714, y: 300 }], 2.5, 46),
      guardDef('NIGHT WATCHMAN KELL', 'KELL', 'East corridor', [{ x: 880, y: 120 }, { x: 880, y: 480 }], 2.0, 55),
    ],
    cameras: [
      { x: 968, y: 70, base: -2.4, sweep: 0.9, speed: 0.5 },
    ],
    lasers: [],
    pedestal: null,
    playerStart: { x: 507, y: 500 },
  };

  const gallery = {
    name: 'The Gilded Gallery',
    sub: 'Officer Dara walks the long rectangle — time the corners',
    carpet: { x: 120, y: 270, w: 774, h: 56 },
    exitPad: null,
    doorNorth: { x: 470, y: 0, w: 74, h: 10 },
    doorSouth: { x: 470, y: 586, w: 74, h: 10 },
    walls: [
      wall(400, 130, 214, 14, false),
      wall(400, 452, 214, 14, false),
    ],
    paintings: [
      painting(180, 20, 116, 72, 'The Red Room', 'abstract'),
      painting(718, 20, 116, 72, 'Two Sailors', 'portrait'),
      painting(180, 512, 116, 72, 'Winter Field', 'landscape'),
      painting(718, 512, 116, 72, 'Lemons', 'still'),
    ],
    cases: [
      { x: 60, y: 140, w: 56, h: 52, loot: 'idol' },
      { x: 898, y: 400, w: 56, h: 52, loot: 'crown' },
    ],
    statues: [
      { x: 507, y: 140, r: 26, kind: 'bust' },
      { x: 507, y: 450, r: 26, kind: 'horse' },
    ],
    plants: [
      { x: 60, y: 520 }, { x: 954, y: 80 },
    ],
    lamps: [
      { x: 250, y: 300, r: 85 }, { x: 764, y: 300, r: 85 },
    ],
    shadows: [
      { x: 30, y: 60, w: 160, h: 110 },
      { x: 830, y: 430, w: 154, h: 120 },
    ],
    loot: [
      { id: 'idol', x: 88, y: 166, locked: true },
      { id: 'crown', x: 926, y: 426, locked: true },
    ],
    guards: [
      guardDef('OFFICER DARA', 'DARA', 'Gallery rectangle', [
        { x: 200, y: 150 }, { x: 814, y: 150 }, { x: 814, y: 450 }, { x: 200, y: 450 },
      ], 1.8, 62),
    ],
    cameras: [
      { x: 46, y: 70, base: -1.2, sweep: 0.8, speed: 0.6 },
    ],
    lasers: [],
    pedestal: null,
    playerStart: { x: 507, y: 540 },
  };

  const vault = {
    name: 'The Vault Below',
    sub: 'The Sunflower bobs in gold light, ringed by red lasers',
    carpet: { x: 460, y: 400, w: 94, h: 140 },
    exitPad: null,
    doorNorth: null,
    doorSouth: { x: 470, y: 586, w: 74, h: 10 },
    walls: [
      wall(180, 300, 90, 14, false),
      wall(744, 300, 90, 14, false),
    ],
    paintings: [
      painting(120, 12, 116, 72, 'Night Watch, Study', 'portrait'),
      painting(778, 12, 116, 72, 'Gold Leaf', 'abstract'),
    ],
    cases: [
      { x: 898, y: 250, w: 56, h: 52, loot: 'sapphires' },
      { x: 36, y: 150, w: 56, h: 52, loot: null, gem: '#e8e0c8' },
      { x: 928, y: 100, w: 56, h: 52, loot: null, gem: '#8a7f6a' },
    ],
    statues: [
      { x: 300, y: 150, r: 26, kind: 'bust' },
      { x: 714, y: 150, r: 26, kind: 'horse' },
      { x: 300, y: 440, r: 26, kind: 'bust' },
      { x: 714, y: 440, r: 26, kind: 'horse' },
    ],
    plants: [
      { x: 60, y: 60 }, { x: 954, y: 536 },
    ],
    lamps: [
      { x: 507, y: 90, r: 95 },
      { x: 250, y: 470, r: 85 },
      { x: 764, y: 470, r: 85 },
    ],
    shadows: [
      { x: 30, y: 430, w: 170, h: 130 },
      { x: 820, y: 60, w: 164, h: 120 },
    ],
    loot: [
      { id: 'sunflower', x: 507, y: 280, locked: true, pedestal: true },
      { id: 'sapphires', x: 926, y: 276, locked: true },
    ],
    guards: [
      guardDef('CURATOR VOSS', 'VOSS', 'Vault circuit', [
        { x: 350, y: 150 }, { x: 664, y: 150 }, { x: 664, y: 420 }, { x: 350, y: 420 },
      ], 1.5, 68),
    ],
    cameras: [
      { x: 60, y: 70, base: -1.0, sweep: 0.9, speed: 0.7 },
      { x: 954, y: 520, base: 2.2, sweep: 0.9, speed: 0.55 },
    ],
    lasers: [
      { x1: 420, y1: 200, x2: 594, y2: 200 },
      { x1: 594, y1: 200, x2: 594, y2: 360 },
      { x1: 594, y1: 360, x2: 420, y2: 360 },
      { x1: 420, y1: 360, x2: 420, y2: 200 },
    ],
    pedestal: { x: 507, y: 280 },
    playerStart: { x: 507, y: 540 },
  };

  return [atrium, gallery, vault];
}

// Segment (x1,y1)-(x2,y2) blocked by any sight-blocking rect or statue?
export function sightBlocked(x1, y1, x2, y2, room) {
  for (const w of room.walls) {
    if (!w.sight) continue;
    if (segHitsRect(x1, y1, x2, y2, w)) return true;
  }
  for (const s of room.statues) {
    if (segHitsCircle(x1, y1, x2, y2, s.x, s.y, s.r)) return true;
  }
  return false;
}

export function segHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1, dy = y2 - y1;
  let t0 = 0, t1 = 1;
  const axes = [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]];
  for (const [p, q] of axes) {
    if (p === 0) { if (q < 0) return false; continue; }
    const t = q / p;
    if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
    else { if (t < t0) return false; if (t < t1) t1 = t; }
  }
  return true;
}

export function segHitsCircle(x1, y1, x2, y2, cx, cy, r) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((cx - x1) * dx + (cy - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const px = x1 + t * dx, py = y1 + t * dy;
  return (px - cx) * (px - cx) + (py - cy) * (py - cy) < r * r;
}

export function pointInShadow(x, y, room) {
  return room.shadows.some((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h);
}

export function pointOnCarpet(x, y, room) {
  const c = room.carpet;
  return x >= c.x && x <= c.x + c.w && y >= c.y && y <= c.y + c.h;
}
