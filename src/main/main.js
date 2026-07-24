'use strict';
const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, screen, clipboard, nativeImage, dialog, nativeTheme } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const TRAY_ICON = require('./tray-icon');

// 打包后：可写数据放 userData（asar 内只读）；首启从 resources/data 播种词库
if (app.isPackaged) {
  const userData = path.join(app.getPath('userData'), 'data');
  process.env.BAILING_DATA_DIR = userData;
  try {
    if (!fs.existsSync(userData)) {
      fs.mkdirSync(userData, { recursive: true });
      const seed = path.join(process.resourcesPath, 'data');
      if (fs.existsSync(seed)) {
        for (const f of fs.readdirSync(seed)) {
          fs.copyFileSync(path.join(seed, f), path.join(userData, f));
        }
      }
    }
  } catch (e) { console.error('数据播种失败:', e.message); }
}

const config = require('./config'); // 必须在设置 BAILING_DATA_DIR 之后
const settings = require('./settings');
const pipeline = require('./pipeline');
const inject = require('./inject');
const hotkey = require('./hotkey');
const kb = require('./kb');
const names = require('./names');
const terms = require('./terms');
const scene = require('./scene');
const provider = require('./provider');

let indicator = null;
let settingsWin = null;
let termlibWin = null;
let welcomeWin = null;
let trialScene = null; // 引导页场景试用：覆盖下一次录音的场景档位
let tray = null;
let recording = false;
let recordMode = null; // 'ptt'(按住说话) | 'toggle'(短按持续)
let recordScene = null; // 录音开始时抓到的前台场景（L3）
let lastResult = null;  // 最近一次结果 {raw,text}，供快速修正学习
let correctionWin = null;

function createIndicator() {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  const W = 200, H = 60;
  indicator = new BrowserWindow({
    width: W,
    height: H,
    x: Math.round(width / 2 - W / 2),
    y: 46,
    frame: false,
    resizable: false,
    movable: true,
    transparent: false,          // 不透明：彻底规避 Windows 透明窗露灰方块
    roundedCorners: true,        // Win11 DWM 原生圆角：系统级抗锯齿 + 原生投影（替代旧 setShape 裁形，边角干净）
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#201d1a' : '#faf7f1', // 宣纸墨朱色板，跟随主题
    hasShadow: true,             // 交给 Windows 画原生投影
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false, // 不抢焦点，才能把文本注入回原来的 App
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'renderer', 'preload.js'),
    },
  });
  indicator.loadFile(path.join(__dirname, '..', 'renderer', 'indicator.html'));
  indicator.setVisibleOnAllWorkspaces(true);
  nativeTheme.on('updated', () => {
    if (indicator && !indicator.isDestroyed()) {
      indicator.setBackgroundColor(nativeTheme.shouldUseDarkColors ? '#201d1a' : '#faf7f1');
    }
  });
}

function startRecording(mode) {
  if (!indicator || recording) return;
  recording = true;
  recordMode = mode;
  // L3 场景感知：抓当前前台窗口（悬浮窗 focusable:false，不改变前台），异步识别，说话时间足够它返回
  recordScene = null;
  if (settings.load().autoScene !== false) {
    scene.detect().then((s) => { if (recording) recordScene = s; }).catch(() => {});
  }
  indicator.showInactive();
  indicator.webContents.send('record:start', { mode });
}

function stopRecording() {
  if (!indicator || !recording) return;
  recording = false;
  indicator.webContents.send('record:stop');
}

// 兜底：uiohook 不可用时的切换式热键
function toggleRecord() {
  if (recording) stopRecording();
  else startRecording('toggle');
}

