'use strict';
// ASR provider 工厂：按 config.asr.provider 选实现。即插即换。
const config = require('../config');

function getProvider() {
  switch (config.asr.provider) {
    case 'whisper-local':
      return require('./whisper-local');
    case 'openai-audio':
      return require('./openai-audio');
    case 'huoshan':
      return require('./huoshan');
    case 'xunfei':
      return require('./xunfei'); // 待实现
    case 'mimo':
    default:
      return require('./mimo');
  }
}

/** @param {string} wavPath @returns {Promise<string>} */
async function transcribe(wavPath) {
  return getProvider().transcribe(wavPath);
}

module.exports = { transcribe };
