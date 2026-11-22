// GILDED SHADOWS — the thief. One job: move, sneak, collide, interact.
// SABLE moves at 150 px/s walking, 75 sneaking. Running on the red carpet
// is loud; sneaking on marble is silent.
import { pointOnCarpet, pointInShadow } from './world.js';
import { PLAYER_R } from './config.js';

export function makePlayer(start) {
  return {
    x: start.x, y: start.y,
    dir: -Math.PI / 2,
    sneak: false,
    running: false,
    moving: false,
    inShadow: false,
    onCarpet: false,
    stepT: 0,
  };
}

function collide(p, room) {
  // Keep inside the playfield.
  p.x = Math.max(PLAYER_R, Math.min(1014 - PLAYER_R, p.x));
  p.y = Math.max(PLAYER_R, Math.min(596 - PLAYER_R, p.y));
  // Push out of sight-blocking walls and statues.
  for (const w of room.walls) {
    const cx = Math.max(w.x, Math.min(p.x, w.x + w.w));
    const cy = Math.max(w.y, Math.min(p.y, w.y + w.h));
    const dx = p.x - cx, dy = p.y - cy;
    const d = Math.hypot(dx, dy);
    if (d < PLAYER_R) {
      if (d === 0) { p.y -= PLAYER_R; continue; }
      p.x = cx + (dx / d) * PLAYER_R;
      p.y = cy + (dy / d) * PLAYER_R;
    }
  }
  for (const s of room.statues) {
    const dx = p.x - s.x, dy = p.y - s.y;
    const d = Math.hypot(dx, dy);
    const min = PLAYER_R + s.r;
    if (d < min && d > 0) {
      p.x = s.x + (dx / d) * min;
      p.y = s.y + (dy / d) * min;
    }
  }
}

export function updatePlayer(dt, state, room, input) {
  const p = state.player;
  let mx = 0, my = 0;
  if (input.keys.has('arrowup') || input.keys.has('w')) my -= 1;
  if (input.keys.has('arrowdown') || input.keys.has('s')) my += 1;
  if (input.keys.has('arrowleft') || input.keys.has('a')) mx -= 1;
  if (input.keys.has('arrowright') || input.keys.has('d')) mx += 1;
  p.sneak = input.keys.has('shift');
  p.moving = mx !== 0 || my !== 0;
  if (p.moving) {
    const len = Math.hypot(mx, my);
    const speed = p.sneak ? 75 : 150;
    p.x += (mx / len) * speed * dt;
    p.y += (my / len) * speed * dt;
    p.dir = Math.atan2(my, mx);
  }
  collide(p, room);
  p.inShadow = pointInShadow(p.x, p.y, room);
  p.onCarpet = pointOnCarpet(p.x, p.y, room);
  p.running = p.moving && !p.sneak;
  // Loud steps on the carpet: a noise pulse while running across it.
  if (p.running && p.onCarpet) {
    p.stepT += dt;
    if (p.stepT > 0.8) {
      p.stepT = 0;
      state.noises.push({ x: p.x, y: p.y, r: 6, maxR: 150, age: 0 });
    }
  } else {
    p.stepT = 0;
  }
}

// Nearest loot the player can take right now (within 34 px, not yet taken).
export function nearLoot(state, room) {
  for (const l of room.loot) {
    if (state.taken[l.id]) continue;
    if (Math.hypot(l.x - state.player.x, l.y - state.player.y) < 40) return l;
  }
  return null;
}

// Is the player standing on a red laser beam while the lasers are live?
export function onLaser(state, room) {
  if (!room.lasers.length || !state.lasersLive) return false;
  const p = state.player;
  for (const b of room.lasers) {
    const dx = b.x2 - b.x1, dy = b.y2 - b.y1;
    const len2 = dx * dx + dy * dy;
    let t = len2 === 0 ? 0 : ((p.x - b.x1) * dx + (p.y - b.y1) * dy) / len2;
    t = Math.max(0, Math.min(1, t));
    const px = b.x1 + t * dx, py = b.y1 + t * dy;
    if (Math.hypot(p.x - px, p.y - py) < 14) return true;
  }
  return false;
}
