'use strict';
// 设置页交互：加载/保存设置、快捷键捕获、密钥显隐、测试连接。
const $ = (id) => document.getElementById(id);
const hotkeyEl = $('hotkey');
const asrEl = $('asrProvider');
const polishSwitch = $('polishEnabled');
const autoPasteSwitch = $('autoPaste');
const autoSceneSwitch = $('autoScene');
const structureSwitch = $('structureMode');
const polishModelEl = $('polishModel');
const sceneEl = $('defaultScene');
const apiKeyEl = $('apiKey');
const kbSwitch = $('kbEnabled');
const kbVaultEl = $('kbVaultPath');

let state = {};

// 把内部 token 显示成友好文字
const PRETTY = {
  RightCtrl: '右 Ctrl', LeftCtrl: '左 Ctrl', RightAlt: '右 Alt', LeftAlt: '左 Alt',
  RightShift: '右 Shift', LeftShift: '左 Shift', RightMeta: '右 Win', LeftMeta: '左 Win',
  Ctrl: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Meta: 'Win',
  Space: '空格', Enter: '回车', Tab: 'Tab', Escape: 'Esc', Backspace: '退格', CapsLock: 'CapsLock',
  ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→',
  Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", Backquote: '`',
  BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=',
  Home: 'Home', End: 'End', PageUp: 'PgUp', PageDown: 'PgDn', Insert: 'Ins', Delete: 'Del',
};
function prettyToken(t) {
  if (PRETTY[t]) return PRETTY[t];
  if (/^Numpad(\d)$/.test(t)) return '小键盘 ' + t.slice(6);
  if (/^Numpad/.test(t)) return t.replace('Numpad', '小键盘 ');
  return t; // A-Z / 0-9 / F1-F24
}
const prettify = (h) => (h ? h.split('+').map(prettyToken).join(' + ') : '');

function render() {
  hotkeyEl.value = prettify(state.hotkey);
  asrEl.value = state.asrProvider || 'mimo';
  polishSwitch.classList.toggle('on', state.polishEnabled !== false);
  autoPasteSwitch.classList.toggle('on', state.autoPaste !== false);
  autoSceneSwitch.classList.toggle('on', state.autoScene !== false);
  structureSwitch.classList.toggle('on', state.structureMode === true);
  polishModelEl.value = state.polishModel || '';
  sceneEl.value = state.defaultScene || 'default';
  apiKeyEl.value = state.apiKey || '';
  kbSwitch.classList.toggle('on', state.kbEnabled !== false);
  kbVaultEl.value = state.kbVaultPath || '';
}

// 用物理键位 e.code 捕获（不受 NumLock/布局/Shift 影响，小键盘、方向键、标点、左右修饰键都可绑）
const MODCODE = { ControlLeft: 'LeftCtrl', ControlRight: 'RightCtrl', AltLeft: 'LeftAlt', AltRight: 'RightAlt',
  ShiftLeft: 'LeftShift', ShiftRight: 'RightShift', MetaLeft: 'LeftMeta', MetaRight: 'RightMeta' };
const MODPREFIX = { ControlLeft: 'Ctrl', ControlRight: 'Ctrl', AltLeft: 'Alt', AltRight: 'Alt',
  ShiftLeft: 'Shift', ShiftRight: 'Shift', MetaLeft: 'Meta', MetaRight: 'Meta' };

// e.code -> uiohook 键名主键
function mainFromCode(code) {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);   // KeyA -> A
  if (/^Digit[0-9]$/.test(code)) return code.slice(5); // Digit0 -> 0
  return code; // Numpad0 / ArrowUp / F5 / Space / Enter / Comma / Home ...
}

hotkeyEl.addEventListener('click', () => {
  hotkeyEl.classList.add('capturing');
  hotkeyEl.value = '请按下快捷键…';
  const mods = new Set();
  let done = false;

  const finish = (token) => {
    if (done) return;
    done = true;
    state.hotkey = token;
    hotkeyEl.value = prettify(token);
    hotkeyEl.classList.remove('capturing');
    window.removeEventListener('keydown', onDown, true);
    window.removeEventListener('keyup', onUp, true);
  };

  const onDown = (e) => {
    e.preventDefault();
    if (MODCODE[e.code]) { mods.add(e.code); return; } // 修饰键：先记着，等主键或松开
    // 主键：拼「修饰键 + 主键」组合
    const order = ['Ctrl', 'Alt', 'Shift', 'Meta'];
    const prefixes = [...new Set([...mods].map((c) => MODPREFIX[c]))];
    const sorted = order.filter((o) => prefixes.includes(o));
    finish([...sorted, mainFromCode(e.code)].join('+'));
  };
  const onUp = (e) => {
    e.preventDefault();
    // 只按了一个修饰键就松开 -> 该修饰键作为独立触发键（左右都支持）
    if (!done && MODCODE[e.code] && mods.size === 1 && mods.has(e.code)) {
      finish(MODCODE[e.code]);
    }
  };
  window.addEventListener('keydown', onDown, true);
  window.addEventListener('keyup', onUp, true);
});

