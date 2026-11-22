// GILDED SHADOWS — render. One job: draw the museum so it reads as a
// museum, not a tile set: checker marble, gold-framed paintings, glass
// cases, statues, plants, patterned carpet, lamp pools, and characters with
// a 2px rim — guards you can read, a thief you can see.
import { C, PLAY } from './config.js';
import { tileJitter } from './random.js';
import { drawTopBar, drawPanel, drawDialog, drawCallouts, drawPlan, drawWin, drawCaught } from './hud.js';

const X = (x) => PLAY.x + x;
const Y = (y) => PLAY.y + y;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, Math.min(255, (n >> 16) + amt));
  const g = Math.max(0, Math.min(255, ((n >> 8) & 255) + amt));
  const b = Math.max(0, Math.min(255, (n & 255) + amt));
  return `rgb(${r},${g},${b})`;
}

function drawFloor(ctx) {
  const T = 42;
  for (let ty = 0; ty < 596; ty += T) {
    for (let tx = 0; tx < 1014; tx += T) {
      const j = tileJitter(tx, ty, 7) * 7;
      const even = ((tx / T) + (ty / T)) % 2 === 0;
      ctx.fillStyle = shade(even ? C.floorA : C.floorB, j);
      ctx.fillRect(X(tx), Y(ty), T, T);
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= 1014; tx += T) {
    ctx.beginPath(); ctx.moveTo(X(tx), Y(0)); ctx.lineTo(X(tx), Y(596)); ctx.stroke();
  }
  for (let ty = 0; ty <= 596; ty += T) {
    ctx.beginPath(); ctx.moveTo(X(0), Y(ty)); ctx.lineTo(X(1014), Y(ty)); ctx.stroke();
  }
}

function drawCarpet(ctx, room) {
  const c = room.carpet;
  ctx.fillStyle = C.carpet;
  ctx.fillRect(X(c.x), Y(c.y), c.w, c.h);
  ctx.strokeStyle = C.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(X(c.x) + 4, Y(c.y) + 4, c.w - 8, c.h - 8);
  ctx.strokeStyle = 'rgba(216,169,78,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(X(c.x) + 10, Y(c.y) + 10, c.w - 20, c.h - 20);
  // Diamond motif down the middle.
  ctx.fillStyle = 'rgba(216,169,78,0.65)';
  for (let y = c.y + 34; y < c.y + c.h - 20; y += 62) {
    const cx = X(c.x + c.w / 2), cy = Y(y);
    ctx.beginPath();
    ctx.moveTo(cx, cy - 9); ctx.lineTo(cx + 7, cy); ctx.lineTo(cx, cy + 9); ctx.lineTo(cx - 7, cy);
    ctx.closePath(); ctx.fill();
  }
}

function drawShadows(ctx, room) {
  for (const s of room.shadows) {
    ctx.fillStyle = 'rgba(6,9,18,0.72)';
    ctx.fillRect(X(s.x), Y(s.y), s.w, s.h);
    ctx.strokeStyle = 'rgba(139,150,171,0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(X(s.x) + 0.5, Y(s.y) + 0.5, s.w, s.h);
    ctx.setLineDash([]);
    ctx.beginPath();
    for (let d = -s.h; d < s.w; d += 18) {
      ctx.moveTo(X(s.x + d), Y(s.y + s.h));
      ctx.lineTo(X(s.x + d + s.h), Y(s.y));
    }
    ctx.strokeStyle = 'rgba(139,150,171,0.16)';
    ctx.stroke();
    ctx.fillStyle = 'rgba(139,150,171,0.75)';
    ctx.font = 'italic 11px Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('SHADOW', X(s.x) + 8, Y(s.y) + 16);
  }
}

function drawLampPools(ctx, room) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const l of room.lamps) {
    const g = ctx.createRadialGradient(X(l.x), Y(l.y), 8, X(l.x), Y(l.y), l.r);
    g.addColorStop(0, 'rgba(232,180,90,0.20)');
    g.addColorStop(1, 'rgba(232,180,90,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(X(l.x), Y(l.y), l.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPainting(ctx, p) {
  ctx.fillStyle = '#3a2f1d';
  ctx.fillRect(X(p.x) - 4, Y(p.y) - 4, p.w + 8, p.h + 8);
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  ctx.strokeRect(X(p.x) - 4, Y(p.y) - 4, p.w + 8, p.h + 8);
  // The canvas inside: a tiny original artwork per type.
  const cx = X(p.x), cy = Y(p.y);
  if (p.art === 'sunflower') {
    ctx.fillStyle = '#1d3a24'; ctx.fillRect(cx, cy, p.w, p.h);
    ctx.fillStyle = '#d8a94e';
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(cx + p.w / 2 + Math.cos(a) * 14, cy + p.h / 2 + Math.sin(a) * 12, 9, 5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#6b4a12';
    ctx.beginPath(); ctx.arc(cx + p.w / 2, cy + p.h / 2, 9, 0, Math.PI * 2); ctx.fill();
  } else if (p.art === 'portrait') {
    ctx.fillStyle = '#2c2438'; ctx.fillRect(cx, cy, p.w, p.h);
    ctx.fillStyle = '#c9a37e';
    ctx.beginPath(); ctx.arc(cx + p.w / 2, cy + p.h / 2 - 6, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a2c3a';
    ctx.beginPath(); ctx.ellipse(cx + p.w / 2, cy + p.h - 8, 26, 14, 0, Math.PI, 0); ctx.fill();
  } else if (p.art === 'landscape') {
    ctx.fillStyle = '#274b63'; ctx.fillRect(cx, cy, p.w, p.h / 2);
    ctx.fillStyle = '#3f6b34'; ctx.fillRect(cx, cy + p.h / 2, p.w, p.h / 2);
    ctx.fillStyle = '#e8d27a';
    ctx.beginPath(); ctx.arc(cx + p.w - 22, cy + 16, 9, 0, Math.PI * 2); ctx.fill();
  } else if (p.art === 'still') {
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(cx, cy, p.w, p.h);
    ctx.fillStyle = '#7a5a2a'; ctx.fillRect(cx, cy + p.h - 14, p.w, 14);
    ctx.fillStyle = '#c9b458';
    ctx.beginPath(); ctx.arc(cx + 30, cy + p.h - 26, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#8a9a4a';
    ctx.beginPath(); ctx.arc(cx + 62, cy + p.h - 24, 8, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = '#20242e'; ctx.fillRect(cx, cy, p.w, p.h);
    ctx.fillStyle = C.red; ctx.fillRect(cx + 12, cy + 10, 26, 26);
    ctx.fillStyle = C.teal; ctx.fillRect(cx + 46, cy + 26, 30, 18);
    ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(cx + p.w - 24, cy + p.h - 20, 12, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(232,226,210,0.85)';
  ctx.font = '9px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.title, X(p.x) + p.w / 2, Y(p.y) + p.h + 12);
  ctx.textAlign = 'left';
}

function drawCase(ctx, c, state, room) {
  const loot = room.loot.find((l) => l.id === c.loot);
  const taken = loot && state.taken[loot.id];
  ctx.fillStyle = 'rgba(120,170,200,0.16)';
  ctx.fillRect(X(c.x), Y(c.y), c.w, c.h);
  ctx.strokeStyle = 'rgba(180,220,240,0.75)';
  ctx.lineWidth = 2;
  ctx.strokeRect(X(c.x), Y(c.y), c.w, c.h);
  ctx.strokeStyle = '#5a4630';
  ctx.strokeRect(X(c.x) + 4, Y(c.y) + 4, c.w - 8, c.h - 8);
  if (loot && !taken) {
    const gx = X(c.x + c.w / 2), gy = Y(c.y + c.h / 2);
    const col = loot.id === 'scarab' ? '#2fbf8f' : loot.id === 'idol' ? '#d64541' : loot.id === 'crown' ? C.gold : '#7fb2ff';
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 12); ctx.lineTo(gx + 10, gy); ctx.lineTo(gx, gy + 12); ctx.lineTo(gx - 10, gy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(gx - 3, gy - 4, 2.5, 0, Math.PI * 2); ctx.fill();
  } else if (c.gem) {
    const gx = X(c.x + c.w / 2), gy = Y(c.y + c.h / 2);
    ctx.fillStyle = c.gem;
    ctx.beginPath();
    ctx.moveTo(gx, gy - 12); ctx.lineTo(gx + 10, gy); ctx.lineTo(gx, gy + 12); ctx.lineTo(gx - 10, gy);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.beginPath(); ctx.arc(gx - 3, gy - 4, 2.5, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.fillStyle = 'rgba(139,150,171,0.8)';
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('EMPTY', X(c.x) + c.w / 2, Y(c.y) + c.h / 2 + 3);
    ctx.textAlign = 'left';
  }
}

function drawStatue(ctx, s) {
  ctx.fillStyle = '#4a4238';
  ctx.fillRect(X(s.x) - 16, Y(s.y) + 8, 32, 12);
  ctx.fillStyle = '#8d8578';
  if (s.kind === 'bust') {
    ctx.beginPath(); ctx.arc(X(s.x), Y(s.y) - 2, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(X(s.x), Y(s.y) + 12, 15, 9, 0, Math.PI, 0); ctx.fill();
  } else {
    ctx.beginPath(); ctx.ellipse(X(s.x), Y(s.y), 17, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(X(s.x) + 12, Y(s.y) - 8, 6, 0, Math.PI * 2); ctx.fill();
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(X(s.x), Y(s.y), s.r, 0, Math.PI * 2); ctx.stroke();
}

function drawPlant(ctx, p) {
  ctx.fillStyle = '#6b4423';
  ctx.beginPath();
  ctx.moveTo(X(p.x) - 12, Y(p.y) + 4); ctx.lineTo(X(p.x) + 12, Y(p.y) + 4);
  ctx.lineTo(X(p.x) + 8, Y(p.y) + 16); ctx.lineTo(X(p.x) - 8, Y(p.y) + 16);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#2f6b34';
  for (const [dx, dy, r] of [[-8, -8, 9], [8, -10, 9], [0, -16, 10]]) {
    ctx.beginPath(); ctx.arc(X(p.x + dx), Y(p.y + dy), r, 0, Math.PI * 2); ctx.fill();
  }
}

function drawSunflower(ctx, x, y, t, taken) {
  // The prize: bobbing, glowing gold, on its pedestal.
  const bob = taken ? 0 : Math.sin(t * 2) * 3;
  const gy = Y(y) + bob;
  if (!taken) {
    const g = ctx.createRadialGradient(X(x), gy, 4, X(x), gy, 46);
    g.addColorStop(0, 'rgba(216,169,78,0.5)');
    g.addColorStop(1, 'rgba(216,169,78,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(X(x), gy, 46, 0, Math.PI * 2); ctx.fill();
  }
  if (taken) return;
  ctx.fillStyle = C.gold;
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(X(x) + Math.cos(a) * 13, gy + Math.sin(a) * 11, 9, 5, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#6b4a12';
  ctx.beginPath(); ctx.arc(X(x), gy, 9, 0, Math.PI * 2); ctx.fill();
}

function drawLasers(ctx, room, live, t) {
  if (!room.lasers.length) return;
  const pulse = 0.55 + 0.35 * Math.sin(t * 4);
  ctx.save();
  ctx.shadowColor = live ? '#ff3b30' : '#888888';
  ctx.shadowBlur = live ? 12 : 8;
  ctx.strokeStyle = live ? `rgba(255,59,48,${pulse})` : 'rgba(150,150,150,0.5)';
  ctx.lineWidth = live ? 3.5 : 2.5;
  for (const b of room.lasers) {
    ctx.beginPath();
    ctx.moveTo(X(b.x1), Y(b.y1)); ctx.lineTo(X(b.x2), Y(b.y2));
    ctx.stroke();
  }
  ctx.restore();
  ctx.fillStyle = live ? '#ff3b30' : '#999';
  for (const b of room.lasers) {
    ctx.beginPath(); ctx.arc(X(b.x1), Y(b.y1), 3, 0, Math.PI * 2); ctx.fill();
  }
}

function drawExitPad(ctx, room, state) {
  const pad = room.exitPad;
  if (!pad) return;
  const open = state.taken.sunflower;
  const pulse = 0.5 + 0.3 * Math.sin(state.time * 3);
  if (open) {
    const g = ctx.createRadialGradient(X(pad.x + pad.w / 2), Y(pad.y + pad.h / 2), 4, X(pad.x + pad.w / 2), Y(pad.y + pad.h / 2), 80);
    g.addColorStop(0, `rgba(63,184,166,${pulse})`);
    g.addColorStop(1, 'rgba(63,184,166,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(X(pad.x + pad.w / 2), Y(pad.y + pad.h / 2), 80, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = open ? 'rgba(63,184,166,0.25)' : 'rgba(90,100,120,0.25)';
  ctx.fillRect(X(pad.x), Y(pad.y), pad.w, pad.h);
  ctx.strokeStyle = open ? C.teal : '#5a6478';
  ctx.lineWidth = 2;
  ctx.strokeRect(X(pad.x), Y(pad.y), pad.w, pad.h);
  ctx.fillStyle = open ? '#7df0dd' : '#8b96ab';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT OPEN — RUN' : 'EXIT — NEED THE SUNFLOWER', X(pad.x + pad.w / 2), Y(pad.y) - 8);
  ctx.textAlign = 'left';
}

function drawEscapeRoute(ctx, state, room) {
  if (!state.taken.sunflower || !room.exitPad) return;
  const p = state.player;
  const tx = room.exitPad.x + room.exitPad.w / 2;
  const ty = room.exitPad.y + room.exitPad.h / 2;
  ctx.save();
  ctx.setLineDash([8, 7]);
  ctx.strokeStyle = '#37d67a';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(X(p.x), Y(p.y));
  ctx.lineTo(X(tx), Y(ty));
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#37d67a';
  const a = Math.atan2(ty - p.y, tx - p.x);
  ctx.beginPath();
  ctx.moveTo(X(tx), Y(ty));
  ctx.lineTo(X(tx) - Math.cos(a - 0.4) * 14, Y(ty) - Math.sin(a - 0.4) * 14);
  ctx.lineTo(X(tx) - Math.cos(a + 0.4) * 14, Y(ty) - Math.sin(a + 0.4) * 14);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRoutes(ctx, state) {
  for (const g of state.guards) {
    const wps = g.def.waypoints;
    ctx.save();
    ctx.setLineDash([5, 6]);
    ctx.strokeStyle = 'rgba(232,163,61,0.55)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    wps.forEach((w, i) => {
      if (i === 0) ctx.moveTo(X(w.x), Y(w.y));
      else ctx.lineTo(X(w.x), Y(w.y));
    });
    ctx.closePath();
    ctx.stroke();
    ctx.setLineDash([]);
    wps.forEach((w, i) => {
      ctx.fillStyle = i === g.wp ? C.gold : 'rgba(232,163,61,0.8)';
      ctx.beginPath(); ctx.arc(X(w.x), Y(w.y), 3.5, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();
  }
}

function wedge(ctx, x, y, angle, half, r, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(X(x), Y(y));
  ctx.arc(X(x), Y(y), r, angle - half, angle + half);
  ctx.closePath();
  ctx.fill();
}

function drawCones(ctx, state) {
  for (const g of state.guards) {
    const col = g.state === 'ALERT' ? '214,69,65' : g.state === 'SUSPICIOUS' || g.state === 'SEARCH' ? '232,163,61' : '232,163,61';
    const a = g.state === 'ALERT' ? 0.26 : g.state === 'SUSPICIOUS' ? 0.2 : 0.13;
    wedge(ctx, g.x, g.y, g.facing, Math.PI / 2, 120, `rgba(${col},0.05)`); // faint peripheral
    wedge(ctx, g.x, g.y, g.facing, Math.PI / 6, 215, `rgba(${col},${a})`); // focused 60°
  }
  for (const cam of state.cameras) {
    const blind = cam.blind > 0;
    wedge(ctx, cam.x, cam.y, cam.angle, Math.PI / 6, 270, blind ? 'rgba(150,150,150,0.10)' : 'rgba(214,69,65,0.16)');
    ctx.strokeStyle = blind ? 'rgba(150,150,150,0.5)' : 'rgba(214,69,65,0.5)';
    ctx.lineWidth = 1;
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(X(cam.x), Y(cam.y));
      ctx.lineTo(X(cam.x + Math.cos(cam.angle + s * Math.PI / 6) * 270), Y(cam.y + Math.sin(cam.angle + s * Math.PI / 6) * 270));
      ctx.stroke();
    }
  }
}

function drawNoises(ctx, state) {
  for (const n of state.noises) {
    ctx.strokeStyle = `rgba(232,226,210,${Math.max(0, 0.8 - n.age)})`;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(X(n.x), Y(n.y), n.r, 0, Math.PI * 2); ctx.stroke();
  }
}

function drawSmoke(ctx, state) {
  for (const s of state.smokes) {
    const g = ctx.createRadialGradient(X(s.x), Y(s.y), 4, X(s.x), Y(s.y), s.r);
    g.addColorStop(0, 'rgba(170,180,195,0.55)');
    g.addColorStop(1, 'rgba(170,180,195,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(X(s.x), Y(s.y), s.r, 0, Math.PI * 2); ctx.fill();
  }
}

function rim(ctx, x, y, r, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(X(x), Y(y), r, 0, Math.PI * 2); ctx.stroke();
}

function drawGuard(ctx, g) {
  const x = X(g.x), y = Y(g.y);
  const col = g.state === 'ALERT' ? '#d64541' : g.state === 'SUSPICIOUS' || g.state === 'SEARCH' ? '#e8a33d' : '#7fa8c9';
  // Body + 2px rim.
  ctx.fillStyle = '#2b3a55';
  ctx.beginPath(); ctx.arc(x, y, 13, 0, Math.PI * 2); ctx.fill();
  rim(ctx, g.x, g.y, 13, col);
  // Cap (half circle toward facing) + facing tick.
  ctx.fillStyle = '#1a2438';
  ctx.beginPath();
  ctx.arc(x, y, 13, g.facing - Math.PI / 2, g.facing + Math.PI / 2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(g.facing) * 18, y + Math.sin(g.facing) * 18);
  ctx.stroke();
  // Detection pie above the head, filling clockwise.
  const py = y - 30;
  ctx.fillStyle = 'rgba(10,15,28,0.9)';
  ctx.beginPath(); ctx.arc(x, py, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = g.meter >= 85 ? C.red : g.meter >= 40 ? C.amber : C.teal;
  ctx.beginPath();
  ctx.moveTo(x, py);
  ctx.arc(x, py, 7, -Math.PI / 2, -Math.PI / 2 + (g.meter / 100) * Math.PI * 2);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a4a68';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(x, py, 7, 0, Math.PI * 2); ctx.stroke();
  // "?" suspicious, "!" alert.
  if (g.state === 'SUSPICIOUS' || g.state === 'SEARCH') {
    ctx.fillStyle = C.amber;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('?', x, py - 12);
  } else if (g.state === 'ALERT') {
    ctx.fillStyle = C.red;
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', x, py - 12);
  }
  // Name tag.
  ctx.fillStyle = '#e8e2d2';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(g.def.short, x, y - 44);
  ctx.textAlign = 'left';
}

function drawPlayer(ctx, state) {
  const p = state.player;
  const x = X(p.x), y = Y(p.y);
  if (state.taken.sunflower) {
    const g = ctx.createRadialGradient(x, y, 4, x, y, 34);
    g.addColorStop(0, 'rgba(216,169,78,0.5)');
    g.addColorStop(1, 'rgba(216,169,78,0)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(x, y, 34, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#16121f';
  ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
  rim(ctx, p.x, p.y, 12, C.teal);
  // Hood point toward facing + gold trim.
  ctx.fillStyle = '#16121f';
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(p.dir) * 18, y + Math.sin(p.dir) * 18);
  ctx.lineTo(x + Math.cos(p.dir + 2.4) * 10, y + Math.sin(p.dir + 2.4) * 10);
  ctx.lineTo(x + Math.cos(p.dir - 2.4) * 10, y + Math.sin(p.dir - 2.4) * 10);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C.gold;
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, 8, p.dir - 1.1, p.dir + 1.1); ctx.stroke();
  if (state.taken.sunflower && !state.stageSunflower) {
    // The prize rides on Sable's back.
    ctx.fillStyle = C.gold;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      ctx.beginPath();
      ctx.ellipse(x + Math.cos(a) * 7, y - 20 + Math.sin(a) * 6, 4.5, 2.5, a, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#6b4a12';
    ctx.beginPath(); ctx.arc(x, y - 20, 4.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#e8e2d2';
  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SABLE', x, y - 22);
  ctx.textAlign = 'left';
}

function drawCamera(ctx, cam) {
  const x = X(cam.x), y = Y(cam.y);
  ctx.fillStyle = '#3a4356';
  ctx.fillRect(x - 9, y - 6, 18, 12);
  ctx.fillStyle = cam.blind > 0 ? '#888' : C.red;
  ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  if (cam.blind > 0) {
    ctx.fillStyle = '#c9c9c9';
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BLIND', x, y - 12);
    ctx.textAlign = 'left';
  }
}

function drawDoors(ctx, room) {
  ctx.fillStyle = C.gold;
  ctx.font = 'bold 11px system-ui, sans-serif';
  ctx.textAlign = 'center';
  if (room.doorNorth) {
    ctx.fillText('GALLERY  ↑', X(507), Y(4) + 12);
  }
  if (room.doorSouth) {
    ctx.fillText('↓  BACK', X(507), Y(592) - 4);
  }
  ctx.textAlign = 'left';
}

export function drawGame(ctx, state) {
  const room = state.rooms[state.room];
  // Playfield frame.
  ctx.fillStyle = '#05080f';
  ctx.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
  drawFloor(ctx);
  drawCarpet(ctx, room);
  drawShadows(ctx, room);
  drawLampPools(ctx, room);
  for (const p of room.paintings) drawPainting(ctx, p);
  for (const c of room.cases) drawCase(ctx, c, state, room);
  for (const s of room.statues) drawStatue(ctx, s);
  for (const p of room.plants) drawPlant(ctx, p);
  if (room.pedestal) {
    ctx.fillStyle = '#4a4238';
    ctx.fillRect(X(room.pedestal.x) - 22, Y(room.pedestal.y) - 8, 44, 16);
    drawSunflower(ctx, room.pedestal.x, room.pedestal.y - 14, state.time, state.taken.sunflower && !state.stageSunflower);
  }
  drawLasers(ctx, room, state.lasersLive, state.time);
  drawExitPad(ctx, room, state);
  drawEscapeRoute(ctx, state, room);
  drawRoutes(ctx, state);
  drawCones(ctx, state);
  drawNoises(ctx, state);
  drawSmoke(ctx, state);
  for (const cam of state.cameras) drawCamera(ctx, cam);
  for (const g of state.guards) drawGuard(ctx, g);
  drawPlayer(ctx, state);
  // Pick prompt / hold-E ring.
  if (state.pickTarget && state.mode === 'play') {
    const t = state.pickTarget;
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOLD E — ' + t.label, X(state.player.x), Y(state.player.y) - 30);
    ctx.strokeStyle = C.gold;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(X(state.player.x), Y(state.player.y), 20, -Math.PI / 2, -Math.PI / 2 + state.pickT * Math.PI * 2);
    ctx.stroke();
    ctx.textAlign = 'left';
  }
  drawDoors(ctx, room);
  // Alarm palette flip: the whole room washes red while ALARMED.
  if (state.alarm >= 70) {
    ctx.fillStyle = `rgba(180,20,20,${((state.alarm - 70) / 30) * 0.16})`;
    ctx.fillRect(PLAY.x, PLAY.y, PLAY.w, PLAY.h);
  }
  ctx.strokeStyle = C.panelEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(PLAY.x + 1, PLAY.y + 1, PLAY.w - 2, PLAY.h - 2);
}

export function drawFrame(ctx, state) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, 1280, 720);
  if (state.mode === 'title') {
    drawPlan(ctx, state);
    return;
  }
  drawGame(ctx, state);
  const room = state.rooms[state.room];
  drawTopBar(ctx, state, room);
  drawPanel(ctx, state, room);
  drawDialog(ctx, state);
  drawCallouts(ctx, state);
  if (state.mode === 'win') drawWin(ctx, state);
  if (state.mode === 'caught') drawCaught(ctx, state);
  if (state.paused) {
    ctx.fillStyle = 'rgba(8,12,22,0.7)';
    ctx.fillRect(0, 0, 1280, 720);
    ctx.fillStyle = C.gold;
    ctx.font = 'bold 40px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', 640, 360);
    ctx.textAlign = 'left';
  }
}
