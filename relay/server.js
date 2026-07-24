'use strict';
// 百灵云服务中转（relay）：MiMo key 只存服务器，App 默认走这里，按装机 ID 限每日 3000 字。
// 隐私红线：不记录任何音频/文本内容，只记字数。
// 部署：systemd bailing-relay.service → 127.0.0.1:8350 → nginx /bailing-api/
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = 8350;
const DAILY_LIMIT = 3000;             // 每装机 ID 每日免费字数（作者承担）
const IP_NEW_IDS_PER_DAY = 20;        // 同 IP 每日最多新注册装机 ID 数（防刷）
const MIMO_BASE = process.env.MIMO_BASE_URL || 'https://api.xiaomimimo.com/v1';
const MIMO_KEY = process.env.MIMO_API_KEY || '';
const DATA_DIR = path.join(__dirname, 'data');
const USAGE_FILE = path.join(DATA_DIR, 'usage.json');

if (!MIMO_KEY) { console.error('缺 MIMO_API_KEY（secrets.env）'); process.exit(1); }
fs.mkdirSync(DATA_DIR, { recursive: true });

// ---- 用量存储（原子写）----
function readUsage() {
  try { return JSON.parse(fs.readFileSync(USAGE_FILE, 'utf8')); } catch (_) { return {}; }
}
function writeUsage(u) {
  const tmp = USAGE_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(u));
  fs.renameSync(tmp, USAGE_FILE);
}
function today() { return new Date().toISOString().slice(0, 10); }

// usage 结构：{ installs: {id: {day, chars}}, ips: {ip: {day, newIds: []}} }
function getInstall(usage, id, ip) {
  usage.installs = usage.installs || {};
  usage.ips = usage.ips || {};
  const d = today();
  if (!usage.installs[id]) {
    // 新装机 ID：校验该 IP 今日新注册数
    usage.ips[ip] = usage.ips[ip] && usage.ips[ip].day === d ? usage.ips[ip] : { day: d, newIds: [] };
    if (usage.ips[ip].newIds.length >= IP_NEW_IDS_PER_DAY && !usage.ips[ip].newIds.includes(id)) {
      return null; // 超限
    }
    if (!usage.ips[ip].newIds.includes(id)) usage.ips[ip].newIds.push(id);
    usage.installs[id] = { day: d, chars: 0 };
  }
  if (usage.installs[id].day !== d) usage.installs[id] = { day: d, chars: 0 };
  return usage.installs[id];
}

// 计量：优先用响应 output 文本字数（ASR/润色通用）；润色用 max(input,output) 更公平
function countChars(body, respData) {
  const outText = respData?.choices?.[0]?.message?.content || '';
  let inText = '';
  try {
    for (const m of body.messages || []) {
      if (typeof m.content === 'string') inText += m.content;
    }
  } catch (_) {}
  return Math.max(outText.length, inText.length, 1);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

function send(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(s);
}

const server = http.createServer(async (req, res) => {
  const url = req.url.split('?')[0];
  const installId = req.headers['x-bailing-install'] || '';
  const ip = (req.headers['x-real-ip'] || req.socket.remoteAddress || '').replace('::ffff:', '');

  if (url === '/health') return send(res, 200, { ok: true });

  if (url === '/v1/quota' && req.method === 'GET') {
    if (!/^[0-9a-f-]{16,64}$/i.test(installId)) return send(res, 400, { error: 'missing install id' });
    const usage = readUsage();
    const d = today();
    const rec = usage.installs?.[installId];
    const used = rec && rec.day === d ? rec.chars : 0;
    return send(res, 200, { limit: DAILY_LIMIT, used, remaining: Math.max(0, DAILY_LIMIT - used) });
  }

  if (url === '/v1/chat/completions' && req.method === 'POST') {
    if (!/^[0-9a-f-]{16,64}$/i.test(installId)) {
      return send(res, 401, { error: { message: '缺少装机标识，请升级百灵到最新版' } });
    }
    let raw;
    try { raw = await readBody(req); } catch (e) { return send(res, 400, { error: { message: e.message } }); }
    if (raw.length > 25 * 1024 * 1024) return send(res, 413, { error: { message: '请求过大' } });

    let body;
    try { body = JSON.parse(raw.toString('utf8')); } catch (_) { return send(res, 400, { error: { message: 'JSON 解析失败' } }); }

    // 额度检查
    const usage = readUsage();
    const rec = getInstall(usage, installId, ip);
    if (!rec) return send(res, 429, { error: { message: '请求过于频繁，请明天再试，或在设置里配置自己的 key' } });
    if (rec.chars >= DAILY_LIMIT) {
      return send(res, 429, { error: { message: `今日免费额度（${DAILY_LIMIT}字）已用完。明天再来，或在「设置 → 接入方」配置自己的 key 无限使用` } });
    }

    // 转发到 MiMo
    let upstream;
    try {
      upstream = await fetch(`${MIMO_BASE}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${MIMO_KEY}` },
        body: raw,
      });
    } catch (e) {
      return send(res, 502, { error: { message: '上游连接失败：' + e.message } });
    }
    const respText = await upstream.text();
    if (!upstream.ok) {
      res.writeHead(upstream.status, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(respText);
    }
    // 计量入账（不存内容，只记字数）
    let respData = null;
    try { respData = JSON.parse(respText); } catch (_) {}
    if (respData) {
      rec.chars += countChars(body, respData);
      try { writeUsage(usage); } catch (_) {}
    }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(respText);
  }

  send(res, 404, { error: { message: 'not found' } });
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`bailing-relay 已启动 127.0.0.1:${PORT} · 每日限额 ${DAILY_LIMIT} 字`);
});
