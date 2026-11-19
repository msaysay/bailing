// ===== 霓虹城市风：雨夜街道、复古落日公路、雨窗 =====
// 三个场景都是“工厂函数”，传参数就能做出不同的版本，换歌不用改时间：
//   （霓虹街景两侧招牌在画面中下部，歌词高度 ly 建议 330–420）
//   const s1 = neonStreet({ signs: ['未眠', '24H', '旧梦'], col: '#ff4fd8', col2: '#38e8ff' });
//   const s2 = synthRoad({ sun: ['#ffe46b', '#ff4f9a'], grid: '#ff4fd8' });
//   const s3 = rainWindow({ warm: true });
// 然后在 SCENES 里写 { a: 30, f: s1, ly: 480 }。适合：都市、失眠、思念、电子流行、说唱。

const _refl = mkCanvas(W, H), _rx = _refl.getContext('2d');
// 把画面里地平线以上的部分倒过来、模糊、压暗，画到地平线以下：湿地面的倒影
function wetReflection(c, hz, a = .5, blur = 6) {
  const m = c.getTransform(), sy = m.d * hz + m.f; if (sy >= H) return;
  _rx.setTransform(1, 0, 0, 1, 0, 0); _rx.clearRect(0, 0, W, H); _rx.filter = `blur(${blur}px)`;
  _rx.save(); _rx.translate(0, sy * 2); _rx.scale(1, -1); _rx.drawImage(c.canvas, 0, Math.max(0, sy * 2 - H), W, H - Math.max(0, sy * 2 - H), 0, Math.max(0, sy * 2 - H), W, H - Math.max(0, sy * 2 - H)); _rx.restore(); _rx.filter = 'none';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = a; c.drawImage(_refl, 0, sy, W, H - sy, 0, sy, W, H - sy);
  const g = c.createLinearGradient(0, sy, 0, H); g.addColorStop(0, 'rgba(5,4,14,.15)'); g.addColorStop(1, 'rgba(5,4,14,.85)'); c.globalAlpha = 1; c.fillStyle = g; c.fillRect(0, sy, W, H - sy);
  c.restore();
}
function umbrella(c, x, y, r, col) { c.save(); c.fillStyle = col; c.beginPath(); c.moveTo(x - r, y); c.quadraticCurveTo(x - r * .9, y - r * .9, x, y - r * .95); c.quadraticCurveTo(x + r * .9, y - r * .9, x + r, y); for (let i = 3; i >= -3; i--) c.quadraticCurveTo(x + i * r / 3 + r / 6, y - r * .18, x + i * r / 3 - r / 6 + .001, y); c.fill(); c.fillRect(x - 2, y - r * .9, 4, r * 1.05); c.restore(); }

