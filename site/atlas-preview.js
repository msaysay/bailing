// 风格预览：给一组风格参数（styles/atlas-styles.json 里的 t），画出一条口播片大概长什么样（标题、人、字幕、强调、名牌、小卡片），4 秒一循环。
// 混搭规则也在这里（网页混搭器和 scripts/atlas.py 用的是同一套）：结构取第一种，皮肤取第二种，点睛取第三种。
(function (g) {
  const c01 = (x) => Math.max(0, Math.min(1, x)), o5 = (x) => 1 - Math.pow(1 - c01(x), 5), back = (x) => { const p = c01(x), k = 1.9; return 1 + (k + 1) * Math.pow(p - 1, 3) + k * Math.pow(p - 1, 2); };
  const FONT = { hei: ['"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif', 900], song: ['"Songti SC","Noto Serif CJK SC","Source Han Serif SC","SimSun",serif', 900], kai: ['"Kaiti SC","STKaiti","KaiTi",serif', 700], round: ['"Yuanti SC","PingFang SC","Microsoft YaHei",sans-serif', 900], thin: ['"PingFang SC","Microsoft YaHei",sans-serif', 300], mono: ['"SF Mono",Menlo,Consolas,"Courier New",monospace', 700], pixel: ['"Courier New",Menlo,monospace', 900], hand: ['"Kaiti SC","STKaiti","KaiTi",cursive', 700] };
  const hex = (c) => { const m = /^#?([0-9a-f]{6})$/i.exec(String(c).trim()); if (!m) return [128, 128, 128]; const n = parseInt(m[1], 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const lum = (c) => { const [r, gg, b] = hex(c); return (0.299 * r + 0.587 * gg + 0.114 * b) / 255; };
  const mixc = (a, b, p) => { const x = hex(a), y = hex(b); return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * p)).join(',') + ')'; };
  const W = 480, H = 270, CY = 4.2;
  const font = (T, size, w) => `${w || FONT[T.font][1]} ${size}px ${FONT[T.font][0]}`;
  const rr = (k, x, y, w, h, r) => { k.beginPath(); k.roundRect(x, y, w, h, Math.max(0, r)); };
  const tex = (k, T, u) => {
    const dark = lum(T.bg) < 0.5, ink = dark ? '255,255,255' : '0,0,0'; k.save();
    if (T.tex === 'grid') { k.strokeStyle = `rgba(${ink},.07)`; k.lineWidth = 1; for (let x = 0; x < W; x += 24) { k.beginPath(); k.moveTo(x, 0); k.lineTo(x, H); k.stroke(); } for (let y = 0; y < H; y += 24) { k.beginPath(); k.moveTo(0, y); k.lineTo(W, y); k.stroke(); } }
    if (T.tex === 'dots' || T.tex === 'halftone') { k.fillStyle = `rgba(${ink},${T.tex === 'halftone' ? .16 : .09})`; const s = T.tex === 'halftone' ? 9 : 14; for (let y = 0; y < H; y += s) for (let x = (y / s) % 2 ? s / 2 : 0; x < W; x += s) { k.beginPath(); k.arc(x, y, T.tex === 'halftone' ? 1 + 2.4 * (x / W) : 1.3, 0, 7); k.fill(); } }
    if (T.tex === 'paper' || T.tex === 'grain') { let s = 7; const n = T.tex === 'grain' ? 900 : 500; for (let i = 0; i < n; i++) { s = (s * 9301 + 49297 + (T.tex === 'grain' ? Math.floor(u * 12) : 0)) % 233280; const x = (s / 233280) * W; s = (s * 9301 + 49297) % 233280; const y = (s / 233280) * H; k.fillStyle = `rgba(${T.tex === 'grain' ? '255,255,255' : '90,60,20'},${T.tex === 'grain' ? .06 : .05})`; k.fillRect(x, y, 2, 2); } }
    if (T.tex === 'scan') { k.fillStyle = `rgba(${ink},.06)`; for (let y = 0; y < H; y += 4) k.fillRect(0, y, W, 1); }
    if (T.tex === 'glow') { const gr = k.createRadialGradient(W * .3, H * .3, 0, W * .3, H * .3, 260); gr.addColorStop(0, T.hot + '66'); gr.addColorStop(1, 'transparent'); k.fillStyle = gr; k.fillRect(0, 0, W, H); const g2 = k.createRadialGradient(W * .8, H * .75, 0, W * .8, H * .75, 220); g2.addColorStop(0, T.hot2 + '55'); g2.addColorStop(1, 'transparent'); k.fillStyle = g2; k.fillRect(0, 0, W, H); }
    k.restore();
  };
  /** 人的剪影（代替真人）：头 + 肩。 */
  const person = (k, T, x, y, s, cut) => { const col = mixc(T.bg, T.fg, lum(T.bg) < .5 ? .28 : .32); k.save(); if (cut) { k.strokeStyle = '#fff'; k.lineWidth = T.stroke || 4; k.lineJoin = 'round'; } k.fillStyle = col; k.beginPath(); k.arc(x, y - 44 * s, 26 * s, 0, 7); if (cut) k.stroke(); k.fill(); rr(k, x - 52 * s, y - 12 * s, 104 * s, 120 * s, 30 * s); if (cut) k.stroke(); k.fill(); k.restore(); };
  /** 一行字，带这种风格的描边 / 底托。 */
  const text = (k, T, s, x, y, size, col, opt) => { opt = opt || {}; k.save(); k.font = font(T, size, opt.w); k.textAlign = opt.align || 'left'; k.textBaseline = 'middle'; if (T.font === 'hand') { k.translate(x, y); k.rotate(-0.025); k.translate(-x, -y); }
    if (opt.stroke) { k.lineJoin = 'round'; k.lineWidth = opt.stroke; k.strokeStyle = opt.strokeCol || (lum(col) > .5 ? '#000' : '#fff'); k.strokeText(s, x, y); } k.fillStyle = col; k.fillText(s, x, y); const w = k.measureText(s).width; k.restore(); return w; };
  const accent = (k, T, x, y, w, p) => { k.save(); k.fillStyle = T.hot; k.strokeStyle = T.hot; k.lineCap = 'round';
    if (T.shape === 'bar') k.fillRect(x - 12, y - 22, 5, 44 * p);
    if (T.shape === 'underline') { k.lineWidth = 5; k.beginPath(); k.moveTo(x, y + 22); k.lineTo(x + w * p, y + 22); k.stroke(); }
    if (T.shape === 'brush') { k.globalAlpha = .55; k.lineWidth = 20; k.beginPath(); k.moveTo(x - 4, y + 4); k.quadraticCurveTo(x + w * p / 2, y - 2, x + w * p + 4, y + 6); k.stroke(); }
    if (T.shape === 'circle') { k.beginPath(); k.arc(x - 18, y, 7 * p, 0, 7); k.fill(); }
    if (T.shape === 'bracket') { k.lineWidth = 2; const b = 8, e = 10 * (2 - p); [[x - e, y - 20, 1, 1], [x + w + e, y - 20, -1, 1], [x - e, y + 20, 1, -1], [x + w + e, y + 20, -1, -1]].forEach(([a, c, sx, sy]) => { k.beginPath(); k.moveTo(a, c + sy * b); k.lineTo(a, c); k.lineTo(a + sx * b, c); k.stroke(); }); }
    k.restore(); };
  const enter = (k, T, p, x, y) => { const m = T.motion; if (m === 'pop') { const s = back(p); k.translate(x, y); k.scale(s, s); k.translate(-x, -y); } if (m === 'rise') k.translate(0, (1 - o5(p)) * 30); if (m === 'slide') k.translate((1 - o5(p)) * -80, 0); if (m === 'slam') { const s = 1.8 - .8 * o5(p / .5); k.translate(x, y); k.scale(s, s); k.translate(-x, -y); } if (m === 'glitch' && p < .5) k.translate(Math.sin(p * 90) * 8 * (1 - p * 2), 0); k.globalAlpha *= m === 'fade' ? c01(p) : c01(p * 4); };

  /** 画一帧。T 风格参数；u 秒。brand 可选：右上角署名。 */
  const draw = (k, T, u, brand) => {
    u = u % CY; const dark = lum(T.bg) < .5, sub = dark ? 'rgba(255,255,255,.6)' : 'rgba(0,0,0,.55)', fade = u > CY - .45 ? c01((CY - u) / .45) : 1;
    k.save(); k.clearRect(0, 0, W, H); k.fillStyle = T.bg; k.fillRect(0, 0, W, H); tex(k, T, u); k.globalAlpha = fade;
    const L = T.layout, px = L === 'split' ? 350 : L === 'card' ? 130 : L === 'pip' ? 410 : L === 'board' ? 120 : 240, ps = L === 'pip' ? .55 : L === 'split' || L === 'card' || L === 'board' ? 1.25 : 1.45, py = L === 'pip' ? 80 : 170;
    // 版式底
    if (L === 'split') { k.save(); k.fillStyle = T.panel; k.transform(1, 0, -.14, 1, 0, 0); k.fillRect(-20, 0, 250 * o5(u / .5), H); k.fillStyle = T.hot; k.fillRect(250 * o5(u / .5) - 22, 0, 4, H); k.restore(); }
    if (L === 'board') { k.fillStyle = T.panel; k.save(); k.shadowColor = 'rgba(0,0,0,.25)'; k.shadowBlur = 16; k.shadowOffsetY = 6; rr(k, 26, 22, 428, 200, T.radius / 2); k.fill(); k.restore(); }
    if (L === 'pip') { k.fillStyle = T.panel; rr(k, 20, 20, 320, 180, T.radius); k.fill(); k.strokeStyle = mixc(T.panel, T.fg, .2); k.lineWidth = 1; k.stroke(); k.fillStyle = T.hot; [.4, .62, .5, .85].forEach((v, i) => { const hgt = 110 * v * o5((u - .5 - i * .1) / .6); k.fillRect(60 + i * 62, 180 - hgt, 36, hgt); }); k.save(); k.beginPath(); k.arc(px, py, 46, 0, 7); k.fillStyle = T.panel; k.fill(); k.lineWidth = 3; k.strokeStyle = T.hot; k.stroke(); k.clip(); person(k, T, px, py + 44, .62); k.restore(); }
    else person(k, T, px, py, ps, L === 'board');
    if (L === 'card') { k.save(); enter(k, T, (u - .9) / .5, 330, 110); k.fillStyle = T.panel; rr(k, 240, 44, 212, 132, T.radius); k.fill(); if (T.stroke) { k.lineWidth = T.stroke; k.strokeStyle = T.font === 'pixel' || lum(T.panel) > .6 ? T.fg : T.hot; k.stroke(); }
      const pfg = (/^rgba/.test(T.panel) ? dark : lum(T.panel) < .5) ? '#fff' : '#111'; text(k, T, 'KEY POINT', 258, 66, 11, T.hot, { w: 700 }); text(k, T, '298', 258, 104, 44, pfg); k.fillStyle = T.hot2; k.fillRect(258, 138, 150 * o5((u - 1.2) / .8), 8); k.fillStyle = mixc(T.hot2, T.panel.startsWith('#') ? T.panel : T.bg, .7); k.fillRect(258, 138, 176, 2); k.restore(); }
    if (L === 'letterbox') { k.fillStyle = '#000'; k.fillRect(0, 0, W, 30); k.fillRect(0, H - 30, W, 30); }
    // 标题
    const tx = L === 'split' ? 26 : L === 'card' || L === 'board' ? 250 : L === 'pip' ? 36 : 30, ty = L === 'pip' ? 228 : L === 'card' ? 204 : L === 'board' ? 70 : 62, big = L === 'pip' || L === 'card' ? 24 : 34;
    const tcol = L === 'split' || L === 'board' ? ((/^rgba/.test(T.panel) ? dark : lum(T.panel) < .5) ? '#fff' : '#111') : T.fg;
    if (!(L === 'card' || L === 'pip')) { k.save(); enter(k, T, (u - .15) / .5, tx + 80, ty); text(k, T, '短视频剪辑', tx, ty, big * .62, L === 'split' || L === 'board' ? tcol : sub, { w: T.font === 'thin' ? 300 : 700 }); k.restore(); }
    k.save(); const p2 = (u - .45) / .5; enter(k, T, p2, tx + 90, ty + big * 1.05); const hy = L === 'card' || L === 'pip' ? ty : ty + big * 1.05;
    const tw = text(k, T, T.motion === 'type' ? 'AI 时代'.slice(0, Math.ceil(c01(p2 * 1.2) * 5)) : 'AI 时代', tx, hy, big * 1.25, T.shape === 'brush' || T.shape === 'bracket' ? tcol : T.hot, T.cap === 'pop' ? { stroke: T.stroke || 6, strokeCol: dark ? '#000' : T.fg } : {}); k.restore();
    accent(k, T, tx, hy, tw || 120, o5((u - .8) / .5));
    // 字幕
    const cy = L === 'letterbox' ? H - 48 : L === 'pip' || L === 'card' ? H - 22 : H - 34, cs = 17, line = u < 2.1 ? '你现在看到的这条视频' : '是我用 AI 一键剪出来的', hotw = u < 2.1 ? '这条视频' : 'AI 一键';
    if (!(L === 'pip' || L === 'card')) { k.save(); k.font = font(T, cs, T.font === 'thin' ? 500 : undefined); const w = k.measureText(line).width, x0 = W / 2 - w / 2; k.globalAlpha *= c01((u - 1.0) / .2);
      if (T.cap === 'bar') { k.fillStyle = 'rgba(0,0,0,.72)'; k.fillRect(x0 - 12, cy - 15, w + 24, 30); k.fillStyle = T.hot; k.fillRect(x0 - 12, cy - 15, 4, 30); }
      if (T.cap === 'box') { k.fillStyle = T.hot; rr(k, x0 - 12, cy - 15, w + 24, 30, Math.min(15, T.radius)); k.fill(); }
      const i = line.indexOf(hotw), a = line.slice(0, i), b = line.slice(i + hotw.length), base = T.cap === 'box' ? (lum(T.hot) > .55 ? '#111' : '#fff') : T.cap === 'bar' ? '#fff' : T.fg, st = T.cap === 'stroke' ? { stroke: 4, strokeCol: 'rgba(0,0,0,.85)' } : T.cap === 'pop' ? { stroke: Math.max(5, T.stroke), strokeCol: dark ? '#000' : T.fg } : {};
      let x = x0; x += text(k, T, a, x, cy, cs, base, st); x += text(k, T, hotw, x, cy, cs, T.cap === 'box' ? base : T.hot === base ? T.hot2 : T.hot, st); text(k, T, b, x, cy, cs, base, st); k.restore(); }
    // 名牌 / 署名
    if (brand) { k.save(); k.globalAlpha *= .8; text(k, T, brand, W - 14, L === 'letterbox' ? 44 : 16, 10, L === 'board' || L === 'split' ? sub : sub, { align: 'right', w: 600 }); k.restore(); }
    k.restore();
  };

  /** 混搭：结构（版式、动效、字幕样式）取 A；皮肤（配色、纹理、字体、圆角）取 B；点睛（强调色、强调形状、描边）取 C（没有 C 就用 B 的强调色、A 的形状）。
   *  fp 给了就套上个人指纹：强调色换成主色；底色是深色时换成指纹的底色。最后保证文字和底色有足够反差。 */
  const mix = (A, B, C, fp) => { B = B || A; const T = { layout: A.layout, motion: A.motion, cap: A.cap, bg: B.bg, panel: B.panel, fg: B.fg, tex: B.tex, font: B.font, radius: B.radius, hot: (C || B).hot, hot2: (C || B).hot2, shape: (C || A).shape, stroke: (C || B).stroke };
    if (fp) { T.hot = fp.c2 || T.hot; if (lum(T.bg) < .35 && fp.c1) T.bg = fp.c1; }
    if (Math.abs(lum(T.bg) - lum(T.fg)) < .45) T.fg = lum(T.bg) < .5 ? '#FFFFFF' : '#141414';
    if (Math.abs(lum(T.bg) - lum(T.hot)) < .18) T.hot = lum(T.bg) < .5 ? '#FFD84A' : '#C1272D';
    if (T.cap === 'plain' && T.layout === 'full' && T.tex === 'none') T.cap = 'stroke';                      // 人全屏又没有底托时，字幕至少要描边
    return T; };
  /** 自动混搭：按内容类型给三个方案。结构从现成能出片的风格里挑（最稳），皮肤从蒸馏和外来风格里挑，尽量不重复。seed 相同结果相同。 */
  const auto = (all, type, seed) => { let s = 0; String(seed || type).split('').forEach((c) => { s = (s * 31 + c.charCodeAt(0)) % 9973; }); const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
    const fit = (x) => (x.fits || []).includes(type), rank = (arr) => arr.map((x) => [x, (fit(x) ? 2 : 0) + rnd()]).sort((a, b) => b[1] - a[1]).map((x) => x[0]);
    const As = rank(all.filter((x) => x.kind === 'house')), Bs = rank(all.filter((x) => x.kind !== 'house')), out = [];
    for (let i = 0; i < 3; i++) { const A = As[i % As.length], B = Bs[i], C = Bs[Bs.length - 1 - i]; out.push({ A, B, C: i === 2 ? C : null, why: `结构用「${A.name}」（现成能出片）；皮肤用「${B.name}」${i === 2 ? `；点睛用「${C.name}」的强调色` : ''}` }); }
    return out; };
  g.AtlasPreview = { draw, mix, auto, W, H, CY, lum };
})(typeof window !== 'undefined' ? window : globalThis);
