// ===== core utils =====
const W = 1080, H = 1920, TAU = Math.PI * 2;
const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const lerp = (a, b, t) => a + (b - a) * t;
const sst = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const easeOut = t => 1 - Math.pow(1 - clamp(t), 3);
const easeIn = t => Math.pow(clamp(t), 3);
const easeIO = t => { t = clamp(t); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123; return s - Math.floor(s); };
const hash2 = (a, b) => hash(a * 1.6180339 + b * 57.2957 + 13.37);
function n1(x, seed = 0) { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash2(i, seed), hash2(i + 1, seed), u); }
function fbm(x, seed = 0, oct = 4) { let a = .5, s = 0, n = 0; for (let i = 0; i < oct; i++) { s += a * n1(x, seed + i * 17); n += a; x *= 2.03; a *= .5; } return s / n; }
function n2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
  const ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
  const h = (a, b) => hash(a * 12.9898 + b * 78.233 + seed * 37.719);
  return lerp(lerp(h(ix, iy), h(ix + 1, iy), ux), lerp(h(ix, iy + 1), h(ix + 1, iy + 1), ux), uy);
}
const hex = h => { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const rgb = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
const C = (h, a = 1) => rgb(hex(h), a);
// interpolate between palettes (array of hex arrays) at position p (0..n-1)
function palMix(pals, p) {
  const n = pals.length; p = clamp(p, 0, n - 1); const i = Math.min(n - 2, Math.floor(p)), f = p - i;
  return pals[i].map((c, k) => mixc(hex(c), hex(pals[i + 1][k]), f));
}
function mkCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }

