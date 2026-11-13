// 网页与文档类组件。核心是 PageCam：网页截图、所有标注共用同一个镜头变换，换一张截图只需要换坐标。
// 坐标一律用「占整张截图的比例」（0–1），由采集脚本从页面排版量出，不靠目测。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, Pop, useT } from '../kit/kit';

export type ROI = { x: number; y: number; w: number; h: number };
export type Cam = { at: number; x: number; y: number; zoom: number; dur?: number };          // 镜头关键帧：中心（页面比例）与放大倍数
export type Mark = { roi: ROI; at: number; kind: 'marker' | 'box' | 'underline' | 'spot' | 'circle'; color?: string; label?: string };
const typed = (s: string, t: number, at: number, cps = 14) => s.slice(0, Math.max(0, Math.floor((t - at) * cps)));
const rnd = (i: number) => { const x = Math.sin(i * 78.233 + 12.9898) * 43758.5453; return x - Math.floor(x); };

/** 浏览器窗口：标题栏、地址栏（可逐字打出网址），内容区放任何东西。 */
export const BrowserFrame: React.FC<{ url: string; width?: number; height?: number; at?: number; typeAt?: number; tabs?: React.ReactNode; children: React.ReactNode }> = ({ url, width = 1500, height = 760, at = 0, typeAt, tabs, children }) => {
  const t = useT(), p = prog(t, at, 0.5);
  return (
    <div style={{ width, borderRadius: 18, overflow: 'hidden', background: '#1C212C', boxShadow: '0 40px 90px rgba(0,0,0,.6)', border: `1px solid ${C.line}`, opacity: p, transform: `translateY(${mix(40, 0, p)}px) scale(${mix(0.97, 1, p)})`, fontFamily: FONT }}>
      <div style={{ height: 58, display: 'flex', alignItems: 'center', gap: 10, padding: '0 20px' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <div key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}
        {tabs}
        <div style={{ flex: 1, marginLeft: 14, height: 36, borderRadius: 18, background: '#0F131B', color: C.muted, fontSize: 20, display: 'flex', alignItems: 'center', padding: '0 18px', whiteSpace: 'nowrap', overflow: 'hidden' }}>
          {typeAt === undefined ? url : typed(url, t, typeAt, 22)}{typeAt !== undefined && t > typeAt && typed(url, t, typeAt, 22).length < url.length && <span style={{ width: 2, height: 22, background: C.accent, marginLeft: 2 }} />}
        </div>
      </div>
      <div style={{ position: 'relative', width, height, overflow: 'hidden', background: '#fff' }}>{children}</div>
    </div>
  );
};

/** 页面镜头：在给定大小的窗口里「拍」一张网页截图。镜头按关键帧平滑移动；标注跟着页面一起动。 */
export const PageCam: React.FC<{ src: string; iw: number; ih: number; width: number; height: number; cams: Cam[]; marks?: Mark[] }> = ({ src, iw, ih, width, height, cams, marks = [] }) => {
  const t = useT(), s0 = width / iw;
  let cx = cams[0].x, cy = cams[0].y, z = cams[0].zoom;
  for (let i = 1; i < cams.length; i++) { const k = cams[i], p = inOut((t - k.at) / (k.dur ?? 1.2)); cx = mix(cx, k.x, p); cy = mix(cy, k.y, p); z = mix(z, k.zoom, p); }
  const s = s0 * z, clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  const left = clamp(width / 2 - cx * iw * s, width - iw * s, 0), top = clamp(height / 2 - cy * ih * s, Math.min(0, height - ih * s), 0);
  const box = (r: ROI) => ({ left: left + r.x * iw * s, top: top + r.y * ih * s, width: r.w * iw * s, height: r.h * ih * s });
  const spot = marks.find((m) => m.kind === 'spot'), sp = spot ? prog(t, spot.at, 0.5) : 0, sb = spot ? box(spot.roi) : null;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
      <Img src={staticFile(src)} style={{ position: 'absolute', left, top, width: iw * s, height: ih * s }} />
      {marks.filter((m) => m.kind !== 'spot').map((m, i) => { const b = box(m.roi), p = prog(t, m.at, m.kind === 'marker' ? 0.7 : 0.5), col = m.color ?? '#FFE24A';
        if (m.kind === 'marker') return <div key={i} style={{ position: 'absolute', left: b.left - 6, top: b.top + b.height * 0.08, width: (b.width + 12) * p, height: b.height * 0.9, background: col, mixBlendMode: 'multiply', borderRadius: 6 }} />;
        if (m.kind === 'underline') return <div key={i} style={{ position: 'absolute', left: b.left, top: b.top + b.height + 2, width: b.width * p, height: Math.max(5, b.height * 0.12), background: m.color ?? C.down, borderRadius: 4 }} />;
        if (m.kind === 'box') return <div key={i} style={{ position: 'absolute', left: b.left - 10, top: b.top - 8, width: b.width + 20, height: b.height + 16, border: `5px solid ${m.color ?? C.down}`, borderRadius: 12, opacity: p, transform: `scale(${mix(1.15, 1, p)})`, boxSizing: 'border-box' }} />;
        const rx = b.width / 2 + 26, ry = b.height / 2 + 18, len = 2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2);                    // circle：手绘椭圆圈 + 可选标签
        return <svg key={i} style={{ position: 'absolute', left: b.left - 40, top: b.top - 34, overflow: 'visible' }} width={b.width + 80} height={b.height + 68}>
          <ellipse cx={b.width / 2 + 40} cy={b.height / 2 + 34} rx={rx} ry={ry} fill="none" stroke={m.color ?? C.down} strokeWidth={6} strokeLinecap="round" strokeDasharray={`${len * 1.04 * p} ${len * 2}`} transform={`rotate(-3 ${b.width / 2 + 40} ${b.height / 2 + 34})`} />
          {m.label && <text x={b.width + 76} y={b.height / 2 + 44} fontFamily={FONT} fontWeight={900} fontSize={34} fill={m.color ?? C.down} opacity={prog(t, m.at + 0.5, 0.3)}>{m.label}</text>}
        </svg>; })}
      {sb && <div style={{ position: 'absolute', left: sb.left - 14, top: sb.top - 10, width: sb.width + 28, height: sb.height + 20, borderRadius: 12, boxShadow: `0 0 0 4000px rgba(8,11,17,${0.72 * sp})`, border: `3px solid rgba(255,255,255,${sp})` }} />}
    </div>
  );
};

