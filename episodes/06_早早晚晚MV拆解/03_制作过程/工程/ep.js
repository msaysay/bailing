// ===== 第六期：《早早晚晚》MV 拆解（竖屏 1080x1920，画面跟着配音逐字时间走）=====
const DUR = 96.4;
const CL = { sm: 366, campus: 42, train: 39, ring: 60, alarm: 57, depart: 45, ink: 108, home: 150, kick: 138, lake: 162, fin: 246 };
const IMG = new Map(), REQ = new Set();
function im(key) { const v = IMG.get(key); if (v) return v; REQ.add(key); return null; }
async function loadReq() {
  await Promise.all([...REQ].map(k => new Promise(r => { const i = new Image(); i.onload = () => { IMG.set(k, i); r(); }; i.onerror = () => { console.log('MISSING', k); IMG.set(k, mkCanvas(8, 8)); r(); }; i.src = 'assets/' + k; })));
  REQ.clear();
  if (IMG.size > 520) { let n = 0; for (const k of [...IMG.keys()]) if (k.includes('/') && n++ < 260) IMG.delete(k); }
}
const clip = (name, t, loop) => { let i = Math.floor(t * 30); i = loop ? ((i % CL[name]) + CL[name]) % CL[name] : clamp(i, 0, CL[name] - 1); return im(`${name}/${String(i + 1).padStart(4, '0')}.jpg`); };
const cjk = s => s.replace(/([一-鿿])([A-Za-z0-9])/g, '$1 $2').replace(/([A-Za-z0-9])([一-鿿])/g, '$1 $2');
const pop = (T, t0, d = .35) => { const p = sst(t0, t0 + d, T); return p <= 0 ? 0 : p; };
const slam = (T, t0) => { const p = sst(t0, t0 + .28, T); return [p, 1 + (1 - easeOut(p)) * .7]; };
function cover(c, img, x, y, w, h) { if (!img) return; const r = Math.max(w / img.width, h / img.height), sw = w / r, sh = h / r; c.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, x, y, w, h); }
function card(c, img, cx, cy, w, h, o = {}) {
  const a = o.a === undefined ? 1 : o.a, s = o.s || 1; if (a <= 0) return;
  c.save(); c.globalAlpha *= a; c.translate(cx, cy); c.rotate(o.rot || 0); c.scale(s, s);
  c.shadowColor = o.glow || 'rgba(0,0,0,.7)'; c.shadowBlur = o.gb || 60; c.shadowOffsetY = o.glow ? 0 : 24; rr(c, -w / 2, -h / 2, w, h, o.r || 34); c.fillStyle = '#111'; c.fill(); c.shadowBlur = 0; c.shadowOffsetY = 0;
  c.save(); rr(c, -w / 2, -h / 2, w, h, o.r || 34); c.clip(); if (o.draw) o.draw(c, -w / 2, -h / 2, w, h); else cover(c, img, -w / 2, -h / 2, w, h); if (o.gray) { c.globalCompositeOperation = 'saturation'; c.fillStyle = `rgba(128,128,128,${o.gray})`; c.fillRect(-w / 2, -h / 2, w, h); c.globalCompositeOperation = 'source-over'; c.fillStyle = `rgba(0,0,0,${o.gray * .35})`; c.fillRect(-w / 2, -h / 2, w, h); } c.restore();
  rr(c, -w / 2, -h / 2, w, h, o.r || 34); c.lineWidth = o.lw || 4; c.strokeStyle = o.stroke || 'rgba(245,241,232,.35)'; c.stroke(); c.restore();
}
function cross(c, x, y, s, p, col = RED) { if (p <= 0) return; c.save(); c.strokeStyle = col; c.lineWidth = s * .16; c.lineCap = 'round'; const a = clamp(p * 2), b = clamp(p * 2 - 1); c.beginPath(); c.moveTo(x - s / 2, y - s / 2); c.lineTo(x - s / 2 + s * a, y - s / 2 + s * a); c.stroke(); if (b > 0) { c.beginPath(); c.moveTo(x + s / 2, y - s / 2); c.lineTo(x + s / 2 - s * b, y - s / 2 + s * b); c.stroke(); } c.restore(); }
function wave(c, x, y, w, h, seed, T, o = {}) { const n = o.n || 46; c.save(); for (let i = 0; i < n; i++) { const v = (.25 + .75 * Math.abs(Math.sin(i * .7 + seed) * Math.sin(i * .23 + seed * 2))) * (.75 + .25 * Math.sin(T * 6 + i)), bh = h * v, px = x + i * (w / n); c.fillStyle = (o.prog !== undefined && i / n < o.prog) ? GOLD : (o.col || 'rgba(245,241,232,.45)'); rr(c, px, y - bh / 2, w / n * .6, bh, 3); c.fill(); } c.restore(); }
function redBox(c, x, y, w, h, p, label) { if (p <= 0) return; c.save(); c.globalAlpha *= clamp(p * 2); const k = 1 + (1 - easeOut(p)) * .25; c.translate(x + w / 2, y + h / 2); c.scale(k, k); c.strokeStyle = RED; c.lineWidth = 8; c.setLineDash([22, 12]); rr(c, -w / 2, -h / 2, w, h, 16); c.stroke(); c.setLineDash([]); if (label) { const lw = tw(c, label, 46, 900) + 44; rr(c, -lw / 2, h / 2 + 18, lw, 76, 14); c.fillStyle = RED; c.fill(); txt(c, label, 0, h / 2 + 58, 46, { w: 900, col: '#fff' }); } c.restore(); }
function header(c, T, t0, t1, no, title) { const a = pop(T, t0, .4) * (1 - sst(t1 - .3, t1, T)); if (a <= 0) return; c.save(); c.globalAlpha *= a; const dx = (1 - easeOut(a)) * -60; rr(c, 70 + dx, 232, 118, 84, 18); c.fillStyle = GOLD; c.fill(); txt(c, no, 129 + dx, 276, 54, { w: 900, col: '#0A0A0A' }); txt(c, title, 214 + dx, 276, 60, { al: 'left', w: 900 }); c.restore(); }

