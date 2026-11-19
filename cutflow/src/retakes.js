/* 重录检测：一句话录了好几遍 / 说到一半重来 / 结巴重复 → 自动只留最后一遍。
 * 依据只有逐字稿：按停顿切成“气口段”，如果某段的文字和它后面不远处某段的开头高度相似，
 * 说明前面那段是被放弃的一遍，连同它到重录起点之间的内容一起删。拿不准的进 suspect，交给 AI/人复核。 */
const clean = s => s.replace(/[，。！？、,.!?…：:；;“”"《》（）()\s]/g, '');
function editDist(a, b) {
  const m = a.length, n = b.length; let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1), prev[j] + 1, cur[j - 1] + 1); prev = cur; }
  return prev[n];
}
// a 与 b 的“开头”有多像：b 取与 a 等长上下浮动的前缀，取最好的一个
function prefixSim(a, b) {
  let best = 0;
  for (let L = Math.max(2, Math.floor(a.length * .8)); L <= Math.min(b.length, Math.ceil(a.length * 1.25)); L++)
    best = Math.max(best, 1 - editDist(a, b.slice(0, L)) / Math.max(a.length, L));
  return best;
}

function detect(words, { gap = 0.3, lookahead = 4, auto = 0.72, suspect = 0.55 } = {}) {
  const ws = words.map(w => ({ ...w, t: [...clean(w.w)] })).filter(w => w.t.length);
  // 气口段
  const utts = []; let cur = null;
  ws.forEach((w, i) => { if (!cur || w.s - ws[i - 1].e > gap) { cur = { s: w.s, e: w.e, chars: [], words: [] }; utts.push(cur); } cur.e = w.e; cur.chars.push(...w.t); cur.words.push(w); });
  utts.forEach(u => { u.text = u.chars.join(''); });
  const out = { auto: [], suspect: [] };
  // 1) 整段重录：留最后一遍
  for (let i = 0; i < utts.length; i++) {
    const a = utts[i].chars; if (a.length < 2) continue;
    let hit = null;
    for (let j = i + 1; j <= Math.min(utts.length - 1, i + lookahead); j++) {
      const b = utts.slice(j, j + 3).flatMap(u => u.chars);                     // 重录的那遍可能中间又换了气
      const s = b.length >= a.length * .8 ? prefixSim(a, b) : 0;
      const ok = a.length <= 3 ? s === 1 : s >= suspect;                        // 太短的只认完全一致
      if (ok && (!hit || s > hit.score)) hit = { j, score: s };
    }
    if (!hit) continue;
    const item = { kind: 'retake', range: [+utts[i].s.toFixed(3), +utts[hit.j].s.toFixed(3)], score: +hit.score.toFixed(2),
      dropped: utts.slice(i, hit.j).map(u => u.text).join(' / '), kept: utts[hit.j].text };
    (hit.score >= auto ? out.auto : out.suspect).push(item);
    if (hit.score >= auto) i = hit.j - 1;                                        // 跳到保留的那遍继续往后看（它也可能又被重录）
  }
  // 2) 段内结巴：同一串字紧挨着说了两遍（“凭什么人家 凭什么人家特斯拉”），删前一遍
  const covered = t => out.auto.some(r => t >= r.range[0] && t < r.range[1]);
  for (const u of utts) {
    if (covered(u.s)) continue;
    const cw = []; u.words.forEach(w => w.t.forEach(() => cw.push(w)));         // 每个字属于哪个词
    const c = u.chars;
    for (let p = 0; p < c.length; p++) for (let L = Math.min(8, Math.floor((c.length - p) / 2)); L >= 2; L--) for (let g = 0; g <= 2; g++) {
      const q = p + L + g; if (q + L > c.length) continue;
      if (c.slice(p, p + L).join('') !== c.slice(q, q + L).join('')) continue;
      if (cw[p] === cw[q] || (p > 0 && cw[p - 1] === cw[p])) continue;          // 只在词边界上删
      const item = { kind: 'stutter', range: [+cw[p].s.toFixed(3), +cw[q].s.toFixed(3)], score: 1, dropped: c.slice(p, q).join(''), kept: c.slice(q, q + L).join('') };
      (L >= 3 ? out.auto : out.suspect).push(item);                             // 两个字的重复常是正常说法（“研究研究”），只提示不自动删
      p = q - 1; L = 0; break;
    }
  }
  out.auto.sort((a, b) => a.range[0] - b.range[0]);
  return out;
}
module.exports = { detect };
