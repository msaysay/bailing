#!/usr/bin/env node
/* 合成：timeline.json → 成片。逐场景渲染（可并行、可只重渲改过的场景），最后无损拼接并混音。
 * 每个场景：Playwright 逐帧画花字/背景层（带透明开窗的 PNG 流）→ 管道喂给 ffmpeg，叠在主讲人/素材之上。
 * 用法: node src/render.js <项目目录> [--preview] [--only 2,3] [--jobs 3] [--still 12.5] [--out out/final.mp4]
 */
const fs = require('fs'), path = require('path'), { spawn, execFileSync } = require('child_process');
const Stage = require('./stage/stage.js');
const args = process.argv.slice(2), dir = path.resolve(args[0] || '.');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const playwright = (() => { try { return require('playwright'); } catch (_) { return require('/opt/node-tools/node_modules/playwright'); } })();

const tl = JSON.parse(fs.readFileSync(path.join(dir, opt('timeline', 'timeline.json')), 'utf8'));
const preview = !!opt('preview', false);
const FPS = preview ? 15 : (tl.meta.fps || 30), OW = preview ? 540 : (tl.meta.width || 1080), OH = Math.round(OW * 16 / 9 / 2) * 2, K = OW / Stage.W;
const ev = n => Math.round(n * K / 2) * 2;                       // 设计稿坐标 → 输出像素（偶数）
const P = p => path.resolve(dir, p);
const probe = f => { const s = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height,nb_frames,codec_name:format=duration', '-of', 'json', f])); return { w: s.streams[0].width, h: s.streams[0].height, dur: +s.format.duration }; };
const isImage = f => /\.(png|jpe?g|webp)$/i.test(f);

// ---------- 校验（timeline 多半是 AI 写的，先把低级错拦住） ----------
function validate() {
  const errs = [], D = tl.meta.duration;
  tl.scenes.forEach((s, i) => {
    if (!Stage.LAYOUTS[s.layout]) errs.push(`场景${i}: 未知版式 ${s.layout}`);
    if (i === 0 && Math.abs(s.start) > 1e-3) errs.push('第一个场景必须从 0 开始');
    if (i > 0 && Math.abs(s.start - tl.scenes[i - 1].end) > 1e-3) errs.push(`场景${i}: 与上一场景不首尾相接 (${tl.scenes[i - 1].end} → ${s.start})`);
    if (s.end <= s.start) errs.push(`场景${i}: 时长非正`);
    const L = Stage.LAYOUTS[s.layout] || {};
    if (L.media && !s.media) errs.push(`场景${i}: 版式 ${s.layout} 需要 media`);
    if (s.media && !fs.existsSync(P(s.media.src))) errs.push(`场景${i}: 素材不存在 ${s.media.src}`);
    if (s.layout === 'data' && (!s.panel || !Stage.panelTypes.includes(s.panel.type))) errs.push(`场景${i}: data 版式需要 panel（${Stage.panelTypes.join('/')}）`);
  });
  if (Math.abs(tl.scenes[tl.scenes.length - 1].end - D) > 0.05) errs.push(`最后一个场景应结束于 meta.duration=${D}`);
  (tl.overlays || []).forEach((o, i) => { if (!Stage.overlayTypes.includes(o.type)) errs.push(`贴片${i}: 未知类型 ${o.type}`); if (!(o.end > o.start)) errs.push(`贴片${i}: 时间非法`); });
  (tl.subs || []).forEach((s, i) => { if ([...s.text].length > 16) errs.push(`字幕${i}: 超过16字「${s.text}」`); });
  if (errs.length) { console.error('timeline 校验未通过:\n  ' + errs.join('\n  ')); process.exit(2); }
}

// ---------- 主讲人取景：按人脸位置算裁切框（host.mp4 像素） ----------
function hostCrop(scene, target, HW, HH) {
  const f = tl.host.face, a = target.w / target.h, z = scene.zoom || 1;
  let cw, ch, cx = f.cx * HW, cy;
  if (scene.layout === 'talk') { cw = HW / z; ch = HH / z; cy = HH / 2 + (f.cy * HH - HH / 2) * (1 - 1 / z) * 1.0; cx = HW / 2 + (f.cx * HW - HW / 2) * (1 - 1 / z); }
  else if (Math.abs(a - 1) < .05) { cw = ch = Math.min(HW, f.w * HW * (scene.hostTight || 2.5)); cy = f.cy * HH + ch * .08; }
  else { cw = Math.min(HW, f.w * HW * 3.2); ch = cw / a; cy = f.cy * HH + ch * .10; }
  const x = Math.min(HW - cw, Math.max(0, cx - cw / 2)), y = Math.min(HH - ch, Math.max(0, cy - ch / 2));
  return { w: Math.floor(cw / 2) * 2, h: Math.floor(ch / 2) * 2, x: Math.floor(x), y: Math.floor(y) };
}

// ---------- 单场景 ----------
async function renderScene(browser, scene, idx, outFile, host, stillAt) {
  const off = stillAt != null ? stillAt - scene.start : 0;   // 静帧模式：只出场景内 off 秒处的一帧
  const dur = scene.end - scene.start, n = stillAt != null ? 1 : Math.round(dur * FPS), rects = Stage.rectsOf(scene);
  const hr = scene.layout === 'talk' ? { x: 0, y: 0, w: Stage.W, h: Stage.H } : rects.host;
  const inputs = ['-ss', (scene.start + off).toFixed(3), '-t', dur.toFixed(3), '-i', P(tl.host.src)];
  const c = hostCrop(scene, hr, host.w, host.h);
  let fc = `color=c=black:s=${OW}x${OH}:r=${FPS}:d=${dur.toFixed(3)}[bg];`;
  // 口播全屏可加缓推（push: 0.04 = 全程推近 4%）
  const push = scene.layout === 'talk' && scene.push ? `,scale=w='${ev(hr.w)}*(1+${scene.push}*(t+${off.toFixed(3)})/${dur.toFixed(3)})':h=-2:eval=frame:flags=bicubic,crop=${ev(hr.w)}:${ev(hr.h)}` : '';
  fc += `[0:v]fps=${FPS},crop=${c.w}:${c.h}:${c.x}:${c.y},scale=${ev(hr.w)}:${ev(hr.h)}:flags=lanczos${push},setsar=1[h];[bg][h]overlay=${ev(hr.x)}:${ev(hr.y)}:shortest=0[b1];`;
  let last = 'b1', ni = 1;
  if (scene.media && rects.media) {
    const m = scene.media, r = rects.media, src = P(m.src), mw = ev(r.w), mh = ev(r.h);
    if (isImage(src)) inputs.push('-loop', '1', '-t', dur.toFixed(3), '-i', src); else inputs.push('-ss', String((m.in || 0) + off), '-i', src);
    const kb = m.zoom != null ? m.zoom : (isImage(src) ? .07 : .03);   // 素材统一带一点缓推，画面不“死”
    fc += `[${ni}:v]fps=${FPS},scale=${mw * 2}:${mh * 2}:force_original_aspect_ratio=increase:flags=bicubic,crop=${mw * 2}:${mh * 2},` +
      `scale=w='${mw}*(1+${kb}*(t+${off.toFixed(3)})/${dur.toFixed(3)})':h=-2:eval=frame:flags=bicubic,crop=${mw}:${mh},setsar=1,tpad=stop_mode=clone:stop_duration=${Math.ceil(dur)}[m];[${last}][m]overlay=${ev(r.x)}:${ev(r.y)}:shortest=0[b2];`;
    last = 'b2'; ni++;
  }
  inputs.push('-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', 'pipe:0');
  fc += `[${last}][${ni}:v]overlay=0:0:format=auto,format=yuv420p[out]`;
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', fc, '-map', '[out]', '-frames:v', String(n),
    ...(stillAt != null ? [] : ['-r', String(FPS), '-c:v', 'libx264', '-crf', preview ? '24' : '17', '-preset', preview ? 'veryfast' : 'medium', '-pix_fmt', 'yuv420p', '-video_track_timescale', '15360']), outFile], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((res, rej) => ff.on('close', code => code ? rej(new Error(`ffmpeg 场景${idx} 退出码 ${code}`)) : res()));
  ff.stdin.on('error', () => {});
  const page = await newPage(browser);
  for (let i = 0; i < n; i++) {
    await page.evaluate(t => Stage.draw(t), scene.start + off + i / FPS);
    const buf = await page.screenshot({ type: 'png', omitBackground: true });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
  }
  ff.stdin.end(); await page.close(); await done;
}

