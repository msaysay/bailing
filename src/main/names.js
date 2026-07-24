'use strict';
// 专名同音纠错：从知识库抽取专有名词 + 拼音索引，给 ASR 结果找出「同音/近音写错的专名」候选。
// 用途：把 ASR 听错的人名/公司/产品（季婷→冀婷、四十九坊→肆拾玖坊）按知识库标准写法纠正。
const fs = require('fs');
const path = require('path');
const { pinyin } = require('pinyin-pro');
const config = require('./config');

let PY = null;          // Map: 拼音串 -> Map(短语 -> 频次)  （只留够独特的专名候选）
let FREQ = null;        // Map: 短语 -> 频次（用于判断「听到的写法」在库里常不常见）
let stats = { phrases: 0, builtAt: 0 };

// 常见双字词停用（避免把普通词误判成专名）——极简版，可扩充
const STOP2 = new Set(['我们', '你们', '他们', '公司', '这个', '那个', '就是', '什么', '怎么', '可以', '因为', '所以', '知道', '现在', '时候', '一下', '这样', '那样', '自己', '大家', '问题', '工作', '业务', '产品', '用户', '内容', '数据', '经理', '总监', '老板', '朋友', '正确', '测试', '名字', '总经', '总裁']);

function pyOf(s) {
  return pinyin(s, { toneType: 'none', type: 'array', nonZh: 'removed' }).join('');
}

