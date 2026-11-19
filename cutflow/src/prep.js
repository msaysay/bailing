#!/usr/bin/env node
/* 预处理：原片 → 去气口粗剪 + 调光 + 规格化（1080×1920@30）→ host.mp4；同时把逐字时间戳换算到剪后时间轴、
 * 断成字幕行，生成一份全口播的 timeline.json 草稿，交给 AI/人去排版式、配素材、加花字。
 * 用法: node src/prep.js <项目目录> [--raw raw/host.mp4] [--beauty 0.3] [--no-grade] [--gap 0.45] [--model small]
 * 项目目录约定: raw/ 原片与素材 · work/ 中间产物 · out/ 成片 · terms.json 专名表（可选） · drops.json 要删的时间段（可选）
 */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const args = process.argv.slice(2), dir = path.resolve(args[0] || '.');
const opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const ROOT = path.join(__dirname, '..'), work = path.join(dir, 'work');
fs.mkdirSync(work, { recursive: true });
const raw = path.resolve(dir, opt('raw', 'raw/host.mp4'));
const { python } = require('./util'), PY = python();
const run = (cmd, a) => execFileSync(cmd, a, { stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 1 << 28 });
const J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const termsFile = path.join(dir, 'terms.json'), terms = fs.existsSync(termsFile) ? J(termsFile) : {};

// 1) 转写（有缓存就跳过）
const trFile = path.join(work, 'transcript.json');
if (!fs.existsSync(trFile)) run(PY, [path.join(ROOT, 'py/transcribe.py'), raw, trFile, '--engine', opt('engine', 'auto'), '--model', opt('model', 'large-v3-turbo'), ...(fs.existsSync(termsFile) ? ['--terms', termsFile] : [])]);
const tr = J(trFile);

// 2) 调光参数
let vfGrade = '', rawFace = null;
{
  const gFile = path.join(work, 'grade.json');
  run(PY, [path.join(ROOT, 'py/grade.py'), raw, gFile, '--beauty', String(opt('beauty', 0)), '--preview', path.join(work, 'grade_preview.jpg')]);
  const g = J(gFile); rawFace = g.face; if (!opt('no-grade', false)) vfGrade = g.filter;
}
// 横屏或偏宽的原片：以人脸为中心裁 9:16（不是死裁正中）
const cropX = rawFace ? `'max(0,min(iw-ow,iw*${rawFace.cx.toFixed(4)}-ow/2))'` : '(iw-ow)/2';

// 3) 重录检测（一句话录多遍留最后一遍）。结果存 work/retakes.json，可手改后重跑；--retakes off 关闭
const rtFile = path.join(work, 'retakes.json');
let retakes = { auto: [], suspect: [] };
if (opt('retakes', 'auto') !== 'off') {
  if (!fs.existsSync(rtFile) || opt('redetect', false)) fs.writeFileSync(rtFile, JSON.stringify(require('./retakes').detect(tr.words), null, 1));
  retakes = J(rtFile);
}
// 4) 保留区间：扣掉重录和 drops.json 里手工标记的时间段，再把词间停顿超过 gap 的剪掉（两侧各留 pad）
const GAP = +opt('gap', 0.45), PAD = 0.12;
const dropsFile = path.join(dir, 'drops.json'), drops = (fs.existsSync(dropsFile) ? J(dropsFile) : []).concat(retakes.auto.map(r => r.range));
const dropped = w => drops.some(([s, e]) => w.s >= s - 1e-3 && w.s < e - 1e-3);
const words = tr.words.filter(w => !dropped(w));
let keep = [];
for (const w of words) {
  const last = keep[keep.length - 1];
  if (last && w.s - last[1] <= GAP && !drops.some(([s, e]) => s < w.s && e > last[1])) last[1] = w.e;
  else keep.push([w.s, w.e]);
}
keep = keep.map(([s, e]) => [Math.max(0, s - PAD), Math.min(tr.duration, e + PAD)]);
for (let i = 1; i < keep.length; i++) if (keep[i][0] < keep[i - 1][1]) { const m = (keep[i][0] + keep[i - 1][1]) / 2; keep[i][0] = m; keep[i - 1][1] = m; }
const FPS = 30, snap = t => Math.round(t * FPS) / FPS;
keep = keep.map(([s, e]) => [snap(s), snap(e)]).filter(([s, e]) => e - s > 0.1);
const remap = t => { let acc = 0; for (const [s, e] of keep) { if (t <= s) return acc; if (t < e) return acc + (t - s); acc += e - s; } return acc; };
const total = keep.reduce((n, [s, e]) => n + e - s, 0);

