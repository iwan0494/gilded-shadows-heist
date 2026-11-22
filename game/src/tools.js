// GILDED SHADOWS — the thief's tools, each with a price: pebbles are few,
// smoke is fewer, and a lockpick is slow and can rattle.

import { TUNING } from './config.js';

export function makeTools() {
  return {
    pebbles: TUNING.pebblesStart,
    smoke: TUNING.smokeStart,
    // A pebble in flight, or one that has landed and is ringing.
    pebble: null, // {x, y, tx, ty, t, landed, ring}
    smokes: [], // {x, y, left}
    lockpick: 0, // 0..1 progress on the case in front of the thief
    lockTarget: null,
    rattle: 0, // seconds of lockpick noise still ringing
  };
}

// Throw a pebble toward a point. Returns false when none are left.
export function throwPebble(tools, fromX, fromY, toX, toY) {
  if (tools.pebbles <= 0 || tools.pebble) return false;
  tools.pebbles -= 1;
  tools.pebble = { sx: fromX, sy: fromY, x: fromX, y: fromY, tx: toX, ty: toY, t: 0, landed: false, ring: 0 };
  return true;
}

// Drop a smoke pellet at the thief's feet. Returns false when none are left.
export function dropSmoke(tools, x, y) {
  if (tools.smoke <= 0) return false;
  tools.smoke -= 1;
  tools.smokes.push({ x, y, left: TUNING.smokeSeconds });
  return true;
}

// Is the thief standing inside a smoke cloud right now?
export function inSmoke(tools, x, y) {
  return tools.smokes.some((s) => (x - s.x) ** 2 + (y - s.y) ** 2 < TUNING.smokeRadius ** 2);
}

// A smoke cloud between two points blocks sight through it.
export function smokeBlocks(tools, x1, y1, x2, y2) {
  for (const s of tools.smokes) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((s.x - x1) * dx + (s.y - y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    if ((cx - s.x) ** 2 + (cy - s.y) ** 2 < TUNING.smokeRadius ** 2) return true;
  }
  return false;
}

export function updateTools(tools, dt, rng) {
  if (tools.pebble) {
    const p = tools.pebble;
    if (!p.landed) {
      p.t += dt * 2.2;
      if (p.t >= 1) {
        p.landed = true;
        p.x = p.tx;
        p.y = p.ty;
        p.ring = 1;
      } else {
        p.x = p.sx + (p.tx - p.sx) * p.t;
        p.y = p.sy + (p.ty - p.sy) * p.t;
      }
    } else {
      p.ring += dt * 2.4;
      if (p.ring > 1.6) tools.pebble = null;
    }
  }
  for (const s of tools.smokes) s.left -= dt;
  tools.smokes = tools.smokes.filter((s) => s.left > 0);
  if (tools.rattle > 0) tools.rattle -= dt;
  // A lockpick in progress sometimes rattles the case.
  if (tools.lockTarget && rng() < TUNING.rattleChance * dt * 2) {
    tools.rattle = 0.9;
  }
}

// Where the pebble's noise is ringing right now, if anywhere.
export function pebbleNoise(tools) {
  if (tools.pebble && tools.pebble.landed) {
    return { x: tools.pebble.x, y: tools.pebble.y, r: TUNING.pebbleNoiseRadius };
  }
  return null;
}