// ===== sky =====
function sky(ctx, cols, y0 = 0, y1 = H, stops) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  cols.forEach((c, i) => g.addColorStop(stops ? stops[i] : i / (cols.length - 1), typeof c === 'string' ? c : rgb(c)));
  ctx.fillStyle = g; ctx.fillRect(-200, y0 - 200, W + 400, y1 - y0 + 400);
}
function glow(ctx, x, y, r, col, a = 1, mode = 'lighter') {
  const c = typeof col === 'string' ? hex(col) : col;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgb(c, a)); g.addColorStop(.25, rgb(c, a * .55)); g.addColorStop(.6, rgb(c, a * .15)); g.addColorStop(1, rgb(c, 0));
  ctx.save(); ctx.globalCompositeOperation = mode; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore();
}
function disc(ctx, x, y, r, col) { ctx.fillStyle = typeof col === 'string' ? col : rgb(col); ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
function sun(ctx, x, y, r, core, halo, k = 1) {
  glow(ctx, x, y, r * 9, halo, .30 * k); glow(ctx, x, y, r * 4, halo, .5 * k); glow(ctx, x, y, r * 1.9, core, .9 * k);
  disc(ctx, x, y, r, core);
}
function moon(ctx, x, y, r, k = 1, col = '#fff6dc') {
  glow(ctx, x, y, r * 8, '#9fb6ff', .16 * k); glow(ctx, x, y, r * 3, '#dfe6ff', .35 * k);
  ctx.save(); ctx.globalAlpha = k; disc(ctx, x, y, r, col);
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip(); ctx.globalAlpha = .10 * k;
  for (let i = 0; i < 7; i++) disc(ctx, x + (hash(i + 3) - .5) * r * 1.5, y + (hash(i + 9) - .5) * r * 1.5, r * (.12 + hash(i + 20) * .22), '#8a8fae');
  ctx.restore();
}
function stars(ctx, t, n, a = 1, y1 = H, seed = 0, drift = 0) {
  if (a <= 0.01) return;
  ctx.save(); ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    const x = ((hash2(i, seed) * (W + 200) + drift * (0.3 + hash2(i, seed + 5))) % (W + 200)) - 100, y = Math.pow(hash2(i, seed + 1), 1.4) * y1;
    const s = .6 + hash2(i, seed + 2) * hash2(i, seed + 4) * 3.4;
    const tw = .55 + .45 * Math.sin(t * (1 + hash2(i, seed + 3) * 3) + i);
    ctx.globalAlpha = a * tw * (1 - y / y1 * .6);
    if (s > 2.6) { glow(ctx, x, y, s * 6, '#cfdcff', .5 * a * tw); ctx.globalAlpha = a * tw; }
    ctx.beginPath(); ctx.arc(x, y, s * .62, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function shootingStar(ctx, u, x0, y0, len = 420, ang = 2.5) {
  if (u <= 0 || u >= 1) return;
  const dx = Math.cos(ang), dy = Math.sin(ang), p = easeOut(u), x = x0 + dx * p * 700, y = y0 + dy * p * 700, a = Math.sin(u * Math.PI);
  const g = ctx.createLinearGradient(x, y, x - dx * len, y - dy * len); g.addColorStop(0, `rgba(255,255,255,${a})`); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - dx * len, y - dy * len); ctx.stroke();
  glow(ctx, x, y, 26, '#ffffff', a); ctx.restore();
}

// ===== clouds (sprite based) =====
const _cl = {};
function cloudSprite(seed, w = 700, h = 260) {
  const k = seed + '_' + w + '_' + h; if (_cl[k]) return _cl[k];
  const c = mkCanvas(w, h), x = c.getContext('2d'); x.filter = 'blur(14px)'; x.fillStyle = '#fff';
  for (let i = 0; i < 26; i++) {
    const px = w * (.14 + hash2(i, seed) * .72), rr = h * (.10 + hash2(i, seed + 1) * .22) * (1 - Math.abs(px / w - .5) * 1.2);
    const py = h * .70 - rr * (.3 + hash2(i, seed + 2) * .9);
    x.globalAlpha = .55; x.beginPath(); x.ellipse(px, py, rr * 1.7, rr, 0, 0, TAU); x.fill();
  }
  x.globalAlpha = .8; x.beginPath(); x.ellipse(w / 2, h * .74, w * .36, h * .09, 0, 0, TAU); x.fill();
  return _cl[k] = c;
}
const _tint = mkCanvas(900, 400), _tx = _tint.getContext('2d');
function cloud(ctx, seed, x, y, sc, col, a = 1, col2) {
  const s = cloudSprite(seed), w = s.width, h = s.height;
  _tx.globalCompositeOperation = 'source-over'; _tx.clearRect(0, 0, w, h); _tx.drawImage(s, 0, 0);
  _tx.globalCompositeOperation = 'source-in';
  if (col2) { const g = _tx.createLinearGradient(0, 0, 0, h); g.addColorStop(.15, typeof col === 'string' ? col : rgb(col)); g.addColorStop(.85, typeof col2 === 'string' ? col2 : rgb(col2)); _tx.fillStyle = g; }
  else _tx.fillStyle = typeof col === 'string' ? col : rgb(col);
  _tx.fillRect(0, 0, w, h);
  ctx.save(); ctx.globalAlpha *= a; ctx.drawImage(_tint, 0, 0, w, h, x - w * sc / 2, y - h * sc / 2, w * sc, h * sc); ctx.restore();
}
function cloudBand(ctx, t, n, y0, y1, sc0, sc1, col, a, seed = 0, speed = 8, col2) {
  for (let i = 0; i < n; i++) {
    const d = hash2(i, seed + 3), sc = lerp(sc0, sc1, d), span = W + 900;
    const x = ((hash2(i, seed) * span + t * speed * (.4 + d)) % span) - 450;
    cloud(ctx, (i + seed) % 6, x, lerp(y0, y1, hash2(i, seed + 1)), sc, col, a * (.5 + .5 * hash2(i, seed + 2)), col2);
  }
}

// ===== terrain =====
function ridge(ctx, yBase, amp, freq, seed, ox, fill, yBottom = H + 50, oct = 4, step = 8) {
  ctx.beginPath(); ctx.moveTo(-60, yBottom);
  for (let x = -60; x <= W + 60; x += step) ctx.lineTo(x, yBase - amp * (fbm((x + ox) * freq, seed, oct) - .5) * 2);
  ctx.lineTo(W + 60, yBottom); ctx.closePath();
  ctx.fillStyle = fill; ctx.fill();
}
function ridgeY(x, yBase, amp, freq, seed, ox, oct = 4) { return yBase - amp * (fbm((x + ox) * freq, seed, oct) - .5) * 2; }
function vgrad(ctx, y0, y1, c0, c1) { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, typeof c0 === 'string' ? c0 : rgb(c0)); g.addColorStop(1, typeof c1 === 'string' ? c1 : rgb(c1)); return g; }

// ===== city =====
function skyline(ctx, yBase, seed, ox, o) {
  o = Object.assign({ minW: 50, maxW: 140, minH: 120, maxH: 520, body: '#101426', win: '#ffd9a0', lit: .35, winA: 1, t: 0, gap: 0, ws: 1 }, o);
  let x = -((ox % 4000) + 4000) % 4000 - 200, i = Math.floor(ox / 4000) * 1000;
  // deterministic sequence independent of ox wrap
  let idx = 0, cx = -200 - (((ox % 6000) + 6000) % 6000);
  while (cx < W + 200) {
    const w = lerp(o.minW, o.maxW, hash2(idx, seed)), h = lerp(o.minH, o.maxH, Math.pow(hash2(idx, seed + 1), 1.7));
    if (cx + w > -100) {
      ctx.fillStyle = o.body; ctx.fillRect(cx, yBase - h, w + 1, h + 2000);
      if (hash2(idx, seed + 7) > .7) ctx.fillRect(cx + w * .45, yBase - h - 30 - hash2(idx, seed + 8) * 60, 3, 100);
      if (hash2(idx, seed + 9) > .6) ctx.fillRect(cx + w * .2, yBase - h - 14, w * .6, 16);
      if (o.winA > 0) {
        const cw = 9 * o.ws, ch = 13 * o.ws, gx = 20 * o.ws, gy = 27 * o.ws;
        const cols = Math.floor((w - 14) / gx), rows = Math.floor((h - 20) / gy);
        const offx = (w - cols * gx + (gx - cw)) / 2;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
          const hv = hash2(idx * 131 + r * 17 + c, seed + 3);
          const th = typeof o.lit === 'function' ? o.lit(idx, r, c, hv) : o.lit;
          if (hv < th) {
            const fl = .65 + .35 * Math.sin(o.t * (.4 + hv * 2) + hv * 50);
            ctx.globalAlpha = o.winA * fl; ctx.fillStyle = hv * 37 % 1 > .8 ? '#bfe0ff' : o.win;
            ctx.fillRect(cx + offx + c * gx, yBase - h + 16 + r * gy, cw, ch);
          }
        }
        ctx.globalAlpha = 1;
      }
    }
    cx += w + o.gap * hash2(idx, seed + 5); idx++;
  }
}