// 渲染层录完音，把 WAV 送过来处理
ipcMain.handle('audio:submit', async (_e, arrayBuffer) => {
  recording = false;
  const tmp = path.join(os.tmpdir(), `bailing-${Date.now()}.wav`);
  fs.writeFileSync(tmp, Buffer.from(arrayBuffer));
  indicator.webContents.send('status', { phase: 'processing' });
  try {
    const sc = detectScene(); // L3：前台窗口 -> 场景
    trialScene = null;        // 引导试用场景只用一次
    const { raw, text, timings } = await pipeline.run(tmp, { scene: sc, mode: recordMode });
    let pasted = false;
    if (text) {
      const r = await inject.paste(text, { autoPaste: config.inject.autoPaste });
      pasted = r.pasted;
    }
    lastResult = { raw, text, ts: Date.now() }; // 供「快速修正」用
    // 结果始终在剪贴板：pasted=已自动粘贴；否则提示可 Ctrl+V。停留由渲染层控制（可点改错/悬停保留）
    indicator.webContents.send('status', { phase: 'done', text, raw, timings, pasted });
    if (welcomeWin && !welcomeWin.isDestroyed()) welcomeWin.webContents.send('welcome:result', { text, raw });
    return { ok: true, text, timings, pasted };
  } catch (err) {
    indicator.webContents.send('status', { phase: 'error', error: err.message });
    if (welcomeWin && !welcomeWin.isDestroyed()) welcomeWin.webContents.send('welcome:result', { error: err.message });
    setTimeout(() => indicator && indicator.hide(), 2500);
    return { ok: false, error: err.message };
  } finally {
    fs.unlink(tmp, () => {});
  }
});

// L3 场景：优先引导试用场景 > 录音时抓到的前台场景 > 设置里的默认场景。
function detectScene() {
  return trialScene || recordScene || settings.load().defaultScene || 'default';
}

// 首启引导窗（onboarding）
function createWelcomeWindow() {
  if (welcomeWin && !welcomeWin.isDestroyed()) { welcomeWin.show(); welcomeWin.focus(); return; }
  welcomeWin = new BrowserWindow({
    width: 560, height: 660, title: '欢迎使用百灵',
    resizable: false,
    frame: false,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#161311' : '#f5f2ec',
    webPreferences: { preload: path.join(__dirname, '..', 'renderer', 'preload.js') },
  });
  welcomeWin.setMenuBarVisibility(false);
  welcomeWin.loadFile(path.join(__dirname, '..', 'renderer', 'welcome.html'));
}
ipcMain.on('welcome:trialScene', (_e, sc) => { trialScene = sc; });
ipcMain.on('welcome:done', () => {
  settings.save({ onboarded: true });
  if (welcomeWin && !welcomeWin.isDestroyed()) welcomeWin.close();
});

function createSettingsWindow() {
  if (settingsWin && !settingsWin.isDestroyed()) {
    settingsWin.show();
    settingsWin.focus();
    return;
  }
  settingsWin = new BrowserWindow({
    width: 520,
    height: 560,
    title: '百灵 · 设置',
    resizable: false,
    frame: false,              // 自绘标题栏：min/close 按钮画进墨底 hero，与品牌融为一体
    webPreferences: { preload: path.join(__dirname, '..', 'renderer', 'preload.js') },
  });
  settingsWin.setMenuBarVisibility(false);
  settingsWin.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));
}

function registerHotkey() {
  globalShortcut.unregisterAll();
  hotkey.stop();
  // 首选 uiohook 双模式（按住说话 + 短按切换）
  const dual = hotkey.start(config.hotkey, {
    onStart: (mode) => startRecording(mode),
    onStop: () => stopRecording(),
  });
  if (dual) return 'dual';
  // 回退：globalShortcut 切换式
  const ok = globalShortcut.register(config.hotkey, toggleRecord);
  if (!ok) console.error('全局热键注册失败：', config.hotkey);
  return ok ? 'toggle' : false;
}

// 设置 IPC
ipcMain.handle('settings:load', () => settings.load());
ipcMain.handle('settings:save', (_e, patch) => {
  const prevVault = config.kb.vaultPath;
  const saved = settings.save(patch); // 内部会 apply 到 config
  registerHotkey();                    // 热键可能变了，重新注册
  if (tray) tray.setContextMenu(buildTrayMenu()); // 刷新菜单里的热键显示
  if (config.kb.vaultPath !== prevVault) kb.reindex(); // 库路径变了重建索引
  return saved;
});

// 悬浮窗停留控制（渲染层悬停/改错时保留，超时或松开后自己请求隐藏）
ipcMain.handle('indicator:hide', () => { if (indicator && !indicator.isDestroyed()) indicator.hide(); });