function neonStreet(o = {}) {
  o = Object.assign({ signs: ['未眠', '24H', '旧梦', '夜'], col: '#ff4fd8', col2: '#38e8ff', col3: '#ffd34f', walker: true, rainy: true, seed: 1 }, o);
  return function (c, T, A, t, u) {
    const hz = 1380;
    sky(c, ['#07031a', '#1a0b3c', '#3c1456', '#6a1f5e'], 0, hz);
    glow(c, 540, hz - 100, 900, o.col, .18);
    skyline(c, hz - 40, 201 + o.seed, t * 6, { minH: 260, maxH: 900, minW: 70, maxW: 150, body: '#120a2a', lit: .35, win: '#ffb8f0', winA: .5, t: T, ws: .7 });
    skyline(c, hz, 202 + o.seed, t * 12, { minH: 300, maxH: 1100, minW: 120, maxW: 240, body: '#0a0618', lit: .28, win: '#9fe8ff', winA: .8, t: T, gap: 40 });
    // 近景两侧楼 + 竖排霓虹招牌
    [[-40, 300], [W - 300, 340]].forEach(([x, w], k) => {
      c.fillStyle = '#05030c'; c.fillRect(x, 260, w, hz - 220);
      const cols = [o.col, o.col2, o.col3]; o.signs.forEach((s, i) => { if (i % 2 !== k) return; const sx = k ? x + 60 : x + w - 140, sy = 760 + Math.floor(i / 2) * 330, ch = [...s], cc = cols[i % 3], fl = (Math.sin(T * 23 + i * 7) > .97) ? .25 : 1;
        c.save(); c.globalAlpha = fl; neonRect(c, sx - 10, sy - 70, 120, ch.length * 112 + 60, cc, 6, T); ch.forEach((x2, j) => neonText(c, x2, sx + 50, sy + j * 112, 92, cc, T)); c.restore(); glow(c, sx + 50, sy + ch.length * 56, 380, cc, .22 * fl); });
    });
    // 车灯光轨
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 10; i++) { const d = i % 2 ? 1 : -1, x = ((hash(i + o.seed) * 1700 + T * (420 + hash(i + 2) * 500) * d) % 1700 + 1700) % 1700 - 300, y = hz - 18 + (i % 3) * 7, g = c.createLinearGradient(x, 0, x + 300 * d, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, d > 0 ? 'rgba(255,70,90,.9)' : 'rgba(255,240,210,.9)'); c.fillStyle = g; c.fillRect(Math.min(x, x + 300 * d), y, 300, 4); } c.restore();
    c.fillStyle = '#06040f'; c.fillRect(0, hz, W, H - hz);
    wetReflection(c, hz, .55, 5);
    // 地面高光条
    c.save(); c.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const y = hz + 30 + Math.pow(hash2(i, 9), 1.4) * 520, x = hash2(i, 8) * W, w = 60 + hash2(i, 7) * 260; c.fillStyle = rgb(hex([o.col, o.col2, o.col3][i % 3]), .12 + .1 * Math.sin(T * 2 + i)); c.fillRect(x, y, w, 2); } c.restore();
    if (o.walker) { const x = lerp(140, 820, u), y = 1560; umbrella(c, x + 6, y - 270, 120, '#0b0716'); figure(c, { x, y, h: 250, dir: 1, ph: t * 4.2, col: '#0b0716', rim: o.col2, coat: true, stride: .6, armR: [-.4, -1.6] }); }
    if (o.rainy) { rain(c, T, 220, '#d8e6ff', .55, .12, 5, 90); for (let i = 0; i < 24; i++) { const u2 = (hash(i) + T * 1.6) % 1, x = hash(i + 4) * W, y = hz + 40 + hash(i + 8) * 480; c.save(); c.globalAlpha = (1 - u2) * .5; c.strokeStyle = '#cfe0ff'; c.lineWidth = 1.5; c.beginPath(); c.ellipse(x, y, 40 * u2, 9 * u2, 0, 0, TAU); c.stroke(); c.restore(); } }
  };
}

