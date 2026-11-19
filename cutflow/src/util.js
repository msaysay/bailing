// 跨平台小工具：找 python、读 JSON
const { execFileSync } = require('child_process'), fs = require('fs');
let _py;
exports.python = () => {
  if (_py) return _py;
  for (const c of [process.env.PYTHON, 'python3', 'python', 'py'].filter(Boolean)) { try { execFileSync(c, ['-c', 'import sys;assert sys.version_info>=(3,9)'], { stdio: 'ignore' }); return (_py = c); } catch (_) {} }
  throw new Error('找不到 Python 3.9+（可用环境变量 PYTHON 指定路径）');
};
exports.J = f => JSON.parse(fs.readFileSync(f, 'utf8'));
exports.playwright = () => { for (const m of ['playwright', 'playwright-core', '/opt/node-tools/node_modules/playwright']) { try { return require(m); } catch (_) {} } throw new Error('缺少 playwright：在本目录执行 npm install && npx playwright install chromium'); };
