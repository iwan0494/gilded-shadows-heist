// hud.js — top bar, right panel (alarm / detection / roster / loot / legend /
// controls), dialog strip and clamped callouts. Every label is clamped inside
// the canvas with a margin, so nothing is ever cut by an edge (R3 lesson).
import { W, PLAY, RIGHT, DIALOG, LOOT, LOOT_TOTAL, fmtMoney, fmtClock, alarmWord, alarmColor, GOLD, TEAL } from './config.js';

function bar(ctx, x, y, w, h, frac, color, bg = '#1b2138') {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, Math.max(0, Math.min(1, frac)) * w, h);
}

function clampBox(x, y, w, h, margin = 8) {
  x = Math.max(margin, Math.min(W - w - margin, x));
  y = Math.max(margin, Math.min(720 - h - margin, y));
  return { x, y };
}

export function drawTopBar(ctx, game) {
  ctx.fillStyle = '#10142a';
  ctx.fillRect(0, 0, W, 64);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 64, W, 2);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('GILDED SHADOWS', 16, 28);
  ctx.fillStyle = '#b9c0d8';
  ctx.font = '12px sans-serif';
  ctx.fillText(game.roomName + ' — ' + game.objective, 16, 50);
  // Loot, centre.
  const taken = game.taken.size;
  const value = [...game.taken].reduce((s, id) => {
    const l = LOOT.find((x) => x.id === id);
    return s + (l ? l.value : 0);
  }, 0);
  ctx.fillStyle = '#f2e6c8';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('LOOT ' + taken + '/5 · ' + fmtMoney(value), 640, 26);
  ctx.fillStyle = '#8b93ad';
  ctx.font = '12px sans-serif';
  ctx.fillText('Pebbles ' + game.tools.pebbles + '   Smoke ' + game.tools.smoke, 640, 48);
  // Timers, right.
  ctx.fillStyle = '#f2e6c8';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(fmtClock(game.time), 1264, 28);
  ctx.fillStyle = game.dawn < 60 ? '#e5484d' : TEAL;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('DAWN IN ' + fmtClock(game.dawn), 1264, 50);
  ctx.textAlign = 'left';
}

