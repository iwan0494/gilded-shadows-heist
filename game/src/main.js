// main.js — the game loop and state machine: title / play / caught / win.
// Live play only; staged screenshots (?shot=N) render one frozen frame.
import { W, H, MISSION_SECONDS } from './config.js';
import { buildRoom, losBlockers } from './world.js';
import { makePlayer, updatePlayer, updateInteract } from './player.js';
import { makeTools, throwPebble, dropSmoke, updateTools } from './tools.js';
import { updateGuard, hearNoise, guardSees } from './guards.js';
import { updateCamera, cameraSees } from './cameras.js';
import { makeInput } from './input.js';
import { render } from './render.js';
import { stageShot } from './shots.js';
import { initAudio, toggleMute, sfx } from './audio.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
const input = makeInput(canvas);

function freshGame() {
  const roomObj = buildRoom('atrium');
  const game = {
    mode: 'title', room: 'atrium', roomObj, roomName: roomObj.name,
    objective: 'Steal the Midnight Sunflower',
    time: 0, dawn: MISSION_SECONDS, alarm: 0, spotted: false, alarmHistory: [],
    taken: new Set(), sunflower: false, stageSunflower: false,
    player: makePlayer(520, 560), tools: makeTools(),
    guards: roomObj.guards, dialog: { who: 'WREN', text: 'Three rooms. Five pieces. One way out. Go.' },
    callouts: [], nearestMeter: 0, nearestName: '—',
    detectReason: 'HIDDEN — shadow', noiseWord: 'SILENT',
    paused: false, notes: false, caughtBy: null, winTime: 0,
    changeRoom(to, from) {
      const next = buildRoom(to);
      this.room = to;
      this.roomObj = next;
      this.roomName = next.name;
      this.guards = next.guards;
      const e = from === 'north' ? next.entryNorth : next.entrySouth;
      this.player.x = e.x; this.player.y = e.y;
      this.player.doorCool = 1.2;
      this.dialog = { who: 'WREN', text: to === 'vault' ? 'The Vault. Lasers on the Sunflower — mind the gap.' : to === 'gallery' ? 'The Gallery. Dara walks the middle — stay low.' : 'Back in the Atrium. The exit is yours once the flower is.' };
    },
  };
  return game;
}

let game = freshGame();

function setStatus() {
  if (statusEl) statusEl.textContent = game.paused ? 'paused' : game.mode;
}

function nearestGuard() {
  let best = null, bd = 1e9;
  for (const g of game.guards) {
    const d = Math.hypot(g.x - game.player.x, g.y - game.player.y);
    if (d < bd) { bd = d; best = g; }
  }
  return best;
}

function update(dt) {
  if (game.mode !== 'play' || game.paused) return;
  game.time += dt;
  game.dawn = Math.max(0, game.dawn - dt);
  if (game.dawn <= 0 && game.alarm < 85) {
    game.alarm = 85;
    game.dialog = { who: 'WREN', text: 'Dawn patrol — they are early. Run!' };
  }
  const blockers = losBlockers(game.roomObj);
  const p = game.player;
  const inp = input.read();

  // Pebble: click to throw at the mouse point.
  const click = input.takeClick();
  if (click && game.mode === 'play') {
    initAudio();
    const noise = throwPebble(game.tools, p.x, p.y, click.x, click.y);
    if (noise) {
      hearNoise(game.guards, noise);
      game.detectReason = 'HEARD — pebble';
      sfx.pebble();
    }
  }
  if (input.wasPressed('q') || input.wasPressed('Q')) {
    if (dropSmoke(game.tools, p.x, p.y)) {
      for (const c of game.roomObj.cameras) {
        if (Math.hypot(c.x - p.x, c.y - p.y) < 320) c.blind = 6;
      }
      sfx.smoke();
    }
  }

  const noise = updatePlayer(p, inp, dt, game.roomObj, game);
  if (noise) hearNoise(game.guards, noise);
  updateInteract(p, inp, dt, game.roomObj, game);
  updateTools(game.tools, dt);

  for (const g of game.guards) updateGuard(g, dt, p, game.roomObj, game, blockers);
  for (const c of game.roomObj.cameras) {
    updateCamera(c, dt);
    if (cameraSees(c, p.x, p.y, blockers)) {
      game.alarm = Math.min(100, game.alarm + 10 * dt);
      game.detectReason = 'SEEN — camera';
    }
  }
  // Alarm drifts: rises while any guard is hot, falls when the house calms.
  const hot = game.guards.some((g) => g.meter > 40 || g.state === 'alert');
  game.alarm = Math.max(0, Math.min(100, game.alarm + (hot ? 2.5 : -3) * dt));
  if (game.alarm >= 70 && !game.alarmHistory.includes('ALARMED')) game.alarmHistory.push('ALARMED');

  const near = nearestGuard();
  if (near) {
    game.nearestMeter = near.meter;
    game.nearestName = near.short;
    const see = guardSees(near, p.x, p.y, blockers, p.sneaking);
    if (see.kind === 'focus') game.detectReason = 'SEEN — in cone, lit';
    else if (see.kind === 'periph') game.detectReason = 'SEEN — edge of vision';
    else if (p.inShadow) game.detectReason = 'HIDDEN — shadow';
  }
  game.noiseWord = p.moving && !p.sneaking ? 'Soft steps' : 'SILENT';
  game.roomObj.exit && (game.roomObj.exit.open = game.sunflower);

  if (game.caughtBy) {
    game.mode = 'caught';
    sfx.caught();
    setStatus();
  } else if (game.mode === 'win') {
    sfx.win();
    setStatus();
  }
}

function loop(ts) {
  const dt = Math.min(0.05, (ts - loop.last) / 1000 || 0.016);
  loop.last = ts;
  // One-shot keys.
  if (input.wasPressed('Enter')) {
    initAudio();
    if (game.mode === 'title') { game.mode = 'play'; setStatus(); }
  }
  if (input.wasPressed('Escape')) {
    if (game.mode === 'play') { game.paused = !game.paused; setStatus(); }
  }
  if (input.wasPressed('h') || input.wasPressed('H')) game.notes = !game.notes;
  if (input.wasPressed('m') || input.wasPressed('M')) toggleMute();
  if (input.wasPressed('r') || input.wasPressed('R')) {
    if (game.mode === 'caught' || game.mode === 'win') { game = freshGame(); game.mode = 'play'; setStatus(); }
  }
  update(dt);
  render(ctx, game, ts);
  requestAnimationFrame(loop);
}

function boot() {
  const params = new URLSearchParams(window.location.search);
  const shot = Number(params.get('shot') || 0);
  if (shot >= 1 && shot <= 4) {
    // Staged screenshot: one frozen frame, fixed time — byte-deterministic.
    game = stageShot(shot);
    setStatus();
    render(ctx, game, shot * 1000);
    window.__gameReady = true;
    return;
  }
  canvas.addEventListener('mousedown', () => {
    initAudio();
    if (game.mode === 'title') { game.mode = 'play'; setStatus(); }
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && game.mode === 'title') { initAudio(); game.mode = 'play'; setStatus(); }
  });
  loop.last = performance.now();
  requestAnimationFrame(loop);
  setStatus();
  window.__gameReady = true;
}

boot();
