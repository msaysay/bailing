// ===== 歌词样式、片头片尾（依赖 lib.js，读 CONFIG 和 LY）=====
// 样式在 config.js 的 lyrics.style 设全片默认，单个场景可以用 lyric: '...' 覆盖：
//   'glow'      逐字亮起，唱到的字带金色光晕（默认，最稳）
//   'karaoke'   整句先淡淡出现，唱到哪个字就把哪个字填成金色
//   'vertical'  竖排毛笔字，靠右，适合古风、水墨、安静的段落
//   'minimal'   小号、字距拉开、靠下，适合画面本身很满的时候（比如 AI 生图）
//   'none'      这个场景不出歌词
// 副歌标题句（config.js 的 bigLine 开头的那行）总是用大号毛笔字一个个砸出来。

const SERIF = "'Noto Serif SC'", BRUSH = "'Ma Shan Zheng'", INKF = "'Zhi Mang Xing'";
function prepLyrics() {
  LY.forEach((l, i) => {
    const n = LY[i + 1]; l.out = Math.min(l.b + 1.0, n ? n.a - .24 : l.b + 1.2); l.fd = (n && n.a - l.b < .8) ? .2 : .45;
    l.big = !!(CONFIG.bigLine && l.text.replace(/ /g, '').startsWith(CONFIG.bigLine.replace(/ /g, '')));
  });
}
function textGlow(c, dark) { if (dark) { c.shadowColor = 'rgba(255,250,235,.9)'; c.shadowBlur = 18; c.fillStyle = '#191b28'; } else { c.shadowColor = 'rgba(6,8,30,.95)'; c.shadowBlur = 26; c.fillStyle = CONFIG.lyrics.color || '#fffaf0'; } }
const ACC = () => CONFIG.lyrics.accent || '#ffd98a';
function rowsOf(l) { const parts = l.text.split(' '), n = l.text.replace(/ /g, '').length; return (n > 11 && parts.length > 1) ? parts : [l.text]; }