// ---- live layered drawing of the campus scene (uses the MV's own drawing library) ----
const LC = mkCanvas(W, H), LX = LC.getContext('2d');
function campusLayers(T, st) { // st: 0 sky, 1 clouds+ridges, 2 tree, 3 figures (fractional = fading in)
  const g = LX, a = k => clamp(st - k + 1); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = '#0b0b12'; g.fillRect(0, 0, W, H);
  g.globalAlpha = a(0); sky(g, ['#232458', '#5d4488', '#c9697f', '#ff9f74', '#ffdf9e'], 0, 1330, [0, .3, .62, .85, 1]); stars(g, T, 90, .5 * a(0), 600, 3); g.globalAlpha = a(0); sun(g, 540, 1215, 92, '#fff3cf', '#ff9a5a', a(0)); g.fillStyle = '#0a0a1c'; g.fillRect(0, 1330, W, 600);
  if (a(1) > 0) { g.globalAlpha = a(1); cloudBand(g, T, 7, 380, 980, .7, 1.5, '#ffb89a', .55, 1, 7, '#8d5a96'); ridge(g, 1210, 120, .0016, 11, 0, vgrad(g, 1080, 1400, '#7c4a86', '#c66e7c')); ridge(g, 1290, 90, .0022, 12, 0, vgrad(g, 1200, 1500, '#4a2f6a', '#8e4f78')); }
  const hy = x => 1420 - 110 * Math.exp(-Math.pow((x - 540) / 420, 2)) + 18 * Math.sin(x * .004);
  if (a(2) > 0) { g.globalAlpha = a(2); g.beginPath(); g.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 10) g.lineTo(x, hy(x)); g.lineTo(W + 50, H); g.closePath(); g.fillStyle = vgrad(g, 1300, 1920, '#1b1436', '#0a0a1c'); g.fill(); tree(g, 5, 540, hy(540) + 14, 900, '#140f2c', T); }
  if (a(3) > 0) { g.globalAlpha = a(3); const xa = 400, xb = 476; figure(g, { x: xa, y: hy(xa) + 4, h: 150, dir: 1, ph: T * 4.2, col: '#120d28', rim: '#ffb07a', hair: true, skirt: true, stride: .7 }); figure(g, { x: xb, y: hy(xb) + 4, h: 162, dir: 1, ph: T * 4.2 + 1, col: '#120d28', rim: '#ffb07a', pack: true, stride: .7 }); petals(g, T, 70, i => ['#ffd2d8', '#ffb3c1', '#fff0e0'][i % 3], 1, .9, 70, 110); }
  g.globalAlpha = 1; return LC;
}

