#!/usr/bin/env node
/* 出片前自查：按 docs/STYLE_SPEC.md 的硬指标给 timeline 打分，并把成片抽成联系表（每 2 秒一格）供逐格检查。
 * 用法: node src/check.js <项目目录> [--video out/preview.mp4]
 * “必须改”有一条就返回非零；“建议”不拦。联系表写到 out/联系表-N.jpg。 */
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const args = process.argv.slice(2), dir = path.resolve(args[0] || '.'), opt = (k, d) => { const i = args.indexOf('--' + k); return i < 0 ? d : args[i + 1]; };
const tl = JSON.parse(fs.readFileSync(path.join(dir, 'timeline.json'), 'utf8')), D = tl.meta.duration, must = [], should = [];
const len = s => s.end - s.start, sc = tl.scenes, ov = tl.overlays || [], subs = tl.subs || [];
const talk = sc.filter(s => s.layout === 'talk').reduce((n, s) => n + len(s), 0) / D;
// 连续口播全屏（中间只换景别不算换版式）
let run = 0, runStart = 0; sc.forEach((s, i) => { if (s.layout === 'talk') { if (!run) runStart = s.start; run += len(s); if (run > 20 && (i === sc.length - 1 || sc[i + 1].layout !== 'talk')) should.push(`${runStart.toFixed(1)}s 起连续口播全屏 ${run.toFixed(0)} 秒（>20）：中间插一段素材或数据面板`); } else run = 0; });
if (D > 20 && talk > 0.62) should.push(`口播全屏占 ${(talk * 100).toFixed(0)}%（参考成片 45–55%）：多给“看得见的东西”配素材`);
if (D > 20 && talk < 0.35) should.push(`口播全屏只占 ${(talk * 100).toFixed(0)}%：这个号靠人立住，观点句回到口播全屏`);
const firstChange = sc.find((s, i) => i > 0); if (D > 10 && (!firstChange || firstChange.start > 3.5)) must.push('开场 3 秒内没有切画面：把第一句之后切到素材或换景别');
sc.forEach((s, i) => { if (s.layout !== 'talk' && s.layout !== 'data' && len(s) > 4.5) should.push(`场景${i}（${s.layout}）一个画面停了 ${len(s).toFixed(1)} 秒（>4）：拆成两个场景换素材`); if (len(s) < 0.6) must.push(`场景${i} 只有 ${len(s).toFixed(2)} 秒，会闪`); });
const used = {}; sc.forEach((s, i) => { if (s.media) { const k = s.media.src + '@' + (s.media.in || 0); if (used[k] != null) should.push(`场景${i} 和场景${used[k]} 用了同一段素材的同一位置：换一段或改 in`); used[k] = i; } });
subs.forEach((s, i) => { const n = [...s.text].length; if (n > 13) should.push(`字幕${i}「${s.text}」${n} 字（>13）`); if (s.end - s.start < 0.35) should.push(`字幕${i}「${s.text}」只停 ${(s.end - s.start).toFixed(2)} 秒`); });
const hl = subs.filter(s => s.hl && s.hl.length).length; if (subs.length > 10 && hl < subs.length / 6) should.push(`只有 ${hl}/${subs.length} 行字幕标了重点词：每 3–5 行标一个（数字、专名、反常识的词）`);
const kw = ov.filter(o => o.type === 'keyword' || o.type === 'list' || o.type === 'label'); if (D > 40 && kw.length < D / 40) should.push(`全片只有 ${kw.length} 个花字（约每 20–40 秒一个）`);
ov.filter(o => o.type === 'keyword').forEach(o => { if ([...o.text].length > 8) should.push(`关键词「${o.text}」超过 8 字`); if (len(o) < 1.2) should.push(`关键词「${o.text}」只停 ${len(o).toFixed(1)} 秒，看不清`); });
for (let i = 0; i < ov.length; i++) for (let j = i + 1; j < ov.length; j++) { const a = ov[i], b = ov[j]; if (['keyword', 'list', 'punch'].includes(a.type) && ['keyword', 'list', 'punch'].includes(b.type) && a.start < b.end && b.start < a.end) must.push(`贴片${i}(${a.type}) 和贴片${j}(${b.type}) 时间重叠，会叠字`); }
const pu = ov.filter(o => o.type === 'punch'); if (pu.length > 1) should.push('结尾金句（punch）全片只用一次');
pu.forEach(o => { if (subs.some(s => !s.hide && s.start < o.end && s.end > o.start + 0.2)) must.push(`金句出现时（${o.start}s）对应字幕要设 hide: true，否则字叠字`); });
if (D > 60 && !ov.some(o => o.type === 'chapter')) should.push('一分钟以上的片子建议给大段落加章节角标（chapter）');
if (!(tl.audio && tl.audio.bgm)) should.push('没有 BGM：成片都有底乐，放一首到 raw/ 并在 audio.bgm 里写上（确认可商用）');
console.log(`时长 ${D.toFixed(1)}s · ${sc.length} 个场景（平均 ${(D / sc.length).toFixed(1)}s 一换）· 口播全屏 ${(talk * 100).toFixed(0)}% · 字幕 ${subs.length} 行 · 花字 ${kw.length} 个 · 剪口 ${(tl.meta.cuts || []).length} 个`);
must.forEach(m => console.log('  ✗ 必须改: ' + m)); should.forEach(m => console.log('  · 建议: ' + m)); if (!must.length && !should.length) console.log('  ✓ 硬指标全部通过');
// 联系表
const video = path.resolve(dir, opt('video', fs.existsSync(path.join(dir, 'out/final.mp4')) ? 'out/final.mp4' : 'out/preview.mp4'));
if (fs.existsSync(video)) {
  const per = 40, n = Math.ceil(D / 2 / per);
  for (let i = 0; i < n; i++) execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(i * per * 2), '-t', String(per * 2), '-i', video, '-vf', 'fps=1/2,scale=216:-1,tile=10x4', '-frames:v', '1', '-q:v', '3', path.join(dir, `out/联系表-${i + 1}.jpg`)]);
  console.log(`联系表 ${n} 张 → out/联系表-*.jpg（每格 2 秒，逐格看：字压脸没有、头像切到没有、素材对不对题）`);
}
process.exit(must.length ? 1 : 0);
