#!/usr/bin/env node
/* 字幕重排：AI/人只写“每行字幕的文字”（subs.txt，一行一条，已校对错字、按语义断句），
 * 本脚本把它和逐字时间戳对齐，回填到 timeline.json 的 subs。文字可以和识别结果不完全一样（纠错、删语气词都行）。
 * subs.txt 行格式:  字幕文字 [| hl=关键词1,关键词2] [| emph]     以 # 开头为注释
 * 用法: node src/resub.js <项目目录>
 */
const fs = require('fs'), path = require('path');
const dir = path.resolve(process.argv[2] || '.'), J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const tr = J(path.join(dir, 'work/transcript.json')), cuts = J(path.join(dir, 'work/cuts.json')), tlFile = path.join(dir, 'timeline.json'), tl = J(tlFile);
const remap = t => { let acc = 0; for (const [s, e] of cuts.keep) { if (t <= s) return acc; if (t < e) return acc + (t - s); acc += e - s; } return acc; };
const inKeep = t => cuts.keep.some(([s, e]) => t >= s - 1e-3 && t <= e + 1e-3) && !(cuts.drops || []).some(([s, e]) => t >= s && t < e);
const clean = s => s.replace(/[，。！？、,.!?…：:；;“”"《》（）()\s]/g, '');
// 识别结果摊成逐字序列（词内时间线性插值）
const src = [];
for (const w of tr.words) { if (!inKeep((w.s + w.e) / 2)) continue; const cs = [...clean(w.w)]; cs.forEach((c, i) => src.push({ c, s: remap(w.s + (w.e - w.s) * i / cs.length), e: remap(w.s + (w.e - w.s) * (i + 1) / cs.length) })); }
const lines = fs.readFileSync(path.join(dir, 'subs.txt'), 'utf8').split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(l => {
  const [text, ...flags] = l.split('|').map(x => x.trim()); const o = { text };
  flags.forEach(f => { if (f === 'emph') o.emph = true; else if (f.startsWith('hl=')) o.hl = f.slice(3).split(',').map(x => x.trim()).filter(Boolean); });
  return o;
});
const dst = []; lines.forEach((l, li) => [...clean(l.text)].forEach(c => dst.push({ c, li })));
// 编辑距离对齐（字符级）
const n = src.length, m = dst.length, D = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
for (let i = 0; i <= n; i++) D[i][0] = i; for (let j = 0; j <= m; j++) D[0][j] = j;
for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) D[i][j] = Math.min(D[i - 1][j - 1] + (src[i - 1].c === dst[j - 1].c ? 0 : 1), D[i - 1][j] + 1, D[i][j - 1] + 1);
const at = new Array(m).fill(null); let i = n, j = m;
while (i > 0 && j > 0) {
  if (D[i][j] === D[i - 1][j - 1] + (src[i - 1].c === dst[j - 1].c ? 0 : 1)) { at[j - 1] = src[i - 1]; i--; j--; }
  else if (D[i][j] === D[i - 1][j] + 1) i--; else j--;
}
const subs = lines.map(l => ({ ...l, start: null, end: null }));
dst.forEach((d, k) => { const a = at[k]; if (!a) return; const s = subs[d.li]; if (s.start == null) s.start = a.s; s.end = a.e; });
subs.forEach((s, k) => { if (s.start == null) { s.start = k ? subs[k - 1].end : 0; s.end = s.start + .4; } });
subs.forEach((s, k) => { const nx = subs[k + 1]; s.end = +(nx ? (nx.start - s.end < .5 ? nx.start : s.end + .3) : Math.min(tl.meta.duration, s.end + .4)).toFixed(3); s.start = +s.start.toFixed(3); });
tl.subs = subs; fs.writeFileSync(tlFile, JSON.stringify(tl, null, 1));
console.log(`对齐 ${subs.length} 行字幕（识别 ${n} 字 / 目标 ${m} 字，差异 ${D[n][m]}）`);
subs.forEach(s => console.log(`  ${s.start.toFixed(2).padStart(6)} → ${s.end.toFixed(2).padStart(6)}  ${s.text}`));
