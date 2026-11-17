const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.join(__dirname, 'main.html')); await p.evaluate(() => window.ready);
  // 封面取第几秒的画面（不带歌词）、标题和副标题
  const COVER = { t: 127.62, sub: '致每一个赶路的人' };
  const out = await p.evaluate((CO) => { const COVER_T = CO.t;
    window.NOLY = true; window.NOTREE = true; renderFrame(Math.round((COVER_T - OFF) * 30));
    const c = ctx; c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    const g = c.createLinearGradient(0, 250, 0, 900); g.addColorStop(0, 'rgba(20,10,50,0)'); g.addColorStop(.4, 'rgba(20,10,50,.28)'); g.addColorStop(1, 'rgba(20,10,50,0)'); c.fillStyle = g; c.fillRect(0, 250, W, 650);
    c.shadowColor = 'rgba(20,8,50,.9)'; c.shadowBlur = 40; c.fillStyle = '#fffaf0'; c.font = "275px 'Ma Shan Zheng'";
    for (let r = 0; r < 2; r++) for (let k = 0; k < 4; k++) { c.save(); c.translate(W / 2 + (k - 1.5) * 248, 520 + (k % 2 ? 24 : -24)); c.rotate((k % 2 ? 1 : -1) * .035); c.fillText(TITLE[k], 0, 0); c.restore(); }
    c.shadowBlur = 20; c.fillRect(W / 2 - 70, 706, 140, 3);
    c.font = "700 62px 'Noto Serif SC'"; const s = CO.sub; for (let r = 0; r < 2; r++) [...s].forEach((ch, i) => c.fillText(ch, W / 2 + (i - (s.length - 1) / 2) * 88, 790));
    
    c.restore();
    const full = cv.toDataURL('image/jpeg', .95);
    const k = mkCanvas(1080, 1440); k.getContext('2d').drawImage(cv, 0, 330, 1080, 1440, 0, 0, 1080, 1440);
    return [full, k.toDataURL('image/jpeg', .95)];
  }, COVER);
  const dir = path.join(__dirname, '..');
  fs.writeFileSync(path.join(dir, '封面_抖音_9x16_1080x1920.jpg'), Buffer.from(out[0].split(',')[1], 'base64'));
  fs.writeFileSync(path.join(dir, '封面_视频号_3x4_1080x1440.jpg'), Buffer.from(out[1].split(',')[1], 'base64'));
  await b.close();
})();
