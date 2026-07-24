'use strict';
// 光标处文本注入。策略：结果始终留在剪贴板（不还原），这样即使焦点丢了/找不到输入框，
// 用户也能自己 Ctrl+V（参考微信输入法的语音兜底体验）。若开启自动粘贴则再模拟一次 Ctrl+V。
const { clipboard } = require('electron');

let robot = null;
try {
  robot = require('@nut-tree-fork/nut-js'); // 可选：模拟 Ctrl+V
} catch (_) {
  robot = null;
}

/**
 * @param {string} text
 * @param {{autoPaste?: boolean}} opts
 * @returns {Promise<{pasted:boolean, clipboard:boolean, reason?:string}>}
 */
async function paste(text, opts = {}) {
  if (!text) return { pasted: false, clipboard: false, reason: 'empty' };
  const autoPaste = opts.autoPaste !== false;

  // 1) 结果始终写入剪贴板并保留 —— 找不到输入框时的兜底
  clipboard.writeText(text);

  // 2) 尝试自动粘贴到当前光标
  if (autoPaste && robot && robot.keyboard) {
    try {
      const { keyboard, Key } = robot;
      await keyboard.pressKey(Key.LeftControl, Key.V);
      await keyboard.releaseKey(Key.LeftControl, Key.V);
      return { pasted: true, clipboard: true };
    } catch (e) {
      return { pasted: false, clipboard: true, reason: e.message };
    }
  }
  return { pasted: false, clipboard: true, reason: autoPaste ? 'no-robot' : 'manual' };
}

module.exports = { paste };
