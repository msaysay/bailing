// 渲染出片：
//   node tools/render.js projects/我的歌            正式版 1080×1920 30 帧 → out/MV.mp4
//   node tools/render.js projects/我的歌 --draft    草稿版 540×960 15 帧，快 4 倍，先看整体节奏 → out/MV_草稿.mp4
//   node tools/render.js projects/我的歌 --from 60 --to 80   只渲一段（原曲秒数），改完某段时用 → out/片段_60-80.mp4
//   --jobs 4   同时开几路（默认按 CPU 核数，最多 6）
const fs = require('fs'), path = require('path'), os = require('os'), { spawn, spawnSync } = require('child_process');
const { launch, openProject, ffmpegPath, projectArg } = require('./browser');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
(async () => {
  const proj = projectArg(), draft = process.argv.includes('--draft'), fps = draft ? 15 : 30, ff = ffmpegPath();
  const jobs = +arg('--jobs', Math.max(1, Math.min(6, os.cpus().length))), tmp = path.join(proj, 'out', 'tmp'); fs.mkdirSync(tmp, { recursive: true });
  const b = await launch(); const p0 = await openProject(b, proj, fps); const info = await p0.evaluate(() => window.info());
  const cfg = await p0.evaluate(() => ({ song: CONFIG.song || 'song.mp3' }));
  const s0 = Math.max(info.start, +arg('--from', info.start)), s1 = Math.min(info.end, +arg('--to', info.end));
  const f0 = Math.round((s0 - info.start) * fps), f1 = Math.round((s1 - info.start) * fps), N = f1 - f0, per = Math.ceil(N / jobs);
  console.log(`共 ${N} 帧（${(s1 - s0).toFixed(1)} 秒，${fps} 帧/秒），分 ${jobs} 路渲染${draft ? '（草稿）' : ''}……`);
  const t0 = Date.now(); let done = 0; const tick = setInterval(() => { const el = (Date.now() - t0) / 1000, sp = done / el; process.stdout.write(`\r  ${done}/${N} 帧  已用 ${Math.round(el)} 秒  预计还要 ${sp > 0 ? Math.round((N - done) / sp) : '?'} 秒   `); }, 3000);
  const parts = [];
  await Promise.all([...Array(jobs).keys()].map(async j => {
    const a = f0 + j * per, z = Math.min(f1, a + per); if (a >= z) return; const part = path.join(tmp, `part${j}.mp4`); parts[j] = part;
    const p = j === 0 ? p0 : await openProject(b, proj, fps);
    const vf = draft ? ['-vf', 'scale=540:960'] : [];
    const enc = spawn(ff, ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-', ...vf, '-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'medium', '-crf', draft ? '24' : '17', '-pix_fmt', 'yuv420p', part], { stdio: ['pipe', 'inherit', 'inherit'] });
    for (let i = a; i < z; i++) { const d = await p.evaluate(([fi, q]) => window.grab(fi, q), [i, draft ? .82 : .95]); if (!enc.stdin.write(Buffer.from(d.slice(23), 'base64'))) await new Promise(r => enc.stdin.once('drain', r)); done++; }
    enc.stdin.end(); await new Promise(r => enc.on('close', r));
    if (p._errs.length) console.log('\n页面报错（第 ' + (j + 1) + ' 路）：' + p._errs.slice(0, 3).join(' | '));
  }));
  clearInterval(tick); await b.close();
  const list = path.join(tmp, 'list.txt'); fs.writeFileSync(list, parts.filter(Boolean).map(f => `file '${f.replace(/\\/g, '/')}'`).join('\n'));
  const whole = s0 === info.start && s1 === info.end, name = whole ? (draft ? 'MV_草稿.mp4' : 'MV.mp4') : `片段_${s0}-${s1}${draft ? '_草稿' : ''}.mp4`, out = path.join(proj, 'out', name);
  const song = path.join(proj, cfg.song), hasSong = fs.existsSync(song), dur = s1 - s0;
  const audio = hasSong ? ['-ss', String(s0), '-i', song] : [];
  const af = hasSong ? ['-af', whole ? `afade=t=in:st=0:d=0.5,afade=t=out:st=${Math.max(0, dur - 3).toFixed(2)}:d=3` : 'anull', '-c:a', 'aac', '-b:a', '256k', '-map', '0:v', '-map', '1:a', '-shortest'] : [];
  const r = spawnSync(ff, ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, ...audio, ...af, '-c:v', 'libx264', '-preset', draft ? 'veryfast' : 'medium', '-crf', draft ? '24' : '20', '-maxrate', '9M', '-bufsize', '18M', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status !== 0) { console.log('\n合成失败，分段文件在 ' + tmp); process.exit(1); }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n完成：${out}（用时 ${Math.round((Date.now() - t0) / 1000)} 秒）${hasSong ? '' : '\n注意：项目里没找到歌（' + cfg.song + '），视频没有声音。'}`);
})().catch(e => { console.error('\n' + e.message); process.exit(1); });
