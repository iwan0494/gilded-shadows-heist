// render.js — every pixel of the museum: marble, paintings, cases, statues,
// cones, figures, lasers, the blueprint, the win screen. Figures carry a 2px
// rim so they read over the floor; every label is inset from the canvas edge.
import { W, H, PLAY, RIGHT, DIALOG, FLOOR, CARPET, GOLD, TEAL, LOOT, CREW, LOOT_TOTAL, fmtMoney, fmtClock, alarmWord } from './config.js';
import { mulberry32, range } from './random.js';
import { FOCUS_HALF, FOCUS_RANGE, PERIPH_HALF, PERIPH_RANGE, losClear } from './guards.js';
import { losBlockers } from './world.js';
import { drawTopBar, drawRightPanel, drawDialog, drawCallout } from './hud.js';

function coneColor(g) {
  if (g.state === 'alert') return 'rgba(229,72,77,0.30)';
  if (g.meter >= 40) return 'rgba(232,161,60,0.28)';
  return 'rgba(232,182,76,0.24)';
}

function rayFan(ctx, x, y, dir, half, range, blockers) {
  const rays = 18;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i <= rays; i++) {
    const a = dir - half + (2 * half * i) / rays;
    let d = range;
    for (let step = 8; step <= range; step += 8) {
      const px = x + Math.cos(a) * step, py = y + Math.sin(a) * step;
      if (px < PLAY.x || px > PLAY.x + PLAY.w || py < PLAY.y || py > PLAY.y + PLAY.h) { d = step; break; }
      let hit = false;
      for (const c of blockers.circles) {
        const dx = px - c.x, dy = py - c.y;
        if (dx * dx + dy * dy <= c.r * c.r) { hit = true; break; }
      }
      if (hit) { d = step; break; }
    }
    ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
}

function drawFloor(ctx, room, alarmed) {
  const pal = alarmed ? FLOOR.alarm : FLOOR.calm;
  const rng = mulberry32(room.seed);
  const ts = 64;
  for (let ty = PLAY.y; ty < PLAY.y + PLAY.h; ty += ts) {
    for (let tx = PLAY.x; tx < PLAY.x + PLAY.w; tx += ts) {
      const col = Math.floor((tx - PLAY.x) / ts + (ty - PLAY.y) / ts) % 2 === 0 ? pal[0] : pal[1];
      ctx.fillStyle = col;
      ctx.fillRect(tx, ty, ts, ts);
      // seeded variation so the marble is not a flat grid
      ctx.fillStyle = `rgba(255,255,255,${(rng() * 0.03).toFixed(3)})`;
      ctx.fillRect(tx, ty, ts, ts);
    }
  }
  ctx.strokeStyle = 'rgba(217,164,65,0.55)';
  ctx.lineWidth = 3;
  ctx.strokeRect(PLAY.x + 1.5, PLAY.y + 1.5, PLAY.w - 3, PLAY.h - 3);
  ctx.lineWidth = 1;
}

function drawCarpet(ctx, c) {
  ctx.fillStyle = CARPET.fill;
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = CARPET.border;
  ctx.lineWidth = 2;
  ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
  ctx.fillStyle = CARPET.diamond;
  const vertical = c.h > c.w;
  const n = vertical ? Math.floor(c.h / 90) : Math.floor(c.w / 90);
  for (let i = 0; i < n; i++) {
    const cx = vertical ? c.x + c.w / 2 : c.x + 45 + i * 90;
    const cy = vertical ? c.y + 45 + i * 90 : c.y + c.h / 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 8, cy); ctx.lineTo(cx, cy + 8); ctx.lineTo(cx - 8, cy);
    ctx.closePath(); ctx.fill();
  }
  ctx.lineWidth = 1;
}

