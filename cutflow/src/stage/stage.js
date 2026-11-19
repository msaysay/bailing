/* 舞台引擎：window.Stage.frame(t) 把时间 t 的整帧画成 DOM（立即模式，纯函数）。
 * 背景层上给视频“开窗”（透明洞），ffmpeg 把主讲人/素材垫在洞下面，所以圆形头像、圆角卡片、
 * 入场动效全在这里做，ffmpeg 只负责把矩形视频摆到位。Node 端（render.js）也 require 本文件取版式坐标。 */
(function (global) {
  const W = 1080, H = 1920;

  // ---------- 版式（设计稿坐标，量自对标成片 ×1.5） ----------
  const LAYOUTS = {
    talk:       { sub: { y: 1215, size: 72, font: 'talk' } },
    band:       { media: { x: 0, y: 478, w: 1080, h: 964, r: 0, style: 'band' },
                  host: { shape: 'circle', cx: 540, cy: 372, r: 196 }, sub: { y: 1532, size: 62, font: 'card' } },
    cardTop:    { media: { x: 34, y: 248, w: 1012, h: 724, r: 28, style: 'card' },
                  host: { shape: 'rect', x: 206, y: 1122, w: 668, h: 486, r: 12 }, sub: { y: 1040, size: 62, font: 'card' } },
    cardBottom: { host: { shape: 'rect', x: 140, y: 330, w: 800, h: 520, r: 12 },
                  media: { x: 56, y: 1060, w: 968, h: 545, r: 28, style: 'gold' }, sub: { y: 950, size: 62, font: 'card' } },
    data:       { host: { shape: 'circle', cx: 540, cy: 250, r: 130 },
                  panel: { x: 70, y: 440, w: 940, h: 920 }, sub: { y: 1500, size: 62, font: 'card' } },
  };
  const HOST_RIGHT = { band: { shape: 'circle', cx: 884, cy: 330, r: 150 }, data: { shape: 'circle', cx: 890, cy: 230, r: 112 } };

  function layoutOf(scene) {
    const base = LAYOUTS[scene.layout];
    if (!base) throw new Error('未知版式: ' + scene.layout);
    const L = JSON.parse(JSON.stringify(base));
    if (scene.hostPos === 'right' && HOST_RIGHT[scene.layout]) L.host = { ...HOST_RIGHT[scene.layout] };
    return L;
  }
  // 给 ffmpeg 用的矩形：洞的外接矩形（最终态）
  function rectsOf(scene) {
    const L = layoutOf(scene), out = {};
    if (L.host) out.host = L.host.shape === 'circle'
      ? { x: L.host.cx - L.host.r, y: L.host.cy - L.host.r, w: L.host.r * 2, h: L.host.r * 2 }
      : { x: L.host.x, y: L.host.y, w: L.host.w, h: L.host.h };
    if (L.media) out.media = { x: L.media.x, y: L.media.y, w: L.media.w, h: L.media.h };
    return out;
  }

  // ---------- 动效基础 ----------
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, s, d) => clamp((t - s) / d);
  const E = {
    out3: p => 1 - Math.pow(1 - p, 3),
    out5: p => 1 - Math.pow(1 - p, 5),
    inOut: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
    back: p => { const c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); },
  };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const px = n => (Math.round(n * 100) / 100) + 'px';
  // 入场/出场包络：0→1（in 秒）…保持…1→0（out 秒）
  const envelope = (t, s, e, din = .25, dout = .18) => Math.min(prog(t, s, din), 1 - prog(t, e - dout, dout));

  let TL = null; const POOL = {};
  function load(timeline) {
    TL = timeline;
    TL.scenes.forEach((s, i) => { s._prev = TL.scenes[i - 1] || null; });
    TL.subs = TL.subs || []; TL.overlays = TL.overlays || [];
  }
  const sceneAt = t => TL.scenes.find(s => t >= s.start && t < s.end) || TL.scenes[TL.scenes.length - 1];

  // ---------- 背景 + 开窗 ----------
  function holePath(shape, k) { // k: 缩放（绕中心）
    if (shape.shape === 'circle') {
      const r = shape.r * k, { cx, cy } = shape;
      return `M${cx - r},${cy}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0Z`;
    }
    const w = shape.w * k, h = shape.h * k, x = shape.x + (shape.w - w) / 2, y = shape.y + (shape.h - h) / 2, r = Math.min(shape.r || 0, w / 2, h / 2);
    if (!r) return `M${x},${y}h${w}v${h}h${-w}Z`;
    return `M${x + r},${y}h${w - 2 * r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(w - 2 * r)}a${r},${r} 0 0 1 ${-r},${-r}v${-(h - 2 * r)}a${r},${r} 0 0 1 ${r},${-r}Z`;
  }
  function background(t, scene, L, anim) {
    let d = `M0,0h${W}v${H}h${-W}Z`;
    if (L.media) d += holePath(L.media, anim.mediaK);
    if (L.host) d += holePath(L.host, anim.hostK);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><path fill-rule="evenodd" d="${d}"/></svg>`;
    const mask = `url('data:image/svg+xml;utf8,${encodeURIComponent(svg)}')`;
    const bx = 540 + Math.sin(t * .21) * 260, by = 620 + Math.cos(t * .17) * 220;
    const cx = 540 + Math.cos(t * .13 + 2) * 300, cy = 1380 + Math.sin(t * .19 + 1) * 200;
    return `<div class="full bg" style="-webkit-mask-image:${mask};mask-image:${mask}">
      <div class="blob" style="left:${px(bx - 450)};top:${px(by - 450)};background:#2a4fd0"></div>
      <div class="blob" style="left:${px(cx - 450)};top:${px(cy - 450)};background:#5a2bd0;opacity:.13"></div>
      <div class="grid"></div><div class="vig"></div></div>`;
  }

  // ---------- 画框装饰 ----------
  function frames(t, scene, L, anim) {
    let h = '';
    const st = t - scene.start;
    if (L.media) {
      const m = L.media, k = anim.mediaK, w = m.w * k, hh = m.h * k, x = m.x + (m.w - w) / 2, y = m.y + (m.h - hh) / 2;
      if (anim.mediaShut > 0.002) h += `<div class="abs shutter" style="left:${px(x)};top:${px(y)};width:${px(w)};height:${px(hh)};border-radius:${m.r}px;opacity:${anim.mediaShut}"></div>`;
      if (m.style === 'band') {
        const sx = scene._same ? 1 : E.out5(prog(st, .05, .55));
        h += `<div class="abs glowline" style="left:0;width:${W}px;top:${m.y - 3}px;transform:scaleX(${sx})"></div>`;
        h += `<div class="abs glowline" style="left:0;width:${W}px;top:${m.y + m.h - 2}px;transform:scaleX(${sx})"></div>`;
      } else {
        h += `<div class="abs card-border ${m.style === 'gold' ? 'gold' : ''}" style="left:${px(x)};top:${px(y)};width:${px(w)};height:${px(hh)};border-radius:${m.r}px;opacity:${anim.mediaIn}"></div>`;
      }
    }
    if (L.host) {
      const o = L.host, k = anim.hostK;
      if (o.shape === 'circle') {
        const r = o.r * k;
        h += `<div class="abs ring" style="left:${px(o.cx - r)};top:${px(o.cy - r)};width:${px(2 * r)};height:${px(2 * r)};opacity:${anim.hostIn}"></div>`;
      } else {
        const p = scene._same ? 1 : E.out5(prog(st, .12, .5));
        const x0 = o.x - 16, y0 = o.y - 16, x1 = o.x + o.w + 16, y1 = o.y + o.h + 16;
        h += `<div class="abs card-border" style="left:${o.x}px;top:${o.y}px;width:${o.w}px;height:${o.h}px;border-radius:${o.r}px;opacity:${anim.hostIn * .6}"></div>`;
        h += `<div class="abs brk" style="left:${x0 - 30}px;top:${y0}px;width:190px;height:3px;transform-origin:left;transform:scaleX(${p})"></div>`;
        h += `<div class="abs brk" style="left:${x0}px;top:${y0 - 30}px;width:3px;height:120px;transform-origin:top;transform:scaleY(${p})"></div>`;
        h += `<div class="abs brk" style="left:${x1 - 160}px;top:${y1}px;width:190px;height:3px;transform-origin:right;transform:scaleX(${p})"></div>`;
        h += `<div class="abs brk" style="left:${x1}px;top:${y1 - 90}px;width:3px;height:120px;transform-origin:bottom;transform:scaleY(${p})"></div>`;
        h += `<div class="abs dot" style="left:${x0 - 30}px;top:${y0 + 22}px;opacity:${p}"></div><div class="abs dot" style="left:${x0 + 30}px;top:${y0 - 22}px;opacity:${p * .7}"></div>`;
        h += `<div class="abs dot" style="left:${x1 + 22}px;top:${y1 - 30}px;opacity:${p}"></div><div class="abs dot" style="left:${x1 - 40}px;top:${y1 + 14}px;opacity:${p * .7}"></div>`;
      }
    }
    return h;
  }

  // ---------- 字幕 ----------
  function hlText(text, hl) {
    let out = esc(text);
    (hl || []).forEach(w => { const e = esc(w); if (e) out = out.split(e).join(`<span class="hl">${e}</span>`); });
    return out;
  }
  const textLen = s => [...s].reduce((n, c) => n + (c.charCodeAt(0) < 128 ? .58 : 1), 0);
  function subtitle(t, scene, L, pushY) {
    const s = TL.subs.find(x => t >= x.start && t < x.end);
    if (!s || s.hide) return '';
    const cfg = L.sub, st = t - s.start;
    const p = E.out3(prog(st, 0, .14));
    const size = Math.min(s.emph ? cfg.size * 1.12 : cfg.size, (W - 110) / textLen(s.text));
    const y = cfg.y + (pushY || 0) - size * .6;
    const sc = s.emph ? lerp(1.22, 1, E.out5(prog(st, 0, .22))) : lerp(.965, 1, p);
    return `<div class="sub ${cfg.font} ${s.emph ? 'emph' : ''}" style="top:${px(y)};font-size:${px(size)};opacity:${p};transform:translateY(${px((1 - p) * 16)}) scale(${sc});filter:blur(${px((1 - p) * 5)})">${hlText(s.text, s.hl)}</div>`;
  }

  // ---------- 花字 / 贴片 ----------
  const OV = {
    // 关键词大字：逐字砸入 + 扫光 + 下划线
    keyword(o, t, L) {
      const st = t - o.start, out = 1 - prog(t, o.end - .16, .16);
      const size = Math.min(o.size || 96, (W - 140) / textLen(o.text));
      const y = (o.y != null ? o.y : L.sub.y - 150) - size * .6;
      const chars = [...o.text].map((c, i) => {
        const p = prog(st, i * .035, .22), e = E.out5(p), n = [...o.text].length;
        const sweep = prog(st, .3, .5) * (n + 4) - 2, glow = 1 + .9 * Math.exp(-Math.pow(i - sweep, 2) / 1.6);   // 入场后一道扫光
        return `<span style="opacity:${clamp(p * 3)};transform:translateY(${px((1 - e) * 26)}) scale(${lerp(1.7, 1, e)});filter:blur(${px((1 - e) * 10)}) brightness(${glow.toFixed(3)})">${esc(c)}</span>`;
      }).join('');
      const tw = size * textLen(o.text) + (o.spacing || 6) * o.text.length, x0 = (W - tw) / 2;
      const bar = E.out5(prog(st, .22, .45));
      return `<div class="kw ${o.color || 'gold'}" style="top:${px(y)};font-size:${px(size)};letter-spacing:${o.spacing || 6}px;opacity:${out}">${chars}
        <div class="bar" style="left:${px(x0)};top:${px(size * 1.22)};width:${px(tw)};transform-origin:left;transform:scaleX(${bar})"></div></div>`;
    },
    // 分点清单：逐条滑入，新条出现时旧条压暗
    list(o, t, L) {
      const size = o.size || 66, gap = size * 1.5, x = o.x != null ? o.x : 250, y0 = o.y != null ? o.y : L.sub.y - 120;
      const out = 1 - prog(t, o.end - .18, .18), colors = { gold: 'var(--gold)', red: 'var(--red)', white: '#fff' };
      return o.items.map((it, i) => {
        if (t < it.at) return '';
        const p = E.out5(prog(t, it.at, .32)), next = o.items[i + 1];
        const dim = next && t >= next.at ? lerp(1, .5, prog(t, next.at, .25)) : 1;
        return `<div class="li" style="left:${px(x - (1 - p) * 60)};top:${px(y0 + i * gap - size * .6)};font-size:${size}px;color:${colors[it.color || 'gold']};opacity:${clamp(p * 2) * dim * out};filter:blur(${px((1 - p) * 6)})"><i>${String(i + 1).padStart(2, '0')}</i>${esc(it.text)}</div>`;
      }).join('');
    },
    // 章节角标：紫色斜切横幅 + 黄色序号
    chapter(o, t) {
      const st = t - o.start, out = 1 - prog(t, o.end - .2, .2);
      const wipe = E.out5(prog(st, 0, .45)), pop = E.back(prog(st, .18, .32));
      const y = o.y != null ? o.y : 196;
      return `<div class="chap" style="left:0;top:${y}px;opacity:${out}">
        <div class="ban" style="clip-path:polygon(0 0, ${wipe * 100}% 0, calc(${wipe * 100}% - 44px) 100%, 0 100%);transform:translateX(${px((1 - wipe) * -40)})"><b>${esc(o.title)}</b>${o.en ? `<em>${esc(o.en)}</em>` : ''}</div>
        <div class="no" style="transform-origin:left bottom;transform:scale(${pop});opacity:${clamp(pop)}">${esc(o.no)}</div></div>`;
    },
    // 素材上的红色标注字（可带白色副标）
    label(o, t) {
      const st = t - o.start, out = 1 - prog(t, o.end - .16, .16), p = E.out5(prog(st, 0, .28)), p2 = E.out3(prog(st, .3, .25));
      const size = o.size || 70;
      const pos = o.x != null ? `left:${o.x}px;` : `left:0;width:${W}px;text-align:center;`;
      return `<div class="label" style="${pos}top:${px(o.y)};font-size:${size}px;opacity:${out}">
        <span class="t" style="opacity:${clamp(p * 2)};transform:translateX(${px((1 - p) * -50)}) skewX(${(1 - p) * -18}deg) scale(${lerp(1.15, 1, p)});filter:blur(${px((1 - p) * 8)})">${esc(o.text)}</span>
        ${o.sub ? `<span class="s" style="font-size:${px(size * .82)};opacity:${p2};transform:translateY(${px((1 - p2) * 14)})">${esc(o.sub)}</span>` : ''}</div>`;
    },
    // 图片卡：截图、报道、logo。压在任意版式上，带白边、轻微倾斜和投影（成片里“新闻截图飞进来”那种）
    image(o, t) {
      const st = t - o.start, p = E.out5(prog(st, 0, .4)), out = 1 - prog(t, o.end - .18, .18), rot = o.rotate != null ? o.rotate : -3;
      const drift = 1 + .03 * prog(t, o.start, o.end - o.start);
      return `<div class="abs" style="left:${o.x}px;top:${px(o.y + (1 - p) * 90)};width:${o.w}px;${o.h ? `height:${o.h}px;` : ''}border-radius:${o.r != null ? o.r : 18}px;overflow:hidden;border:${o.border != null ? o.border : 6}px solid #fff;box-shadow:0 30px 70px rgba(0,0,0,.6);opacity:${clamp(p * 2.5) * out};transform:rotate(${rot * (2 - p)}deg) scale(${lerp(.88, 1, p) * drift})"><span data-img="${esc(o.src)}" style="display:block;width:100%;${o.h ? 'height:100%;' : ''}"></span></div>`;
    },
    // 取景框
    rec(o, t) {
      const a = envelope(t, o.start, o.end, .2, .2), m = 54, s = 1 + (1 - E.out5(prog(t, o.start, .4))) * .06;
      const blink = Math.floor((t - o.start) * 2) % 2 === 0 ? 1 : .25;
      const c = (pos, b) => `<div class="c" style="${pos};${b}"></div>`;
      return `<div class="full rec" style="opacity:${a};transform:scale(${s})">
        ${c(`left:${m}px;top:${m + 60}px`, 'border-right:0;border-bottom:0')}${c(`right:${m}px;top:${m + 60}px`, 'border-left:0;border-bottom:0')}
        ${c(`left:${m}px;bottom:${m + 60}px`, 'border-right:0;border-top:0')}${c(`right:${m}px;bottom:${m + 60}px`, 'border-left:0;border-top:0')}
        <div class="txt" style="right:${m + 40}px;top:${m + 84}px"><span class="r" style="opacity:${blink}"></span>REC</div>
        <div class="txt" style="left:${m + 40}px;bottom:${m + 84}px">4K 60FPS</div><div class="txt" style="right:${m + 40}px;bottom:${m + 84}px">HD</div></div>`;
    },
    // 结尾金句：书法体砸入 + 暖光闪
    punch(o, t) {
      const st = t - o.start, p = E.out5(prog(st, 0, .32)), out = 1 - prog(t, o.end - .2, .2);
      const lines = String(o.text).split('\n'), size = o.size || Math.min(120, (W - 160) / Math.max(...lines.map(textLen)));
      const shake = Math.exp(-st * 9) * 14, dx = Math.sin(st * 90) * shake, dy = Math.cos(st * 70) * shake;
      const flash = Math.exp(-st * 5) * .9;
      const y = (o.y != null ? o.y : 1180) - size * lines.length * .56;
      return `<div class="full flash" style="opacity:${flash * out}"></div>
        <div class="punch" style="top:${px(y)};font-size:${px(size)};opacity:${clamp(p * 3) * out};transform:translate(${px(dx)},${px(dy)}) rotate(${o.rotate != null ? o.rotate : -6}deg) scale(${lerp(2.1, 1, p)});filter:blur(${px((1 - p) * 12)})">${lines.map(esc).join('<br>')}</div>`;
    },
  };

  // ---------- 数据面板（data 版式） ----------
  const fmt = (v, dec) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const PANELS = {
    stat(pn, t, st, R) { // 大数字滚动
      const at = pn.at || .25, p = E.out5(prog(st, at, pn.dur || 1.1)), dec = pn.decimals || 0;
      const v = lerp(pn.from || 0, pn.to, p), a = E.out3(prog(st, at - .1, .3));
      const size = Math.min(300, (R.w - 160) / ((fmt(pn.to, dec).length + (pn.unit ? textLen(pn.unit) * .5 : 0)) * .62));
      return `<div class="big" style="top:${px(R.h * .5 - size * .72)};font-size:${px(size)};opacity:${a};transform:scale(${lerp(.86, 1, a)})">${pn.prefix ? esc(pn.prefix) : ''}${fmt(v, dec)}${pn.unit ? `<u style="font-size:${px(size * .34)}">${esc(pn.unit)}</u>` : ''}</div>
        ${pn.caption ? `<div class="cap" style="top:${px(R.h * .5 + size * .5)};font-size:46px;opacity:${E.out3(prog(st, at + .5, .4))}">${esc(pn.caption)}</div>` : ''}`;
    },
    compare(pn, t, st, R) { // 对比条
      const max = Math.max(...pn.rows.map(r => r.value)), top = 190, gap = (R.h - top - 60) / pn.rows.length;
      const col = { gold: 'linear-gradient(90deg,#ffb300,#ffd84a)', red: 'linear-gradient(90deg,#c81e1e,#ff5a4f)', blue: 'linear-gradient(90deg,#1d4ed8,#5b9dff)', gray: 'linear-gradient(90deg,#5b6478,#9aa3b8)' };
      return pn.rows.map((r, i) => {
        const at = (r.at != null ? r.at : .3 + i * .35), a = E.out3(prog(st, at, .3)), g = E.out5(prog(st, at + .05, .9)), dec = r.decimals || 0;
        return `<div class="row" style="top:${px(top + i * gap)};opacity:${a};transform:translateY(${px((1 - a) * 20)})">
          <div class="nm">${esc(r.label)}<span>${fmt(r.value * g, dec)}${r.unit ? `<small style="font-family:SubCard;font-size:34px;margin-left:8px;opacity:.75">${esc(r.unit)}</small>` : ''}</span></div>
          <div class="track"><div class="fill" style="width:${(r.value / max) * 100 * g}%;background:${col[r.color || 'gold']}"></div></div></div>`;
      }).join('');
    },
    steps(pn, t, st, R) { // 流程/因果链
      const top = 180, gap = Math.min(170, (R.h - top - 40) / pn.items.length);
      return pn.items.map((it, i) => {
        const at = (it.at != null ? it.at : .3 + i * .5), a = E.out5(prog(st, at, .35)), y = top + i * gap;
        const conn = i > 0 ? `<div class="conn" style="top:${px(y - (gap - 124))};height:${px(gap - 124)};transform:scaleY(${E.out3(prog(st, at - .15, .25))})"></div>` : '';
        return `${conn}<div class="step" style="top:${px(y)};opacity:${clamp(a * 2)};transform:translateX(${px((1 - a) * 50)});${it.hl ? 'border-color:rgba(255,216,74,.8);box-shadow:0 0 30px rgba(255,190,40,.3)' : ''}"><i>${i + 1}</i>${esc(it.text)}</div>`;
      }).join('');
    },
  };
  // 折线走势：points 是数值数组（或 [{x,y}]），线从左画到右，终点带数值
  PANELS.line = (pn, t, st, R) => {
    const pts = pn.points.map((p, i) => typeof p === 'number' ? { x: i, y: p } : p), x0 = 70, y0 = 190, w = R.w - 140, h = R.h - 330;
    const xs = pts.map(p => p.x), ys = pts.map(p => p.y), xa = Math.min(...xs), xb = Math.max(...xs), ya = Math.min(...ys), yb = Math.max(...ys), pad = (yb - ya) * .12 || 1;
    const X = v => x0 + (v - xa) / (xb - xa || 1) * w, Y = v => y0 + h - (v - (ya - pad)) / (yb - ya + 2 * pad) * h;
    const p = E.inOut(prog(st, pn.at || .3, pn.dur || 1.6)), n = pts.length - 1, f = p * n, k = Math.min(n - 1, Math.floor(f)), r = f - k;
    const cur = { x: lerp(X(pts[k].x), X(pts[k + 1].x), r), y: lerp(Y(pts[k].y), Y(pts[k + 1].y), r), v: lerp(pts[k].y, pts[k + 1].y, r) };
    const d = pts.slice(0, k + 1).map((q, i) => `${i ? 'L' : 'M'}${X(q.x).toFixed(1)},${Y(q.y).toFixed(1)}`).join('') + `L${cur.x.toFixed(1)},${cur.y.toFixed(1)}`;
    const col = pn.color === 'red' ? '#ff5a4f' : '#ffd84a', dec = pn.decimals || 0;
    const grid = [0, 1, 2, 3].map(i => `<line x1="${x0}" x2="${x0 + w}" y1="${y0 + h * i / 3}" y2="${y0 + h * i / 3}" stroke="rgba(255,255,255,.08)" stroke-width="2"/>`).join('');
    return `<svg class="abs" style="left:0;top:0" width="${R.w}" height="${R.h}">${grid}
      <path d="${d}L${cur.x.toFixed(1)},${y0 + h}L${x0},${y0 + h}Z" fill="${col}" opacity=".10"/>
      <path d="${d}" fill="none" stroke="${col}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" style="filter:drop-shadow(0 0 12px ${col})"/>
      <circle cx="${cur.x}" cy="${cur.y}" r="13" fill="#fff" stroke="${col}" stroke-width="6"/></svg>
      <div class="abs" style="left:${px(Math.min(R.w - 330, Math.max(40, cur.x - 150)))};top:${px(cur.y - 120)};width:300px;text-align:center;font-family:Num;font-size:72px;font-variant-numeric:tabular-nums;text-shadow:0 4px 18px rgba(0,0,0,.8);opacity:${clamp(p * 4)}">${pn.prefix ? esc(pn.prefix) : ''}${fmt(cur.v, dec)}<span style="font-family:SubCard;font-size:36px;color:var(--gold);margin-left:6px">${pn.unit ? esc(pn.unit) : ''}</span></div>
      ${(pn.labels || []).map((lb, i, arr) => `<div class="abs" style="left:${px(x0 + w * i / (arr.length - 1 || 1) - 100)};top:${px(y0 + h + 24)};width:200px;text-align:center;font-family:Num;font-size:30px;color:rgba(255,255,255,.55)">${esc(lb)}</div>`).join('')}`;
  };
  // 引文/文件卡：来源 + 逐行出现的原话，hl 里的词划金线
  PANELS.quote = (pn, t, st, R) => {
    const lines = String(pn.text).split('\n');
    return `${pn.source ? `<div class="abs" style="left:56px;top:${R.h - 96}px;font-family:Num;font-size:30px;color:rgba(255,255,255,.5);opacity:${E.out3(prog(st, .2, .4))}">— ${esc(pn.source)}</div>` : ''}` + lines.map((ln, i) => {
      const a = E.out5(prog(st, .3 + i * .28, .4));
      return `<div class="abs" style="left:56px;right:56px;top:${px(170 + i * 96)};font-family:SubCard;font-size:${Math.min(60, (R.w - 112) / textLen(ln))}px;white-space:nowrap;opacity:${clamp(a * 2)};transform:translateY(${px((1 - a) * 22)});filter:blur(${px((1 - a) * 5)})">${hlText(ln, pn.hl)}</div>`;
    }).join('');
  };

  function panel(t, scene, L) {
    const pn = scene.panel; if (!pn || !L.panel) return '';
    const auto = pn.type === 'steps' ? 180 + pn.items.length * 170 + 10 : pn.type === 'compare' ? 190 + pn.rows.length * 190 + 30 : pn.type === 'stat' ? 640 : pn.type === 'line' ? 760 : pn.type === 'quote' ? 170 + String(pn.text).split('\n').length * 96 + 130 : L.panel.h;
    const R = { ...L.panel, h: pn.h || Math.min(L.panel.h, auto) }, st = t - scene.start;
    R.y = L.panel.y + (L.panel.h - R.h) / 2 - 40;
    const p = E.out5(prog(st, 0, .45));
    return `<div class="panel" style="left:${R.x}px;top:${px(R.y + (1 - p) * 60)};width:${R.w}px;height:${R.h}px;opacity:${clamp(p * 2)};transform:scale(${lerp(.96, 1, p)})">
      ${pn.title ? `<div class="hd">${esc(pn.title)}</div>` : ''}${PANELS[pn.type](pn, t, st, R)}</div>`;
  }

  // ---------- 整帧 ----------
  function frame(t) {
    const scene = sceneAt(t), L = layoutOf(scene), st = t - scene.start;
    const prev = scene._prev;
    scene._same = !!(prev && prev.layout === scene.layout && (prev.hostPos || '') === (scene.hostPos || ''));
    const fresh = !scene._same;
    const mIn = E.out5(prog(st, 0, fresh ? .42 : .2)), hIn = fresh ? E.out5(prog(st, .06, .42)) : 1;
    const anim = {
      mediaK: L.media && L.media.style === 'band' ? 1 : lerp(fresh ? .9 : .97, 1, mIn),
      mediaShut: 1 - E.out3(prog(st, 0, fresh ? .3 : .16)), mediaIn: mIn,
      hostK: lerp(.8, 1, hIn), hostIn: hIn,
    };
    let html = '';
    if (scene.layout !== 'talk') html += background(t, scene, L, anim) + frames(t, scene, L, anim) + panel(t, scene, L);
    const act = TL.overlays.filter(o => t >= o.start && t < o.end);
    // 清单/关键词占了字幕位时，字幕下移让位
    let push = 0;
    act.forEach(o => { if (o.type === 'list' && o.y == null) push = Math.max(push, o.items.filter(i => t >= i.at).length * (o.size || 66) * 1.5 + 10); });
    act.forEach(o => { if (!OV[o.type]) throw new Error('未知贴片: ' + o.type); html += OV[o.type](o, t, L); });
    html += subtitle(t, scene, L, push);
    return html;
  }

  const api = { W, H, LAYOUTS, layoutOf, rectsOf, load, frame, overlayTypes: Object.keys(OV), panelTypes: Object.keys(PANELS),
    async preload(srcs) { for (const src of srcs) { const im = new Image(); im.src = src; im.style.cssText = 'display:block;width:100%;height:100%;object-fit:cover'; await im.decode(); POOL[src] = im; } },
    draw(t) { const root = document.getElementById('root'); root.innerHTML = frame(t); root.querySelectorAll('[data-img]').forEach(el => { const im = POOL[el.getAttribute('data-img')]; if (im) el.appendChild(im); }); } };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else global.Stage = api;
})(typeof window !== 'undefined' ? window : globalThis);
