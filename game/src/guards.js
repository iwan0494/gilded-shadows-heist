// guards.js — patrols, vision cones, gradual detection, investigate, recover.
// Detection is never binary: a 0–100% meter builds with distance, light and
// speed, and decays in shadow or smoke. Guards show what they know.
import { PLAY } from './config.js';

export const FOCUS_HALF = Math.PI / 6; // 60° focused cone
export const FOCUS_RANGE = 280;
export const PERIPH_HALF = Math.PI / 2; // ~180° faint peripheral arc
export const PERIPH_RANGE = 170;

export function makeGuard(def, waypoints, opts = {}) {
  return {
    id: def.id, name: def.name, short: def.short, color: def.color,
    x: waypoints[0][0], y: waypoints[0][1], dir: 0,
    speed: def.speed, waypoints, wp: 1, wait: 0, glance: 0,
    state: 'patrol', meter: 0, target: null, searchT: 0, alertT: 0,
    unseenT: 0, jumpy: false, turnIn: 0, ...opts,
  };
}

function pointInCircle(px, py, c) {
  const dx = px - c.x, dy = py - c.y;
  return dx * dx + dy * dy <= c.r * c.r;
}

// Line of sight: sample along the segment; blocked by statue/pedestal circles
// or by leaving the play area. Guards never see through walls.
export function losClear(x1, y1, x2, y2, blockers) {
  const dx = x2 - x1, dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const px = x1 + dx * t, py = y1 + dy * t;
    if (px < PLAY.x || px > PLAY.x + PLAY.w || py < PLAY.y || py > PLAY.y + PLAY.h) return false;
    for (const c of blockers.circles) if (pointInCircle(px, py, c)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Sample three body points (head / torso / feet) before calling anyone seen.
export function guardSees(g, px, py, blockers, sneaking) {
  const dx = px - g.x, dy = py - g.y;
  const dist = Math.hypot(dx, dy);
  if (dist > FOCUS_RANGE && dist > PERIPH_RANGE) return { kind: null, dist };
  const ang = Math.atan2(dy, dx);
  const off = Math.abs(angleDiff(ang, g.dir));
  const samples = [[px, py - 10], [px, py], [px, py + 10]];
  const seen = samples.some(([sx, sy]) => losClear(g.x, g.y, sx, sy, blockers));
  if (!seen) return { kind: null, dist };
  if (off <= FOCUS_HALF && dist <= FOCUS_RANGE) return { kind: 'focus', dist };
  if (off <= PERIPH_HALF && dist <= PERIPH_RANGE) return { kind: 'periph', dist };
  return { kind: null, dist };
}

function moveToward(g, tx, ty, dt, speedMul = 1) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, g.speed * speedMul * dt);
  g.x += (dx / d) * step;
  g.y += (dy / d) * step;
  g.dir = Math.atan2(dy, dx);
  return d - step < 2;
}

export function updateGuard(g, dt, player, world, game, blockers) {
  const inSmoke = game.tools.clouds.some((c) => Math.hypot(player.x - c.x, player.y - c.y) < c.r);
  const see = inSmoke ? { kind: null, dist: 999 } : guardSees(g, player.x, player.y, blockers, player.sneaking);
  const lit = !player.inShadow;
  const speedMul = g.jumpy ? 1.25 : 1;

  // --- detection meter: gradual, never a switch ---
  if (see.kind === 'focus') {
    const near = 1 - see.dist / (FOCUS_RANGE + 60);
    let rate = 58 * (0.35 + 0.65 * near) * (player.sneaking ? 0.55 : 1) * (lit ? 1 : 0.55);
    if (g.jumpy) rate *= 1.35;
    g.meter = Math.min(100, g.meter + rate * dt);
    g.unseenT = 0;
  } else if (see.kind === 'periph') {
    g.meter = Math.min(100, g.meter + 16 * dt);
    g.unseenT = 0;
  } else {
    g.meter = Math.max(0, g.meter - (player.inShadow || inSmoke ? 42 : 22) * dt);
    g.unseenT += dt;
  }
  if (g.meter >= 100 && g.state !== 'alert') {
    g.state = 'alert';
    g.alertT = 0;
    game.alarm = Math.min(100, game.alarm + 25);
    game.spotted = true;
    game.alarmHistory.push('ALERT');
    game.dialog = { who: 'WREN', text: g.short + ' has eyes on you — break line of sight!' };
  }

  // --- behaviour by state ---
  if (g.state === 'alert') {
    g.alertT += dt;
    if (see.kind) {
      g.target = { x: player.x, y: player.y };
      moveToward(g, player.x, player.y, dt, 1.5 * speedMul);
      if (Math.hypot(player.x - g.x, player.y - g.y) < 26) game.caughtBy = g.short;
    } else if (g.unseenT > 4) {
      g.state = 'search';
      g.searchT = 0;
    }
    return;
  }
  if (g.state === 'search') {
    g.searchT += dt;
    if (g.target) moveToward(g, g.target.x, g.target.y, dt, 1.1 * speedMul);
    if (g.searchT > 3.5) { // gives up; the level continues in a worse state
      g.state = 'patrol';
      g.jumpy = true;
      g.target = null;
    }
    return;
  }
  if (g.state === 'investigate') {
    if (g.target) {
      const arrived = moveToward(g, g.target.x, g.target.y, dt, 1.15 * speedMul);
      if (arrived) {
        g.wait += dt;
        g.dir += Math.sin(g.wait * 2.4) * 0.05; // looks around
        if (g.wait > 2.2) { g.state = 'patrol'; g.wait = 0; g.target = null; }
      }
    } else { g.state = 'patrol'; }
    return;
  }
  // patrol: walk waypoints, pause + glance at each one
  if (g.wait > 0) {
    g.wait -= dt;
    g.glance += dt;
    g.dir += Math.sin(g.glance * 2.2) * 0.045; // sweeping glance
    g.turnIn = Math.max(0, g.wait);
    return;
  }
  const wp = g.waypoints[g.wp];
  const arrived = moveToward(g, wp[0], wp[1], dt, speedMul);
  g.turnIn = Math.max(0, Math.hypot(wp[0] - g.x, wp[1] - g.y) / (g.speed * speedMul));
  if (arrived) {
    g.wp = (g.wp + 1) % g.waypoints.length;
    g.wait = 1.6;
    g.glance = 0;
  }
}

// A noise pulls nearby patrolling guards off their route to check it.
export function hearNoise(guards, noise) {
  for (const g of guards) {
    if (g.state !== 'patrol' && g.state !== 'investigate') continue;
    if (Math.hypot(noise.x - g.x, noise.y - g.y) < noise.r) {
      g.state = 'investigate';
      g.target = { x: noise.x, y: noise.y };
      g.wait = 0;
      if (g.meter < 45) g.meter = 45;
    }
  }
}
