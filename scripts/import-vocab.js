'use strict';
// L0 冷启动词库导入：从 Obsidian 知识库 / 文本资产里挖专有名词，灌入 terms.learned.json。
// 这是「越用越懂我」的第一铲——开机第一天术语表就有上千词，不用手动一个个加。
//
// 用法:
//   node scripts/import-vocab.js "D:/path/to/ObsidianVault"  [更多目录...]
//
// 策略（MVP 版，规则抽取；后续可用 MiMo 做实体识别提纯）:
//   - 扫描 .md 文本
//   - 抽取：[[双链]]、#标签、`代码内联`、中英混排专名、连续大写英文词
//   - 去重、按出现频次排序，取高频词作为 hotwords 写入学习表
const fs = require('fs');
const path = require('path');

function walk(dir, acc = []) {
  let entries = [];
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return acc; }
  for (const e of entries) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, acc);
    else if (/\.(md|markdown|txt)$/i.test(e.name)) acc.push(full);
  }
  return acc;
}

function extractTerms(text, freq) {
  const bump = (w) => {
    w = w.trim();
    if (w.length < 2 || w.length > 20) return;
    freq.set(w, (freq.get(w) || 0) + 1);
  };
  // [[双链]]
  for (const m of text.matchAll(/\[\[([^\]|#]+)/g)) bump(m[1]);
  // #标签
  for (const m of text.matchAll(/(?:^|\s)#([一-龥A-Za-z0-9_\-]{2,})/g)) bump(m[1]);
  // `内联代码` 里的专名/命令
  for (const m of text.matchAll(/`([A-Za-z][A-Za-z0-9_.\-]{1,20})`/g)) bump(m[1]);
  // 连续大写/驼峰英文专名：Obsidian, GitHub, API, useState
  for (const m of text.matchAll(/\b([A-Z][A-Za-z0-9]{2,20})\b/g)) bump(m[1]);
}

function main() {
  const dirs = process.argv.slice(2);
  if (!dirs.length) {
    console.error('用法: node scripts/import-vocab.js <目录1> [目录2 ...]');
    process.exit(1);
  }
  const freq = new Map();
  let files = 0;
  for (const d of dirs) {
    for (const f of walk(d)) {
      files++;
      try { extractTerms(fs.readFileSync(f, 'utf8'), freq); } catch (_) {}
    }
  }
  // 取出现 >=3 次的词，按频次排序
  const words = [...freq.entries()]
    .filter(([, c]) => c >= 3)
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)
    .slice(0, 2000);

  const dataDir = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const learnedPath = path.join(dataDir, 'terms.learned.json');
  let learned = { corrections: {}, hotwords: [] };
  try { learned = JSON.parse(fs.readFileSync(learnedPath, 'utf8')); } catch (_) {}
  learned.hotwords = [...new Set([...(learned.hotwords || []), ...words])];
  fs.writeFileSync(learnedPath, JSON.stringify(learned, null, 2), 'utf8');

  console.log(`扫描 ${files} 个文件，抽取到 ${words.length} 个高频专名，已写入 data/terms.learned.json`);
  console.log('样例:', words.slice(0, 30).join('、'));
}

main();
