'use strict';
// 生成百灵图标：宣纸墨朱 · 白描线条鸟。
// 用法：npx electron scripts/gen-icons.js
// 产物：
//   src/renderer/bird-badge.png  512   墨圆底 + 宣纸线条鸟（悬浮窗/各处头像）
//   build/icon.png              1024   宣纸 squircle 托 + 墨圆鸟标（应用图标·大图场景）
//   build/icon.ico         16~256 多档  尺寸自适应多分辨率 ICO（桌面/任务栏/开始菜单，小尺寸加粗放大不糊）
//   src/renderer/tray.png         64   墨圆鸟标（托盘），并自动重写 src/main/tray-icon.js 的 base64
// 鸟形与 indicator.html / settings.html 内联 SVG 同源，改鸟要三处同步。
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const INK = '#2a2723';
const PAPER = '#faf7f1';
const ZHU = '#c8402a';

// 白描鸟：闭合圆身（背→冠→喙→喉→腹）+ 外卷尾 + 朱砂眼（viewBox 0 0 48 48）
function birdStrokes(line, eye, stroke) {
  return `
    <g fill="none" stroke="${line}" stroke-width="${stroke}" stroke-linecap="round" stroke-linejoin="round">
      <path d="M36 28 Q38 16 27 12 Q18.5 8.8 13.8 15.5 L8.8 18.6 L13.6 20.6 Q13 30 21.5 33.5 Q29 36 36 28" />
      <path d="M36 28 Q42 27 41.5 22 Q41 18.5 38 20.5" />
    </g>
    <circle cx="18" cy="16.5" r="1.7" fill="${eye}" />`;
}

// 墨圆鸟标（full-bleed 圆，透明底）
function badgeSvg(size, stroke) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 48 48">
    <circle cx="24" cy="24" r="24" fill="${INK}" />
    ${birdStrokes(PAPER, ZHU, stroke)}
  </svg>`;
}

// 尺寸自适应参数：小尺寸线条加粗、墨圆和鸟放大（不然缩到 16~48px 糊成一团）
function adapt(size) {
  if (size >= 256) return { stroke: 2.2, inkRatio: 0.62, birdRatio: 0.72 };
  if (size >= 128) return { stroke: 2.6, inkRatio: 0.66, birdRatio: 0.74 };
  if (size >= 64)  return { stroke: 3.0, inkRatio: 0.72, birdRatio: 0.78 };
  if (size >= 48)  return { stroke: 3.4, inkRatio: 0.78, birdRatio: 0.80 };
  return { stroke: 3.8, inkRatio: 0.84, birdRatio: 0.82 };
}

// 应用图标：宣纸 squircle 托 + 居中墨圆鸟标
function appIconSvg(size) {
  const { stroke, inkRatio, birdRatio } = adapt(size);
  const rx = Math.round(size * 0.225);
  const d = Math.round(size * inkRatio);   // 墨圆直径
  const o = Math.round((size - d) / 2);    // 居中偏移
  const inner = Math.round(d * birdRatio); // 鸟形尺寸
  const io = o + Math.round((d - inner) / 2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect x="0" y="0" width="${size}" height="${size}" rx="${rx}" fill="${PAPER}" />
    <circle cx="${size / 2}" cy="${size / 2}" r="${d / 2}" fill="${INK}" />
    <svg x="${io}" y="${io}" width="${inner}" height="${inner}" viewBox="0 0 48 48">
      ${birdStrokes(PAPER, ZHU, stroke)}
    </svg>
  </svg>`;
}

// 渲染 SVG → nativeImage（窗口最小 512，太小 Windows 会撑回最小尺寸导致裁切；小图渲染后缩放）
async function renderImg(win, svg, size) {
  const winSize = Math.max(size, 512);
  const scaled = svg.replace(/width="\d+" height="\d+"/, `width="${winSize}" height="${winSize}"`);
  const html = `<!doctype html><html><body style="margin:0;background:transparent">${scaled}</body></html>`;
  const tmp = path.join(app.getPath('temp'), 'bailing-icon-gen.html');
  fs.writeFileSync(tmp, html);
  win.setSize(winSize, winSize);
  await win.loadFile(tmp);
  await new Promise((r) => setTimeout(r, 200));
  let img = await win.webContents.capturePage();
  if (img.getSize().width !== size) img = img.resize({ width: size, height: size, quality: 'best' });
  return img;
}

// 打包多分辨率 ICO（PNG 压缩条目，Vista+ 标准格式）
function packIco(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(images.length, 4);
  let offset = 6 + 16 * images.length;
  const entries = images.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); e.writeUInt8(0, 3);
    e.writeUInt16LE(1, 4); e.writeUInt16LE(32, 6);
    e.writeUInt32LE(png.length, 8); e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });
  return Buffer.concat([header, ...entries, ...images.map((i) => i.png)]);
}

app.whenReady().then(async () => {
  // 复用一个隐藏窗（这台机器上连续建第二个窗会加载失败），逐任务调尺寸
  const win = new BrowserWindow({
    width: 512, height: 512, show: false, frame: false,
    transparent: true, backgroundColor: '#00000000',
    webPreferences: { backgroundThrottling: false },
  });
  const save = (img, out, size) => {
    fs.writeFileSync(out, img.toPNG());
    console.log('生成', path.relative(ROOT, out), `${size}x${size}`);
  };
  try {
    save(await renderImg(win, badgeSvg(512, 2.2), 512), path.join(ROOT, 'src/renderer/bird-badge.png'), 512);
    save(await renderImg(win, appIconSvg(1024), 1024), path.join(ROOT, 'build/icon.png'), 1024);
    save(await renderImg(win, badgeSvg(512, 2.8), 64), path.join(ROOT, 'src/renderer/tray.png'), 64);

    // 多分辨率 ICO（每档尺寸自适应）
    const icoSizes = [256, 128, 64, 48, 32, 24, 16];
    const images = [];
    for (const size of icoSizes) {
      const img = await renderImg(win, appIconSvg(size), size);
      images.push({ size, png: img.toPNG() });
    }
    fs.writeFileSync(path.join(ROOT, 'build/icon.ico'), packIco(images));
    console.log('生成 build/icon.ico（' + icoSizes.join('/') + '）');
    // 留一张 32px 预览方便目检小尺寸效果
    fs.writeFileSync(path.join(ROOT, 'build/icon-preview-32.png'), images.find((i) => i.size === 32).png);
  } finally {
    win.destroy();
  }

  // 托盘 base64 必须脚本读 PNG 重写（手贴会截断）
  const trayPng = fs.readFileSync(path.join(ROOT, 'src/renderer/tray.png'));
  const dataUrl = 'data:image/png;base64,' + trayPng.toString('base64');
  const trayJs = `'use strict';
// 托盘图标（内嵌 base64）。宣纸墨朱·白描鸟。由 scripts/gen-icons.js 生成，勿手改。
module.exports = '${dataUrl}';
`;
  fs.writeFileSync(path.join(ROOT, 'src/main/tray-icon.js'), trayJs);
  console.log('重写 src/main/tray-icon.js（base64', dataUrl.length, '字符）');

  app.quit();
});
