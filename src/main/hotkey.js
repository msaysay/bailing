'use strict';
// 全局热键：短按/长按双模式（按住说话 + 短按切换录音）。
// 用 uiohook-napi 拿到 keydown/keyup（globalShortcut 只有 press 没有 release，做不了按住式）。
// 若 uiohook 不可用，回退到 globalShortcut 切换式（由 main.js 兜底）。

let uiohook = null;
let UiohookKey = null;
try {
  const mod = require('uiohook-napi');
  uiohook = mod.uIOhook;
  UiohookKey = mod.UiohookKey;
} catch (_) {
  uiohook = null;
}

const HOLD_MS = 250; // 超过判为「长按=按住说话」，以内判为「短按=切换」

// 解析 Electron accelerator -> { ctrl, alt, shift, meta, keycode }
function parseAccelerator(acc) {
  const parts = String(acc).split('+').map((p) => p.trim());
  const need = { ctrl: false, alt: false, shift: false, meta: false, keycode: null };
  for (const p of parts) {
    const low = p.toLowerCase();
    if (['commandorcontrol', 'control', 'ctrl', 'cmdorctrl'].includes(low)) need.ctrl = true;
    else if (low === 'alt' || low === 'option') need.alt = true;
    else if (low === 'shift') need.shift = true;
    else if (['super', 'meta', 'command', 'cmd', 'win'].includes(low)) need.meta = true;
    else need.keycode = keyToCode(p);
  }
  return need;
}

// 单修饰键（作为独立触发键，如「右 Ctrl 按住说话」）
const LONE = {
  RightCtrl: 'CtrlRight', LeftCtrl: 'Ctrl',
  RightAlt: 'AltRight', LeftAlt: 'Alt',
  RightShift: 'ShiftRight', LeftShift: 'Shift',
  RightMeta: 'MetaRight', LeftMeta: 'Meta',
};
// 标点等字符 -> uiohook 键名（setting 捕获给的是字符本身）
const PUNCT = {
  ',': 'Comma', '.': 'Period', '/': 'Slash', ';': 'Semicolon', '=': 'Equal',
  '-': 'Minus', '`': 'Backquote', '[': 'BracketLeft', ']': 'BracketRight',
  '\\': 'Backslash', "'": 'Quote',
};

function keyToCode(k) {
  if (!UiohookKey || !k) return null;
  if (LONE[k]) return UiohookKey[LONE[k]];
  if (PUNCT[k]) return UiohookKey[PUNCT[k]];
  // 直接匹配 uiohook 键名：A-Z / 0-9 / Space Enter Tab Escape Backspace CapsLock
  //   ArrowUp/Down/Left/Right / Home End PageUp PageDown Insert Delete / F1-F24 等
  if (UiohookKey[k] != null) return UiohookKey[k];
  const up = k.length === 1 ? k.toUpperCase() : k;
  return UiohookKey[up] != null ? UiohookKey[up] : null;
}

function modsSatisfied(need, e) {
  return (!need.ctrl || e.ctrlKey) && (!need.alt || e.altKey) &&
         (!need.shift || e.shiftKey) && (!need.meta || e.metaKey);
}

let state = 'idle'; // idle | ptt-recording | toggle-recording
let pressedAt = 0;
let holdTimer = null;

/**
 * @param {string} accelerator
 * @param {{onStart:(mode:string)=>void, onStop:()=>void}} cbs
 * @returns {boolean} 是否启用了双模式（false=需 main.js 回退）
 */
function start(accelerator, cbs) {
  if (!uiohook) return false;
  const need = parseAccelerator(accelerator);
  if (need.keycode == null) return false;

  uiohook.removeAllListeners('keydown');
  uiohook.removeAllListeners('keyup');
  state = 'idle';

  uiohook.on('keydown', (e) => {
    if (e.keycode !== need.keycode || !modsSatisfied(need, e)) return;
    if (state !== 'idle') return;   // 录音中，忽略
    if (holdTimer) return;          // 系统按键自动重复的 keydown，忽略
    pressedAt = Date.now();
    holdTimer = setTimeout(() => {
      holdTimer = null;
      // 到阈值仍按着 -> 长按=按住说话，开始录音
      if (state === 'idle') { state = 'ptt-recording'; cbs.onStart('ptt'); }
    }, HOLD_MS);
  });

  uiohook.on('keyup', (e) => {
    if (e.keycode !== need.keycode) return;
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    const dur = Date.now() - pressedAt;
    if (state === 'ptt-recording') {
      state = 'idle';
      cbs.onStop(); // 松开结束按住说话
    } else if (state === 'toggle-recording') {
      state = 'idle';
      cbs.onStop(); // 再次短按结束持续录音
    } else if (state === 'idle' && dur < HOLD_MS) {
      state = 'toggle-recording';
      cbs.onStart('toggle'); // 短按开始持续录音
    }
  });

  try {
    uiohook.start();
    return true;
  } catch (_) {
    return false;
  }
}

function stop() {
  if (!uiohook) return;
  try { uiohook.stop(); } catch (_) {}
}

module.exports = { start, stop, available: () => !!uiohook, HOLD_MS };
