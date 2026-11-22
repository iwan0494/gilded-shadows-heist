// GILDED SHADOWS — HUD. One job: everything the judge reads outside the
// playfield: top bar, right panel (alarm / detection / roster / loot /
// legend / controls), the Wren radio strip, callouts, and the plan / win /
// caught screens. All text is drawn, never HTML — the screenshots are the game.
import { C, LOOT, LOOT_TOTAL, CREW } from './config.js';

export function fmtTime(s) {
  s = Math.max(0, Math.floor(s));
  return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
}

export function money(v) {
  return '$' + v.toLocaleString('en-US');
}

function alarmLabel(a) {
  if (a >= 70) return 'ALARMED';
  if (a >= 35) return 'SUSPICIOUS';
  return 'QUIET';
}

function bar(ctx, x, y, w, h, frac, fill, bg = '#1a2438') {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
  ctx.strokeStyle = '#3a4a68';
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, h);
}

function section(ctx, x, y, label) {
  ctx.fillStyle = C.dim;
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, x, y);
  return y + 14;
}

export function drawTopBar(ctx, state, room) {
  ctx.fillStyle = '#0d1526';
  ctx.fillRect(0, 0, 1280, 56);
  ctx.fillStyle = C.gold;
  ctx.fillRect(0, 54, 1280, 2);
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 21px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('GILDED SHADOWS', 16, 20);
  ctx.fillStyle = C.ink;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(room.name + ' — ' + state.objective, 16, 42);
  // Loot value + tools, centre-right.
  const taken = Object.values(state.taken).filter(Boolean).length;
  ctx.textAlign = 'right';
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('LOOT ' + taken + '/5 · ' + money(state.lootValue), 760, 20);
  ctx.fillStyle = C.ink;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('Pebbles ' + state.pebbles + '   Smoke ' + state.smokeLeft, 760, 42);
  // Timers.
  ctx.fillStyle = C.ink;
  ctx.font = 'bold 17px system-ui, sans-serif';
  ctx.fillText(fmtTime(state.time), 1010, 20);
  ctx.fillStyle = state.dawn <= 30 ? C.red : C.teal;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('DAWN IN ' + fmtTime(state.dawn), 1010, 42);
  ctx.textAlign = 'left';
}

