'use strict';
// 通用 OpenAI 音频格式 ASR（Whisper API）：POST {baseURL}/audio/transcriptions (multipart)。
// 覆盖 OpenAI / Groq / DeepInfra 等绝大多数在线 ASR。
const fs = require('fs');
const path = require('path');
const config = require('../config');

async function transcribe(wavPath) {
  const { baseURL, model } = config.asr.openai;
  if (!baseURL) throw new Error('未配置 ASR 端点（设置 → 接入方）');
  if (!config.polish.apiKey) throw new Error('自定义接入方需要填写 API Key');

  const buf = fs.readFileSync(wavPath);
  const form = new FormData();
  form.append('model', model || 'whisper-1');
  form.append('language', config.asr.language === 'zh' ? 'zh' : config.asr.language);
  form.append('file', new Blob([buf], { type: 'audio/wav' }), path.basename(wavPath));

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let resp;
  try {
    resp = await fetch(`${baseURL.replace(/\/$/, '')}/audio/transcriptions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.polish.apiKey}` },
      body: form,
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`ASR HTTP ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  return (data?.text || '').trim();
}

module.exports = { transcribe };