// ===== trees =====
const _tr = {};
function treeSprite(seed, col = '#0b0d18', leaf = true, size = 900) {
  const k = seed + col + leaf + size; if (_tr[k]) return _tr[k];
  const c = mkCanvas(size, size), x = c.getContext('2d'); x.strokeStyle = col; x.fillStyle = col; x.lineCap = 'round';
  const tips = [];
  (function br(px, py, ang, len, w, d) {
    const ex = px + Math.cos(ang) * len, ey = py + Math.sin(ang) * len;
    x.lineWidth = w; x.beginPath(); x.moveTo(px, py);
    x.quadraticCurveTo(px + Math.cos(ang) * len * .5 + (hash2(d, px + seed) - .5) * len * .25, py + Math.sin(ang) * len * .5, ex, ey); x.stroke();
    if (d > 6 || len < 12) { tips.push([ex, ey]); return; }
    if (d > 3) tips.push([ex, ey]);
    const nb = d < 1 ? 3 : 2 + (hash2(ex, ey + seed) > .6 ? 1 : 0);
    for (let i = 0; i < nb; i++) {
      const sp = (i - (nb - 1) / 2) * (.55 + hash2(ex + i, seed + d) * .35) + (hash2(ey + i, seed) - .5) * .3;
      br(ex, ey, ang + sp - (ang + Math.PI / 2) * .08, len * (.66 + hash2(ex * 3 + i, seed + 2) * .16), w * .66, d + 1);
    }
  })(size / 2, size * .98, -Math.PI / 2 + (hash(seed) - .5) * .12, size * .104, size * .019, 0);
  if (leaf) for (const [tx, ty] of tips) for (let j = 0; j < 5; j++) {
    x.globalAlpha = .82; x.beginPath();
    x.ellipse(tx + (hash2(tx + j, ty) - .5) * size * .09, ty + (hash2(ty + j, tx) - .5) * size * .07, size * (.016 + hash2(tx, j) * .028), size * (.012 + hash2(ty, j) * .02), hash2(tx, ty + j) * 3, 0, TAU); x.fill();
  }
  return _tr[k] = c;
}
function tree(ctx, seed, x, y, h, col, t = 0, leaf = true) {
  const s = treeSprite(seed, col, leaf);
  ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * .7 + seed) * .008);
  const hh = h * 1.9; ctx.drawImage(s, -hh / 2, -hh * .98, hh, hh); ctx.restore();
}
function pine(ctx, x, y, h, col) {
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - h);
  for (let i = 1; i <= 5; i++) { const yy = y - h + h * .9 * i / 5, w = h * .06 + h * .2 * i / 5; ctx.lineTo(x + w, yy); ctx.lineTo(x + w * .45, yy - h * .02); }
  ctx.lineTo(x + h * .02, y - h * .1); ctx.lineTo(x + h * .02, y); ctx.lineTo(x - h * .02, y); ctx.lineTo(x - h * .02, y - h * .1);
  for (let i = 5; i >= 1; i--) { const yy = y - h + h * .9 * i / 5, w = h * .06 + h * .2 * i / 5; ctx.lineTo(x - w * .45, yy - h * .02); ctx.lineTo(x - w, yy); }
  ctx.closePath(); ctx.fill();
}
function grass(ctx, t, yBase, n, hMin, hMax, col, seed = 0, amp = 1, yf) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = hash2(i, seed) * (W + 80) - 40, h = lerp(hMin, hMax, Math.pow(hash2(i, seed + 1), 2));
    const y = (yf ? yf(x) : yBase) + hash2(i, seed + 4) * 14;
    const sw = (Math.sin(t * 1.3 + x * .006 + hash2(i, seed + 2) * 2) * .6 + Math.sin(t * 2.9 + x * .013) * .25 + .5) * h * .34 * amp;
    ctx.lineWidth = 1.6 + hash2(i, seed + 3) * 3.2; ctx.beginPath(); ctx.moveTo(x, y + 6); ctx.quadraticCurveTo(x + sw * .2, y - h * .6, x + sw, y - h); ctx.stroke();
  }
  ctx.restore();
}

