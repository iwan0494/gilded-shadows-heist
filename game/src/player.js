// player.js — Sable: movement, sneak, carpet noise, lockpicking, lasers, doors.
import { PLAY } from './config.js';

export function makePlayer(x, y) {
  return {
    x, y, dir: -Math.PI / 2, speed: 150, sneaking: false, moving: false,
    inShadow: false, interact: null, interactT: 0, noiseT: 0,
    laserCool: 0, doorCool: 0,
  };
}

function circleHitsRect(px, py, r, rc) {
  const cx = Math.max(rc.x, Math.min(px, rc.x + rc.w));
  const cy = Math.max(rc.y, Math.min(py, rc.y + rc.h));
  const dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy < r * r;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export function updatePlayer(p, input, dt, world, game) {
  const sp = input.sneak ? 70 : 150;
  p.sneaking = input.sneak;
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  const len = Math.hypot(mx, my);
  p.moving = len > 0;
  if (len > 0) {
    mx /= len; my /= len;
    p.dir = Math.atan2(my, mx);
  }
  const ox = p.x, oy = p.y;
  const nx = p.x + mx * sp * dt;
  const ny = p.y + my * sp * dt;

  // Axis-separated movement so the thief slides along statues and cases.
  const solid = (x, y) => {
    if (x < PLAY.x + 14 || x > PLAY.x + PLAY.w - 14 || y < PLAY.y + 14 || y > PLAY.y + PLAY.h - 14) return true;
    for (const s of world.statues) {
      if (Math.hypot(x - s.x, y - s.y) < s.r + 13) return true;
    }
    for (const c of world.cases) {
      if (circleHitsRect(x, y, 13, c)) return true;
    }
    if (world.pedestal && Math.hypot(x - world.pedestal.x, y - world.pedestal.y) < 36 + 13) return true;
    return false;
  };
  if (!solid(nx, p.y)) p.x = nx;
  if (!solid(p.x, ny)) p.y = ny;

  // Shadow: standing in a marked shadow zone hides the thief.
  p.inShadow = world.shadows.some((s) => p.x > s.x && p.x < s.x + s.w && p.y > s.y && p.y < s.y + s.h);

  // Running on the red carpet is loud: a visible noise ring every 0.9s.
  p.noiseT -= dt;
  if (p.moving && !p.sneaking && world.carpet) {
    const c = world.carpet;
    const onCarpet = p.x > c.x && p.x < c.x + c.w && p.y > c.y && p.y < c.y + c.h;
    if (onCarpet && p.noiseT <= 0) {
      p.noiseT = 0.9;
      game.tools.rings.push({ x: p.x, y: p.y, r: 10, maxR: 70, a: 0.7 });
      return { noise: { x: p.x, y: p.y, r: 200 } };
    }
  }

  // Lasers: crossing a live beam spikes the alarm (once per 1.5s).
  p.laserCool -= dt;
  for (const l of world.lasers) {
    if (!l.live || p.laserCool > 0) continue;
    if (segmentsCross(ox, oy, p.x, p.y, l.x1, l.y1, l.x2, l.y2)) {
      game.alarm = Math.min(100, game.alarm + 28);
      game.dialog = { who: 'WREN', text: 'Lasers tripped! Move — Voss is coming.' };
      game.tools.rings.push({ x: p.x, y: p.y, r: 10, maxR: 110, a: 0.9 });
      p.laserCool = 1.5;
      break;
    }
  }

  // Doors: stepping into a door zone changes rooms.
  p.doorCool -= dt;
  if (p.doorCool <= 0) {
    for (const d of world.doors) {
      if (p.x > d.x - 10 && p.x < d.x + d.w + 10 && p.y > d.y - 30 && p.y < d.y + d.h + 30) {
        game.changeRoom(d.to, d.to === 'atrium' ? 'north' : 'south');
        p.doorCool = 1.2;
        break;
      }
    }
  }

  // Exit pad: only open once the Sunflower is carried.
  if (world.exit && game.sunflower && world.exit.open) {
    const e = world.exit;
    if (p.x > e.x && p.x < e.x + e.w && p.y > e.y && p.y < e.y + e.h) {
      game.mode = 'win';
      game.winTime = game.time;
    }
  }
  return null;
}

// Hold-E interaction: cases and the Sunflower pedestal. Returns what finished.
export function updateInteract(p, input, dt, world, game) {
  if (!input.interact) { p.interact = null; p.interactT = 0; return null; }
  let target = null;
  for (const c of world.cases) {
    if (c.lootId && !c.empty && Math.hypot(p.x - (c.x + c.w / 2), p.y - (c.y + c.h / 2)) < 64) {
      target = { kind: 'case', ref: c };
      break;
    }
  }
  if (!target && world.pedestal && !game.sunflower) {
    if (Math.hypot(p.x - world.pedestal.x, p.y - world.pedestal.y) < 78) {
      target = { kind: 'sunflower', ref: world.pedestal };
    }
  }
  if (!target) { p.interact = null; p.interactT = 0; return null; }
  if (p.interact !== target.ref) { p.interact = target.ref; p.interactT = 0; }
  p.interactT += dt;
  if (p.interactT >= 1.2) {
    p.interact = null; p.interactT = 0;
    if (target.kind === 'case') {
      target.ref.empty = true;
      game.taken.add(target.ref.lootId);
      game.dialog = { who: 'WREN', text: target.ref.label + ' — secured. ' + (5 - game.taken.size) + ' to go.' };
    } else {
      game.sunflower = true;
      game.taken.add('sunflower');
      game.alarm = Math.min(100, game.alarm + 15);
      game.objective = 'Sunflower secured — get to the exit!';
      game.dialog = { who: 'WREN', text: 'The Sunflower is yours — now get to the exit!' };
    }
    return target.kind;
  }
  return null;
}
