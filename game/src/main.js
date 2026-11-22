// GILDED SHADOWS — the loop: title, play, caught, win, pause, and the
// frozen screenshot stagings. This file owns the game state and the rules
// that tie the modules together: the alarm, the getaway, and the GHOST
// rating for a run nobody ever spotted.

import { CANVAS_W, CANVAS_H, FIELD, TUNING } from './config.js';
import { ROOMS, TOTAL_LOOT, inShadow } from './world.js';
import { makeGuard, updateGuard } from './guards.js';
import { makeCamera, updateCamera } from './cameras.js';
import {
  makeTools,
  throwPebble,
  dropSmoke,
  updateTools,
  inSmoke,
  smokeBlocks,
  pebbleNoise,
} from './tools.js';
import { makePlayer, updatePlayer, atDoor, playerInShadow } from './player.js';
import { makeInput } from './input.js';
import {
  makeAudio,
  sfxStep,
  sfxPickup,
  sfxPebble,
  sfxSmoke,
  sfxCaught,
  sfxWin,
  sfxDoor,
  alarmPulse,
} from './audio.js';
import { drawGame } from './render.js';
import { BOT_BUTTONS } from './hud.js';
import { makeRng } from './random.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const input = makeInput(canvas);
const audio = makeAudio();
const rng = makeRng(20261122);

const s = {
  mode: 'title', // title | play | paused | caught | win | shot
  roomIndex: 0,
  room: null,
  guards: [],
  cameras: [],
  player: null,
  tools: null,
  alarm: 0,
  timer: 0,
  lootGot: 0,
  lootTotal: TOTAL_LOOT,
  detection: 0,
  inShadowNow: false,
  smokedNow: false,
  showNotes: false,
  caughtReason: '',
  ghost: false,
  hint: '',
  callouts: null,
  now: 0,
  stepTimer: 0,
};

s.loadRoom = function loadRoom(idx) {
  s.roomIndex = idx;
  // A fresh copy per visit: loot taken-flags reset when the room reloads.
  s.room = JSON.parse(JSON.stringify(ROOMS[idx]));
  s.guards = s.room.guards.map(makeGuard);
  s.cameras = s.room.cameras.map(makeCamera);
  s.player = makePlayer(s.room.start.x, s.room.start.y);
  s.tools = makeTools();
  s.alarm = Math.max(0, s.alarm - 15);
  s.hint = '';
};

function newRun() {
  s.lootGot = 0;
  s.timer = 0;
  s.alarm = 0;
  s.ghost = true;
  s.caughtReason = '';
  s.loadRoom(0);
  s.mode = 'play';
}

function retryRoom() {
  const gotBeforeRoom = s.lootGot - s.room.loot.filter((l) => l.taken).length;
  s.lootGot = gotBeforeRoom;
  s.loadRoom(s.roomIndex);
  s.mode = 'play';
}

function caught(reason) {
  if (s.mode !== 'play') return;
  s.mode = 'caught';
  s.caughtReason = reason;
  sfxCaught(audio);
}

function clickButton(x, y) {
  for (const b of BOT_BUTTONS) {
    if (x >= b.x && x <= b.x + b.w && y >= 676 + 6 && y <= 676 + 30) {
      return b.id;
    }
  }
  return null;
}

function handleClick(x, y) {
  const btn = clickButton(x, y);
  if (btn === 'pause') {
    if (s.mode === 'play') s.mode = 'paused';
    else if (s.mode === 'paused') s.mode = 'play';
    return;
  }
  if (btn === 'restart') {
    retryRoom();
    return;
  }
  if (btn === 'notes') {
    s.showNotes = !s.showNotes;
    return;
  }
  if (btn === 'mute') {
    audio.muted = !audio.muted;
    return;
  }
  if (s.mode === 'title') {
    newRun();
    return;
  }
  if (s.mode === 'caught' || s.mode === 'win') {
    retryRoom();
    return;
  }
  if (s.mode !== 'play') return;
  // Throw a pebble toward the clicked point on the museum floor.
  const fx = x - FIELD.x;
  const fy = y - FIELD.y;
  if (fx < 0 || fy < 0 || fx > FIELD.w || fy > FIELD.h) return;
  if (throwPebble(s.tools, s.player.x, s.player.y, fx, fy)) sfxPebble(audio);
}

