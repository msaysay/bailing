'use strict';
// 小米 MiMo ASR provider（mimo-v2.5-asr）。中文强、自带标点。
// 请求格式（已实测）：chat/completions + input_audio(base64) + asr_options.language
// 凭证走 provider.endpoint()：云服务（默认）或用户自定义接入方（MiMo 格式）。
const fs = require('fs');
const config = require('../config');
const provider = require('../provider');

async function transcribe(wavPath) {
  const ep = provider.endpoint();
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
    resp = await fetch(`${ep.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...ep.headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    let msg = `ASR HTTP ${resp.status}`;
    try { msg = JSON.parse(t)?.error?.message || msg; } catch (_) {}
    throw new Error(msg);
  }
  const data = await resp.json();
  return (data?.choices?.[0]?.message?.content || '').trim();
}

module.exports = { transcribe };
