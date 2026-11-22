// cameras.js — wall cameras: a 60° translucent sweep that raises the alarm.
// Smoke blinds them (grey BLIND state) until the cloud clears.
import { losClear } from './guards.js';

export function makeCamera(x, y, base, sweep, speed) {
  return { x, y, base, angle: base, sweep, speed, blind: 0, phase: 0 };
}

export function updateCamera(c, dt) {
  c.phase += dt * c.speed;
  c.angle = c.base + Math.sin(c.phase) * c.sweep;
  if (c.blind > 0) c.blind -= dt;
}

export function cameraSees(c, px, py, blockers) {
  if (c.blind > 0) return false;
  const dx = px - c.x, dy = py - c.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 300) return false;
  let off = Math.atan2(dy, dx) - c.angle;
  while (off > Math.PI) off -= Math.PI * 2;
  while (off < -Math.PI) off += Math.PI * 2;
  if (Math.abs(off) > Math.PI / 6) return false; // 60° cone
  return losClear(c.x, c.y, px, py, blockers);
}
