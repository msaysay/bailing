'use strict';
// 预览设置页截图：npx electron scripts/preview-settings.js → build/preview-settings.png
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 520, height: 560, show: false,
    backgroundColor: '#f5f2ec',
    webPreferences: {
      preload: path.join(ROOT, 'src/renderer/preload.js'),
      backgroundThrottling: false,
    },
  });
  await win.loadFile(path.join(ROOT, 'src/renderer/settings.html'));
  await new Promise((r) => setTimeout(r, 400));
  // 注入演示状态（预览窗没有真实 IPC，数据是占位）
  await win.webContents.executeJavaScript(`
    document.getElementById('hotkey').value = '右 Ctrl';
    ['polishEnabled','structureMode','autoPaste','autoScene','kbEnabled'].forEach(id => {
      const el = document.getElementById(id); if (el) el.classList.add('on');
    });
    const kb = document.getElementById('kbVaultPath'); if (kb) kb.value = 'Documents/Obsidian-Vault';
    const msg = document.getElementById('kbMsg'); if (msg) { msg.textContent = '136 篇 · 716 块 · 已就绪'; msg.className = 'test-msg ok'; }
  `);
  await new Promise((r) => setTimeout(r, 150));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ROOT, 'build/preview-settings.png'), img.toPNG());
  console.log('生成 build/preview-settings.png');
  win.destroy();
  app.quit();
});
