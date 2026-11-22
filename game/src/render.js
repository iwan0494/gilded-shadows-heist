// GILDED SHADOWS — everything the eye sees: the marble floor, the red
// carpet, the dark corners, the guards and their cones, the sweeping
// cameras, the thief, and the title / caught / win screens.

import { FIELD, PALETTE, TUNING, CANVAS_W, CANVAS_H } from './config.js';
import { cameraAngle } from './cameras.js';
import { drawTopBar, drawPanel, drawBottomBar, drawCallouts } from './hud.js';

function conePath(ctx, x, y, dir, half, range) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, dir - half, dir + half);
  ctx.closePath();
}

function drawFloor(ctx, room) {
  // Marble tiles.
  for (let ty = 0; ty < 8; ty++) {
    for (let tx = 0; tx < 14; tx++) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.floor : PALETTE.floorAlt;
      ctx.fillRect(FIELD.x + tx * 73, FIELD.y + ty * 74, 73, 74);
    }
  }
  ctx.strokeStyle = 'rgba(184, 178, 164, 0.12)';
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= 14; tx++) {
    ctx.beginPath();
    ctx.moveTo(FIELD.x + tx * 73, FIELD.y);
    ctx.lineTo(FIELD.x + tx * 73, FIELD.y + FIELD.h);
    ctx.stroke();
  }
  for (let ty = 0; ty <= 8; ty++) {
    ctx.beginPath();
    ctx.moveTo(FIELD.x, FIELD.y + ty * 74);
    ctx.lineTo(FIELD.x + FIELD.w, FIELD.y + ty * 74);
    ctx.stroke();
  }
  // Red carpet strips.
  for (const c of room.carpet) {
    ctx.fillStyle = PALETTE.carpet;
    ctx.fillRect(FIELD.x + c.x, FIELD.y + c.y, c.w, c.h);
    ctx.strokeStyle = PALETTE.carpetEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(FIELD.x + c.x + 1, FIELD.y + c.y + 1, c.w - 2, c.h - 2);
    ctx.strokeStyle = 'rgba(242, 193, 78, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(FIELD.x + c.x + c.w / 2, FIELD.y + c.y + 6);
    ctx.lineTo(FIELD.x + c.x + c.w / 2, FIELD.y + c.y + c.h - 6);
    ctx.stroke();
  }
  // Shadow zones: pools of dark where a cone barely reaches.
  for (const s of room.shadows) {
    ctx.fillStyle = 'rgba(8, 6, 14, 0.55)';
    ctx.fillRect(FIELD.x + s.x, FIELD.y + s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(120, 110, 160, 0.25)';
    ctx.setLineDash([6, 5]);
    ctx.strokeRect(FIELD.x + s.x + 0.5, FIELD.y + s.y + 0.5, s.w - 1, s.h - 1);
    ctx.setLineDash([]);
    ctx.fillStyle = 'rgba(150, 140, 190, 0.5)';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SHADOW', FIELD.x + s.x + 8, FIELD.y + s.y + 6);
  }
}

function drawWalls(ctx, room) {
  ctx.strokeStyle = PALETTE.wallTop;
  ctx.lineWidth = 3;
  ctx.strokeRect(FIELD.x + 1.5, FIELD.y + 1.5, FIELD.w - 3, FIELD.h - 3);
  for (const w of room.walls) {
    ctx.fillStyle = PALETTE.wall;
    ctx.fillRect(FIELD.x + w.x, FIELD.y + w.y, w.w, w.h);
    ctx.fillStyle = PALETTE.wallTop;
    ctx.fillRect(FIELD.x + w.x, FIELD.y + w.y, w.w, 5);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(FIELD.x + w.x + 0.5, FIELD.y + w.y + 0.5, w.w - 1, w.h - 1);
  }
}

