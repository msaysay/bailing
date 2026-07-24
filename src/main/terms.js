'use strict';
// 术语引擎：加载默认表 + 学习表，做纠正替换，并暴露「学习」入口（L1）。
const path = require('path');
const config = require('./config');
const store = require('./store');

function loadDefault() {
  try {
    return require(path.join(config.dataDir, 'terms.default.json'));
  } catch (_) {
    return { corrections: {}, hotwords: [] };
  }
}

// 合并默认表 + 学习表
function loadAll() {
  const def = loadDefault();
  const learned = store.readJSON('terms.learned.json', { corrections: {}, hotwords: [] });
  return {
    corrections: { ...def.corrections, ...learned.corrections },
    hotwords: [...new Set([...(def.hotwords || []), ...(learned.hotwords || [])])],
  };
}

// 对文本应用术语纠正（简单全量替换；后续可升级为分词/边界感知）
function applyCorrections(text, table) {
  let out = text;
  for (const [wrong, right] of Object.entries(table.corrections || {})) {
    if (!wrong || wrong === right) continue;
    out = out.split(wrong).join(right);
  }
  return out;
}

// L1 学习：记录一条「wrong -> right」纠正，落到学习表
function learnCorrection(wrong, right) {
  if (!wrong || !right || wrong === right) return;
  const learned = store.readJSON('terms.learned.json', { corrections: {}, hotwords: [] });
  learned.corrections[wrong] = right;
  if (!learned.hotwords.includes(right)) learned.hotwords.push(right);
  store.writeJSON('terms.learned.json', learned);
}

// 删除一条学习到的纠正
function removeCorrection(wrong) {
  const learned = store.readJSON('terms.learned.json', { corrections: {}, hotwords: [] });
  if (learned.corrections) delete learned.corrections[wrong];
  store.writeJSON('terms.learned.json', learned);
}

// 读取/保存「专名词库」（学习表里的 hotwords + corrections）
function getLibrary() {
  const learned = store.readJSON('terms.learned.json', { corrections: {}, hotwords: [] });
  return { hotwords: learned.hotwords || [], corrections: learned.corrections || {} };
}
function saveLibrary({ hotwords, corrections }) {
  const learned = store.readJSON('terms.learned.json', { corrections: {}, hotwords: [] });
  if (Array.isArray(hotwords)) learned.hotwords = [...new Set(hotwords.map((s) => String(s).trim()).filter(Boolean))];
  if (corrections && typeof corrections === 'object') learned.corrections = corrections;
  store.writeJSON('terms.learned.json', learned);
  return getLibrary();
}

module.exports = { loadAll, applyCorrections, learnCorrection, removeCorrection, getLibrary, saveLibrary };
