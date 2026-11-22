// GILDED SHADOWS — screenshot staging: deterministic setups for ?shot=1..4.
// Each shot places the thief, the guards and the cameras by hand, fixes the
// alarm, the loot count and the timer, and freezes the game so the render is
// the same every time. Coordinates here are field-local; callouts are given
// in canvas pixels (field offset +16, +76).

import { FIELD, TUNING } from './config.js';
import { inShadow } from './world.js';

const CX = (x) => FIELD.x + x;
const CY = (y) => FIELD.y + y;

function setGuard(g, x, y, dir, state, detect) {
  g.x = x;
  g.y = y;
  g.dir = dir;
  g.state = state;
  g.detect = detect;
  g.investigate = null;
  g.lastSeen = null;
}

function setCamera(c, blindLeft) {
  c.blindLeft = blindLeft;
}

export function applyShot(s, n) {
  s.mode = 'shot';
  s.showNotes = false;
  s.callouts = [];
  // Freeze the sweep clock so every render of the shot is identical.
  s.now = 12.5;

  if (n === 1) {
    // COVER — Atrium: the thief in shadow behind the marble statue, two
    // amber cones, one red camera arc, the Sunflower glowing gold.
    s.roomIndex = 0;
    s.loadRoom(0);
    s.player.x = 150;
    s.player.y = 450;
    s.player.dir = -Math.PI / 2;
    setGuard(s.guards[0], 350, 200, Math.PI / 2, 'calm', 12);
    setGuard(s.guards[1], 700, 200, Math.PI, 'calm', 8);
    setCamera(s.cameras[0], 0);
    s.alarm = 0;
    s.timer = 71;
    s.callouts = [
      { x: CX(980), y: CY(70), text: 'Camera — sweeping arc' },
      { x: CX(350), y: CY(200), text: 'Vision cone — stay out of it' },
      { x: CX(509), y: CY(52), text: 'The Midnight Sunflower' },
    ];
  } else if (n === 2) {
    // PLAY — Gallery: a guard, suspicious, walks to the pebble's noise ring
    // while a camera watches and the alarm sits at amber.
    s.roomIndex = 1;
    s.loadRoom(1);
    s.player.x = 600;
    s.player.y = 380;
    s.player.dir = Math.PI;
    s.player.noise = 0.4;
    s.room.loot[0].taken = true; // Emerald Scarab
    s.lootGot = 2; // Sunflower + Emerald
    setGuard(s.guards[0], 430, 280, Math.atan2(300 - 280, 500 - 430), 'suspicious', 55);
    s.guards[0].investigate = { x: 500, y: 300 };
    s.guards[0].lastSeen = { x: 500, y: 300 };
    setGuard(s.guards[1], 850, 200, Math.PI / 2, 'calm', 18);
    setCamera(s.cameras[0], 0);
    setCamera(s.cameras[1], 0);
    s.tools.pebbles = 3;
    s.tools.pebble = { sx: 600, sy: 380, x: 500, y: 300, tx: 500, ty: 300, t: 1, landed: true, ring: 0.9 };
    s.alarm = 35;
    s.timer = 157;
    s.callouts = [
      { x: CX(500), y: CY(300), text: 'Pebble — the guard heard it' },
      { x: CX(430), y: CY(280), text: 'SUSPICIOUS — investigating' },
      { x: CX(40), y: CY(296), text: 'Camera — it sees the lit floor' },
    ];
  } else if (n === 3) {
    // HIDE — Vault: a red cone sweeps past the thief, who waits inside
    // smoke while the nearest camera sits blind.
    s.roomIndex = 2;
    s.loadRoom(2);
    s.player.x = 509;
    s.player.y = 300;
    s.player.dir = -Math.PI / 2;
    s.room.loot[0].taken = true; // Crown
    s.lootGot = 4; // Sunflower + Emerald + Ruby + Crown
    setGuard(s.guards[0], 300, 300, 0, 'calm', 22);
    setGuard(s.guards[1], 509, 470, -Math.PI / 2, 'alert', 95);
    s.guards[1].lastSeen = { x: 509, y: 300 };
    setCamera(s.cameras[0], 5);
    setCamera(s.cameras[1], 0);
    s.tools.smoke = 1;
    s.tools.smokes = [{ x: 509, y: 300, left: 4.5 }];
    s.alarm = 55;
    s.timer = 238;
    s.callouts = [
      { x: CX(509), y: CY(300), text: 'Smoke — cameras cannot see in' },
      { x: CX(509), y: CY(470), text: 'ALERT cone — wait it out' },
      { x: CX(40), y: CY(70), text: 'Camera — BLIND' },
    ];
  } else {
    // EXIT — Getaway: 5/5 loot, the exit open and green, one last cone
    // to time, the alarm falling.
    s.roomIndex = 2;
    s.loadRoom(2);
    for (const l of s.room.loot) l.taken = true;
    s.lootGot = 5;
    s.player.x = 800;
    s.player.y = 545;
    s.player.dir = Math.PI / 2;
    setGuard(s.guards[0], 700, 300, Math.PI / 2, 'calm', 30);
    setGuard(s.guards[1], 509, 200, Math.PI, 'calm', 10);
    setCamera(s.cameras[0], 0);
    setCamera(s.cameras[1], 0);
    s.alarm = 18;
    s.timer = 281;
    s.callouts = [
      { x: CX(880), y: CY(576), text: 'EXIT OPEN — run for it' },
      { x: CX(700), y: CY(300), text: 'One last cone to time' },
      { x: CX(800), y: CY(545), text: 'Loot 5/5 — everything bagged' },
    ];
  }
  // The alarm meter and the HUD read these directly; visibility is computed
  // from where the thief actually stands, so shot 1 reads SHADOW, not LIT.
  s.detection = Math.max(0, ...s.guards.map((g) => g.detect));
  s.inShadowNow = inShadow(s.player.x, s.player.y, s.room);
  s.smokedNow = s.tools.smokes.length > 0;
}
