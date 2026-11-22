// GILDED SHADOWS — the museum: three rooms, their walls, cover, loot,
// patrols, cameras and doors. All coordinates are field-local: x 0..1018,
// y 0..592 inside the playfield. The renderer adds the field offset.

import { FIELD } from './config.js';

// --- geometry helpers (shared by guards, cameras and the player) ----------

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

function segHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  for (const [p, d, lo, hi] of [
    [x1, dx, r.x, r.x + r.w],
    [y1, dy, r.y, r.y + r.h],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tmin = Math.max(tmin, t1);
      tmax = Math.min(tmax, t2);
      if (tmin > tmax) return false;
    }
  }
  return true;
}

function segHitsCircle(x1, y1, x2, y2, c) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((c.x - x1) * dx + (c.y - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx;
  const cy = y1 + t * dy;
  return (cx - c.x) ** 2 + (cy - c.y) ** 2 < c.r * c.r;
}

// True when a wall or a statue stands between two points.
export function lineBlocked(x1, y1, x2, y2, room) {
  for (const w of room.walls) if (segHitsRect(x1, y1, x2, y2, w)) return true;
  for (const s of room.statues) if (segHitsCircle(x1, y1, x2, y2, s)) return true;
  return false;
}

export function inShadow(x, y, room) {
  return room.shadows.some((s) => pointInRect(x, y, s));
}

export function onCarpet(x, y, room) {
  return room.carpet.some((c) => pointInRect(x, y, c));
}

// Push a circle (player or guard) out of walls, statues and the field edge.
export function resolveCollisions(e, room) {
  e.x = Math.max(e.r, Math.min(FIELD.w - e.r, e.x));
  e.y = Math.max(e.r, Math.min(FIELD.h - e.r, e.y));
  for (const w of room.walls) {
    const cx = Math.max(w.x, Math.min(e.x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(e.y, w.y + w.h));
    const dx = e.x - cx;
    const dy = e.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < e.r * e.r) {
      if (d2 < 0.0001) {
        e.y = w.y - e.r;
      } else {
        const d = Math.sqrt(d2);
        e.x = cx + (dx / d) * e.r;
        e.y = cy + (dy / d) * e.r;
      }
    }
  }
  for (const s of room.statues) {
    const dx = e.x - s.x;
    const dy = e.y - s.y;
    const d = Math.hypot(dx, dy);
    const min = s.r + e.r;
    if (d < min && d > 0.0001) {
      e.x = s.x + (dx / d) * min;
      e.y = s.y + (dy / d) * min;
    }
  }
}

// --- the three rooms -------------------------------------------------------

export const ROOMS = [
  {
    id: 0,
    name: 'The Marble Atrium',
    sub: 'Room 1 of 3 — the Sunflower hangs on the north wall',
    objective: 'Steal The Midnight Sunflower',
    start: { x: 120, y: 520 },
    walls: [
      { x: 180, y: 120, w: 30, h: 200 },
      { x: 808, y: 120, w: 30, h: 200 },
      { x: 430, y: 470, w: 158, h: 24 },
    ],
    statues: [
      { x: 300, y: 300, r: 26 },
      { x: 718, y: 300, r: 26 },
      { x: 509, y: 400, r: 30 },
    ],
    shadows: [
      { x: 60, y: 380, w: 180, h: 160 },
      { x: 790, y: 380, w: 168, h: 160 },
      { x: 60, y: 60, w: 150, h: 110 },
    ],
    carpet: [{ x: 470, y: 60, w: 78, h: 470 }],
    loot: [
      { id: 'sunflower', kind: 'painting', x: 509, y: 52, label: 'The Midnight Sunflower', hold: true, taken: false },
    ],
    guards: [
      { x: 200, y: 150, wps: [[200, 150], [200, 450], [500, 450], [500, 150]], pause: 2, speed: 58 },
      { x: 818, y: 150, wps: [[818, 150], [818, 450], [650, 300]], pause: 1, speed: 58 },
    ],
    cameras: [
      { x: 980, y: 70, base: Math.PI * 0.72, sweep: 0.9, range: 250, speed: 0.55 },
    ],
    door: { x: 850, y: 560, w: 90, h: 32, to: 1 },
    exit: null,
  },
  {
    id: 1,
    name: 'The Gilded Gallery',
    sub: 'Room 2 of 3 — side gallery or service corridor, your pick',
    objective: 'Lift the Emerald Scarab and the Ruby Idol',
    start: { x: 900, y: 520 },
    walls: [
      { x: 300, y: 0, w: 26, h: 260 },
      { x: 690, y: 330, w: 26, h: 262 },
      { x: 480, y: 200, w: 180, h: 24 },
    ],
    statues: [
      { x: 150, y: 300, r: 24 },
      { x: 880, y: 150, r: 24 },
    ],
    shadows: [
      { x: 40, y: 40, w: 170, h: 130 },
      { x: 820, y: 420, w: 158, h: 132 },
      { x: 330, y: 430, w: 300, h: 120 },
    ],
    carpet: [{ x: 60, y: 280, w: 900, h: 44 }],
    loot: [
      { id: 'emerald', kind: 'gem', x: 180, y: 120, label: 'Emerald Scarab', locked: true, taken: false },
      { id: 'ruby', kind: 'gem', x: 880, y: 480, label: 'Ruby Idol', locked: true, taken: false },
    ],
    guards: [
      { x: 350, y: 120, wps: [[350, 120], [350, 480], [650, 480], [650, 120]], pause: 2, speed: 58 },
      { x: 850, y: 120, wps: [[850, 120], [850, 300]], pause: 1, speed: 58 },
    ],
    cameras: [
      { x: 40, y: 296, base: 0, sweep: 0.8, range: 250, speed: 0.6 },
      { x: 978, y: 70, base: 2.4, sweep: 0.7, range: 250, speed: 0.5 },
    ],
    door: { x: 120, y: 560, w: 90, h: 32, to: 2 },
    exit: null,
  },
  {
    id: 2,
    name: 'The Vault Below',
    sub: 'Room 3 of 3 — dark, quiet, and watched from both ends',
    objective: 'Take the Crown and the Vault Sapphires, then run',
    start: { x: 150, y: 520 },
    walls: [
      { x: 250, y: 100, w: 200, h: 30 },
      { x: 570, y: 420, w: 200, h: 30 },
      { x: 450, y: 240, w: 26, h: 160 },
    ],
    statues: [{ x: 509, y: 300, r: 28 }],
    shadows: [
      { x: 40, y: 40, w: 220, h: 200 },
      { x: 760, y: 330, w: 218, h: 222 },
      { x: 380, y: 440, w: 260, h: 120 },
    ],
    carpet: [{ x: 470, y: 60, w: 78, h: 300 }],
    loot: [
      { id: 'crown', kind: 'crown', x: 509, y: 90, label: 'The Gilded Crown', locked: true, taken: false },
      { id: 'sapphires', kind: 'gem', x: 880, y: 120, label: 'Vault Sapphires', locked: true, taken: false },
    ],
    guards: [
      { x: 300, y: 300, wps: [[300, 300], [700, 300]], pause: 1, speed: 62 },
      { x: 509, y: 480, wps: [[509, 480], [509, 180]], pause: 2, speed: 62 },
    ],
    cameras: [
      { x: 40, y: 70, base: 0.6, sweep: 0.9, range: 250, speed: 0.6 },
      { x: 978, y: 520, base: 2.6, sweep: 0.8, range: 250, speed: 0.55 },
    ],
    door: null,
    exit: { x: 880, y: 560, w: 110, h: 32 },
  },
];

export const TOTAL_LOOT = ROOMS.reduce((n, r) => n + r.loot.length, 0);
