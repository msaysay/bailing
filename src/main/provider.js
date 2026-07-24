'use strict';
// 提供方解析：决定 ASR/润色请求发往哪里、带什么凭证。
// 默认「百灵云服务」：走 49.gx.cn 中转（每日 3000 字免费，作者承担）；
// 用户配置自定义接入方（BYOK）后，直连其 OpenAI 兼容端点。
const config = require('./config');

/**
 * @returns {{baseURL:string, headers:object, source:'cloud'|'byok'}}
 */
function endpoint() {
  if (config.provider.mode === 'byok' && config.polish.apiKey) {
    return {
      baseURL: config.polish.baseURL,
      headers: { Authorization: `Bearer ${config.polish.apiKey}` },
      source: 'byok',
    };
  }
  return {
    baseURL: config.cloud.baseURL,
    headers: { 'X-Bailing-Install': config.cloud.installId || '' },
    source: 'cloud',
  };
}

/** 查询云服务今日额度（cloud 模式用；失败返回 null） */
async function quota() {
  try {
    const resp = await fetch(`${config.cloud.baseURL}/quota`, {
      headers: { 'X-Bailing-Install': config.cloud.installId || '' },
    });
    if (!resp.ok) return null;
    return await resp.json(); // {limit, used, remaining}
  } catch (_) {
    return null;
  }
}

module.exports = { endpoint, quota };
