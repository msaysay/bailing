// node still.js T1 T2 ... -> stills/T.jpg (half-res contact also)
const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('PAGE', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.join(__dirname, 'main.html')); await p.evaluate(() => window.ready); const OFF = await p.evaluate(() => OFF);
  fs.mkdirSync('stills', { recursive: true });
  for (const a of process.argv.slice(2)) { const T = parseFloat(a); const t0 = Date.now(); const d = await p.evaluate(fi => window.grab(fi), Math.round((T - OFF) * 30)); fs.writeFileSync(`stills/${a}.jpg`, Buffer.from(d.split(',')[1], 'base64')); console.log(a, Date.now() - t0, 'ms'); }
  await b.close();
})();
