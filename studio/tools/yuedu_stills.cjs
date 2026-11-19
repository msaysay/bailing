// 一次出多张静帧并拼成联系表（只打包一次，比逐张 remotion still 快）。跨平台，由 scripts/frame_render.py 调用。
// 用法：node tools/yuedu_stills.cjs <合成名> <输出.jpg> <props.json 或 -> <帧号,帧号,…> [每行几张=6] [单张=0|1]
const path = require('path'), fs = require('fs'), os = require('os'), { spawnSync } = require('child_process');
const [comp, out, props, frames, colsArg, single] = process.argv.slice(2);
(async () => {
  const { bundle } = require('@remotion/bundler'), { selectComposition, renderStill, openBrowser } = require('@remotion/renderer');
  const root = path.resolve(__dirname, '..'), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'yuedu-'));
  const serveUrl = await bundle({ entryPoint: path.join(root, 'src/yuedu/index.tsx'), publicDir: path.join(root, 'public') });
  const inputProps = props === '-' ? {} : JSON.parse(fs.readFileSync(props, 'utf8'));
  const chrome = process.env.CHROME_PATH;
  const browser = await openBrowser('chrome', chrome ? { browserExecutable: chrome } : {});
  const composition = await selectComposition({ serveUrl, id: comp, inputProps, puppeteerInstance: browser });
  const list = frames.split(',').map(Number);
  if (single === '1') {
    await renderStill({ composition, serveUrl, inputProps, frame: Math.min(list[0], composition.durationInFrames - 1), output: path.resolve(out), imageFormat: out.endsWith('.png') ? 'png' : 'jpeg', puppeteerInstance: browser });
  } else {
    let i = 0;
    for (const f of list) await renderStill({ composition, serveUrl, inputProps, frame: Math.min(f, composition.durationInFrames - 1), output: path.join(dir, String(i++).padStart(4, '0') + '.jpg'), imageFormat: 'jpeg', jpegQuality: 88, puppeteerInstance: browser });
    const cols = Number(colsArg || 6), rows = Math.ceil(list.length / cols);
    const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-framerate', '1', '-i', path.join(dir, '%04d.jpg'), '-vf', `scale=iw/3:-1,tile=${cols}x${rows}:padding=6:color=white`, '-frames:v', '1', '-q:v', '4', path.resolve(out)], { stdio: 'inherit' });
    if (r.status !== 0) throw new Error('ffmpeg 拼联系表失败');
  }
  await browser.close({ silent: true });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log(out + '（' + list.length + ' 张）');
})().catch((e) => { console.error(e.message || e); process.exit(1); });
