#!/usr/bin/env node
/* 一次性环境准备与体检（Windows / macOS / Linux 通用）：node scripts/setup.js
 * 检查 ffmpeg、Python 依赖、Playwright 浏览器，下载四款字体到 fonts/。缺什么会告诉你装什么。 */
const fs = require('fs'), path = require('path'), https = require('https'), { execFileSync } = require('child_process');
const root = path.join(__dirname, '..'), fdir = path.join(root, 'fonts'); fs.mkdirSync(fdir, { recursive: true });
const FONTS = {
  'YouSheBiaoTiHei.ttf': 'https://cdn.jsdelivr.net/npm/@fontpkg/you-she-biao-ti-hei@1.0.0/%E4%BC%98%E8%AE%BE%E6%A0%87%E9%A2%98%E9%BB%91.ttf',
  'ZCOOLQingKeHuangYou.ttf': 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/zcoolqingkehuangyou/ZCOOLQingKeHuangYou-Regular.ttf',
  'AlimamaShuHeiTi-Bold.ttf': 'https://cdn.jsdelivr.net/npm/@fontpkg/alimama-shu-hei-ti@1.0.5/AlimamaShuHeiTi-Bold.ttf',
  'MaShanZheng.ttf': 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/mashanzheng/MaShanZheng-Regular.ttf',
};
const get = (url, file, n = 0) => new Promise((res, rej) => https.get(url, r => {
  if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && n < 5) return res(get(r.headers.location, file, n + 1));
  if (r.statusCode !== 200) return rej(new Error(url + ' → ' + r.statusCode));
  const w = fs.createWriteStream(file + '.part'); r.pipe(w); w.on('finish', () => { fs.renameSync(file + '.part', file); res(); });
}).on('error', rej));
const ok = [], bad = [];
const tryRun = (name, cmd, a, fix) => { try { execFileSync(cmd, a, { stdio: 'ignore' }); ok.push(name); return true; } catch (_) { bad.push(`${name} —— ${fix}`); return false; } };
(async () => {
  for (const [f, u] of Object.entries(FONTS)) { const p = path.join(fdir, f); if (fs.existsSync(p) && fs.statSync(p).size > 5e5) { ok.push('字体 ' + f); continue; } try { await get(u, p); ok.push('字体 ' + f + '（已下载）'); } catch (e) { bad.push(`字体 ${f} 下载失败（${e.message}）—— 手动下载放进 fonts/，文件名保持不变`); } }
  tryRun('ffmpeg', 'ffmpeg', ['-version'], '安装 ffmpeg 6 以上并加入 PATH');
  tryRun('ffprobe', 'ffprobe', ['-version'], '随 ffmpeg 一起安装');
  let py; try { py = require('../src/util').python(); ok.push('Python（' + py + '）'); } catch (e) { bad.push('Python 3.9+ —— 安装后重试，或用环境变量 PYTHON 指定'); }
  if (py) { tryRun('Python 依赖', py, ['-c', 'import numpy, sherpa_onnx, cv2; assert hasattr(cv2, "CascadeClassifier")'], `${py} -m pip install -r requirements.txt`); }
  try { const pw = require('../src/util').playwright(); const b = await pw.chromium.launch(); await b.close(); ok.push('Playwright + Chromium'); } catch (e) { bad.push('Playwright 浏览器 —— 在本目录执行 npm install && npx playwright install chromium'); }
  ok.forEach(x => console.log('  ✓ ' + x)); bad.forEach(x => console.log('  ✗ ' + x));
  console.log(bad.length ? `\n还差 ${bad.length} 项，装好后再跑一次本脚本。` : '\n环境就绪。');
  process.exit(bad.length ? 1 : 0);
})();