// 自绘标题栏按钮（frame:false 的设置/词库/修正窗）
ipcMain.on('win:control', (e, action) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  if (action === 'minimize') win.minimize();
  else if (action === 'close') win.close();
});

// 快速修正（L1 学习）IPC
ipcMain.handle('correction:open', () => { createCorrectionWindow(); if (indicator) indicator.hide(); });
ipcMain.handle('correction:last', () => lastResult);
ipcMain.handle('terms:learn', (_e, { wrong, right }) => { terms.learnCorrection(wrong, right); return terms.getLibrary(); });
ipcMain.handle('terms:removeCorrection', (_e, wrong) => { terms.removeCorrection(wrong); return terms.getLibrary(); });

function createCorrectionWindow() {
  if (correctionWin && !correctionWin.isDestroyed()) { correctionWin.show(); correctionWin.focus(); correctionWin.webContents.send('refresh'); return; }
  correctionWin = new BrowserWindow({
    width: 480, height: 460, title: '快速修正',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#161311' : '#f5f2ec',
    frame: false,
    webPreferences: { preload: path.join(__dirname, '..', 'renderer', 'preload.js') },
  });
  correctionWin.setMenuBarVisibility(false);
  correctionWin.loadFile(path.join(__dirname, '..', 'renderer', 'correction.html'));
}

// 专名词库 IPC
ipcMain.handle('termlib:open', () => createTermlibWindow());
ipcMain.handle('terms:library', () => terms.getLibrary());
ipcMain.handle('terms:save', (_e, patch) => terms.saveLibrary(patch));
// 从知识库建议专名：大候选池(含中低频专名) → LLM 分批过滤成真专名，尽量高覆盖
async function llmFilterProperNouns(candidates) {
  const ep = provider.endpoint(); // 云服务或 BYOK 均可
  const resp = await fetch(`${ep.baseURL}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...ep.headers },
    body: JSON.stringify({
      model: config.polish.model, max_tokens: 2000, temperature: 0,
      enable_thinking: false, thinking: { type: 'disabled' },
      messages: [{
        role: 'user',
        content: '下面是从用户笔记里挑出的候选词。只保留真正的专有名词——人名、公司/品牌名、产品名、项目名、地名、专业术语、行业黑话、英文技术词。规则：①去掉普通词汇、动词、形容词。②去掉残缺片段——若一个词是另一个更完整词的一部分（如「宸」是「星宸」的片段、「电商经」「营方法论」是句子截断），丢弃片段只留完整专名。③每个词必须能独立成立、是人能一眼认出的名字或术语。直接返回 JSON 字符串数组，不要解释。\n候选：' + JSON.stringify(candidates),
      }],
    }),
  });
  const data = await resp.json();
  const txt = data?.choices?.[0]?.message?.content || '[]';
  const m = txt.match(/\[[\s\S]*\]/);
  return m ? JSON.parse(m[0]) : [];
}
ipcMain.handle('terms:suggest', async () => {
  const raw = names.suggestRaw(900); // 大池，含中低频专名（云杉/星宸这类）
  if (!raw.length) return { terms: [], note: '知识库为空或未建索引' };
  const cands = raw.map((r) => r.term);
  const CHUNK = 300;
  const out = new Set();
  try {
    for (let i = 0; i < cands.length; i += CHUNK) {
      const part = await llmFilterProperNouns(cands.slice(i, i + CHUNK));
      for (const t of part) if (typeof t === 'string' && t.trim()) out.add(t.trim());
    }
    return { terms: [...out] };
  } catch (e) {
    if (out.size) return { terms: [...out], note: '部分完成：' + e.message };
    return { terms: raw.slice(0, 80).map((r) => r.term), note: 'LLM 过滤失败，返回词频候选：' + e.message };
  }
});

function createTermlibWindow() {
  if (termlibWin && !termlibWin.isDestroyed()) { termlibWin.show(); termlibWin.focus(); return; }
  termlibWin = new BrowserWindow({
    width: 560, height: 640, title: '专名词库',
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#161311' : '#f5f2ec',
    frame: false,
    webPreferences: { preload: path.join(__dirname, '..', 'renderer', 'preload.js') },
  });
  termlibWin.setMenuBarVisibility(false);
  termlibWin.loadFile(path.join(__dirname, '..', 'renderer', 'termlib.html'));
}

// 知识库 IPC
ipcMain.handle('kb:status', () => kb.status());
ipcMain.handle('kb:reindex', () => kb.reindex());
// 选择知识库文件夹（交付给别人时，无需手打路径，选完自动建索引）
ipcMain.handle('kb:pickFolder', async () => {
  const win = settingsWin && !settingsWin.isDestroyed() ? settingsWin : undefined;
  const r = await dialog.showOpenDialog(win, {
    title: '选择你的知识库文件夹（Obsidian 库或任意含 .md/.txt 的目录）',
    properties: ['openDirectory'],
  });
  if (r.canceled || !r.filePaths.length) return { canceled: true };
  const vaultPath = r.filePaths[0];
  settings.save({ kbVaultPath: vaultPath }); // 落盘 + apply 到 config
  const status = kb.reindex();               // 立即建索引
  return { canceled: false, vaultPath, status };
});
// 云服务今日额度
ipcMain.handle('provider:quota', () => provider.quota());

// 测试连接：BYOK 测用户端点；未填 key 则测云服务（百灵云额度）
ipcMain.handle('settings:test', async (_e, opts = {}) => {
  const key = (opts.apiKey || config.polish.apiKey || '').trim();
  const t0 = Date.now();
  if (!key) {
    try {
      const q = await provider.quota();
      if (!q) return { ok: false, error: '云服务连接失败' };
      return { ok: true, ms: Date.now() - t0, cloud: true, remaining: q.remaining };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }
  try {
    const resp = await fetch(`${config.polish.baseURL}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: (opts.model || config.polish.model),
        max_tokens: 8,
        enable_thinking: false,
        thinking: { type: 'disabled' },
        messages: [{ role: 'user', content: '说“好”一个字' }],
      }),
    });
    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      return { ok: false, error: `HTTP ${resp.status} ${t.slice(0, 80)}` };
    }
    await resp.json();
    return { ok: true, ms: Date.now() - t0 };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    { label: '百灵 Mynah · 语音输入', enabled: false },
    { label: `唤起键：${config.hotkey}`, enabled: false },
    { type: 'separator' },
    { label: '设置…（改快捷键）', click: () => createSettingsWindow() },
    { label: '修正上一句…（教它写对）', click: () => createCorrectionWindow() },
    { label: '专名词库…（让它写对你的名字）', click: () => createTermlibWindow() },
    { label: '新手引导', click: () => createWelcomeWindow() },
    { label: '退出', click: () => app.quit() },
  ]);
}

