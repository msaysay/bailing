const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  for (const [name, w] of [['company', 1440], ['personal', 1440], ['company', 390], ['personal', 390]]) {
    const p = await b.newPage({ viewport: { width: w, height: 900 }, deviceScaleFactor: 1 });
    await p.goto('file://' + process.cwd() + '/dist/' + name + '.html');
    await p.waitForTimeout(400);
    const ov = await p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
    await p.screenshot({ path: `/tmp/claude-0/-home-user-bailing/47fc8b6f-cd0a-5a50-81ca-d32928d1625f/scratchpad/${name}-${w}.png`, fullPage: true });
    console.log(name, w, 'overflow', ov);
    await p.close();
  }
  await b.close();
})();
