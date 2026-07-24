'use strict';
// 小米 MiMo ASR provider（mimo-v2.5-asr）。同一个 MiMo key 即可用，中文强、自带标点。
// 请求格式（已实测）：chat/completions + input_audio(base64) + asr_options.language
const fs = require('fs');
const config = require('../config');

async function transcribe(wavPath) {
  const key = config.polish.apiKey; // 复用同一个 MiMo key
  if (!key) throw new Error('未配置 MIMO_API_KEY，无法使用 MiMo ASR');
  const b64 = fs.readFileSync(wavPath).toString('base64');

  const body = {
    model: config.asr.mimo.model,
    messages: [
      { role: 'user', content: [{ type: 'input_audio', input_audio: { data: b64, format: 'wav' } }] },
    ],
    asr_options: { language: config.asr.language },
  };

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 30000);
  let resp;
  try {
    resp = await fetch(`${config.polish.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    throw new Error(`MiMo ASR HTTP ${resp.status}: ${t.slice(0, 200)}`);
  }
  const data = await resp.json();
  return (data?.choices?.[0]?.message?.content || '').trim();
}

module.exports = { transcribe };
