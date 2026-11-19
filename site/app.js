// 官网交互：首屏组件墙、Skill 两条线、组件库筛选与详情、作品、复制提示词。数据来自 data.js（脚本生成）和 config.js（手改）。
(() => {
  const D = window.SITE_DATA, CFG = window.SITE_CONFIG, $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const el = (tag, attrs = {}, html = '') => { const e = document.createElement(tag); Object.entries(attrs).forEach(([k, v]) => (k === 'class' ? (e.className = v) : e.setAttribute(k, v))); e.innerHTML = html; return e; };
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const demo = (id) => `assets/demos/${id}.mp4`, thumb = (id) => `assets/thumbs/${id}.jpg`;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 数量一律从数据里取，组件库更新后不用改页面
  const N = { comp: D.components.length, group: D.groups.length, skill: D.skills.length, line: 2, agent: 3 };
  Object.entries(N).forEach(([k, v]) => $$('.n-' + k).forEach((e) => (e.textContent = v)));
  addEventListener('scroll', () => $('#nav').classList.toggle('solid', scrollY > 40), { passive: true });

  // 滚动进入时淡入
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { threshold: 0.12 });
  const watch = () => $$('.reveal:not(.in)').forEach((e) => io.observe(e));

  // 首屏：三行组件演示，各自横向滚动。每行内容重复一遍，滚到一半正好接上。
  const wall = $('#wall');
  CFG.wall.forEach((ids) => {
    const row = el('div', { class: 'row' });
    [...ids, ...ids].forEach((id) => row.append(el('video', { src: demo(id), poster: thumb(id), muted: '', loop: '', playsinline: '', preload: 'none' })));
    wall.append(row);
  });
  const wallIO = new IntersectionObserver((es) => es.forEach((e) => { const v = e.target; if (e.isIntersecting && !reduce) { v.muted = true; v.play().catch(() => {}); } else v.pause(); }), { rootMargin: '80px' });
  $$('video', wall).forEach((v) => wallIO.observe(v));

  // 数字滚动
  const stats = $('#stats');
  new IntersectionObserver((es, o) => es.forEach((e) => {
    if (!e.isIntersecting) return; o.disconnect();
    $$('[data-count]', stats).forEach((b) => { const to = N[b.dataset.count], t0 = performance.now(); const tick = (t) => { const p = Math.min(1, (t - t0) / 1100), q = 1 - Math.pow(1 - p, 3); b.textContent = Math.round(to * q); p < 1 && requestAnimationFrame(tick); }; reduce ? (b.textContent = to) : requestAnimationFrame(tick); });
  })).observe(stats);

  // Skill：两条线。口播线中间借用事为主的三步。
  const byName = Object.fromEntries(D.skills.map((s) => [s.name, s]));
  const LINES = {
    talk: ['talk-01-shoot', 'video-02-factcheck', 'talk-02-roughcut', 'video-04-footage', 'talk-03-layout', 'talk-04-build', 'video-08-cover'],
    video: D.skills.filter((s) => s.line === 'video').map((s) => s.name),
  };
  const short = (s) => (s.title || s.name).replace(/^.*?·\s*/, '');
  let line = 'talk';
  const showSkill = (name) => {
    const s = byName[name];
    $$('#pipe button').forEach((b) => b.classList.toggle('on', b.dataset.name === name));
    $('#skillDetail').innerHTML = `<div><h3>${esc(short(s))}</h3><div class="file">skills/${esc(s.name)}/SKILL.md</div><p class="desc">${esc(s.desc)}</p></div>
      <dl class="kv"><dt>做什么</dt><dd>${esc(s.what)}</dd><dt>输入</dt><dd>${esc(s.input)}</dd><dt>输出</dt><dd>${esc(s.output)}</dd>
      <dt>${s.ask ? '要你确认' : '会告诉你'}</dt><dd>${esc(s.confirm || '不用，助手连续往下做')}</dd>${s.gate ? `<dt>放行条件</dt><dd class="gate">${esc(s.gate)}</dd>` : ''}</dl>`;
  };
  const drawPipe = () => {
    const pipe = $('#pipe'); pipe.innerHTML = '';
    LINES[line].forEach((name, i) => {
      const s = byName[name], borrow = line === 'talk' && s.line === 'video';
      const b = el('button', { 'data-name': name, class: borrow ? 'borrow' : '' }, `<div class="n">${borrow ? '借用' : '第 ' + (line === 'talk' ? LINES.talk.filter((x, k) => k <= i && byName[x].line === 'talk').length : i + 1) + ' 步'}</div><div class="t">${esc(short(s))}</div><div class="f">${esc(name)}</div>${s.ask ? '<span class="ask">要你确认</span>' : ''}`);
      b.onclick = () => showSkill(name); pipe.append(b);
    });
    showSkill(LINES[line][0]);
  };
  $$('#lineTabs button').forEach((b) => (b.onclick = () => { line = b.dataset.line; $$('#lineTabs button').forEach((x) => x.classList.toggle('on', x === b)); drawPipe(); }));
  drawPipe();
  // 分流卡片：点「口播」「解说」时先切到对应那条线
  $$('[data-go]').forEach((a) => a.addEventListener('click', () => { line = a.dataset.go; $$('#lineTabs button').forEach((x) => x.classList.toggle('on', x.dataset.line === line)); drawPipe(); }));

  // 组件库：分组、搜索、分批加载
  // 展示顺序：先放最出效果的几组，其余按目录原顺序
  const FIRST = ['炫技动效', '广播风 · 系统与文字', '广播风 · 粒子与终端', '广播风 · 人物与图解', '数据图表', '文字与强调', '口播叠加', '录屏与设备', '网页与文档', '关系与流程', '视频与图片', '画面效果', '运动手感'];
  const rank = (g) => { const k = FIRST.indexOf(g); return k < 0 ? FIRST.length + D.groups.indexOf(g) : k; };
  D.groups.sort((a, b) => rank(a) - rank(b)); D.components.sort((a, b) => rank(a.group) - rank(b.group) || a.i - b.i);
  const chips = $('#chips'), grid = $('#grid'), PAGE = 24; let group = '', query = '', shown = PAGE;
  const mkChip = (label, g, n) => { const b = el('button', g === group ? { class: 'on' } : {}, `${esc(label)}<i>${n}</i>`); b.onclick = () => { group = g; shown = PAGE; $$('button', chips).forEach((x) => x.classList.toggle('on', x === b)); draw(); }; return b; };
  chips.append(mkChip('全部', '', D.components.length), ...D.groups.map((g) => mkChip(g, g, D.components.filter((c) => c.group === g).length)));
  const hoverIO = new IntersectionObserver((es) => es.forEach((e) => { if (!e.isIntersecting) { const v = $('video', e.target); v && v.remove(); } }));
  const play = (card, c) => { if ($('video', card) || reduce) return; const v = el('video', { src: demo(c.id), muted: '', loop: '', playsinline: '' }); v.muted = true; $('.media', card).append(v); v.play().catch(() => {}); };
  const draw = () => {
    const q = query.trim().toLowerCase();
    const list = D.components.filter((c) => (!group || c.group === group) && (!q || [c.name, c.id, c.export, c.group, c.use].join(' ').toLowerCase().includes(q)));
    $('#count').textContent = `${list.length} 个组件` + (group ? ` · ${group}` : '') + (q ? ` · 含「${query.trim()}」` : '');
    grid.innerHTML = '';
    list.slice(0, shown).forEach((c) => {
      const card = el('div', { class: 'card', tabindex: '0' }, `<div class="media"><img loading="lazy" src="${thumb(c.id)}" alt="${esc(c.name)}"></div><div class="meta"><div class="id">${esc(c.id)}<span>${esc(c.group)}</span></div><div class="name">${esc(c.name)}</div><div class="use">${esc(c.use)}</div></div>`);
      card.onmouseenter = () => play(card, c); card.onmouseleave = () => { const v = $('video', card); v && v.remove(); };
      card.onclick = () => openModal(c); card.onkeydown = (e) => e.key === 'Enter' && openModal(c);
      hoverIO.observe(card); grid.append(card);
    });
    $('.more')?.remove();
    if (list.length > shown) { const m = el('button', { class: 'btn more' }, `再看 ${Math.min(PAGE, list.length - shown)} 个（还有 ${list.length - shown} 个）`); m.onclick = () => { shown += PAGE; draw(); }; grid.after(m); }
  };
  $('#q').oninput = (e) => { query = e.target.value; shown = PAGE; draw(); };
  draw();

  // 组件详情
  const modal = $('#modal'), mv = $('#mVideo');
  const openModal = (c) => { mv.src = demo(c.id); mv.poster = thumb(c.id); mv.play().catch(() => {}); $('#mId').textContent = `${c.id} · ${c.group}`; $('#mName').textContent = `${c.name}　${c.export}`; $('#mUse').textContent = c.use; $('#mAvoid').textContent = c.avoid || '—'; $('#mProps').textContent = c.props || '—'; $('#mFile').textContent = 'studio/src/' + c.file; modal.hidden = false; document.body.style.overflow = 'hidden'; };
  const closeModal = () => { modal.hidden = true; mv.pause(); mv.removeAttribute('src'); document.body.style.overflow = ''; };
  $('#modalClose').onclick = closeModal; modal.onclick = (e) => e.target === modal && closeModal(); addEventListener('keydown', (e) => e.key === 'Escape' && !modal.hidden && closeModal());

  // 作品
  CFG.works.forEach((w) => $('#worksList').append(el('div', { class: 'work reveal' }, `<div class="phone"><video src="${w.src}" ${w.poster ? `poster="${w.poster}"` : 'muted loop autoplay'} controls playsinline preload="${w.poster ? 'none' : 'metadata'}"></video></div><h4>${esc(w.title)}</h4><p>${esc(w.note)}</p>`)));

  // 复制提示词
  $('#copy').onclick = async (e) => { try { await navigator.clipboard.writeText($('#prompt').textContent); e.target.textContent = '已复制'; } catch { e.target.textContent = '请手动选中复制'; } setTimeout(() => (e.target.textContent = '复制'), 1600); };

  watch();
})();