// ===== figures =====
// o: {x,y (feet), h, dir, ph (walk phase), pose:'walk'|'stand'|'sit', col, rim, child, pack, coat, hair, hat, staff, armL, armR (override angles), lean}
function figure(ctx, o) {
  o = Object.assign({ dir: 1, ph: 0, pose: 'walk', col: '#0a0c14', h: 200, lean: 0, stride: 1 }, o);
  const h = o.h, k = o.child ? 1.25 : 1;
  const draw = (dx, dy, col) => {
    ctx.save(); ctx.translate(o.x + dx, o.y + dy); ctx.scale(o.dir, 1);
    ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const walking = o.pose === 'walk', sit = o.pose === 'sit';
    const bob = walking ? -Math.abs(Math.sin(o.ph)) * .012 * h : 0;
    const hipY = sit ? (o.floor ? -.07 * h : -.27 * h) : -.50 * h + bob, hip = [0, hipY];
    const lean = o.lean + (walking ? .06 : 0);
    const sh = [hip[0] + Math.sin(lean) * .31 * h, hip[1] - Math.cos(lean) * .31 * h];
    const head = [sh[0] + Math.sin(lean + (o.headTilt || 0)) * .115 * h * k, sh[1] - Math.cos(lean + (o.headTilt || 0)) * .115 * h * k];
    const U = .25 * h, Lw = .25 * h;
    const leg = (ph, w) => {
      let a, b;
      if (sit) { if (o.floor) { a = 2.2 + w * .08; b = .42; } else { a = 1.45; b = (o.legDown ? 0.15 : -.2); } }
      else if (walking) { a = Math.sin(ph) * .48 * o.stride; b = a - (.12 + .75 * Math.max(0, Math.sin(ph - 1.9)) * o.stride); }
      else { a = w * .07; b = a; }
      const kx = hip[0] + Math.sin(a) * U, ky = hip[1] + Math.cos(a) * U, fx = kx + Math.sin(b) * Lw, fy = ky + Math.cos(b) * Lw;
      ctx.lineWidth = .072 * h; ctx.beginPath(); ctx.moveTo(hip[0], hip[1]); ctx.lineTo(kx, ky); ctx.lineTo(fx, fy); ctx.stroke();
      ctx.lineWidth = .05 * h; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + .055 * h, fy + .004 * h); ctx.stroke();
    };
    const arm = (ph, ov) => {
      let a, b;
      if (ov) { a = ov[0]; b = ov[1]; } else if (walking) { a = -Math.sin(ph) * .42 * o.stride; b = a + .28; } else { a = .06; b = .16; }
      const ex = sh[0] + Math.sin(a) * .17 * h, ey = sh[1] + .02 * h + Math.cos(a) * .17 * h, hx = ex + Math.sin(b) * .16 * h, hy = ey + Math.cos(b) * .16 * h;
      ctx.lineWidth = .052 * h; ctx.beginPath(); ctx.moveTo(sh[0], sh[1] + .02 * h); ctx.lineTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
      return [hx, hy];
    };
    arm(o.ph + Math.PI, o.armL); leg(o.ph + Math.PI, -1);
    if (o.pack) { ctx.beginPath(); ctx.roundRect(sh[0] - .17 * h, sh[1] + .01 * h, .13 * h, .24 * h, .04 * h); ctx.fill(); }
    // torso
    ctx.lineWidth = .135 * h; ctx.beginPath(); ctx.moveTo(sh[0], sh[1] + .045 * h); ctx.lineTo(hip[0], hip[1] - .02 * h); ctx.stroke();
    if (o.coat) { ctx.beginPath(); ctx.moveTo(sh[0] - .07 * h, sh[1] + .05 * h); ctx.lineTo(sh[0] + .07 * h, sh[1] + .05 * h); ctx.lineTo(hip[0] + .10 * h + Math.sin(o.ph) * .01 * h, hip[1] + .2 * h); ctx.lineTo(hip[0] - .11 * h - (o.wind || 0) * .08 * h, hip[1] + .2 * h); ctx.closePath(); ctx.fill(); }
    if (o.skirt) { ctx.beginPath(); ctx.moveTo(hip[0] - .06 * h, hip[1] - .08 * h); ctx.lineTo(hip[0] + .06 * h, hip[1] - .08 * h); ctx.lineTo(hip[0] + .13 * h, hip[1] + .16 * h); ctx.lineTo(hip[0] - .15 * h - (o.wind || 0) * .06 * h, hip[1] + .16 * h); ctx.closePath(); ctx.fill(); }
    leg(o.ph, 1);
    // neck + head
    ctx.lineWidth = .045 * h; ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.lineTo(head[0], head[1]); ctx.stroke();
    ctx.beginPath(); ctx.arc(head[0], head[1], .072 * h * k, 0, TAU); ctx.fill();
    if (o.hair) { ctx.beginPath(); ctx.moveTo(head[0] - .01 * h, head[1] - .07 * h); ctx.quadraticCurveTo(head[0] - .13 * h - (o.wind || 0) * .08 * h, head[1] - .02 * h, head[0] - .09 * h - (o.wind || 0) * .12 * h, head[1] + .19 * h); ctx.quadraticCurveTo(head[0] - .05 * h, head[1] + .1 * h, head[0] - .02 * h, head[1] + .06 * h); ctx.closePath(); ctx.fill(); }
    if (o.hat) { ctx.beginPath(); ctx.moveTo(head[0] - .17 * h, head[1] - .02 * h); ctx.lineTo(head[0], head[1] - .13 * h); ctx.lineTo(head[0] + .17 * h, head[1] - .02 * h); ctx.closePath(); ctx.fill(); }
    const hand = arm(o.ph, o.armR);
    if (o.staff) { ctx.lineWidth = .018 * h; ctx.beginPath(); ctx.moveTo(hand[0] - .03 * h, hand[1] - .42 * h); ctx.lineTo(hand[0] + .05 * h, -hip[1] * 0 + 0); ctx.stroke(); }
    ctx.restore();
  };
  if (o.rim) draw(o.rimDx === undefined ? -2.5 * o.dir : o.rimDx, -2, o.rim);
  draw(0, 0, o.col);
}
function bird(ctx, x, y, s, ph, col) {
  const f = Math.sin(ph) * .9; ctx.strokeStyle = col; ctx.lineWidth = Math.max(1.2, s * .16); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - s, y - f * s * .55); ctx.quadraticCurveTo(x - s * .45, y - s * .25 - f * s * .2, x, y); ctx.quadraticCurveTo(x + s * .45, y - s * .25 - f * s * .2, x + s, y - f * s * .55); ctx.stroke();
}
function flock(ctx, t, n, x0, y0, vx, vy, col, seed = 0, spread = 300, s = 12) {
  for (let i = 0; i < n; i++) {
    const ox = (hash2(i, seed) - .5) * spread * 2, oy = (hash2(i, seed + 1) - .5) * spread + Math.abs(ox) * .3;
    bird(ctx, x0 + ox + vx * t + Math.sin(t + i) * 12, y0 + oy + vy * t + Math.cos(t * 1.3 + i) * 8, s * (.6 + hash2(i, seed + 2) * .8), t * (7 + hash2(i, seed + 3) * 3) + i, col);
  }
}