function drawStatues(ctx, room) {
  for (const s of room.statues) {
    const x = FIELD.x + s.x;
    const y = FIELD.y + s.y;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 4, y + 6, s.r + 2, s.r * 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.statue;
    ctx.beginPath();
    ctx.arc(x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#b5aea2';
    ctx.beginPath();
    ctx.arc(x, y, s.r * 0.55, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#6d675e';
    ctx.beginPath();
    ctx.arc(x, y - s.r * 0.15, s.r * 0.28, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawLoot(ctx, room, now) {
  for (const l of room.loot) {
    if (l.taken) continue;
    const x = FIELD.x + l.x;
    const y = FIELD.y + l.y;
    const pulse = 0.35 + 0.2 * Math.sin(now * 3 + l.x);
    ctx.fillStyle = `rgba(242, 193, 78, ${pulse})`;
    ctx.beginPath();
    ctx.arc(x, y, 30, 0, Math.PI * 2);
    ctx.fill();
    if (l.kind === 'painting') {
      ctx.fillStyle = '#1d2a1a';
      ctx.fillRect(x - 34, y - 22, 68, 44);
      ctx.strokeStyle = PALETTE.gold;
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 34, y - 22, 68, 44);
      // A sunflower: dark centre, gold petals.
      ctx.fillStyle = '#3a2a10';
      ctx.beginPath();
      ctx.arc(x, y, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = PALETTE.goldBright;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        ctx.beginPath();
        ctx.ellipse(x + Math.cos(a) * 13, y + Math.sin(a) * 13, 6, 3.5, a, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (l.kind === 'crown') {
      ctx.fillStyle = PALETTE.goldBright;
      ctx.beginPath();
      ctx.moveTo(x - 16, y + 10);
      ctx.lineTo(x - 16, y - 6);
      ctx.lineTo(x - 8, y + 2);
      ctx.lineTo(x, y - 12);
      ctx.lineTo(x + 8, y + 2);
      ctx.lineTo(x + 16, y - 6);
      ctx.lineTo(x + 16, y + 10);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#7a1f2b';
      ctx.beginPath();
      ctx.arc(x, y - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Gem in a glass case.
      ctx.strokeStyle = 'rgba(220, 230, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.strokeRect(x - 16, y - 16, 32, 32);
      ctx.fillStyle = l.kind === 'gem' && l.id === 'emerald' ? '#2fae6a' : l.id === 'ruby' ? '#c83246' : '#3a7bd9';
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 9, y);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 9, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 4, y - 2);
      ctx.lineTo(x - 4, y - 2);
      ctx.closePath();
      ctx.fill();
    }
    if (l.locked) {
      ctx.fillStyle = PALETTE.text;
      ctx.font = 'bold 10px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('LOCKED — hold E', x, y + 34);
    }
  }
}

function drawDoors(ctx, room, lootGot, lootTotal) {
  if (room.door) {
    const d = room.door;
    const open = room.loot.every((l) => l.taken);
    ctx.fillStyle = open ? PALETTE.exitGreen : '#5a5148';
    ctx.fillRect(FIELD.x + d.x, FIELD.y + d.y, d.w, d.h);
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(open ? 'DOOR OPEN — next room' : 'DOOR LOCKED — clear the room', FIELD.x + d.x + d.w / 2, FIELD.y + d.y + d.h / 2);
  }
  if (room.exit) {
    const e = room.exit;
    const open = lootGot >= lootTotal;
    ctx.fillStyle = open ? PALETTE.exitGreen : '#5a5148';
    ctx.fillRect(FIELD.x + e.x, FIELD.y + e.y, e.w, e.h);
    ctx.fillStyle = '#0c0a12';
    ctx.font = 'bold 12px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(open ? 'EXIT OPEN — RUN!' : 'EXIT — needs 5/5', FIELD.x + e.x + e.w / 2, FIELD.y + e.y + e.h / 2);
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    const x = FIELD.x + g.x;
    const y = FIELD.y + g.y;
    const color =
      g.state === 'alert' ? PALETTE.coneAlert : g.state === 'suspicious' ? PALETTE.coneSuspicious : PALETTE.coneCalm;
    ctx.fillStyle = color;
    conePath(ctx, x, y, g.dir, TUNING.guardHalfAngle, TUNING.guardRange);
    ctx.fill();
    // The guard: a dark uniform, a cap, a small lamp.
    const bob = Math.sin(g.bob) * 1.5;
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(x + 3, y + 8, 12, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = g.state === 'alert' ? PALETTE.guardAlert : PALETTE.guard;
    ctx.beginPath();
    ctx.arc(x, y + bob * 0.3, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20242e';
    ctx.beginPath();
    ctx.arc(x, y - 4 + bob * 0.3, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.gold;
    ctx.fillRect(x - 7, y - 11 + bob * 0.3, 14, 2.5);
    // Detection ring above the head.
    if (g.detect > 2) {
      ctx.strokeStyle = g.state === 'alert' ? PALETTE.alarmHigh : PALETTE.goldBright;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 19, -Math.PI / 2, -Math.PI / 2 + (g.detect / 100) * Math.PI * 2);
      ctx.stroke();
    }
    if (g.state !== 'calm') {
      ctx.fillStyle = g.state === 'alert' ? '#ff5a4a' : PALETTE.goldBright;
      ctx.font = 'bold 16px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(g.state === 'alert' ? '!' : '?', x, y - 24);
    }
  }
}

function drawCameras(ctx, cameras, now) {
  for (const c of cameras) {
    const x = FIELD.x + c.x;
    const y = FIELD.y + c.y;
    const ang = cameraAngle(c, now);
    const blind = c.blindLeft > 0;
    ctx.fillStyle = blind ? PALETTE.cameraBlind : PALETTE.cameraArc;
    conePath(ctx, x, y, ang, TUNING.cameraHalfAngle, c.range);
    ctx.fill();
    // Wall mount + lens.
    ctx.fillStyle = '#2c2836';
    ctx.fillRect(x - 8, y - 8, 16, 16);
    ctx.fillStyle = blind ? '#777' : '#e04030';
    ctx.beginPath();
    ctx.arc(x + Math.cos(ang) * 8, y + Math.sin(ang) * 8, 4.5, 0, Math.PI * 2);
    ctx.fill();
    if (blind) {
      ctx.fillStyle = '#cfc8ba';
      ctx.font = 'bold 11px Georgia, serif';
      ctx.textAlign = 'center';
      // Below the mount: the callout for a blind camera sits above it.
      ctx.fillText('BLIND', x, y + 22);
    }
  }
}

function drawPlayer(ctx, p, room) {
  const x = FIELD.x + p.x;
  const y = FIELD.y + p.y;
  // Noise ring while loud on carpet.
  if (p.noise > 0.6 && p.moving) {
    ctx.strokeStyle = `rgba(232, 120, 40, ${0.5 * (1 - p.noisePulse)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 20 + p.noisePulse * 90, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath();
  ctx.ellipse(x + 3, y + 9, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Cloaked thief with a gold-trimmed hood.
  ctx.fillStyle = PALETTE.player;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.playerTrim;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, 12, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#e8e0cf';
  ctx.beginPath();
  ctx.arc(x + Math.cos(p.dir) * 5, y + Math.sin(p.dir) * 5, 4.5, 0, Math.PI * 2);
  ctx.fill();
  // Aim line toward the mouse while a pebble is ready.
  // Lockpick progress ring.
  if (p.interact) {
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(x, y, 20, -Math.PI / 2, -Math.PI / 2 + p.interact.progress * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = PALETTE.text;
    ctx.font = 'bold 11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(p.interact.loot.kind === 'painting' ? 'Cutting it down…' : 'Picking the lock…', x, y - 30);
  }
}

function drawToolsFx(ctx, tools) {
  for (const s of tools.smokes) {
    const x = FIELD.x + s.x;
    const y = FIELD.y + s.y;
    const a = Math.min(1, s.left / 2);
    ctx.fillStyle = `rgba(200, 200, 210, ${0.35 * a})`;
    ctx.beginPath();
    ctx.arc(x, y, TUNING.smokeRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220, 220, 230, ${0.25 * a})`;
    ctx.beginPath();
    ctx.arc(x - 30, y - 18, 34, 0, Math.PI * 2);
    ctx.arc(x + 34, y + 14, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  const p = tools.pebble;
  if (p) {
    const x = FIELD.x + p.x;
    const y = FIELD.y + p.y;
    if (!p.landed) {
      ctx.fillStyle = '#8f887a';
      ctx.beginPath();
      ctx.arc(x, y - 10, 4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = `rgba(232, 193, 78, ${Math.max(0, 1 - p.ring / 1.6)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, 8 + p.ring * 60, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(8, 6, 14, 0.82)';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 44px Georgia, serif';
  ctx.fillText(title, CANVAS_W / 2, 240);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '17px Georgia, serif';
  let y = 300;
  for (const l of lines) {
    ctx.fillText(l, CANVAS_W / 2, y);
    y += 30;
  }
}

export function drawGame(ctx, s) {
  ctx.fillStyle = PALETTE.bg;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  const room = s.room;
  const now = s.now;

  drawFloor(ctx, room);
  drawWalls(ctx, room);
  drawStatues(ctx, room);
  drawLoot(ctx, room, now);
  drawDoors(ctx, room, s.lootGot, s.lootTotal);
  drawGuards(ctx, s.guards);
  drawCameras(ctx, s.cameras, now);
  drawToolsFx(ctx, s.tools);
  drawPlayer(ctx, s.player, room);

  drawTopBar(ctx, s);
  drawPanel(ctx, s);
  drawBottomBar(ctx, s);
  if (s.callouts) drawCallouts(ctx, s.callouts);

  if (s.mode === 'title') {
    overlay(ctx, 'GILDED SHADOWS', [
      'A night at the museum. One painting. Three rooms. No witnesses.',
      'Sneak past the guards, mind the cameras, steal The Midnight Sunflower,',
      'and slip out the service exit before the alarm fills.',
      '',
      'WASD move · SHIFT sneak · Click throw a pebble · E (hold) steal · Q smoke',
      '',
      'Click anywhere to begin the heist.',
    ], PALETTE.goldBright);
  } else if (s.mode === 'caught') {
    overlay(ctx, 'CAUGHT!', [
      s.caughtReason ?? 'A guard got you.',
      '',
      `Loot carried: ${s.lootGot}/${s.lootTotal}  ·  Time: ${Math.floor(s.timer / 60)}:${String(Math.floor(s.timer % 60)).padStart(2, '0')}`,
      'The room resets. The Sunflower is still waiting.',
      '',
      'Press R to retry the room.',
    ], '#ff5a4a');
  } else if (s.mode === 'win') {
    overlay(ctx, s.ghost ? 'GHOST — CLEAN GETAWAY' : 'THE SUNFLOWER IS YOURS', [
      `Time ${Math.floor(s.timer / 60)}:${String(Math.floor(s.timer % 60)).padStart(2, '0')}  ·  Loot ${s.lootGot}/${s.lootTotal}`,
      s.ghost
        ? 'Never spotted. Not once. The museum never knew you were there.'
        : 'Spotted along the way — but the painting still hangs in your hideout.',
      '',
      'Press R to run it again, cleaner this time.',
    ], PALETTE.goldBright);
  } else if (s.mode === 'paused') {
    overlay(ctx, 'PAUSED', [
      'The guards wait. The cameras keep sweeping.',
      '',
      'ESC resume · R restart room · H field notes',
    ], PALETTE.text);
  }

  if (s.showNotes) {
    ctx.fillStyle = 'rgba(12, 10, 18, 0.94)';
    ctx.fillRect(240, 120, 800, 460);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 2;
    ctx.strokeRect(241, 121, 798, 458);
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.goldBright;
    ctx.font = 'bold 22px Georgia, serif';
    ctx.fillText('FIELD NOTES — the crew’s plan', 280, 170);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '15px Georgia, serif';
    const notes = [
      '• The Sunflower hangs in the Atrium, north wall. Cut it down with E —',
      '  it takes a moment, and the guard on the carpet hears everything.',
      '• SHADOW hides you: a cone barely reaches into the dark. LIT floor is',
      '  the opposite — a camera sees you from across the room.',
      '• Red carpet is LOUD when you walk it. Sneak, or go around.',
      '• A pebble (click) sends the nearest guard to investigate the noise.',
      '• Smoke (Q) blinds cameras and guards for a few seconds. You only',
      '  carry two — save one for the Vault.',
      '• Locked cases need a lockpick (hold E). It rattles sometimes.',
      '• The exit opens only at 5/5 loot. GHOST means never spotted at all.',
    ];
    let y = 210;
    for (const n of notes) {
      ctx.fillText(n, 280, y);
      y += 30;
    }
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = 'italic 14px Georgia, serif';
    ctx.fillText('Press H to close.', 280, 540);
  }
}
