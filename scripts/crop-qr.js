'use strict';
// 从微信分享卡里裁出纯二维码：npx electron scripts/crop-qr.js
const { app, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

app.whenReady().then(() => {
  const img = nativeImage.createFromPath(path.join(ROOT, 'site/assets/qr.jpg'));
  const { width, height } = img.getSize();
  console.log('原图', width, 'x', height);
  // 微信分享卡：二维码约在纵向 26%~82%，居中。留出空白边
  const size = Math.round(width * 0.74);
  const x = Math.round((width - size) / 2);
  const y = Math.round(height * 0.255);
  const cropped = img.crop({ x, y, width: size, height: size });
  fs.writeFileSync(path.join(ROOT, 'site/assets/qr.png'), cropped.toPNG());
  console.log('生成 site/assets/qr.png', size, 'x', size);
  app.quit();
});
