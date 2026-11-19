// ===== 特效与“AI 生图动起来”（依赖 lib.js）=====

// 漏光：暖色光斑缓慢漂移，适合回忆、黄昏、副歌
function lightLeak(c, T, a = .5, seed = 0, cols = ['#ff9a4a', '#ff5f6d', '#ffd27a']) {
  if (a <= 0) return;
  c.save(); c.globalCompositeOperation = 'screen';
  for (let i = 0; i < 3; i++) {
    const x = W * (hash2(i, seed) + .35 * Math.sin(T * (.11 + i * .05) + i * 2)), y = H * (hash2(i, seed + 1) * .9 + .25 * Math.cos(T * (.09 + i * .04) + i));
    const r = 520 + 380 * hash2(i, seed + 2), col = hex(cols[i % cols.length]);
    const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgb(col, .55 * a)); g.addColorStop(.5, rgb(col, .18 * a)); g.addColorStop(1, rgb(col, 0));
    c.fillStyle = g; c.fillRect(0, 0, W, H);
  }
  c.restore();
}
// 上下黑边（电影感）
function letterbox(c, amt = 1, h = 150) { if (amt <= 0) return; c.fillStyle = '#000'; c.fillRect(0, 0, W, h * amt); c.fillRect(0, H - h * amt, W, h * amt); }
// 火星：从下往上飘的橙色火花（篝火、城市夜、燃的副歌）
function embers(c, T, n = 40, a = 1, seed = 0, y0 = H) {
  for (let i = 0; i < n; i++) {
    const sp = .4 + hash2(i, seed + 1), u = ((hash2(i, seed) + T * .12 * sp) % 1), y = y0 - u * (H * .9);
    const x = hash2(i, seed + 2) * W + Math.sin(T * 1.7 * sp + i) * 50 * u;
    const fl = (1 - u) * (.6 + .4 * Math.sin(T * 9 + i * 3));
    glow(c, x, y, 18, '#ff8a3a', a * fl * .8); c.save(); c.globalAlpha = a * fl; disc(c, x, y, 2.2, '#ffd9a0'); c.restore();
  }
}
// 空气里的浮尘（光束里最好看）
function dust(c, T, n = 80, a = .6, seed = 0) {
  c.save(); c.fillStyle = '#fff6e0';
  for (let i = 0; i < n; i++) { const x = (hash2(i, seed) * W + Math.sin(T * .3 + i) * 40 + T * 6) % W, y = (hash2(i, seed + 1) * H + Math.cos(T * .25 + i * 2) * 30 - T * 4 + H) % H; c.globalAlpha = a * (.2 + .8 * hash2(i, seed + 2)) * (.5 + .5 * Math.sin(T * 2 + i)); c.fillRect(x, y, 2, 2); }
  c.restore();
}
// 窗上的雨：水珠 + 下滑的水痕（隔着玻璃看城市）
function rainGlass(c, T, a = 1, seed = 0, n = 70) {
  c.save();
  for (let i = 0; i < n; i++) {
    const r = 4 + 14 * Math.pow(hash2(i, seed), 2), slide = hash2(i, seed + 3) > .82, sp = slide ? 60 + 140 * hash2(i, seed + 4) : 0;
    const x = hash2(i, seed + 1) * W, y = ((hash2(i, seed + 2) * H + T * sp) % (H + 100)) - 50;
    if (slide) { const g = c.createLinearGradient(x, y - 180, x, y); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, `rgba(220,235,255,${.18 * a})`); c.fillStyle = g; c.fillRect(x - r * .35, y - 180, r * .7, 180); }
    c.globalAlpha = a * .55; c.fillStyle = 'rgba(10,14,30,.5)'; c.beginPath(); c.ellipse(x, y + r * .25, r, r * 1.1, 0, 0, TAU); c.fill();
    c.globalAlpha = a * .8; c.strokeStyle = 'rgba(230,240,255,.55)'; c.lineWidth = 1.6; c.beginPath(); c.ellipse(x, y, r, r * 1.1, 0, Math.PI * .9, Math.PI * 1.9); c.stroke();
    c.fillStyle = 'rgba(255,255,255,.85)'; c.beginPath(); c.arc(x - r * .35, y - r * .4, Math.max(1, r * .18), 0, TAU); c.fill();
  }
  c.restore();
}
// 霓虹字 / 霓虹框（会闪）
function neonText(c, s, x, y, size, col = '#ff4fd8', T = 0, o = {}) {
  const fl = o.flicker ? (Math.sin(T * 37 + x) > .93 ? .35 : 1) : 1;
  c.save(); c.font = `${o.w || 900} ${size}px ${o.font || "'Noto Serif SC'"}`; c.textAlign = o.al || 'center'; c.textBaseline = 'middle';
  c.globalAlpha *= fl; c.shadowColor = col; c.shadowBlur = size * .5; c.fillStyle = col; c.fillText(s, x, y); c.shadowBlur = size * .2; c.fillStyle = '#fff'; c.globalAlpha *= .85; c.fillText(s, x, y);
  c.restore();
}
function neonRect(c, x, y, w, h, col, lw = 6, T = 0, flicker = false) {
  const fl = flicker ? (Math.sin(T * 29 + x * .1) > .95 ? .3 : 1) : 1;
  c.save(); c.globalAlpha *= fl; c.strokeStyle = col; c.lineWidth = lw; c.shadowColor = col; c.shadowBlur = 30; c.beginPath(); c.roundRect(x, y, w, h, lw * 2); c.stroke(); c.strokeStyle = '#fff'; c.lineWidth = lw * .35; c.stroke(); c.restore();
}
// 调色：在画面上叠一层颜色（'soft-light' 柔和，'overlay' 更重，'color' 统一色调）
function grade(c, col, amount = .2, mode = 'soft-light') { if (!col || amount <= 0) return; c.save(); c.globalCompositeOperation = mode; c.globalAlpha = amount; c.fillStyle = col; c.fillRect(0, 0, W, H); c.restore(); }
// 镜头抖动：配鼓点用，返回位移
function shake(T, k, amp = 10) { return [Math.sin(T * 73) * amp * k, Math.cos(T * 61) * amp * k]; }

