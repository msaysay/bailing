'use strict';
// 悬浮胶囊 + 录音。录音在渲染层做（有 mic 权限），转 16k 单声道 WAV 后交给主进程。
const pill = document.getElementById('pill');
const txtEl = document.getElementById('txt');
const timerEl = document.getElementById('timer');
const waveEl = document.getElementById('wave');
const BAR_N = 9;
for (let i = 0; i < BAR_N; i++) waveEl.appendChild(document.createElement('i'));
const bars = [...waveEl.children];

let mediaStream = null;
let recorder = null;
let chunks = [];
let audioCtx = null;
let analyser = null;
let rafId = null;
let timerId = null;
let startTs = 0;

function setState(cls) { pill.className = 'pill' + (cls ? ' ' + cls : ''); }
function setText(t) { txtEl.textContent = t || ''; }

function fmt(ms) {
  const s = Math.floor(ms / 1000);
  return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
}
function startTimer() {
  startTs = Date.now();
  timerEl.textContent = '0:00';
  timerId = setInterval(() => { timerEl.textContent = fmt(Date.now() - startTs); }, 250);
}
function stopTimer() { clearInterval(timerId); timerId = null; }

async function startRecording() {
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    chunks = [];
    recorder = new MediaRecorder(mediaStream);
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.start();
    setState('rec');
    startTimer();
    animate();
  } catch (e) {
    setState('err'); setText('麦克风打开失败');
  }
}

function animate() {
  audioCtx = new AudioContext();
  const src = audioCtx.createMediaStreamSource(mediaStream);
  analyser = audioCtx.createAnalyser();
  analyser.fftSize = 128;
  analyser.smoothingTimeConstant = 0.72;
  src.connect(analyser);
  const buf = new Uint8Array(analyser.frequencyBinCount);
  const mid = (BAR_N - 1) / 2;
  const tick = () => {
    analyser.getByteFrequencyData(buf);
    bars.forEach((b, i) => {
      const bin = 2 + Math.round(Math.abs(i - mid) * 1.5);
      const v = buf[bin] || 0;
      const center = 1 - Math.abs(i - mid) / (mid + 1.2);
      const h = 5 + Math.round((v / 255) * 18 * (0.55 + center * 0.6));
      b.style.height = Math.min(h, 24) + 'px';
    });
    rafId = requestAnimationFrame(tick);
  };
  tick();
}

async function stopRecording() {
  if (!recorder) return;
  stopTimer();
  cancelAnimationFrame(rafId);
  setState('proc');
  setText('正在记录你的想法');
  await new Promise((resolve) => { recorder.onstop = resolve; recorder.stop(); });
  mediaStream.getTracks().forEach((t) => t.stop());

  const blob = new Blob(chunks, { type: recorder.mimeType });
  const arrbuf = await blob.arrayBuffer();
  const wav = await encodeWav16k(arrbuf);
  await window.bailing.submitAudio(wav);
  if (audioCtx) audioCtx.close();
}

async function encodeWav16k(arrbuf) {
  const ctx = new AudioContext();
  const decoded = await ctx.decodeAudioData(arrbuf.slice(0));
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = off.createBufferSource();
  src.buffer = decoded; src.connect(off.destination); src.start();
  const rendered = await off.startRendering();
  ctx.close();
  return floatToWav(rendered.getChannelData(0), 16000);
}

function floatToWav(samples, rate) {
  const buf = new ArrayBuffer(44 + samples.length * 2);
  const dv = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) dv.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); dv.setUint32(4, 36 + samples.length * 2, true); w(8, 'WAVE');
  w(12, 'fmt '); dv.setUint32(16, 16, true); dv.setUint16(20, 1, true); dv.setUint16(22, 1, true);
  dv.setUint32(24, rate, true); dv.setUint32(28, rate * 2, true); dv.setUint16(32, 2, true); dv.setUint16(34, 16, true);
  w(36, 'data'); dv.setUint32(40, samples.length * 2, true);
  let o = 44;
  for (let i = 0; i < samples.length; i++, o += 2) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    dv.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

function reveal() { txtEl.classList.remove('reveal'); void txtEl.offsetWidth; txtEl.classList.add('reveal'); }

// 停留控制：完成后停留几秒（可点「改错」、悬停保留），超时/松开后请求隐藏
let hideTimer = null;
function scheduleHide(ms) { clearTimeout(hideTimer); hideTimer = setTimeout(() => window.bailing.requestHide(), ms); }
pill.addEventListener('mouseenter', () => clearTimeout(hideTimer));
pill.addEventListener('mouseleave', () => { if (pill.classList.contains('done')) scheduleHide(1600); });
document.getElementById('fix').addEventListener('click', (e) => {
  e.stopPropagation();
  clearTimeout(hideTimer);
  window.bailing.openCorrection(); // 主进程会开修正窗并隐藏悬浮窗
});

window.bailing.onRecordStart(startRecording);
window.bailing.onRecordStop(stopRecording);
window.bailing.onStatus((s) => {
  clearTimeout(hideTimer);
  if (s.phase === 'processing') { setState('proc'); setText('正在记录你的想法'); }
  else if (s.phase === 'done') { setState('done'); setText(s.text || '完成'); reveal(); scheduleHide(5000); }
  else if (s.phase === 'error') { setState('err'); setText('未听清'); reveal(); scheduleHide(3000); }
});
