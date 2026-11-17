const { chromium } = require('playwright'); const fs = require('fs'); const path = require('path');
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--disable-web-security'] }); const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  p.on('console', m => console.log('PAGE', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file://' + path.join(__dirname, 'ep.html')); await p.evaluate(() => window.ready);
  fs.mkdirSync('stills', { recursive: true });
  for (const a of process.argv.slice(2)) { const d = await p.evaluate(fi => window.grab(fi), Math.round(parseFloat(a) * 30)); fs.writeFileSync(`stills/${a}.jpg`, Buffer.from(d.split(',')[1], 'base64')); }
  await b.close();
})();