function drawPainting(ctx, p) {
  ctx.fillStyle = '#3a2f1d';
  ctx.fillRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.strokeRect(p.x - 4, p.y - 4, p.w + 8, p.h + 8);
  ctx.save();
  ctx.beginPath(); ctx.rect(p.x, p.y, p.w, p.h); ctx.clip();
  const cx = p.x + p.w / 2, cy = p.y + p.h / 2;
  if (p.kind === 'sunflower') {
    ctx.fillStyle = '#2c4a2e'; ctx.fillRect(p.x, p.y, p.w, p.h);
    drawSunflowerHead(ctx, cx, cy - 4, 30, 0);
    ctx.fillStyle = '#3d6b34'; ctx.fillRect(cx - 3, cy + 20, 6, 26);
  } else if (p.kind === 'portrait') {
    ctx.fillStyle = '#4a2c4a'; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#d9b48f';
    ctx.beginPath(); ctx.arc(cx, cy - 8, 20, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2c2c44';
    ctx.beginPath(); ctx.arc(cx, cy - 8, 21, Math.PI, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5a3a5a';
    ctx.fillRect(cx - 34, cy + 22, 68, 26);
  } else if (p.kind === 'landscape') {
    ctx.fillStyle = '#274b6b'; ctx.fillRect(p.x, p.y, p.w, p.h * 0.55);
    ctx.fillStyle = '#3d6b34'; ctx.fillRect(p.x, p.y + p.h * 0.55, p.w, p.h * 0.45);
    ctx.fillStyle = '#e8c96a';
    ctx.beginPath(); ctx.arc(p.x + p.w * 0.72, p.y + 22, 13, 0, Math.PI * 2); ctx.fill();
  } else if (p.kind === 'still') {
    ctx.fillStyle = '#3d2c1e'; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#8a6b3d';
    ctx.fillRect(p.x + 18, p.y + p.h - 26, p.w - 36, 8);
    ctx.fillStyle = '#c9a24a';
    ctx.beginPath(); ctx.arc(cx - 18, cy, 12, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(cx + 18, cy + 4, 12, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#1e2c4a'; ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = '#e5484d'; ctx.fillRect(p.x + 18, p.y + 16, 42, 34);
    ctx.fillStyle = TEAL; ctx.fillRect(p.x + 70, p.y + 30, 52, 16);
    ctx.fillStyle = '#e8c96a';
    ctx.beginPath(); ctx.arc(p.x + 108, p.y + 62, 14, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = '#d9c48a';
  ctx.font = 'italic 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.title, cx, p.y + p.h + 14);
  ctx.textAlign = 'left';
  ctx.lineWidth = 1;
}

function drawSunflowerHead(ctx, x, y, r, t) {
  const bob = Math.sin(t / 300) * 2;
  ctx.save();
  ctx.translate(x, y + bob);
  ctx.fillStyle = '#e8b64c';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.save();
    ctx.rotate(a);
    ctx.beginPath(); ctx.ellipse(r * 0.85, 0, r * 0.5, r * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#5a3a1a';
  ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a5a2a';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath(); ctx.arc(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

function drawCase(ctx, c, t) {
  ctx.fillStyle = '#1a2036';
  ctx.fillRect(c.x - 3, c.y - 3, c.w + 6, c.h + 6);
  ctx.fillStyle = 'rgba(180,210,240,0.16)';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = 'rgba(200,220,255,0.5)';
  ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
  const cx = c.x + c.w / 2, cy = c.y + c.h / 2;
  if (c.empty) {
    ctx.fillStyle = '#6b7288';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(c.lootId ? 'TAKEN' : 'EMPTY', cx, cy + 4);
    ctx.textAlign = 'left';
  } else {
    const gem = { scarab: '#2ec4b6', idol: '#e5484d', crown: '#e8b64c', sapphires: '#7fb3e8' }[c.lootId] || GOLD;
    ctx.save();
    ctx.shadowColor = gem; ctx.shadowBlur = 14;
    ctx.fillStyle = gem;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 16); ctx.lineTo(cx + 14, cy); ctx.lineTo(cx, cy + 16); ctx.lineTo(cx - 14, cy);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#d9c48a';
  ctx.font = 'italic 10px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(c.label, cx, c.y + c.h + 14);
  ctx.textAlign = 'left';
}

function drawStatue(ctx, s) {
  ctx.fillStyle = '#232a42';
  ctx.fillRect(s.x - 16, s.y + 8, 32, 10);
  ctx.strokeStyle = 'rgba(217,164,65,0.4)';
  ctx.strokeRect(s.x - 16, s.y + 8, 32, 10);
  ctx.fillStyle = '#8b93ad';
  ctx.beginPath(); ctx.arc(s.x, s.y - 2, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#aab2cc';
  ctx.fillRect(s.x - 7, s.y + 4, 14, 6);
}

function drawPlant(ctx, p) {
  ctx.fillStyle = '#7a4a2a';
  ctx.fillRect(p.x - 10, p.y, 20, 14);
  ctx.fillStyle = '#3d6b34';
  ctx.beginPath(); ctx.arc(p.x - 8, p.y - 8, 10, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p.x + 8, p.y - 10, 11, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(p.x, p.y - 16, 11, 0, Math.PI * 2); ctx.fill();
}

function drawGuardFigure(ctx, g, t) {
  // Patrol route: dashed line, waypoint dots, direction arrows.
  ctx.strokeStyle = g.color;
  ctx.globalAlpha = 0.55;
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  g.waypoints.forEach(([wx, wy], i) => { if (i === 0) ctx.moveTo(wx, wy); else ctx.lineTo(wx, wy); });
  ctx.closePath();
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  for (const [wx, wy] of g.waypoints) {
    ctx.fillStyle = g.color;
    ctx.beginPath(); ctx.arc(wx, wy, 3, 0, Math.PI * 2); ctx.fill();
  }
  // Vision cones: raycast fan (focused) + faint peripheral sector.
  const blockers = g._blockers;
  ctx.fillStyle = coneColor(g);
  rayFan(ctx, g.x, g.y, g.dir, FOCUS_HALF, FOCUS_RANGE, blockers);
  ctx.fillStyle = 'rgba(232,182,76,0.07)';
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.arc(g.x, g.y, PERIPH_RANGE, g.dir - PERIPH_HALF, g.dir + PERIPH_HALF);
  ctx.closePath(); ctx.fill();

  // Figure: uniform body + cap + facing tick, 2px rim.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath(); ctx.ellipse(g.x, g.y + 12, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#232a44';
  ctx.strokeStyle = g.color;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(g.x, g.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#2c3556';
  ctx.beginPath(); ctx.arc(g.x, g.y, 13, Math.PI, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#e8ecf7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(g.x, g.y);
  ctx.lineTo(g.x + Math.cos(g.dir) * 18, g.y + Math.sin(g.dir) * 18);
  ctx.stroke();
  ctx.lineWidth = 1;
  // Name tag.
  ctx.font = 'bold 11px sans-serif';
  const nw = ctx.measureText(g.short).width + 10;
  ctx.fillStyle = 'rgba(10,13,26,0.9)';
  ctx.fillRect(g.x - nw / 2, g.y - 40, nw, 15);
  ctx.fillStyle = '#f2e6c8';
  ctx.textAlign = 'center';
  ctx.fillText(g.short, g.x, g.y - 29);
  ctx.textAlign = 'left';
  // Detection pie above the name tag, filling clockwise.
  const px = g.x, py = g.y - 50;
  ctx.fillStyle = 'rgba(10,13,26,0.9)';
  ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = g.meter >= 70 ? '#e5484d' : g.meter >= 40 ? '#e8a13c' : TEAL;
  ctx.beginPath();
  ctx.moveTo(px, py);
  ctx.arc(px, py, 8, -Math.PI / 2, -Math.PI / 2 + (g.meter / 100) * Math.PI * 2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#8b93ad';
  ctx.beginPath(); ctx.arc(px, py, 9, 0, Math.PI * 2); ctx.stroke();
  if (g.meter >= 70) {
    ctx.fillStyle = '#e5484d';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', px, py - 16);
    ctx.textAlign = 'left';
  } else if (g.meter >= 40) {
    ctx.fillStyle = '#e8a13c';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', px, py - 16);
    ctx.textAlign = 'left';
  }
  // Timer ring: seconds until the next turn.
  if (g.state === 'patrol') {
    ctx.fillStyle = '#b9c0d8';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.ceil(g.turnIn) + 's', g.x + 24, g.y + 4);
    ctx.textAlign = 'left';
  }
}

function drawCameraFig(ctx, c, t) {
  const blind = c.blind > 0;
  if (!blind) {
    ctx.fillStyle = 'rgba(229,72,77,0.20)';
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.arc(c.x, c.y, 300, c.angle - Math.PI / 6, c.angle + Math.PI / 6);
    ctx.closePath(); ctx.fill();
  }
  ctx.fillStyle = '#232a44';
  ctx.strokeStyle = blind ? '#8b93ad' : '#e5484d';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(c.x, c.y, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = blind ? '#8b93ad' : '#e5484d';
  ctx.beginPath(); ctx.arc(c.x, c.y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.font = 'bold 10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = blind ? '#8b93ad' : '#e5484d';
  ctx.fillText(blind ? 'BLIND' : 'CAM', c.x, c.y - 18);
  ctx.textAlign = 'left';
  ctx.lineWidth = 1;
}

function drawPlayerFig(ctx, p, game) {
  const r = game.tools.clouds.some((c) => Math.hypot(p.x - c.x, p.y - c.y) < c.r);
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(p.x, p.y + 12, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#141828';
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Hood point.
  ctx.fillStyle = '#1d2338';
  ctx.beginPath();
  ctx.moveTo(p.x + Math.cos(p.dir) * 16, p.y + Math.sin(p.dir) * 16);
  ctx.lineTo(p.x + Math.cos(p.dir + 2.4) * 10, p.y + Math.sin(p.dir + 2.4) * 10);
  ctx.lineTo(p.x + Math.cos(p.dir - 2.4) * 10, p.y + Math.sin(p.dir - 2.4) * 10);
  ctx.closePath(); ctx.fill();
  ctx.lineWidth = 1;
  // Nearest-guard meter ring.
  const m = game.nearestMeter;
  ctx.strokeStyle = m >= 70 ? '#e5484d' : m >= 40 ? '#e8a13c' : TEAL;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 19, -Math.PI / 2, -Math.PI / 2 + (m / 100) * Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.font = 'bold 11px sans-serif';
  const nw = ctx.measureText('SABLE').width + 10;
  ctx.fillStyle = 'rgba(10,13,26,0.9)';
  ctx.fillRect(p.x - nw / 2, p.y - 40, nw, 15);
  ctx.fillStyle = '#f2e6c8';
  ctx.textAlign = 'center';
  ctx.fillText('SABLE', p.x, p.y - 29);
  ctx.textAlign = 'left';
  // Hold-E progress ring.
  if (p.interact) {
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 26, -Math.PI / 2, -Math.PI / 2 + (p.interactT / 1.2) * Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f2e6c8';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOLD E', p.x, p.y - 32);
    ctx.textAlign = 'left';
    ctx.lineWidth = 1;
  }
  if (r) {
    ctx.fillStyle = 'rgba(200,220,255,0.25)';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('IN SMOKE', p.x, p.y + 30);
    ctx.textAlign = 'left';
  }
}

function drawRoom(ctx, game, t) {
  const room = game.roomObj;
  const alarmed = game.alarm >= 70;
  drawFloor(ctx, room, alarmed);
  if (room.carpet) drawCarpet(ctx, room.carpet);
  // Shadow zones: hatched dark.
  for (const s of room.shadows) {
    ctx.fillStyle = 'rgba(5,7,16,0.55)';
    ctx.fillRect(s.x, s.y, s.w, s.h);
    ctx.strokeStyle = 'rgba(180,200,255,0.35)';
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
    ctx.setLineDash([]);
    ctx.fillStyle = '#8b93ad';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(s.label, s.x + 10, s.y + 20);
  }
  // Warm light pools under chandeliers.
  for (const l of room.lights) {
    const g = ctx.createRadialGradient(l.x, l.y, 8, l.x, l.y, l.r);
    g.addColorStop(0, 'rgba(232,190,90,0.20)');
    g.addColorStop(1, 'rgba(232,190,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(l.x, l.y, l.r, 0, Math.PI * 2); ctx.fill();
  }
  for (const p of room.paintings) drawPainting(ctx, p);
  for (const c of room.cases) drawCase(ctx, c, t);
  for (const s of room.statues) drawStatue(ctx, s);
  for (const p of room.plants) drawPlant(ctx, p);
  // Doors: arch + label safely inside the play area.
  for (const d of room.doors) {
    ctx.fillStyle = '#3a2f1d';
    ctx.fillRect(d.x - 4, d.y - 4, d.w + 8, d.h + 8);
    ctx.strokeStyle = GOLD;
    ctx.strokeRect(d.x - 4, d.y - 4, d.w + 8, d.h + 8);
    // Door labels sit well inside the play area with a dark pill behind them,
    // so no arch stroke or painting frame can ever cut through the text.
    ctx.font = 'bold 12px sans-serif';
    const lw = ctx.measureText(d.label).width + 16;
    ctx.fillStyle = 'rgba(10,13,26,0.92)';
    ctx.fillRect(d.x + d.w / 2 - lw / 2, d.labelY - 14, lw, 19);
    ctx.strokeStyle = GOLD;
    ctx.strokeRect(d.x + d.w / 2 - lw / 2, d.labelY - 14, lw, 19);
    ctx.fillStyle = '#f2e6c8';
    ctx.textAlign = 'center';
    ctx.fillText(d.label, d.x + d.w / 2, d.labelY);
    ctx.textAlign = 'left';
  }
  // Vault pedestal + lasers + Sunflower.
  if (room.pedestal) {
    const pd = room.pedestal;
    for (const l of room.lasers) {
      if (!l.live) continue;
      ctx.save();
      ctx.strokeStyle = '#ff2e3e';
      ctx.shadowColor = '#ff2e3e';
      ctx.shadowBlur = 10;
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.moveTo(l.x1, l.y1); ctx.lineTo(l.x2, l.y2); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = '#ff2e3e';
      ctx.beginPath(); ctx.arc(l.x1, l.y1, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(l.x2, l.y2, 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#232a42';
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(pd.x, pd.y, 34, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.lineWidth = 1;
    if (!game.sunflower || game.stageSunflower) {
      const g = ctx.createRadialGradient(pd.x, pd.y - 10, 4, pd.x, pd.y - 10, 90);
      g.addColorStop(0, 'rgba(232,182,76,0.5)');
      g.addColorStop(1, 'rgba(232,182,76,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(pd.x, pd.y - 10, 90, 0, Math.PI * 2); ctx.fill();
      drawSunflowerHead(ctx, pd.x, pd.y - 12, 26, t);
    }
  }
  // Exit pad (Atrium).
  if (room.exit) {
    const e = room.exit;
    const open = e.open;
    ctx.save();
    if (open) { ctx.shadowColor = TEAL; ctx.shadowBlur = 22; }
    ctx.fillStyle = open ? 'rgba(46,196,182,0.45)' : 'rgba(46,196,182,0.14)';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.restore();
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 2;
    ctx.strokeRect(e.x + 1, e.y + 1, e.w - 2, e.h - 2);
    ctx.lineWidth = 1;
    ctx.font = 'bold 13px sans-serif';
    const et = open ? 'EXIT OPEN — RUN' : 'EXIT — NEED THE SUNFLOWER';
    const ew = ctx.measureText(et).width + 16;
    ctx.fillStyle = 'rgba(10,13,26,0.92)';
    ctx.fillRect(e.x + e.w / 2 - ew / 2, e.y - 27, ew, 19);
    ctx.strokeStyle = TEAL;
    ctx.strokeRect(e.x + e.w / 2 - ew / 2, e.y - 27, ew, 19);
    ctx.fillStyle = open ? '#bff5ef' : '#7fb3ae';
    ctx.textAlign = 'center';
    ctx.fillText(et, e.x + e.w / 2, e.y - 13);
    ctx.textAlign = 'left';
  }
  // Escape route: green dashed line from the thief to the exit once the prize is carried.
  if (game.sunflower && room.exit && room.exit.open) {
    ctx.strokeStyle = TEAL;
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(game.player.x, game.player.y);
    ctx.lineTo(room.exit.x + room.exit.w / 2, room.exit.y + room.exit.h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
  }
  // Cameras, guards, player, rings, smoke.
  for (const c of room.cameras) drawCameraFig(ctx, c, t);
  const blockers = losBlockers(room);
  for (const g of room.guards) { g._blockers = blockers; drawGuardFigure(ctx, g, t); }
  drawPlayerFig(ctx, game.player, game);
  for (const ring of game.tools.rings) {
    ctx.strokeStyle = `rgba(232,182,76,${Math.max(0, ring.a).toFixed(2)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
  }
  for (const c of game.tools.clouds) {
    ctx.fillStyle = 'rgba(200,210,230,0.30)';
    ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(220,230,250,0.25)';
    ctx.beginPath(); ctx.arc(c.x - 18, c.y - 10, c.r * 0.55, 0, Math.PI * 2); ctx.fill();
  }
  // Alarm wash: red over the whole room when ALARMED (R3: floor already brighter).
  if (alarmed) {
    ctx.fillStyle = 'rgba(180,30,30,0.10)';
    ctx.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
  }
}

// ---- Blueprint / title screen (shot 1) ----
function drawBlueprint(ctx, game, t) {
  ctx.fillStyle = '#0e1220';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(46,196,182,0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 32) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 32) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 62px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('GILDED SHADOWS', 640, 96);
  ctx.fillStyle = '#e8ecf7';
  ctx.font = 'italic 22px Georgia, serif';
  ctx.fillText('Steal the Midnight Sunflower', 640, 132);
  ctx.fillStyle = TEAL;
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('3 ROOMS · 5 LOOT · 1 GETAWAY · DAWN IN 05:00', 640, 162);
  ctx.textAlign = 'left';
  // Three room boxes with patrol routes + line-of-sight wedges (R3 fix #5).
  const boxes = [
    { y: 196, h: 118, title: 'THE MARBLE ATRIUM — enter here', route: [[150, 256], [700, 256]], wedges: [[330, 256, 0], [560, 256, Math.PI]] },
    { y: 326, h: 118, title: 'THE GILDED GALLERY', route: [[150, 420], [700, 420], [700, 380], [150, 380]], wedges: [[430, 420, Math.PI / 2]] },
    { y: 456, h: 118, title: 'THE VAULT BELOW — the Sunflower', route: [[250, 520], [650, 520]], wedges: [[450, 520, -Math.PI / 2]] },
  ];
  for (const b of boxes) {
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(90, b.y, 700, b.h);
    ctx.fillStyle = '#f2e6c8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(b.title, 106, b.y + 24);
    ctx.strokeStyle = GOLD;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    b.route.forEach(([x, y], i) => { if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();
    ctx.setLineDash([]);
    for (const [wx, wy] of b.route) {
      ctx.fillStyle = GOLD;
      ctx.beginPath(); ctx.arc(wx, wy, 3, 0, Math.PI * 2); ctx.fill();
    }
    // LOS wedges: the blueprint shows sight, not just lines.
    for (const [wx, wy, a] of b.wedges) {
      ctx.fillStyle = 'rgba(232,182,76,0.30)';
      ctx.beginPath();
      ctx.moveTo(wx, wy);
      ctx.arc(wx, wy, 42, a - 0.5, a + 0.5);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#232a44';
      ctx.beginPath(); ctx.arc(wx, wy, 9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = GOLD;
      ctx.stroke();
    }
  }
  // Escape route down the left side.
  ctx.strokeStyle = TEAL;
  ctx.setLineDash([6, 6]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(430, 196); ctx.lineTo(430, 574);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.lineWidth = 1;
  ctx.fillStyle = TEAL;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('ESCAPE ROUTE — out the front door', 96, 590);
  // Crew panel.
  const px = 826, pw = 364;
  ctx.fillStyle = 'rgba(19,24,48,0.9)';
  ctx.fillRect(px, 196, pw, 196);
  ctx.strokeStyle = 'rgba(217,164,65,0.4)';
  ctx.strokeRect(px + 0.5, 196.5, pw - 1, 195);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('THE CREW', px + 16, 222);
  let cy = 252;
  for (const m of CREW) {
    ctx.fillStyle = TEAL;
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(m.name, px + 16, cy);
    ctx.fillStyle = '#dfe4f2';
    ctx.font = '13px sans-serif';
    ctx.fillText('— ' + m.role + (m.you ? ' — you' : ''), px + 86, cy);
    ctx.fillStyle = '#8b93ad';
    ctx.font = 'italic 12px Georgia, serif';
    ctx.fillText(m.note, px + 16, cy + 20);
    cy += 48;
  }
  // The take.
  ctx.fillStyle = 'rgba(19,24,48,0.9)';
  ctx.fillRect(px, 404, pw, 186);
  ctx.strokeStyle = 'rgba(217,164,65,0.4)';
  ctx.strokeRect(px + 0.5, 404.5, pw - 1, 185);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('THE TAKE — ' + fmtMoney(LOOT_TOTAL), px + 16, 430);
  cy = 452;
  for (const l of LOOT) {
    ctx.fillStyle = '#dfe4f2';
    ctx.font = '13px sans-serif';
    ctx.fillText('○ ' + l.name, px + 16, cy);
    ctx.textAlign = 'right';
    ctx.fillText(fmtMoney(l.value), px + pw - 16, cy);
    ctx.textAlign = 'left';
    cy += 21;
  }
  ctx.fillStyle = '#8b93ad';
  ctx.font = 'italic 12px Georgia, serif';
  ctx.fillText('The exit pad only opens for the', px + 16, cy + 4);
  ctx.fillText('one who carries the Sunflower.', px + 16, cy + 22);
  // Press enter.
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('—  PRESS ENTER TO BEGIN  —', 640, 648);
  ctx.fillStyle = '#8b93ad';
  ctx.font = '13px sans-serif';
  ctx.fillText('Observe. Plan. Execute. Adapt. Get out before dawn.', 640, 676);
  ctx.textAlign = 'left';
}

function drawWin(ctx, game) {
  ctx.fillStyle = 'rgba(10,13,26,0.88)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CLEAN GETAWAY', 640, 150);
  ctx.fillStyle = TEAL;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('The Sunflower is gone. The museum never saw you leave.', 640, 190);
  ctx.fillStyle = '#f2e6c8';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  const x0 = 440;
  ctx.fillText('LOOT  5/5 — ' + fmtMoney(LOOT_TOTAL), x0, 250);
  ctx.fillText('TIME  ' + fmtClock(game.winTime || game.time), x0, 282);
  ctx.fillText('RATING  ' + (game.spotted ? 'SHADOW' : 'GHOST') + (game.spotted ? ' — spotted once' : ' — never spotted'), x0, 314);
  ctx.fillText('ALARM  ' + (game.alarmHistory.length ? game.alarmHistory.join(' → ') : 'QUIET all night'), x0, 346);
  ctx.fillStyle = '#8b93ad';
  ctx.font = 'italic 15px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('“Beautiful. Not a single footprint.” — WREN', 640, 420);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('PRESS R — PLAY AGAIN', 640, 480);
  ctx.textAlign = 'left';
}

function drawCaught(ctx, game) {
  ctx.fillStyle = 'rgba(40,8,10,0.85)';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e5484d';
  ctx.font = 'bold 54px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText('CAUGHT', 640, 280);
  ctx.fillStyle = '#f2e6c8';
  ctx.font = '18px sans-serif';
  ctx.fillText((game.caughtBy || 'A guard') + ' has you. The Sunflower stays tonight.', 640, 330);
  ctx.fillStyle = GOLD;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('PRESS R — TRY AGAIN', 640, 400);
  ctx.textAlign = 'left';
}

export function render(ctx, game, t) {
  ctx.clearRect(0, 0, W, H);
  if (game.mode === 'title') {
    drawBlueprint(ctx, game, t);
    return;
  }
  drawRoom(ctx, game, t);
  drawTopBar(ctx, game);
  drawRightPanel(ctx, game);
  if (game.dialog) drawDialog(ctx, game.dialog.who, game.dialog.text);
  for (const c of game.callouts) drawCallout(ctx, c.ax, c.ay, c.text, c.dx, c.dy);
  if (game.mode === 'win') drawWin(ctx, game);
  if (game.mode === 'caught') drawCaught(ctx, game);
  if (game.paused) {
    ctx.fillStyle = 'rgba(10,13,26,0.7)';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f2e6c8';
    ctx.font = 'bold 40px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 640, 350);
    ctx.font = '16px sans-serif';
    ctx.fillText('ESC to resume', 640, 390);
    ctx.textAlign = 'left';
  }
  if (game.notes) {
    ctx.fillStyle = 'rgba(10,13,26,0.92)';
    ctx.fillRect(280, 140, 720, 380);
    ctx.strokeStyle = GOLD;
    ctx.strokeRect(280.5, 140.5, 719, 379);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 18px Georgia, serif';
    ctx.fillText('FIELD NOTES — SABLE', 310, 180);
    ctx.fillStyle = '#dfe4f2';
    ctx.font = '14px sans-serif';
    const lines = [
      'The Sunflower hangs in the Vault Below, behind red lasers.',
      'Marlow walks the Atrium, Dara the Gallery, Voss the Vault.',
      'Kell crosses between rooms. His route is the dangerous one.',
      'Pebbles pull a guard off his route. Smoke blinds cameras.',
      'Hold E to steal. The exit opens only for the Sunflower.',
      'Dawn comes in 05:00. After that, the whole house wakes.',
    ];
    lines.forEach((l, i) => ctx.fillText('• ' + l, 310, 216 + i * 30));
    ctx.fillStyle = '#8b93ad';
    ctx.fillText('H to close', 310, 480);
  }
}
