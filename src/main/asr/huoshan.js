'use strict';
// 火山引擎 BigASR provider（生产期）—— 骨架预留。
// 待用户提供 HUOSHAN_APP_ID / HUOSHAN_ACCESS_TOKEN 后按官方 WS/HTTP 协议实现。
// 参考：火山引擎「一句话识别 / 流式语音识别」OpenAPI。
async function transcribe(_wavPath) {
  throw new Error('火山 ASR 尚未配置：请在 .env 填 HUOSHAN_APP_ID / HUOSHAN_ACCESS_TOKEN 并实现本 provider');
}
module.exports = { transcribe };