function synthRoad(o = {}) {
  o = Object.assign({ sun: ['#ffe46b', '#ff4f9a'], sky: ['#120530', '#3a0a5a', '#a0237a', '#ff6a5c'], grid: '#ff4fd8', mount: '#1a0638', car: true, seed: 2 }, o);
  return function (c, T, A, t, u) {
    const hz = 1180;
    sky(c, o.sky, 0, hz); stars(c, T, 140, .9, 700, 71 + o.seed);
    // 条纹落日
    const sx = 540, sy = hz - 120 - u * 40, R = 330 + A.kick * 10;
    glow(c, sx, sy, R * 2.6, o.sun[1], .45);
    c.save(); c.beginPath(); c.arc(sx, sy, R, 0, TAU); c.clip();
    const g = c.createLinearGradient(0, sy - R, 0, sy + R); g.addColorStop(0, o.sun[0]); g.addColorStop(1, o.sun[1]); c.fillStyle = g; c.fillRect(sx - R, sy - R, R * 2, R * 2);
    c.fillStyle = o.sky[1]; for (let i = 0; i < 9; i++) { const yy = sy + R * (.05 + i * .11) + ((t * 30) % (R * .11)), hh = 3 + i * 3.2; c.fillRect(sx - R, yy, R * 2, hh); }
    c.restore();
    // 山（线框）
    [[hz - 10, 260, .0021, 0, .9], [hz, 170, .0034, 1, 1]].forEach(([y, amp, f, k, a]) => { ridge(c, y, amp, f, 120 + k + o.seed, t * (6 + k * 10), o.mount); c.save(); c.globalAlpha = a * .7; c.strokeStyle = o.grid; c.shadowColor = o.grid; c.shadowBlur = 16; c.lineWidth = 3; c.beginPath(); for (let x = -40; x <= W + 40; x += 8) { const yy = ridgeY(x, y, amp, f, 120 + k + o.seed, t * (6 + k * 10)); x < -30 ? c.moveTo(x, yy) : c.lineTo(x, yy); } c.stroke(); c.restore(); });
    // 透视网格地面
    c.fillStyle = '#0a0220'; c.fillRect(0, hz, W, H - hz);
    c.save(); c.strokeStyle = o.grid; c.shadowColor = o.grid; c.shadowBlur = 14; c.lineWidth = 3;
    for (let i = -14; i <= 14; i++) { c.globalAlpha = .75; c.beginPath(); c.moveTo(540 + i * 22, hz); c.lineTo(540 + i * 260, H + 40); c.stroke(); }
    const sp = 1.6 + A.env * .8; for (let k = 0; k < 18; k++) { const z = 1 + (((k * .6 - t * sp) % 10.8) + 10.8) % 10.8, y = hz + (H - hz) / z; c.globalAlpha = clamp(1.2 - z / 9) * .9; c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke(); }
    c.restore(); glow(c, 540, hz, 700, o.grid, .25 + A.kick * .2);
    if (o.car) { const cx = 540 + Math.sin(t * .6) * 40, cy = 1700; c.fillStyle = '#05010f'; c.beginPath(); c.moveTo(cx - 230, cy); c.lineTo(cx - 200, cy - 80); c.lineTo(cx - 110, cy - 150); c.lineTo(cx + 110, cy - 150); c.lineTo(cx + 200, cy - 80); c.lineTo(cx + 230, cy); c.closePath(); c.fill(); c.fillRect(cx - 230, cy - 10, 460, 50);
      [-1, 1].forEach(s => { glow(c, cx + s * 170, cy - 40, 140, '#ff2050', .9); c.fillStyle = '#ff6a7a'; c.fillRect(cx + s * 170 - 50, cy - 50, 100, 18); }); }
  };
}

function rainWindow(o = {}) {
  o = Object.assign({ warm: true, cols: ['#ffb36b', '#ff6a8a', '#7fb2ff', '#ffe08a'], figure: true, seed: 3 }, o);
  return function (c, T, A, t, u) {
    // 窗外：失焦的城市光斑
    sky(c, ['#05040f', '#0f0c2a', '#1d1640', '#2a1d48'], 0, H);
    bokeh(c, T, 42, o.cols, 11 + o.seed, 1.2, 200, 1500, 50, 170);
    bokeh(c, T * .7, 30, o.cols, 21 + o.seed, .9, 300, 1400, 18, 60);
    rainGlass(c, T, 1, o.seed, 90);
    // 窗框
    c.fillStyle = '#030208'; c.fillRect(0, 0, 70, H); c.fillRect(W - 70, 0, 70, H); c.fillRect(0, 0, W, 140); c.fillRect(530, 140, 20, 1400); c.fillRect(0, 1500, W, 420);
    c.fillStyle = '#0b0918'; c.fillRect(0, 1490, W, 20);
    if (o.figure) {
      const lamp = o.warm ? '#ffb070' : '#8fb8ff'; glow(c, 880, 1640, 700, lamp, .35);
      // 背影：坐在窗前，手机的光照着脸
      const px = 380, py = 1920 + 40; c.fillStyle = '#020106';
      c.beginPath(); c.moveTo(px - 300, py); c.bezierCurveTo(px - 300, py - 330, px - 180, py - 400, px - 70, py - 430); c.lineTo(px + 70, py - 430); c.bezierCurveTo(px + 180, py - 400, px + 300, py - 330, px + 300, py); c.closePath(); c.fill();
      c.beginPath(); c.ellipse(px + Math.sin(t * .5) * 4, py - 560, 112, 136, 0, 0, TAU); c.fill(); c.fillRect(px - 50, py - 450, 100, 60);
      c.strokeStyle = rgb(hex(lamp), .45); c.lineWidth = 4; c.beginPath(); c.ellipse(px, py - 560, 111, 135, 0, -.6, .9); c.stroke();
      const ph = .7 + .3 * Math.sin(t * 2.2); glow(c, px + 150, py - 500, 220, '#cfe2ff', .35 * ph);
    }
  };
}