polishSwitch.addEventListener('click', () => {
  state.polishEnabled = !polishSwitch.classList.contains('on');
  polishSwitch.classList.toggle('on', state.polishEnabled);
});

autoPasteSwitch.addEventListener('click', () => {
  state.autoPaste = !autoPasteSwitch.classList.contains('on');
  autoPasteSwitch.classList.toggle('on', state.autoPaste);
});

autoSceneSwitch.addEventListener('click', () => {
  state.autoScene = !autoSceneSwitch.classList.contains('on');
  autoSceneSwitch.classList.toggle('on', state.autoScene);
});

structureSwitch.addEventListener('click', () => {
  state.structureMode = !structureSwitch.classList.contains('on');
  structureSwitch.classList.toggle('on', state.structureMode);
});

kbSwitch.addEventListener('click', () => {
  state.kbEnabled = !kbSwitch.classList.contains('on');
  kbSwitch.classList.toggle('on', state.kbEnabled);
});

// 选择知识库文件夹（选完自动建索引）
$('kbPickBtn').addEventListener('click', async () => {
  const msg = $('kbMsg');
  const r = await window.bailingSettings.kbPickFolder();
  if (r.canceled) return;
  kbVaultEl.value = r.vaultPath;
  state.kbVaultPath = r.vaultPath;
  if (r.status && r.status.chunks) {
    msg.className = 'test-msg ok';
    msg.textContent = `已索引 ${r.status.files} 篇 · ${r.status.chunks} 块 · ${r.status.ms}ms`;
  } else {
    msg.className = 'test-msg err';
    msg.textContent = '该目录没找到 .md/.txt 内容';
  }
});

// 重建知识库索引
$('kbReindexBtn').addEventListener('click', async () => {
  const msg = $('kbMsg');
  msg.className = 'test-msg run'; msg.textContent = '索引中…';
  // 先保存当前路径再重建
  state.kbVaultPath = kbVaultEl.value.trim();
  await window.bailingSettings.save(state);
  const s = await window.bailingSettings.kbReindex();
  if (s && s.chunks) {
    msg.className = 'test-msg ok';
    msg.textContent = `已索引 ${s.files} 篇 · ${s.chunks} 块 · ${s.ms}ms`;
  } else {
    msg.className = 'test-msg err';
    msg.textContent = '未索引到内容（检查库路径）';
  }
});

$('openTermlib').addEventListener('click', () => window.bailingSettings.openTermlib());

// 密钥显隐
$('toggleKey').addEventListener('click', () => {
  apiKeyEl.type = apiKeyEl.type === 'password' ? 'text' : 'password';
});

// 测试连接
$('testBtn').addEventListener('click', async () => {
  const msg = $('testMsg');
  msg.className = 'test-msg run';
  msg.textContent = '正在测试…';
  const r = await window.bailingSettings.test({ apiKey: apiKeyEl.value.trim(), model: polishModelEl.value.trim() });
  if (r.ok) {
    msg.className = 'test-msg ok';
    msg.textContent = `连接正常 · ${r.ms}ms`;
  } else {
    msg.className = 'test-msg err';
    msg.textContent = r.error || '连接失败';
  }
});

$('save').addEventListener('click', async () => {
  state.asrProvider = asrEl.value;
  state.polishModel = polishModelEl.value.trim();
  state.defaultScene = sceneEl.value;
  state.apiKey = apiKeyEl.value.trim();
  state.kbVaultPath = kbVaultEl.value.trim();
  await window.bailingSettings.save(state);
  const s = $('saved');
  s.classList.add('show');
  setTimeout(() => s.classList.remove('show'), 1600);
});

(async () => {
  state = await window.bailingSettings.load();
  render();
  // 显示当前索引状态
  try {
    const s = await window.bailingSettings.kbStatus();
    if (s && s.chunks) $('kbMsg').textContent = `已索引 ${s.files} 篇 · ${s.chunks} 块`;
  } catch (_) {}
})();
