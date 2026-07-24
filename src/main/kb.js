'use strict';
// 知识库 RAG：本地 TF-IDF 检索 Obsidian 笔记（中文 2-gram + 英文词），零嵌入依赖、离线、快。
// 用途：口述时检索你知识库里的相关背景，喂给润色 LLM，让它把领域/人名/产品名/黑话写对。
const fs = require('fs');
const path = require('path');
const config = require('./config');

let CHUNKS = null; // [{file,title,text,tf:Map}]
let DF = null;     // Map token -> 含该 token 的块数
let stats = { files: 0, chunks: 0, builtAt: 0, vault: '', ms: 0 };

function tokenize(s) {
  const tokens = [];
  const en = (s.toLowerCase().match(/[a-z][a-z0-9+.#]{1,}/g)) || [];
  for (const w of en) tokens.push(w);
  const han = s.match(/[一-鿿]+/g) || [];
  for (const seg of han) {
    if (seg.length === 1) { tokens.push(seg); continue; }
    for (let i = 0; i < seg.length - 1; i++) tokens.push(seg.slice(i, i + 2)); // 2-gram
  }
  return tokens;
}

function stripMd(t) {
  return t
    .replace(/^---[\s\S]*?---/, ' ')                     // frontmatter
    .replace(/```[\s\S]*?```/g, ' ')                     // 代码块
    .replace(/!\[\[.*?\]\]/g, ' ')                       // 附件嵌入
    .replace(/\[\[([^\]|]*\|)?([^\]]*)\]\]/g, '$2')      // wikilink 取显示名
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')             // md 链接取文字
    .replace(/[#>*`_~]+/g, ' ');
}

function walk(dir, acc, exclude) {
  let ents;
  try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return acc; }
  for (const e of ents) {
    if (e.name.startsWith('.')) continue;               // .obsidian/.trash
    if (exclude.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc, exclude);
    else if (e.name.endsWith('.md') || e.name.endsWith('.txt') || e.name.endsWith('.markdown')) acc.push(p);
  }
  return acc;
}

function build() {
  const t0 = Date.now();
  const vault = config.kb.vaultPath;
  CHUNKS = []; DF = new Map();
  stats = { files: 0, chunks: 0, builtAt: Date.now(), vault, ms: 0 };
  if (!vault || !fs.existsSync(vault)) { stats.ms = Date.now() - t0; return; }

  const exclude = new Set(config.kb.excludeDirs || []);
  const files = walk(vault, [], exclude);
  stats.files = files.length;
  const maxC = config.kb.maxChunkChars || 500;
  for (const f of files) {
    let raw; try { raw = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
    const title = path.basename(f, '.md');
    const paras = stripMd(raw).split(/\n\s*\n|\n#{1,6}\s/).map((s) => s.trim()).filter(Boolean);
    let buf = '';
    const push = (txt) => {
      if (!txt.trim()) return;
      const tf = new Map();
      for (const tok of tokenize(title + ' ' + txt)) tf.set(tok, (tf.get(tok) || 0) + 1);
      for (const tok of tf.keys()) DF.set(tok, (DF.get(tok) || 0) + 1);
      CHUNKS.push({ file: f, title, text: txt.slice(0, 480), tf });
    };
    for (const p of paras) {
      if ((buf + p).length > maxC) { push(buf); buf = p; }
      else buf += (buf ? '\n' : '') + p;
    }
    push(buf);
  }
  stats.chunks = CHUNKS.length;
  stats.ms = Date.now() - t0;
}

function ensureIndex() { if (CHUNKS === null) build(); }

/** 检索与 query 最相关的若干知识块 */
function retrieve(query, k) {
  if (!config.kb.enabled) return [];
  ensureIndex();
  if (!CHUNKS || !CHUNKS.length) return [];
  const N = CHUNKS.length;
  const qToks = [...new Set(tokenize(query))];
  if (!qToks.length) return [];
  const idf = (t) => Math.log(1 + N / (1 + (DF.get(t) || 0)));
  // 「锚点词」= 较稀有的区分性 token（IDF 高）。命中必须至少含一个锚点，避免只匹配常见字带来的噪声。
  const ANCHOR_IDF = 3.5;
  const anchors = new Set(qToks.filter((t) => idf(t) >= ANCHOR_IDF));
  const scored = [];
  for (const c of CHUNKS) {
    let score = 0, hit = 0, anchorHit = false;
    for (const t of qToks) {
      const tf = c.tf.get(t);
      if (!tf) continue;
      hit++;
      if (anchors.has(t)) anchorHit = true;
      score += Math.min(tf, 3) * idf(t);
    }
    // 有锚点词时必须命中锚点；无锚点词（query 全是常见字）则退化为至少命中 2 个
    const ok = anchors.size ? anchorHit : hit >= 2;
    if (ok && score >= (config.kb.minScore || 0)) scored.push({ score, title: c.title, text: c.text });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, k || config.kb.topK || 3);
}

function reindex() { CHUNKS = null; DF = null; ensureIndex(); return status(); }
function status() { return { ...stats, enabled: !!config.kb.enabled }; }
function warmup() { setTimeout(() => { try { ensureIndex(); } catch (_) {} }, 1500); } // 启动后台预建索引

module.exports = { retrieve, reindex, status, warmup, tokenize };
