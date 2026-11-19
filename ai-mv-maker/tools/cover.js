// 封面：取某一秒的画面（不带歌词），叠上片名和副标题，出三张
//   node tools/cover.js projects/我的歌               用 config.js 里 cover 的设置
//   node tools/cover.js projects/我的歌 127.5 "致每一个赶路的人"   临时指定秒数和副标题
// 输出：out/封面_抖音_9x16.jpg（1080×1920）、out/封面_3x4_视频号小红书.jpg（1080×1440，取中间）
const fs = require('fs'), path = require('path');
const { launch, openProject, projectArg } = require('./browser');
(async () => {
  const proj = projectArg(), b = await launch(), p = await openProject(b, proj);
  const o = { t: process.argv[3] ? +process.argv[3] : null, sub: process.argv[4] };
  const [full, crop] = await p.evaluate((o) => {
    const cv0 = CONFIG.cover || {}, T = o.t || cv0.t || (CONFIG.start + (CONFIG.end - CONFIG.start) * .55), sub = o.sub !== undefined ? o.sub : (cv0.sub !== undefined ? cv0.sub : CONFIG.subtitle);
    window.NOLY = true; renderFrame(Math.round((T - CONFIG.start) * FPS)); window.NOLY = false;
    const c = ctx, TT = [...CONFIG.title], n = TT.length, ts = Math.min(275, 980 / n), y = cv0.y || 540;
    c.save(); c.textAlign = 'center'; c.textBaseline = 'middle';
    const g = c.createLinearGradient(0, y - 320, 0, y + 420); g.addColorStop(0, 'rgba(10,6,30,0)'); g.addColorStop(.45, 'rgba(10,6,30,.32)'); g.addColorStop(1, 'rgba(10,6,30,0)'); c.fillStyle = g; c.fillRect(0, y - 320, W, 740);
    c.shadowColor = 'rgba(15,8,45,.9)'; c.shadowBlur = 40; c.fillStyle = '#fffaf0'; c.font = `${ts}px 'Ma Shan Zheng'`;
    for (let r = 0; r < 2; r++) for (let k = 0; k < n; k++) { c.save(); c.translate(W / 2 + (k - (n - 1) / 2) * ts * .92, y + (k % 2 ? 22 : -22)); c.rotate((k % 2 ? 1 : -1) * .035); c.fillText(TT[k], 0, 0); c.restore(); }
    if (sub) { c.shadowBlur = 20; c.fillRect(W / 2 - 70, y + 186, 140, 3); c.font = "700 60px 'Noto Serif SC'"; const sp = Math.min(84, 900 / sub.length); for (let r = 0; r < 2; r++)[...sub].forEach((ch, i) => c.fillText(ch, W / 2 + (i - (sub.length - 1) / 2) * sp, y + 270)); }
    c.restore();
    const k = mkCanvas(1080, 1440); k.getContext('2d').drawImage(cv, 0, 240, 1080, 1440, 0, 0, 1080, 1440);
    return [cv.toDataURL('image/jpeg', .95), k.toDataURL('image/jpeg', .95)];
  }, o);
  const out = path.join(proj, 'out'); fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, '封面_抖音_9x16.jpg'), Buffer.from(full.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(out, '封面_3x4_视频号小红书.jpg'), Buffer.from(crop.split(',')[1], 'base64'));
  await b.close(); console.log('封面已出：' + out);
})().catch(e => { console.error(e.message); process.exit(1); });
