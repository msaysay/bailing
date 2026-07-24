'use strict';
// 预览官网整页截图：npx electron scripts/preview-site.js → build/preview-site.png
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

app.whenReady().then(async () => {
  const W = parseInt(process.env.PREVIEW_WIDTH || '900', 10);
  const suffix = W === 900 ? '' : `-${W}`;
  const win = new BrowserWindow({
    width: W, height: 1200, show: false,
    backgroundColor: '#faf7f1',
    webPreferences: { backgroundThrottling: false },
  });
  await win.loadFile(path.join(ROOT, 'site/index.html'));
  await new Promise((r) => setTimeout(r, 500));
  const h = await win.webContents.executeJavaScript('document.body.scrollHeight');
  win.setSize(W, Math.min(h, 12000));
  await new Promise((r) => setTimeout(r, 300));
  const img = await win.webContents.capturePage();
  fs.writeFileSync(path.join(ROOT, 'build', `preview-site${suffix}.png`), img.toPNG());
  console.log(`生成 build/preview-site${suffix}.png`, h, 'px 高');
  win.destroy();
  app.quit();
});
