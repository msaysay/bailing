// 视觉图鉴：风格库 / 名词库 / 白模动效 / 混搭器。数据：atlas-data.js（两个开源库整理出来的）+ 这里写的我们自己的风格和白模。
// 所有会动的示例都只在滚到屏幕里时才画；一个统一的时钟驱动。选中的东西攒在底部托盘里，一键复制成发给 AI 的话。
(function () {
  const D = window.ATLAS_DATA || { terms: [], packs: [], mg: [] };
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const A = (p) => (window.__ASSETS && window.__ASSETS[p]) || p;                     // 单文件版里，媒体文件都内嵌成了数据，按路径取
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // —— 我们自己的风格（工作流里现成能用的）——
  const HOUSE = [
    { id: 'h-xiaolin', name: '财经解读风', en: 'TALK · XIAOLIN', clip: 'assets/showcase/xiaolin', tall: 1, intro: '人全屏和「素材 + 右上小圆头像」来回切，胸口压卡片。', look: '竖屏口播, 进度牌贯穿, 标题体白字幕, 数据卡', prompt: '用财经解读风把这条竖屏口播剪成成片。先告诉我剪掉了哪几句，再给我看版式表。' },
    { id: 'h-danjie', name: '商业快节奏风', en: 'TALK · DANJIE', clip: 'assets/showcase/danjie', tall: 1, intro: '藏青底，金色重点词、清单、数据面板，信息密。', look: '竖屏口播, 近黑藏青, 金色关键词, 章节角标', prompt: '用商业快节奏风把这条口播剪成成片，重点词用金色，素材多放。' },
    { id: 'h-ziqi', name: '横屏深度解读风', en: 'WIDE · ZIQI', clip: 'assets/showcase/ziqi', intro: '顶上章节导航条，主持人、素材窗、数据面板轮换，金色大字标题卡。', look: '3:2 横屏, 章节导航, 素材窗, 名片, 竖幅', prompt: '用横屏深度解读风把这条横屏口播剪成成片。原片是远景就放大到胸口以上，先做第一章给我看。' },
    { id: 'h-split', name: '电影分屏大字', en: 'FILM · SPLIT TYPE', clip: 'assets/showcase/split', intro: '斜切黑板推进来，大字跟着声音一行行揭开；每段换一种版式盖住剪口。', look: '横屏, 斜切分屏, 荧光绿强调, 对话框, 风格墙', prompt: '把这几段口播剪成一条横屏整片：开头用电影分屏大字，后面每段换一种版式，整条收紧气口。' },
    { id: 'h-news', name: '横屏新闻解读', en: 'NEWS · EXPLAINER', clip: 'assets/showcase/news', intro: '不出镜：录音 + 真实新闻画面 + 时间轴、引语卡、数据对比；每个数字标出处。', look: '墨黑底, 一个主色, 时间轴, 引语卡, 来源标注', prompt: '我发你一段录音，做成横屏新闻解读片。先核对稿子里的数字和引语，查不到出处的不要放上画面。' },
    { id: 'h-zhanpeng', name: '知识科普风', en: 'TALK · KAI', img: 'assets/img/tpl5.jpg', intro: '全片一套楷体：白字幕、红色钩子、黄色关键词；插画、论文卡、黑底金句。', look: '竖屏口播, 楷体, 黑底金句, 论文卡', prompt: '用知识科普风剪这条口播，文案我一起发你。' },
    { id: 'h-frame', name: '相框老板风', en: 'TALK · FRAME', ph: '相框', bg: 'linear-gradient(135deg,#3a2a14,#c9a063)', intro: '固定品牌相框（纸纹底、三行标题、署名条），中间画面窗里换内容。', look: '横拍出竖屏, 品牌相框, 十三种卡片', prompt: '用相框老板风剪这条老板口播，相框上的标题和署名我来给。' },
    { id: 'h-interview', name: '访谈纪实风', en: 'TALK · INTERVIEW', ph: '访谈', bg: 'linear-gradient(135deg,#12202e,#2f6d7a)', intro: '口播和满屏空镜交替，全部硬切，宋体小标题，品牌片尾。', look: '竖屏, 满屏空镜, 硬切, 关键词放大', prompt: '用访谈纪实风把这条访谈剪成 60 秒竖版。' },
  ];

  const PV = window.AtlasPreview;
  HOUSE.forEach((h) => { const d = (D.house || []).find((x) => x.id === h.id); if (d) Object.assign(h, { t: d.t, fits: d.fits, ref: d.ref }); h.kind = 'house'; });
  (D.mg || []).forEach((m) => { m.kind = 'mg'; }); const DIST = (D.distill || []).map((x) => Object.assign(x, { kind: 'distill' }));
  const ALL = () => [...HOUSE, ...DIST, ...D.mg].filter((x) => x.t);
  /** 一块会动的风格预览。get() 返回当前要画的参数（混搭器里会变）。 */
  const pvCanvas = (get, brand) => { const cv = el('canvas'); cv.width = PV.W; cv.height = PV.H; cv._draw = (now) => { const T = get(); if (T) PV.draw(cv.getContext('2d'), T, now, brand); }; watch(cv); return cv; };

  // —— 白模动效：每个都是时间的纯函数，颜色全部来自皮肤 ——
  const SKINS = {
    white: { name: '白模', bg: '#17181B', line: '#C9CDD3', fill: '#4E5259', hot: '#FFFFFF', text: '#E9EBEE', glow: 0 },
    lime: { name: '荧光绿（官网）', bg: '#0A0A0B', line: '#F4F2EC', fill: '#2A2D22', hot: '#D6FF3D', text: '#F4F2EC', glow: 0 },
    holo: { name: '全息冰蓝', bg: '#050D16', line: '#A8EEFF', fill: 'rgba(90,190,255,.16)', hot: '#FFB547', text: '#E8FBFF', glow: 8 },
    gold: { name: '金色财经', bg: '#0B1020', line: '#F7E3A1', fill: '#1E2B4A', hot: '#E9C46A', text: '#FFF7DC', glow: 3 },
    paper: { name: '纸感', bg: '#EFE8D8', line: '#1B1B1B', fill: '#D9CFB8', hot: '#E5484D', text: '#1B1B1B', glow: 0 },
    neon: { name: '霓虹', bg: '#0B0220', line: '#3DF0FF', fill: 'rgba(255,61,203,.18)', hot: '#FF3DCB', text: '#FFFFFF', glow: 14 },
  };
  let skin = 'white';
  const c01 = (x) => Math.max(0, Math.min(1, x)), o3 = (x) => 1 - Math.pow(1 - c01(x), 3), o5 = (x) => 1 - Math.pow(1 - c01(x), 5), io = (x) => { x = c01(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
  const back = (x) => { const p = c01(x), k = 1.9; return 1 + (k + 1) * Math.pow(p - 1, 3) + k * Math.pow(p - 1, 2); };
  const W = 480, H = 270, CY = 4;                                  // 每个白模 480×270，4 秒一循环，最后 0.6 秒淡出
  const G = (k, S) => { k.shadowColor = S.hot; k.shadowBlur = S.glow; };
  const box = (k, x, y, w, h, r) => { k.beginPath(); k.roundRect(x, y, w, h, r || 6); };
  const label = (k, S, s, x, y, size, col, align) => { k.font = `900 ${size || 22}px "PingFang SC","Microsoft YaHei",sans-serif`; k.fillStyle = col || S.text; k.textAlign = align || 'center'; k.textBaseline = 'middle'; k.fillText(s, x, y); };
  const person = (k, S, x, y, s) => { k.fillStyle = S.fill; k.beginPath(); k.arc(x, y - 34 * s, 22 * s, 0, 7); k.fill(); box(k, x - 40 * s, y - 6 * s, 80 * s, 70 * s, 20 * s); k.fill(); };
  const WM = [
    { name: '回弹入场', kit: 'kit · Pop', ask: '让这块卡片用回弹入场出现，0.4 秒，过冲一点点。', d: (k, S, u) => { const p = back(u / .45); k.translate(W / 2, H / 2); k.scale(p, p); k.fillStyle = S.fill; box(k, -110, -60, 220, 120, 12); k.fill(); k.strokeStyle = S.line; k.lineWidth = 2; k.stroke(); k.fillStyle = S.hot; box(k, -80, -28, 90, 14, 4); k.fill(); k.fillStyle = S.line; box(k, -80, 2, 150, 8, 4); k.fill(); box(k, -80, 20, 120, 8, 4); k.fill(); } },
    { name: '遮罩上滑', kit: 'full02 · Rise', ask: '标题从遮罩里往上滑出来，一行接一行，每行错开 0.15 秒。', d: (k, S, u) => { ['第一行大字', '第二行强调', '第三行'].forEach((s, i) => { const p = o5((u - i * .18) / .5), y = 80 + i * 56; k.save(); k.beginPath(); k.rect(60, y - 26, 380, 52); k.clip(); label(k, S, s, 70, y + (1 - p) * 56, i === 1 ? 44 : 38, i === 1 ? S.hot : S.text, 'left'); k.restore(); }); } },
    { name: '砸字', kit: 'components · SlamWords', ask: '这个词砸下来：从 2 倍大缩到正常，0.2 秒，落地时画面轻震一下。', d: (k, S, u) => { const p = c01(u / .2), s = 2.2 - 1.2 * o5(p), sh = u > .2 && u < .45 ? Math.sin(u * 90) * 5 * (1 - (u - .2) / .25) : 0; k.translate(W / 2 + sh, H / 2); k.scale(s, s); k.globalAlpha *= c01(u / .08); G(k, S); label(k, S, '搞定', 0, 0, 86, S.hot); } },
    { name: '逐字打出', kit: 'components · Typewriter', ask: '这句话像打字一样逐字出现，每秒 10 个字，后面跟一个闪烁的光标。', d: (k, S, u) => { const s = '一句话，剪好一条视频', n = Math.floor(c01(u / 1.6) * s.length); k.strokeStyle = S.line; k.lineWidth = 2; box(k, 50, 100, 380, 70, 14); k.stroke(); label(k, S, s.slice(0, n), 72, 135, 28, S.text, 'left'); const w = k.measureText(s.slice(0, n)).width; if (Math.floor(u * 4) % 2) { k.fillStyle = S.hot; k.fillRect(76 + w, 120, 4, 30); } } },
    { name: '数字滚动', kit: 'kit · Count', ask: '数字从 0 滚到 298，用 0.9 秒，先快后慢；单位小一号。', d: (k, S, u) => { const v = Math.round(298 * o3(u / 1)); G(k, S); label(k, S, String(v), W / 2 - 10, H / 2 - 6, 110, S.hot); k.shadowBlur = 0; label(k, S, '个组件', W / 2, H / 2 + 76, 24, S.text); } },
    { name: '柱状生长', kit: 'components · charts', ask: '柱子从下往上长出来，一根接一根错开 0.1 秒，最高的那根换成强调色。', d: (k, S, u) => { [.35, .5, .42, .7, .62, .95].forEach((v, i) => { const p = o5((u - i * .1) / .6), h = 170 * v * p; k.fillStyle = i === 5 ? S.hot : S.fill; k.strokeStyle = S.line; k.lineWidth = 1.5; k.beginPath(); k.rect(70 + i * 60, 220 - h, 40, h); k.fill(); k.stroke(); }); k.strokeStyle = S.line; k.beginPath(); k.moveTo(50, 220); k.lineTo(430, 220); k.stroke(); } },
    { name: '流程点亮', kit: 'holo · Nodes', ask: '五个节点连成一条线，从左到右依次点亮，线先画到、节点再亮。', d: (k, S, u) => { const p = c01(u / 2.2), xs = [70, 155, 240, 325, 410]; k.lineWidth = 3; k.strokeStyle = S.fill; k.beginPath(); k.moveTo(70, 130); k.lineTo(410, 130); k.stroke(); G(k, S); k.strokeStyle = S.hot; k.beginPath(); k.moveTo(70, 130); k.lineTo(70 + 340 * p, 130); k.stroke(); xs.forEach((x, i) => { const on = p >= i / 4 - .001; k.fillStyle = on ? S.hot : S.bg; k.strokeStyle = on ? S.hot : S.line; k.beginPath(); k.arc(x, 130, on ? 14 : 11, 0, 7); k.fill(); k.stroke(); }); } },
    { name: '划线强调', kit: 'components · type', ask: '说到这个词的时候，底下划一道强调线，从左画到右，0.3 秒。', d: (k, S, u) => { label(k, S, '核心工作流开源', W / 2, 120, 44); const p = o5((u - .5) / .35); G(k, S); k.strokeStyle = S.hot; k.lineWidth = 10; k.lineCap = 'round'; k.beginPath(); k.moveTo(238, 158); k.lineTo(238 + 150 * p, 158); if (p > 0) k.stroke(); } },
    { name: '分屏推入', kit: 'full02 · Hook', ask: '左边一块斜切的色板推进来占四成，人往右让；板上放大字。', d: (k, S, u) => { const p = o5((u - .3) / .55); person(k, S, 240 + 110 * p, 150, 1.5); k.save(); k.transform(1, 0, -.16, 1, 0, 0); k.fillStyle = S.bg; k.strokeStyle = S.hot; k.lineWidth = 5; k.beginPath(); k.rect(-60, -10, 300 * p, 300); k.fill(); k.beginPath(); k.moveTo(300 * p - 60, -10); k.lineTo(300 * p - 60, 290); G(k, S); k.stroke(); k.restore(); k.globalAlpha *= c01((u - .7) / .3); label(k, S, '大字', 40, 120, 54, S.hot, 'left'); } },
    { name: '顶一下', kit: 'hud · punch', ask: '切到这个镜头时画面猛地顶一下：从 1.4 倍回到 1 倍，0.28 秒。', d: (k, S, u) => { const s = 1 + .42 * (1 - o5(u / .28)); k.translate(W / 2, H / 2); k.scale(s, s); k.translate(-W / 2, -H / 2); person(k, S, 240, 160, 1.6); k.strokeStyle = S.line; k.lineWidth = 2; k.strokeRect(30, 20, 420, 230); } },
    { name: '色散切', kit: 'hud · rgb', ask: '切镜头时红蓝两层错开再合上，错开 26 像素，0.3 秒收回。', d: (k, S, u) => { const o = 26 * (1 - o5(u / .3)); [[-o, '#FF3D5A'], [o, '#3DC8FF'], [0, S.line]].forEach(([dx, col], i) => { k.globalCompositeOperation = i < 2 ? 'lighter' : 'source-over'; k.strokeStyle = col; k.lineWidth = 3; k.strokeRect(120 + dx, 60, 240, 150); label(k, S, 'CUT', W / 2 + dx, 135, 60, col); }); } },
    { name: '甩切', kit: 'hud · whip', ask: '下一个镜头从右边甩进来，带横向拖影，0.25 秒到位。', d: (k, S, u) => { const p = o5(u / .3), x = 480 * (1 - p); for (let i = 5; i >= 0; i--) { k.globalAlpha = (i ? .12 : 1); k.fillStyle = S.fill; k.strokeStyle = S.line; k.lineWidth = 2; k.beginPath(); k.rect(90 + x + i * 34 * (1 - p), 60, 300, 150); k.fill(); if (!i) k.stroke(); } k.globalAlpha = 1; } },
    { name: '圆洞穿越', kit: 'hud · iris', ask: '新画面从一个圆洞里放大出来，圆从 0 扩到盖满全屏，0.35 秒。', d: (k, S, u) => { const r = 330 * o5(u / .45); k.save(); k.beginPath(); k.arc(W / 2, H / 2, r, 0, 7); k.clip(); k.fillStyle = S.fill; k.fillRect(0, 0, W, H); person(k, { ...S, fill: S.line }, 240, 160, 1.5); k.restore(); G(k, S); k.strokeStyle = S.hot; k.lineWidth = 4; k.beginPath(); k.arc(W / 2, H / 2, r, 0, 7); if (r < 320) k.stroke(); } },
    { name: '描边展开', kit: 'holo · Panel', ask: '面板先描出边框，再从上往下扫出内容，前几帧闪一下。', d: (k, S, u) => { const p = o5(u / .5), b = o3((u - .2) / .5), P = 2 * (300 + 150); k.setLineDash([P * p, P]); G(k, S); k.strokeStyle = S.line; k.lineWidth = 2; k.strokeRect(90, 60, 300, 150); k.setLineDash([]); k.save(); k.beginPath(); k.rect(90, 60, 300, 150 * b); k.clip(); k.fillStyle = S.fill; k.fillRect(90, 60, 300, 150); k.fillStyle = S.hot; k.fillRect(106, 76, 80, 8); k.fillStyle = S.line; [0, 1, 2, 3].forEach((i) => k.fillRect(106, 104 + i * 22, 200 - i * 30, 6)); k.restore(); k.fillStyle = S.hot; k.fillRect(90, 60 + 150 * b - 2, 300, b < 1 ? 3 : 0); } },
    { name: '飘带滑过', kit: 'hud · Ribbon', ask: '一条发光飘带横穿画面，选项卡顺着它从右滑到左，选中的那张变色放大。', d: (k, S, u) => { const y = (x) => 135 + Math.sin(x / 70 + u * 1.6) * 26; G(k, S); k.strokeStyle = S.hot; k.lineWidth = 5; k.beginPath(); for (let x = 0; x <= W; x += 12) k[x ? 'lineTo' : 'moveTo'](x, y(x)); k.stroke(); k.shadowBlur = 0; for (let i = 0; i < 5; i++) { const x = 560 + i * 120 - u * 190; if (x < -60 || x > 540) continue; const sel = i === 2 && u > 1.6, s = sel ? 1.25 : 1; k.fillStyle = sel ? S.hot : S.bg; k.strokeStyle = S.hot; k.lineWidth = 2; box(k, x - 36 * s, y(x) - 36 * s, 72 * s, 72 * s, 12); k.fill(); k.stroke(); } } },
    { name: '冲击波', kit: 'fx · Shockwave', ask: '从这个点荡开三圈光环，越往外越细越淡，0.7 秒散完，中心一下白闪。', d: (k, S, u) => { G(k, S); [0, .1, .22].forEach((d, i) => { const p = o5((u - .3 - d) / .8); if (u < .3 + d) return; k.globalAlpha = (1 - p); k.strokeStyle = i === 1 ? S.text : S.hot; k.lineWidth = 12 * (1 - p) + 1; k.beginPath(); k.arc(W / 2, H / 2, 220 * p, 0, 7); k.stroke(); }); k.globalAlpha = 1; } },
    { name: '指尖拖尾', kit: 'fx · Trail', ask: '手指划过的地方拖一道光，头粗尾细，0.4 秒内淡掉。', d: (k, S, u) => { const pt = (t) => [60 + 360 * io(t / 1.6), 135 - Math.sin(io(t / 1.6) * Math.PI) * 80]; G(k, S); k.lineCap = 'round'; for (let i = 14; i >= 1; i--) { const a = pt(u - i * .03), b = pt(u - (i - 1) * .03); k.strokeStyle = S.hot; k.globalAlpha = 1 - i / 15; k.lineWidth = 16 * (1 - i / 15) + 1; k.beginPath(); k.moveTo(a[0], a[1]); k.lineTo(b[0], b[1]); k.stroke(); } k.globalAlpha = 1; const h = pt(u); k.fillStyle = S.text; k.beginPath(); k.arc(h[0], h[1], 8, 0, 7); k.fill(); } },
    { name: '进度环', kit: 'hud · Dial', ask: '一个进度环从 0 走到 100%，中间的数字跟着滚，快满时换成强调色。', d: (k, S, u) => { const p = c01(u / 2.4); k.strokeStyle = S.fill; k.lineWidth = 12; k.beginPath(); k.arc(W / 2, H / 2, 82, 0, 7); k.stroke(); G(k, S); k.strokeStyle = p > .85 ? S.hot : S.line; k.lineCap = 'round'; k.beginPath(); k.arc(W / 2, H / 2, 82, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * p); k.stroke(); k.shadowBlur = 0; label(k, S, Math.round(p * 100) + '%', W / 2, H / 2, 44); } },
    { name: '清单打勾', kit: 'hud · Checks', ask: '三项清单依次打勾，勾是画出来的（0.2 秒），打勾的那一下方框弹一下。', d: (k, S, u) => { ['去口吃', '降噪', '配乐'].forEach((s, i) => { const y = 78 + i * 58, on = c01((u - .5 - i * .6) / .22), b = 1 + (u > .5 + i * .6 ? .25 * (1 - o3((u - .5 - i * .6) / .3)) : 0); k.save(); k.translate(120, y); k.scale(b, b); k.strokeStyle = on > 0 ? S.hot : S.line; k.lineWidth = 3; box(k, -20, -20, 40, 40, 8); k.stroke(); if (on > 0) { G(k, S); k.beginPath(); k.moveTo(-10, 0); k.lineTo(-10 + 8 * Math.min(1, on * 2), 8 * Math.min(1, on * 2)); if (on > .5) k.lineTo(-2 + 14 * (on - .5) * 2, 8 - 18 * (on - .5) * 2); k.stroke(); } k.restore(); label(k, S, s, 170, y, 30, S.text, 'left'); }); } },
    { name: '镜头缓推', kit: 'footage · push', ask: '这个画面全程极慢地推近，6 秒里从 1.04 倍推到 1.09 倍，看不出在动但不死。', d: (k, S, u) => { const s = 1 + .16 * (u / CY); k.translate(W / 2, H / 2); k.scale(s, s); k.translate(-W / 2, -H / 2); k.fillStyle = S.fill; k.fillRect(40, 30, 400, 210); person(k, { ...S, fill: S.line }, 240, 170, 1.7); k.strokeStyle = S.line; k.lineWidth = 2; k.strokeRect(40, 30, 400, 210); } },
    { name: '卡片墙飞入', kit: 'components · CardWallFly', ask: '六张卡片从下面错开飞进来排成两行，每张带一点旋转，落位后摆正。', d: (k, S, u) => { for (let i = 0; i < 6; i++) { const p = back((u - .1 - i * .12) / .5), x = 60 + (i % 3) * 126, y = 40 + Math.floor(i / 3) * 100; if (p <= 0) continue; k.save(); k.translate(x + 55, y + 40 + (1 - p) * 160); k.rotate((1 - p) * (i % 2 ? .25 : -.25)); k.fillStyle = i === 4 ? S.hot : S.fill; k.strokeStyle = S.line; k.lineWidth = 1.5; box(k, -55, -40, 110, 80, 8); k.fill(); k.stroke(); k.restore(); } } },
    { name: '对比条', kit: 'wide · CompareBars', ask: '两根横条比大小，同时从左长出来，长的那根用强调色，末尾跟着数字。', d: (k, S, u) => { [['过去', .92, 0], ['现在', .28, 1]].forEach(([n, v, hot], i) => { const p = o5((u - .2 - i * .25) / .8), y = 95 + i * 70; label(k, S, n, 96, y, 24, S.text, 'right'); k.fillStyle = S.fill; k.fillRect(110, y - 18, 300, 36); k.fillStyle = hot ? S.hot : S.line; k.fillRect(110, y - 18, 300 * v * p, 36); label(k, S, Math.round(v * 100 * p) + '', 120 + 300 * v * p, y, 22, hot ? S.hot : S.text, 'left'); }); } },
    { name: '时间轴推进', kit: 'ep06 · Timeline', ask: '顶上一条时间轴，五个日期；讲到哪个，线就推进到哪个，当前的点放大变色。', d: (k, S, u) => { const kx = Math.min(4, Math.floor(u / .7)), xs = [60, 150, 240, 330, 420]; k.strokeStyle = S.fill; k.lineWidth = 3; k.beginPath(); k.moveTo(60, 70); k.lineTo(420, 70); k.stroke(); k.strokeStyle = S.hot; k.beginPath(); k.moveTo(60, 70); k.lineTo(xs[kx], 70); k.stroke(); xs.forEach((x, i) => { k.fillStyle = i <= kx ? S.hot : S.bg; k.strokeStyle = i <= kx ? S.hot : S.line; k.beginPath(); k.arc(x, 70, i === kx ? 11 : 7, 0, 7); k.fill(); k.stroke(); }); const p = o5((u - kx * .7) / .4); k.globalAlpha *= p; k.fillStyle = S.fill; box(k, 60, 110 + (1 - p) * 20, 360, 110, 8); k.fill(); k.fillStyle = S.line; k.fillRect(80, 135, 140, 10); k.fillRect(80, 160, 220, 8); } },
    { name: '天平倾斜', kit: 'ep06 · Balance', ask: '一架天平，一边轻一边重；说到重的那边时，横梁慢慢压下去 14 度。', d: (k, S, u) => { const a = .25 * o5((u - .8) / 1); k.strokeStyle = S.line; k.lineWidth = 3; k.fillStyle = S.fill; k.beginPath(); k.moveTo(240, 80); k.lineTo(215, 230); k.lineTo(265, 230); k.closePath(); k.fill(); k.save(); k.translate(240, 80); k.rotate(a); k.beginPath(); k.moveTo(-170, 0); k.lineTo(170, 0); k.stroke(); [[-170, S.fill, S.line], [170, S.hot, S.hot]].forEach(([x, f, s], i) => { k.beginPath(); k.moveTo(x, 0); k.lineTo(x, 50); k.strokeStyle = S.line; k.stroke(); k.fillStyle = f; k.strokeStyle = s; box(k, x - 42, 50, 84, 50, 6); k.globalAlpha = i ? 1 : .8; k.fill(); k.stroke(); }); k.restore(); } },
  ];

  // —— 托盘：选中的东西 ——
  const picks = new Map();
  const toast = (s) => { const t = $('#toast'); t.textContent = s; t.classList.add('show'); clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove('show'), 1400); };
  const copy = (s, msg) => { const done = () => toast(msg || '已复制'); if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(s).then(done, () => fallback()); else fallback(); function fallback() { const ta = el('textarea'); ta.value = s; ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); done(); } catch (e) { toast('复制失败，请手动选中'); } ta.remove(); } };
  const refreshTray = () => { const t = $('#tray'); t.classList.toggle('show', picks.size > 0); $('#tray b').textContent = picks.size; $('#tray span').textContent = Array.from(picks.values()).map((p) => p.name).join('、'); };
  const togglePick = (id, item, btn, card) => { if (picks.has(id)) picks.delete(id); else picks.set(id, item); btn.classList.toggle('on', picks.has(id)); btn.textContent = picks.has(id) ? '已选' : '选它'; card.classList.toggle('picked', picks.has(id)); refreshTray(); };
  const picksText = () => { const by = { style: [], term: [], wm: [] }; picks.forEach((p) => by[p.kind].push(p)); let s = '我从视觉图鉴里选了这些，请按它们来做：\n';
    if (by.style.length) s += '\n【风格】\n' + by.style.map((p) => `- ${p.name}：${p.look || p.intro}`).join('\n');
    if (by.term.length) s += '\n\n【专业名词】（motion-prompt 编号）\n' + by.term.map((p) => `- #${p.no} ${p.name}（${p.en}）：${p.ask}`).join('\n');
    if (by.wm.length) s += '\n\n【动效骨架】（只要这个动作，风格按上面的来）\n' + by.wm.map((p) => `- ${p.name}：${p.ask}`).join('\n');
    return s + '\n\n先告诉我你打算怎么用它们，我确认后再做。'; };

  // —— 画卡片 ——
  const live = new Set();                                       // 屏幕里的 canvas
  const io2 = 'IntersectionObserver' in window ? new IntersectionObserver((es) => es.forEach((e) => { const t = e.target; if (t.tagName === 'VIDEO') { if (e.isIntersecting) { const p = t.play(); if (p && p.catch) p.catch(() => {}); } else t.pause(); } else { if (e.isIntersecting) live.add(t); else live.delete(t); } }), { rootMargin: '120px' }) : null;
  const watch = (n) => { if (io2) io2.observe(n); else if (n.tagName !== 'VIDEO') live.add(n); };
  const media = (s) => { const m = el('div', 'media' + (s.tall ? ' tall' : '')); if (s.kind === 'distill') { m.appendChild(pvCanvas(() => s.t)); return m; } if (s.clip) { const src = /\.mp4$/.test(s.clip) ? s.clip : s.clip + '.mp4', poster = s.poster || s.clip.replace(/\.mp4$/, '') + '.jpg'; const v = el('video'); v.muted = true; v.loop = true; v.playsInline = true; v.preload = 'none'; v.poster = A(poster); v.src = A(src); m.appendChild(v); watch(v); } else if (s.img) { const i = el('img'); i.loading = 'lazy'; i.src = A(s.img); m.appendChild(i); } else { m.style.background = s.bg; m.appendChild(el('div', 'ph', esc(s.ph))); } return m; };
  const styleCard = (s, no, tag) => { const c = el('div', 'card'), m = media(s); m.appendChild(el('div', 'no', no)); if (tag) m.appendChild(el('div', 'src', tag)); c.appendChild(m);
    const b = el('div', 'body', `<b>${esc(s.name)}<small>${esc(s.en || '')}</small></b><p>${esc(s.intro || '')}</p>${s.ref ? `<p style="font-size:12px;opacity:.8">${esc(s.ref)}</p>` : ''}<div class="tags">${(s.look || '').split(/[,，]\s*/).filter(Boolean).slice(0, 6).map((x) => `<span>${esc(x)}</span>`).join('')}</div>`);
    const row = el('div', 'row'), cp = el('button', '', '复制提示词'), pk = el('button', 'pick', '选它'); cp.onclick = () => copy(s.prompt, '提示词已复制'); pk.onclick = () => togglePick(s.id, { kind: 'style', name: s.name, look: s.look, intro: s.intro }, pk, c); row.append(cp, pk);
    if (s.src) { const a = el('a', '', '源码'); a.href = s.src; a.target = '_blank'; a.rel = 'noopener'; row.appendChild(a); } b.appendChild(row); c.appendChild(b); return c; };
  const termCard = (t) => { const P = window.MotionPrompt && MotionPrompt.packs[t.pack], c = el('div', 'card term'), m = el('div', 'media'); if (P) { m.style.aspectRatio = P.width + ' / ' + P.height; const cv = el('canvas'); cv.width = P.width; cv.height = P.height; cv._draw = (now) => { const k = cv.getContext('2d'); k.save(); try { P.cells[t.i](k, P.width, P.height, now % P.cycle); } catch (e) { /* 个别示例画不出来就留空 */ } k.restore(); }; m.appendChild(cv); watch(cv); }
    m.appendChild(el('div', 'no', '#' + t.id)); c.appendChild(m);
    const b = el('div', 'body', `<b>${esc(t.name)}<small>${esc(t.en)}</small></b><p>${esc(t.mean)}</p><div class="ask">${esc(t.ask)}</div>`), row = el('div', 'row'), cp = el('button', '', '复制问法'), pk = el('button', 'pick', '选它');
    cp.onclick = () => copy(t.ask, '问法已复制'); pk.onclick = () => togglePick('t' + t.id, { kind: 'term', name: t.name, en: t.en, no: t.id, ask: t.ask }, pk, c); row.append(cp, pk); b.appendChild(row); c.appendChild(b); return c; };
  const wmCard = (w, i) => { const c = el('div', 'card'), m = el('div', 'media'), cv = el('canvas'); cv.width = W; cv.height = H;
    cv._draw = (now) => { const S = SKINS[skin], k = cv.getContext('2d'), u = now % CY; k.save(); k.fillStyle = S.bg; k.fillRect(0, 0, W, H); k.globalAlpha = u > CY - .5 ? c01((CY - u) / .5) : 1; try { w.d(k, S, u); } catch (e) { /* 留空 */ } k.restore(); };
    m.appendChild(cv); watch(cv); m.appendChild(el('div', 'no', 'W' + String(i + 1).padStart(2, '0'))); c.appendChild(m);
    const b = el('div', 'body', `<b>${esc(w.name)}<small>${esc(w.kit)}</small></b><div class="ask">${esc(w.ask)}</div>`), row = el('div', 'row'), cp = el('button', '', '复制问法'), pk = el('button', 'pick', '选它');
    cp.onclick = () => copy(w.ask, '问法已复制'); pk.onclick = () => togglePick('w' + i, { kind: 'wm', name: w.name, ask: w.ask }, pk, c); row.append(cp, pk); b.appendChild(row); c.appendChild(b); return c; };

  const build = () => {
    $('#n-style').textContent = HOUSE.length + DIST.length + D.mg.length; const gd = $('#g-dist'); DIST.forEach((s, i) => gd.appendChild(styleCard(s, 'D' + String(i + 1).padStart(2, '0'), '蒸馏'))); buildBlocks(); $('#n-term').textContent = D.terms.length; $('#n-wm').textContent = WM.length;
    const gh = $('#g-house'), gm = $('#g-mg'); HOUSE.forEach((s, i) => gh.appendChild(styleCard(s, 'H' + String(i + 1).padStart(2, '0'), '工作流里现成的'))); D.mg.forEach((s, i) => gm.appendChild(styleCard(s, 'S' + String(i + 1).padStart(2, '0'), 'mg-styles-15')));
    // 名词：按包筛选 + 搜索
    const chips = $('#term-chips'), gt = $('#g-terms'); let pack = 'all', q = '';
    const draw = () => { gt.innerHTML = ''; live.forEach((c) => { if (c.closest && c.closest('#g-terms')) live.delete(c); }); D.terms.filter((t) => (pack === 'all' || t.pack === pack) && (!q || (t.name + t.en + t.mean + t.cat).toLowerCase().includes(q))).forEach((t) => gt.appendChild(termCard(t))); $('#term-count').textContent = gt.children.length + ' 个'; };
    [{ id: 'all', title: '全部', n: D.terms.length }, ...D.packs].forEach((p) => { const b = el('button', p.id === 'all' ? 'on' : '', `${esc(p.title)} <small>${p.n}</small>`); b.onclick = () => { pack = p.id; $$('button', chips).forEach((x) => x.classList.remove('on')); b.classList.add('on'); draw(); }; chips.appendChild(b); });
    $('#term-q').oninput = (e) => { q = e.target.value.trim().toLowerCase(); draw(); }; draw();
    // 白模 + 皮肤
    const gw = $('#g-wm'), sk = $('#skins'); WM.forEach((w, i) => gw.appendChild(wmCard(w, i)));
    Object.entries(SKINS).forEach(([id, S]) => { const b = el('button', id === skin ? 'on' : '', `<i style="background:${S.hot};box-shadow:inset 0 0 0 4px ${S.bg}"></i>${esc(S.name)}`); b.onclick = () => { skin = id; $$('button', sk).forEach((x) => x.classList.remove('on')); b.classList.add('on'); }; sk.appendChild(b); });
    buildMixer();
    // 标签页
    $$('.tabs button').forEach((b) => b.onclick = () => { $$('.tabs button').forEach((x) => x.classList.toggle('on', x === b)); $$('.pane').forEach((p) => p.classList.toggle('on', p.id === b.dataset.pane)); window.scrollTo({ top: $('.tabs').offsetTop - 56, behavior: 'smooth' }); });
    $('#tray-copy').onclick = () => copy(picksText(), '已复制，去粘贴给 AI'); $('#tray-clear').onclick = () => { picks.clear(); $$('.card.picked').forEach((c) => c.classList.remove('picked')); $$('button.pick.on').forEach((b) => { b.classList.remove('on'); b.textContent = '选它'; }); refreshTray(); };
    const t0 = performance.now(); const frame = (now) => { const s = (now - t0) / 1000; if (!document.hidden) live.forEach((c) => c._draw && c._draw(s)); requestAnimationFrame(frame); }; requestAnimationFrame(frame);
  };

  // —— 混搭器 ——
  const FP = { name: '宁少 AI 进化论', slogan: '陪伴 AI 时代的超级个体', c1: '#0A0A0B', c2: '#D6FF3D', c3: '#F4F2EC', font: '思源黑体 Heavy（标题）、D-DIN Bold（数字）', motion: '出现用回弹，消失要快；切镜头时轻推近一下；全片只用一种缓动', rules: '字不压人脸；一屏只有一个重点；数字要有出处才上画面；全片最多三种颜色' };
  const TYPES = ['财经', '商业', '科技', '知识', '新闻', '历史', '故事', '情感', '生活', '老板', '访谈', '教育', '品牌', '健康'];
  const buildMixer = () => {
    const all = ALL(), pool = $('#mix-pool'), out = $('#mix-out'), order = []; let useFp = true, T = null;
    try { Object.assign(FP, JSON.parse(localStorage.getItem('atlas-fp') || '{}')); } catch (e) { /* 存不了就用默认 */ }
    const ids = ['name', 'slogan', 'c1', 'c2', 'c3', 'font', 'motion', 'rules', 'use'], by = (id) => all.find((x) => x.id === id);
    const big = $('#mix-big'); big.appendChild(pvCanvas(() => T, null));
    const render = () => { const pick = order.map(by); ids.forEach((k) => { const i = $('#fp-' + k); if (i) FP[k] = i.value; }); try { localStorage.setItem('atlas-fp', JSON.stringify(FP)); } catch (e) { /* 忽略 */ }
      $('#fp-sw').innerHTML = [FP.c1, FP.c2, FP.c3].map((c) => `<i style="background:${esc(c)}"></i>`).join('');
      $$('button', pool).forEach((b) => { const k = order.indexOf(b.dataset.id); b.classList.toggle('on', k >= 0); b.querySelector('u').textContent = k >= 0 ? ['结构', '皮肤', '点睛'][k] : ''; });
      const strip = $('#mix-strip'); strip.innerHTML = ''; pick.forEach((s2, i) => { const d = el('div', 'mini'); d.appendChild(pvCanvas(() => s2.t)); d.appendChild(el('span', '', `<b>${['结构', '皮肤', '点睛'][i]}</b> ${esc(s2.name)}`)); strip.appendChild(d); });
      T = pick.length ? PV.mix(pick[0].t, (pick[1] || pick[0]).t, pick[2] && pick[2].t, useFp ? FP : null) : null; $('#mix-empty').style.display = pick.length ? 'none' : 'flex';
      if (!pick.length) { out.textContent = '在左边点 1 到 3 种风格，上面立刻能看到混出来的样子，这里会生成一段可以直接发给 AI 的提示词。\n\n不知道怎么选，就点「帮我自动搭」。'; return; }
      const roles = ['版式、节奏和字幕样式（结构）', '配色、纹理和字体气质（皮肤）', '强调色和强调形状（点睛）'];
      out.textContent = (pick.length > 1 ? `请把下面 ${pick.length} 种风格混搭成一种属于我自己的新风格` : `请按「${pick[0].name}」的风格来做`) + `，用在：${FP.use || '一条 60 秒的口播'}。\n\n` +
        pick.map((s2, i) => `【${s2.name}】取它的${roles[i]}\n  特征：${s2.look || s2.intro}` + (s2.how ? `\n  做法：${s2.how}` : '')).join('\n') +
        `\n\n混出来的参数（可以直接用）：\n${JSON.stringify(T)}` +
        (useFp ? `\n\n我的个人指纹（必须保留，和上面冲突时以这里为准）：\n- 署名：${FP.name}｜${FP.slogan}\n- 配色：底色 ${FP.c1}，主色 ${FP.c2}，文字 ${FP.c3}\n- 字体：${FP.font}\n- 动效习惯：${FP.motion}\n- 规矩：${FP.rules}` : '') +
        `\n\n先出 3 张关键帧给我看（开头、中段、结尾各一张），我点头后再做整条。`; };
    const group = (title, arr) => { pool.appendChild(el('div', 'pool-h', title)); arr.forEach((s2) => { const b = el('button', s2.kind === 'house' ? 'house' : '', `${esc(s2.name)}<u></u>`); b.dataset.id = s2.id; b.onclick = () => { const k = order.indexOf(s2.id); if (k >= 0) order.splice(k, 1); else { if (order.length >= 3) { toast('最多选 3 种'); return; } order.push(s2.id); } render(); }; pool.appendChild(b); }); };
    group('工作流里现成的（最适合当「结构」）', all.filter((x) => x.kind === 'house')); group('蒸馏的大 V 风格', all.filter((x) => x.kind === 'distill')); group('动态设计风格', all.filter((x) => x.kind === 'mg'));
    ids.forEach((k) => { const i = $('#fp-' + k); if (i) { if (FP[k] != null) i.value = FP[k]; i.oninput = render; } });
    $('#mix-fp').onchange = (e) => { useFp = e.target.checked; render(); };
    // 帮我自动搭：按内容类型出三个方案
    const tc = $('#auto-types'), ap = $('#auto-props'); let seed = 1;
    const propose = (type) => { ap.innerHTML = ''; PV.auto(all, type, type + seed).forEach((o, i) => { const Tm = PV.mix(o.A.t, o.B.t, o.C && o.C.t, useFp ? FP : null), d = el('div', 'prop'); d.appendChild(pvCanvas(() => Tm)); d.appendChild(el('div', '', `<b>方案 ${'一二三'[i]}</b><p>${esc(o.why)}</p>`)); const b = el('button', '', '就用这个'); b.onclick = () => { order.length = 0; order.push(o.A.id, o.B.id); if (o.C) order.push(o.C.id); render(); toast('已选上，下面是效果'); window.scrollTo({ top: $('#mix-big').getBoundingClientRect().top + window.scrollY - 140, behavior: 'smooth' }); }; d.appendChild(b); ap.appendChild(d); }); };
    TYPES.forEach((ty, i) => { const b = el('button', i ? '' : 'on', ty); b.onclick = () => { $$('button', tc).forEach((x) => x.classList.remove('on')); b.classList.add('on'); seed = 1; propose(ty); }; tc.appendChild(b); });
    $('#auto-more').onclick = () => { seed++; propose($('button.on', tc).textContent); }; propose(TYPES[0]);
    $('#mix-rand').onclick = () => { order.length = 0; const n = 2 + (Math.random() < .4 ? 1 : 0); order.push(all.filter((x) => x.kind === 'house').sort(() => Math.random() - .5)[0].id, ...all.filter((x) => x.kind !== 'house').sort(() => Math.random() - .5).slice(0, n - 1).map((x) => x.id)); render(); };
    $('#mix-copy').onclick = () => copy(out.textContent, '混搭提示词已复制'); render();
  };
  // —— 组件积木：298 个组件按类分，和图鉴的四样东西怎么对上 ——
  const BLOCKS = [
    ['结构', '章节页、标题卡、结尾卡', '结构 · 广播风系统与文字', '风格库定它长什么样', '砸字、遮罩上滑、描边展开', '标题动画、遮罩显现'],
    ['文字与强调', '大字、金句、花字、打字、划重点', '文字与强调 · 纸面风 · 口播叠加 · 竖屏播报', '字体气质、字幕样式、强调形状都来自风格配方', '回弹入场、逐字打出、划线强调', '动态排版、打字机、高亮扫过'],
    ['数字与图表', '大数字、柱状、折线、对比、进度', '数据图表 · 数字 · 对比 · 市场', '强调色用在最重要的那根柱子上', '数字滚动、柱状生长、对比条、进度环', '数字递增；名词库「图解与图表」一整包'],
    ['关系与流程', '流程、时间线、组织、关系图', '关系与流程 · 时间 · 组织与人 · 流程与政策', '线和节点的粗细、圆角跟着风格走', '流程点亮、时间轴推进、天平倾斜', '线条描绘、交错动画'],
    ['画面与素材', '视频窗、图片墙、录屏、网页、设备', '视频与图片 · 网页与文档 · 录屏与设备', '版式（人全屏、分屏、小头像）决定它放哪', '卡片墙飞入、镜头缓推、圆洞穿越', '名词库「镜头运动与转场」两包、「UI 组件」'],
    ['转场与特效', '切镜头的冲击、粒子、故障、光效', '画面效果 · 炫技动效 · 运动手感 · 广播风粒子与终端', '纹理（颗粒、扫描线、辉光）来自风格配方', '顶一下、色散切、甩切、冲击波', '故障效果、冲击震动、遮罩转场'],
  ];
  const buildBlocks = () => { const tb = $('#blocks'); if (!tb) return; BLOCKS.forEach((r) => { tb.appendChild(el('tr', '', `<td><b>${r[0]}</b><small>${r[1]}</small></td><td>${r[2]}</td><td>${r[3]}</td><td>${r[4]}</td><td>${r[5]}</td>`)); }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
