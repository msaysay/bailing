'use strict';
// 用户设置：读写 data/settings.json，并叠加到运行时 config 上（快捷键/ASR/润色/场景）。
const config = require('./config');
const store = require('./store');

const DEFAULTS = {
  apiKey: config.polish.apiKey,       // MiMo API Key（BYOK，本地存储）
  hotkey: config.hotkey,
  asrProvider: config.asr.provider,   // mimo | whisper-local | huoshan | xunfei
  polishModel: config.polish.model,   // 润色模型
  polishEnabled: true,                // 关掉=只 ASR 秒出（短按快速档）
  structureMode: config.polish.structure, // 智能梳理结构
  autoPaste: true,                    // 关掉=只复制到剪贴板由用户 Ctrl+V
  autoScene: true,                    // 自动识别前台窗口切换场景（关掉=固定用默认场景）
  defaultScene: 'default',            // 自动识别不出时的回落场景
  kbEnabled: config.kb.enabled,       // 知识库 RAG 开关
  kbVaultPath: config.kb.vaultPath,   // Obsidian 库路径
};

function load() {
  const s = store.readJSON('settings.json', {});
  return { ...DEFAULTS, ...s };
}

function save(patch) {
  const merged = { ...load(), ...patch };
  store.writeJSON('settings.json', merged);
  apply(merged);
  return merged;
}

// 把设置叠加到运行时 config（模块在调用时读取 config.*，故此处生效）
function apply(s) {
  if (s.apiKey) config.polish.apiKey = s.apiKey; // ASR 与润色共用此 key
  config.hotkey = s.hotkey || config.hotkey;
  config.asr.provider = s.asrProvider || config.asr.provider;
  config.polish.model = s.polishModel || config.polish.model;
  config.polish.enabled = s.polishEnabled !== false;
  config.polish.structure = s.structureMode === true;
  config.inject.autoPaste = s.autoPaste !== false;
  config.kb.enabled = s.kbEnabled !== false;
  if (s.kbVaultPath != null) config.kb.vaultPath = s.kbVaultPath;
}

module.exports = { load, save, apply, DEFAULTS };
