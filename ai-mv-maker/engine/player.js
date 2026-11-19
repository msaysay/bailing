// ===== 合成：场景切换、转场、调色、歌词、片头片尾（每帧调用 renderFrame）=====
const FPS = +(new URLSearchParams(location.search).get('fps') || 30);
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const cvB = mkCanvas(W, H), ctxB = cvB.getContext('2d');
const OFF = CONFIG.start, END = CONFIG.end;
CONFIG.lyrics = Object.assign({ style: 'glow', size: 70 }, CONFIG.lyrics || {});
prepLyrics();

// 场景开头自动对齐到最近的鼓点（0.35 秒以内），转场会落在拍子上
if (CONFIG.snapToBeat !== false && AUD.beats) SCENES.forEach((s, i) => { if (!i) return; let best = null; for (const b of AUD.beats) if (Math.abs(b - s.a) < .35 && (best === null || Math.abs(b - s.a) < Math.abs(best - s.a))) best = b; if (best !== null) s.a = best; });
SCENES.forEach(s => { if (s.x === undefined) s.x = .8; if (s.ly === undefined) s.ly = 520; });

function aud(T) { const i = clamp(Math.round(T * 30), 0, AUD.kick.length - 1); return { kick: AUD.kick[i], env: AUD.env[i], hat: AUD.hat[i], rms: AUD.rms[i] }; }
function drawScene(c, i, T, A) {
  const s = SCENES[i], nx = SCENES[i + 1], b = nx ? nx.a : END, u = clamp((T - s.a) / (b - s.a)), t = T - s.a;
  const cam = s.camera || CONFIG.camera || 'push';
  let z = 1, dx = 0, dy = 0;
  if (cam === 'push') z = 1.012 + .045 * u; else if (cam === 'pull') z = 1.06 - .045 * u; else if (cam === 'drift') { z = 1.03; dx = Math.sin(t * .25) * 18; dy = Math.cos(t * .2) * 12; }
  z += A.kick * (CONFIG.beatZoom === undefined ? .004 : CONFIG.beatZoom);
  if (s.shake) { const k = shake(T, A.kick, s.shake); dx += k[0]; dy += k[1]; }
  c.save(); c.translate(W / 2 + dx, H * .55 + dy); c.scale(z, z); c.translate(-W / 2, -H * .55);
  s.f(c, T, A, t, u); c.restore();
  if (s.grade) grade(c, s.grade[0], s.grade[1], s.grade[2]);
  if (s.leak) lightLeak(c, T, s.leak, i);
}
function renderFrame(fi) {
  const T = OFF + fi / FPS, A = aud(T);
  let i = 0; for (let k = 0; k < SCENES.length; k++) if (T >= SCENES[k].a - SCENES[k].x / 2) i = k;
  const s = SCENES[i]; let flash = 0, flashCol = '255,250,238', sc = s;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (i > 0 && s.x > 0 && T < s.a + s.x / 2) {
    const p = (T - (s.a - s.x / 2)) / s.x, fx = s.fx || 'dissolve';
    if (fx === 'white' || fx === 'black') { const k = p < .5 ? i - 1 : i; drawScene(ctx, k, T, A); sc = SCENES[k]; flash = Math.pow(1 - Math.abs(2 * p - 1), .7); if (fx === 'black') flashCol = '0,0,0'; }
    else if (fx === 'burn') { // 胶片烧焦：一团暖光从侧面烧过来
      const k = p < .5 ? i - 1 : i; drawScene(ctx, k, T, A); sc = SCENES[k]; const q = 1 - Math.abs(2 * p - 1);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; const x = lerp(-300, W + 300, p), g = ctx.createRadialGradient(x, H * .5, 0, x, H * .5, 1300); g.addColorStop(0, `rgba(255,240,200,${q})`); g.addColorStop(.35, `rgba(255,150,60,${q * .9})`); g.addColorStop(1, 'rgba(180,40,20,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    } else if (fx === 'zoom') { // 冲进去：旧画面放大发白，新画面从放大缩回
      if (p < .5) { const q = p * 2; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + q * q * .6, 1 + q * q * .6); ctx.translate(-W / 2, -H / 2); drawScene(ctx, i - 1, T, A); ctx.restore(); flash = q * q * .8; sc = SCENES[i - 1]; }
      else { const q = (1 - p) * 2; ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 + q * q * .35, 1 + q * q * .35); ctx.translate(-W / 2, -H / 2); drawScene(ctx, i, T, A); ctx.restore(); flash = q * q * .8; }
    } else if (fx === 'wipe') { // 柔边从下往上擦
      drawScene(ctx, i - 1, T, A); ctxB.setTransform(1, 0, 0, 1, 0, 0); ctxB.globalAlpha = 1; ctxB.globalCompositeOperation = 'source-over'; drawScene(ctxB, i, T, A);
      ctxB.globalCompositeOperation = 'destination-in'; const y = lerp(H + 300, -300, easeIO(p)), g = ctxB.createLinearGradient(0, y - 300, 0, y + 300); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,1)'); ctxB.fillStyle = g; ctxB.fillRect(0, 0, W, H); ctxB.globalCompositeOperation = 'source-over';
      ctx.drawImage(cvB, 0, 0); sc = p < .5 ? SCENES[i - 1] : s;
    } else { drawScene(ctx, i - 1, T, A); ctxB.setTransform(1, 0, 0, 1, 0, 0); ctxB.globalAlpha = 1; ctxB.globalCompositeOperation = 'source-over'; drawScene(ctxB, i, T, A); ctx.globalAlpha = easeIO(p); ctx.drawImage(cvB, 0, 0); ctx.globalAlpha = 1; sc = p < .5 ? SCENES[i - 1] : s; }
  } else drawScene(ctx, i, T, A);
  if (CONFIG.grade) grade(ctx, CONFIG.grade[0], CONFIG.grade[1], CONFIG.grade[2]);
  post(ctx, cv, fi, { bloom: sc.dark ? .16 : (CONFIG.bloom === undefined ? .3 : CONFIG.bloom), grain: 0, vig: 0 });
  if (!window.NOLY) { drawTitleCards(ctx, T); drawLyrics(ctx, T, sc); }
  if (flash > 0) { ctx.fillStyle = `rgba(${flashCol},${flash})`; ctx.fillRect(0, 0, W, H); }
  if (CONFIG.letterbox) letterbox(ctx, 1, CONFIG.letterbox);
  post(ctx, cv, fi, { bloom: 0, grain: CONFIG.grain === undefined ? .06 : CONFIG.grain, vig: sc.dark ? .28 : .5 });
  const fin = 1 - sst(0, .9, T - OFF), fout = sst(END - 3.2, END - .4, T), bl = Math.max(fin, fout);
  if (bl > 0) { ctx.fillStyle = `rgba(0,0,0,${bl})`; ctx.fillRect(0, 0, W, H); }
}
function loadImages() {
  return Promise.all([...PRELOAD].map(src => new Promise(r => { const im = new Image(); im.onload = () => { IMGS.set(src, im); r(); }; im.onerror = () => { console.log('图片读不到：' + src); r(); }; im.src = PROJECT + '/' + src; })));
}
window.ready = Promise.all([document.fonts.load(`700 70px ${SERIF}`, '早'), document.fonts.load(`250px ${BRUSH}`, '早'), document.fonts.load(`92px ${INKF}`, '早'), loadImages()]);
window.NOLY = false;
window.info = () => ({ start: OFF, end: END, fps: FPS, frames: Math.round((END - OFF) * FPS), scenes: SCENES.map(s => +s.a.toFixed(2)), title: CONFIG.title });
window.grab = (fi, q) => { renderFrame(fi); return cv.toDataURL('image/jpeg', q || .95); };
