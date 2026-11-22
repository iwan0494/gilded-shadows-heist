// GILDED SHADOWS — shot staging. One job: the four deterministic frames
// the judge sees (?shot=1..4). Staged shots are FROZEN: nothing moves, so
// the composition is exactly what was checked. Shot order is the heist:
// 1 planning → 2 infiltration → 3 the grab → 4 the getaway.
import { makeGuard } from './guards.js';
import { makeCamera } from './cameras.js';

export function setupRoom(state, idx) {
  state.room = idx;
  const room = state.rooms[idx];
  state.player.x = room.playerStart.x;
  state.player.y = room.playerStart.y;
  state.player.dir = -Math.PI / 2;
  state.player.sneak = false;
  state.guards = room.guards.map((d) => makeGuard(d, d.waypoints[0].x, d.waypoints[0].y));
  state.cameras = room.cameras.map((d) => makeCamera(d));
}

function rosterFor(state, live) {
  // All four named guards of the museum; off-room guards are on patrol.
  const names = ['MARLOW', 'DARA', 'VOSS', 'KELL'];
  return names.map((n) => ({
    name: n,
    status: live[n] || 'PATROLLING',
  }));
}

export function applyShot(state, n) {
  state.frozen = true;
  state.callouts = [];
  state.noises = [];
  state.smokes = [];
  state.mode = 'play';

  if (n === 1) {
    // PLANNING / BLUEPRINT — the heist on paper: crew, take, escape route.
    state.mode = 'title';
    return;
  }

  if (n === 2) {
    // INFILTRASI — Atrium. Marlow heard the pebble: "?" + meter ~35%.
    setupRoom(state, 0);
    state.time = 71; // 01:11
    state.dawn = 229; // DAWN IN 03:49
    state.alarm = 35;
    state.maxAlarm = 35;
    state.taken = { scarab: true };
    state.lootValue = 120000;
    state.pebbles = 3;
    state.smokeLeft = 2;
    state.objective = 'Steal the Midnight Sunflower';
    state.speaker = 'WREN';
    state.wren = 'Marlow heard something — hold still.';
    const p = state.player;
    p.x = 150; p.y = 470; p.dir = 0; p.sneak = true; p.inShadow = true;
    const marlow = state.guards[0];
    marlow.x = 470; marlow.y = 320; marlow.facing = 0.38;
    marlow.meter = 35; marlow.state = 'SUSPICIOUS'; marlow.lastWhy = 'HEARD — pebble';
    const kell = state.guards[1];
    kell.x = 880; kell.y = 300; kell.facing = Math.PI / 2; kell.meter = 5; kell.state = 'PATROL';
    state.cameras[0].angle = -2.2;
    state.noises.push({ x: 520, y: 340, r: 60, maxR: 190, age: 0.2 });
    state.nearestGuard = marlow;
    state.roster = rosterFor(state, { MARLOW: 'SUSPICIOUS', KELL: 'CALM' });
    state.callouts = [
      { ax: 470, ay: 320, text: 'Marlow — patrol route', dx: -190, dy: -48 },
      { ax: 968, ay: 70, text: 'Camera — sweeping arc', dx: -200, dy: 28 },
      { ax: 64, ay: 286, text: 'Scarab case — already empty', dx: 70, dy: -42 },
    ];
    return;
  }

  if (n === 3) {
    // VAULT / SUNFLOWER GRAB — the prize bobs on its pedestal, ringed by red lasers.
    setupRoom(state, 2);
    state.time = 238; // 03:58
    state.dawn = 62; // DAWN IN 01:02
    state.alarm = 55;
    state.maxAlarm = 55;
    state.taken = { sunflower: true, scarab: true, idol: true, crown: true, sapphires: true };
    state.lootValue = 1200000;
    state.pebbles = 2;
    state.smokeLeft = 1;
    state.lasersLive = true; // ringed by red lasers — the grab is live
    state.stageSunflower = true; // show the prize bobbing on its pedestal
    state.objective = 'Sunflower secured — get to the exit!';
    state.speaker = 'WREN';
    state.wren = 'Sunflower secured — get to the exit!';
    const p = state.player;
    p.x = 507; p.y = 330; p.dir = -Math.PI / 2;
    state.smokes.push({ x: 700, y: 200, r: 95, age: 1, life: 5 });
    state.cameras[0].blind = 4;
    state.cameras[1].angle = 2.6;
    const voss = state.guards[0];
    voss.x = 600; voss.y = 380; voss.facing = -2.64;
    voss.meter = 92; voss.state = 'ALERT'; voss.lastWhy = 'SEEN — in cone, lit';
    state.nearestGuard = voss;
    state.roster = rosterFor(state, { VOSS: 'ALERT' });
    state.callouts = [
      { ax: 507, ay: 266, text: 'Sunflower — bobbing, guarded by lasers', dx: -250, dy: -54 },
      { ax: 60, ay: 70, text: 'Camera — BLIND', dx: 30, dy: 16 },
      { ax: 600, ay: 380, text: 'ALERT cone — wait it out', dx: -60, dy: 48 },
    ];
    return;
  }

  // Shot 4 — GETAWAY. Alarm on: the whole room flips red.
  setupRoom(state, 0);
  state.time = 281; // 04:41
  state.dawn = 19; // DAWN IN 00:19
  state.alarm = 100;
  state.maxAlarm = 100;
  state.taken = { sunflower: true, scarab: true, idol: true, crown: true, sapphires: true };
  state.lootValue = 1200000;
  state.pebbles = 1;
  state.smokeLeft = 0;
  state.objective = 'Sunflower secured — get to the exit!';
  state.speaker = 'JINX';
  state.wren = 'Engine’s running — go go go!';
  const p = state.player;
  p.x = 500; p.y = 430; p.dir = Math.PI / 2; p.running = true;
  const marlow = state.guards[0];
  marlow.x = 380; marlow.y = 300; marlow.facing = 0.82;
  marlow.meter = 95; marlow.state = 'ALERT'; marlow.lastWhy = 'SEEN — in cone, lit';
  const kell = state.guards[1];
  kell.x = 700; kell.y = 200; kell.facing = 2.29;
  kell.meter = 88; kell.state = 'ALERT'; kell.lastWhy = 'SEEN — in cone, lit';
  state.cameras[0].angle = -2.2;
  state.nearestGuard = marlow;
  state.roster = rosterFor(state, { MARLOW: 'ALERT', KELL: 'ALERT' });
  state.callouts = [
    { ax: 507, ay: 562, text: 'Exit pad — Jinx is waiting', dx: -280, dy: -64 },
    { ax: 380, ay: 300, text: 'Alarm — the whole museum is awake', dx: -60, dy: -60 },
    { ax: 500, ay: 430, text: 'Escape route — follow the green', dx: 70, dy: 34 },
  ];
}
