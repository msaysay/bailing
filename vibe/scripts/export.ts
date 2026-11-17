// 导出时间轴（给配乐脚本）+ 全部用字（给字体子集）+ 字幕检查。用法：node scripts/export.ts
import { writeFileSync } from 'node:fs';
import { EPISODES } from '../src/episodes/all.ts';
import { layout, plain } from '../src/timeline.ts';

const out: Record<string, unknown> = {};
const chars = new Set<string>();
const problems: string[] = [];
for (const ep of EPISODES) {
  const tl = layout(ep);
  out[ep.id] = { total: tl.total, mood: ep.mood ?? ep.no, scenes: tl.scenes.map((s) => s.start), beats: tl.beats.map((b) => [b.start, b.end, b.big]) };
  const add = (s: string) => { for (const ch of s) chars.add(ch); };
  add(JSON.stringify(ep));
  for (const b of ep.beats) {
    const z = plain(b.zh).replace(/\s/g, '');
    if (z.length > 20) problems.push(`${ep.id} 字幕超 20 字（${z.length}）：${b.zh}`);
    if (/[，。！？、：；“”‘’…（）《》,.!?:;]/.test(plain(b.zh))) problems.push(`${ep.id} 字幕带标点：${b.zh}`);
  }
  if (tl.total > 100 || tl.total < 45) problems.push(`${ep.id} 时长 ${tl.total.toFixed(1)}s 超出 45–100`);
  console.log(`${ep.id} ${ep.title.padEnd(12, '　')} ${tl.total.toFixed(1)}s  ${ep.beats.length} 拍  ${tl.scenes.length} 场`);
}
add2('宁少AI进化论关注下一期知识大赏内容创作认知篇流程篇数据篇方法篇红线篇0123456789No.·—-AIvs你%');
function add2(s: string) { for (const ch of s) chars.add(ch); }
for (let i = 32; i < 127; i++) chars.add(String.fromCharCode(i));
writeFileSync('build/timeline.json', JSON.stringify(out));
writeFileSync('build/chars.txt', [...chars].join(''));
if (problems.length) { console.log('\n问题：\n' + problems.join('\n')); process.exitCode = 1; }
