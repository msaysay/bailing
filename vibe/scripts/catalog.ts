// 生成片单 CATALOG.md：学员问到什么，查这张表发对应那条。用法：node scripts/catalog.ts
import { writeFileSync } from 'node:fs';
import { EPISODES } from '../src/episodes/all.ts';
import { layout, plain } from '../src/timeline.ts';
let md = '# AI内容创作知识大赏 · 片单\n\n学员问到什么，就发对应那一条。每条 60–80 秒，无配音，中英双语字幕。\n\n';
let g = '';
for (const ep of EPISODES) {
  if (ep.group !== g) { g = ep.group; md += `\n## ${g}\n\n| 期 | 片名 | 开头一句 | 结尾金句 | 时长 |\n|---|---|---|---|---|\n`; }
  const q = ep.beats.find((b) => b.s && b.s.k === 'quote')!.s as { lines: string[] };
  md += `| ${ep.no} | ${ep.title} | ${plain(ep.beats[0].zh)} | ${q.lines.map(plain).join(' ')} | ${Math.round(layout(ep).total)}s |\n`;
}
writeFileSync('CATALOG.md', md);
console.log('CATALOG.md');
