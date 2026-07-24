'use strict';
// 实测 MiMo ASR 接口格式（拿真 key 打，探明正确请求 shape）。
require('../src/main/config');
const fs = require('fs');
const path = require('path');

const KEY = process.env.MIMO_API_KEY;
const BASE = process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1';
const wav = fs.readFileSync(path.join(__dirname, '_asr_test.wav'));
const b64 = wav.toString('base64');

// 候选请求格式（按官方描述：chat/completions + input_audio）
const candidates = [
  {
    name: 'A: input_audio + asr_options',
    body: {
      model: 'mimo-v2.5-asr',
      messages: [
        { role: 'user', content: [{ type: 'input_audio', input_audio: { data: b64, format: 'wav' } }] },
      ],
      asr_options: { language: 'zh' },
    },
  },
  {
    name: 'B: input_audio 无 options',
    body: {
      model: 'mimo-v2.5-asr',
      messages: [
        { role: 'user', content: [{ type: 'input_audio', input_audio: { data: b64, format: 'wav' } }] },
      ],
    },
  },
];

async function tryOne(c) {
  const t0 = Date.now();
  try {
    const resp = await fetch(`${BASE}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify(c.body),
    });
    const txt = await resp.text();
    console.log(`\n[${c.name}] HTTP ${resp.status} (${Date.now() - t0}ms)`);
    console.log(txt.slice(0, 600));
    return resp.ok;
  } catch (e) {
    console.log(`\n[${c.name}] ERROR ${e.message}`);
    return false;
  }
}

(async () => {
  for (const c of candidates) {
    const ok = await tryOne(c);
    if (ok) { console.log(`\n==> 成功格式: ${c.name}`); break; }
  }
})();