function update(dt) {
  s.now += dt;
  if (s.mode !== 'play') return;

  s.timer += dt;
  const p = s.player;
  const room = s.room;

  // Movement + stealing.
  const stolen = updatePlayer(p, dt, input, room, s.tools);
  if (stolen) {
    s.lootGot += 1;
    sfxPickup(audio);
    s.hint = stolen.kind === 'painting'
      ? 'The Sunflower is yours — get to the next room.'
      : `${stolen.label} bagged (${s.lootGot}/${s.lootTotal}).`;
  }

  // Footstep ticks.
  if (p.moving) {
    s.stepTimer -= dt;
    if (s.stepTimer <= 0) {
      s.stepTimer = p.sneaking ? 0.55 : 0.34;
      sfxStep(audio, p.sneaking);
    }
  }

  // Smoke, pebbles, lockpick rattle.
  updateTools(s.tools, dt, rng);
  const smoked = inSmoke(s.tools, p.x, p.y);
  s.smokedNow = smoked;

  // Guards see, chase, and touch.
  let alarmPush = 0;
  let maxDetect = 0;
  for (const g of s.guards) {
    const blocked = smokeBlocks(s.tools, g.x, g.y, p.x, p.y);
    updateGuard(g, dt, p, room, smoked || blocked, s.now);
    maxDetect = Math.max(maxDetect, g.detect);
    if (g.detect > 40) {
      alarmPush = Math.max(alarmPush, TUNING.alarmRiseGuard * (g.detect / 100));
      if (g.state !== 'calm') s.ghost = false;
    }
    if (Math.hypot(g.x - p.x, g.y - p.y) < TUNING.guardTouch) {
      caught('A guard laid a hand on your shoulder.');
    }
  }
  s.detection = maxDetect;

  // Cameras see and raise the alarm.
  for (const c of s.cameras) {
    const blocked = smokeBlocks(s.tools, c.x, c.y, p.x, p.y);
    const exposure = updateCamera(c, dt, p.x, p.y, room, smoked || blocked, s.now);
    if (exposure > 0) {
      alarmPush = Math.max(alarmPush, TUNING.alarmRiseCamera * exposure);
      s.ghost = false;
    }
  }

  // Noise draws guards: carpet running, a pebble's ring, a rattling pick.
  const noise = pebbleNoise(s.tools);
  for (const g of s.guards) {
    if (g.state === 'alert') continue;
    if (noise && Math.hypot(g.x - noise.x, g.y - noise.y) < noise.r) {
      g.investigate = { x: noise.x, y: noise.y };
      if (g.detect < 50) g.detect = 50;
    }
    if (s.tools.rattle > 0 && Math.hypot(g.x - p.x, g.y - p.y) < 170) {
      g.investigate = { x: p.x, y: p.y };
      if (g.detect < 50) g.detect = 50;
    }
    if (p.noise > 0.6 && Math.hypot(g.x - p.x, g.y - p.y) < TUNING.carpetNoiseRadius) {
      g.investigate = { x: p.x, y: p.y };
      if (g.detect < 45) g.detect = 45;
    }
  }

  // The alarm climbs while anyone sees the thief, and drains in the dark.
  if (alarmPush > 0) {
    s.alarm = Math.min(100, s.alarm + alarmPush * dt);
  } else {
    s.alarm = Math.max(0, s.alarm - TUNING.alarmFall * dt);
  }
  alarmPulse(audio, s.alarm);
  if (s.alarm >= 100) {
    caught('The alarm brought the whole museum down on you.');
    return;
  }

  // Doors and the exit.
  const at = atDoor(p, room);
  if (at === 'door') {
    if (room.loot.every((l) => l.taken)) {
      sfxDoor(audio);
      s.loadRoom(room.door.to);
      s.hint = `${s.room.name} — ${s.room.objective}.`;
    } else {
      s.hint = 'The door is locked — clear this room first.';
    }
  } else if (at === 'exit') {
    if (s.lootGot >= s.lootTotal) {
      s.mode = 'win';
      sfxWin(audio);
    } else {
      s.hint = `The exit stays shut until ${s.lootTotal}/${s.lootTotal} loot is bagged.`;
    }
  }

  s.inShadowNow = playerInShadow(p, room);
  s._p = p;
}

function frame(t) {
  const dt = Math.min(0.05, (t - (frame._last ?? t)) / 1000 || 0);
  frame._last = t;

  // Edge-triggered keys.
  if (input.pressed.KeyH) s.showNotes = !s.showNotes;
  if (input.pressed.KeyM) audio.muted = !audio.muted;
  if (input.pressed.KeyQ && s.mode === 'play') {
    if (dropSmoke(s.tools, s.player.x, s.player.y)) sfxSmoke(audio);
  }
  if (input.pressed.Escape) {
    if (s.mode === 'play') s.mode = 'paused';
    else if (s.mode === 'paused') s.mode = 'play';
  }
  if (input.pressed.KeyR && (s.mode === 'play' || s.mode === 'paused' || s.mode === 'caught' || s.mode === 'win')) {
    if (s.mode === 'caught' || s.mode === 'win') newRun();
    else retryRoom();
  }
  if (input.pressed.Enter && s.mode === 'title') newRun();
  input.pressed = {};

  if (input.click) {
    handleClick(input.click.x, input.click.y);
    input.click = null;
  }

  update(dt);

  // The view the renderer reads: HUD numbers plus the world.
  const view = {
    ...s,
    muted: audio.muted,
    noise: s.player ? s.player.noise : 0,
    sneaking: s.player ? s.player.sneaking : false,
    inShadow: s.inShadowNow,
    smoked: s.smokedNow,
    room: s.room,
    guards: s.guards,
    cameras: s.cameras,
    player: s.player,
    tools: s.tools,
  };
  drawGame(ctx, view);
  document.getElementById('status').textContent =
    `${s.room ? s.room.name : ''} — loot ${s.lootGot}/${s.lootTotal}, alarm ${Math.round(s.alarm)}%, ${s.mode}`;
  requestAnimationFrame(frame);
}

// Boot.
s.loadRoom(0);
s.mode = 'title';
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  const n = Number(shot);
  if (n >= 1 && n <= 4) applyShot(s, n);
}
window.__gameReady = true;
requestAnimationFrame(frame);