function createTray() {
  try {
    const img = nativeImage.createFromDataURL(TRAY_ICON);
    tray = new Tray(img);
  } catch (e) {
    console.error('托盘创建失败:', e.message);
    return;
  }
  tray.setToolTip('百灵 Mynah · 语音输入（点此打开设置）');
  tray.setContextMenu(buildTrayMenu());
  // 左键单击 / 双击都打开设置，避免用户找不到入口
  tray.on('click', () => createSettingsWindow());
  tray.on('double-click', () => createSettingsWindow());
}

app.whenReady().then(() => {
  settings.apply(settings.load()); // 启动时把用户设置叠加到 config
  createIndicator();
  createTray();
  kb.warmup(); // 后台预建知识库索引
  names.warmup(); // 后台预建专名候选索引
  const mode = registerHotkey();
  const modeDesc = mode === 'dual' ? '双模式(按住说话/短按切换)' : mode === 'toggle' ? '切换式(uiohook不可用回退)' : '注册失败';
  console.log(`百灵已就绪。热键 ${config.hotkey} · ${modeDesc}。ASR=${config.asr.provider} 润色=${config.polish.model}(润色${config.polish.enabled ? '开' : '关'}) 接入方=${config.provider.mode}`);
  if (!settings.load().onboarded) createWelcomeWindow(); // 首启引导
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  hotkey.stop();
});
app.on('window-all-closed', (e) => e.preventDefault()); // 常驻后台，不随窗口关闭退出