function walk(dir, acc, exclude) {
  let ents; try { ents = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return acc; }
  for (const e of ents) {
    if (e.name.startsWith('.') || exclude.has(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc, exclude);
    else if (/\.(md|markdown|txt)$/.test(e.name)) acc.push(p);
  }
  return acc;
}

function build() {
  const t0 = Date.now();
  PY = new Map(); FREQ = new Map(); stats = { phrases: 0, builtAt: Date.now() };
  const vault = config.kb.vaultPath;
  if (!vault || !fs.existsSync(vault)) return;
  const exclude = new Set(config.kb.excludeDirs || []);
  const files = walk(vault, [], exclude);

  // 统计 2-4 字中文 n-gram + 英文词 频次
  const freq = new Map();
  for (const f of files) {
    let raw; try { raw = fs.readFileSync(f, 'utf8'); } catch (_) { continue; }
    const segs = raw.match(/[一-鿿]{2,}/g) || [];
    for (const seg of segs) {
      for (let n = 2; n <= 4; n++) {
        for (let i = 0; i + n <= seg.length; i++) {
          const g = seg.slice(i, i + n);
          freq.set(g, (freq.get(g) || 0) + 1);
        }
      }
    }
    const en = raw.match(/[A-Za-z][A-Za-z0-9.+#]{1,}/g) || [];
    for (const w of en) freq.set(w, (freq.get(w) || 0) + 1);
  }
  // 保留频次≥2 的短语用于「听到写法」的常见度判断；频次≥3 的进拼音索引作候选标准写法
  for (const [g, c] of freq) {
    if (c < 2) continue;
    FREQ.set(g, c);
    if (c < 3) continue;
    if (g.length === 2 && STOP2.has(g)) continue;
    const key = pyOf(g);
    if (!key) continue;
    let m = PY.get(key); if (!m) { m = new Map(); PY.set(key, m); }
    m.set(g, c);
  }
  stats.phrases = [...PY.values()].reduce((s, m) => s + m.size, 0);
  stats.ms = Date.now() - t0;
}

function ensure() { if (PY === null) build(); }

/**
 * 给 ASR 文本找出同音写错的专名候选。
 * @returns {Array<{heard:string, correct:string}>}
 */
function candidates(text) {
  ensure();
  if (!PY || !PY.size || !text) return [];
  const out = new Map(); // heard -> correct
  const covered = []; // 已命中的区间，避免子串重复命中
  // 长优先（先 4 字再 3、2），避免子串误命中
  for (let n = 4; n >= 2; n--) {
    const re = new RegExp(`[一-鿿]{${n}}`, 'g');
    let m;
    while ((m = re.exec(text))) {
      const span = m[0];
      const a = m.index, b = m.index + n;
      if (covered.some(([x, y]) => a < y && b > x)) continue; // 被更长匹配覆盖
      if (out.has(span)) continue;
      const cand = PY.get(pyOf(span));
      if (!cand) continue;
      const heardFreq = FREQ.get(span) || 0;   // 「听到的写法」在库里有多常见
      // 取同拼音里频次最高、且不同字的库标准写法
      let best = null, bestC = 0;
      for (const [phrase, c] of cand) {
        if (phrase === span) continue;
        if (c > bestC) { best = phrase; bestC = c; }
      }
      // 触发条件：库标准写法够常见(≥3，双字≥5)，且明显比「听到写法」更常见(≥2倍)
      const bar = span.length === 2 ? 5 : 3;
      if (best && bestC >= bar && bestC >= heardFreq * 2 && heardFreq <= 2) {
        out.set(span, best);
        covered.push([a, b]);
      }
    }
  }
  return [...out].map(([heard, correct]) => ({ heard, correct }));
}

const EN_STOP = new Set(['the', 'and', 'you', 'for', 'are', 'with', 'this', 'that', 'have', 'not', 'was', 'can', 'will', 'from', 'your', 'all', 'but', 'has', 'com', 'www', 'http', 'https', 'png', 'jpg', 'md',
  // markdown frontmatter / 代码 常见键，属噪声
  'status', 'updated', 'created', 'type', 'tags', 'aliases', 'date', 'title', 'url', 'note', 'todo', 'done', 'active', 'true', 'false', 'null', 'v1', 'v2', 'id', 'src', 'img']);
// 语法/虚词字：含这些字的 n-gram 基本不是专名（如「酒的/我们/这个」），过滤掉能让专名浮上来
const FUNC = new Set([...'的了是在我你他她它们这那有和就也都而把被让给对从向到于之其该等很不没会能要想说看用个些么什怎为以可将已还又再却但且只更最太呢吧啊嗯呀吗地得着过来去如果因所然还应该这些那些一些没有可以我们你们他们自己大家怎么什么因为所以但是然后如果虽然而且并且或者以及'].filter((c) => c.trim()));

// 从知识库提取候选专名（按词频 + 去片段 + 去常见词），给用户/LLM 复核
function suggestRaw(limit = 150) {
  ensure();
  if (!FREQ) return [];
  let arr = [];
  for (const [g, c] of FREQ) {
    if (c < 4) continue;
    if (/^[A-Za-z]/.test(g)) {
      if (g.length < 2 || EN_STOP.has(g.toLowerCase())) continue;
    } else {
      if (g.length < 2) continue;
      if (g.length === 2 && STOP2.has(g)) continue;
      if ([...g].some((ch) => FUNC.has(ch))) continue; // 含虚词字 → 多半不是专名
    }
    arr.push({ term: g, freq: c });
  }
  arr.sort((a, b) => b.freq - a.freq);
  arr = arr.slice(0, limit * 3);
  // 去纯片段：只丢「几乎只作为某长词一部分出现」的（长词频次≥本词的90% = 本词很少单独出现）。
  // 提高阈值避免误杀「泰斗/宗师」这类既是产品名、又常出现在长词里的高频真词。
  const kept = arr.filter((x) => {
    return !arr.some((y) => y !== x && y.term.length > x.term.length &&
      y.term.includes(x.term) && y.freq >= x.freq * 0.9);
  });
  return kept.slice(0, limit);
}

function reindex() { PY = null; ensure(); return status(); }
function status() { return { ...stats }; }
function warmup() { setTimeout(() => { try { ensure(); } catch (_) {} }, 1800); }

// ===== 对着「确定正字词库」做拼音纠错（高精度、可兑现的保证）=====
// terms: 用户/知识库确认过的专名标准写法数组，如 ['冀婷','肆拾玖坊','陈宁','张传宗']
function buildTermIndex(terms) {
  const idx = new Map(); // 拼音 -> 标准写法（长的优先）
  for (const t of terms || []) {
    const s = String(t).trim();
    if (s.length < 2) continue;
    const key = pyOf(s);
    if (key && !idx.has(key)) idx.set(key, s);
  }
  return idx;
}

/**
 * 用确定词库纠正 ASR 文本里的同音专名错字。
 * @returns {{text:string, applied:Array<{heard,correct}>}}
 */
function correct(text, terms) {
  if (!text || !terms || !terms.length) return { text, applied: [] };
  // 按长度分组，预算拼音
  const byLen = new Map();
  for (const t of terms) {
    const s = String(t).trim();
    if (s.length < 2) continue;
    if (!byLen.has(s.length)) byLen.set(s.length, []);
    byLen.get(s.length).push({ term: s, py: pyOf(s) });
  }
  const applied = [];
  let out = text;
  const isHan = (c) => /[一-鿿]/.test(c);
  // 长优先，滑动重叠窗口（对齐词边界），命中即替换
  for (const L of [...byLen.keys()].sort((a, b) => b - a)) {
    const group = byLen.get(L);
    let res = '', i = 0;
    while (i < out.length) {
      const span = out.substr(i, L);
      if (span.length === L && [...span].every(isHan)) {
        const spy = pyOf(span);
        const hit = group.find((g) => g.py === spy && g.term !== span);
        if (hit) { res += hit.term; applied.push({ heard: span, correct: hit.term }); i += L; continue; }
      }
      res += out[i]; i++;
    }
    out = res;
  }
  return { text: out, applied };
}

module.exports = { candidates, correct, suggestRaw, reindex, status, warmup, pyOf };
