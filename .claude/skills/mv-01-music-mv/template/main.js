// ===== 每首歌要改的地方 =====
const OFF = 14.6;            // MV 从原曲第几秒开始（第一句人声前 1–2 秒）
const END = 231.6;           // 原曲总时长（秒）
const TITLE = '早早晚晚';     // 片名，片头和片尾用大号毛笔字
const SUBTITLE = '致  每 一 个 赶 路 的 人';
const END_LINES = ['早一点，晚一点', '都会到的'];
const BIG_LINE = '早早晚晚';  // 以这几个字开头的歌词行，用大号毛笔字逐字砸出（副歌标题句）
// ============================
const FPS = 30;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const cvB = mkCanvas(W, H), ctxB = cvB.getContext('2d');
LY.forEach((l, i) => { const n = LY[i + 1]; l.out = Math.min(l.b + 1.0, n ? n.a - .24 : l.b + 1.2); l.fd = (n && n.a - l.b < .8) ? .2 : .45; l.big = l.text.startsWith(BIG_LINE); });
function aud(T) { const i = clamp(Math.round(T * FPS), 0, AUD.kick.length - 1); return { kick: AUD.kick[i], env: AUD.env[i], hat: AUD.hat[i], rms: AUD.rms[i] }; }
function drawScene(c, i, T, A) {
  const s = SCENES[i], nx = SCENES[i + 1], b = nx ? nx.a : END, u = clamp((T - s.a) / (b - s.a));
  const z = 1.012 + .045 * u + A.kick * .004;
  c.save(); c.translate(W / 2, H * .55); c.scale(z, z); c.translate(-W / 2, -H * .55);
  s.f(c, T, A); c.restore();
}
function textGlow(c, dark) { if (dark) { c.shadowColor = 'rgba(255,250,235,.9)'; c.shadowBlur = 18; c.fillStyle = '#191b28'; } else { c.shadowColor = 'rgba(6,8,30,.95)'; c.shadowBlur = 26; c.fillStyle = '#fffaf0'; } }
function drawLyrics(c, T, sc) {
  for (const l of LY) {
    if (T < l.a - .4 || T > l.out + .5) continue;
    const fo = 1 - sst(l.out, l.out + l.fd, T);
    if (l.big) { drawBig(c, T, l, fo); continue; }
    const parts = l.text.split(' '), n = l.text.replace(/ /g, '').length;
    const rows = (n > 12 && parts.length > 1) ? parts : [l.text];
    const size = 70, adv = 80; c.save(); c.font = `700 ${size}px 'Noto Serif SC'`; c.textAlign = 'center'; c.textBaseline = 'middle';
    let ci = 0;
    rows.forEach((row, ri) => {
      const chars = [...row]; let wtot = 0; chars.forEach(ch => wtot += ch === ' ' ? adv * .55 : adv);
      let x = W / 2 - wtot / 2 + adv / 2; const y = sc.ly + (ri - (rows.length - 1) / 2) * 104;
      for (const ch of chars) {
        if (ch === ' ') { x += adv * .55; continue; }
        const ct = l.ct[ci++], p = sst(ct - .16, ct + .2, T), e = easeOut(p), live = Math.exp(-Math.max(0, T - ct) * 2.2) * p;
        if (p > 0) {
          c.globalAlpha = p * fo;
          for (let k = 0; k < 3; k++) { textGlow(c, sc.dark); c.fillText(ch, x, y + (1 - e) * 22 - (1 - fo) * 14); }
          if (live > .05 && !sc.dark) { c.shadowColor = 'rgba(255,214,140,.95)'; c.shadowBlur = 34; c.globalAlpha = live * fo * .9; c.fillStyle = '#fff1cc'; c.fillText(ch, x, y + (1 - e) * 22); }
        }
        x += adv;
      }
    });
    c.restore();
  }
}
function drawBig(c, T, l, fo) {
  const size = 236, y = 430; c.save(); c.font = `${size}px 'Ma Shan Zheng'`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let k = 0; k < 4; k++) {
    const ct = l.ct[k], ct2 = l.ct[k + 4], p = sst(ct - .1, ct + .22, T); if (p <= 0) continue;
    const pop = Math.exp(-Math.max(0, T - ct) * 5), pop2 = T > ct2 - .05 ? Math.exp(-Math.max(0, T - ct2) * 4) : 0;
    const x = W / 2 + (k - 1.5) * 232, yy = y + (k % 2 ? 26 : -26), s = 1 + pop * .35 + pop2 * .16;
    c.save(); c.translate(x, yy); c.scale(s, s); c.rotate((k % 2 ? 1 : -1) * .035);
    c.globalAlpha = p * fo; c.shadowColor = 'rgba(10,8,40,.75)'; c.shadowBlur = 30; c.fillStyle = '#fffaf0'; c.fillText(TITLE[k], 0, 0); c.fillText(TITLE[k], 0, 0);
    const gl = Math.max(pop, pop2); if (gl > .03) { c.globalAlpha = gl * fo; c.shadowColor = '#ffc860'; c.shadowBlur = 60; c.fillStyle = '#ffe9b0'; c.fillText(TITLE[k], 0, 0); }
    c.restore();
  }
  c.restore();
}
function drawTitle(c, T) {
  // opening title
  const a = sst(OFF + .15, OFF + .7, T) * (1 - sst(OFF + 1.6, OFF + 2.15, T));
  if (a > 0) {
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = a; c.shadowColor = 'rgba(20,10,50,.8)'; c.shadowBlur = 36; c.fillStyle = '#fffaf0';
    c.font = "250px 'Ma Shan Zheng'"; const sp = 236 + (T - OFF - .1) * 6, n = TITLE.length;
    for (let k = 0; k < n; k++) { const p = sst(OFF + .15 + k * .1, OFF + .6 + k * .1, T); c.globalAlpha = a * p; c.fillText(TITLE[k], W / 2 + (k - (n - 1) / 2) * sp, 520 + (1 - easeOut(p)) * 40); }
    c.globalAlpha = a * sst(OFF + .6, OFF + 1, T); c.font = "400 40px 'Noto Serif SC'"; c.shadowBlur = 14;
    c.fillText(SUBTITLE, W / 2, 720); c.fillRect(W / 2 - 60, 668, 120, 2);
    c.restore();
  }
  // end card
  const E0 = END - 11.2, e = sst(E0, E0 + 2, T);
  if (e > 0) {
    c.save(); c.fillStyle = `rgba(6,5,16,${e * .38})`; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(20,10,50,.85)'; c.shadowBlur = 36; c.fillStyle = '#fffaf0';
    c.font = "250px 'Ma Shan Zheng'";
    for (let k = 0; k < TITLE.length; k++) { const p = sst(E0 + .2 + k * .22, E0 + 1.1 + k * .22, T); c.globalAlpha = p; c.fillText(TITLE[k], W / 2 + (k - (TITLE.length - 1) / 2) * 240, 600 + (1 - easeOut(p)) * 40); }
    c.font = "700 54px 'Noto Serif SC'"; c.shadowBlur = 18;
    const [l1, l2] = END_LINES;
    [...l1].forEach((ch, i) => { c.globalAlpha = sst(E0 + 3.2 + i * .09, E0 + 3.8 + i * .09, T); c.fillText(ch, W / 2 + (i - (l1.length - 1) / 2) * 66, 840); });
    [...l2].forEach((ch, i) => { c.globalAlpha = sst(E0 + 4.8 + i * .12, E0 + 5.5 + i * .12, T); c.fillText(ch, W / 2 + (i - (l2.length - 1) / 2) * 66, 930); });
    c.restore();
  }
}
function renderFrame(fi) {
  const T = OFF + fi / FPS, A = aud(T);
  let i = 0; for (let k = 0; k < SCENES.length; k++) if (T >= SCENES[k].a - SCENES[k].x / 2) i = k;
  const s = SCENES[i]; let flash = 0, flashCol = '#fff', sc = s;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (i > 0 && s.x > 0 && T < s.a + s.x / 2) {
    const p = (T - (s.a - s.x / 2)) / s.x;
    if (s.fx) { const k = p < .5 ? i - 1 : i; drawScene(ctx, k, T, A); sc = SCENES[k]; flash = 1 - Math.abs(2 * p - 1); flash = Math.pow(flash, .7); flashCol = s.fx === 'white' ? '255,250,238' : '0,0,0'; }
    else { drawScene(ctx, i - 1, T, A); ctxB.setTransform(1, 0, 0, 1, 0, 0); ctxB.globalAlpha = 1; drawScene(ctxB, i, T, A); ctx.globalAlpha = easeIO(p); ctx.drawImage(cvB, 0, 0); ctx.globalAlpha = 1; sc = p < .5 ? SCENES[i - 1] : s; }
  } else drawScene(ctx, i, T, A);
  post(ctx, cv, fi, { bloom: sc.dark ? .16 : .3, grain: 0, vig: 0 });
  if (!window.NOLY) { drawTitle(ctx, T); drawLyrics(ctx, T, sc); }
  if (flash > 0) { ctx.fillStyle = `rgba(${flashCol},${flash})`; ctx.fillRect(0, 0, W, H); }
  post(ctx, cv, fi, { bloom: 0, grain: .06, vig: sc.dark ? .28 : .5 });
  const fin = 1 - sst(0, .9, T - OFF), fout = sst(END - 3.2, END - .4, T), bl = Math.max(fin, fout);
  if (bl > 0) { ctx.fillStyle = `rgba(0,0,0,${bl})`; ctx.fillRect(0, 0, W, H); }
}
window.ready = document.fonts.load("700 70px 'Noto Serif SC'", '早').then(() => Promise.all([document.fonts.load("400 40px 'Noto Serif SC'", '早'), document.fonts.load("900 70px 'Noto Serif SC'", '36'), document.fonts.load("250px 'Ma Shan Zheng'", '早晚'), document.fonts.load("92px 'Zhi Mang Xing'", '竹')]));
window.NOLY = false;
window.grab = fi => { renderFrame(fi); return cv.toDataURL('image/jpeg', .95); };
