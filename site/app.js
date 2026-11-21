// AI 剪辑工作流官网的交互和动效。没有依赖。内容数据在本文件上半截（两条流程、六套风格、问答），下载清单来自 downloads.js，组件来自 data.js 和 wall.js。
(() => {
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const C = window.SITE || {}, DL = window.SITE_DL || { free: [], paid: [] }, fine = matchMedia('(pointer: fine)').matches, calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; };
  const fmt = (n) => Math.round(n).toLocaleString('zh-CN');
  $$('[data-brand]').forEach((e) => (e.textContent = C.brand || 'AI 剪辑工作流'));
  document.title = (C.brand ? C.brand + ' · ' : '') + 'AI 剪辑工作流 · 开源';

  // ———— 内容 ————
  const F = 'free', P = 'paid';
  const PIPES = {
    talk: [
      ['选风格和可选功能', '竖屏还是横屏、像谁的风格、要不要降噪调光配乐。', '说一句要什么', [['make-talk', P, '六种风格的总入口'], ['xiaolin-talk', F], ['ziqi-wide', F]]],
      ['粗剪', '本机转写，找出重录、口吃、语气词和长停顿并剪掉，字幕对到声音上。', '确认剪掉了哪几句', [['talk_prep', F], ['retakes', F]]],
      ['声音和画面修整', '人声降噪、统一响度；以脸为准自动调光，可选轻磨皮。', '', [['polish', F], ['grade', F]]],
      ['排版式、配素材', '逐句决定人全屏、切素材、上卡片还是打大字；素材约两秒一换。', '确认版式表和素材', [['xiaolin-talk', F], ['ziqi-wide', F], ['zhanpeng-talk', P], ['danjie-cut', P], ['frame-talk', P], ['tiantu-interview-cut', P]]],
      ['字体', '59 款可商用字体、23 套搭配，一条命令换。', '', [['fonts', F]]],
      ['出片和自查', '先出关键帧，再渲整片；机器查黑场、闪帧、响度和版式占比。', '看成片', [['qc', F], ['talk_check', F], ['wide_check', F]]],
      ['配乐和封面', '成片上铺配乐，人说话时自动压低；出横竖两版封面。', '挑封面', [['polish', F]]],
    ],
    news: [
      ['开题', '说一个题目。助手判断做哪种片子、查环境、建好这一期。', '说讲什么', [['video-start', P]]],
      ['写稿、核对事实', '按钩子、留人点、时长写稿；每个数字和说法查出处，对不上的标出来。', '确认稿子', [['make-news · 稿子', P]]],
      ['声音', '自己念一遍，或者用 AI 配音；自动对齐成逐句字幕。', '给一条录音，或说用 AI 配音', [['voice', P], ['tts', P]]],
      ['找画面', '按稿子去搜真实画面并登记来源，避开人脸和水印。', '', [['tikhub', P], ['make-news · 素材', P]]],
      ['做片', '从 298 个组件里挑：图表、大字、时间线、网页、手机壳、转场，逐段搭出来。', '看前 20 秒小样', [['make-news · 做片', P], ['组件库 298', P]]],
      ['自查、封面、发布文案', '渲染后机器自查并返修；出封面、标题、简介和话题。', '看成片和封面', [['qc', F], ['make-news · 封面', P]]],
      ['频道宠物（可选）', '右下角一只会随数据成长的宠物，叠在成片上。', '', [['pet', P]]],
    ],
  };
  const STYLES = [
    ['财经解读风', '对标 小 Lin', '人全屏和「素材带 + 右上小圆头像」来回切，胸口压卡片，进度牌贯穿全片。竖屏。', F, 'assets/img/tpl2.jpg'],
    ['横屏深度解读风', '对标 子祺见微', '顶上章节导航条，主持人、素材窗、数据面板轮换，金色大字标题卡。8 到 15 分钟的横屏长视频。', F, 'assets/img/tpl4.jpg'],
    ['知识科普风', '对标 张展鹏', '全片一套楷体：白字幕、红钩子、黄关键词；插画加跟着头走的头像、论文卡、黑底金句。', P, 'assets/img/tpl5.jpg'],
    ['商业快节奏风', '对标 蛋解创业', '藏青底，口播和素材版式快切；金色重点词、清单、章节角标、数据面板。', P, 'assets/img/tpl3.jpg'],
    ['相框老板风', '企业老板、创始人口播', '固定品牌相框：三行标题、署名条、标志；中间画面窗里是人、素材和十三种生成卡片。', P, ''],
    ['访谈纪实风', '访谈、人物采访', '口播和满屏空镜交替，全部硬切；白色粗黑字幕、细宋体小标题、品牌片尾。', P, ''],
  ];
  const FAQ = [
    ['免费的这部分，够我用吗？', '口播流程从粗剪到成片整条都在免费包里，带两种风格（一竖一横）、56 个基础组件和全部的降噪、调光、配乐、字体功能。只想把口播剪好的话，够了。社群多的是另外四种风格、不出镜的生产线、全部 298 个组件、每天的新模板和定制。'],
    ['我不会写代码，能用吗？', '能。你要做的是把文件夹交给一个能读文件、跑命令的 AI 助手（Claude Code、Codex、Cursor 等），然后说话。命令是它跑的，代码是它写的。你负责拍、确认和审片。'],
    ['需要什么电脑？', 'Windows、macOS、Linux 都行。要装 Python 3.10+、Node.js 22+ 和 ffmpeg，第一次用会自动下载约 600 MB 的识别模型和字体。渲染一条一分钟的竖屏片子，四核电脑大约几分钟。'],
    ['AI 剪的片子，哪些地方还要人看？', '嘴型对不对、剪口顺不顺、降噪后人声闷不闷、配乐响不响。这些机器查不了，助手交片时会明说，请你看一遍。'],
    ['授权和版权要注意什么？', '渲染引擎 Remotion 对个人和三人以下团队免费，更大的公司商用要自己买授权。字体都是可免费商用的，商用前请到出处核对一次。搜来的素材版权不归你，助手会列出来请你确认。'],
    ['你们说的「对标」是什么意思？', '我们逐帧量了这些博主公开成片的版式、节奏和字幕位置，把剪法做成模板。复刻的是剪法，不是他们的选题、稿子和出镜表现，也不代表和他们有合作。'],
    ['社群怎么进，多少钱？', '微信扫页面上的二维码，加入知识星球「' + ((C.community || {}).name || '') + '」。现在是 ¥' + ((C.community || {}).price || '') + '，满 ' + ((C.community || {}).limit || '') + ' 人后涨到 ¥' + ((C.community || {}).next || '') + '，之后随人数继续上调。星球里是全量工作流、每天更新的新模板和答疑。'],
    ['线下培训适合谁？', '想自己做内容的个人，和想把内容生产交给 AI 流程的企业。两天一夜全程动手，用你自己的原片和账号来做。现场配发内容创作工作台。时间和地点在知识星球里公布。'],
  ];

  // ———— 渲染内容 ————
  for (const [key, steps] of Object.entries(PIPES)) {
    const box = $('#pipe-' + key); box.appendChild(h('<div class="fill"></div>'));
    steps.forEach(([name, what, you, sk], i) => box.appendChild(h(`<div class="step rv" style="--d:${i * 0.04}s"><div><h4><small>${String(i + 1).padStart(2, '0')}</small>${name}</h4>${you ? `<div class="who">你要做的：<b>${you}</b></div>` : '<div class="who">你不用管</div>'}</div><div><p>${what}</p><div class="skills">${sk.map(([n, tier, tip]) => `<span class="sk ${tier}" title="${tip || ''}">${n}<i>${tier === F ? '免费' : '社群'}</i></span>`).join('')}</div></div></div>`)));
  }
  STYLES.forEach(([name, ref, desc, tier, img], i) => $('#styles-grid').appendChild(h(`<div class="card rv" style="--d:${(i % 3) * 0.08}s"><span class="tag ${tier}">${tier === F ? '免费开源' : '社群'}</span><div class="shot ${img ? '' : 'ph'}" ${img ? `style="background-image:url(${img})"` : ''}>${img ? '' : '样片在社群里看'}</div><div class="body"><h4>${name}</h4><div class="ref">${ref}</div><p>${desc}</p></div><div class="glow"></div></div>`)));
  FAQ.forEach(([q, a]) => $('#faq-list').appendChild(h(`<details class="rv"><summary>${q}</summary><p>${a}</p></details>`)));
  const pkg = (p, tier) => h(`<div class="pkg rv ${tier}"><div class="k">${p.code}　${tier === F ? 'FREE' : 'COMMUNITY'}</div><h4>${p.name}</h4><p>${p.desc}</p><div class="file">${p.file}<span>${p.size || ''}</span></div>${tier === F ? `<a class="btn lime" href="${(C.downloadBase || 'downloads/') + encodeURIComponent(p.file)}" download>下载 <i>↓</i></a>` : `<a class="btn" href="#join">进知识星球获取 <i>→</i></a>`}</div>`);
  DL.free.forEach((p) => $('#dl-free').appendChild(pkg(p, F))); DL.paid.forEach((p) => $('#dl-paid').appendChild(pkg(p, P)));
  // 社群、培训、工作台
  const cm = C.community || {}, tr = C.training || {};
  $$('[data-c]').forEach((e) => (e.textContent = typeof cm[e.dataset.c] === 'number' ? fmt(cm[e.dataset.c]) : cm[e.dataset.c] || ''));
  $$('[data-t]').forEach((e) => (e.textContent = typeof tr[e.dataset.t] === 'number' ? fmt(tr[e.dataset.t]) : tr[e.dataset.t] || ''));
  $$('[data-price]').forEach((e) => (e.textContent = cm.price ? '¥' + fmt(cm.price) : ''));
  $('#join-how').textContent = cm.how || ''; $('#join-note').textContent = cm.note || ''; if (cm.qr) $('#zsxq').src = cm.qr;
  $('#train-when').textContent = [tr.date, tr.place, tr.seats].filter(Boolean).join('　·　') || '小班制，名额有限　·　最新一期的时间地点在知识星球里公布';
  const AGENDA = [
    ['第一天 · 上午', '跑通第一条', '装好环境，把你带来的口播原片丢进去，出第一条成片。先看到结果，再讲原理。', ['环境一次装好', '口播流程走一遍', '第一条成片']],
    ['第一天 · 下午', '定你自己的风格', '挑一个你想对标的博主，现场拆：版式、节奏、字幕。把拆出来的数做成你自己的模板。', ['对标拆解', '自己的模板', '字体和配乐']],
    ['第一天 · 晚上', '共创夜', '每个人用自己的模板做一条完整的片子，逐个过片、当场改。这一晚做出来的就是你能发的第一条。', ['每人一条成片', '一对一过片']],
    ['第二天 · 上午', '不出镜，和一人多号', '纯内容生产线：给一个题目出一条片。再把流程批量化，一个人同时管多个号、多种风格。', ['纯内容生产线', '批量出片', '一人 N 号']],
    ['第二天 · 下午', '接上工作台，带走流程', '装好内容创作工作台，把选题、发布、复盘接起来。企业学员把流程写成自己团队能接手的交接文档。', ['工作台上手', '企业流程交接', '结业']],
  ];
  AGENDA.forEach(([when, title, what, tags], i) => $('#agenda').appendChild(h(`<div class="slot rv" style="--d:${i * 0.06}s"><span>${when}</span><h4>${title}</h4><p>${what}</p><div>${tags.map((x) => `<i>${x}</i>`).join('')}</div></div>`)));
  ['你自己跑通的 AI 剪辑工作流（装在你电脑上）', '按你对标的博主做出来的专属模板', '现场做出的成片，可以直接发', '内容创作工作台'].forEach((x) => $('#takeaway').appendChild(h(`<li>${x}</li>`)));
  ['定位', '计划', '创作', '发布', '采集', '复盘', '打法库', '下周计划'].forEach((x, i) => $('#loop').appendChild(h(`<span style="--i:${i}"><b>${String(i + 1).padStart(2, '0')}</b>${x}</span>`)));
  [['「今天」页', '打开只看一页：它只告诉你下一步做什么，每一步一个按钮。'], ['数据看板和复盘', '每天自动采集，同龄对比；五段漏斗找出本周唯一要改的事。'], ['数据预测', '发布前让 AI 读稿子预测播放和关注率，数据回来自动对答案，越预测越准。'], ['对标和热点', '盯住同赛道的号，自动标出爆款并拆解；热榜里让 AI 挑适合你的。'], ['一次发三个平台', '一份视频勾选账号排队发出，支持定时；封面按各平台规格自动裁好。'], ['评论区承接', '抓评论、按规则出回复草稿，把「关注」接到私域。'], ['打法库', '每条验收后记下「改了什么、有没有用」，有效的自动进下周计划。越用越准。'], ['用你自己的 AI', '出稿、复盘、拆解都交给你电脑上的 AI 助手，不用另外买模型。']]
    .forEach(([t, d], i) => $('#feats').appendChild(h(`<div class="feat rv" style="--d:${(i % 4) * 0.06}s"><h4>${t}</h4><p>${d}</p></div>`)));

  // ———— 组件墙 ————
  const comps = (window.SITE_DATA && window.SITE_DATA.components) || [], has = new Set(window.SITE_WALL || []), pool = comps.filter((c) => has.has(c.id));
  if (pool.length) {
    const rows = 3, per = Math.ceil(Math.min(pool.length, 66) / rows);
    for (let r = 0; r < rows; r++) {
      const list = pool.filter((_, i) => i % rows === r).slice(0, per), row = h(`<div class="row" style="--t:${70 + r * 14}s"></div>`);
      [...list, ...list].forEach((c) => { const t = h(`<div class="tile" style="background-image:url(assets/thumbs/${c.id}.jpg)"><span><b>${c.id}</b>${c.name}</span></div>`); t.dataset.id = c.id; row.appendChild(t); });
      $('#wall-rows').appendChild(row);
    }
    const byId = Object.fromEntries(pool.map((c) => [c.id, c]));
    $('#wall-rows').addEventListener('mouseover', (e) => { const t = e.target.closest('.tile'); if (!t || t.querySelector('video')) return; const v = h(`<video src="assets/demos/${t.dataset.id}.mp4" muted loop playsinline autoplay></video>`); t.prepend(v); t.addEventListener('mouseleave', () => v.remove(), { once: true }); });
    $('#wall-rows').addEventListener('click', (e) => { const t = e.target.closest('.tile'); if (!t) return; const c = byId[t.dataset.id]; $('#modal-v').src = `assets/demos/${c.id}.mp4`; $('#modal-v').play().catch(() => {}); $('#modal-t').textContent = `${c.id}　${c.name}`; $('#modal-d').textContent = `什么时候用：${c.use}　｜　别用在：${c.avoid}`; $('#modal').classList.add('on'); });
    const close = () => { $('#modal').classList.remove('on'); $('#modal-v').pause(); };
    $('#modal-x').onclick = close; $('#modal').addEventListener('click', (e) => e.target.id === 'modal' && close()); addEventListener('keydown', (e) => e.key === 'Escape' && close());
  }

  // ———— 滚动：进度条、导航、出现动画、流程线 ————
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('.rv').forEach((e) => io.observe(e));
  const vio = new IntersectionObserver((es) => es.forEach((e) => (e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause())), { threshold: 0.3 });
  $$('video[data-auto]').forEach((v) => vio.observe(v));
  const onScroll = () => {
    const y = scrollY, max = document.documentElement.scrollHeight - innerHeight; $('#progress').style.width = (y / max) * 100 + '%'; $('#nav').classList.toggle('stuck', y > 40);
    $$('.pipe.on').forEach((p) => { const r = p.getBoundingClientRect(), k = Math.max(0, Math.min(1, (innerHeight * 0.62 - r.top) / r.height)); $('.fill', p).style.height = `calc(${k * 100}% - 20px)`; });
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  $$('#tabs button').forEach((b) => (b.onclick = () => { $$('#tabs button').forEach((x) => x.classList.toggle('on', x === b)); $('#tabs').classList.toggle('r', b.dataset.tab === 'news'); $$('.pipe').forEach((p) => p.classList.toggle('on', p.id === 'pipe-' + b.dataset.tab)); $$('.pipe.on .rv').forEach((e) => e.classList.add('in')); onScroll(); }));

  // ———— 数字滚动 ————
  const count = (el, to, dur = 1400) => { const t0 = performance.now(), from = +el.dataset.v || 0; el.dataset.v = to; const tick = (t) => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(from + (to - from) * e); p < 1 && requestAnimationFrame(tick); }; requestAnimationFrame(tick); };
  setTimeout(() => $$('[data-count]').forEach((e) => count(e, +e.dataset.count, 1800)), 1250);

  // ———— 算账 ————
  const K = ['videos', 'salary', 'outsource', 'ai'], unit = { videos: ' 条', salary: ' 元', outsource: ' 元/条', ai: ' 元' };
  const calc = () => {
    const v = Object.fromEntries(K.map((k) => [k, +$('#k-' + k).value])); K.forEach((k) => ($('#o-' + k).textContent = fmt(v[k]) + unit[k]));
    const a = v.salary, b = v.outsource * v.videos, c = v.ai, mx = Math.max(a, b, c);
    [['salary', a], ['outsource', b], ['ai', c]].forEach(([k, n]) => { $('#b-' + k).style.width = (n / mx) * 100 + '%'; $('#n-' + k).textContent = fmt(n) + ' 元/月'; });
    count($('#n-save'), Math.max(0, (Math.min(a, b) - c) * 12), 600);
  };
  K.forEach((k) => { const e = $('#k-' + k); e.value = (C.calc || {})[k] || e.min; e.addEventListener('input', calc); }); calc();

  // ———— 打字 ————
  const say = ['读 AGENTS.md，然后把 口播原片.mp4 剪成财经解读风的成片', '不用问我，一路做到底', '字体换成「老板大气」，再配一条音乐'], typed = $('#typed'); let si = 0;
  const type = () => { const s = say[si % say.length]; let i = 0; const go = () => { typed.textContent = s.slice(0, ++i); i < s.length ? setTimeout(go, 55) : setTimeout(() => { si++; type(); }, 2200); }; go(); };
  new IntersectionObserver((es, o) => es[0].isIntersecting && (type(), o.disconnect())).observe(typed);

  // ———— 首屏：声音、时钟、倾斜、磁吸、光晕 ————
  const film = $('#film'); $('#sound').onclick = () => { film.muted = !film.muted; $('#sound').textContent = film.muted ? '🔇 点一下开声音' : '🔊 声音已开'; if (!film.muted) film.play(); };
  const ck = () => ($('#clock').textContent = new Date().toLocaleTimeString('zh-CN', { hour12: false })); ck(); setInterval(ck, 1000);
  if (fine && !calm) {
    const cur = $('#cursor'); let mx = innerWidth / 2, my = innerHeight / 2, cx = mx, cy = my;
    addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; cur.style.opacity = 1; });
    const loop = () => { cx += (mx - cx) * 0.12; cy += (my - cy) * 0.12; cur.style.transform = `translate(${cx}px, ${cy}px)`; requestAnimationFrame(loop); }; loop();
    const tilt = $('#tilt'), scr = $('.screen', tilt);
    $('.hero').addEventListener('mousemove', (e) => { const x = e.clientX / innerWidth - 0.5, y = e.clientY / innerHeight - 0.5; scr.style.transform = `rotateY(${-9 + x * 14}deg) rotateX(${4 - y * 10}deg)`; });
    $$('.magnet').forEach((b) => { b.addEventListener('mousemove', (e) => { const r = b.getBoundingClientRect(); b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`; }); b.addEventListener('mouseleave', () => (b.style.transform = '')); });
    $$('.card').forEach((c) => { c.addEventListener('mousemove', (e) => { const r = c.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top; $('.glow', c).style.left = x + 'px'; $('.glow', c).style.top = y + 'px'; c.style.transform = `perspective(900px) rotateY(${(x / r.width - 0.5) * 7}deg) rotateX(${(0.5 - y / r.height) * 7}deg)`; }); c.addEventListener('mouseleave', () => (c.style.transform = '')); });
    const strip = $('#strip'); let down = false, sx = 0, sl = 0; strip.addEventListener('mousedown', (e) => { down = true; sx = e.pageX; sl = strip.scrollLeft; }); addEventListener('mouseup', () => (down = false)); strip.addEventListener('mousemove', (e) => down && (strip.scrollLeft = sl - (e.pageX - sx)));
  }

  // ———— 首屏背景：一张向远处流动的透视网格，上面飘着发光的节点，鼠标附近的线会亮起来 ————
  const cv = $('#field'), g = cv.getContext('2d'); let W, H, dpr, pts = [], mouse = { x: -9999, y: -9999 };
  const size = () => { dpr = Math.min(2, devicePixelRatio || 1); W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); pts = Array.from({ length: Math.round(W / 26) }, () => ({ x: Math.random() * W, y: Math.random() * H, v: 0.15 + Math.random() * 0.5, r: 0.6 + Math.random() * 1.6 })); };
  size(); addEventListener('resize', size); $('.hero').addEventListener('mousemove', (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
  let on = true; new IntersectionObserver((es) => (on = es[0].isIntersecting)).observe(cv);
  const draw = (t) => {
    requestAnimationFrame(draw); if (!on) return; g.clearRect(0, 0, W, H);
    const hz = H * 0.56, vx = W * 0.5, k = (t / 1000) * 0.35;
    for (let i = 0; i < 16; i++) { const p = ((i + k) % 16) / 16, y = hz + Math.pow(p, 2.2) * (H - hz) * 1.1; g.strokeStyle = `rgba(214,255,61,${0.02 + p * 0.16})`; g.lineWidth = 1; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (let i = -14; i <= 14; i++) { const x2 = vx + i * W * 0.11, near = Math.max(0, 1 - Math.abs(mouse.x - (vx + (x2 - vx) * ((mouse.y - hz) / (H - hz)))) / 160); g.strokeStyle = `rgba(214,255,61,${0.05 + near * 0.35 * (mouse.y > hz ? 1 : 0)})`; g.beginPath(); g.moveTo(vx, hz); g.lineTo(x2, H); g.stroke(); }
    const grd = g.createLinearGradient(0, hz - 60, 0, hz + 40); grd.addColorStop(0, 'rgba(10,10,11,0)'); grd.addColorStop(1, 'rgba(10,10,11,1)'); g.fillStyle = 'rgba(10,10,11,.0)';
    pts.forEach((p) => { p.y -= p.v; if (p.y < -10) { p.y = H + 10; p.x = Math.random() * W; } const d = Math.hypot(p.x - mouse.x, p.y - mouse.y), a = 0.18 + Math.max(0, 1 - d / 220) * 0.8; g.fillStyle = `rgba(214,255,61,${a})`; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.28); g.fill(); if (d < 150) { g.strokeStyle = `rgba(214,255,61,${(1 - d / 150) * 0.35})`; g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(mouse.x, mouse.y); g.stroke(); } });
  };
  calm ? draw(0) : requestAnimationFrame(draw);
})();
