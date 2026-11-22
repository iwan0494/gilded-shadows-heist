// shots.js — deterministic staging for the four screenshots (?shot=1..4).
// Each shot is a frozen moment: fixed positions, meters and dialog, so a
// re-render is byte-identical. Live play never uses these.
import { buildRoom } from './world.js';
import { makeTools } from './tools.js';
import { makePlayer } from './player.js';

function base(roomId) {
  const roomObj = buildRoom(roomId);
  return {
    mode: 'play', room: roomId, roomObj, roomName: roomObj.name,
    objective: 'Steal the Midnight Sunflower',
    time: 0, dawn: 300, alarm: 0, spotted: false, alarmHistory: [],
    taken: new Set(), sunflower: false, stageSunflower: false,
    player: makePlayer(200, 560), tools: makeTools(),
    guards: roomObj.guards, dialog: null, callouts: [],
    nearestMeter: 0, nearestName: '—', detectReason: 'HIDDEN — shadow',
    noiseWord: 'SILENT', paused: false, notes: false,
    caughtBy: null, winTime: 0,
    changeRoom() { /* staged shots never change rooms */ },
  };
}

function pose(g, x, y, dir, meter, state, extra = {}) {
  g.x = x; g.y = y; g.dir = dir; g.meter = meter; g.state = state;
  Object.assign(g, extra);
  return g;
}

function shot1() {
  const s = base('atrium');
  s.mode = 'title';
  return s;
}

function shot2() {
  const s = base('atrium');
  s.time = 121; s.dawn = 229; s.alarm = 35;
  s.taken = new Set(['scarab']);
  s.roomObj.cases[0].empty = true; // Scarab case — already empty
  s.objective = 'Steal the Midnight Sunflower';
  const [marlow, kell] = s.guards;
  pose(marlow, 500, 470, Math.PI, 45, 'patrol', { turnIn: 2, wp: 3 });
  pose(kell, 940, 300, Math.PI / 2, 0, 'patrol', { turnIn: 4, wp: 1 });
  s.player.x = 180; s.player.y = 560; s.player.dir = Math.PI / 4;
  s.player.sneaking = true; s.player.inShadow = true; s.player.moving = false;
  s.nearestMeter = 45; s.nearestName = 'MARLOW'; s.detectReason = 'HEARD — pebble';
  s.dialog = { who: 'WREN', text: 'Marlow heard something — hold still.' };
  s.callouts = [
    { ax: 500, ay: 470, text: 'Marlow — ? suspicious', dx: -140, dy: -70 },
    { ax: 180, ay: 560, text: 'Detection — builds with light, distance, speed', dx: 210, dy: -90 },
    { ax: 950, ay: 230, text: 'Camera — sweeping arc', dx: -160, dy: 40 },
  ];
  return s;
}

function shot3() {
  const s = base('vault');
  s.time = 238; s.dawn = 62; s.alarm = 55;
  // Sunflower just taken (4/5); the Sapphires case is still full, on the right.
  s.taken = new Set(['sunflower', 'scarab', 'idol', 'crown']);
  s.sunflower = true;
  s.stageSunflower = true; // the prize stays visible on its pedestal for the shot
  s.roomObj.cases[0].empty = false;
  s.objective = 'Sunflower secured — get to the exit!';
  const [voss, kell] = s.guards;
  pose(voss, 566, 428, Math.PI * 0.75, 92, 'alert', { target: { x: 520, y: 380 } });
  pose(kell, 840, 600, Math.PI, 0, 'patrol', { turnIn: 5, wp: 0 }); // far from the door label
  s.roomObj.cameras[0].blind = 6; // smoke did its job
  s.tools.clouds.push({ x: 96, y: 190, r: 78, ttl: 6 }); // the smoke that blinded it
  s.player.x = 520; s.player.y = 380; s.player.dir = -Math.PI / 2;
  s.player.inShadow = false; s.player.moving = true;
  s.nearestMeter = 92; s.nearestName = 'VOSS'; s.detectReason = 'SEEN — in cone, lit';
  s.noiseWord = 'SILENT';
  s.dialog = { who: 'WREN', text: 'The Sunflower is yours — now get to the exit!' };
  s.callouts = [
    { ax: 520, ay: 318, text: 'Sunflower — bobbing, guarded by lasers', dx: -190, dy: -60 },
    { ax: 566, ay: 428, text: 'ALERT cone — wait it out', dx: 120, dy: -70 },
    { ax: 64, ay: 230, text: 'Camera — BLIND', dx: 90, dy: 60 },
  ];
  return s;
}

function shot4() {
  const s = base('atrium');
  s.time = 281; s.dawn = 19; s.alarm = 100;
  s.taken = new Set(['sunflower', 'scarab', 'idol', 'crown', 'sapphires']);
  s.sunflower = true;
  s.roomObj.exit.open = true;
  s.roomObj.cases[0].empty = true;
  s.objective = 'Sunflower secured — get to the exit!';
  const [marlow, kell] = s.guards;
  pose(marlow, 480, 380, Math.PI * 0.25, 95, 'alert', { target: { x: 520, y: 500 } });
  pose(kell, 760, 250, Math.PI * 0.75, 60, 'alert', { target: { x: 520, y: 500 } });
  s.player.x = 520; s.player.y = 500; s.player.dir = Math.PI / 2;
  s.player.inShadow = false; s.player.moving = true;
  s.nearestMeter = 95; s.nearestName = 'MARLOW'; s.detectReason = 'SEEN — in cone, lit';
  s.noiseWord = 'Soft steps';
  s.dialog = { who: 'JINX', text: "Engine's running — go go go!" };
  s.callouts = [
    { ax: 480, ay: 380, text: 'Alarm — the whole museum is awake', dx: 60, dy: -80 },
    { ax: 520, ay: 540, text: 'Escape route — follow the green', dx: 150, dy: 30 },
    { ax: 530, ay: 597, text: 'Exit pad — Jinx is waiting', dx: -190, dy: 40 },
  ];
  return s;
}

export function stageShot(n) {
  if (n === 1) return shot1();
  if (n === 2) return shot2();
  if (n === 3) return shot3();
  return shot4();
}
