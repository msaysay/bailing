// 打开渲染页面：优先用 Playwright 自带的 Chromium，没有就用电脑上的 Edge 或 Chrome
const path = require('path'), { pathToFileURL } = require('url');
const ROOT = path.resolve(__dirname, '..');
async function launch() {
  let pw; try { pw = require('playwright'); } catch (e) { pw = require('playwright-core'); }
  const args = ['--allow-file-access-from-files', '--disable-web-security'];
  const tries = [{}, { channel: 'msedge' }, { channel: 'chrome' }];
  if (process.env.MV_BROWSER) tries.unshift({ executablePath: process.env.MV_BROWSER });
  let last;
  for (const t of tries) { try { return await pw.chromium.launch(Object.assign({ args, headless: true }, t)); } catch (e) { last = e; } }
  throw new Error('找不到可用的浏览器。请运行：npx playwright install chromium（国内网络先设置 PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright），或者安装 Edge / Chrome。\n' + (last && last.message.split('\n')[0]));
}
async function openProject(browser, project, fps = 30) {
  const p = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
  const errs = [];
  p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { const t = m.text(); if (/读不到|错误|Error/.test(t)) errs.push(t); });
  const rel = path.relative(path.join(ROOT, 'engine'), path.resolve(project)).split(path.sep).join('/');
  const url = pathToFileURL(path.join(ROOT, 'engine', 'page.html')).href + '?project=' + encodeURIComponent(rel) + '&fps=' + fps;
  await p.goto(url);
  const t0 = Date.now();
  while (!(await p.evaluate(() => window.__mvReady === true).catch(() => false))) {
    if (Date.now() - t0 > 60000 || errs.length) throw new Error('页面没加载起来：' + (errs.join(' | ') || await p.title()));
    await new Promise(r => setTimeout(r, 200));
  }
  if (errs.length) throw new Error('页面报错：' + errs.join(' | '));
  p._errs = errs; return p;
}
function ffmpegPath() { try { const f = require('ffmpeg-static'); if (f && require('fs').existsSync(f)) return f; } catch (e) { } return 'ffmpeg'; }
function projectArg(i = 2) {
  const a = process.argv[i]; if (!a) { console.log('请给出项目文件夹，例如：node tools/preview.js projects/我的歌'); process.exit(1); }
  const p = path.resolve(a); if (!require('fs').existsSync(path.join(p, 'config.js'))) { console.log('这个文件夹里没有 config.js：' + p); process.exit(1); } return p;
}
module.exports = { launch, openProject, ffmpegPath, projectArg, ROOT };
