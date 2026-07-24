'use strict';
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..');

// 加载 .env。开发：项目根 .env；打包：resources/.env（electron-builder extraResources）。
function loadEnv(envPath) {
  if (!envPath || !fs.existsSync(envPath)) return false;
  try {
    require('dotenv').config({ path: envPath });
    return true;
  } catch (_) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m && !line.trim().startsWith('#')) process.env[m[1]] = m[2];
    }
    return true;
  }
}
loadEnv(path.join(ROOT, '.env'));
if (process.resourcesPath) loadEnv(path.join(process.resourcesPath, '.env')); // 打包后

const config = {
  root: ROOT,
  // 打包后 asar 内只读，可写数据搬 userData（main.js 启动时设 BAILING_DATA_DIR）
  dataDir: process.env.BAILING_DATA_DIR || path.join(ROOT, 'data'),

  // 全局热键。默认「右 Ctrl」单键：按住说话、松开出字。
  // 也支持组合键如 'CommandOrControl+Shift+Space'，或单修饰键 RightCtrl/RightAlt/RightShift。
  hotkey: process.env.BAILING_HOTKEY || 'RightCtrl',

  asr: {
    // provider: 'mimo' | 'whisper-local' | 'huoshan' | 'xunfei'
    // 默认 mimo：同一个 MiMo key 即可用，中文强、自带标点、无需本地模型
    provider: process.env.BAILING_ASR || 'mimo',
    language: 'zh',
    mimo: {
      model: process.env.MIMO_ASR_MODEL || 'mimo-v2.5-asr',
    },
    whisper: {
      python: process.env.PYTHON_BIN || 'python',
      // faster-whisper 模型：small=快够用 / medium / large-v3=最准
      model: process.env.WHISPER_MODEL || 'small',
    },
  },

  kb: {
    // 知识库 RAG：口述时检索 Obsidian 相关笔记喂给润色，让它懂你的领域/专名。
    enabled: process.env.BAILING_KB !== '0',
    vaultPath: process.env.BAILING_VAULT || 'C:/Users/chenn/Documents/赚钱/ChenNing-Operating-Wiki',
    topK: 3,
    maxChunkChars: 500,
    minScore: 5,
    // 排除原始/日志类目录（转写稿、流水日志噪声大），只索引沉淀过的知识
    excludeDirs: ['.obsidian', 'node_modules', '99_Attachments', '05_Templates',
      '07_Logs', '02_Raw_Sources', '10_Journal', '11_Finance', '09_Scripts'],
  },

  inject: {
    // true=自动 Ctrl+V 到光标；false=只复制到剪贴板由用户手动粘贴。
    // 无论哪种，结果都会留在剪贴板作兜底（焦点丢了也能 Ctrl+V）。
    autoPaste: true,
  },

  polish: {
    enabled: true,
    // 智能梳理结构：把颠三倒四的口述理成有逻辑的结构化文字（识别并列点/步骤，重排顺序）
    structure: false,
    baseURL: process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1',
    apiKey: process.env.MIMO_API_KEY || '',
    model: process.env.MIMO_MODEL || 'mimo-v2.5-pro',
    // MiMo 是推理模型：reasoning_content 计入 token，max_tokens 必须给足
    maxTokens: 3000,
  },
};

module.exports = config;
