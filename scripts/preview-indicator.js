'use strict';
// 预览悬浮窗四态截图：npx electron scripts/preview-indicator.js → build/preview-*.png
const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const STATES = [
  ['rec', "pill.className='pill rec'; wave.style.display='flex'; bars.forEach((b,i)=>b.style.height=(6+Math.round(Math.abs(Math.sin(i))*14))+'px'); timerEl.style.display='inline'; timerEl.textContent='0:03'; pill.querySelector('.recdot').style.display='block';"],
  ['proc', "pill.className='pill proc'; txtEl.style.display='block'; txtEl.textContent='正在记录你的想法';"],
  ['done', "pill.className='pill done'; txtEl.style.display='block'; txtEl.textContent='好的，明天下午三点见'; document.getElementById('fix').style.display='inline-flex';"],
  ['err', "pill.className='pill err'; txtEl.style.display='block'; txtEl.textContent='未听清'; txtEl.style.color='var(--zhu)'; pill.querySelector('.warn').style.display='flex';"],
];
const RESET = `
  window.pill = document.getElementById('pill');
  window.txtEl = document.getElementById('txt');
  window.timerEl = document.getElementById('timer');
  window.wave = document.getElementById('wave');
  window.bars = [...wave.children];
  ['wave','txt','timer'].forEach(id => document.getElementById(id).style.display='none');
  ['recdot','warn','fix'].forEach(c => pill.querySelector('.'+c).style.display='none');
  txtEl.style.color='';
`;

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 1120, height: 280, show: false, frame: false,
    transparent: true, backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(ROOT, 'src/renderer/preload.js'),
      backgroundThrottling: false,
    },
  });
  await win.loadFile(path.join(ROOT, 'src/renderer/indicator.html'));
  win.webContents.setZoomFactor(2);
  await win.webContents.executeJavaScript(`
    document.getElementById('pill').style.width='200px';
    document.getElementById('pill').style.height='60px';
    document.getElementById('pill').style.borderRadius='8px';
    document.getElementById('pill').style.margin='36px auto';
    document.getElementById('pill').style.boxShadow='0 12px 40px rgba(42,39,35,.18)';
    document.body.style.background='#faf7f1';
  `);
  for (const [name, js] of STATES) {
    await win.webContents.executeJavaScript(RESET + js);
    await new Promise((r) => setTimeout(r, 250));
    const img = await win.webContents.capturePage();
    const out = path.join(ROOT, 'build', `preview-${name}.png`);
    fs.writeFileSync(out, img.toPNG());
    console.log('生成', path.relative(ROOT, out));
  }
  win.destroy();
  app.quit();
});
