'use strict';
// 专名词库交互：加载/编辑词库、从知识库建议、保存。
const $ = (id) => document.getElementById(id);
const chipsEl = $('chips');
const sugsEl = $('sugs');
let lib = { hotwords: [], corrections: {} };
let selected = new Set();

function renderChips() {
  if (!lib.hotwords.length) {
    chipsEl.innerHTML = '<span class="empty">还没有词。点下面从知识库建议，或手动加。</span>';
    return;
  }
  chipsEl.innerHTML = '';
  for (const t of lib.hotwords) {
    const c = document.createElement('span');
    c.className = 'chip';
    c.innerHTML = `<span>${t}</span><b title="删除">✕</b>`;
    c.querySelector('b').onclick = () => { lib.hotwords = lib.hotwords.filter((x) => x !== t); renderChips(); renderSugs(); };
    chipsEl.appendChild(c);
  }
}

function addTerm(t) {
  t = (t || '').trim();
  if (!t) return;
  if (!lib.hotwords.includes(t)) lib.hotwords.push(t);
  renderChips(); renderSugs();
}

let suggestions = [];
function renderSugs() {
  sugsEl.innerHTML = '';
  for (const t of suggestions) {
    if (lib.hotwords.includes(t)) continue; // 已在词库的不再建议
    const s = document.createElement('span');
    s.className = 'sug' + (selected.has(t) ? ' on' : '');
    s.textContent = t;
    s.onclick = () => {
      if (selected.has(t)) selected.delete(t); else selected.add(t);
      // 选中即加入词库
      addTerm(t); selected.delete(t);
    };
    sugsEl.appendChild(s);
  }
}

$('addBtn').addEventListener('click', () => { addTerm($('addInput').value); $('addInput').value = ''; });
$('addInput').addEventListener('keydown', (e) => { if (e.key === 'Enter') { addTerm($('addInput').value); $('addInput').value = ''; } });

$('sugBtn').addEventListener('click', async () => {
  const msg = $('sugMsg');
  msg.textContent = 'AI 正在从你的知识库里挑专名…';
  const r = await window.bailingSettings.termsSuggest();
  suggestions = r.terms || [];
  msg.textContent = suggestions.length ? `挑出 ${suggestions.length} 个候选，点一下加入词库（或“全部加入”）` : (r.note || '没挑到，检查知识库路径');
  $('addAllBtn').style.display = suggestions.length ? '' : 'none';
  renderSugs();
});

$('addAllBtn').addEventListener('click', () => {
  for (const t of suggestions) if (!lib.hotwords.includes(t)) lib.hotwords.push(t);
  renderChips(); renderSugs();
});

$('save').addEventListener('click', async () => {
  await window.bailingSettings.termsSave({ hotwords: lib.hotwords });
  const s = $('saved'); s.classList.add('show'); setTimeout(() => s.classList.remove('show'), 1600);
});

(async () => {
  lib = await window.bailingSettings.termsLibrary();
  if (!lib.hotwords) lib.hotwords = [];
  renderChips();
})();
