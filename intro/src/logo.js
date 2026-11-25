// 导出 logo 的 PNG：图形标（深/亮两版）和横版组合（深底/浅底）
const { chromium } = require('playwright'); const fs = require('fs');
const mark = (tile, bar, cut) => `<svg viewBox="0 0 120 120" width="100%" height="100%"><rect width="120" height="120" rx="26" fill="${tile}"/><rect x="27" y="28" width="16" height="64" fill="${bar}"/><rect x="77" y="28" width="16" height="64" fill="${bar}"/><polygon points="48,28 63,28 72,92 57,92" ${cut}/></svg>`;
const LIME = mark('#D6FF3D', '#0A0A0B', 'fill="#0A0A0B" fill-opacity=".38"'), DARK = mark('#0A0A0B', '#F4F2EC', 'fill="#D6FF3D"');
const lock = (bg, fg, sub, m) => `<body style="margin:0;background:${bg};width:1600px;height:600px;display:flex;align-items:center;justify-content:center;gap:56px;font-family:'Source Han Sans SC Heavy','Source Han Sans SC'"><div style="width:260px;height:260px">${m}</div><div><div style="font-size:150px;line-height:1;color:${fg};letter-spacing:14px;font-weight:900">宁序科技</div><div style="font-family:'D-DIN-PRO';font-size:40px;letter-spacing:27px;color:${sub};margin-top:26px">NINGXU TECH</div></div></body>`;
(async () => {
  const b = await chromium.launch();
  const jobs = [['logo-mark-lime.png', 1024, 1024, `<body style="margin:0;width:1024px;height:1024px">${LIME}</body>`, true], ['logo-mark-dark.png', 1024, 1024, `<body style="margin:0;width:1024px;height:1024px">${DARK}</body>`, true],
    ['logo-horizontal-dark.png', 1600, 600, lock('#0A0A0B', '#F4F2EC', 'rgba(244,242,236,.6)', LIME)], ['logo-horizontal-light.png', 1600, 600, lock('#F4F2EC', '#0A0A0B', 'rgba(10,10,11,.6)', DARK)]];
  for (const [name, w, h, html, transparent] of jobs) { const p = await b.newPage({ viewport: { width: w, height: h } }); await p.setContent(html); await p.waitForTimeout(300); await p.screenshot({ path: 'assets/' + name, omitBackground: !!transparent }); await p.close(); }
  await b.close();
})();
