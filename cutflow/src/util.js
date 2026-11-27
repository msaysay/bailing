// 跨平台小工具：找 python、读 JSON
const { execFileSync } = require('child_process'), fs = require('fs');
let _py;
exports.python = () => {
  if (_py) return _py;
  for (const c of [process.env.PYTHON, 'python3', 'python', 'py'].filter(Boolean)) { try { execFileSync(c, ['-c', 'import sys;assert sys.version_info>=(3,9)'], { stdio: 'ignore' }); return (_py = c); } catch (_) {} }
  throw new Error('找不到 Python 3.9+（可用环境变量 PYTHON 指定路径）');
};
exports.J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
/** 开浏览器：先用 Playwright 自带的；没下到（国内网络常见）就用电脑上已有的 Chrome / Edge / Chromium，或环境变量 CHROME_PATH 指的那个。 */
exports.launch = async pw => {
  try { return await pw.chromium.launch(); } catch (e) {
    const glob = d => { try { return fs.readdirSync(d).filter(x => /^chromium-\d+$/.test(x)).map(x => [`${d}/${x}/chrome-linux/chrome`, `${d}/${x}/chrome-linux64/chrome`]).flat(); } catch (_) { return []; } };
    const cands = [process.env.CHROME_PATH, ...glob('/opt/pw-browsers'), '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge', 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser'].filter(p => p && fs.existsSync(p));
    for (const p of cands) { try { return await pw.chromium.launch({ executablePath: p }); } catch (_) {} }
    throw e;
  }
};
exports.playwright = () => { for (const m of ['playwright', 'playwright-core', '/opt/node-tools/node_modules/playwright']) { try { return require(m); } catch (_) {} } throw new Error('缺少 playwright：在本目录执行 npm install && npx playwright install chromium'); };
