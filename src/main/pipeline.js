'use strict';
// 管线编排：wav -> ASR -> 术语提示 -> LLM 润色 -> 术语纠正 -> 返回干净文本。
// 「越用越懂我」的运行时落点：注入风格画像 + 场景 + 热词。
const asr = require('./asr');
const { polish } = require('./polish');
const terms = require('./terms');
const store = require('./store');
const kb = require('./kb');
const names = require('./names');
const config = require('./config');

/**
 * @param {string} wavPath
 * @param {object} ctx  { scene }  场景由 main 检测前台窗口后传入（L3）
 */
async function run(wavPath, ctx = {}) {
  const timings = {};
  let t = Date.now();

  // 1) ASR
  const raw = await asr.transcribe(wavPath);
  timings.asr = Date.now() - t;
  if (!raw) return { raw: '', text: '', timings };

  // 2) 载入术语 + 风格画像（L1/L2 产物）
  const table = terms.loadAll();
  const profile = store.readJSON('style-profile.json', { style: '' });

  // 2.1) 专名同音纠错：用词库正字纠正 ASR 听错的人名/公司/产品（在 RAG/润色前，让下游都用对的名字）
  let asrText = raw;
  try {
    const nc = names.correct(raw, table.hotwords);
    if (nc.applied.length) { asrText = nc.text; timings.nameFix = nc.applied.length; }
  } catch (_) { /* 纠错失败不阻塞 */ }

  // 2.5) 知识库 RAG：检索你 Obsidian 里与本句相关的背景，帮润色懂领域/写对专名
  let context = '';
  if (config.kb.enabled) {
    try {
      const hits = kb.retrieve(asrText, config.kb.topK);
      timings.kbHits = hits.length;
      if (hits.length) context = hits.map((h) => `【${h.title}】${h.text}`).join('\n');
    } catch (_) { /* 检索失败不阻塞 */ }
  }

  // 3) LLM 润色（注入 场景/风格/热词/知识库背景）
  t = Date.now();
  let text = asrText;
  try {
    text = await polish(asrText, {
      scene: ctx.scene || 'default',
      style: profile.style || '',
      terms: table.hotwords,
      context,
      structure: config.polish.structure,
    });
  } catch (e) {
    // 润色失败不阻塞：退回（已纠专名的）ASR 文本
    text = asrText;
    timings.polishError = e.message;
  }
  timings.polish = Date.now() - t;

  // 4) 术语纠正兜底：显式映射 + 专名同音纠错（防润色重新写错）
  text = terms.applyCorrections(text, table);
  text = names.correct(text, table.hotwords).text;

  // 5) 落历史（本地）
  appendHistory({ ts: Date.now(), raw, text, scene: ctx.scene || 'default' });

  return { raw, text, timings };
}

function appendHistory(entry) {
  const hist = store.readJSON('history.json', []);
  hist.push(entry);
  // 只留最近 500 条
  store.writeJSON('history.json', hist.slice(-500));
}

module.exports = { run };
