// ===== 剪影插画风（《早早晚晚》用的 19 个场景函数）=====
// 这些函数里的时间是按《早早晚晚》写死的（用的是歌曲绝对秒数 T），做新歌时把它们当参考来改写，
// 新写的场景请用第 4 个参数 t（场景内的秒数）和第 5 个参数 u（场景进度 0→1），换歌也不用改时间。
// ===== scenes. T = song time (s), A = audio features =====
const INK = '#0a0c16';
const PAL = {
  dawn: ['#28356e', '#7a6aa8', '#f2a38c', '#ffd9a0'],
  day: ['#2a78cc', '#69adea', '#b4d9f5', '#eef6fb'],
  dusk: ['#2a2560', '#8a4a8f', '#f0766a', '#ffc27a'],
  night: ['#04061a', '#0b1236', '#1a2858', '#33437e'],
  gold: ['#3b3f8a', '#b9739a', '#ffab6e', '#ffe9b0'],
};
function handPair(ctx, a, b) { ctx.save(); ctx.strokeStyle = a.col || INK; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); ctx.restore(); }


// ---------- S-1 leaving home at dawn ----------
function sHome(ctx, T, A) {
  const t = T - 14.6;
  sky(ctx, ['#1c2a66', '#5a5fa8', '#e89a9a', '#ffcf9a', '#fff0c8'], 0, 1380, [0, .3, .62, .85, 1]);
  stars(ctx, T, 110, .55 * (1 - sst(2, 9, t) * .6), 620, 71);
  moon(ctx, 220, 330, 34, .7);
  sun(ctx, 300, 1300 - t * 9, 70, '#fff6d8', '#ffa060', .9);
  cloudBand(ctx, T, 7, 330, 980, .7, 1.5, '#ffc8a8', .5, 41, 7, '#7a6aa8');
  ridge(ctx, 1220, 170, .0014, 161, t * 4, vgrad(ctx, 1040, 1420, '#6a62a8', '#e0a098'));
  ridge(ctx, 1310, 110, .002, 162, t * 7, vgrad(ctx, 1200, 1500, '#473f80', '#b0788c'));
  for (let i = 0; i < 4; i++) cloud(ctx, i, ((i * 420 + t * 10) % 1900) - 350, 1370 + (i % 2) * 40, 1.5, '#ffe6d6', .55);
  for (let i = 0; i < 7; i++) { const x = 40 + i * 95 + hash(i + 4) * 60; pine(ctx, x, 1470 + hash(i) * 20, 120 + hash(i + 9) * 110, '#231c48'); }
  const fy = x => 1500 + 40 * Math.sin(x * .003 + .6) - 60 * sst(560, 1080, x);
  ctx.beginPath(); ctx.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 10) ctx.lineTo(x, fy(x)); ctx.lineTo(W + 50, H); ctx.closePath(); ctx.fillStyle = vgrad(ctx, 1420, 1920, '#17122e', '#07060f'); ctx.fill();
  // path
  ctx.beginPath(); ctx.moveTo(740, fy(740) + 6); ctx.bezierCurveTo(560, 1600, 380, 1640, -80, 1700); ctx.lineTo(-80, 1790); ctx.bezierCurveTo(420, 1730, 640, 1660, 800, fy(800) + 10); ctx.closePath(); ctx.fillStyle = 'rgba(255,200,160,.13)'; ctx.fill();
  // house
  const hx = 760, hy = fy(860) + 14, col = '#0e0b20';
  tree(ctx, 4, 1140, hy + 4, 430, col, T);
  ctx.fillStyle = col; ctx.fillRect(hx, hy - 210, 260, 214);
  ctx.beginPath(); ctx.moveTo(hx - 34, hy - 200); ctx.lineTo(hx + 130, hy - 330); ctx.lineTo(hx + 294, hy - 200); ctx.closePath(); ctx.fill(); ctx.fillRect(hx + 196, hy - 330, 30, 90);
  for (let i = 0; i < 4; i++) { const u = (t * .16 + i / 4) % 1; ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI) * .3; cloud(ctx, i, hx + 211 + u * 110 + Math.sin(u * 6 + i) * 14, hy - 350 - u * 260, .12 + u * .3, '#e8dcf0', 1); ctx.restore(); }
  ctx.fillStyle = vgrad(ctx, hy - 150, hy, '#ffe6a8', '#f0a050'); ctx.fillRect(hx + 34, hy - 150, 74, 150); ctx.fillRect(hx + 150, hy - 150, 76, 70);
  ctx.fillStyle = col; ctx.fillRect(hx + 186, hy - 150, 5, 70); ctx.fillRect(hx + 150, hy - 117, 76, 5);
  glow(ctx, hx + 70, hy - 80, 330, '#ffb060', .5); glow(ctx, hx + 188, hy - 115, 200, '#ffc070', .35);
  const lg = ctx.createLinearGradient(hx + 70, hy, hx - 200, hy + 180); lg.addColorStop(0, 'rgba(255,190,110,.4)'); lg.addColorStop(1, 'rgba(255,190,110,0)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(hx + 34, hy); ctx.lineTo(hx + 108, hy); ctx.lineTo(hx - 40, hy + 200); ctx.lineTo(hx - 330, hy + 200); ctx.closePath(); ctx.fill();
  // mother at the door, waving
  figure(ctx, { x: hx + 70, y: hy + 2, h: 132, dir: -1, pose: 'stand', col: '#2a1408', skirt: true, armR: [-2.5 + Math.sin(T * 3.2) * .28, -2.8 + Math.sin(T * 3.2) * .2], headTilt: .08 });
  ctx.fillStyle = '#2a1408'; ctx.beginPath(); ctx.arc(hx + 79, hy - 126, 7, 0, TAU); ctx.fill();
  // the kid leaving, looks back once
  const back = T > 20.3 && T < 22.6, tw = Math.min(t, 5.7) + Math.max(0, t - 8.0), u = clamp(tw / 9.5);
  const px = lerp(660, 60, u), py = lerp(fy(700) + 60, 1750, Math.pow(u, .9)), ps = lerp(150, 245, u);
  figure(ctx, { x: px, y: py, h: ps, dir: back ? 1 : -1, ph: tw * 4.4, pose: back ? 'stand' : 'walk', col: '#0a0818', rim: '#ffc890', rimDx: 3, pack: true, stride: .75, armR: back ? [-2.4 + Math.sin(T * 6) * .25, -2.7] : null, headTilt: back ? -.1 : .12 });
  flock(ctx, t, 8, 500, 760, 20, -10, 'rgba(30,24,70,.7)', 43, 200, 10);
  grass(ctx, T, 0, 130, 50, 190, '#07060f', 19, 1, x => 1820 + 30 * Math.sin(x * .01));
  motes(ctx, T, 24, '#ffd9a0', 44, .6, 1200, 1800, 12, 3);
}
// ---------- S0 dusk campus, parting ----------
function sCampus(ctx, T, A) {
  const t = T - 27.9;
  sky(ctx, ['#232458', '#5d4488', '#c9697f', '#ff9f74', '#ffdf9e'], 0, 1330, [0, .3, .62, .85, 1]);
  stars(ctx, T, 90, .5, 600, 3);
  sun(ctx, 540, 1215, 92, '#fff3cf', '#ff9a5a', 1);
  cloudBand(ctx, T, 7, 380, 980, .7, 1.5, '#ffb89a', .55, 1, 7, '#8d5a96');
  ridge(ctx, 1210, 120, .0016, 11, t * 6, vgrad(ctx, 1080, 1400, '#7c4a86', '#c66e7c'));
  ridge(ctx, 1290, 90, .0022, 12, t * 10, vgrad(ctx, 1200, 1500, '#4a2f6a', '#8e4f78'));
  // main hill
  const hy = x => 1420 - 110 * Math.exp(-Math.pow((x - 540) / 420, 2)) + 18 * Math.sin(x * .004);
  ctx.beginPath(); ctx.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 10) ctx.lineTo(x, hy(x)); ctx.lineTo(W + 50, H); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, 1300, 1920, '#1b1436', '#0a0a1c'); ctx.fill();
  tree(ctx, 5, 540, hy(540) + 14, 900, '#140f2c', T);
  glow(ctx, 540, 1230, 520, '#ff9a5a', .22);
  // together first, then drift apart
  const d = 70 + easeIO(sst(2.6, 10, t)) * 330;
  if (T < 30.3) {
    const cx = lerp(150, 540, sst(23.4, 29.6, T)), st = (1 - sst(29.0, 29.7, T)) * .7 + .001, wk = st > .01 ? 'walk' : 'stand', xa = cx - 38, xb = cx + 38;
    figure(ctx, { x: xa, y: hy(xa) + 4, h: 150, dir: 1, ph: T * 4.2, col: '#120d28', rim: '#ffb07a', hair: true, skirt: true, wind: .3, stride: st, pose: wk, armR: [.5, .4] });
    figure(ctx, { x: xb, y: hy(xb) + 4, h: 162, dir: 1, ph: T * 4.2 + 1, col: '#120d28', rim: '#ffb07a', pack: true, stride: st, pose: wk, armL: [-.5, -.3] });
    handPair(ctx, { x: xa + 26, y: hy(xa) - 74, col: '#120d28' }, { x: xb - 26, y: hy(xb) - 80 });
  } else {
    const xl = 540 - d, xr = 540 + d, st = sst(2.6, 4, t) * .8 + .001, ps = t < 2.6 ? 'stand' : 'walk';
    figure(ctx, { x: xl, y: hy(xl) + 4, h: 150, dir: t < 2.6 ? 1 : -1, ph: t * 4.2, col: '#120d28', rim: '#ffb07a', hair: true, skirt: true, wind: .5, stride: st, pose: ps });
    figure(ctx, { x: xr, y: hy(xr) + 4, h: 162, dir: 1, ph: t * 4.2 + 1, col: '#120d28', rim: '#ffb07a', pack: true, stride: st, pose: ps });
  }
  grass(ctx, T, 0, 170, 30, 120, '#0c0a1e', 2, 1, x => hy(x) + 60 + (x * 7 % 90));
  ctx.fillStyle = vgrad(ctx, 1560, 1920, 'rgba(8,7,22,0)', 'rgba(8,7,22,1)'); ctx.fillRect(0, 1560, W, 360);
  petals(ctx, T, 70, i => ['#ffd2d8', '#ffb3c1', '#fff0e0'][i % 3], 1, .9, 70, 110);
}
// ---------- S1 city, sea of people ----------
function sCity(ctx, T, A) {
  const t = T - 38, lift = t * 14;
  sky(ctx, ['#080a26', '#1c2562', '#5b4a92', '#e0857a', '#ffc48a'], 0, 1500, [0, .35, .65, .9, 1]);
  stars(ctx, T, 120, .7, 700, 5);
  moon(ctx, 820, 300 + lift * .3, 46, 1);
  cloudBand(ctx, T, 5, 600, 1000, .8, 1.4, '#c98aa0', .35, 4, 6, '#5b4a92');
  const lit = (f) => (i, r, c, hv) => clamp((t / 6.5) * 1.3 - hv * .6 + f, 0, .78);
  skyline(ctx, 1500 + lift * .4, 21, t * 8, { minH: 200, maxH: 620, body: '#3a3570', lit: lit(.05), win: '#ffd9a0', winA: .55, t: T, ws: .8 });
  skyline(ctx, 1560 + lift * .7, 22, t * 14, { minH: 260, maxH: 900, minW: 90, maxW: 200, body: '#1e1d4a', lit: lit(.15), win: '#ffdca8', winA: .85, t: T });
  skyline(ctx, 1640 + lift, 23, t * 22, { minH: 200, maxH: 1150, minW: 130, maxW: 260, body: '#0d0d26', lit: lit(.2), win: '#ffe2b0', winA: 1, t: T, ws: 1.35, gap: 160 });
  glow(ctx, 540, 1560, 800, '#ff9a6a', .18);
  // street
  ctx.fillStyle = vgrad(ctx, 1640, 1920, '#0a0a1e', '#040410'); ctx.fillRect(0, 1640 + lift, W, 400);
  for (let i = 0; i < 34; i++) {
    const d = hash2(i, 7), dir = hash2(i, 8) > .5 ? 1 : -1, h = 120 + d * 90, sp = (60 + hash2(i, 9) * 70) * dir;
    const x = ((hash2(i, 10) * (W + 400) + sp * t) % (W + 400) + (W + 400)) % (W + 400) - 200;
    figure(ctx, { x, y: 1700 + d * 150 + lift, h, dir, ph: t * 5 + i * 2, col: rgb(mixc(hex('#23224e'), hex('#060612'), d)), coat: i % 3 == 0, pack: i % 4 == 1, hair: i % 5 == 2 });
  }
  figure(ctx, { x: 540, y: 1800 + lift, h: 230, dir: 1, ph: t * 4.4, col: '#05050f', rim: '#ffc890', pack: true, stride: .8 });
}
// ---------- S2 train window ----------
function sTrain(ctx, T, A) {
  const t = T - 45, wx = 80, wy = 330, ww = 920, wh = 900;
  ctx.fillStyle = '#07080f'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.beginPath(); ctx.roundRect(wx, wy, ww, wh, 90); ctx.clip();
  const ngt = sst(3, 12, t);
  const cols = palMix([['#3b3f8a', '#b9739a', '#ffab6e', '#ffe9b0'], ['#060a24', '#141c50', '#3a3a7a', '#a0607a']], ngt);
  sky(ctx, cols, wy, wy + wh * .8);
  stars(ctx, T, 80, ngt * .9, wy + 500, 9, -t * 20);
  sun(ctx, 760 - t * 14, wy + 560 + t * 16, 60, '#fff0c8', '#ff9a5a', 1 - ngt * .8);
  cloudBand(ctx, T, 5, wy + 120, wy + 520, .6, 1.1, rgb(cols[2]), .5, 2, 60);
  ridge(ctx, wy + 640, 70, .0012, 31, t * 90, rgb(mixc(cols[1], [20, 20, 50], .4)));
  skyline(ctx, wy + 720, 32, t * 220, { minH: 80, maxH: 330, body: rgb(mixc(cols[0], [14, 14, 40], .6)), lit: .25 + ngt * .3, winA: .7, t: T, ws: .7 });
  skyline(ctx, wy + 790, 33, t * 520, { minH: 60, maxH: 430, minW: 110, maxW: 260, body: '#0b0c22', lit: .3 + ngt * .3, winA: 1, t: T, gap: 300 });
  ctx.fillStyle = '#05060f'; ctx.fillRect(wx, wy + 790, ww, 200);
  // poles whizzing
  for (let i = 0; i < 6; i++) { const x = W + 300 - ((t * 2600 + i * 1150) % 6900); ctx.fillStyle = '#04050c'; ctx.fillRect(x, wy, 26, wh); ctx.fillRect(x - 200, wy + 110, 400, 10); }
  // station flashes (一站一站)
  for (const st of [6.9, 8.0, 9.1, 10.3, 11.6, 12.9]) {
    const u = (t - st) / .75; if (u > 0 && u < 1) {
      const x = W + 500 - u * (W + 1700);
      ctx.fillStyle = 'rgba(255,240,205,.92)'; ctx.fillRect(x, wy + 250, 900, 150); ctx.fillStyle = 'rgba(190,225,255,.75)'; ctx.fillRect(x, wy + 470, 900, 34);
      ctx.fillStyle = 'rgba(18,22,44,.92)'; ctx.fillRect(x + 300, wy + 275, 300, 100); ctx.fillStyle = '#ffeec8'; ctx.fillRect(x + 325, wy + 318, 250, 12);
      glow(ctx, x + 450, wy + 330, 800, '#ffe9c0', .35);
    }
  }
  // glass reflection
  const g = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh); g.addColorStop(0, 'rgba(255,255,255,.10)'); g.addColorStop(.35, 'rgba(255,255,255,0)'); g.addColorStop(.7, 'rgba(255,255,255,.04)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh);
  ctx.restore();
  ctx.strokeStyle = '#1a1d30'; ctx.lineWidth = 16; ctx.beginPath(); ctx.roundRect(wx, wy, ww, wh, 90); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,220,180,.16)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(wx + 10, wy + 10, ww - 20, wh - 20, 82); ctx.stroke();
  // handles
  ctx.fillStyle = '#12141f'; ctx.fillRect(0, 150, W, 16);
  for (let i = 0; i < 5; i++) {
    const x = 130 + i * 205, a = Math.sin(T * 2.1 + i * .7) * .09 + Math.sin(T * 5.3 + i) * .02;
    ctx.save(); ctx.translate(x, 160); ctx.rotate(a); ctx.strokeStyle = '#1c1f30'; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 90); ctx.stroke();
    ctx.lineWidth = 11; ctx.beginPath(); ctx.moveTo(-26, 96); ctx.lineTo(26, 96); ctx.lineTo(0, 150); ctx.closePath(); ctx.stroke(); ctx.restore();
  }
  // passenger (big silhouette, back view) lit by window
  const sw = Math.sin(T * 2.1) * 6, px = 700 + sw, py = 2150;
  glow(ctx, 540, 1230, 700, rgb(cols[2]), .10);
  ctx.fillStyle = '#04050a';
  ctx.beginPath(); ctx.moveTo(px - 330, py); ctx.bezierCurveTo(px - 330, py - 330, px - 200, py - 400, px - 80, py - 430); ctx.lineTo(px + 80, py - 430); ctx.bezierCurveTo(px + 200, py - 400, px + 330, py - 330, px + 330, py); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(px, py - 560, 118, 142, 0, 0, TAU); ctx.fill(); ctx.fillRect(px - 52, py - 450, 104, 60);
  ctx.strokeStyle = 'rgba(255,190,140,.35)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(px, py - 560, 117, 141, 0, -2.6, -.9); ctx.stroke();
  // light sweep on floor
  const sx = W - ((t * 900) % (W + 900));
  const lg = ctx.createLinearGradient(sx, 0, sx + 400, 0); lg.addColorStop(0, 'rgba(255,220,170,0)'); lg.addColorStop(.5, 'rgba(255,220,170,.07)'); lg.addColorStop(1, 'rgba(255,220,170,0)'); ctx.fillStyle = lg; ctx.fillRect(sx, 1240, 400, 700);
}
// ---------- S3 / S12 ridge walk through a day ----------
function sRidge(ctx, T, A, o) {
  const t = T - o.t0, v = 150, cam = v * t, dur = o.t1 - o.t0, u = t / dur;
  const pp = o.pal(u), cols = palMix(o.pals, pp);
  sky(ctx, cols, 0, 1520);
  stars(ctx, T, 220, o.star(u), 1200, 14, -t * 6);
  // sun / moon arcs
  const su = o.sunU(u), mu = o.moonU(u);
  if (su > -.1 && su < 1.1) { const a = Math.PI * (1 - su); sun(ctx, 540 + Math.cos(a) * 560, 1450 - Math.sin(a) * 960, 64 + 30 * (1 - Math.sin(a)), '#fff5d6', o.halo || '#ffb060', 1); }
  if (mu > -.1 && mu < 1.1) { const a = Math.PI * (1 - mu * .62); moon(ctx, 540 + Math.cos(a) * 520, 1450 - Math.sin(a) * 990, 58, sst(-.1, .15, mu)); }
  cloudBand(ctx, T, 8, 250, 1050, .7, 1.7, rgb(mixc(cols[3], [255, 255, 255], .3)), .5 * o.cloudA(u), o.seed, 22, rgb(cols[1]));
  ridge(ctx, 1340, 150, .0011, 41 + o.seed, cam * .12, vgrad(ctx, 1190, 1560, rgb(mixc(cols[1], cols[2], .5)), rgb(mixc(cols[2], cols[3], .6))));
  ridge(ctx, 1440, 120, .0016, 42 + o.seed, cam * .3, vgrad(ctx, 1320, 1670, rgb(mixc(cols[0], cols[1], .6)), rgb(mixc(cols[1], cols[2], .7))));
  for (let i = 0; i < 9; i++) { const wx = i * 520 + hash2(i, 77 + o.seed) * 300, sx = ((wx - cam * .3) % 4200 + 4200) % 4200 - 300; pine(ctx, sx, ridgeY(sx, 1440, 120, .0016, 42 + o.seed, cam * .3) + 14, 90 + hash2(i, 5) * 80, rgb(mixc(cols[0], [10, 10, 30], .5))); }
  const fy = x => ridgeY(x, 1620, 70, .0013, 43 + o.seed, cam, 3);
  const dark = rgb(mixc(mixc(cols[0], [6, 7, 18], .82), cols[3], o.groundLift || 0)), rimc = rgb(mixc(cols[3], [255, 255, 255], .2));
  // far lone trees on main ridge
  for (let i = 0; i < 6; i++) { const wx = 700 + i * 1150 + hash2(i, 3 + o.seed) * 500, sx = wx - cam; if (sx > -500 && sx < W + 500) tree(ctx, i + 2, sx, fy(sx) + 10, 420 + hash2(i, 9) * 260, dark, T); }
  ctx.beginPath(); ctx.moveTo(-60, H); for (let x = -60; x <= W + 60; x += 8) ctx.lineTo(x, fy(x)); ctx.lineTo(W + 60, H); ctx.closePath();
  ctx.fillStyle = vgrad(ctx, 1540, 1920, dark, '#03040c'); ctx.fill();
  const F = (wx, p) => { const sx = wx - cam; if (sx < -200 || sx > W + 200) return; figure(ctx, Object.assign({ x: sx, y: fy(sx) + 5, col: dark, rim: rimc, h: 170 }, p)); return sx; };
  o.people(F, T, t, cam, v, fy, dark, rimc);
  grass(ctx, T, 0, 150, 20, 90, dark, 6 + o.seed, 1, x => fy(x) + 30 + hash(x) * 70);
  if (o.extra) o.extra(T, t, cols, cam);
}
const ridge1People = (F, T, t, cam, v) => {
  const at = (tt, sx) => sx + v * (tt - 58.7);
  // 告别: one waves, one leaves
  let w = at(63.3, 800); F(w, { pose: 'stand', dir: -1, armR: [-2.6 + Math.sin(T * 7) * .25, -2.9], hair: true, skirt: true, wind: .4, h: 146 });
  F(w - 110 - Math.max(0, T - 62.2) * 95, { dir: -1, ph: T * 5, pack: true, h: 156 });
  // 等待: bench + lamp
  w = at(65.4, 800); const sx = w - cam;
  if (sx > -200 && sx < W + 200) { const y = ridgeY(sx, 1620, 70, .0013, 43, cam, 3); ctx.fillStyle = '#05060f'; ctx.fillRect(sx + 70, y - 330, 7, 340); ctx.fillRect(sx + 30, y - 330, 47, 7); glow(ctx, sx + 34, y - 316, 150, '#ffd9a0', .7); disc(ctx, sx + 34, y - 318, 9, '#fff2d0'); ctx.fillStyle = '#05060f'; ctx.fillRect(sx - 70, y - 44, 130, 8); ctx.fillRect(sx - 60, y - 40, 6, 46); ctx.fillRect(sx + 44, y - 40, 6, 46); }
  F(w - 10, { pose: 'sit', dir: -1, h: 150, headTilt: .25, legDown: true });
  // 走散: two walking apart
  w = at(67.3, 760); const sp = Math.max(0, T - 65.6) * 70;
  F(w - 40 - sp, { dir: -1, ph: T * 5 + 1, h: 150, coat: true }); F(w + 40 + sp * 1.6 + 60, { dir: 1, ph: T * 5 + 2, h: 142, hair: true });
  // 来到身旁: joins the walker
  const jx = cam + 400 + 95 + 700 * (1 - easeOut(sst(67.6, 70.2, T)));
  F(jx, { dir: T < 69.6 ? -1 : 1, ph: T * 5.2 + 2, h: 150, hair: true, skirt: true, wind: .3 });
  F(cam + 400, { dir: 1, ph: T * 5.2, h: 164, pack: true });
};
function sChorus1(ctx, T, A) {
  sRidge(ctx, T, A, {
    t0: 58.7, t1: 73.3, seed: 0, pals: [PAL.dawn, PAL.day, PAL.dusk, PAL.night],
    pal: u => u * 3.15, star: u => sst(.62, .9, u), sunU: u => u / .68, moonU: u => (u - .6) / .4, cloudA: u => 1 - sst(.7, 1, u) * .6,
    people: ridge1People,
    extra: (T, t, cols) => { if (T > 69.2) rain(ctx, T, 90, '#b9c8ff', sst(69.2, 70.4, T) * .5, .25, 3); },
  });
}
// ---------- S4 golden field, the boy inside ----------
function sField(ctx, T, A) {
  const t = T - 73.2;
  sky(ctx, ['#2b2a66', '#7d4f90', '#e8787a', '#ffb06a', '#ffe6a6'], 0, 1380, [0, .28, .6, .84, 1]);
  stars(ctx, T, 80, .45, 520, 8);
  const sy = 1180 + t * 5;
  sun(ctx, 540, sy, 110, '#fff6d8', '#ff9a50', 1);
  rays(ctx, 540, sy, 14, 1300, '#ffb870', .05, T, 3);
  cloudBand(ctx, T, 7, 300, 1000, .8, 1.6, '#ffc09a', .55, 3, 9, '#9a5a90');
  ridge(ctx, 1280, 110, .0015, 51, t * 5, vgrad(ctx, 1160, 1480, '#8d4f84', '#e08a70'));
  ridge(ctx, 1370, 80, .002, 52, t * 9, vgrad(ctx, 1280, 1560, '#4b2c66', '#a25a70'));
  const fy = x => 1520 - 90 * Math.exp(-Math.pow((x - 230) / 300, 2)) + 12 * Math.sin(x * .006);
  ctx.beginPath(); ctx.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 10) ctx.lineTo(x, fy(x)); ctx.lineTo(W + 50, H); ctx.closePath(); ctx.fillStyle = vgrad(ctx, 1400, 1920, '#1a1030', '#07060f'); ctx.fill();
  grass(ctx, T, 0, 130, 60, 170, '#1d1233', 9, 1, x => fy(x) + 10);
  // adult: walks, stops, turns back
  const turn = T > 81.2, ax = 800 + Math.min(t, 6.4) * 9;
  figure(ctx, { x: ax, y: fy(ax) + 6, h: 250, dir: turn ? -1 : 1, ph: t * 4, pose: t < 6.4 ? 'walk' : 'stand', stride: .7, col: '#0b0818', rim: '#ffc27a', rimDx: turn ? -3 : -3, coat: true, wind: .5, headTilt: turn ? -.1 : .1 });
  // boy appears in light
  const ba = sst(80.2, 82.2, T);
  if (ba > 0) {
    glow(ctx, 235, fy(235) - 120, 360, '#ffe2a0', .45 * ba);
    ctx.save(); ctx.globalAlpha = ba;
    const wave = T > 84 ? [-2.5 + Math.sin(T * 6) * .3, -2.8] : null;
    figure(ctx, { x: 235, y: fy(235) + 5, h: 165, dir: 1, pose: 'stand', child: true, col: '#1a1026', rim: '#fff0c0', pack: true, armR: wave });
    ctx.restore();
    // paper plane
    const pu = sst(85.6, 88.6, T);
    if (pu > 0 && pu < 1) { const px = lerp(290, 760, pu), py = fy(235) - 190 - Math.sin(pu * Math.PI) * 190 + pu * 40, an = Math.cos(pu * Math.PI) * -.5; ctx.save(); ctx.translate(px, py); ctx.rotate(an); glow(ctx, 0, 0, 60, '#fff3d0', .6); ctx.fillStyle = '#fff8e8'; ctx.beginPath(); ctx.moveTo(34, 0); ctx.lineTo(-26, -15); ctx.lineTo(-14, 0); ctx.lineTo(-26, 13); ctx.closePath(); ctx.fill(); ctx.restore(); }
  }
  motes(ctx, T, 46, '#ffd98a', 4, .9, 1150, 1800, 16, 3.5);
  grass(ctx, T, 0, 110, 90, 260, '#07060f', 10, 1.2, x => 1790 + 40 * Math.sin(x * .01));
  petals(ctx, T, 26, '#ffe2b8', 6, .5, 120, 40, .7);
}
// ---------- S5 ring & child (winter street) ----------
function sStreet(ctx, T, A) {
  const t = T - 88.5;
  sky(ctx, ['#070a22', '#151c4c', '#33346e', '#6b4a7c'], 0, 1500);
  stars(ctx, T, 100, .6, 800, 12);
  moon(ctx, 540, 700, 74, 1);
  // ring draws around the moon
  const ru = sst(91.6, 93.4, T), ro = 1 - sst(95.2, 96.6, T);
  if (ru > 0 && ro > 0) {
    ctx.save(); ctx.globalAlpha = ro; ctx.translate(540, 700); ctx.rotate(-.3); ctx.scale(1, .42);
    const g = ctx.createLinearGradient(-190, 0, 190, 0); g.addColorStop(0, '#b8862e'); g.addColorStop(.3, '#fff0b8'); g.addColorStop(.55, '#e2a83c'); g.addColorStop(.8, '#fff6d0'); g.addColorStop(1, '#b8862e');
    ctx.strokeStyle = g; ctx.lineWidth = 15; ctx.lineCap = 'round'; ctx.shadowColor = '#ffd27a'; ctx.shadowBlur = 30;
    ctx.beginPath(); ctx.arc(0, 0, 180, -Math.PI / 2, -Math.PI / 2 + TAU * easeIO(ru)); ctx.stroke(); ctx.restore();
    const a = -Math.PI / 2 + TAU * easeIO(ru), sxp = 540 + Math.cos(-.3) * Math.cos(a) * 180 - Math.sin(-.3) * Math.sin(a) * 180 * .42, syp = 700 + Math.sin(-.3) * Math.cos(a) * 180 + Math.cos(-.3) * Math.sin(a) * 180 * .42;
    const sp = ru < 1 ? 1 : (.5 + .5 * Math.sin(T * 5)); glow(ctx, sxp, syp, 90 * sp, '#fff3c8', .9 * ro); rays(ctx, sxp, syp, 4, 120 * sp, '#fff6d8', .5 * ro, 0, 1, TAU, T * .8);
  }
  skyline(ctx, 1500, 61, t * 6, { minH: 150, maxH: 520, body: '#1a1a44', lit: .45, winA: .7, t: T, ws: .85 });
  skyline(ctx, 1560, 62, t * 10, { minH: 120, maxH: 420, minW: 120, maxW: 240, body: '#0c0c26', lit: .5, winA: 1, t: T, ws: 1.2, gap: 80 });
  bokeh(ctx, T, 16, ['#ffcf8a', '#ff9f7a', '#ffe9b8', '#9fc0ff'], 3, .9, 1050, 1560, 40, 130);
  ctx.fillStyle = vgrad(ctx, 1600, 1920, '#10102a', '#05050e'); ctx.fillRect(0, 1600, W, 400);
  // lamps
  for (let i = 0; i < 3; i++) { const x = 140 + i * 400 - t * 12 + 60; ctx.fillStyle = '#05050e'; ctx.fillRect(x, 1180, 9, 440); ctx.fillRect(x - 46, 1180, 56, 9); glow(ctx, x - 40, 1200, 300, '#ffcf8a', .5); glow(ctx, x - 40, 1640, 260, '#ffb060', .16); disc(ctx, x - 40, 1198, 12, '#fff3d6'); }
  // parent & child
  const px = lerp(-120, 620, sst(1.5, 9.4, t)), ph = t * 4.6;
  const hop = Math.abs(Math.sin(t * 4.6)) * 16;
  figure(ctx, { x: px, y: 1690, h: 270, dir: 1, ph, col: '#05050e', rim: '#ffc890', coat: true, armR: [.75, .55], stride: .7 });
  figure(ctx, { x: px + 118, y: 1690 - hop, h: 150, dir: 1, ph: ph * 1.6, col: '#05050e', rim: '#ffc890', child: true, armL: [-2.2, -2.5], stride: .9 });
  handPair(ctx, { x: px + 58, y: 1690 - 270 * .57, col: '#05050e' }, { x: px + 96, y: 1690 - hop - 150 * .86 });
  snow(ctx, T, 170, .85, 2);
}
// ---------- S6a daylight crowd ----------
function sCrowd(ctx, T, A) {
  const t = T - 97.9;
  sky(ctx, ['#9fc4ea', '#d3e4f4', '#f6efe6', '#fff6ea'], 0, 1500);
  sun(ctx, 540, 520, 90, '#ffffff', '#fff2d8', 1.2);
  skyline(ctx, 1420, 71, t * 10, { minH: 200, maxH: 800, body: '#c9d6e6', winA: 0 });
  skyline(ctx, 1500, 72, t * 20, { minH: 200, maxH: 1000, minW: 120, maxW: 240, body: '#a9b9cf', winA: 0, gap: 100 });
  ctx.fillStyle = vgrad(ctx, 1500, 1920, '#e9e4dc', '#b9b8bd'); ctx.fillRect(0, 1500, W, 420);
  for (let i = 0; i < 7; i++) { ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.fillRect(-100, 1570 + i * 52, W + 200, 22 + i * 2); }
  const ord = []; for (let i = 0; i < 54; i++) ord.push([hash2(i, 81), i]); ord.sort((a, b) => a[0] - b[0]);
  for (const [d, i] of ord) {
    const dir = hash2(i, 82) > .5 ? 1 : -1, h = 170 + d * 230, sp = (260 + hash2(i, 83) * 260) * dir * (.6 + d);
    const x = ((hash2(i, 84) * (W + 700) + sp * t) % (W + 700) + (W + 700)) % (W + 700) - 350;
    const c = mixc(hex('#b4bfd0'), hex('#3a4258'), d);
    ctx.save(); ctx.globalAlpha = .55 + .4 * d;
    for (let k = 3; k >= 1; k--) { ctx.globalAlpha = (.55 + .4 * d) * .16; figure(ctx, { x: x - dir * k * 22 * (.5 + d), y: 1560 + d * 330, h, dir, ph: t * 9 + i * 2 - k * .3, col: rgb(c), coat: i % 3 == 0, pack: i % 4 == 1, hair: i % 5 == 2 }); }
    ctx.globalAlpha = .55 + .4 * d; figure(ctx, { x, y: 1560 + d * 330, h, dir, ph: t * 9 + i * 2, col: rgb(c), coat: i % 3 == 0, pack: i % 4 == 1, hair: i % 5 == 2 });
    ctx.restore();
    if (d > .55 && d < .6) figure(ctx, { x: 540, y: 1760, h: 330, dir: 1, ph: t * 3.2, col: '#10131f', pack: true, stride: .55, headTilt: .22 });
  }
  glow(ctx, 540, 500, 1100, '#ffffff', .25);
}
// ---------- S6b the door ----------
function sDoor(ctx, T, A) {
  const t = T - 101.4, cl = easeIO(sst(.4, 2.9, t)), op = 1 - cl;
  ctx.fillStyle = '#06060c'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = vgrad(ctx, 1500, 1920, '#0b0b14', '#050508'); ctx.fillRect(0, 1500, W, 420);
  const dx = 640, dw = 300, dy = 560, dh = 950, gap = 8 + op * 200;
  // light behind the door
  ctx.fillStyle = '#ffd9a0'; ctx.fillRect(dx, dy, gap, dh);
  glow(ctx, dx + gap / 2, dy + dh * .45, 500 + op * 500, '#ffb565', .25 + op * .35);
  // floor wedge
  const g = ctx.createLinearGradient(dx, dy + dh, dx - 500, H); g.addColorStop(0, `rgba(255,200,130,${.5 + op * .3})`); g.addColorStop(1, 'rgba(255,200,130,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(dx, dy + dh); ctx.lineTo(dx + gap, dy + dh); ctx.lineTo(dx + gap - 250 - op * 500, H); ctx.lineTo(dx - 420 - op * 500, H); ctx.closePath(); ctx.fill();
  // door leaf
  ctx.fillStyle = '#12121c'; ctx.fillRect(dx + gap, dy, dw - gap * .2, dh); ctx.fillStyle = '#0c0c14'; ctx.fillRect(dx + gap + 30, dy + 60, dw - gap * .2 - 60, 360); ctx.fillRect(dx + gap + 30, dy + 480, dw - gap * .2 - 60, 400);
  disc(ctx, dx + gap + 26, dy + dh * .52, 9, '#3a3222');
  ctx.strokeStyle = '#15151f'; ctx.lineWidth = 14; ctx.strokeRect(dx - 10, dy - 10, dw + 20 + 0, dh + 10);
  // figure sitting on floor, back to the wall
  figure(ctx, { x: 360, y: 1516, h: 430, dir: 1, pose: 'sit', floor: true, col: '#020205', rim: rgb(hex('#ffbe7a'), .25 + op * .6), rimDx: 3, headTilt: .55 + cl * .2, lean: .12, armR: [1.2, .2], armL: [1.0, .3] });
  // sigh
  const su = sst(2.2, 3.8, t); if (su > 0 && su < 1) { ctx.save(); ctx.globalAlpha = Math.sin(su * Math.PI) * .22; cloud(ctx, 2, 520 + su * 90, 1180 - su * 60, .3 + su * .25, '#cfd6ff', 1); ctx.restore(); }
}
// ---------- S7 apartment windows ----------
function sApartment(ctx, T, A) {
  const t = T - 105.2;
  sky(ctx, ['#040616', '#0a1034', '#1b2452'], 0, 900);
  stars(ctx, T, 130, .9, 700, 21);
  moon(ctx, 860, 250, 52, 1);
  cloudBand(ctx, T, 4, 150, 520, .7, 1.2, '#2a3468', .5, 5, 8);
  const bx = 60, by = 640, cols = 4, rows = 6, cw = 200, chh = 150, gx = 244, gy = 208;
  ctx.fillStyle = vgrad(ctx, by, H, '#0d0f20', '#07080f'); ctx.fillRect(bx - 20, by - 40, W - 2 * bx + 40, H); ctx.fillStyle = '#12142a'; ctx.fillRect(bx - 34, by - 56, W - 2 * bx + 68, 22);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const id = r * cols + c, x = bx + 24 + c * gx, y = by + 40 + r * gy, me = (r === 1 && c === 2);
    const offT = me ? 114.9 : 104 + hash(id + 5) * 11.5, always = hash(id + 9) < .22;
    let on = always ? 0 : 1 - sst(offT, offT + .25, T);
    if (me && T > 114.9) on = 0;
    ctx.fillStyle = '#070812'; ctx.fillRect(x, y, cw, chh);
    if (on > 0) {
      const warm = hash(id + 3) > .3, col = warm ? '#ffcf8a' : '#a8c8ff';
      ctx.save(); ctx.globalAlpha = on; ctx.fillStyle = vgrad(ctx, y, y + chh, warm ? '#ffe2a8' : '#cfe0ff', warm ? '#f0a860' : '#7fa0e0'); ctx.fillRect(x, y, cw, chh);
      ctx.beginPath(); ctx.rect(x, y, cw, chh); ctx.clip();
      const k = id % 6;
      const fc = warm ? '#5a2f1a' : '#1e2c50';
      if (me) { figure(ctx, { x: x + 110, y: y + chh + 60, h: 190, dir: -1, pose: 'stand', col: '#3a1f12', armR: [-2.4, -.5], headTilt: T > 112 ? .25 : .05 }); }
      else if (k === 0) { figure(ctx, { x: x + 70, y: y + chh + 50, h: 170, dir: 1, pose: 'stand', col: fc }); figure(ctx, { x: x + 135, y: y + chh + 50, h: 160, dir: -1, pose: 'stand', col: fc, hair: true }); }
      else if (k === 1) { ctx.fillStyle = fc; ctx.fillRect(x + 20, y + 20, 30, chh); ctx.fillRect(x + cw - 50, y + 20, 30, chh); }
      else if (k === 2) { figure(ctx, { x: x + 100, y: y + chh + 70, h: 180, dir: 1, pose: 'stand', col: fc, hair: true, armR: [.9, -1.2] }); }
      else if (k === 3) { ctx.fillStyle = fc; ctx.fillRect(x + 120, y + 96, 6, 60); ctx.beginPath(); ctx.ellipse(x + 123, y + 86, 30, 22, 0, 0, TAU); ctx.fill(); }
      else if (k === 4) { figure(ctx, { x: x + 60, y: y + chh + 20, h: 110, dir: 1, child: true, ph: T * 8, col: fc }); figure(ctx, { x: x + 140, y: y + chh + 60, h: 180, dir: -1, pose: 'stand', col: fc }); }
      ctx.restore(); glow(ctx, x + cw / 2, y + chh / 2, 230, col, .18 * on);
    } else if (me) {
      // alarm clock in the dark
      const ca = sst(115.5, 116.6, T);
      ctx.save(); ctx.globalAlpha = ca; ctx.font = "700 46px 'DejaVu Sans Mono', monospace"; ctx.textAlign = 'center'; ctx.fillStyle = '#ff5a4a'; ctx.shadowColor = '#ff3a2a'; ctx.shadowBlur = 22;
      ctx.fillText(Math.floor(T * 1.13) % 2 ? '06:30' : '06 30', x + cw / 2, y + chh / 2 + 28); ctx.restore(); glow(ctx, x + cw / 2, y + chh / 2 + 12, 150, '#ff4a3a', .3 * ca);
    }
    ctx.strokeStyle = '#1b1e38'; ctx.lineWidth = 6; ctx.strokeRect(x, y, cw, chh); ctx.beginPath(); ctx.moveTo(x + cw / 2, y); ctx.lineTo(x + cw / 2, y + chh); ctx.stroke();
    ctx.fillStyle = '#161930'; ctx.fillRect(x - 10, y + chh + 3, cw + 20, 10);
  }
}
// ---------- S8a the road & the years ----------
function sRoad(ctx, T, A) {
  const t = T - 119.4, vx = 540, vy = 1020;
  sky(ctx, ['#1a2260', '#5a5aa8', '#f08a86', '#ffd29a'], 0, vy + 20);
  stars(ctx, T, 90, .5, 500, 31);
  sun(ctx, vx, vy - 20 - t * 9, 80, '#fff6d8', '#ff9a5a', 1);
  cloudBand(ctx, T, 7, 250, 900, .7, 1.5, '#ffc0a0', .5, 9, 12, '#7a5aa0');
  ridge(ctx, vy - 10, 120, .0018, 91, 0, vgrad(ctx, vy - 140, vy + 40, '#5a4a90', '#b0607a'));
  ridge(ctx, vy + 10, 60, .003, 92, 0, '#2a2356');
  ctx.fillStyle = vgrad(ctx, vy, H, '#3a2a58', '#0a0a18'); ctx.fillRect(0, vy, W, H - vy);
  // road
  ctx.fillStyle = vgrad(ctx, vy, H, '#3a304e', '#0c0c18'); ctx.beginPath(); ctx.moveTo(vx - 8, vy); ctx.lineTo(vx + 8, vy); ctx.lineTo(W + 260, H); ctx.lineTo(-260, H); ctx.closePath(); ctx.fill();
  glow(ctx, vx, vy, 600, '#ffb070', .3);
  const P = z => { const s = 1 / z; return [s, vy + (H - vy) * s]; }; // z in [1, inf): 1 = bottom
  const speed = 1.5 + A.env * .5;
  for (let i = 0; i < 26; i++) {
    const z = 1 + (((i * .5 - t * speed * 2) % 13) + 13) % 13, z2 = z + .2; if (z < 1.02) continue;
    const [s1, y1] = P(z), [s2, y2] = P(z2);
    ctx.fillStyle = `rgba(255,236,200,${clamp(1.2 - z / 11)})`; ctx.beginPath(); ctx.moveTo(vx - 16 * s1, y1); ctx.lineTo(vx + 16 * s1, y1); ctx.lineTo(vx + 16 * s2, y2); ctx.lineTo(vx - 16 * s2, y2); ctx.closePath(); ctx.fill();
  }
  // roadside poles + age signs
  const ages = [18, 22, 25, 28, 30, 33, 35, 36];
  const items = [];
  for (let i = 0; i < 16; i++) { const z = 1 + (((i * 1.1 - t * speed * 2) % 17.6) + 17.6) % 17.6; items.push({ z, side: i % 2 ? 1 : -1, type: 'pole' }); }
  ages.forEach((ag, i) => { const last = i === ages.length - 1; let z = 9 + i * 3.1 - t * speed * 3.2; if (last) z = Math.max(z, 1.55); items.push({ z, side: 1, type: 'sign', ag, last }); });
  items.sort((a, b) => b.z - a.z);
  for (const it of items) {
    if (it.z < .75 || it.z > 16) continue; const [s, y] = P(it.z), x = vx + it.side * (it.type === 'sign' ? 520 : 640) * s, a = clamp(1.4 - it.z / 9);
    if (it.type === 'pole') { ctx.fillStyle = rgb(mixc(hex('#3a2a58'), hex('#07070f'), a)); ctx.fillRect(x - 5 * s, y - 520 * s, 10 * s, 520 * s); ctx.fillRect(x - (it.side > 0 ? 120 : 0) * s, y - 520 * s, 120 * s, 8 * s); }
    else {
      ctx.save(); ctx.globalAlpha = clamp(a * 1.5);
      ctx.fillStyle = '#0a0a16'; ctx.fillRect(x - 6 * s * 1.7 + 60 * s * 1.7, y - 330 * s * 1.7, 12 * s * 1.7, 330 * s * 1.7);
      ctx.fillStyle = it.last ? '#f4c25a' : '#e9eef8'; ctx.beginPath(); ctx.roundRect(x - 60 * s * 1.7, y - 470 * s * 1.7, 240 * s * 1.7, 170 * s * 1.7, 22 * s * 1.7); ctx.fill();
      ctx.fillStyle = '#14162a'; ctx.font = `900 ${118 * s * 1.7}px 'Noto Serif SC'`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(it.ag, x + 60 * s * 1.7, y - 382 * s * 1.7);
      if (it.last) glow(ctx, x + 60 * s * 1.7, y - 385 * s * 1.7, 330 * s * 1.7, '#ffcf70', .35);
      ctx.restore();
    }
  }
  flock(ctx, t, 9, 300, 620, 26, -14, 'rgba(20,16,50,.8)', 3, 220, 11);
  // speed streaks
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) { const ph = (hash(i) + t * (1.1 + hash(i + 40))) % 1, an = hash(i + 9) * TAU, r0 = 200 + ph * 1100, l = 60 + ph * 300; if (Math.sin(an) < -.15) continue; ctx.strokeStyle = `rgba(255,220,190,${ph * .13})`; ctx.lineWidth = 2 + ph * 3; ctx.beginPath(); ctx.moveTo(vx + Math.cos(an) * r0, vy + Math.sin(an) * r0); ctx.lineTo(vx + Math.cos(an) * (r0 + l), vy + Math.sin(an) * (r0 + l)); ctx.stroke(); }
  ctx.restore();
}
// ---------- S8b the day of departure: giant sun, running youth ----------
function sDepart(ctx, T, A) {
  const t = T - 126.5;
  sky(ctx, ['#3a2f7a', '#a85a94', '#ff8a6a', '#ffc27a', '#ffe9b0'], 0, 1400, [0, .3, .6, .82, 1]);
  const sy = 1090 - t * 6, R = 330 + A.kick * 10;
  glow(ctx, 540, sy, R * 3.2, '#ff8a50', .4); glow(ctx, 540, sy, R * 1.7, '#ffc070', .55);
  const g = ctx.createLinearGradient(0, sy - R, 0, sy + R); g.addColorStop(0, '#fffbe6'); g.addColorStop(.6, '#ffd98a'); g.addColorStop(1, '#ff9a5a'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(540, sy, R, 0, TAU); ctx.fill();
  cloudBand(ctx, T, 6, 420, 1150, .7, 1.4, '#ffd0b0', .5, 13, 30, '#c0608a');
  ridge(ctx, 1330, 80, .0016, 95, t * 30, vgrad(ctx, 1240, 1500, '#8a3f6a', '#d0706a'));
  const cam = t * 210, fy = x => ridgeY(x, 1440, 95, .0012, 96, cam, 3);
  for (let i = 0; i < 5; i++) { if (window.NOTREE) break; const sx = 600 + i * 900 + hash(i + 2) * 300 - cam; if (sx > -400 && sx < W + 400) tree(ctx, i + 3, sx, fy(sx) + 10, 380 + hash(i) * 200, '#12081c', T); }
  ctx.beginPath(); ctx.moveTo(-60, H); for (let x = -60; x <= W + 60; x += 8) ctx.lineTo(x, fy(x)); ctx.lineTo(W + 60, H); ctx.closePath(); ctx.fillStyle = vgrad(ctx, 1380, 1920, '#12081c', '#05040a'); ctx.fill();
  // then (young, running) vs now (walking, slower, further back) after 129.9
  const now = sst(129.6, 131.2, T);
  const yx = 520 + now * 260;
  figure(ctx, { x: yx, y: fy(yx) + 5, h: window.NOTREE ? 300 : 190, dir: 1, ph: t * 9.5, col: '#12081c', rim: '#ffe0a0', pack: true, stride: 1.45, lean: .16, hair: false });
  if (now > 0) { ctx.save(); ctx.globalAlpha = now; const ax = 250; figure(ctx, { x: ax, y: fy(ax) + 5, h: 205, dir: 1, ph: t * 4.2, col: '#0a0612', rim: '#ffc890', coat: true, stride: .7, wind: .6, headTilt: -.1 }); ctx.restore(); }
  flock(ctx, t, 14, 200, 700, 60, -32, 'rgba(40,14,50,.85)', 7, 260, 13);
  grass(ctx, T * 2.2, 0, 150, 30, 130, '#0a0612', 12, 1.5, x => fy(x) + 34 + hash(x) * 60);
  petals(ctx, T * 1.6, 40, '#ffe6c0', 9, .7, 320, 40, .8);
}
// ---------- S9 ink wash: Dongpo ----------
let _paper = null;
function paper() {
  if (_paper) return _paper; const c = mkCanvas(W / 2, H / 2), x = c.getContext('2d'), id = x.createImageData(c.width, c.height), d = id.data;
  for (let j = 0; j < c.height; j++) for (let i = 0; i < c.width; i++) { const k = (j * c.width + i) * 4, v = n2(i * .012, j * .012, 3) * .5 + n2(i * .05, j * .05, 5) * .3 + hash(i * 3.1 + j * 71.7) * .2; d[k] = 238 - v * 26; d[k + 1] = 229 - v * 28; d[k + 2] = 208 - v * 34; d[k + 3] = 255; }
  x.putImageData(id, 0, 0); return _paper = c;
}
function inkRidge(ctx, yBase, amp, freq, seed, ox, a, depth = 380, col = [22, 24, 34]) {
  const g = ctx.createLinearGradient(0, yBase - amp, 0, yBase + depth); g.addColorStop(0, rgb(col, a)); g.addColorStop(.35, rgb(col, a * .55)); g.addColorStop(1, rgb(col, 0));
  ridge(ctx, yBase, amp, freq, seed, ox, g, yBase + depth + 10, 5, 6);
}
function sInk(ctx, T, A) {
  const t = T - 133.6, rv = k => sst(k, k + 2.2, t);
  ctx.drawImage(paper(), 0, 0, W, H);
  // moon (same place as next scene's moon)
  ctx.save(); ctx.globalAlpha = rv(.2); glow(ctx, 300, 440, 300, '#e9c890', .5, 'multiply'); disc(ctx, 300, 440, 84, '#f7e7c0'); ctx.strokeStyle = 'rgba(160,110,60,.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(300, 440, 84, 0, TAU); ctx.stroke(); ctx.restore();
  inkRidge(ctx, 760, 210, .0014, 101, t * 8, .22 * rv(0), 420);
  inkRidge(ctx, 900, 260, .0019, 102, t * 14, .42 * rv(.5), 420);
  inkRidge(ctx, 1010, 200, .0026, 103, t * 22, .70 * rv(1.0), 360);
  // mist bands
  ctx.save(); ctx.globalAlpha = .9; for (let i = 0; i < 5; i++) cloud(ctx, i, ((i * 330 + t * 14) % 1700) - 300, 1040 + (i % 3) * 60, 1.6, '#efe6d2', .8); ctx.restore();
  // water + far boat
  const bx = 760 - t * 9; ctx.save(); ctx.globalAlpha = .75 * rv(1.5); ctx.fillStyle = '#1c1e2a'; ctx.beginPath(); ctx.moveTo(bx - 70, 1232); ctx.quadraticCurveTo(bx, 1262, bx + 80, 1228); ctx.lineTo(bx + 50, 1250); ctx.lineTo(bx - 46, 1250); ctx.closePath(); ctx.fill(); ctx.fillRect(bx - 10, 1196, 44, 40); ctx.fillRect(bx + 50, 1150, 2.5, 90);
  ctx.strokeStyle = 'rgba(28,30,42,.35)'; ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { const y = 1262 + i * 16, w = 60 + hash(i) * 200, x = bx - 150 + hash(i + 3) * 300 + Math.sin(T + i) * 10; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke(); } ctx.restore();
  // foreground bank + walker with bamboo hat & staff
  const fy = x => 1560 - 70 * Math.exp(-Math.pow((x - 300) / 500, 2)) + 10 * Math.sin(x * .008);
  ctx.save(); ctx.globalAlpha = rv(1.2);
  const g = ctx.createLinearGradient(0, 1440, 0, 1920); g.addColorStop(0, 'rgba(16,17,26,.95)'); g.addColorStop(1, 'rgba(16,17,26,.78)');
  ctx.beginPath(); ctx.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 8) ctx.lineTo(x, fy(x) + fbm(x * .02, 7) * 14); ctx.lineTo(W + 50, H); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
  const px = 150 + t * 34;
  figure(ctx, { x: px, y: fy(px) + 6, h: 215, dir: 1, ph: t * 3.6, col: '#10111a', hat: true, coat: true, staff: true, stride: .62, wind: .8, armR: [.5 + Math.sin(t * 3.6) * .2, 1.1], lean: .04 });
  // bamboo left
  for (let i = 0; i < 6; i++) {
    const bx0 = -10 + i * 38 + hash(i) * 20, sw = Math.sin(T * .9 + i) * 30; ctx.strokeStyle = `rgba(16,17,26,${.5 + hash(i + 3) * .45})`; ctx.lineWidth = 7 + hash(i + 1) * 6; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(bx0, 1640); ctx.quadraticCurveTo(bx0 + 20, 1000, bx0 + 120 + sw + i * 22, 520 + hash(i + 5) * 260); ctx.stroke();
    for (let j = 0; j < 9; j++) { const u = .35 + j * .07, lx = bx0 + (120 + sw + i * 22) * u * u + 20 * u * (1 - u) * 2, ly = lerp(1640, 520 + hash(i + 5) * 260, u), la = .5 + hash2(i, j) * 1.2 + Math.sin(T + j) * .1, ll = 70 + hash2(j, i) * 60; ctx.fillStyle = `rgba(16,17,26,${.55 + hash2(i, j + 9) * .4})`; ctx.save(); ctx.translate(lx, ly); ctx.rotate(la * (j % 2 ? 1 : -.4)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(ll * .5, -10, ll, 6); ctx.quadraticCurveTo(ll * .5, 12, 0, 0); ctx.fill(); ctx.restore(); }
  }
  ctx.restore();
  rain(ctx, T, 150, 'rgba(30,32,46,1)', .34 * rv(1.5), .18, 4, 90);
  // poem (vertical) + seal
  const poem = ['竹杖芒鞋轻胜马', '谁怕', '一蓑烟雨任平生'];
  ctx.save(); ctx.font = "92px 'Zhi Mang Xing'"; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#15161f';
  let ci = 0; poem.forEach((ln, li) => { [...ln].forEach((ch, k) => { const a = sst(1.6 + ci * .2, 2.2 + ci * .2, t); ci++; ctx.globalAlpha = a * .92; ctx.fillText(ch, 960 - li * 106, 270 + k * 88 + (li === 1 ? 60 : 0)); }); });
  const sa = sst(6.2, 6.6, t); ctx.globalAlpha = sa * .9; ctx.fillStyle = '#b3261e'; ctx.beginPath(); ctx.roundRect(710, 900 - (1 - sa) * 14, 74, 74, 8); ctx.fill(); ctx.fillStyle = '#f3e4d0'; ctx.font = "34px 'Noto Serif SC'"; ctx.fillText('东', 729, 938); ctx.fillText('坡', 765, 938);
  ctx.restore();
}
// ---------- S10 the same moon, tonight's window ----------
function sWindow(ctx, T, A) {
  const t = T - 143.9;
  sky(ctx, ['#040618', '#0c143c', '#232e68', '#4a4a86'], 0, 1300);
  stars(ctx, T, 160, .9, 1000, 41);
  moon(ctx, 300, 440, 84, 1, '#f7e7c0');
  cloudBand(ctx, T, 5, 300, 900, .8, 1.5, '#3a4580', .45, 7, 9);
  skyline(ctx, 1240, 111, t * 5, { minH: 120, maxH: 520, body: '#141a44', lit: .5, winA: .7, t: T * 3, ws: .8 });
  skyline(ctx, 1300, 112, t * 9, { minH: 100, maxH: 420, minW: 110, maxW: 230, body: '#0a0d28', lit: .55, winA: 1, t: T * 3, gap: 60 });
  // traffic streaks
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const d = i % 2 ? 1 : -1, x = ((hash(i) * 1600 + T * (500 + hash(i + 2) * 500) * d) % 1600 + 1600) % 1600 - 260, y = 1262 + (i % 4) * 9; const g = ctx.createLinearGradient(x, 0, x + 260 * d, 0); g.addColorStop(0, d > 0 ? 'rgba(255,90,70,0)' : 'rgba(255,240,200,0)'); g.addColorStop(1, d > 0 ? 'rgba(255,90,70,.8)' : 'rgba(255,240,200,.8)'); ctx.fillStyle = g; ctx.fillRect(Math.min(x, x + 260 * d), y, 260, 3); } ctx.restore();
  // interior: window frame + desk
  ctx.fillStyle = '#05060d'; ctx.fillRect(0, 1300, W, 620); ctx.fillRect(0, 0, 46, H); ctx.fillRect(W - 46, 0, 46, H); ctx.fillRect(0, 0, W, 150); ctx.fillRect(532, 150, 16, 1160); ctx.fillRect(0, 700, W, 12);
  ctx.fillStyle = '#0b0d18'; ctx.fillRect(0, 1296, W, 26);
  // desk
  ctx.fillStyle = '#0a0b14'; ctx.fillRect(120, 1560, 840, 22); ctx.fillRect(160, 1582, 14, 340); ctx.fillRect(900, 1582, 14, 340);
  // laptop glow
  const fl = .8 + .2 * Math.sin(T * 9) * Math.sin(T * 23);
  glow(ctx, 640, 1440, 430, '#8fb8ff', .32 * fl);
  ctx.fillStyle = '#10121e'; ctx.beginPath(); ctx.moveTo(700, 1560); ctx.lineTo(880, 1560); ctx.lineTo(912, 1400); ctx.lineTo(738, 1400); ctx.closePath(); ctx.fill();
  ctx.fillStyle = `rgba(150,190,255,${.55 * fl})`; ctx.beginPath(); ctx.moveTo(704, 1556); ctx.lineTo(742, 1404); ctx.lineTo(750, 1404); ctx.lineTo(712, 1556); ctx.closePath(); ctx.fill();
  // seated figure hunched at desk, typing
  ctx.fillStyle = '#04050a'; ctx.fillRect(380, 1500, 16, 420); ctx.fillRect(380, 1690, 190, 16);
  figure(ctx, { x: 490, y: 1841, h: 560, dir: 1, pose: 'sit', col: '#03040a', rim: rgb(hex('#9fc4ff'), .55), rimDx: 3, lean: .22, headTilt: .2, legDown: true, armR: [.95 + Math.sin(T * 17) * .04, 1.8 + Math.sin(T * 21) * .08], armL: [.85 + Math.cos(T * 19) * .04, 1.75] });
  // papers & cup
  ctx.fillStyle = '#1a1d2e'; ctx.fillRect(180, 1548, 120, 12); ctx.fillRect(196, 1538, 110, 10); ctx.fillStyle = '#151827'; ctx.fillRect(600, 1516, 40, 44);
  // wall clock spinning fast (慌慌张张)
  const cx = 800, cy = 430; ctx.strokeStyle = 'rgba(200,215,255,.5)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(cx, cy, 80, 0, TAU); ctx.stroke();
  const sp = sst(3.4, 5, t) * 9; ctx.lineCap = 'round'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(t * sp * .9 + 1) * 62, cy - Math.cos(t * sp * .9 + 1) * 62); ctx.stroke(); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.sin(t * sp * .08 + 4) * 40, cy - Math.cos(t * sp * .08 + 4) * 40); ctx.stroke();
}
// ---------- S11 rooftop: rest ----------
function sRoof(ctx, T, A) {
  const t = T - 151.3, dawn = sst(13.2, 16.3, t);
  const cols = palMix([['#040618', '#0c143c', '#232e68', '#4a4a86'], ['#1a2260', '#6a5aa8', '#f08a86', '#ffd29a']], dawn * .9);
  sky(ctx, cols, 0, 1420);
  stars(ctx, T, 220, .95 * (1 - dawn * .8), 1200, 51, -t * 3);
  moon(ctx, 760, 520 + t * 3, 120, 1 - dawn * .5);
  shootingStar(ctx, (t - 9.9) / 1.1, 900, 240, 380, 2.6);
  cloudBand(ctx, T, 6, 500, 1100, .8, 1.6, rgb(mixc(cols[2], [255, 255, 255], .12)), .5, 17, 7, rgb(cols[1]));
  if (dawn > 0) glow(ctx, 540, 1400, 900, '#ff9a6a', .5 * dawn);
  skyline(ctx, 1380, 121, t * 4, { minH: 60, maxH: 330, body: rgb(mixc(cols[1], [10, 12, 36], .7)), lit: .4, winA: .6, t: T, ws: .7 });
  skyline(ctx, 1450, 122, t * 7, { minH: 60, maxH: 260, minW: 100, maxW: 220, body: '#080a20', lit: .5, winA: .9, t: T });
  bokeh(ctx, T, 22, ['#ffcf8a', '#ff9f7a', '#9fc0ff', '#ffe9b8'], 8, .8, 1300, 1560, 16, 60);
  // rooftop edge
  ctx.fillStyle = '#04050c'; ctx.fillRect(0, 1560, W, 400); ctx.fillRect(0, 1528, W, 34); ctx.fillStyle = '#0b0d1c'; ctx.fillRect(0, 1524, W, 8);
  ctx.fillRect(130, 1250, 6, 280); ctx.fillStyle = '#04050c'; ctx.fillRect(120, 1380, 150, 150); // water tank silhouette
  ctx.fillRect(150, 1240, 4, 150); disc(ctx, 152, 1238, 5, '#ff4a3a'); glow(ctx, 152, 1238, 40, '#ff4a3a', .5 * (.5 + .5 * Math.sin(T * 3)));
  // figure: walks in, sits on the ledge
  const wk = sst(.2, 6.4, t), sitT = t > 6.6, fx = lerp(1150, 560, easeOut(wk));
  figure(ctx, sitT ? { x: 560, y: 1641, h: 420, dir: -1, pose: 'sit', col: '#03040a', rim: '#cfdcff', rimDx: 3, legDown: true, headTilt: -.25 * sst(8, 11, t), lean: -.06, armR: [.5, 1.3], armL: [.2, .6] }
    : { x: fx, y: 1528, h: 420, dir: -1, ph: t * 3.6, col: '#03040a', rim: '#cfdcff', rimDx: 3, stride: .6 * (1 - sst(.85, 1, wk)) + .01, headTilt: .2 });
  // cup with steam
  if (sitT) { ctx.fillStyle = '#03040a'; ctx.fillRect(680, 1498, 34, 30); for (let i = 0; i < 3; i++) { const u = ((t * .35 + i / 3) % 1); ctx.save(); ctx.globalAlpha = Math.sin(u * Math.PI) * .22; cloud(ctx, i, 697 + Math.sin(u * 5 + i) * 14, 1480 - u * 130, .1 + u * .14, '#e6ecff', 1); ctx.restore(); } }
  motes(ctx, T, 20, '#bcd0ff', 14, .5, 900, 1500, 10, 2.5);
}
// ---------- S12 final chorus (golden ridge) ----------
const ridge2People = (F, T, t, cam, v) => {
  const at = (tt, sx) => sx + v * (tt - 167.3);
  let w = at(171.5, 800); F(w, { pose: 'stand', dir: -1, armR: [-2.6 + Math.sin(T * 7) * .25, -2.9], coat: true, h: 156 }); F(w - 110 - Math.max(0, T - 170.4) * 95, { dir: -1, ph: T * 5, hair: true, skirt: true, wind: .4, h: 146 });
  w = at(173.4, 800); F(w, { pose: 'stand', dir: -1, h: 150, hair: true, headTilt: -.15 });
  w = at(175.6, 760); const sp = Math.max(0, T - 174.2) * 70; F(w - 40 - sp, { dir: -1, ph: T * 5 + 1, h: 150, pack: true }); F(w + 100 + sp * 1.6, { dir: 1, ph: T * 5 + 2, h: 142, coat: true });
  // family comes: partner + child run to the walker; walker reaches out
  const j = easeOut(sst(175.9, 179.4, T));
  const reach = sst(177.6, 178.8, T);
  F(cam + 400 + 240 + 760 * (1 - j), { dir: -1, ph: T * 6, h: 152, hair: true, skirt: true, wind: .4, stride: 1 - j * .6, armR: reach > .5 ? [-1.5, -1.6] : null });
  F(cam + 400 + 120 + 620 * (1 - j), { dir: -1, ph: T * 10, h: 92, child: true, stride: 1.3 - j, armR: [-2.3, -2.5], armL: [-2.0, -2.4] });
  F(cam + 400, { dir: 1, ph: T * 5.2, h: 164, pack: true, stride: 1 - j * .7, armR: reach > 0 ? [lerp(.2, 1.5, reach), lerp(.3, 1.5, reach)] : null });
};
function sChorus2(ctx, T, A) {
  sRidge(ctx, T, A, {
    t0: 167.3, t1: 181.8, seed: 5, pals: [PAL.dawn, PAL.gold, ['#2f5fc0', '#86a8ea', '#ffc8a0', '#ffedc0'], PAL.gold], halo: '#ffb060', groundLift: .0,
    pal: u => u * 3, star: u => (1 - sst(0, .18, u)) * .7, sunU: u => .02 + u * .46, moonU: u => -1, cloudA: u => 1,
    people: ridge2People,
    extra: (T, t, cols) => { rays(ctx, 540, 1420, 16, 1600, '#ffe0a0', .035 + A.kick * .02, T, 5, Math.PI, Math.PI); flock(ctx, t, 16, 100, 800, 55, -30, 'rgba(30,24,60,.8)', 11, 300, 12); petals(ctx, T, 50, i => ['#fff0d0', '#ffd0c0', '#ffffff'][i % 3], 12, .75, 130, 60, .8); },
  });
}
// ---------- S13 summit above the sea of clouds ----------
function sSummit(ctx, T, A) {
  const t = T - 181.7, rise = easeOut(sst(0, 9, t));
  sky(ctx, ['#16246e', '#3f5cc0', '#f08f7a', '#ffc27a', '#ffe9b8'], 0, 1300, [0, .32, .66, .85, 1]);
  const sy = 1120 - rise * 300, hb = 1 + A.kick * .06;
  rays(ctx, 540, sy, 22, 1700, '#ffe0a0', .028 + A.kick * .02, T, 9);
  glow(ctx, 540, sy, 700, '#ff9a50', .22); sun(ctx, 540, sy, 130 * hb, '#fffdf0', '#ffb060', .7);
  cloudBand(ctx, T, 5, 200, 700, .8, 1.5, '#ffd0b8', .4, 23, 14, '#b070a0');
  // far peaks
  ridge(ctx, 1250, 170, .0017, 131, t * 4, vgrad(ctx, 1080, 1500, '#4a4a98', '#e09a90'));
  // sea of clouds layers
  for (let L = 0; L < 4; L++) {
    const y = L < 2 ? 1300 + L * 80 : 1640 + (L - 2) * 150, sc = 1.5 + L * .5;
    for (let i = 0; i < 7; i++) { const x = ((i * 300 * sc * .55 + t * (16 + L * 16) + hash2(i, L) * 200) % (W + 1400)) - 700; cloud(ctx, (i + L) % 6, x, y + hash2(i, L + 5) * 50, sc, L < 2 ? '#ffd8c0' : '#ffeede', L < 2 ? .75 : .95, L < 2 ? '#b0709a' : '#d08aa8'); }
    if (L === 1) {
      // the peak
      ctx.beginPath(); ctx.moveTo(180, H); ctx.lineTo(330, 1560); ctx.lineTo(420, 1470); ctx.lineTo(470, 1380); ctx.lineTo(520, 1338); ctx.lineTo(570, 1332); ctx.lineTo(620, 1372); ctx.lineTo(700, 1500); ctx.lineTo(790, 1570); ctx.lineTo(960, H); ctx.closePath();
      ctx.fillStyle = vgrad(ctx, 1330, 1900, '#120e2a', '#4a3068'); ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,170,.55)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(420, 1470); ctx.lineTo(470, 1380); ctx.lineTo(520, 1338); ctx.lineTo(570, 1332); ctx.lineTo(620, 1372); ctx.stroke();
      const sit = T > 194.6, open = sst(3.4, 5, t) * (1 - sst(12.2, 12.9, t));
      figure(ctx, sit ? { x: 548, y: 1334 + 58, h: 215, dir: 1, pose: 'sit', col: '#0c0a1e', rim: '#ffe6b0', legDown: true, headTilt: -.2 }
        : { x: 548, y: 1336, h: 215, dir: 1, pose: 'stand', col: '#0c0a1e', rim: '#ffe6b0', coat: true, wind: 1, headTilt: -.25, armR: open > 0 ? [lerp(.06, 2.0, open), lerp(.16, 2.2, open)] : null, armL: open > 0 ? [lerp(.06, -2.0, open), lerp(.16, -2.2, open)] : null });
      const ba = sst(194.9, 196.4, T); if (ba > 0) { ctx.save(); ctx.globalAlpha = ba; glow(ctx, 452, 1380, 150, '#fff0c0', .5); figure(ctx, { x: 446, y: 1412 + 38, h: 140, dir: 1, pose: 'sit', child: true, col: '#1a1430', rim: '#fff3c8', legDown: true, headTilt: -.2 }); ctx.restore(); }
    }
  }
  flock(ctx, t, 18, -100, 1050, 70, -34, 'rgba(40,36,90,.75)', 21, 340, 13);
  motes(ctx, T, 30, '#fff0c0', 24, .7, 300, 1500, 26, 3);
}
// ---------- S14 night lake: slow down tonight ----------
function sLake(ctx, T, A) {
  const t = T - 197.5, hz = 1180;
  sky(ctx, ['#02030f', '#070b28', '#141c4c', '#2c2f6a'], 0, hz);
  // milky way
  ctx.save(); ctx.translate(540, 520); ctx.rotate(-.55); for (let i = 0; i < 26; i++) { const x = (hash(i) - .5) * 1700, y = (hash(i + 30) - .5) * 150; glow(ctx, x, y, 170 + hash(i + 60) * 200, i % 3 ? '#5a6ad0' : '#b07ac8', .05); } ctx.restore();
  stars(ctx, T, 420, 1, hz, 61, 0);
  ctx.save(); ctx.translate(540, 520); ctx.rotate(-.55); ctx.fillStyle = '#fff'; for (let i = 0; i < 420; i++) { const x = (hash(i * 3) - .5) * 1800, y = (hash(i * 7 + 1) - .5) * (hash(i * 5) * 260); ctx.globalAlpha = (.2 + hash(i) * .6) * (.6 + .4 * Math.sin(T * 2 + i)); ctx.fillRect(x, y, 1.6, 1.6); } ctx.restore();
  shootingStar(ctx, (t - 2.6) / 1.2, 950, 200, 420, 2.55); shootingStar(ctx, (t - 6.2) / 1.1, 700, 120, 320, 2.7); shootingStar(ctx, (t - 10.6) / 1.3, 1000, 380, 460, 2.5);
  ridge(ctx, hz - 20, 120, .0018, 141, 0, '#0b1030'); ridge(ctx, hz, 60, .003, 142, 0, '#060818');
  // lake reflection
  ctx.save(); ctx.translate(0, hz * 2); ctx.scale(1, -1); ctx.globalAlpha = .55; sky(ctx, ['#02030f', '#070b28', '#141c4c', '#2c2f6a'], hz - 760, hz); stars(ctx, T + 3, 200, .8, hz, 61, 0); ridge(ctx, hz - 20, 120, .0018, 141, 0, '#0b1030', hz + 10); ctx.restore();
  ctx.fillStyle = vgrad(ctx, hz, H, 'rgba(4,6,20,.15)', 'rgba(2,3,10,.9)'); ctx.fillRect(0, hz, W, H - hz);
  ctx.save(); ctx.strokeStyle = 'rgba(160,180,255,.10)'; ctx.lineWidth = 2; for (let i = 0; i < 40; i++) { const y = hz + 10 + Math.pow(hash(i), 1.5) * 500, w = 40 + hash(i + 9) * 260, x = hash(i + 4) * W + Math.sin(T * .6 + i) * 30; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke(); } ctx.restore();
  // shore + jetty
  const fy = x => 1640 + 30 * Math.sin(x * .004 + 1) - 50 * sst(500, 1080, x);
  ctx.beginPath(); ctx.moveTo(-50, H); for (let x = -50; x <= W + 50; x += 10) ctx.lineTo(x, fy(x)); ctx.lineTo(W + 50, H); ctx.closePath(); ctx.fillStyle = '#020309'; ctx.fill();
  tree(ctx, 9, 930, fy(930) + 12, 760, '#020309', T);
  // campfire
  const fx = 420, fyy = fy(420) - 6, fl = .75 + .25 * Math.sin(T * 13) * Math.sin(T * 7.3);
  glow(ctx, fx, fyy - 20, 420 * fl, '#ff8a3a', .4); glow(ctx, fx, fyy - 20, 150, '#ffd080', .8 * fl);
  for (let i = 0; i < 5; i++) { const hh = (50 + hash(i) * 50) * (.7 + .3 * Math.sin(T * (9 + i * 2) + i)); ctx.fillStyle = i % 2 ? '#ffb040' : '#ff6a2a'; ctx.beginPath(); ctx.moveTo(fx - 26 + i * 12, fyy); ctx.quadraticCurveTo(fx - 30 + i * 13 + Math.sin(T * 8 + i) * 8, fyy - hh * .6, fx - 22 + i * 11 + Math.sin(T * 5 + i) * 10, fyy - hh); ctx.quadraticCurveTo(fx - 8 + i * 12, fyy - hh * .4, fx - 8 + i * 12, fyy); ctx.fill(); }
  for (let i = 0; i < 16; i++) { const u = (hash(i) + T * (.25 + hash(i + 5) * .3)) % 1; ctx.save(); ctx.globalAlpha = (1 - u); disc(ctx, fx + Math.sin(u * 9 + i) * 40 * u + (hash(i + 2) - .5) * 30, fyy - 30 - u * 330, 2.2, '#ffc070'); ctx.restore(); }
  // adult + boy : sit, then stand and hold hands
  const up = sst(207.2, 208.6, T), rimc = '#ffb070';
  if (up < .5) {
    figure(ctx, { x: 610, y: fy(610) + 4, h: 250, dir: -1, pose: 'sit', floor: true, col: '#020308', rim: rimc, rimDx: -3, headTilt: -.3, armR: [.6, 1.3] });
    figure(ctx, { x: 250, y: fy(250) + 4, h: 170, dir: 1, pose: 'sit', floor: true, child: true, col: '#020308', rim: rimc, rimDx: 3, headTilt: -.3, armR: [.6, 1.3] });
  } else {
    const wk = Math.max(0, T - 208.9), ax = 610 + wk * 16, bx = ax - 120;
    figure(ctx, { x: ax, y: fy(ax) + 4, h: 250, dir: 1, ph: wk * 3.4, pose: wk > 0 ? 'walk' : 'stand', stride: .55, col: '#020308', rim: rimc, armL: [-.7, -.5] });
    figure(ctx, { x: bx, y: fy(bx) + 4, h: 160, dir: 1, ph: wk * 5, pose: wk > 0 ? 'walk' : 'stand', stride: .7, child: true, col: '#020308', rim: rimc, armR: [2.2, 2.4] });
  }
  motes(ctx, T, 44, '#c8ff9a', 31, .8, 1150, 1800, 12, 3);
}
// ---------- S15 finale: dawn, walking on together ----------
function sFinale(ctx, T, A) {
  const t = T - 211.6, r = easeOut(sst(0, 9, t));
  const cols = palMix([PAL.night, PAL.dawn, PAL.gold], sst(0, 7, t) * 2);
  sky(ctx, cols, 0, 1350);
  stars(ctx, T, 240, 1 - sst(0, 6, t), 1100, 61);
  const vx = 540, vy = 1300, sy = vy + 60 - r * 330;
  rays(ctx, vx, sy, 24, 1900, '#ffe6b0', (.03 + A.kick * .03) * r, T, 13);
  glow(ctx, vx, sy, 1000, '#ff9a5a', .45 * r); sun(ctx, vx, sy, 120 + A.kick * 8, '#fffbe8', '#ffb060', r);
  cloudBand(ctx, T, 8, 250, 1050, .8, 1.7, rgb(mixc(cols[3], [255, 255, 255], .4)), .55, 31, 14, rgb(cols[1]));
  ridge(ctx, vy - 20, 150, .0016, 151, t * 3, vgrad(ctx, vy - 180, vy + 100, rgb(mixc(cols[1], cols[2], .5)), rgb(mixc(cols[2], cols[3], .5))));
  ridge(ctx, vy + 10, 70, .0026, 152, t * 5, rgb(mixc(cols[0], [20, 14, 50], .5)));
  ctx.fillStyle = vgrad(ctx, vy, H, rgb(mixc(cols[1], [30, 20, 60], .7)), '#07060f'); ctx.fillRect(0, vy, W, H - vy);
  // winding road to the sun
  ctx.beginPath(); const L = [], R = [];
  for (let i = 0; i <= 40; i++) { const u = i / 40, y = lerp(vy, H + 40, u * u), cx = vx + Math.sin(u * 3.2 + 1.2) * 150 * (1 - u) * u * 4 + (u * u) * 0, hw = 6 + u * u * 330; L.push([cx - hw, y]); R.push([cx + hw, y]); }
  L.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); R.reverse().forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath();
  const rg = ctx.createLinearGradient(0, vy, 0, H); rg.addColorStop(0, rgb(mixc(cols[3], [255, 255, 255], .2), .9 * r + .1)); rg.addColorStop(1, 'rgba(40,30,60,.9)'); ctx.fillStyle = rg; ctx.fill();
  glow(ctx, vx, vy, 500, '#ffd090', .35 * r);
  // two figures walking away, shrinking into distance
  const u = lerp(.80, .40, sst(0, 16, t)), y = lerp(vy, H + 40, u * u), cx = vx + Math.sin(u * 3.2 + 1.2) * 150 * (1 - u) * u * 4, s = u * u * 1.55 + .08;
  const ph = t * 4;
  figure(ctx, { x: cx + 62 * s, y, h: 330 * s, dir: 1, ph, col: '#07060f', rim: '#ffe0a8', rimDx: 0, coat: true, stride: .5, armL: [-.6, -.4] });
  figure(ctx, { x: cx - 62 * s, y, h: 205 * s, dir: 1, ph: ph * 1.5, col: '#07060f', rim: '#ffe0a8', rimDx: 0, child: true, pack: true, stride: .6, armR: [2.2, 2.3] });
  flock(ctx, t, 22, -200, 900, 60, -26, rgb(mixc(cols[0], [10, 10, 30], .6), .8), 33, 360, 13);
  grass(ctx, T, 0, 120, 60, 220, '#05040c', 17, 1.2, x => 1830 + 30 * Math.sin(x * .01));
  petals(ctx, T, 60, i => ['#fff0d0', '#ffd8c8', '#ffffff'][i % 3], 15, .8 * r, 110, 70, .9);
}

