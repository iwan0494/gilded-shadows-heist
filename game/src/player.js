// GILDED SHADOWS — the thief: movement, sneaking, noise, and the
// hold-to-steal interactions (cutting the painting down, picking a case).

import { TUNING } from './config.js';
import { resolveCollisions, inShadow, onCarpet, pointInRect } from './world.js';

export function makePlayer(x, y) {
  return {
    x,
    y,
    r: TUNING.playerRadius,
    dir: -Math.PI / 2,
    sneaking: false,
    moving: false,
    running: false,
    noise: 0, // 0..1, how loud the last step was
    noisePulse: 0, // expanding ring timer after a loud step
    interact: null, // loot currently being stolen {loot, progress, needed}
    spotted: false, // ever seen this run (for the GHOST rating)
  };
}

// Nearest loot the thief can reach (within 46px), if any.
export function nearLoot(player, room) {
  let best = null;
  let bestD = 46;
  for (const l of room.loot) {
    if (l.taken) continue;
    const d = Math.hypot(l.x - player.x, l.y - player.y);
    if (d < bestD) {
      bestD = d;
      best = l;
    }
  }
  return best;
}

export function updatePlayer(p, dt, input, room, tools) {
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(mx, my);
  p.moving = len > 0;
  p.sneaking = !!input.sneak;
  p.running = p.moving && !p.sneaking;

  if (len > 0) {
    mx /= len;
    my /= len;
    // SHIFT is sneak; plain movement is a brisk walk. There is no sprint
    // key: running on carpet is loud, so speed stays a quiet choice.
    const v = p.sneaking ? TUNING.playerSneak : TUNING.playerWalk;
    p.x += mx * v * dt;
    p.y += my * v * dt;
    p.dir = Math.atan2(my, mx);
  }
  resolveCollisions(p, room);

  // Noise: running on carpet rings out; sneaking on marble is silent.
  const carpet = onCarpet(p.x, p.y, room);
  const target = !p.moving ? 0 : p.sneaking ? 0.08 : carpet ? 1 : 0.35;
  p.noise += (target - p.noise) * Math.min(1, dt * 8);
  if (p.noise > 0.6 && p.moving) {
    p.noisePulse += dt;
    if (p.noisePulse > 0.5) p.noisePulse = 0;
  } else {
    p.noisePulse = 0;
  }

  // Hold-E stealing: the painting comes off the wall, a case picks open.
  const loot = nearLoot(p, room);
  if (input.interact && loot) {
    const needed = loot.kind === 'painting' ? TUNING.paintingSeconds : TUNING.lockpickSeconds;
    if (!p.interact || p.interact.loot !== loot) {
      p.interact = { loot, progress: 0, needed };
    }
    p.interact.progress += dt / needed;
    tools.lockTarget = loot.locked ? loot : null;
    tools.lockpick = p.interact.progress;
    if (p.interact.progress >= 1) {
      loot.taken = true;
      p.interact = null;
      tools.lockTarget = null;
      tools.lockpick = 0;
      return loot;
    }
  } else {
    if (p.interact) p.interact.progress = Math.max(0, p.interact.progress - dt * 0.8);
    if (!p.interact || p.interact.progress <= 0) p.interact = null;
    tools.lockTarget = null;
    tools.lockpick = 0;
  }
  return null;
}

// True when the thief stands in a doorway (or the exit) of this room.
export function atDoor(p, room) {
  if (room.door && pointInRect(p.x, p.y, room.door)) return 'door';
  if (room.exit && pointInRect(p.x, p.y, room.exit)) return 'exit';
  return null;
}

export function playerInShadow(p, room) {
  return inShadow(p.x, p.y, room);
}
