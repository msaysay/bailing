// 出测试图：
//   node tools/preview.js projects/我的歌                每个场景出 2 张，拼成联系表 out/预览_场景总览.jpg
//   node tools/preview.js projects/我的歌 20 35.5 60     只出这几秒的单帧（原曲秒数）
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const { launch, openProject, ffmpegPath, projectArg } = require('./browser');
(async () => {
  const proj = projectArg(), out = path.join(proj, 'out', 'preview'); fs.mkdirSync(out, { recursive: true });
  const b = await launch(), p = await openProject(b, proj); const info = await p.evaluate(() => window.info());
  let times = process.argv.slice(3).map(Number).filter(x => !isNaN(x));
  if (!times.length) { const sc = info.scenes.concat([info.end]); for (let i = 0; i < sc.length - 1; i++) { const d = sc[i + 1] - sc[i]; times.push(+(sc[i] + d * .3).toFixed(2), +(sc[i] + d * .8).toFixed(2)); } }
  const files = [];
  for (const T of times) { const d = await p.evaluate(fi => window.grab(fi, .9), Math.round((T - info.start) * 30)); const f = path.join(out, `${T.toFixed(2)}.jpg`); fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64')); files.push(f); }
  if (p._errs.length) console.log('页面报错：\n' + p._errs.join('\n'));
  await b.close();
  // 联系表：每张缩小，8 张一排
  const ff = ffmpegPath(), cols = Math.min(8, files.length), rows = Math.ceil(files.length / cols), list = path.join(out, 'list.txt');
  fs.writeFileSync(list, files.map(f => `file '${f.replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n'));
  const sheet = path.join(proj, 'out', times.length > 4 && process.argv.length <= 3 ? '预览_场景总览.jpg' : '预览.jpg');
  spawnSync(ff, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-vf', `scale=270:480,tile=${cols}x${rows}:padding=6`, '-frames:v', '1', sheet]);
  console.log(`已出 ${files.length} 张测试图：${out}\n联系表：${sheet}\n时间点（原曲秒数）：${times.join(', ')}`);
})().catch(e => { console.error(e.message); process.exit(1); });