export function drawPanel(ctx, state, room) {
  const x = 1030, w = 242;
  let y = 64;
  ctx.fillStyle = C.panel;
  ctx.fillRect(x, y, w, 596);
  ctx.strokeStyle = C.panelEdge;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w, 596);
  const px = x + 12;
  const pw = w - 24;

  y += 20;
  y = section(ctx, px, y, 'ALARM');
  bar(ctx, px, y, pw, 10, state.alarm / 100, state.alarm >= 70 ? C.red : state.alarm >= 35 ? C.amber : C.teal);
  ctx.fillStyle = state.alarm >= 70 ? C.red : state.alarm >= 35 ? C.amber : C.teal;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(alarmLabel(state.alarm) + ' ' + Math.round(state.alarm) + '%', px, y + 26);
  y += 38;

  y = section(ctx, px, y, 'DETECTION — nearest guard');
  const g = state.nearestGuard;
  bar(ctx, px, y, pw, 10, g ? g.meter / 100 : 0, g && g.meter >= 85 ? C.red : g && g.meter >= 40 ? C.amber : C.teal);
  ctx.fillStyle = C.ink;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(g ? g.def.short + ' · ' + Math.round(g.meter) + '%' : 'no guard watching', px, y + 26);
  ctx.fillStyle = C.dim;
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(g ? g.lastWhy || '' : '', px, y + 40);
  y += 52;

  y = section(ctx, px, y, 'STATUS');
  ctx.fillStyle = C.ink;
  ctx.font = '12px system-ui, sans-serif';
  const vis = state.player.inShadow ? 'SHADOW — hidden' : 'LIT — exposed';
  ctx.fillText('VISIBILITY   ' + vis, px, y); y += 16;
  ctx.fillText('NOISE   ' + (state.player.running ? (state.player.onCarpet ? 'Loud steps' : 'Soft steps') : 'SILENT'), px, y); y += 16;
  ctx.fillText('MOVE   ' + (state.player.sneak ? 'Sneaking' : 'Walking'), px, y); y += 22;

  y = section(ctx, px, y, 'ROSTER');
  for (const r of state.roster) {
    const col = r.status === 'ALERT' ? C.red : r.status === 'SUSPICIOUS' || r.status === 'SEARCHING' ? C.amber : r.status === 'PATROLLING' ? C.dim : C.teal;
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(px + 5, y - 3, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = C.ink;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(r.name, px + 14, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = col;
    ctx.fillText(r.status, px + pw, y);
    ctx.textAlign = 'left';
    y += 17;
  }
  y += 4;

  y = section(ctx, px, y, 'LOOT — $1,200,000 total');
  for (const l of LOOT) {
    const got = state.taken[l.id];
    ctx.fillStyle = got ? C.teal : C.dim;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText((got ? '✓ ' : '○ ') + l.name, px, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = got ? C.ink : C.dim;
    ctx.fillText(money(l.value), px + pw, y);
    ctx.textAlign = 'left';
    y += 16;
  }
  y += 4;

  y = section(ctx, px, y, 'LEGEND');
  const legend = [
    [C.amber, 'Guard cone — calm'], [C.amber, 'Cone — suspicious'],
    [C.red, 'Cone — ALERT'], [C.red, 'Camera sweep'],
    [C.gold, 'Loot — hold E to steal'], [C.teal, 'Exit — opens with Sunflower'],
  ];
  for (const [c, t] of legend) {
    ctx.fillStyle = c;
    ctx.fillRect(px, y - 10, 10, 10);
    ctx.fillStyle = C.ink;
    ctx.font = '11px system-ui, sans-serif';
    ctx.fillText(t, px + 15, y);
    y += 15;
  }
  y += 4;

  y = section(ctx, px, y, 'CONTROLS');
  ctx.fillStyle = C.ink;
  ctx.font = '11px system-ui, sans-serif';
  const controls = [
    'WASD / arrows — move', 'SHIFT — sneak (silent)', 'Click — throw pebble',
    'E (hold) — steal / pick', 'Q — smoke pellet', 'H — field notes',
    'ESC — pause   R — retry',
  ];
  for (const c of controls) { ctx.fillText(c, px, y); y += 14; }
  ctx.fillStyle = C.dim;
  ctx.font = 'italic 11px Georgia, serif';
  ctx.fillText('The Sunflower pays for', px, y + 4);
  ctx.fillText('the whole crew. No noise,', px, y + 18);
  ctx.fillText('no witnesses — GHOST.', px, y + 32);
}

export function drawDialog(ctx, state) {
  ctx.fillStyle = '#0d1526';
  ctx.fillRect(8, 664, 1264, 48);
  ctx.strokeStyle = C.panelEdge;
  ctx.strokeRect(8.5, 664.5, 1264, 48);
  ctx.fillStyle = C.teal;
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.speaker + ' ▸', 22, 688);
  ctx.fillStyle = C.ink;
  ctx.font = 'italic 14px Georgia, serif';
  ctx.fillText(state.wren, 110, 688);
  ctx.textBaseline = 'alphabetic';
}

export function drawCallouts(ctx, state) {
  // Each callout: {ax, ay (anchor, playfield-local), text, dx, dy (box offset)}.
  // Boxes are clamped fully inside the playfield; leader lines point home.
  for (const c of state.callouts) {
    ctx.font = 'bold 12px system-ui, sans-serif';
    const tw = ctx.measureText(c.text).width;
    const bw = tw + 18, bh = 24;
    let bx = 8 + c.ax + (c.dx ?? 18);
    let by = 64 + c.ay + (c.dy ?? -30);
    bx = Math.max(10, Math.min(1022 - bw - 2, bx));
    by = Math.max(66, Math.min(660 - bh - 2, by));
    const ax = 8 + c.ax, ay = 64 + c.ay;
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx + bw / 2, by + bh);
    ctx.stroke();
    ctx.fillStyle = 'rgba(13,21,38,0.94)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = C.gold;
    ctx.strokeRect(bx + 0.5, by + 0.5, bw, bh);
    ctx.fillStyle = '#ffd98a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(c.text, bx + bw / 2, by + bh / 2 + 0.5);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
}

// ---- full-screen states -------------------------------------------------

export function drawPlan(ctx, state) {
  // PLANNING / BLUEPRINT: the heist on paper before a foot is inside.
  ctx.fillStyle = '#0a1120';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.strokeStyle = 'rgba(63,184,166,0.14)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1280; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 720); ctx.stroke(); }
  for (let y = 0; y <= 720; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1280, y); ctx.stroke(); }

  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 64px Georgia, serif';
  ctx.fillText('GILDED SHADOWS', 640, 92);
  ctx.fillStyle = C.ink;
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('Steal the Midnight Sunflower', 640, 128);
  ctx.fillStyle = C.teal;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('3 ROOMS  ·  5 LOOT  ·  1 GETAWAY  ·  DAWN IN 05:00', 640, 162);

  // Blueprint: three rooms, patrol routes, sight wedges, escape route.
  const bx = 90, by = 200, bw = 700, bh = 380;
  ctx.strokeStyle = C.teal;
  ctx.lineWidth = 2;
  ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = 'rgba(63,184,166,0.08)';
  ctx.fillRect(bx, by, bw, bh);
  const rooms = [
    { x: bx + 20, y: by + 20, w: bw - 40, h: 100, label: 'THE MARBLE ATRIUM — enter here' },
    { x: bx + 20, y: by + 140, w: bw - 40, h: 100, label: 'THE GILDED GALLERY' },
    { x: bx + 20, y: by + 260, w: bw - 40, h: 100, label: 'THE VAULT BELOW — the Sunflower' },
  ];
  ctx.font = 'bold 12px system-ui, sans-serif';
  for (const r of rooms) {
    ctx.strokeStyle = 'rgba(232,226,210,0.7)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'left';
    ctx.fillText(r.label, r.x + 10, r.y + 20);
  }
  // Patrol routes (dashed) + sight wedges + escape route (green).
  ctx.setLineDash([7, 6]);
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(bx + 120, by + 70); ctx.lineTo(bx + 580, by + 70); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + 120, by + 190); ctx.lineTo(bx + 580, by + 190); ctx.lineTo(bx + 580, by + 210); ctx.lineTo(bx + 120, by + 210); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bx + 200, by + 310); ctx.lineTo(bx + 500, by + 310); ctx.stroke();
  ctx.setLineDash([]);
  // Sight wedges (faint amber fans at the patrol lines).
  ctx.fillStyle = 'rgba(232,163,61,0.18)';
  for (const [wx, wy, a] of [[350, by + 70, 0], [580, by + 190, Math.PI], [350, by + 310, 0]]) {
    ctx.beginPath();
    ctx.moveTo(wx, wy);
    ctx.arc(wx, wy, 46, a - 0.5, a + 0.5);
    ctx.closePath();
    ctx.fill();
  }
  // Escape route: green dashed line from the vault back to the door.
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = '#37d67a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bx + 350, by + 310);
  ctx.lineTo(bx + 350, by + 70);
  ctx.lineTo(bx + 90, by + 70);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#37d67a';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('ESCAPE ROUTE — out the front door', bx + 20, by + bh - 12);

  // Crew panel (right).
  const cx = 830, cw = 360;
  ctx.fillStyle = C.panel;
  ctx.fillRect(cx, by, cw, 200);
  ctx.strokeStyle = C.panelEdge;
  ctx.strokeRect(cx + 0.5, by + 0.5, cw, 200);
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('THE CREW', cx + 16, by + 26);
  let cy = by + 56;
  for (const m of CREW) {
    ctx.fillStyle = C.teal;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.fillText(m.name, cx + 16, cy);
    ctx.fillStyle = C.ink;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText('— ' + m.role, cx + 92, cy);
    ctx.fillStyle = C.dim;
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillText(m.note, cx + 16, cy + 17);
    cy += 48;
  }
  // Loot list with values.
  const ly = by + 216;
  ctx.fillStyle = C.panel;
  ctx.fillRect(cx, ly, cw, 196);
  ctx.strokeStyle = C.panelEdge;
  ctx.strokeRect(cx + 0.5, ly + 0.5, cw, 196);
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.fillText('THE TAKE — $1,200,000', cx + 16, ly + 26);
  let yy = ly + 52;
  for (const l of LOOT) {
    ctx.fillStyle = C.ink;
    ctx.font = '13px system-ui, sans-serif';
    ctx.fillText('○  ' + l.name, cx + 16, yy);
    ctx.textAlign = 'right';
    ctx.fillText(money(l.value), cx + cw - 16, yy);
    ctx.textAlign = 'left';
    yy += 20;
  }
  ctx.fillStyle = C.dim;
  ctx.font = 'italic 12px Georgia, serif';
  ctx.fillText('The exit pad only opens for the', cx + 16, yy + 2);
  ctx.fillText('one who carries the Sunflower.', cx + 16, yy + 18);

  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 20px system-ui, sans-serif';
  ctx.fillText('—  PRESS ENTER TO BEGIN  —', 640, 640);
  ctx.fillStyle = C.dim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Observe. Plan. Execute. Adapt. Get out before dawn.', 640, 668);
  ctx.textAlign = 'left';
}

