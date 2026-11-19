// 环境自检：node tools/doctor.js        只检查
//          node tools/doctor.js --fix  能自动装的直接装（国内网络会自动换镜像重试）
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..'), FIX = process.argv.includes('--fix'), WIN = process.platform === 'win32';
const run = (cmd, args, env = {}) => spawnSync(cmd, args, { cwd: ROOT, stdio: 'inherit', shell: WIN, env: Object.assign({}, process.env, env) });
const out = (cmd, args) => { try { const r = spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8', shell: WIN }); return r.status === 0 ? (r.stdout || '') + (r.stderr || '') : null; } catch (e) { return null; } };
const res = [];
function ok(name, good, tip) { res.push([name, good, tip]); console.log(`${good ? '✓' : '✗'} ${name}${good ? '' : '\n    → ' + tip}`); }
const CN_NPM = { npm_config_registry: 'https://registry.npmmirror.com', FFMPEG_BINARIES_URL: 'https://cdn.npmmirror.com/binaries/ffmpeg-static', PLAYWRIGHT_DOWNLOAD_HOST: 'https://npmmirror.com/mirrors/playwright', PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' };

(async () => {
  console.log('== AI MV 工具包 · 环境自检 ==\n');
  // 1. Node
  const nv = +process.versions.node.split('.')[0];
  ok(`Node.js ${process.versions.node}`, nv >= 18, '需要 Node.js 18 以上：到 https://nodejs.org/zh-cn 下载 LTS 版安装，装完重开终端');

  // 2. npm 依赖（playwright、ffmpeg-static）
  const has = m => { try { require.resolve(m, { paths: [ROOT] }); return true; } catch (e) { return false; } };
  if (FIX && !(has('playwright') && has('ffmpeg-static'))) {
    console.log('  安装 npm 依赖……'); let r = run('npm', ['install', '--no-audit', '--no-fund'], { PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: '1' });
    if (r.status !== 0 || !has('ffmpeg-static')) { console.log('  换国内镜像重试……'); run('npm', ['install', '--no-audit', '--no-fund'], CN_NPM); }
  }
  ok('npm 依赖（playwright、ffmpeg-static）', has('playwright') && has('ffmpeg-static'), '在工具包文件夹里运行：npm install（国内网络：npm install --registry=https://registry.npmmirror.com）');

  // 3. ffmpeg
  let ff = 'ffmpeg'; try { ff = require(require.resolve('ffmpeg-static', { paths: [ROOT] })) || 'ffmpeg'; } catch (e) { }
  ok('ffmpeg（合成视频用）', !!out(ff, ['-version']), 'ffmpeg-static 没装好。重跑 node tools/doctor.js --fix；或自己装 ffmpeg 并加到 PATH');

  // 4. 浏览器
  let br = false, which = '';
  if (has('playwright')) {
    const { launch } = require('./browser');
    const tryLaunch = async () => { try { const b = await launch(); which = b.version(); await b.close(); return true; } catch (e) { return false; } };
    br = await tryLaunch();
    if (!br && FIX) { console.log('  下载 Chromium……'); let r = run('npx', ['playwright', 'install', 'chromium']); if (r.status !== 0) { console.log('  换国内镜像重试……'); run('npx', ['playwright', 'install', 'chromium'], { PLAYWRIGHT_DOWNLOAD_HOST: CN_NPM.PLAYWRIGHT_DOWNLOAD_HOST }); } br = await tryLaunch(); }
  }
  ok('浏览器（画画面用）' + (which ? ' ' + which : ''), br, 'Windows 自带的 Edge 一般就能用；不行就运行 npx playwright install chromium（国内先设置环境变量 PLAYWRIGHT_DOWNLOAD_HOST=https://npmmirror.com/mirrors/playwright）');

  // 5. 字体
  const fonts = ['NotoSerifSC-700.ttf', 'MaShanZheng.ttf', 'ZhiMangXing.ttf'].filter(f => !fs.existsSync(path.join(ROOT, 'fonts', f)));
  ok('字体（思源宋体、马善政、志莽行）', !fonts.length, '缺 ' + fonts.join('、') + '：从 Google Fonts 下载（Noto Serif SC 粗体、Ma Shan Zheng、Zhi Mang Xing），放进 fonts 文件夹，文件名照上面改');

  // 6. Python 和听写依赖
  let py = null; for (const c of WIN ? ['python', 'py', 'python3'] : ['python3', 'python']) { const v = out(c, ['--version']); if (v && /Python 3\.(9|1\d)/.test(v)) { py = c; break; } }
  ok('Python 3.9+' + (py ? `（${py}）` : ''), !!py, '到 https://www.python.org/downloads/ 装 Python 3.11 或 3.12（Windows 安装时勾选 Add python.exe to PATH）');
  if (py) {
    const imp = () => out(py, ['-c', 'import faster_whisper, librosa, soundfile']) !== null;
    let good = imp();
    if (!good && FIX) {
      console.log('  安装 Python 依赖（约 300MB）……'); let r = run(py, ['-m', 'pip', 'install', '-r', 'requirements.txt']);
      if (r.status !== 0 || !imp()) { console.log('  换清华镜像重试……'); run(py, ['-m', 'pip', 'install', '-r', 'requirements.txt', '-i', 'https://pypi.tuna.tsinghua.edu.cn/simple']); }
      good = imp();
    }
    ok('Python 依赖（faster-whisper、librosa）', good, `运行：${py} -m pip install -r requirements.txt（国内加 -i https://pypi.tuna.tsinghua.edu.cn/simple）`);
  }

  const bad = res.filter(r => !r[1]);
  console.log('\n' + (bad.length ? `还差 ${bad.length} 项。${FIX ? '按上面 → 后面的办法处理，处理完再跑一次 node tools/doctor.js' : '先运行 node tools/doctor.js --fix 自动装一遍'}` : '全部就绪，可以开始做 MV 了。'));
  console.log('提示：听写歌词第一次会下载约 3GB 的模型；下载不动会自动换国内镜像 hf-mirror.com。');
  process.exit(bad.length ? 1 : 0);
})();