function drawLyrics(c, T, sc) {
  const style = sc.lyric || CONFIG.lyrics.style || 'glow'; if (style === 'none') return;
  for (const l of LY) {
    if (T < l.a - .4 || T > l.out + .5) continue;
    const fo = 1 - sst(l.out, l.out + l.fd, T);
    if (l.big) { drawBig(c, T, l, fo, sc); continue; }
    ({ glow: lyGlow, karaoke: lyKaraoke, vertical: lyVertical, minimal: lyMinimal }[style] || lyGlow)(c, T, l, fo, sc);
  }
}
function lyGlow(c, T, l, fo, sc) {
  const size = CONFIG.lyrics.size || 70, adv = size * 1.14; c.save(); c.font = `700 ${size}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  let ci = 0; const rows = rowsOf(l);
  rows.forEach((row, ri) => {
    const chars = [...row]; let wtot = 0; chars.forEach(ch => wtot += ch === ' ' ? adv * .55 : adv);
    let x = W / 2 - wtot / 2 + adv / 2; const y = sc.ly + (ri - (rows.length - 1) / 2) * size * 1.48;
    for (const ch of chars) {
      if (ch === ' ') { x += adv * .55; continue; }
      const ct = l.ct[ci++], p = sst(ct - .16, ct + .2, T), e = easeOut(p), live = Math.exp(-Math.max(0, T - ct) * 2.2) * p;
      if (p > 0) {
        c.globalAlpha = p * fo; for (let k = 0; k < 3; k++) { textGlow(c, sc.dark); c.fillText(ch, x, y + (1 - e) * 22 - (1 - fo) * 14); }
        if (live > .05 && !sc.dark) { c.shadowColor = 'rgba(255,214,140,.95)'; c.shadowBlur = 34; c.globalAlpha = live * fo * .9; c.fillStyle = '#fff1cc'; c.fillText(ch, x, y + (1 - e) * 22); }
      }
      x += adv;
    }
  });
  c.restore();
}
function lyKaraoke(c, T, l, fo, sc) {
  const size = CONFIG.lyrics.size || 70, adv = size * 1.12, ap = sst(l.a - .45, l.a - .1, T) * fo; if (ap <= 0) return;
  c.save(); c.font = `700 ${size}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  let ci = 0; const rows = rowsOf(l);
  rows.forEach((row, ri) => {
    const chars = [...row]; let wtot = 0; chars.forEach(ch => wtot += ch === ' ' ? adv * .55 : adv);
    let x = W / 2 - wtot / 2 + adv / 2; const y = sc.ly + (ri - (rows.length - 1) / 2) * size * 1.48 + (1 - easeOut(ap)) * 16;
    for (const ch of chars) {
      if (ch === ' ') { x += adv * .55; continue; }
      const ct = l.ct[ci++], f = sst(ct - .05, ct + .18, T);
      c.globalAlpha = ap; c.shadowColor = 'rgba(0,0,0,.8)'; c.shadowBlur = 20; c.fillStyle = 'rgba(255,255,255,.55)'; c.fillText(ch, x, y);
      if (f > 0) { c.globalAlpha = ap * f; c.shadowColor = ACC(); c.shadowBlur = 30; c.fillStyle = ACC(); c.fillText(ch, x, y - f * 4); }
      x += adv;
    }
  });
  c.restore();
}
function lyVertical(c, T, l, fo, sc) {
  const size = (CONFIG.lyrics.size || 70) * 1.25, cols = rowsOf(l), x0 = sc.lx || W - 150, y0 = sc.ly || 420;
  c.save(); c.font = `${size}px ${INKF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; let ci = 0;
  cols.forEach((col, k) => { [...col].forEach((ch, j) => { if (ch === ' ') return; const ct = l.ct[ci++], p = sst(ct - .2, ct + .35, T); if (p <= 0) return; const x = x0 - k * size * 1.25, y = y0 + j * size * 1.08 + (k ? size * .6 : 0);
    c.globalAlpha = p * fo; c.filter = p < 1 ? `blur(${((1 - p) * 8).toFixed(1)}px)` : 'none'; textGlow(c, sc.dark); c.fillText(ch, x, y); c.fillText(ch, x, y); }); });
  c.restore();
}
function lyMinimal(c, T, l, fo, sc) {
  const ap = sst(l.a - .3, l.a + .1, T) * fo; if (ap <= 0) return; const s = [...l.text.replace(/ /g, '　')].join(' '), y = sc.ly || H * .78;
  c.save(); c.font = `400 ${Math.round((CONFIG.lyrics.size || 70) * .7)}px ${SERIF}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.globalAlpha = ap; c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = 18; c.fillStyle = '#fff'; c.fillText(s, W / 2, y + (1 - easeOut(ap)) * 10);
  const sung = l.ct.filter(t => t <= T).length / l.ct.length; c.globalAlpha = ap * .8; c.fillStyle = ACC(); c.fillRect(W / 2 - 120, y + 50, 240 * sung, 3); c.restore();
}
function drawBig(c, T, l, fo, sc) {
  const word = [...CONFIG.bigLine.replace(/ /g, '')], n = word.length, size = Math.min(236, 900 / n), y = sc.bigY || 430;
  c.save(); c.font = `${size}px ${BRUSH}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let k = 0; k < n; k++) {
    const ct = l.ct[k], again = l.ct[k + n], p = sst(ct - .1, ct + .22, T); if (p <= 0) continue;
    const pop = Math.exp(-Math.max(0, T - ct) * 5), pop2 = again !== undefined && T > again - .05 ? Math.exp(-Math.max(0, T - again) * 4) : 0;
    const x = W / 2 + (k - (n - 1) / 2) * size * .98, yy = y + (k % 2 ? 26 : -26), s = 1 + pop * .35 + pop2 * .16;
    c.save(); c.translate(x, yy); c.scale(s, s); c.rotate((k % 2 ? 1 : -1) * .035);
    c.globalAlpha = p * fo; c.shadowColor = 'rgba(10,8,40,.75)'; c.shadowBlur = 30; c.fillStyle = '#fffaf0'; c.fillText(word[k], 0, 0); c.fillText(word[k], 0, 0);
    const gl = Math.max(pop, pop2); if (gl > .03) { c.globalAlpha = gl * fo; c.shadowColor = '#ffc860'; c.shadowBlur = 60; c.fillStyle = '#ffe9b0'; c.fillText(word[k], 0, 0); }
    c.restore();
  }
  c.restore();
}
function drawTitleCards(c, T) {
  const OFF = CONFIG.start, END = CONFIG.end, TITLE = [...CONFIG.title], n = TITLE.length, ts = Math.min(250, 960 / n);
  const a = sst(OFF + .15, OFF + .7, T) * (1 - sst(OFF + (CONFIG.titleHold || 1.6), OFF + (CONFIG.titleHold || 1.6) + .55, T));
  if (a > 0) {
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(20,10,50,.8)'; c.shadowBlur = 36; c.fillStyle = '#fffaf0';
    c.font = `${ts}px ${BRUSH}`; const sp = ts * .95 + (T - OFF - .1) * 6;
    for (let k = 0; k < n; k++) { const p = sst(OFF + .15 + k * .1, OFF + .6 + k * .1, T); c.globalAlpha = a * p; c.fillText(TITLE[k], W / 2 + (k - (n - 1) / 2) * sp, 520 + (1 - easeOut(p)) * 40); }
    if (CONFIG.subtitle) { c.globalAlpha = a * sst(OFF + .6, OFF + 1, T); c.font = `400 40px ${SERIF}`; c.shadowBlur = 14; c.fillText([...CONFIG.subtitle].join(' '), W / 2, 720); c.fillRect(W / 2 - 60, 668, 120, 2); }
    c.restore();
  }
  if (!CONFIG.ending) return;
  const E0 = END - (CONFIG.endCard || 11.2), e = sst(E0, E0 + 2, T);
  if (e > 0) {
    c.save(); c.fillStyle = `rgba(6,5,16,${e * .38})`; c.fillRect(0, 0, W, H);
    c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(20,10,50,.85)'; c.shadowBlur = 36; c.fillStyle = '#fffaf0';
    c.font = `${ts}px ${BRUSH}`;
    for (let k = 0; k < n; k++) { const p = sst(E0 + .2 + k * .22, E0 + 1.1 + k * .22, T); c.globalAlpha = p; c.fillText(TITLE[k], W / 2 + (k - (n - 1) / 2) * ts * .96, 600 + (1 - easeOut(p)) * 40); }
    c.font = `700 54px ${SERIF}`; c.shadowBlur = 18;
    (CONFIG.ending || []).forEach((line, li) => [...line].forEach((ch, i) => { c.globalAlpha = sst(E0 + 3.2 + li * 1.6 + i * .1, E0 + 3.8 + li * 1.6 + i * .1, T); c.fillText(ch, W / 2 + (i - (line.length - 1) / 2) * 66, 840 + li * 90); }));
    c.restore();
  }
}
