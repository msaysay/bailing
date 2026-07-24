'use strict';
// 首启引导：四步（欢迎 → 知识库 → 场景试用 → 完成）。
const $ = (id) => document.getElementById(id);
const steps = [...document.querySelectorAll('.step')];
const dots = [...document.querySelectorAll('.dots i')];
const backBtn = $('back');
const nextBtn = $('next');
let cur = 0;

function show(i) {
  cur = i;
  steps.forEach((s, j) => s.classList.toggle('on', j === i));
  dots.forEach((d, j) => d.classList.toggle('on', j <= i));
  backBtn.style.visibility = i === 0 ? 'hidden' : 'visible';
  nextBtn.textContent = i === steps.length - 1 ? '开始使用' : (i === 0 ? '开始' : '下一步');
}

nextBtn.addEventListener('click', () => {
  if (cur < steps.length - 1) show(cur + 1);
  else window.bailingSettings.finishWelcome();
});
backBtn.addEventListener('click', () => { if (cur > 0) show(cur - 1); });
$('wcClose').addEventListener('click', () => window.bailingSettings.finishWelcome());

// 第 2 步：选知识库
$('kbPick').addEventListener('click', async () => {
  const st = $('kbStatus');
  const r = await window.bailingSettings.kbPickFolder();
  if (r.canceled) return;
  if (r.status && r.status.chunks) {
    st.className = 'kbstatus ok';
    st.textContent = `✓ 已索引 ${r.status.files} 篇 · ${r.status.chunks} 块，知识库已就位`;
  } else {
    st.className = 'kbstatus';
    st.textContent = '该目录没找到 .md/.txt 内容，可以换个文件夹或以后在设置里再选';
  }
});

// 第 3 步：场景卡 + 试用
let trialScene = 'chat';
document.querySelectorAll('.scene').forEach((el) => {
  el.addEventListener('click', () => {
    document.querySelectorAll('.scene').forEach((x) => x.classList.remove('on'));
    el.classList.add('on');
    trialScene = el.dataset.scene;
    window.bailingSettings.setTrialScene(trialScene);
    $('demo').focus();
  });
});
window.bailingSettings.setTrialScene(trialScene); // 默认卡也同步给主进程

// 出字结果（主进程转来）
window.bailingSettings.onWelcomeResult((r) => {
  const el = $('result');
  if (r.error) {
    el.style.color = '#c8402a';
    el.textContent = r.error;
  } else {
    el.style.color = '';
    el.textContent = '✓ 出字了——这就是百灵的效果';
  }
});

show(0);
