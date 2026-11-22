// GILDED SHADOWS — the HUD: top bar, right panel, bottom bar, and the
// in-world callouts. Callout boxes are clamped fully inside the canvas so
// no label is ever cut off at an edge.

import { CANVAS_W, FIELD, PANEL, TOPBAR, BOTBAR, PALETTE } from './config.js';

export const BOT_BUTTONS = [
  { id: 'pause', label: 'II Pause', x: BOTBAR.x + 8, w: 110 },
  { id: 'restart', label: 'R Restart', x: BOTBAR.x + 126, w: 120 },
  { id: 'notes', label: 'H Notes', x: BOTBAR.x + 254, w: 100 },
  { id: 'mute', label: 'M Mute', x: BOTBAR.x + 362, w: 96 },
];

export function fmtTime(sec) {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function bar(ctx, x, y, w, h, frac, fill, bg = '#241f2e') {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = 'rgba(232,224,207,0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function alarmLabel(alarm) {
  if (alarm >= 80) return 'ALARMED';
  if (alarm >= 35) return 'SUSPICIOUS';
  return 'QUIET';
}

function alarmColor(alarm) {
  if (alarm >= 80) return PALETTE.alarmHigh;
  if (alarm >= 35) return PALETTE.alarmMid;
  return PALETTE.alarmQuiet;
}

export function drawTopBar(ctx, s) {
  const b = TOPBAR;
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);

  ctx.fillStyle = PALETTE.goldBright;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('GILDED SHADOWS', b.x + 14, b.y + 18);

  ctx.fillStyle = PALETTE.text;
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`${s.room.name}  —  ${s.room.objective}`, b.x + 14, b.y + 42);

  ctx.textAlign = 'right';
  ctx.font = 'bold 15px Georgia, serif';
  ctx.fillStyle = PALETTE.goldBright;
  ctx.fillText(`LOOT ${s.lootGot}/${s.lootTotal}`, b.x + b.w - 260, b.y + 18);
  ctx.fillStyle = PALETTE.text;
  ctx.font = '13px Georgia, serif';
  ctx.fillText(`Pebbles ${s.tools.pebbles}   Smoke ${s.tools.smoke}`, b.x + b.w - 260, b.y + 42);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 20px Georgia, serif';
  ctx.fillText(fmtTime(s.timer), b.x + b.w - 14, b.y + 30);
}

