// GILDED SHADOWS — guards: waypoint patrols, vision cones, and the
// detection meter that decides whether a guard gets curious, suspicious,
// or starts chasing. A guard's cone is raycast: walls and statues block it.

import { TUNING } from './config.js';
import { lineBlocked, inShadow, resolveCollisions } from './world.js';

export function makeGuard(def) {
  return {
    x: def.x,
    y: def.y,
    r: 13,
    wps: def.wps,
    wpIndex: 0,
    pause: def.pause ?? 2,
    pauseLeft: 0,
    speed: def.speed ?? TUNING.guardSpeed,
    dir: -Math.PI / 2,
    state: 'calm', // calm | suspicious | alert
    detect: 0, // 0..100, how sure this guard is that someone is there
    investigate: null, // {x, y} the guard walks to when curious
    lastSeen: null,
    bob: 0,
  };
}

function angleTo(g, x, y) {
  return Math.atan2(y - g.y, x - g.x);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI;
  return d;
}

// Can this guard see the player right now? Returns a 0..1 exposure factor.
export function guardSees(g, px, py, room, smoked) {
  if (smoked) return 0;
  const dx = px - g.x;
  const dy = py - g.y;
  const dist = Math.hypot(dx, dy);
  const range = TUNING.guardRange * (inShadow(px, py, room) ? TUNING.shadowRangeFactor : 1);
  if (dist > range) return 0;
  const ang = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(ang, g.dir)) > TUNING.guardHalfAngle) return 0;
  if (lineBlocked(g.x, g.y, px, py, room)) return 0;
  const closeness = 1 - dist / range;
  const lit = inShadow(px, py, room) ? TUNING.shadowDetectFactor : 1;
  return Math.max(0.25, closeness) * lit;
}

export function updateGuard(g, dt, player, room, smoked, now) {
  // Detection: rises while the player is exposed, falls when hidden.
  const exposure = guardSees(g, player.x, player.y, room, smoked);
  if (exposure > 0) {
    g.detect = Math.min(100, g.detect + TUNING.detectRise * exposure * dt);
    g.lastSeen = { x: player.x, y: player.y };
  } else {
    g.detect = Math.max(0, g.detect - TUNING.detectFall * dt);
  }

  const prev = g.state;
  g.state = g.detect > 88 ? 'alert' : g.detect > 45 ? 'suspicious' : 'calm';

  // A guard that just noticed something walks over to look.
  if (g.state === 'suspicious' && prev === 'calm' && g.lastSeen) {
    g.investigate = { ...g.lastSeen };
  }
  if (g.state === 'alert') g.investigate = { x: player.x, y: player.y };
  if (g.state === 'calm') g.investigate = null;

  // Movement: patrol, investigate, or chase.
  let tx;
  let ty;
  let speed = g.speed;
  if (g.state === 'alert') {
    tx = player.x;
    ty = player.y;
    speed = TUNING.guardChase;
  } else if (g.investigate) {
    tx = g.investigate.x;
    ty = g.investigate.y;
  } else {
    const wp = g.wps[g.wpIndex];
    tx = wp[0];
    ty = wp[1];
  }

  const dx = tx - g.x;
  const dy = ty - g.y;
  const dist = Math.hypot(dx, dy);
  g.bob += dt * (dist > 2 ? 9 : 2);

  if (dist < 6) {
    if (g.investigate) {
      // Looked, found nothing: stand and scan, then go back to patrol.
      if (g.pauseLeft <= 0) g.pauseLeft = 1.6;
      g.pauseLeft -= dt;
      if (g.pauseLeft <= 0) {
        g.investigate = null;
        g.detect = Math.max(0, g.detect - 25);
      }
      g.dir += Math.sin(now * 1.4) * dt * 0.8;
    } else if (!g.investigate && g.state !== 'alert') {
      g.pauseLeft -= dt;
      if (g.pauseLeft <= 0) {
        g.wpIndex = (g.wpIndex + 1) % g.wps.length;
        g.pauseLeft = g.pause;
      }
    }
    return;
  }

  g.dir = angleTo(g, tx, ty);
  g.x += (dx / dist) * speed * dt;
  g.y += (dy / dist) * speed * dt;
  resolveCollisions(g, room);
}
