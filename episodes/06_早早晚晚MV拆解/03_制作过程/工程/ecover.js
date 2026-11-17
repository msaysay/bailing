const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
const OUT = process.argv[2];
const JOBS = [
  { file: '封面_抖音_9x16_1080x1920.jpg', w: 1080, h: 1920, tag: '自己拆自己', l1: '这支 MV', l2: '我一帧没画', chips: ['Suno 做歌', 'AI 写代码', '6500 帧'], s2: 172, y: { tag: 330, l1: 490, l2: 680, card: 1215, ch: 720, chips: 1660 } },
  { file: '封面_视频号_3x4_1080x1440.jpg', w: 1080, h: 1440, tag: '自己拆自己', l1: '这支 MV', l2: '我一帧没画', chips: ['Suno 做歌', 'AI 写代码', '6500 帧'], s1: 140, s2: 168, y: { tag: 140, l1: 280, l2: 450, card: 895, ch: 590, chips: 1270 } },
  { file: '封面_小红书_3x4_1080x1440.jpg', w: 1080, h: 1440, tag: 'AI 做 MV · 全流程拆解', l1: '不会画画 不会剪辑', l2: 'AI 给我做了支 MV', s1: 92, s2: 106, chips: ['Suno 做歌', 'AI 写代码出画面', '附 Skill'], y: { tag: 130, l1: 275, l2: 420, card: 870, ch: 610, chips: 1270 } },
];
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.join(__dirname, 'ep.html')); await p.evaluate(() => window.ready);
  for (const J of JOBS) {
    const d = await p.evaluate(async (J) => {
      im('cover_new.jpg'); im('st_34.jpg'); await loadReq();
      const k = mkCanvas(J.w, J.h), c = k.getContext('2d'), Y = J.y, cx = J.w / 2;
      c.fillStyle = BGC; c.fillRect(0, 0, J.w, J.h); glow(c, cx, Y.card - 100, 1100, '#5a4318', .6); glow(c, cx, Y.l2, 700, '#3a2c12', .5);
      for (let i = 0; i < 90; i++) { c.globalAlpha = .1 + .3 * hash2(i, 4); c.fillStyle = i % 4 ? WH : GOLD; c.fillRect(hash2(i, 1) * J.w, hash2(i, 2) * J.h, 3, 3); } c.globalAlpha = 1;
      chip(c, cx, Y.tag, J.tag, { gold: 1, size: 46, padx: 34, fill: '#17130a' });
      txt(c, J.l1, cx, Y.l1, J.s1 || 150, { w: 900, glow: 'rgba(0,0,0,.6)', gb: 30 });
      txt(c, J.l2, cx, Y.l2, J.s2 || 186, { w: 900, col: GOLD, glow: 'rgba(215,185,121,.55)', gb: 60 });
      // code panel -> arrow -> MV card
      const ch = Y.ch, cw = ch * 9 / 16, px = cx - 440, pw = 400, ph = ch * .78, py = Y.card - ph / 2;
      c.save(); c.translate(px + pw / 2, Y.card); c.rotate(-.05); c.translate(-(px + pw / 2), -Y.card); box(c, px, py, pw, ph, { fill: 'rgba(10,12,20,.96)', stroke: 'rgba(215,185,121,.55)', lw: 3 }); [0, 1, 2].forEach(i => dot(c, px + 34 + i * 30, py + 34, 9, ['#e0605a', '#e6b450', '#62c462'][i]));
      c.save(); rr(c, px, py, pw, ph, 22); c.clip(); CODE.slice(1, 1 + Math.floor((ph - 80) / 34)).forEach((l, i) => txt(c, l.trim().slice(0, 30), px + 24, py + 86 + i * 34, 21, { al: 'left', f: "'DejaVu Sans Mono', monospace", w: 400, col: l.trim().startsWith('//') ? '#6b7394' : (i % 3 ? '#b8c4e8' : '#c3e88d') })); c.restore(); c.restore();
      card(c, IMG.get('cover_new.jpg'), cx + 190, Y.card, cw, ch, { rot: .045, stroke: GOLD, lw: 6, glow: 'rgba(215,185,121,.45)', gb: 80 });
      arrow(c, cx - 66, Y.card, cx + 6, Y.card, GOLD, 1, 12);
      chipRow(c, J.chips.map((s, i) => [s, 1, i === 1]), cx, Y.chips, { size: J.chips.join('').length > 16 ? 42 : 48, gap: 18, padx: 24 });
      const tmp = cv.width; // grain + vignette on k
      const g = c.createRadialGradient(cx, J.h * .5, J.h * .3, cx, J.h * .5, J.h * .8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,8,.5)'); c.fillStyle = g; c.fillRect(0, 0, J.w, J.h);
      return k.toDataURL('image/jpeg', .95);
    }, J);
    fs.writeFileSync(path.join(OUT, J.file), Buffer.from(d.split(',')[1], 'base64'));
  }
  await b.close();
})();
