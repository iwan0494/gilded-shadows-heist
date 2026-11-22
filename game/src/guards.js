// GILDED SHADOWS — guards. One job: patrol, see, suspect, chase, give up.
// A guard shows what he knows: a detection pie above his head, "?" when
// suspicious, "!" when alert. Detection is gradual (0-100), never binary.
import { sightBlocked, pointInShadow } from './world.js';
import { GUARD_TOUCH } from './config.js';

const FOCUS_FOV = Math.PI / 3; // 60° focused cone
const FOCUS_RANGE = 215;
const PERIPH_FOV = Math.PI; // ~180° faint peripheral arc
const PERIPH_RANGE = 120;

export function makeGuard(def, x, y) {
  return {
    def, x, y,
    wp: 0,
    facing: Math.atan2(def.waypoints[1].y - y, def.waypoints[1].x - x),
    meter: 0,
    state: 'PATROL',
    waitT: 0,
    glance: 0,
    investigate: null,
    lastSeen: null,
    searchT: 0,
    loseT: 0,
    jumpy: false,
    speedMul: 1,
  };
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function inSmoke(state, x, y) {
  return state.smokes.some((s) => {
    const dx = x - s.x, dy = y - s.y;
    return dx * dx + dy * dy < s.r * s.r;
  });
}

// How fast this guard's meter climbs right now (0 when the player is unseen).
export function senseRate(g, state, room) {
  const p = state.player;
  if (inSmoke(state, p.x, p.y)) return { rate: 0, why: 'HIDDEN — smoke' };
  const dx = p.x - g.x, dy = p.y - g.y;
  const dist = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const diff = Math.abs(angleDiff(ang, g.facing));
  const shadow = pointInShadow(p.x, p.y, room);
  const light = shadow ? 0.5 : 1;
  const speed = state.player.sneak ? 0.7 : (state.player.running ? 1.4 : 1);
  const jumpy = g.jumpy ? 1.5 : 1;
  if (diff < FOCUS_FOV / 2 && dist < FOCUS_RANGE) {
    if (sightBlocked(g.x, g.y, p.x, p.y, room)) return { rate: 0, why: 'HIDDEN — behind cover' };
    const close = 1 - (dist / FOCUS_RANGE) * 0.6;
    return { rate: 55 * close * light * speed * jumpy, why: shadow ? 'SEEN — in cone, shadow' : 'SEEN — in cone, lit' };
  }
  if (diff < PERIPH_FOV / 2 && dist < PERIPH_RANGE) {
    if (sightBlocked(g.x, g.y, p.x, p.y, room)) return { rate: 0, why: 'HIDDEN — behind cover' };
    return { rate: 14 * light * speed * jumpy, why: 'SEEN — peripheral' };
  }
  if (shadow) return { rate: 0, why: 'HIDDEN — shadow' };
  return { rate: 0, why: 'HIDDEN — out of sight' };
}

function moveToward(g, tx, ty, speed, dt) {
  const dx = tx - g.x, dy = ty - g.y;
  const d = Math.hypot(dx, dy);
  if (d < 2) return true;
  const step = Math.min(d, speed * dt);
  g.x += (dx / d) * step;
  g.y += (dy / d) * step;
  g.facing = Math.atan2(dy, dx);
  return d - step < 2;
}

export function updateGuard(g, dt, state, room) {
  const p = state.player;
  const sensed = senseRate(g, state, room);
  g.lastRate = sensed.rate;
  g.lastWhy = sensed.why;

  if (sensed.rate > 0) {
    g.meter = Math.min(100, g.meter + sensed.rate * dt);
    g.lastSeen = { x: p.x, y: p.y };
    g.loseT = 0;
  } else {
    g.meter = Math.max(0, g.meter - 18 * dt);
    g.loseT += dt;
  }

  // State transitions from the meter.
  if (g.meter >= 85) {
    if (g.state !== 'ALERT') { g.state = 'ALERT'; state.spotted = true; }
  } else if (g.meter >= 40) {
    if (g.state === 'PATROL' || g.state === 'RETURN') g.state = 'SUSPICIOUS';
  } else if (g.meter < 20 && (g.state === 'ALERT' || g.state === 'SEARCH')) {
    g.state = 'SEARCH';
    g.searchT = 3;
  }

  // Noise: the nearest fresh noise inside 320 pulls a calm guard off route.
  if ((g.state === 'PATROL' || g.state === 'RETURN') && state.noises.length) {
    let best = null, bd = 320;
    for (const n of state.noises) {
      const d = Math.hypot(n.x - g.x, n.y - g.y);
      if (d < bd) { bd = d; best = n; }
    }
    if (best) {
      g.investigate = { x: best.x, y: best.y };
      g.state = 'SUSPICIOUS';
    }
  }

  const speed = g.def.speed * g.speedMul * (state.dawn <= 0 ? 1.3 : 1);

  if (g.state === 'ALERT') {
    const target = g.lastSeen || { x: p.x, y: p.y };
    moveToward(g, target.x, target.y, speed * 1.5, dt);
    if (Math.hypot(p.x - g.x, p.y - g.y) < GUARD_TOUCH) state.caughtBy = g.def.name;
    if (g.loseT > 3) { g.state = 'SEARCH'; g.searchT = 3; }
  } else if (g.state === 'SEARCH') {
    if (g.lastSeen) moveToward(g, g.lastSeen.x, g.lastSeen.y, speed, dt);
    g.searchT -= dt;
    g.facing += Math.sin(state.time * 3) * 0.02; // sweep the area with his eyes
    if (g.searchT <= 0) {
      g.state = 'RETURN';
      g.jumpy = true; // he gives up, but stays jumpy afterwards
    }
  } else if (g.state === 'SUSPICIOUS') {
    if (g.investigate) {
      const done = moveToward(g, g.investigate.x, g.investigate.y, speed, dt);
      if (done) {
        g.waitT = 2;
        g.investigate = null;
      }
    } else if (g.waitT > 0) {
      g.waitT -= dt;
      g.facing += Math.sin(state.time * 2.2) * 0.03; // glance around
    } else if (g.meter < 40) {
      g.state = 'RETURN';
    }
  } else if (g.state === 'RETURN') {
    const wps = g.def.waypoints;
    let best = 0, bd = Infinity;
    wps.forEach((w, i) => {
      const d = Math.hypot(w.x - g.x, w.y - g.y);
      if (d < bd) { bd = d; best = i; }
    });
    g.wp = best;
    if (moveToward(g, wps[best].x, wps[best].y, speed, dt)) g.state = 'PATROL';
  } else {
    // PATROL: walk the route, pause + glance at every waypoint.
    const wps = g.def.waypoints;
    const target = wps[g.wp];
    if (g.waitT > 0) {
      g.waitT -= dt;
      g.facing = target.angle ?? g.facing;
      g.facing += Math.sin(state.time * 1.6 + g.wp) * 0.35 * Math.min(1, g.waitT);
    } else if (moveToward(g, target.x, target.y, speed, dt)) {
      g.waitT = g.def.wait;
      target.angle = g.facing;
      g.wp = (g.wp + 1) % wps.length;
    }
  }
}

export function guardStatus(g) {
  if (g.state === 'ALERT') return 'ALERT';
  if (g.state === 'SEARCH') return 'SEARCHING';
  if (g.state === 'SUSPICIOUS') return 'SUSPICIOUS';
  return 'CALM';
}