// 4) 出 host.mp4（剪 + 调光 + 规格化）
const sel = keep.map(([s, e]) => `between(t,${s.toFixed(3)},${e.toFixed(3)})`).join('+');
const hostFile = path.join(work, 'host.mp4');
const vf = [`fps=${FPS}`, `select='${sel}'`, 'setpts=N/FRAME_RATE/TB', vfGrade, 'scale=1080:1920:force_original_aspect_ratio=increase:flags=lanczos', `crop=1080:1920:${cropX}:0`, 'format=yuv420p'].filter(Boolean).join(',');
const af = `aselect='${sel}',asetpts=N/SR/TB,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000`;
run('ffmpeg', ['-v', 'error', '-y', '-i', raw, '-vf', vf, '-af', af, '-c:v', 'libx264', '-crf', '16', '-preset', 'fast', '-g', '15', '-c:a', 'aac', '-b:a', '192k', hostFile]);

// 5) 人脸位置（在 host.mp4 坐标系里）
const faceFile = path.join(work, 'face.json');
run(PY, [path.join(ROOT, 'py/grade.py'), hostFile, faceFile]);
const face = J(faceFile).face || { cx: .5, cy: .36, w: .34, h: .2 };

// 6) 字幕断行：≤ MAXC 字一行，遇停顿/标点断
const MAXC = +opt('maxc', 13), fix = s => Object.entries(terms.corrections || {}).reduce((x, [a, b]) => x.split(a).join(b), s);
const clean = s => s.replace(/[，。！？、,.!?…：:；;“”"《》（）()\s]/g, '');
const subs = []; let cur = null;
const toks = words.map(w => ({ txt: clean(w.w), brk: /[，。！？,.!?；;]$/.test(w.w.trim()), s: remap(w.s), e: remap(w.e) })).filter(x => x.txt);
toks.forEach((w, i) => {
  if (!cur) cur = { start: w.s, end: w.e, text: '' };
  cur.text += w.txt; cur.end = w.e;
  const nx = toks[i + 1], len = [...cur.text].length, gap = nx ? nx.s - w.e : 9;
  // 断行优先级：标点/明显停顿 > 够长时的小气口 > 字数到顶
  if (!nx || w.brk && len >= 4 || gap > 0.3 || (len >= 6 && gap >= 0.12) || len + [...nx.txt].length > MAXC) { subs.push(cur); cur = null; }
});
if (cur) subs.push(cur);
subs.forEach((s, i) => { const nx = subs[i + 1]; s.end = nx ? Math.min(nx.start, s.end + 0.35) : Math.min(total, s.end + 0.35); s.start = +s.start.toFixed(3); s.end = +s.end.toFixed(3); s.text = fix(s.text); delete s.brk; });

// 7) timeline 草稿
const tlFile = path.join(dir, 'timeline.json');
// 剪口（剪后时间轴）：人在这些时刻会“跳”一下，必须盖住。草稿先在每个剪口硬切景别（1.0 ↔ 1.12）
const cutTimes = []; { let acc = 0; keep.slice(0, -1).forEach(([s, e]) => { acc += e - s; cutTimes.push(+acc.toFixed(3)); }); }
const bounds = [0, ...cutTimes.filter((c, i, a) => c > 0.5 && c < total - 0.5 && (i === 0 || c - a[i - 1] > 0.5)), +total.toFixed(3)];
const scenes = bounds.slice(0, -1).map((b, i) => ({ start: b, end: bounds[i + 1], layout: 'talk', zoom: i % 2 ? 1.12 : 1 }));
const tl = { meta: { fps: FPS, width: 1080, height: 1920, duration: +total.toFixed(3), cuts: cutTimes }, host: { src: 'work/host.mp4', face },
  audio: { sfx: true }, scenes, overlays: [], subs };
if (fs.existsSync(tlFile) && !opt('force', false)) {   // 已排过的时间线不覆盖，只刷新主讲人信息；新草稿另存
  const old = J(tlFile); old.host = tl.host; old.meta.cuts = cutTimes; fs.writeFileSync(tlFile, JSON.stringify(old, null, 1));
  fs.writeFileSync(path.join(work, 'timeline.draft.json'), JSON.stringify(tl, null, 1)); console.log('已有 timeline.json：仅更新 host，草稿写到 work/timeline.draft.json（--force 可整体覆盖）');
} else fs.writeFileSync(tlFile, JSON.stringify(tl, null, 1));
fs.writeFileSync(path.join(work, 'cuts.json'), JSON.stringify({ keep, drops, cuts: cutTimes, removed: +(tr.duration - total).toFixed(2) }));
if (retakes.auto.length || retakes.suspect.length) {
  console.log(`重录检测: 自动删 ${retakes.auto.length} 处，待复核 ${retakes.suspect.length} 处（work/retakes.json）`);
  retakes.auto.forEach(r => console.log(`  ✂ ${r.range[0]}–${r.range[1]}s 删「${r.dropped}」 留「${r.kept}」`));
  retakes.suspect.forEach(r => console.log(`  ? ${r.range[0]}–${r.range[1]}s 疑似「${r.dropped}」≈「${r.kept}」(${r.score})`));
}
console.log(`粗剪: ${tr.duration.toFixed(1)}s → ${total.toFixed(1)}s（去掉 ${(tr.duration - total).toFixed(1)}s 气口/重录，${keep.length} 段）· 字幕 ${subs.length} 行`);
