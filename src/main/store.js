'use strict';
// 本地 JSON 持久化：术语表、学习词、风格画像、历史。全部本地存储，不上云（隐私优先）。
const fs = require('fs');
const path = require('path');
const config = require('./config');

function ensureDir() {
  if (!fs.existsSync(config.dataDir)) fs.mkdirSync(config.dataDir, { recursive: true });
}

function readJSON(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path.join(config.dataDir, file), 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function writeJSON(file, data) {
  ensureDir();
  fs.writeFileSync(path.join(config.dataDir, file), JSON.stringify(data, null, 2), 'utf8');
}

module.exports = { readJSON, writeJSON, ensureDir };