async function newPage(browser) {
  const page = await browser.newPage({ viewport: { width: Stage.W, height: Stage.H }, deviceScaleFactor: K });
  page.on('pageerror', e => { console.error('舞台报错:', e.message); process.exit(3); });
  await page.goto('file://' + path.join(__dirname, 'stage/stage.html'));
  await page.evaluate(async tl => { Stage.load(tl); await Promise.all(['SubTalk', 'SubCard', 'Num', 'Brush'].map(f => document.fonts.load(`40px "${f}"`, '字A1'))); await document.fonts.ready; }, tl);
  return page;
}

(async () => {
  validate();
  const host = probe(P(tl.host.src));
  const browser = await playwright.chromium.launch();
  // --still：只出某一时刻的合成静帧（排版自检用，秒出）
  if (opt('still', false) !== false) {
    const t = +opt('still'), idx = tl.scenes.findIndex(s => t >= s.start && t < s.end), out = P(opt('out', `work/still_${t}.png`));
    await renderScene(browser, tl.scenes[idx], idx, out, host, t);
    await browser.close(); console.log(out); return;
  }
  const segDir = P(preview ? 'work/seg_preview' : 'work/seg'); fs.mkdirSync(segDir, { recursive: true });
  const only = opt('only', false) ? String(opt('only')).split(',').map(Number) : null;
  // 场景指纹：没改过的场景直接复用上次的分段
  const crypto = require('crypto');
  const fp = (s, i) => crypto.createHash('md5').update(JSON.stringify([s, tl.scenes[i - 1] && tl.scenes[i - 1].layout, tl.host, (tl.subs || []).filter(x => x.end > s.start && x.start < s.end), (tl.overlays || []).filter(x => x.end > s.start && x.start < s.end), fs.readFileSync(path.join(__dirname, 'stage/stage.js')), fs.readFileSync(path.join(__dirname, 'stage/stage.css')), FPS, OW])).digest('hex').slice(0, 12);
  const jobs = tl.scenes.map((s, i) => ({ s, i, file: path.join(segDir, `s${String(i).padStart(3, '0')}_${fp(s, i)}.mp4`) }));
  const todo = jobs.filter(j => (only ? only.includes(j.i) : true) && !fs.existsSync(j.file));
  console.log(`共 ${jobs.length} 个场景，需渲染 ${todo.length} 个（${OW}×${OH}@${FPS}${preview ? ' 预览档' : ''}）`);
  const N = +opt('jobs', 3); let k = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: Math.min(N, todo.length) }, async () => {
    while (k < todo.length) { const j = todo[k++]; const tmp = j.file + '.part.mp4'; await renderScene(browser, j.s, j.i, tmp, host); fs.renameSync(tmp, j.file); console.log(`  ✓ 场景${j.i} ${j.s.layout} ${(j.s.end - j.s.start).toFixed(1)}s`); }
  }));
  await browser.close();
  if (only) { console.log('仅渲染指定场景，未拼接'); return; }
  // 拼接 + 音频（主讲人声 + 可选 BGM 自动压低）
  const list = path.join(segDir, 'list.txt'); fs.writeFileSync(list, jobs.map(j => `file '${j.file}'`).join('\n'));
  const out = P(opt('out', preview ? 'out/preview.mp4' : 'out/final.mp4')); fs.mkdirSync(path.dirname(out), { recursive: true });
  const a = ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', list, '-i', P(tl.host.src)];
  if (tl.audio && tl.audio.bgm) {
    a.push('-stream_loop', '-1', '-i', P(tl.audio.bgm), '-filter_complex', `[2:a]volume=${tl.audio.bgmVolume || 0.12}[b];[1:a][b]amix=inputs=2:duration=first:normalize=0[a]`, '-map', '0:v', '-map', '[a]');
  } else a.push('-map', '0:v', '-map', '1:a');
  a.push('-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k', '-t', String(tl.meta.duration), '-movflags', '+faststart', out);
  execFileSync('ffmpeg', a, { stdio: 'inherit' });
  // 用过的旧分段清掉
  const keepSet = new Set(jobs.map(j => path.basename(j.file))); fs.readdirSync(segDir).forEach(f => { if (f.endsWith('.mp4') && !keepSet.has(f)) fs.unlinkSync(path.join(segDir, f)); });
  console.log(`完成 ${out} · 用时 ${((Date.now() - t0) / 1000).toFixed(0)}s`);
})().catch(e => { console.error(e); process.exit(1); });
