'use strict';
// 预览首启引导窗四步截图：npx electron scripts/preview-welcome.js → build/preview-welcome-*.png
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 560, height: 660, show: false,
    backgroundColor: '#f5f2ec',
    webPreferences: {
      preload: path.join(ROOT, 'src/renderer/preload.js'),
      backgroundThrottling: false,
    },
  });
  await win.loadFile(path.join(ROOT, 'src/renderer/welcome.html'));
  await new Promise((r) => setTimeout(r, 400));
  for (let i = 0; i < 4; i++) {
    await win.webContents.executeJavaScript(`show(${i})`);
    await new Promise((r) => setTimeout(r, 250));
    const img = await win.webContents.capturePage();
    fs.writeFileSync(path.join(ROOT, 'build', `preview-welcome-${i}.png`), img.toPNG());
    console.log('生成 build/preview-welcome-' + i + '.png');
  }
  win.destroy();
  app.quit();
});