export function drawPanel(ctx, s) {
  const p = PANEL;
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(p.x, p.y, p.w, p.h);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);

  let y = p.y + 18;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.fillText('ALARM', p.x + 12, y);
  y += 16;
  bar(ctx, p.x + 12, y, p.w - 24, 16, s.alarm / 100, alarmColor(s.alarm));
  y += 28;
  ctx.fillStyle = alarmColor(s.alarm);
  ctx.font = 'bold 14px Georgia, serif';
  ctx.fillText(`${alarmLabel(s.alarm)}  ${Math.round(s.alarm)}%`, p.x + 12, y);
  y += 30;

  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.fillText('DETECTION — nearest guard', p.x + 12, y);
  y += 16;
  bar(ctx, p.x + 12, y, p.w - 24, 10, s.detection / 100, s.detection > 88 ? PALETTE.alarmHigh : s.detection > 45 ? PALETTE.alarmMid : PALETTE.gold);
  y += 34;

  const rows = [
    ['VISIBILITY', s.smoked ? 'IN SMOKE' : s.inShadow ? 'SHADOW — hidden' : 'LIT — exposed'],
    ['NOISE', s.noise > 0.6 ? 'LOUD — carpet!' : s.noise > 0.15 ? 'Soft steps' : 'SILENT'],
    ['MOVE', s.sneaking ? 'Sneaking' : 'Walking'],
  ];
  for (const [k, v] of rows) {
    ctx.fillStyle = PALETTE.textDim;
    ctx.font = 'bold 11px Georgia, serif';
    ctx.fillText(k, p.x + 12, y);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '12px Georgia, serif';
    ctx.fillText(v, p.x + 86, y);
    y += 22;
  }
  y += 10;

  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.fillText('LEGEND', p.x + 12, y);
  y += 20;
  const legend = [
    [PALETTE.coneCalm, 'Guard cone — calm'],
    [PALETTE.coneSuspicious, 'Cone — suspicious'],
    [PALETTE.coneAlert, 'Cone — ALERT'],
    [PALETTE.cameraArc, 'Camera sweep'],
    [PALETTE.lootGlow, 'Loot — hold E to steal'],
    [PALETTE.exitGreen, 'Exit — opens at 5/5'],
  ];
  for (const [color, label] of legend) {
    ctx.fillStyle = color;
    ctx.fillRect(p.x + 12, y - 6, 16, 12);
    ctx.strokeStyle = 'rgba(232,224,207,0.3)';
    ctx.strokeRect(p.x + 12.5, y - 5.5, 15, 11);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '12px Georgia, serif';
    ctx.fillText(label, p.x + 34, y);
    y += 22;
  }
  y += 10;

  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'bold 11px Georgia, serif';
  ctx.fillText('CONTROLS', p.x + 12, y);
  y += 20;
  const controls = [
    'WASD / arrows — move',
    'SHIFT — sneak (silent)',
    'Click — throw pebble',
    'E (hold) — steal / pick',
    'Q — smoke pellet',
    'H — field notes',
    'ESC — pause   R — retry',
  ];
  ctx.fillStyle = PALETTE.text;
  ctx.font = '12px Georgia, serif';
  for (const c of controls) {
    ctx.fillText(c, p.x + 12, y);
    y += 20;
  }

  y += 8;
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'italic 12px Georgia, serif';
  ctx.fillText('The Sunflower pays for', p.x + 12, y);
  y += 18;
  ctx.fillText('the whole crew. No noise,', p.x + 12, y);
  y += 18;
  ctx.fillText('no witnesses — GHOST.', p.x + 12, y);
}

// Bottom bar with clickable buttons; hit-test via BOT_BUTTONS.
export function drawBottomBar(ctx, s) {
  const b = BOTBAR;
  ctx.fillStyle = PALETTE.panel;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = PALETTE.panelEdge;
  ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const btn of BOT_BUTTONS) {
    const by = b.y + 6;
    ctx.fillStyle = '#241f2e';
    ctx.fillRect(btn.x, by, btn.w, 24);
    ctx.strokeStyle = PALETTE.panelEdge;
    ctx.strokeRect(btn.x + 0.5, by + 0.5, btn.w - 1, 23);
    ctx.fillStyle = PALETTE.text;
    ctx.font = '13px Georgia, serif';
    ctx.fillText(btn.label + (btn.id === 'mute' && s.muted ? ' (off)' : ''), btn.x + btn.w / 2, by + 12);
  }

  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.textDim;
  ctx.font = 'italic 12px Georgia, serif';
  ctx.fillText(s.hint ?? 'Stay in shadow. Time your move between sweeps.', b.x + b.w - 12, b.y + 18);
}

// A labelled callout with a leader line, clamped fully inside the canvas.
export function drawCallouts(ctx, callouts) {
  ctx.font = 'bold 13px Georgia, serif';
  for (const c of callouts) {
    const pad = 7;
    const w = ctx.measureText(c.text).width + pad * 2;
    const h = 26;
    let bx = c.x + 14;
    let by = c.y - h - 10;
    bx = Math.max(8, Math.min(CANVAS_W - w - 8, bx));
    by = Math.max(8, Math.min(712 - h, by));
    // Leader line from the point to the box.
    ctx.strokeStyle = PALETTE.goldBright;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(bx + (bx > c.x ? 2 : w - 2), by + h - 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(12, 10, 18, 0.92)';
    ctx.fillRect(bx, by, w, h);
    ctx.strokeStyle = PALETTE.gold;
    ctx.lineWidth = 1;
    ctx.strokeRect(bx + 0.5, by + 0.5, w - 1, h - 1);
    ctx.fillStyle = PALETTE.goldBright;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.text, bx + pad, by + h / 2 + 0.5);
  }
}

export { FIELD };
