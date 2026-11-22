// GILDED SHADOWS — main loop. One job: own the state, step the simulation,
// and hand every frame to the renderer. States: title (planning) → play →
// caught → win. Winning needs the Sunflower on the exit pad: 5/5 loot
// without it is not a getaway.
import { buildRooms } from './world.js';
import { updateGuard, guardStatus } from './guards.js';
import { updateCamera } from './cameras.js';
import { updateTools, throwPebble, useSmoke } from './tools.js';
import { makePlayer, updatePlayer, nearLoot, onLaser } from './player.js';
import { drawFrame } from './render.js';
import { applyShot, setupRoom } from './shots.js';
import { input, initInput, consumeClick } from './input.js';
import { initAudio, setMuted, blip, pickup, alarmSwell } from './audio.js';
import { DAWN_LIMIT, PEBBLES, SMOKES } from './config.js';

const OBJECTIVES = [
  'Steal the Midnight Sunflower',
  'Lift the Ruby Idol and the Brass Crown',
  'Take the Sunflower — then run!',
];

function newState() {
  const rooms = buildRooms();
  const state = {
    rooms,
    room: 0,
    mode: 'title',
    frozen: false,
    paused: false,
    notes: false,
    time: 0,
    dawn: DAWN_LIMIT,
    dawnHit: false,
    alarm: 0,
    maxAlarm: 0,
    spotted: false,
    ghost: false,
    taken: {},
    lootValue: 0,
    pebbles: PEBBLES,
    smokeLeft: SMOKES,
    player: makePlayer(rooms[0].playerStart),
    guards: [],
    cameras: [],
    noises: [],
    smokes: [],
    lasersLive: true,
    laserCooldown: 0,
    picking: false,
    pickT: 0,
    pickRattle: 0,
    pickTarget: null,
    caughtBy: null,
    objective: OBJECTIVES[0],
    speaker: 'WREN',
    wren: 'Three rooms, five pieces, one way out. Observe first — Marlow is slow, use that.',
    callouts: [],
    roster: [],
    nearestGuard: null,
    qHeld: false,
  };
  setupRoom(state, 0);
  return state;
}

function refreshDerived(state) {
  if (state.frozen) return;
  let best = null;
  for (const g of state.guards) {
    if (!best || g.meter > best.meter) best = g;
  }
  state.nearestGuard = best;
  const live = {};
  for (const g of state.guards) live[g.def.short] = guardStatus(g);
  state.roster = ['MARLOW', 'DARA', 'VOSS', 'KELL'].map((n) => ({
    name: n,
    status: live[n] || 'PATROLLING',
  }));
}

function takeLoot(state, loot) {
  state.taken[loot.id] = true;
  const def = { sunflower: 500000, scarab: 120000, idol: 180000, crown: 250000, sapphires: 150000 }[loot.id];
  state.lootValue += def;
  pickup();
  if (loot.id === 'sunflower') {
    state.lasersLive = false;
    state.objective = 'Sunflower secured — get to the exit!';
    state.speaker = 'WREN';
    state.wren = 'Sunflower secured — get to the exit!';
  } else {
    state.wren = 'Got it. ' + (5 - Object.keys(state.taken).length) + ' to go — stay quiet.';
  }
}

