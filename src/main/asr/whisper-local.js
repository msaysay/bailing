'use strict';
// 本地 faster-whisper provider：spawn Python sidecar，传 wav 路径，拿转写文本。
const path = require('path');
const { spawn } = require('child_process');
const config = require('../config');

function transcribe(wavPath) {
  return new Promise((resolve, reject) => {
    const script = path.join(config.root, 'python', 'asr_whisper.py');
    const args = [
      script,
      '--file', wavPath,
      '--model', config.asr.whisper.model,
      '--language', config.asr.language,
    ];
    const proc = spawn(config.asr.whisper.python, args, { windowsHide: true });

    let out = '';
    let err = '';
    proc.stdout.on('data', (d) => (out += d.toString()));
    proc.stderr.on('data', (d) => (err += d.toString()));
    proc.on('error', (e) => reject(new Error(`无法启动 Python: ${e.message}`)));
    proc.on('close', () => {
      // sidecar 只在最后一行输出 JSON
      const line = out.trim().split(/\r?\n/).pop() || '';
      try {
        const r = JSON.parse(line);
        if (r.ok) return resolve(r.text || '');
        return reject(new Error(r.error || 'ASR 失败'));
      } catch (_) {
        reject(new Error(`ASR 输出解析失败: ${(err || out).slice(0, 200)}`));
      }
    });
  });
}

module.exports = { transcribe };