// ================= AI 生图 → 动起来 =================
// 用法（在项目的 scenes.js 里）：
//   const sBridge = layerScene({ layers: [{ src: 'assets/bridge.jpg' }, { src: 'assets/bridge_fg.png', depth: 1 }], move: 'push', particles: 'petals', leak: .4 });
// layers：从远到近；depth 0 = 最远（动得最少），1 = 最近（动得最多）。前景必须是透明 PNG 才有视差。
// move：'push' 推近 | 'pull' 拉远 | 'left' / 'right' 横移 | 'up' / 'down' 升降 | 'still'
// particles：'petals' 花瓣 | 'snow' 雪 | 'rain' 雨 | 'fireflies' 萤火 | 'embers' 火星 | 'dust' 浮尘 | 'stars' 星星 | 'bokeh' 光斑 | null
const PRELOAD = new Set(), IMGS = new Map();
function layerScene(o) {
  o = Object.assign({ move: 'push', strength: 1, particles: null, leak: 0, grade: null, glowAt: null, glowCol: '#ffc070', rays: false, vignette: 0 }, o);
  o.layers.forEach(l => PRELOAD.add(l.src));
  return function (c, T, A, t, u) {
    const s = o.strength, mv = { push: [0, 0, .10], pull: [0, 0, -.10], left: [-90, 0, .04], right: [90, 0, .04], up: [0, -110, .04], down: [0, 110, .04], still: [0, 0, .015] }[o.move] || [0, 0, .08];
    const e = easeIO(u * .5 + .25) * 2 - .5;
    for (const l of o.layers) {
      const img = IMGS.get(l.src); if (!img) continue;
      const d = l.depth === undefined ? 0 : l.depth, k = (.55 + d * .9) * s;
      const z = 1.08 + (mv[2] > 0 ? mv[2] * e : -mv[2] * (1 - e)) * k + A.kick * .006 * d;
      const dx = mv[0] * e * k, dy = mv[1] * e * k + (l.bob ? Math.sin(T * 1.2) * 8 : 0);
      const r = Math.max(W / img.width, H / img.height) * z, iw = img.width * r, ih = img.height * r;
      const ax = l.anchorX === undefined ? .5 : l.anchorX, ay = l.anchorY === undefined ? .5 : l.anchorY;
      c.save(); if (l.alpha !== undefined) c.globalAlpha *= l.alpha; if (l.blur) c.filter = `blur(${l.blur}px)`;
      c.drawImage(img, W * ax - iw * ax + dx, H * ay - ih * ay + dy, iw, ih); c.restore();
    }
    if (o.glowAt) glow(c, o.glowAt[0], o.glowAt[1], 520 + A.kick * 60, o.glowCol, .35 + A.env * .15);
    if (o.rays && o.glowAt) rays(c, o.glowAt[0], o.glowAt[1], 16, 1600, o.glowCol, .04 + A.kick * .03, T, 3);
    const P = o.particles;
    if (P === 'petals') petals(c, T, 60, i => ['#ffd2d8', '#ffb3c1', '#fff0e0'][i % 3], 1, .9, 70, 100);
    else if (P === 'snow') snow(c, T, 160, .85, 2);
    else if (P === 'rain') rain(c, T, 140, '#c8d4ff', .45, .2, 3);
    else if (P === 'fireflies') motes(c, T, 40, '#c8ff9a', 31, .8, H * .45, H * .95, 12, 3);
    else if (P === 'embers') embers(c, T, 50, 1, 5);
    else if (P === 'dust') dust(c, T, 90, .6);
    else if (P === 'stars') stars(c, T, 160, .9, H * .6, 61);
    else if (P === 'bokeh') bokeh(c, T, 18, ['#ffcf8a', '#ff9f7a', '#ffe9b8', '#9fc0ff'], 3, .9, H * .5, H * .9, 40, 130);
    if (o.leak) lightLeak(c, T, o.leak);
    if (o.grade) grade(c, o.grade[0], o.grade[1], o.grade[2]);
    if (o.extra) o.extra(c, T, A, t, u);
  };
}
// 一张图就能用的快捷写法：imageScene('assets/x.jpg', 'push', 'petals')
function imageScene(src, move = 'push', particles = null, more = {}) { return layerScene(Object.assign({ layers: [{ src }], move, particles }, more)); }