export function drawRightPanel(ctx, game) {
  const x = RIGHT.x, w = RIGHT.w;
  let y = RIGHT.y;
  ctx.fillStyle = 'rgba(13,17,34,0.92)';
  ctx.fillRect(x, y, w, RIGHT.h);
  ctx.strokeStyle = 'rgba(217,164,65,0.35)';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, RIGHT.h - 1);

  const pad = 12;
  const label = (t, yy) => {
    ctx.fillStyle = '#8b93ad';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(t, x + pad, yy);
  };
  const row = (t, v, yy, vc = '#dfe4f2') => {
    ctx.fillStyle = '#8b93ad';
    ctx.font = '11px sans-serif';
    ctx.fillText(t, x + pad, yy);
    ctx.fillStyle = vc;
    ctx.textAlign = 'right';
    ctx.fillText(v, x + w - pad, yy);
    ctx.textAlign = 'left';
  };

  // ALARM
  label('ALARM', y + 14);
  bar(ctx, x + pad, y + 20, w - pad * 2, 10, game.alarm / 100, alarmColor(game.alarm));
  ctx.fillStyle = alarmColor(game.alarm);
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText(alarmWord(game.alarm) + ' ' + Math.round(game.alarm) + '%', x + pad, y + 44);
  // DETECTION (nearest guard)
  label('DETECTION — nearest guard', y + 60);
  bar(ctx, x + pad, y + 66, w - pad * 2, 8, game.nearestMeter / 100, game.nearestMeter > 60 ? '#e5484d' : TEAL);
  ctx.fillStyle = '#dfe4f2';
  ctx.font = '12px sans-serif';
  ctx.fillText(game.nearestName + ' · ' + Math.round(game.nearestMeter) + '%', x + pad, y + 88);
  ctx.fillStyle = '#8b93ad';
  ctx.font = '11px sans-serif';
  ctx.fillText(game.detectReason, x + pad, y + 102);
  // STATUS
  label('STATUS', y + 120);
  row('VISIBILITY', game.player.inShadow ? 'SHADOW — hidden' : 'LIT — exposed', y + 136);
  row('NOISE', game.noiseWord, y + 150);
  row('MOVE', game.player.sneaking ? 'Sneaking' : game.player.moving ? 'Walking' : 'Still', y + 164);
  // ROSTER
  label('ROSTER', y + 182);
  let ry = y + 198;
  for (const g of game.guards) {
    const st = g.state === 'alert' ? 'ALERT' : g.state === 'investigate' ? 'SEARCHING' : g.meter >= 40 ? 'SUSPICIOUS' : g.state === 'search' ? 'SEARCHING' : 'PATROLLING';
    const sc = g.state === 'alert' ? '#e5484d' : g.meter >= 40 ? '#e8a13c' : '#8b93ad';
    ctx.fillStyle = g.color;
    ctx.beginPath();
    ctx.arc(x + pad + 4, ry - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#dfe4f2';
    ctx.font = '12px sans-serif';
    ctx.fillText(g.short, x + pad + 14, ry);
    ctx.fillStyle = sc;
    ctx.textAlign = 'right';
    ctx.fillText(st, x + w - pad, ry);
    ctx.textAlign = 'left';
    ry += 16;
  }
  // LOOT
  label('LOOT — ' + fmtMoney(LOOT_TOTAL) + ' total', ry + 6);
  ry += 22;
  for (const l of LOOT) {
    const got = game.taken.has(l.id);
    ctx.fillStyle = got ? TEAL : '#8b93ad';
    ctx.font = '12px sans-serif';
    ctx.fillText((got ? '✓ ' : '○ ') + l.name, x + pad, ry);
    ctx.fillStyle = got ? '#dfe4f2' : '#8b93ad';
    ctx.textAlign = 'right';
    ctx.fillText(fmtMoney(l.value), x + w - pad, ry);
    ctx.textAlign = 'left';
    ry += 16;
  }
  // LEGEND
  label('LEGEND', ry + 6);
  ry += 22;
  const leg = [
    ['#e8b64c', 'Guard cone — calm'], ['#e8a13c', 'Cone — suspicious'],
    ['#e5484d', 'Cone — ALERT'], ['#e5484d', 'Camera sweep'],
    [GOLD, 'Loot — hold E to steal'], [TEAL, 'Exit — opens with Sunflower'],
  ];
  for (const [c, t] of leg) {
    ctx.fillStyle = c;
    ctx.fillRect(x + pad, ry - 9, 10, 10);
    ctx.fillStyle = '#b9c0d8';
    ctx.font = '11px sans-serif';
    ctx.fillText(t, x + pad + 16, ry);
    ry += 13;
  }
  // CONTROLS
  label('CONTROLS', ry + 6);
  ry += 20;
  ctx.fillStyle = '#8b93ad';
  ctx.font = '11px sans-serif';
  const controls = [
    'WASD / arrows — move', 'SHIFT — sneak (silent)', 'Click — throw pebble',
    'E (hold) — steal / pick', 'Q — smoke · H — notes · ESC — pause',
  ];
  for (const c of controls) { ctx.fillText(c, x + pad, ry); ry += 13; }
}

// Dialog strip: handler voice in the player's ear.
export function drawDialog(ctx, who, text) {
  ctx.fillStyle = 'rgba(13,17,34,0.95)';
  ctx.fillRect(DIALOG.x, DIALOG.y, DIALOG.w, DIALOG.h);
  ctx.strokeStyle = 'rgba(217,164,65,0.35)';
  ctx.strokeRect(DIALOG.x + 0.5, DIALOG.y + 0.5, DIALOG.w - 1, DIALOG.h - 1);
  const col = who === 'JINX' ? GOLD : TEAL;
  ctx.fillStyle = col;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(who + ' ▸', DIALOG.x + 16, DIALOG.y + 35);
  ctx.fillStyle = '#e8ecf7';
  ctx.font = 'italic 15px Georgia, serif';
  ctx.fillText(text, DIALOG.x + 110, DIALOG.y + 35);
}

// Callout: leader line from a world anchor to a label box, clamped on-canvas.
export function drawCallout(ctx, ax, ay, text, dx, dy) {
  ctx.font = 'bold 12px sans-serif';
  const tw = ctx.measureText(text).width + 18;
  const th = 26;
  const pos = clampBox(ax + dx - tw / 2, ay + dy - th / 2, tw, th);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(ax, ay);
  const cx = Math.max(pos.x, Math.min(pos.x + tw, ax));
  const cy = Math.max(pos.y, Math.min(pos.y + th, ay));
  ctx.lineTo(cx, cy);
  ctx.stroke();
  ctx.fillStyle = 'rgba(13,17,34,0.95)';
  ctx.fillRect(pos.x, pos.y, tw, th);
  ctx.strokeStyle = GOLD;
  ctx.strokeRect(pos.x + 0.5, pos.y + 0.5, tw - 1, th - 1);
  ctx.fillStyle = '#f2e6c8';
  ctx.textAlign = 'center';
  ctx.fillText(text, pos.x + tw / 2, pos.y + 18);
  ctx.textAlign = 'left';
  ctx.lineWidth = 1;
}