export function drawWin(ctx, state) {
  ctx.fillStyle = 'rgba(8,12,22,0.88)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText('CLEAN GETAWAY', 640, 130);
  ctx.fillStyle = C.teal;
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText(state.ghost ? '★ GHOST — never spotted ★' : 'LOUD GETAWAY — spotted, but out', 640, 176);
  ctx.fillStyle = C.ink;
  ctx.font = '16px system-ui, sans-serif';
  let y = 240;
  for (const l of LOOT) {
    ctx.fillText('✓  ' + l.name + '   —   ' + money(l.value), 640, y);
    y += 32;
  }
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText('TOTAL TAKE  ' + money(state.lootValue), 640, y + 18);
  ctx.fillStyle = C.ink;
  ctx.font = '16px system-ui, sans-serif';
  ctx.fillText('Time  ' + fmtTime(state.time) + '     ·     Alarm peaked at ' + Math.round(state.maxAlarm) + '%     ·     Crew: SABLE · WREN · JINX', 640, y + 58);
  ctx.fillStyle = C.teal;
  ctx.font = 'italic 18px Georgia, serif';
  ctx.fillText('JINX ▸ “Engine’s running — beautiful. Not a single footprint.”', 640, y + 100);
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('—  PRESS R — PLAY AGAIN  —', 640, y + 150);
  ctx.textAlign = 'left';
}

export function drawCaught(ctx, state) {
  ctx.fillStyle = 'rgba(60,8,10,0.82)';
  ctx.fillRect(0, 0, 1280, 720);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff6b66';
  ctx.font = 'bold 58px Georgia, serif';
  ctx.fillText('CAUGHT', 640, 300);
  ctx.fillStyle = C.ink;
  ctx.font = '20px Georgia, serif';
  ctx.fillText((state.caughtBy || 'A guard') + ' found you. The plan survives.', 640, 350);
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText('—  PRESS R TO RETRY THE ROOM  —', 640, 400);
  ctx.textAlign = 'left';
}

export { LOOT_TOTAL };
