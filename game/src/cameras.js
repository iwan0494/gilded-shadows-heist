// GILDED SHADOWS — wall cameras: a red arc that sweeps back and forth.
// A camera that sees the thief raises the alarm; a smoke pellet blinds it
// for a while (its arc turns grey). Cameras never move, only watch.

import { TUNING } from './config.js';
import { lineBlocked, inShadow } from './world.js';

export function makeCamera(def) {
  return {
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    range: def.range ?? TUNING.cameraRange,
    speed: def.speed ?? 0.55,
    phase: 0,
    blindLeft: 0,
    sees: false,
  };
}

// Current sweep angle, oscillating around the base direction.
export function cameraAngle(c, now) {
  return c.base + Math.sin(now * c.speed) * c.sweep;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI;
  return d;
}

export function updateCamera(c, dt, px, py, room, smoked, now) {
  if (c.blindLeft > 0) c.blindLeft -= dt;
  const blind = c.blindLeft > 0 || smoked;
  if (blind) {
    c.sees = false;
    return 0;
  }
  const dx = px - c.x;
  const dy = py - c.y;
  const dist = Math.hypot(dx, dy);
  const range = c.range * (inShadow(px, py, room) ? TUNING.shadowRangeFactor : 1);
  if (dist > range) {
    c.sees = false;
    return 0;
  }
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, cameraAngle(c, now))) > TUNING.cameraHalfAngle) {
    c.sees = false;
    return 0;
  }
  if (lineBlocked(c.x, c.y, px, py, room)) {
    c.sees = false;
    return 0;
  }
  c.sees = true;
  const lit = inShadow(px, py, room) ? TUNING.shadowDetectFactor : 1;
  return (1 - dist / range) * lit;
}