/** 滚动网页：页面在浏览器里匀速滚到几个停靠点，每到一处停一下。stops 的 y 是停靠时窗口中心在页面上的位置。 */
export const PageScroll: React.FC<{ src: string; iw: number; ih: number; url: string; stops: { y: number; at: number; dur?: number }[]; at?: number; width?: number; height?: number }> = ({ src, iw, ih, url, stops, at = 0, width = 1500, height = 760 }) => (
  <BrowserFrame url={url} at={at} width={width} height={height}><PageCam src={src} iw={iw} ih={ih} width={width} height={height} cams={stops.map((s, i) => ({ at: s.at, x: 0.5, y: s.y, zoom: 1, dur: s.dur ?? (i ? 1.6 : 0) }))} /></BrowserFrame>
);
/** 原文聚焦：镜头推近到一句话，荧光笔扫过。先推镜头再划线，或同时。 */
export const PageFocus: React.FC<{ src: string; iw: number; ih: number; roi: ROI; at: number; zoom?: number; color?: string; width?: number; height?: number; start?: { x: number; y: number } }> = ({ src, iw, ih, roi, at, zoom = 1.9, color, width = 1500, height = 820, start }) => (
  <div style={{ position: 'relative', width, height, borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.6)' }}>
    <PageCam src={src} iw={iw} ih={ih} width={width} height={height} cams={[{ at: 0, x: start?.x ?? 0.5, y: start?.y ?? roi.y, zoom: 1 }, { at, x: roi.x + roi.w / 2, y: roi.y + roi.h / 2, zoom, dur: 1.3 }]} marks={[{ roi, at: at + 1.0, kind: 'marker', color }]} />
  </div>
);
/** 聚光：压暗整页，只留一块亮着。适合表格里的一个数、一段引文。 */
export const PageSpot: React.FC<{ src: string; iw: number; ih: number; roi: ROI; at: number; zoom?: number; width?: number; height?: number }> = ({ src, iw, ih, roi, at, zoom = 1.6, width = 1500, height = 820 }) => (
  <div style={{ position: 'relative', width, height, borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.6)' }}>
    <PageCam src={src} iw={iw} ih={ih} width={width} height={height} cams={[{ at: 0, x: 0.5, y: roi.y, zoom: 1 }, { at, x: roi.x + roi.w / 2, y: roi.y + roi.h / 2, zoom, dur: 1.2 }]} marks={[{ roi, at: at + 0.7, kind: 'spot' }]} />
  </div>
);
/** 页面巡游：镜头在一张长页面上挨个停靠几个兴趣点，每处用不同标注（框、下划线、手绘圈）。 */
export const PageTour: React.FC<{ src: string; iw: number; ih: number; points: { roi: ROI; at: number; kind: Mark['kind']; label?: string; zoom?: number }[]; width?: number; height?: number }> = ({ src, iw, ih, points, width = 1500, height = 820 }) => (
  <div style={{ position: 'relative', width, height, borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.6)' }}>
    <PageCam src={src} iw={iw} ih={ih} width={width} height={height} cams={[{ at: 0, x: 0.5, y: points[0].roi.y, zoom: 1 }, ...points.map((p) => ({ at: p.at, x: p.roi.x + p.roi.w / 2, y: p.roi.y + p.roi.h / 2, zoom: p.zoom ?? 1.6, dur: 1.1 }))]} marks={points.map((p) => ({ roi: p.roi, at: p.at + 0.9, kind: p.kind, label: p.label }))} />
  </div>
);
/** 放大镜：页面不动，一个圆形放大镜滑到目标上，镜片里是放大的原图。看一眼细节就走。 */
export const Magnifier: React.FC<{ src: string; iw: number; ih: number; view: number; roi: ROI; at: number; lens?: number; power?: number; width?: number; height?: number }> = ({ src, iw, ih, view, roi, at, lens = 360, power = 2.2, width = 1500, height = 820 }) => {
  const t = useT(), s = width / iw, top = Math.min(0, Math.max(height - ih * s, height / 2 - view * ih * s)), p = inOut((t - at) / 1.0);
  const tx = roi.x * iw * s + (roi.w * iw * s) / 2, ty = top + roi.y * ih * s + (roi.h * ih * s) / 2, lx = mix(width * 0.85, tx, p), ly = mix(height * 0.2, ty, p);
  return (
    <div style={{ position: 'relative', width, height, borderRadius: 18, overflow: 'hidden', boxShadow: '0 40px 90px rgba(0,0,0,.6)' }}>
      <Img src={staticFile(src)} style={{ position: 'absolute', left: 0, top, width: iw * s, height: ih * s }} />
      <div style={{ position: 'absolute', left: lx - lens / 2, top: ly - lens / 2, width: lens, height: lens, borderRadius: lens / 2, overflow: 'hidden', border: '8px solid #F3F1EA', boxShadow: '0 20px 50px rgba(0,0,0,.55)', opacity: prog(t, at - 0.2, 0.3) }}>
        <Img src={staticFile(src)} style={{ position: 'absolute', left: lens / 2 - lx * power, top: lens / 2 - (ly - top) * power, width: iw * s * power, height: ih * s * power }} />
      </div>
    </div>
  );
};

/** 切换标签页：浏览器里几个标签，到点切到下一个页面，内容横向滑动。 */
export const TabSwitch: React.FC<{ tabs: { title: string; src: string }[]; ats: number[]; url: string; width?: number; height?: number }> = ({ tabs, ats, url, width = 1500, height = 760 }) => {
  const t = useT(); let cur = 0; ats.forEach((a, i) => { cur = mix(cur, i + 1, inOut((t - a) / 0.6)); }); const act = Math.round(cur);
  return (
    <BrowserFrame url={url} width={width} height={height} tabs={<div style={{ display: 'flex', gap: 6, marginLeft: 16 }}>{tabs.map((tb, i) => <div key={tb.title} style={{ height: 40, padding: '0 18px', borderRadius: '10px 10px 0 0', background: i === act ? '#0F131B' : 'transparent', color: i === act ? C.text : C.muted, fontSize: 18, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap', marginTop: 18 }}>{tb.title}</div>)}</div>}>
      <div style={{ position: 'absolute', left: -cur * width, top: 0, display: 'flex' }}>{tabs.map((tb) => <Img key={tb.src} src={staticFile(tb.src)} style={{ width, height, objectFit: 'cover', objectPosition: 'top' }} />)}</div>
    </BrowserFrame>
  );
};
/** 翻页：一张页面像纸一样翻过去，露出下一张。 */
export const PageFlip: React.FC<{ a: string; b: string; at: number; width?: number; height?: number }> = ({ a, b, at, width = 1300, height = 731 }) => {
  const t = useT(), p = inOut((t - at) / 1.0);
  return (
    <div style={{ position: 'relative', width, height, perspective: 2400 }}>
      <Img src={staticFile(b)} style={{ position: 'absolute', inset: 0, width, height, borderRadius: 14, boxShadow: '0 40px 90px rgba(0,0,0,.6)' }} />
      <div style={{ position: 'absolute', inset: 0, transformOrigin: 'left center', transform: `rotateY(${-p * 115}deg)`, opacity: p > 0.96 ? 0 : 1 }}>
        <Img src={staticFile(a)} style={{ width, height, borderRadius: 14, filter: `brightness(${1 - p * 0.45})` }} />
      </div>
    </div>
  );
};

/** 新闻标题堆叠：几家媒体的标题卡一张张拍上来，略带角度，最新的在最上面。 */
export const HeadlineStack: React.FC<{ items: { source: string; title: string; time: string }[]; ats: number[]; width?: number }> = ({ items, ats, width = 1100 }) => {
  const t = useT();
  return (
    <div style={{ position: 'relative', width, height: 470 }}>
      {items.map((it, i) => { const p = prog(t, ats[i], 0.4), later = items.slice(i + 1).reduce((n, _, k) => n + prog(t, ats[i + 1 + k], 0.4), 0);
        return <div key={it.title} style={{ position: 'absolute', left: i * 26, top: 40 + i * 34, width: width - 80, background: '#F2F0EA', color: '#14171D', borderRadius: 14, padding: '26px 32px', boxShadow: '0 22px 50px rgba(0,0,0,.5)', opacity: p * mix(1, 0.86, Math.min(1, later)), transform: `translateY(${mix(70, 0, p)}px) rotate(${(rnd(i) - 0.5) * 5}deg) scale(${mix(1.06, 1, p)})`, transformOrigin: 'left center' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 22, color: '#6B7280' }}><span style={{ fontWeight: 900, color: '#C2362B' }}>{it.source}</span><span>{it.time}</span></div>
          <div style={{ fontSize: 44, fontWeight: 900, lineHeight: 1.3, marginTop: 8 }}>{it.title}</div>
        </div>; })}
    </div>
  );
};
/** 搜索：搜索框里逐字打出关键词，结果一条条升上来。 */
export const SearchType: React.FC<{ query: string; results: { title: string; meta: string }[]; at: number; width?: number }> = ({ query, results, at, width = 1100 }) => {
  const t = useT(), q = typed(query, t, at + 0.3, 9), done = at + 0.3 + query.length / 9 + 0.3;
  return (
    <Pop at={at} dy={30}><div style={{ width, fontFamily: FONT }}>
      <div style={{ height: 92, borderRadius: 46, background: '#F2F0EA', color: '#14171D', display: 'flex', alignItems: 'center', padding: '0 34px', gap: 20, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2.6" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>
        <div style={{ fontSize: 44, fontWeight: 600, whiteSpace: 'nowrap' }}>{q}{q.length < query.length && <span style={{ display: 'inline-block', width: 3, height: 44, background: C.accent, marginLeft: 3, verticalAlign: 'middle' }} />}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 26 }}>{results.map((r, i) => <Pop key={r.title} at={done + i * 0.28}><div style={{ background: C.glass, border: `1.5px solid ${C.line}`, borderRadius: 16, padding: '18px 28px' }}><div style={{ fontSize: 34, fontWeight: 600, color: C.text, whiteSpace: 'nowrap' }}>{r.title}</div><div style={{ fontSize: 22, color: C.muted, marginTop: 4 }}>{r.meta}</div></div></Pop>)}</div>
    </div></Pop>
  );
};
/** 文件提要：一页文件，几处被框出来，对应的要点一条条抽到右边。适合公告、财报、合同。 */
export const DocExtract: React.FC<{ title: string; fields: { key: string; value: string; at: number; line: number }[]; at: number }> = ({ title, fields, at }) => {
  const t = useT(), widths = [0.9, 0.7, 0.95, 0.6, 0.85, 0.75, 0.92, 0.5, 0.88, 0.7, 0.8, 0.6];
  return (
    <div style={{ display: 'flex', gap: 60, alignItems: 'center', fontFamily: FONT }}>
      <Pop at={at} dy={40}><div style={{ width: 520, height: 660, background: '#EDEAE1', borderRadius: 10, padding: '40px 44px', boxSizing: 'border-box', color: '#14171D', boxShadow: '0 30px 70px rgba(0,0,0,.55)', position: 'relative' }}>
        <div style={{ fontSize: 36, fontWeight: 900, borderBottom: '3px solid #14171D', paddingBottom: 12 }}>{title}</div>
        {widths.map((w, i) => { const f = fields.find((x) => x.line === i), p = f ? prog(t, f.at, 0.35) : 0;
          return <div key={i} style={{ position: 'relative', height: 14, marginTop: 27 }}><div style={{ height: 14, borderRadius: 7, background: '#C9C5B9', width: `${w * 100}%` }} />{f && <div style={{ position: 'absolute', left: -10, top: -10, width: `calc(${w * 100}% + 20px)`, height: 34, border: `4px solid ${C.down}`, borderRadius: 8, opacity: p, boxSizing: 'border-box' }} />}</div>; })}
      </div></Pop>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>{fields.map((f) => <Pop key={f.key} at={f.at + 0.25}><div style={{ background: C.glass, border: `1.5px solid ${C.line}`, borderLeft: `8px solid ${C.down}`, borderRadius: 14, padding: '18px 30px', minWidth: 520 }}><div style={{ fontSize: 26, color: C.muted }}>{f.key}</div><div style={{ fontSize: 50, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{f.value}</div></div></Pop>)}</div>
    </div>
  );
};
/** 文件扇形：一叠文件像扇子一样展开，其中一份被抽出来放大。 */
export const PaperFan: React.FC<{ titles: string[]; pick: number; at: number; pickAt: number }> = ({ titles, pick, at, pickAt }) => {
  const t = useT(), n = titles.length, open = prog(t, at, 0.8), pk = inOut((t - pickAt) / 0.7);
  return (
    <div style={{ position: 'relative', width: 1200, height: 620, fontFamily: FONT }}>
      {titles.map((ti, i) => { const a = (i - (n - 1) / 2) * 13 * open, me = i === pick;
        return <div key={ti} style={{ position: 'absolute', left: 600 - 150, top: 110, width: 300, height: 400, background: '#EDEAE1', borderRadius: 10, padding: 26, boxSizing: 'border-box', color: '#14171D', boxShadow: '0 20px 44px rgba(0,0,0,.5)', transformOrigin: '50% 150%', transform: `rotate(${me ? mix(a, 0, pk) : a}deg) translateY(${me ? -90 * pk : 0}px) scale(${me ? mix(1, 1.32, pk) : 1})`, zIndex: me ? 10 : i, opacity: me ? 1 : mix(1, 0.55, pk) }}>
          <div style={{ fontSize: 20, color: '#6B7280' }}>文件 {i + 1}</div><div style={{ fontSize: 30, fontWeight: 900, lineHeight: 1.3, marginTop: 6 }}>{ti}</div>
          {[1, 0.8, 0.9, 0.6, 0.85].map((w, k) => <div key={k} style={{ height: 10, borderRadius: 5, background: '#C9C5B9', marginTop: 18, width: `${w * 100}%` }} />)}
        </div>; })}
    </div>
  );
};
/** 揭开涂黑：几行字被黑条盖着，到点黑条滑走。适合「原来写的是……」「被隐去的部分」。 */
export const RedactReveal: React.FC<{ lines: { text: string; hidden?: boolean; at?: number }[]; width?: number }> = ({ lines, width = 1100 }) => {
  const t = useT();
  return (
    <div style={{ width, background: '#EDEAE1', color: '#14171D', borderRadius: 12, padding: '44px 54px', boxShadow: '0 30px 70px rgba(0,0,0,.55)', fontFamily: FONT }}>
      {lines.map((l) => { const p = l.hidden ? prog(t, l.at ?? 0, 0.6) : 1;
        return <div key={l.text} style={{ position: 'relative', fontSize: 44, fontWeight: 600, lineHeight: 1.9, whiteSpace: 'nowrap' }}><span style={{ display: 'inline-block', position: 'relative' }}>{l.text}{l.hidden && <span style={{ position: 'absolute', right: 0, top: '14%', height: '72%', width: `${(1 - p) * 100}%`, background: '#14171D', borderRadius: 4 }} />}</span></div>; })}
    </div>
  );
};
/** 帖子卡：社交平台上一条帖子的样子，头像、名字、正文、互动数。正文是引用内容，要有出处。 */
export const SocialPost: React.FC<{ name: string; handle: string; text: string; stats: { label: string; value: string }[]; at: number; width?: number }> = ({ name, handle, text, stats, at, width = 980 }) => {
  const t = useT();
  return (
    <Pop at={at} dy={40}><div style={{ width, background: '#F2F0EA', color: '#14171D', borderRadius: 22, padding: '34px 40px', boxShadow: '0 30px 70px rgba(0,0,0,.55)', fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}><div style={{ width: 76, height: 76, borderRadius: 38, background: C.accent, color: '#fff', fontSize: 38, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{name.slice(0, 1)}</div><div><div style={{ fontSize: 34, fontWeight: 900 }}>{name}</div><div style={{ fontSize: 24, color: '#6B7280' }}>{handle}</div></div></div>
      <div style={{ fontSize: 42, fontWeight: 600, lineHeight: 1.55, marginTop: 22 }}>{typed(text, t, at + 0.4, 16)}</div>
      <div style={{ display: 'flex', gap: 44, marginTop: 24, paddingTop: 20, borderTop: '2px solid #D9D5C9' }}>{stats.map((s, i) => <div key={s.label} style={{ opacity: prog(t, at + 0.6 + text.length / 16 + i * 0.15, 0.3) }}><span style={{ fontSize: 34, fontWeight: 900 }}>{s.value}</span><span style={{ fontSize: 24, color: '#6B7280', marginLeft: 8 }}>{s.label}</span></div>)}</div>
    </div></Pop>
  );
};
