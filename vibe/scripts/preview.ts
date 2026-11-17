// 自查：每一拍取 2 个时刻（拍子开始后 0.9 秒、拍子末尾前 0.2 秒）截图，拼成联系表。
// 用法：node scripts/preview.ts V02 [--scale 0.5]
import path from 'node:path';
import { mkdirSync } from 'node:fs';
import { bundle } from '@remotion/bundler';
import { openBrowser, renderStill, selectComposition } from '@remotion/renderer';
import { EPISODES } from '../src/episodes/all.ts';
import { layout, FPS } from '../src/timeline.ts';

const BROWSER = '/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell';
const ids = process.argv.slice(2).filter((x) => !x.startsWith('--'));
const serve = await bundle({ entryPoint: path.resolve('src/index.ts') });
const browser = await openBrowser('chrome', { browserExecutable: BROWSER });
for (const id of ids) {
  const ep = EPISODES.find((e) => e.id === id)!;
  const tl = layout(ep), dir = `build/preview/${id}`;
  mkdirSync(dir, { recursive: true });
  const comp = await selectComposition({ serveUrl: serve, id, inputProps: { ep }, puppeteerInstance: browser });
  const times = tl.beats.flatMap((b) => [b.start + Math.min(0.9, (b.end - b.start) / 2), b.end - 0.2]);
  let k = 0;
  for (const t of times) {
    await renderStill({ composition: comp, serveUrl: serve, frame: Math.round(t * FPS), output: `${dir}/${String(k++).padStart(3, '0')}.jpg`, imageFormat: 'jpeg', scale: 0.5, puppeteerInstance: browser, inputProps: { ep } });
  }
  for (const v of ['', '-V']) {
    const c = await selectComposition({ serveUrl: serve, id: `${id}-COVER${v}`, inputProps: { ep }, puppeteerInstance: browser });
    await renderStill({ composition: c, serveUrl: serve, output: `build/covers/${id}${v ? '-竖' : '-横'}.jpg`, imageFormat: 'jpeg', jpegQuality: 92, puppeteerInstance: browser, inputProps: { ep } });
  }
  console.log(id, times.length, 'frames');
}
await browser.close({ silent: true });
