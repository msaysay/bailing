const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1360, height: 900 }, deviceScaleFactor: 1.5 });
  for (const k of ['folder', 'setup', 'onekey', 'step', 'options', 'flow', 'terminal']) { await p.goto('file://' + process.argv[2] + '/mock.html?p=' + k); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(200); const el = await p.$('.win'); await el.screenshot({ path: `${process.argv[2]}/img/${k}.png` }); }
  await b.close(); })();