function update(dt, state) {
  const room = state.rooms[state.room];
  state.time += dt;
  state.dawn = Math.max(0, DAWN_LIMIT - state.time);
  if (state.dawn <= 0 && !state.dawnHit) {
    state.dawnHit = true;
    state.alarm = Math.max(state.alarm, 85);
    state.speaker = 'WREN';
    state.wren = 'Dawn’s breaking — the museum wakes up! Move!';
    alarmSwell();
  }

  updatePlayer(dt, state, room, input);
  for (const g of state.guards) updateGuard(g, dt, state, room);
  for (const c of state.cameras) updateCamera(c, dt, state, room);
  updateTools(dt, state);

  // Alarm decays when nobody sees you.
  const anyAlert = state.guards.some((g) => g.state === 'ALERT');
  const anySpotted = state.cameras.some((c) => c.spotted);
  if (!anyAlert && !anySpotted) state.alarm = Math.max(0, state.alarm - 3 * dt);
  state.maxAlarm = Math.max(state.maxAlarm, state.alarm);
  if (state.alarm >= 100) state.caughtBy = 'The alarm';

  // Lasers bite once a second while you stand in them.
  state.laserCooldown -= dt;
  if (onLaser(state, room) && state.laserCooldown <= 0) {
    state.laserCooldown = 1;
    state.alarm = Math.min(100, state.alarm + 20);
    blip(180, 0.2, 'square', 0.06);
  }

  // Lockpicking: hold E near a case or the pedestal.
  const near = nearLoot(state, room);
  state.pickTarget = near
    ? { label: near.id === 'sunflower' ? 'Lift the Sunflower' : 'Pick the case', loot: near }
    : null;
  if (near && input.keys.has('e')) {
    state.picking = true;
    const need = near.id === 'sunflower' ? 1.5 : 1.2;
    state.pickT = Math.min(1, state.pickT + dt / need);
    state.pickRattle += dt;
    if (state.pickRattle > 0.5) {
      state.pickRattle = 0;
      state.noises.push({ x: state.player.x, y: state.player.y, r: 6, maxR: 110, age: 0 });
    }
    if (state.pickT >= 1) {
      takeLoot(state, near);
      state.picking = false;
      state.pickT = 0;
    }
  } else {
    state.picking = false;
    state.pickT = 0;
    state.pickRattle = 0;
  }

  // Pebble: click to throw toward the mouse.
  if (consumeClick() && state.pebbles > 0) {
    const tx = Math.max(0, Math.min(1014, input.clickX - 8));
    const ty = Math.max(0, Math.min(596, input.clickY - 64));
    if (throwPebble(state, tx, ty)) blip(900, 0.06, 'triangle', 0.05);
  }
  // Smoke: Q, edge-triggered.
  if (input.keys.has('q') && !state.qHeld) {
    state.qHeld = true;
    if (useSmoke(state)) blip(300, 0.2, 'sine', 0.05);
  }
  if (!input.keys.has('q')) state.qHeld = false;

  // Doors between rooms.
  const p = state.player;
  if (room.doorNorth && p.y < 14 && Math.abs(p.x - 507) < 40 && state.room < 2) {
    setupRoom(state, state.room + 1);
    state.objective = OBJECTIVES[state.room];
    state.wren = state.room === 1
      ? 'Dara walks the long rectangle — time the corners.'
      : 'Voss guards the vault himself. Lasers on the Sunflower. Careful.';
  } else if (room.doorSouth && p.y > 582 && Math.abs(p.x - 507) < 40 && state.room > 0) {
    setupRoom(state, state.room - 1);
    state.objective = OBJECTIVES[state.room];
  }

  // The exit pad only opens for the one who carries the Sunflower.
  if (room.exitPad) {
    const pad = room.exitPad;
    const onPad = p.x >= pad.x && p.x <= pad.x + pad.w && p.y >= pad.y && p.y <= pad.y + pad.h;
    if (onPad && state.taken.sunflower) {
      state.mode = 'win';
      state.ghost = !state.spotted;
    } else if (onPad && !state.taken.sunflower) {
      state.wren = 'The pad stays dark without the Sunflower. Go back in.';
    }
  }

  if (state.caughtBy) state.mode = 'caught';
}

function resetRoom(state) {
  const idx = state.room;
  const alarm = state.alarm;
  const taken = state.taken;
  const lootValue = state.lootValue;
  setupRoom(state, idx);
  state.mode = 'play';
  state.alarm = Math.max(0, alarm - 20);
  state.taken = taken;
  state.lootValue = lootValue;
  state.caughtBy = null;
  state.picking = false;
  state.pickT = 0;
  state.noises = [];
  state.smokes = [];
  state.wren = 'Again. Slower this time — watch the pies above their heads.';
}

export function main() {
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const state = newState();
  initInput(canvas);

  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (shot) applyShot(state, Number(shot));

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;

    if (input.keys.has('m') && !state.mHeld) {
      state.mHeld = true;
      setMuted(!isMuted());
    }
    if (!input.keys.has('m')) state.mHeld = false;

    if (state.mode === 'title') {
      if (input.keys.has('enter')) {
        initAudio();
        state.mode = 'play';
      }
    } else if (state.mode === 'play') {
      if (input.keys.has('escape') && !state.escHeld) {
        state.escHeld = true;
        state.paused = !state.paused;
      }
      if (!input.keys.has('escape')) state.escHeld = false;
      if (input.keys.has('h') && !state.hHeld) {
        state.hHeld = true;
        state.notes = !state.notes;
      }
      if (!input.keys.has('h')) state.hHeld = false;
      if (!state.paused && !state.frozen) update(dt, state);
    } else if (state.mode === 'caught' || state.mode === 'win') {
      if (input.keys.has('r')) resetRoom(state);
    }

    refreshDerived(state);
    drawFrame(ctx, state);
    if (state.notes && state.mode === 'play') {
      ctx.fillStyle = 'rgba(8,12,22,0.92)';
      ctx.fillRect(340, 150, 600, 300);
      ctx.strokeStyle = '#d8a94e';
      ctx.strokeRect(340.5, 150.5, 600, 300);
      ctx.fillStyle = '#d8a94e';
      ctx.font = 'bold 18px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('FIELD NOTES — WREN', 640, 190);
      ctx.fillStyle = '#e8e2d2';
      ctx.font = '14px system-ui, sans-serif';
      const lines = [
        'MARLOW — slow, long pauses. Use the gaps.',
        'DARA — walks the rectangle. Corners are safe.',
        'VOSS — guards the vault. Never rush the lasers.',
        'KELL — east corridor. Watch the camera sweep.',
        'Shadow halves how fast they see you.',
        'The exit pad wants the Sunflower, nothing else.',
      ];
      lines.forEach((l, i) => ctx.fillText(l, 640, 226 + i * 30));
      ctx.textAlign = 'left';
    }
    window.__gameReady = true;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

main();
