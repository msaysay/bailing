'use strict';
// 快速修正交互：显示上一句 → 填「听成了/应该是」→ 记住（进纠正表+词库）。
const $ = (id) => document.getElementById(id);

async function loadLast() {
  const r = await window.bailingSettings.correctionLast();
  if (r && r.text) $('last').innerHTML = '上次结果：<b>' + escapeHtml(r.text) + '</b>';
  else $('last').textContent = '（没有可修正的上一句，也可以直接手动加一条）';
}
function escapeHtml(s) { return String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }

function renderCorrections(corrections) {
  const el = $('clist');
  const entries = Object.entries(corrections || {});
  if (!entries.length) { el.innerHTML = '<span class="empty">还没有。</span>'; return; }
  el.innerHTML = '';
  for (const [wrong, right] of entries.reverse()) {
    const d = document.createElement('div');
    d.className = 'citem';
    d.innerHTML = `<span>${escapeHtml(wrong)} → <b>${escapeHtml(right)}</b></span><span class="x" title="删除">✕</span>`;
    d.querySelector('.x').onclick = async () => {
      const lib = await window.bailingSettings.removeCorrection(wrong);
      renderCorrections(lib.corrections);
    };
    el.appendChild(d);
  }
}

async function refresh() {
  await loadLast();
  const lib = await window.bailingSettings.termsLibrary();
  renderCorrections(lib.corrections);
}

$('save').addEventListener('click', async () => {
  const wrong = $('wrong').value.trim();
  const right = $('right').value.trim();
  if (!wrong || !right || wrong === right) return;
  const lib = await window.bailingSettings.learn(wrong, right);
  renderCorrections(lib.corrections);
  $('wrong').value = ''; $('right').value = '';
  const m = $('msg'); m.classList.add('show'); setTimeout(() => m.classList.remove('show'), 1500);
});
$('right').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('save').click(); });

window.bailingSettings.onRefresh(() => refresh());
refresh();
