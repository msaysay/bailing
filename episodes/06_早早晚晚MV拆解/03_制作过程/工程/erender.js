const { chromium } = require('playwright'); const { spawn } = require('child_process'); const path = require('path');
const [a, b, out] = [+process.argv[2], +process.argv[3], process.argv[4]];
(async () => {
  const br = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] }); const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => console.log('PAGE', m.text()));
  await p.goto('file://' + path.join(__dirname, 'ep.html')); await p.evaluate(() => window.ready);
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', '30', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', '-pix_fmt', 'yuv420p', '-threads', '1', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = a; i < b; i++) { const d = await p.evaluate(fi => window.grab(fi), i); if (!ff.stdin.write(Buffer.from(d.slice(23), 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); }
  ff.stdin.end(); await new Promise(r => ff.on('close', r)); await br.close(); console.log('done', out);
})();
