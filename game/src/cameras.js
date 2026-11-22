// GILDED SHADOWS — wall cameras. One job: sweep a see-through 60° cone and
// raise the alarm when the thief is caught in it, lit, and in line of sight.
import { sightBlocked, pointInShadow } from './world.js';

export function makeCamera(def) {
  return {
    x: def.x, y: def.y,
    base: def.base, sweep: def.sweep, speed: def.speed,
    angle: def.base,
    blind: 0,
    spotted: false,
  };
}

export function updateCamera(cam, dt, state, room) {
  cam.angle = cam.base + cam.sweep * Math.sin(state.time * cam.speed);
  cam.spotted = false;
  if (cam.blind > 0) {
    cam.blind = Math.max(0, cam.blind - dt);
    return;
  }
  const p = state.player;
  const dx = p.x - cam.x, dy = p.y - cam.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 270) return;
  let diff = Math.atan2(dy, dx) - cam.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > Math.PI / 6) return; // 60° cone
  if (sightBlocked(cam.x, cam.y, p.x, p.y, room)) return;
  if (state.smokes.some((s) => {
    const ddx = p.x - s.x, ddy = p.y - s.y;
    return ddx * ddx + ddy * ddy < s.r * s.r;
  })) return;
  const lit = pointInShadow(p.x, p.y, room) ? 0.5 : 1;
  if (lit <= 0) return;
  cam.spotted = true;
  state.alarm = Math.min(100, state.alarm + 22 * lit * dt);
}