const CW = 600, CH = 1067, CX = 540, CY = 900; // main card
// ================= scenes =================
function scHook(c, T) {
  cover(c, clip('sm', T * .9), -40 - T * 2, -70 - T * 3, W + 80 + T * 4, H + 140 + T * 7);
  c.fillStyle = `rgba(6,5,14,${lerp(.12, .84, sst(.75, 1.1, T))})`; c.fillRect(0, 0, W, H);
  // counters
  const co = 1 - sst(3.6, 3.85, T);
  txt(c, '这首歌的 MV', 540, 330, 60, { a: pop(T, .95, .3) * co, w: 700, col: DG });
  [[.9, '3 分 37 秒', 560], [1.92, '19 个场景', 830], [2.8, '6500 帧', 1100]].forEach(([t0, s, y], i) => { const [p, k] = slam(T, t0); if (p > 0) { c.save(); c.globalAlpha = p * co; c.translate(540, y); c.scale(k, k); txt(c, s, 0, 0, 176, { w: 900, col: i === 2 ? GOLD : WH, glow: i === 2 ? 'rgba(215,185,121,.6)' : 'rgba(0,0,0,.6)', gb: 50 }); c.restore(); } });
  // negations
  const no = pop(T, 3.74, .3) * (1 - sst(6.6, 6.84, T));
  if (no > 0) { c.save(); c.globalAlpha = no; txt(c, '没有一帧是我画的', 540, 520, 96, { w: 900 }); const a2 = pop(T, 4.98, .3); chip(c, 300, 860, '手绘', { size: 92, a: pop(T, 4.2, .25), padx: 60, h: 190, r: 30 }); cross(c, 300, 860, 190, sst(4.5, 4.9, T)); chip(c, 730, 860, '视频模型', { size: 80, a: a2, padx: 44, h: 190, r: 30 }); cross(c, 730, 860, 190, sst(6.1, 6.5, T)); txt(c, '也没用任何视频生成模型', 540, 1120, 62, { a: a2, w: 700, col: DG }); c.restore(); }
  // suno + code
  const sc = pop(T, 6.84, .3) * (1 - sst(10.35, 10.6, T));
  if (sc > 0) {
    c.save(); c.globalAlpha = sc; const a1 = pop(T, 6.84, .35), a2 = pop(T, 7.94, .35);
    box(c, 80, 330, 920, 330, { a: a1, fill: 'rgba(10,10,16,.78)', stroke: 'rgba(215,185,121,.5)' }); txt(c, '歌', 150, 410, 64, { al: 'left', w: 900, col: GOLD, a: a1 }); txt(c, 'Suno 生成', 240, 412, 54, { al: 'left', a: a1 }); c.save(); c.globalAlpha *= a1; wave(c, 140, 560, 800, 150, 2, T, { n: 60, prog: sst(7, 10.3, T) }); c.restore();
    box(c, 80, 700, 920, 500, { a: a2, fill: 'rgba(10,10,16,.78)', stroke: 'rgba(215,185,121,.5)' }); txt(c, '画面', 150, 780, 64, { al: 'left', w: 900, col: GOLD, a: a2 }); txt(c, 'AI 写代码', 300, 782, 54, { al: 'left', a: a2 });
    const lines = ["sky(ctx, ['#232458', '#5d4488', ...]);", "sun(ctx, 540, 1215, 92, '#fff3cf');", "tree(ctx, 5, 540, hy(540), 900);", "figure(ctx, { x, h: 162, pack: true });"]; const nch = Math.floor(Math.max(0, T - 8.3) * 60); let acc = 0;
    lines.forEach((l, i) => { const s = l.slice(0, clamp(nch - acc, 0, l.length)); acc += l.length; txt(c, s, 140, 880 + i * 74, 38, { al: 'left', f: "'DejaVu Sans Mono', monospace", w: 400, col: i % 2 ? '#c3e88d' : '#82aaff', a: a2 }); });
    // film strip: frame by frame
    const fs = pop(T, 9.16, .3); if (fs > 0) { const step = Math.floor(Math.max(0, T - 9.16) * 7); for (let i = 0; i < 5; i++) { const x = 100 + i * 180, on = i === step % 5; c.save(); c.globalAlpha *= fs; rr(c, x, 1240, 160, 230, 12); c.save(); c.clip(); cover(c, im(`kick/${String(20 + (step + i) * 9 % 110 + 1).padStart(4, '0')}.jpg`), x, 1240, 160, 230); c.restore(); c.lineWidth = on ? 6 : 2; c.strokeStyle = on ? GOLD : 'rgba(245,241,232,.4)'; c.stroke(); c.restore(); } }
    c.restore();
  }
  // title
  const [tp, tk] = slam(T, 10.75); if (tp > 0) { c.fillStyle = `rgba(6,5,14,${tp * .5})`; c.fillRect(0, 0, W, H); c.save(); c.globalAlpha = tp; c.translate(540, 820); c.scale(tk, tk); txt(c, '自己', 0, -130, 250, { w: 900 }); txt(c, '拆自己', 0, 150, 250, { w: 900, col: GOLD, glow: 'rgba(215,185,121,.6)', gb: 60 }); c.restore(); txt(c, '《早早晚晚》MV 是怎么做出来的', 540, 1230, 48, { a: pop(T, 11.1, .3), col: WH, w: 400 }); }
}
function scSong(c, T) {
  header(c, T, 12.0, 17.3, '01', '做歌');
  const a = pop(T, 12.5, .4); box(c, 90, 430, 900, 880, { a, fill: 'rgba(245,241,232,.04)' }); txt(c, 'Suno', 150, 520, 76, { al: 'left', w: 900, a }); txt(c, '《早早晚晚》', 930, 524, 46, { al: 'right', col: DG, a });
  const pick = sst(15.48, 15.9, T);
  [['版本 A', 3], ['版本 B', 8]].forEach(([nm, sd], i) => { const p = pop(T, 14.5 + i * .25, .35), y = 640 + i * 320, sel = i === 1 ? pick : 0, dim = i === 0 ? 1 - pick * .65 : 1; if (p <= 0) return; c.save(); c.globalAlpha *= p * dim; c.translate(0, (1 - easeOut(p)) * 30); box(c, 130, y, 820, 260, { fill: sel ? 'rgba(215,185,121,.14)' : 'rgba(245,241,232,.05)', stroke: sel ? GOLD : 'rgba(245,241,232,.3)', lw: sel ? 5 : 2.5 }); txt(c, nm, 170, y + 62, 46, { al: 'left', col: sel ? GOLD : WH }); wave(c, 170, y + 160, 740, 110, sd, T, { n: 56, prog: sel ? ((T - 15.5) / 3) % 1 : undefined }); c.restore(); });
  if (pick > 0) { chip(c, 760, 1022, '人声最干净', { gold: 1, size: 44, a: pick, fill: '#17130a' }); check(c, 590, 1022, 60, sst(15.9, 16.4, T)); }
}
function scHand(c, T) {
  header(c, T, 17.3, 34.0, '02', '把歌交给 AI');
  const A = 1 - sst(21.9, 22.2, T);
  if (A > 0 && T < 22.3) { c.save(); c.globalAlpha = A; const fy = lerp(520, 560, Math.sin(T * 2) * .5 + .5); chip(c, 540, fy, '♪  早早晚晚.mp3', { size: 56, gold: 1, a: pop(T, 17.6, .3), padx: 44, h: 130, r: 26 }); arrow(c, 540, 660, 540, 760, GOLD, easeOut(sst(18.1, 18.6, T)), 6);
    [['Claude Code', 18.7], ['Codex', 19.74], ['WorkBuddy', 20.22], ['豆包', 20.94]].forEach(([n, t0], i) => { const [p, k] = slam(T, t0), all = sst(21.4, 21.8, T); if (p <= 0) return; c.save(); c.translate(540, 870 + i * 150); c.scale(k, k); chip(c, 0, 0, n, { size: 64, a: p, wd: 640, h: 120, r: 24, gold: all > 0 || (T < t0 + .7) }); c.restore(); });
    txt(c, '都可以', 540, 1490, 60, { a: pop(T, 21.5, .3), col: GOLD, w: 900 }); c.restore(); }
  // one sentence
  const B = pop(T, 22.2, .3) * (1 - sst(25.75, 26.1, T));
  if (B > 0) { c.save(); c.globalAlpha = B; txt(c, '我只说了一句', 540, 520, 64, { col: DG, w: 700 }); const s = '用我的 Skill，做一个能打动人的 MV', n = Math.floor(clamp((T - 23.18) / 1.9, 0, 1) * s.length), part = s.slice(0, n); const l1 = part.slice(0, 10), l2 = part.slice(10); c.translate(0, 0); rr(c, 120, 700, 840, 330, 40); c.fillStyle = 'rgba(215,185,121,.17)'; c.fill(); c.lineWidth = 3; c.strokeStyle = GOLD; c.stroke(); txt(c, l1, 180, 810, 68, { al: 'left', w: 700 }); txt(c, l2, 180, 920, 68, { al: 'left', w: 700 }); if (Math.floor(T * 3) % 2) { c.fillStyle = GOLD; c.fillRect(186 + tw(c, l2 || l1, 68), (l2 ? 920 : 810) - 40, 6, 80); } txt(c, '我', 950, 660, 38, { al: 'right', col: DG }); c.restore(); }
  // listening
  const C = pop(T, 26.1, .3) * (1 - sst(29.7, 30, T));
  if (C > 0) { c.save(); c.globalAlpha = C; txt(c, 'AI 先自己听歌', 540, 420, 64, { w: 900 }); box(c, 80, 500, 920, 190, { fill: 'rgba(245,241,232,.04)' }); const t0 = 14 + (T - 26.1) * 6; for (let i = 0; i < 110; i++) { const tt = t0 + (i - 55) * .25, v = AUD.rms[clamp(Math.round(tt * 30), 0, AUD.rms.length - 1)] || 0; c.fillStyle = i < 55 ? GOLD : 'rgba(245,241,232,.4)'; const bh = 10 + v * 150; c.fillRect(100 + i * 8, 595 - bh / 2, 5, bh); } c.fillStyle = '#fff'; c.fillRect(538, 510, 4, 170);
    LY.slice(0, 8).forEach((l, i) => { const p = pop(T, 27.3 + i * .27, .3), y = 780 + i * 82; if (p <= 0) return; c.save(); c.globalAlpha *= p; c.translate((1 - easeOut(p)) * 60, 0); txt(c, l.a.toFixed(2) + 's', 250, y, 44, { al: 'right', col: GOLD, f: "'DejaVu Sans Mono', monospace", w: 700 }); txt(c, l.text, 290, y, 50, { al: 'left', w: 400 }); c.restore(); });
    txt(c, '62 句歌词 · 每个字都有时间', 540, 1470, 40, { col: DG, a: pop(T, 29, .3), w: 400 }); c.restore(); }
  // kick
  const D = pop(T, 30, .3);
  if (D > 0 && T < 34.2) { c.save(); c.globalAlpha = D; const st = 168.1 + (T - 30), k = AUD.kick[Math.round(st * 30)] || 0; card(c, clip('kick', T - 30), 540, 800, 520, 924, { s: 1 + k * .05, stroke: `rgba(215,185,121,${.3 + k * .7})`, lw: 4 + k * 8, glow: `rgba(215,185,121,${k * .7})`, gb: 80 });
    txt(c, '鼓点', 130, 1375, 48, { al: 'left', col: GOLD, w: 900 }); box(c, 80, 1300, 920, 170, { fill: 'rgba(10,10,16,.6)' }); for (let i = 0; i < 150; i++) { const v = AUD.kick[Math.round((st + (i - 110) / 30) * 30)] || 0; c.fillStyle = i === 110 ? '#fff' : (i < 110 ? GOLD : 'rgba(245,241,232,.3)'); const bh = 6 + v * 120; c.fillRect(250 + i * 4.8, 1450 - bh, 3, bh); } c.restore(); }
}
const SB = [[35.54, 'campus', '毕业分别'], [36.62, 'train', '地铁车窗'], [37.6, 'ring', '戒指绕着月亮画一圈'], [39.24, 'alarm', '凌晨六点半的闹钟'], [40.8, 'depart', '唱到苏东坡……'], [41.96, 'ink', '画面直接变成水墨']];
function scBoard(c, T) {
  header(c, T, 34.1, 45.3, '03', '写分镜');
  if (T < 43.5) {
    let k = -1; SB.forEach((s, i) => { if (T >= s[0]) k = i; });
    if (k < 0) { const p = pop(T, 34.3, .4); for (let i = 0; i < 6; i++) { const x = 190 + (i % 3) * 350, y = 640 + Math.floor(i / 3) * 560; box(c, x - 150, y - 250, 300, 500, { a: p * (.4 + .6 * pop(T, 34.5 + i * .12, .3)), fill: 'rgba(245,241,232,.04)' }); txt(c, String(i + 1), x, y, 120, { col: 'rgba(215,185,121,.35)', w: 900, a: pop(T, 34.5 + i * .12, .3) }); } }
    else { const s = SB[k], lt = T - s[0], p = sst(0, .22, lt); card(c, clip(s[1], lt), CX + (1 - easeOut(p)) * 120, CY - 20, CW, CH, { a: p, rot: (1 - easeOut(p)) * .04, stroke: k === 5 ? GOLD : undefined }); if (k === 5) { c.fillStyle = `rgba(255,250,238,${(1 - sst(0, .35, lt)) * .9})`; c.fillRect(0, 0, W, H); }
      const lw = tw(c, s[2], 58, 900) + 70; c.save(); c.globalAlpha = p; rr(c, 540 - lw / 2, 1404, lw, 100, 22); c.fillStyle = k === 5 ? GOLD : '#14141c'; c.fill(); c.lineWidth = 3; c.strokeStyle = GOLD; c.stroke(); txt(c, s[2], 540, 1456, 58, { w: 900, col: k === 5 ? '#0A0A0A' : WH }); c.restore();
      for (let i = 0; i < 6; i++) dot(c, 420 + i * 48, 340, i === k ? 12 : 7, i <= k ? GOLD : 'rgba(245,241,232,.3)'); }
  } else { // wall of 19 scenes
    for (let i = 0; i < 19; i++) { const col = i % 5, row = Math.floor(i / 5), p = pop(T, 43.46 + i * .045, .3); if (p <= 0) continue; const x = 124 + col * 208, y = 500 + row * 290, k = 1 + (1 - easeOut(p)) * .5; card(c, im(`th_${i + 1}.jpg`), x, y, 190, 270, { a: p, s: k, r: 14, lw: 2, gb: 20 }); }
    const [p, k] = slam(T, 44.2); if (p > 0) { c.save(); c.globalAlpha = p; c.translate(540, 1210); c.scale(k, k); const lw = 760; rr(c, -lw / 2, -80, lw, 160, 30); c.fillStyle = 'rgba(8,8,14,.92)'; c.fill(); c.lineWidth = 4; c.strokeStyle = GOLD; c.stroke(); txt(c, '都是它自己想的', 0, 4, 84, { w: 900, col: GOLD }); c.restore(); }
  }
}
function scReject(c, T) {
  const fl = (1 - sst(45.3, 46.2, T)); if (fl > 0) { c.fillStyle = `rgba(201,88,74,${fl * .35})`; c.fillRect(0, 0, W, H); }
  header(c, T, 45.3, 58.5, '!', '第一版，它犯了个错');
  const A = 1 - sst(51.7, 52, T);
  if (A > 0) { c.save(); c.globalAlpha = A; const x0 = 90, wd = 900, X = s => x0 + wd * s / 60, y = 640; const a = pop(T, 46.3, .4);
    txt(c, '这首歌的前 60 秒', x0 + wd, 480, 40, { al: 'right', col: DG, a, w: 400 }); box(c, x0 - 10, 520, wd + 20, 240, { a, fill: 'rgba(245,241,232,.04)' });
    c.save(); c.globalAlpha *= a; for (let i = 0; i < 150; i++) { const s = i * .4, v = AUD.rms[Math.round(s * 30)] || 0, cut = s >= 16.8 && s < 31, bh = 14 + v * 150; c.fillStyle = cut && T > 50.38 ? RED : (s < 16.8 ? 'rgba(245,241,232,.25)' : 'rgba(245,241,232,.6)'); c.fillRect(X(s), y - bh / 2, 3.6, bh); } c.restore();
    const m1 = pop(T, 47.3, .3), m2 = slam(T, 49.0);
    if (m1 > 0) { c.save(); c.globalAlpha *= m1; c.fillStyle = WH; c.fillRect(X(31) - 2, 510, 4, 330); txt(c, 'AI 以为：31 秒开唱', X(31) + 16, 880, 44, { al: 'left', w: 700 }); c.restore(); }
    if (m2[0] > 0) { c.save(); c.globalAlpha *= m2[0]; c.fillStyle = GOLD; c.fillRect(X(16.8) - 3, 440, 6, 330); c.translate(X(16.8), 400); c.scale(m2[1], m2[1]); txt(c, '其实：17 秒就唱了', 0, 0, 56, { w: 900, col: GOLD }); c.restore(); }
    const cut = pop(T, 50.38, .3); if (cut > 0) { c.save(); c.globalAlpha *= cut; c.fillStyle = 'rgba(201,88,74,.22)'; c.fillRect(X(16.8), 524, X(31) - X(16.8), 232); txt(c, '前四句被切掉', 540, 1000, 64, { w: 900, col: RED }); LY.slice(0, 4).forEach((l, i) => { const p = pop(T, 50.5 + i * .25, .3), yy = 1100 + i * 86; txt(c, l.text, 540, yy, 50, { a: p * .85, w: 400 }); c.fillStyle = RED; c.fillRect(540 - 250, yy, 500 * sst(50.7 + i * .25, 51 + i * .25, T), 4); }); c.restore(); }
    c.restore(); }
  const B = pop(T, 51.9, .3) * (1 - sst(53.8, 54.05, T));
  if (B > 0) { c.save(); c.globalAlpha = B; txt(c, '我就说了一句', 540, 600, 64, { col: DG, w: 700 }); const s = '好像没切全吧', n = Math.floor(clamp((T - 52.9) / .55, 0, 1) * s.length); rr(c, 220, 760, 640, 220, 40); c.fillStyle = 'rgba(215,185,121,.17)'; c.fill(); c.lineWidth = 3; c.strokeStyle = GOLD; c.stroke(); txt(c, s.slice(0, n), 540, 872, 88, { w: 900 }); c.restore(); }
  const C = pop(T, 53.95, .3);
  if (C > 0 && T < 58.7) { c.save(); c.globalAlpha = C; const ear = 1 - sst(55.2, 55.4, T); if (ear > 0) { txt(c, '它重新听了一遍', 540, 760, 76, { w: 900, a: ear }); c.save(); c.globalAlpha *= ear; wave(c, 190, 960, 700, 220, 5, T, { n: 50, prog: sst(54, 55.3, T) }); c.restore(); }
    const p = slam(T, 55.34); if (p[0] > 0) { card(c, clip('home', T - 55.34 + 1.2), CX, CY - 10, CW, CH, { a: p[0], s: p[1] * .98, stroke: GOLD, lw: 5 }); chip(c, 250, 372, '+ 新增一场', { gold: 1, size: 44, fill: '#17130a', a: p[0] });
      [[56.18, '清晨的老屋', 300, 1300], [57.26, '母亲在门口挥手', 700, 1410]].forEach(([t0, s, x, y]) => { const q = slam(T, t0); if (q[0] > 0) { c.save(); c.translate(x, y); c.scale(q[1], q[1]); chip(c, 0, 0, s, { size: 54, a: q[0], fill: 'rgba(8,8,14,.92)', gold: 1, h: 104, r: 22 }); c.restore(); } }); }
    c.restore(); }
}
function scRender(c, T) {
  header(c, T, 58.5, 71.9, '04', '渲染');
  if (T < 64.2) { // layers
    const cu = [59.78, 60.45, 61.05, 61.6], st = cu.reduce((a, t0) => a + sst(t0, t0 + .35, T), 0) - 1; const codeIn = easeIO(sst(62.14, 62.7, T));
    const cx = lerp(CX, 330, codeIn), sc = lerp(1, .78, codeIn);
    card(c, null, cx, CY, CW, CH, { a: pop(T, 58.9, .4), s: sc, draw: (g, x, y, w, h) => { if (st > -1) g.drawImage(campusLayers(27 + (T - 59), Math.max(0, st)), x, y, w, h); else { g.fillStyle = '#0b0b12'; g.fillRect(x, y, w, h); } } });
    ['天空', '云', '树', '人的剪影'].forEach((s, i) => { const q = slam(T, cu[i]); if (q[0] <= 0) return; c.save(); c.globalAlpha = q[0] * (1 - codeIn); c.translate(880, 560 + i * 190); c.scale(q[1], q[1]); chip(c, 0, 0, s, { size: 50, gold: T < (cu[i + 1] || 62.1), fill: 'rgba(8,8,14,.9)', h: 100 }); c.restore(); arrow(c, 780, 560 + i * 190, 720, 560 + i * 190, GOLD, q[0] * (1 - codeIn), 4); });
    if (codeIn > 0) { c.save(); c.globalAlpha = codeIn; const x = 590, y = 480, w = 450, h = 840; box(c, x, y, w, h, { fill: 'rgba(10,12,20,.94)', stroke: 'rgba(215,185,121,.5)' }); c.save(); rr(c, x, y, w, h, 22); c.clip(); const off = (T - 62.14) * 150; CODE.forEach((l, i) => { const yy = y + 50 + i * 36 - off; if (yy < y - 20 || yy > y + h + 20) return; txt(c, l, x + 22, yy, 21, { al: 'left', f: "'DejaVu Sans Mono', monospace", w: 400, col: l.trim().startsWith('//') ? '#6b7394' : (i % 3 ? '#b8c4e8' : '#c3e88d') }); }); c.restore();
      const q = slam(T, 63.12); if (q[0] > 0) { c.save(); c.translate(540, 1440); c.scale(q[1], q[1]); c.globalAlpha = q[0]; txt(c, Math.round(lerp(0, 1222, easeOut(sst(63.12, 63.9, T)))) + ' 行代码', 0, 0, 96, { w: 900, col: GOLD, glow: 'rgba(215,185,121,.5)', gb: 40 }); c.restore(); } else txt(c, '全是代码画的', 540, 1440, 76, { w: 900, a: pop(T, 62.3, .3) }); c.restore(); }
  } else if (T < 66.04) { // test sheets
    txt(c, '先出测试图，自己看', 540, 400, 64, { w: 900, a: pop(T, 64.2, .3) });
    ['29.5', '34', '40', '43', '49', '53.2'].forEach((f, i) => { const p = pop(T, 64.25 + i * .09, .3); card(c, im(`st_${f}.jpg`), 215 + (i % 3) * 325, 730 + Math.floor(i / 3) * 520, 290, 490, { a: p, s: 1 + (1 - easeOut(p)) * .3, r: 18, lw: 2, gb: 24 }); });
    const sy = 480 + ((T - 64.6) / 1.4) * 1020; if (T > 64.6 && sy < 1500) { const g = c.createLinearGradient(0, sy - 90, 0, sy); g.addColorStop(0, 'rgba(215,185,121,0)'); g.addColorStop(1, 'rgba(215,185,121,.35)'); c.fillStyle = g; c.fillRect(60, sy - 90, 960, 90); c.fillStyle = GOLD; c.fillRect(60, sy, 960, 4); }
  } else if (T < 68.44) {
    const two = T >= 67.26, lt = T - (two ? 67.26 : 66.04), p = sst(0, .2, lt), z = 1 + easeOut(sst(0, 1.1, lt)) * .06; card(c, im(two ? 'st_53.2.jpg' : 'st_63.4.jpg'), CX, CY, CW, CH, { a: p, s: z });
    const bx = CX - CW / 2 * z, by = CY - CH / 2 * z, f = CW * z / 720; if (!two) redBox(c, bx + 92 * f, by + 765 * f, 356 * f, 225 * f, sst(.25, .6, lt), '树被切掉一半'); else redBox(c, bx + 95 * f, by + 800 * f, 470 * f, 210 * f, sst(.25, .6, lt), '字压到人身上');
  } else if (T < 70) {
    const w = easeIO(sst(68.6, 69.3, T)); card(c, null, CX, CY, CW, CH, { stroke: w > .9 ? GOLD : undefined, draw: (g, x, y, ww, h) => { cover(g, im('st_49.jpg'), x, y, ww, h); g.save(); g.beginPath(); g.rect(x, y, ww * w, h); g.clip(); cover(g, im('fix_49.jpg'), x, y, ww, h); g.restore(); g.fillStyle = GOLD; g.fillRect(x + ww * w - 3, y, 6, h); } });
    chip(c, 250, 400, '改前', { size: 44, a: 1 - w, fill: 'rgba(8,8,14,.9)', stroke: RED, col: RED }); chip(c, 830, 400, '改后', { size: 44, a: w, gold: 1, fill: '#17130a' }); const q = slam(T, 69.2); if (q[0] > 0) { c.save(); c.translate(540, 1440); c.scale(q[1], q[1]); c.globalAlpha = q[0]; txt(c, '改完了才给我看', 0, 0, 76, { w: 900, col: GOLD }); c.restore(); }
  } else {
    txt(c, '4 核机器 · 并行渲染', 540, 440, 64, { w: 900, a: pop(T, 70, .3) }); const pr = sst(70.2, 71.7, T);
    for (let i = 0; i < 4; i++) { const p = pop(T, 70.05 + i * .08, .3), y = 600 + i * 170, v = clamp(pr * (1.05 + .12 * Math.sin(i * 2.3)) + .02 * Math.sin(T * 9 + i)); c.save(); c.globalAlpha = p; txt(c, '进程 ' + (i + 1), 100, y, 46, { al: 'left', col: DG }); rr(c, 280, y - 28, 560, 56, 14); c.fillStyle = 'rgba(245,241,232,.08)'; c.fill(); rr(c, 280, y - 28, Math.max(10, 560 * v), 56, 14); c.fillStyle = GOLD; c.fill(); txt(c, Math.round(v * 100) + '%', 990, y, 46, { al: 'right', col: v >= 1 ? GOLD : WH, w: 900 }); c.restore(); }
    txt(c, Math.round(6510 * clamp(pr * 1.08)) + ' / 6510 帧', 540, 1330, 84, { w: 900, col: GOLD, a: pop(T, 70.3, .3) }); txt(c, '十几分钟', 540, 1450, 54, { a: pop(T, 71.0, .3), w: 700 });
  }
}
function scCover(c, T) {
  header(c, T, 71.9, 80, '05', '封面和文案');
  const sw = easeIO(sst(77.78, 78.3, T)), sad = sst(76.78, 77.1, T), sh = (T > 76.78 && T < 77.3) ? Math.sin(T * 70) * 8 * (1 - sst(76.78, 77.3, T)) : 0;
  if (sw < 1) { card(c, im('cover_old.jpg'), CX + sh - sw * 900, CY, CW, CH, { a: pop(T, 72.4, .4), gray: sad * .8, rot: -sw * .2 }); const f = CW / 1080, bx = CX - CW / 2 + sh, by = CY - CH / 2; if (sw <= 0) { redBox(c, bx + 140 * f, by + 735 * f, 800 * f, 115 * f, sst(75.04, 75.4, T)); stamp(c, 700, 1150, 96, '有点丧', sst(76.78, 77.1, T), RED, -.14); } }
  if (sw > 0) { card(c, im('cover_new.jpg'), CX + (1 - sw) * 900, CY, CW, CH, { a: 1, stroke: GOLD, lw: 5, glow: `rgba(215,185,121,${.5 * sst(78.3, 79, T)})`, gb: 90, rot: (1 - sw) * .2 }); const q = slam(T, 78.5); if (q[0] > 0) { c.save(); c.translate(540, 1470); c.scale(q[1], q[1]); chip(c, 0, 0, '致每一个赶路的人', { gold: 1, size: 62, a: q[0], fill: '#17130a', h: 120, r: 24 }); c.restore(); } }
}
function scSkill(c, T) {
  if (T < 83.96) {
    const a = pop(T, 80.2, .4); c.save(); c.globalAlpha = a; c.translate(0, (1 - easeOut(a)) * 50); box(c, 110, 300, 860, 1020, { fill: 'rgba(245,241,232,.05)', stroke: GOLD, lw: 4 }); txt(c, 'SKILL.md', 170, 390, 44, { al: 'left', col: DG, f: "'DejaVu Sans Mono', monospace" }); txt(c, '把一首歌做成 MV', 170, 490, 80, { al: 'left', w: 900, col: GOLD }); c.fillStyle = 'rgba(215,185,121,.4)'; c.fillRect(170, 560, 740, 3);
    ['做歌（Suno）', '听歌：歌词和时间', '写分镜表', '写代码，先出测试图', '渲染出片', '封面和发布文案'].forEach((s, i) => { const p = pop(T, 80.6 + i * .16, .3); c.save(); c.globalAlpha *= p; c.translate((1 - easeOut(p)) * 50, 0); dot(c, 200, 650 + i * 108, 26, 'rgba(215,185,121,.2)'); txt(c, String(i), 200, 652 + i * 108, 38, { col: GOLD, w: 900 }); txt(c, s, 256, 652 + i * 108, 54, { al: 'left' }); c.restore(); }); c.restore();
    [['Codex', 82.0, 330], ['WorkBuddy', 82.6, 730]].forEach(([n, t0, x]) => { const q = slam(T, t0); if (q[0] <= 0) return; c.save(); c.translate(x, 1440); c.scale(q[1], q[1]); chip(c, 0, 0, n + '  ✓', { gold: 1, size: 56, a: q[0], fill: '#17130a', h: 116, r: 22 }); c.restore(); });
  } else {
    const a = pop(T, 83.96, .35); c.save(); c.globalAlpha = a; txt(c, '只有网页版也行', 540, 330, 68, { w: 900 }); [['豆包', 380], ['Kimi', 700]].forEach(([n, x], i) => chip(c, x, 450, n, { gold: 1, size: 54, a: pop(T, 84.9 + i * .5, .3), wd: 260, h: 104 }));
    const bx = 150, by = 560, bw = 780, bh = 900; box(c, bx, by, bw, bh, { fill: '#15161d', stroke: 'rgba(245,241,232,.4)', r: 26 }); [0, 1, 2].forEach(i => dot(c, bx + 44 + i * 36, by + 44, 11, ['#e0605a', '#e6b450', '#62c462'][i])); rr(c, bx + 170, by + 20, bw - 210, 48, 24); c.fillStyle = 'rgba(245,241,232,.08)'; c.fill(); txt(c, 'mv.html', bx + 200, by + 46, 30, { al: 'left', col: DG, f: "'DejaVu Sans Mono', monospace", w: 400 });
    const p2 = pop(T, 86.22, .4); c.save(); c.beginPath(); c.rect(bx + 4, by + 88, bw - 8, bh - 96); c.clip(); c.fillStyle = '#0a0a10'; c.fillRect(bx, by + 88, bw, bh); if (p2 > 0) { c.globalAlpha *= p2; cover(c, clip('lake', T - 86.22), bx + bw / 2 - 225, by + 96, 450, 800); } else txt(c, '写一个网页动画……', bx + bw / 2, by + 480, 46, { col: DG, w: 400 }); c.restore();
    const rec = pop(T, 87.3, .3); if (rec > 0) { c.save(); c.globalAlpha *= rec; rr(c, bx + bw - 250, by + 110, 220, 80, 16); c.fillStyle = 'rgba(8,8,14,.85)'; c.fill(); if (Math.floor(T * 2.5) % 2) dot(c, bx + bw - 210, by + 150, 15, '#e0453a'); txt(c, 'REC', bx + bw - 180, by + 152, 42, { al: 'left', w: 900, col: '#fff', f: "'DejaVu Sans Mono', monospace" }); c.restore(); const q = slam(T, 87.5); c.save(); c.translate(540, 1530 - 60); c.scale(q[1], q[1]); c.restore(); }
    c.restore();
  }
}
function scOutro(c, T) {
  const a = pop(T, 88.8, .5); c.save(); c.globalAlpha = a; cover(c, clip('fin', T - 88.8), -30, -50, W + 60, H + 100); c.fillStyle = 'rgba(6,5,14,.6)'; c.fillRect(0, 0, W, H); c.restore();
  const A = 1 - sst(91.5, 91.78, T);
  if (A > 0) { const q = slam(T, 89.14); c.save(); c.globalAlpha = q[0] * A; c.translate(540, 700); c.scale(q[1], q[1]); txt(c, '我是陈宁', 0, 0, 170, { w: 900 }); c.restore(); c.fillStyle = GOLD; c.globalAlpha = pop(T, 89.6, .3) * A; c.fillRect(480, 840, 120 * pop(T, 89.6, .3), 5); c.globalAlpha = 1; txt(c, '分享 AI 时代的', 540, 940, 68, { a: pop(T, 89.76, .3) * A, w: 700 }); txt(c, '内容创作认知', 540, 1040, 68, { a: pop(T, 90.5, .3) * A, w: 700, col: GOLD }); }
  const B = pop(T, 91.78, .3);
  if (B > 0) { c.save(); c.globalAlpha = B; txt(c, '想要这套 Skill', 540, 520, 84, { w: 900 }); txt(c, '评论区打', 540, 700, 110, { w: 900, a: pop(T, 93.0, .25) }); const q = slam(T, 93.5), pu = 1 + .04 * Math.sin((T - 93.5) * 5); if (q[0] > 0) { c.save(); c.translate(540, 980); c.scale(q[1] * pu, q[1] * pu); c.globalAlpha *= q[0]; txt(c, 'MV', 0, 0, 380, { w: 900, col: GOLD, glow: 'rgba(215,185,121,.7)', gb: 80 }); c.restore(); }
    [['MV', 0], ['MV ！', .35], ['求 Skill，MV', .7]].forEach(([s, d], i) => { const p = pop(T, 94.1 + d, .3); if (p <= 0) return; c.save(); c.globalAlpha *= p; c.translate((1 - easeOut(p)) * 80, 0); const y = 1250 + i * 96; dot(c, 250, y, 30, ['#7f8db8', '#b07ac8', '#62a58a'][i]); rr(c, 300, y - 38, tw(c, s, 44, 400) + 56, 76, 38); c.fillStyle = 'rgba(245,241,232,.12)'; c.fill(); txt(c, s, 328, y + 2, 44, { al: 'left', w: 400 }); c.restore(); }); c.restore(); }
}
const SC = [[0, scHook], [11.9, scSong], [17.3, scHand], [34.1, scBoard], [45.3, scReject], [58.5, scRender], [71.9, scCover], [80.1, scSkill], [88.8, scOutro]];
const STEPS = [[11.9, '做歌'], [17.3, '交给 AI'], [34.1, '分镜'], [58.5, '渲染'], [71.9, '封面']];
function subtitle(c, T) {
  const s = SUBS.find(s => T >= s[0] - .05 && T < s[1] + .12); if (!s || T < 3.6 && T > .85 || (T > 10.55 && T < 11.9)) return;
  const t = cjk(s[2]), size = t.length > 15 ? 54 : 62, w = tw(c, t, size, 700) + 64, a = sst(s[0] - .05, s[0] + .08, T);
  c.save(); c.globalAlpha = a; rr(c, 540 - w / 2, 1608 - 52, w, 104, 22); c.fillStyle = 'rgba(6,6,10,.72)'; c.fill(); txt(c, t, 540, 1610, size, { w: 700 }); c.restore();
}
function drawEp(fi) {
  const T = fi / FPS; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none'; ctx.shadowBlur = 0;
  bg(ctx, T, {});
  let k = 0; SC.forEach((s, i) => { if (T >= s[0]) k = i; });
  const s = SC[k], nx = SC[k + 1], fo = nx ? 1 - sst(nx[0] - .16, nx[0], T) : 1, fi2 = k ? sst(s[0], s[0] + .16, T) : 1;
  ctx.save(); ctx.globalAlpha = fo * fi2; s[1](ctx, T); ctx.restore();
  // top chrome: brand + step dots
  const ca = sst(11.9, 12.4, T) * (1 - sst(88.5, 88.9, T));
  if (ca > 0) { ctx.save(); ctx.globalAlpha = ca; dot(ctx, 78, 150, 8, GOLD); txt(ctx, '自己拆自己 · 《早早晚晚》MV', 100, 152, 34, { al: 'left', col: DG, w: 700 }); let cur = -1; STEPS.forEach((st, i) => { if (T >= st[0]) cur = i; }); if (T >= 80.1) cur = 5; STEPS.forEach((st, i) => { const x = 620 + i * 84; ctx.fillStyle = i <= cur ? GOLD : 'rgba(245,241,232,.18)'; rr(ctx, x, 144, 70, 10, 5); ctx.fill(); }); ctx.restore(); }
  post(ctx, cv, fi, { bloom: .16, grain: 0, vig: 0 });
  subtitle(ctx, T);
  post(ctx, cv, fi, { bloom: 0, grain: .045, vig: .4 });
  const b = Math.max(1 - sst(0, .25, T), sst(DUR - .9, DUR - .1, T)); if (b > 0) { ctx.fillStyle = `rgba(0,0,0,${b})`; ctx.fillRect(0, 0, W, H); }
}
window.grab = async fi => { drawEp(fi); for (let i = 0; i < 3 && REQ.size; i++) { await loadReq(); drawEp(fi); } return cv.toDataURL('image/jpeg', .95); };
