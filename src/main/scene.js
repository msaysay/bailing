'use strict';
// 场景感知：读前台窗口（App + 标题）→ 判断当前是聊天/代码/邮件/文档/社交，让润色自动切档。
let getWin = null; // active-win 的 activeWindow（ESM，动态 import）

async function loadWin() {
  if (getWin === null) {
    try { const m = await import('active-win'); getWin = m.activeWindow || m.default || false; }
    catch (_) { getWin = false; }
  }
  return getWin;
}

// 进程名/标题 -> 场景
const MAP = [
  { scene: 'chat', proc: /wechat|weixin|wechatapp|wxwork|wework|wecom|企业微信|(^|\b)qq|tim|dingtalk|feishu|lark|telegram|discord|slack|whatsapp|potato/i, title: /微信|企业微信|钉钉|飞书|群聊|聊天/ },
  { scene: 'code', proc: /vscode|(^|\\)code(\.exe)?$|cursor|devenv|idea|pycharm|webstorm|goland|clion|rider|sublime|windowsterminal|(^|\\)cmd|powershell|pwsh|conemu|hyper|mintty|wezterm|alacritty|kitty|tabby|git-bash|bash|terminal/i },
  { scene: 'email', proc: /outlook|foxmail|thunderbird|mailspring|mailbird|newmail|網易郵箱|邮箱大师/i, title: /邮件|收件箱|inbox|撰写邮件/i },
  { scene: 'doc', proc: /winword|wps|notion|obsidian|typora|yuque|onenote|evernote|印象笔记|notepad|scrivener|marktext|zoteroword/i, title: /语雀|腾讯文档|石墨文档/ },
  { scene: 'social', proc: /xiaohongshu|weibo|小红书|微博|douyin|抖音/i, title: /小红书|微博|抖音|发布笔记/ },
];
const BROWSER = /chrome|msedge|firefox|opera|brave|360se|360chrome|qqbrowser|sogouexplorer|maxthon|vivaldi|arc/i;
const TITLE_HINT = [
  { scene: 'social', re: /小红书|微博|抖音|知乎|bilibili|xiaohongshu|weibo|instagram|twitter|threads/i },
  { scene: 'code', re: /github|gitlab|stack ?overflow|codepen|leetcode|npm|开发者/i },
  { scene: 'email', re: /gmail|outlook|mail\.|邮件|qq邮箱|163邮箱/i },
  { scene: 'doc', re: /docs\.google|腾讯文档|飞书文档|语雀|notion|石墨|文档/i },
  { scene: 'chat', re: /微信网页版|web\.whatsapp|web\.telegram/i },
];

/** @returns {Promise<string|null>} 场景，或 null(未知/失败) */
async function detect() {
  const fn = await loadWin();
  if (!fn) return null;
  let w; try { w = await fn(); } catch (_) { return null; }
  if (!w) return null;
  const proc = String((w.owner && w.owner.name) || '');
  const title = String(w.title || '');
  for (const r of MAP) {
    if (r.proc && r.proc.test(proc)) return r.scene;
    if (r.title && r.title.test(title)) return r.scene;
  }
  if (BROWSER.test(proc)) {
    for (const h of TITLE_HINT) if (h.re.test(title)) return h.scene;
  }
  return null;
}

module.exports = { detect };