// ===== particles =====
function petals(ctx, t, n, col, seed = 0, a = 1, wind = 60, fall = 90, size = 1) {
  ctx.save();
  for (let i = 0; i < n; i++) {
    const sp = .5 + hash2(i, seed + 2), d = .4 + hash2(i, seed + 5) * .9;
    const y = ((hash2(i, seed + 1) * (H + 200) + t * fall * sp) % (H + 200)) - 100;
    const x = ((hash2(i, seed) * (W + 300) + t * wind * sp + Math.sin(t * 1.2 * sp + i) * 50) % (W + 300)) - 150;
    const r = (5 + hash2(i, seed + 3) * 9) * d * size;
    ctx.globalAlpha = a * (.35 + .65 * d) * .9; ctx.fillStyle = typeof col === 'function' ? col(i) : col;
    ctx.save(); ctx.translate(x, y); ctx.rotate(t * (1 + sp) + i); ctx.scale(1, .35 + .6 * Math.abs(Math.sin(t * 2 * sp + i)));
    ctx.beginPath(); ctx.moveTo(-r, 0); ctx.quadraticCurveTo(0, -r * .9, r, 0); ctx.quadraticCurveTo(0, r * .7, -r, 0); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
function motes(ctx, t, n, col, seed = 0, a = 1, y0 = 0, y1 = H, rise = 20, rMax = 4) {
  for (let i = 0; i < n; i++) {
    const sp = .3 + hash2(i, seed + 2);
    const span = y1 - y0, y = y1 - ((hash2(i, seed + 1) * span + t * rise * sp) % span);
    const x = hash2(i, seed) * W + Math.sin(t * .6 * sp + i * 2.1) * 60;
    const tw = .5 + .5 * Math.sin(t * (1 + sp * 2) + i * 5);
    const r = 1 + hash2(i, seed + 3) * rMax;
    glow(ctx, x, y, r * 7, col, a * tw * .5);
    ctx.save(); ctx.globalAlpha = a * tw; disc(ctx, x, y, r * .7, '#fff'); ctx.restore();
  }
}
function rain(ctx, t, n, col, a = 1, ang = .22, seed = 0, len = 70) {
  ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const sp = 1400 + hash2(i, seed + 2) * 900, l = len * (.5 + hash2(i, seed + 3));
    const y = ((hash2(i, seed + 1) * (H + 300) + t * sp) % (H + 300)) - 150;
    const x = ((hash2(i, seed) * (W + 600) - y * ang) % (W + 600)) - 100;
    ctx.globalAlpha = a * (.2 + .6 * hash2(i, seed + 4)); ctx.lineWidth = 1 + hash2(i, seed + 5) * 1.6;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - l * ang, y + l); ctx.stroke();
  }
  ctx.restore();
}
function snow(ctx, t, n, a = 1, seed = 0) {
  ctx.save(); ctx.fillStyle = '#fff';
  for (let i = 0; i < n; i++) {
    const d = hash2(i, seed + 2), sp = 40 + d * 110;
    const y = ((hash2(i, seed + 1) * (H + 100) + t * sp) % (H + 100)) - 50;
    const x = ((hash2(i, seed) * (W + 200) + Math.sin(t * .8 + i) * 40 + t * 18) % (W + 200)) - 100;
    ctx.globalAlpha = a * (.25 + .7 * d); ctx.beginPath(); ctx.arc(x, y, 1.2 + d * 4.2, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function bokeh(ctx, t, n, cols, seed = 0, a = 1, y0 = 0, y1 = H, rMin = 30, rMax = 120) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const x = hash2(i, seed) * W + Math.sin(t * .2 + i) * 30, y = lerp(y0, y1, hash2(i, seed + 1)) + Math.cos(t * .17 + i * 2) * 20;
    const r = lerp(rMin, rMax, hash2(i, seed + 2)), c = hex(cols[i % cols.length]);
    const al = a * (.10 + .16 * hash2(i, seed + 3)) * (.7 + .3 * Math.sin(t * (.5 + hash2(i, seed + 4)) + i));
    const g = ctx.createRadialGradient(x, y, r * .1, x, y, r); g.addColorStop(0, rgb(c, al * .8)); g.addColorStop(.82, rgb(c, al)); g.addColorStop(.9, rgb(c, al * 1.5)); g.addColorStop(1, rgb(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  ctx.restore();
}
function rays(ctx, x, y, n, len, col, a, t, seed = 0, spread = TAU, a0 = 0) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const c = hex(col);
  for (let i = 0; i < n; i++) {
    const ang = a0 + (i / n) * spread + Math.sin(t * .15 + i * 1.7) * .05, w = (.02 + hash2(i, seed) * .05) * (spread / TAU * 6 / n * 8);
    const al = a * (.35 + .65 * (.5 + .5 * Math.sin(t * .5 + i * 2.3 + seed)));
    const g = ctx.createRadialGradient(x, y, 0, x, y, len); g.addColorStop(0, rgb(c, al)); g.addColorStop(1, rgb(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, len, ang - w, ang + w); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
function water(ctx, t, y0, y1, colTop, colBot, sx, sunCol, glitter = 1, seed = 0) {
  ctx.fillStyle = vgrad(ctx, y0, y1, colTop, colBot); ctx.fillRect(-100, y0, W + 200, y1 - y0 + 100);
  if (sunCol && glitter > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const c = hex(sunCol);
    for (let i = 0; i < 150; i++) {
      const d = Math.pow(hash2(i, seed), 1.3), y = lerp(y0 + 4, y1, d), wdt = 30 + d * 300;
      const x = sx + (hash2(i, seed + 1) - .5) * wdt * (1 + .2 * Math.sin(t + i)), l = (8 + d * 70) * (.6 + hash2(i, seed + 2));
      const fl = Math.max(0, Math.sin(t * (2 + hash2(i, seed + 3) * 3) + i * 3.3));
      ctx.fillStyle = rgb(c, glitter * fl * (.25 + .5 * (1 - d))); ctx.fillRect(x - l / 2, y, l, 1.5 + d * 3.5);
    }
    ctx.restore();
  }
}

// ===== post =====
let _grain = null;
function grainTiles() {
  if (_grain) return _grain; _grain = [];
  for (let k = 0; k < 6; k++) {
    const c = mkCanvas(512, 512), x = c.getContext('2d'), id = x.createImageData(512, 512), d = id.data;
    let s = 1234567 + k * 9973;
    for (let i = 0; i < d.length; i += 4) { s = (s * 1664525 + 1013904223) >>> 0; const v = (s >>> 24); d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    x.putImageData(id, 0, 0); _grain.push(c);
  }
  return _grain;
}
const _bl = mkCanvas(W / 4, H / 4), _bx = _bl.getContext('2d');
function post(ctx, cv, frame, o) {
  o = Object.assign({ bloom: .32, grain: .085, vig: .55, tint: null }, o);
  if (o.bloom > 0) {
    _bx.globalCompositeOperation = 'source-over'; _bx.filter = 'none'; _bx.clearRect(0, 0, _bl.width, _bl.height);
    _bx.filter = 'blur(9px) brightness(1.05) contrast(1.5)'; _bx.drawImage(cv, 0, 0, _bl.width, _bl.height); _bx.filter = 'none';
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = o.bloom; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(_bl, 0, 0, W, H); ctx.restore();
  }
  if (o.vig > 0) {
    const g = ctx.createRadialGradient(W / 2, H * .48, H * .28, W / 2, H * .5, H * .78);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,8,${o.vig})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (o.grain > 0) {
    const g = grainTiles()[frame % 6]; ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = o.grain;
    const ox = (frame * 193) % 512, oy = (frame * 71) % 512;
    for (let y = -oy; y < H; y += 512) for (let x = -ox; x < W; x += 512) ctx.drawImage(g, x, y);
    ctx.restore();
  }
}
