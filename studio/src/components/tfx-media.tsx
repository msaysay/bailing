// 口播素材呈现 · 数据 · 运镜 · 转场（25 个）。本项目自写：只参考了口播片里常见的镜头用途清单，没有使用任何第三方代码。
// 约定同全库：时间用秒（at），useT() 取当前秒；转场组件都收 a（前一镜）、b（后一镜）、at（切换时刻），尺寸 w × h。
import React from 'react';
import { AbsoluteFill, Img } from 'remotion';
import { C, FONT, useT } from '../kit/kit';
import { inOut, mix, outCubic, prog } from '../kit/clock';
import { spring } from '../kit/motion';

const MONO = '"JetBrains Mono", "DejaVu Sans Mono", monospace';
const LIME = '#C6F432', CORAL = '#FF5A4E', INK = '#0B0E14';
const sp = (t: number, at: number, k = 200, d = 15) => (t < at ? 0 : spring(t - at, { from: 0, to: 1, stiffness: k, damping: d }));
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const hash = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const Fill: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => <Img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} />;

// ---------- 素材呈现 ----------
/** Z01 同源模糊底床：竖的素材放进横屏，背后铺一层同一素材放大加模糊压暗，不留黑边。 */
export const EchoBed: React.FC<{ children: React.ReactNode; w?: number; h?: number; fw?: number; fh?: number; at?: number }> = ({ children, w = 1920, h = 1080, fw = 560, fh = 996, at = 0 }) => {
  const t = useT(), k = sp(t, at, 160, 18);
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: INK }}>
    <div style={{ position: 'absolute', inset: -80, filter: 'blur(48px) brightness(.45) saturate(1.3)', transform: `scale(${mix(1.25, 1.1, k)})` }}>{children}</div>
    <div style={{ position: 'absolute', left: (w - fw) / 2, top: (h - fh) / 2, width: fw, height: fh, borderRadius: 18, overflow: 'hidden', boxShadow: '0 30px 90px rgba(0,0,0,.6)', transform: `translateY(${(1 - k) * 80}px) scale(${mix(0.9, 1, k)})`, opacity: clamp01(k * 2) }}>{children}</div>
  </div>;
};

/** Z02 AI 对话框：提问一个字一个字打出、发送，AI 先三个点思考，再一行行流出回答。不仿任何真实产品的界面。 */
export const AiChat: React.FC<{ q: string; a: string[]; at: number; w?: number; name?: string; accent?: string }> = ({ q, a, at, w = 1100, name = 'AI 助手', accent = LIME }) => {
  const t = useT(), qn = Math.floor(clamp01((t - at) / (q.length / 14)) * q.length), sent = at + q.length / 14 + 0.25, think = sent + 0.4, ans = think + 0.9;
  return <div style={{ width: w, background: '#12161E', borderRadius: 24, border: '1px solid rgba(255,255,255,.1)', overflow: 'hidden', fontFamily: FONT, boxShadow: '0 40px 100px rgba(0,0,0,.5)' }}>
    <div style={{ padding: '18px 28px', borderBottom: '1px solid rgba(255,255,255,.08)', display: 'flex', alignItems: 'center', gap: 12 }}><div style={{ width: 30, height: 30, borderRadius: 15, background: accent }} /><span style={{ fontSize: 26, fontWeight: 700, color: C.text }}>{name}</span></div>
    <div style={{ padding: '26px 30px', minHeight: 360, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {t >= sent && <div style={{ alignSelf: 'flex-end', maxWidth: '75%', background: accent, color: INK, fontSize: 32, fontWeight: 700, padding: '14px 22px', borderRadius: '22px 22px 6px 22px', transform: `scale(${sp(t, sent, 280, 18)})`, transformOrigin: 'right bottom' }}>{q}</div>}
      {t >= think && t < ans && <div style={{ display: 'flex', gap: 10, padding: 10 }}>{[0, 1, 2].map((i) => <i key={i} style={{ width: 14, height: 14, borderRadius: 7, background: C.muted, opacity: 0.4 + 0.6 * Math.abs(Math.sin((t - think) * 6 - i * 0.8)) }} />)}</div>}
      {t >= ans && <div style={{ color: C.text, fontSize: 30, lineHeight: 1.6 }}>{a.map((line, i) => { const s = ans + i * 0.55, n = Math.floor(clamp01((t - s) / 0.45) * line.length); return t < s ? null : <div key={i}>{line.slice(0, n)}{n < line.length && <span style={{ color: accent }}>▍</span>}</div>; })}</div>}
    </div>
    <div style={{ margin: '0 22px 22px', padding: '16px 22px', borderRadius: 16, background: '#1B212C', fontSize: 30, color: t < sent ? C.text : C.muted, minHeight: 40 }}>{t < sent ? <>{q.slice(0, qn)}<span style={{ opacity: Math.floor(t * 3) % 2 ? 0 : 1, color: accent }}>|</span></> : '继续提问…'}</div>
  </div>;
};

/** Z03 文档驻留发牌：一份文档先占画面，再缩到左边停住，右边一张张发出要点牌。 */
export const DocDeal: React.FC<{ doc: React.ReactNode; points: string[]; at: number; parkAt: number; gap?: number; w?: number; h?: number; accent?: string }> = ({ doc, points, at, parkAt, gap = 0.6, w = 1920, h = 1080, accent = LIME }) => {
  const t = useT(), k = sp(t, at, 160, 17), p = inOut((t - parkAt) / 0.6);
  return <div style={{ position: 'relative', width: w, height: h }}>
    <div style={{ position: 'absolute', left: mix(w / 2 - 450, 110, p), top: mix(h / 2 - 560, h / 2 - 410, p) + (1 - k) * 100, width: 900, height: 1120, transform: `scale(${mix(1, 0.72, p)}) rotate(${mix(0, -3, p)}deg)`, transformOrigin: 'left top', opacity: clamp01(k * 2), borderRadius: 12, overflow: 'hidden', boxShadow: '0 30px 80px rgba(0,0,0,.5)' }}>{doc}</div>
    <div style={{ position: 'absolute', left: 860, top: h / 2 - points.length * 70, display: 'flex', flexDirection: 'column', gap: 26 }}>
      {points.map((s, i) => { const a = parkAt + 0.5 + i * gap, q = sp(t, a, 220, 16); return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 34px', borderRadius: 60, background: '#161B25', border: `2px solid ${accent}55`, transform: `translateX(${(1 - q) * 600}px) rotate(${(1 - q) * 12}deg)`, opacity: clamp01(q * 2) }}><span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 30, color: INK, background: accent, borderRadius: 30, width: 50, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</span><span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 44, color: C.text, whiteSpace: 'nowrap' }}>{s}</span></div>; })}
    </div>
  </div>;
};

/** Z04 图块拼入：几张图从四面八方飞来，先挤成一团再弹开排成整齐的网格。 */
export const TileGather: React.FC<{ items: React.ReactNode[]; at: number; cols?: number; tw?: number; th?: number; gap?: number }> = ({ items, at, cols = 3, tw = 480, th = 300, gap = 30 }) => {
  const t = useT(), rows = Math.ceil(items.length / cols), W = cols * tw + (cols - 1) * gap, H = rows * th + (rows - 1) * gap, settle = inOut((t - at - 0.6) / 0.6);
  return <div style={{ position: 'relative', width: W, height: H }}>{items.map((it, i) => {
    const a = hash(i) * Math.PI * 2, d = 1400, fly = outCubic((t - at - i * 0.06) / 0.55), cx = W / 2 - tw / 2 + Math.cos(a) * d * (1 - fly), cy = H / 2 - th / 2 + Math.sin(a) * d * (1 - fly), gx = (i % cols) * (tw + gap), gy = Math.floor(i / cols) * (th + gap);
    const x = mix(cx + (hash(i + 9) - 0.5) * 60, gx, settle), y = mix(cy + (hash(i + 3) - 0.5) * 40, gy, settle), r = mix((hash(i + 5) - 0.5) * 30, 0, settle);
    return <div key={i} style={{ position: 'absolute', left: x, top: y, width: tw, height: th, borderRadius: mix(th / 2, 16, settle), overflow: 'hidden', transform: `rotate(${r}deg) scale(${mix(0.7, 1, settle)})`, boxShadow: '0 20px 50px rgba(0,0,0,.5)', opacity: clamp01(fly * 3) }}>{it}</div>; })}</div>;
};

/** Z05 信息卡逐字段自建：介绍一本书 / 一个工具 / 一个人。先出卡框，封面、名字、几行字段依次自己长出来。 */
export const InfoCardBuild: React.FC<{ cover?: React.ReactNode; title: string; sub?: string; fields: { k: string; v: string }[]; tags?: string[]; at: number; w?: number; accent?: string }> = ({ cover, title, sub, fields, tags = [], at, w = 1150, accent = LIME }) => {
  const t = useT(), box = inOut((t - at) / 0.5), step = (i: number) => at + 0.45 + i * 0.3;
  const Row: React.FC<{ i: number; children: React.ReactNode }> = ({ i, children }) => { const k = sp(t, step(i), 240, 17); return <div style={{ opacity: clamp01(k * 2), transform: `translateX(${(1 - k) * 40}px)` }}>{children}</div>; };
  return <div style={{ width: w, padding: 40, borderRadius: 26, background: '#141922', border: `2px solid rgba(255,255,255,${0.12 * box})`, clipPath: `inset(0 ${(1 - box) * 100}% 0 0 round 26px)`, display: 'flex', gap: 40, fontFamily: FONT }}>
    {cover && <div style={{ width: 300, height: 400, flex: 'none', borderRadius: 14, overflow: 'hidden', transform: `scale(${sp(t, at + 0.3, 200, 14)})` }}>{cover}</div>}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Row i={0}><div style={{ fontSize: 62, fontWeight: 900, color: C.text, lineHeight: 1.15 }}>{title}</div></Row>
      {sub && <Row i={1}><div style={{ fontSize: 30, color: C.muted }}>{sub}</div></Row>}
      <div style={{ height: 2, background: accent, width: `${inOut((t - step(2)) / 0.4) * 100}%`, margin: '6px 0' }} />
      {fields.map((f, i) => <Row key={i} i={2 + i}><div style={{ display: 'flex', gap: 22, fontSize: 32 }}><span style={{ width: 120, color: C.muted, flex: 'none' }}>{f.k}</span><span style={{ color: C.text, fontWeight: 700 }}>{f.v}</span></div></Row>)}
      <Row i={2 + fields.length}><div style={{ display: 'flex', gap: 12, marginTop: 8 }}>{tags.map((g) => <span key={g} style={{ fontSize: 24, fontWeight: 700, color: INK, background: accent, padding: '4px 16px', borderRadius: 30 }}>{g}</span>)}</div></Row>
    </div>
  </div>;
};

/** Z06 模糊甩入急停：一张卡带着很重的横向拖影甩进来，急停时过冲一下再回正。 */
export const BlurSlam: React.FC<{ children: React.ReactNode; at: number; from?: 'left' | 'right'; dist?: number }> = ({ children, at, from = 'right', dist = 1600 }) => {
  const t = useT(), p = clamp01((t - at) / 0.28), x = (1 - outCubic(p)) * dist * (from === 'right' ? 1 : -1), settle = t > at + 0.28 ? spring(t - at - 0.28, { from: 1, to: 0, stiffness: 300, damping: 10 }) : 1;
  const over = (from === 'right' ? -1 : 1) * 40 * settle * (t > at + 0.28 ? 1 : 0), blur = (1 - p) * 30;
  return <div style={{ position: 'relative', transform: `translateX(${x + over}px) skewX(${(from === 'right' ? 1 : -1) * (1 - p) * -14}deg)`, opacity: t < at ? 0 : 1 }}>
    {blur > 1 && [1, 2, 3].map((g) => <div key={g} style={{ position: 'absolute', inset: 0, transform: `translateX(${(from === 'right' ? 1 : -1) * g * blur * 3}px)`, opacity: 0.25, filter: `blur(${blur}px)` }}>{children}</div>)}
    <div style={{ filter: `blur(${blur * 0.3}px)` }}>{children}</div>
  </div>;
};

/** Z07 铅笔手绘揭示：一组 SVG 线条像铅笔一样一笔笔画出来，笔尖跟着走，画完后上色。 */
export const PencilDraw: React.FC<{ paths: { d: string; len?: number }[]; w: number; h: number; at: number; dur?: number; color?: string; fill?: string; labels?: { x: number; y: number; text: string }[] }> = ({ paths, w, h, at, dur = 2.4, color = '#E9E4D8', fill = 'rgba(198,244,50,.18)', labels = [] }) => {
  const t = useT(), per = dur / paths.length;
  return <div style={{ position: 'relative', width: w, height: h }}><svg width={w} height={h} style={{ overflow: 'visible' }}>
    <defs><filter id="pencil"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="3" /><feDisplacementMap in="SourceGraphic" scale="3" /></filter></defs>
    {paths.map((p, i) => { const L = p.len ?? 2400, q = inOut((t - at - i * per) / per); return <path key={i} d={p.d} fill={fill} fillOpacity={prog(t, at + dur, 0.5)} stroke={color} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - q)} filter="url(#pencil)" />; })}
  </svg>{labels.map((l, i) => <div key={i} style={{ position: 'absolute', left: l.x, top: l.y, fontFamily: FONT, fontWeight: 700, fontSize: 36, color, opacity: prog(t, at + dur + 0.2 + i * 0.2, 0.3), whiteSpace: 'nowrap' }}>{l.text}</div>)}</div>;
};

/** Z08 焦点接力：A、B 两件东西同框，焦点来回切：清楚的那个放大提亮，另一个虚掉变暗。 */
export const RackFocus: React.FC<{ a: React.ReactNode; b: React.ReactNode; la?: string; lb?: string; switches: number[]; w?: number; gap?: number }> = ({ a, b, la, lb, switches, w = 700, gap = 80 }) => {
  const t = useT(); let f = 0; switches.forEach((s, i) => { f = mix(f, i % 2 === 0 ? 1 : 0, inOut((t - s) / 0.45)); });
  const side = (node: React.ReactNode, label: string | undefined, focus: number) => <div style={{ width: w, transform: `scale(${mix(0.9, 1.04, focus)})`, filter: `blur(${(1 - focus) * 10}px) brightness(${mix(0.45, 1, focus)})`, textAlign: 'center' }}>{node}{label && <div style={{ marginTop: 22, fontFamily: FONT, fontWeight: 900, fontSize: 52, color: C.text }}>{label}</div>}</div>;
  return <div style={{ display: 'flex', gap, alignItems: 'center' }}>{side(a, la, 1 - f)}{side(b, lb, f)}</div>;
};

/** Z09 时间线照片带：一条横轴上 3 到 5 站，每站一张照片挂在年份上，镜头沿时间线往右推。 */
export const TimelineStrip: React.FC<{ stops: { year: string; label: string; img: React.ReactNode }[]; at: number; per?: number; w?: number; accent?: string }> = ({ stops, at, per = 0.9, w = 1920, accent = LIME }) => {
  const t = useT(), step = 520, cam = stops.reduce((x, _, i) => mix(x, i, inOut((t - at - i * per) / 0.6)), 0), x0 = w / 2 - 230 - cam * step * 0.6;
  return <div style={{ position: 'relative', width: w, height: 760, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 560, height: 4, background: 'rgba(255,255,255,.2)' }} />
    <div style={{ position: 'absolute', left: 0, top: 560, height: 4, width: x0 + cam * step + 230, background: accent }} />
    {stops.map((s, i) => { const k = sp(t, at + i * per, 200, 14), x = x0 + i * step; return <div key={i} style={{ position: 'absolute', left: x, top: 0, width: 460 }}>
      <div style={{ height: 300, borderRadius: 14, overflow: 'hidden', transform: `translateY(${(1 - k) * -60}px) rotate(${(i % 2 ? 2 : -2) * k}deg)`, opacity: clamp01(k * 2), boxShadow: '0 20px 50px rgba(0,0,0,.5)', border: '6px solid #F3F1EA' }}>{s.img}</div>
      <div style={{ position: 'absolute', left: 222, top: 300, width: 4, height: 260 * clamp01(k), background: accent }} />
      <div style={{ position: 'absolute', left: 206, top: 546, width: 36, height: 36, borderRadius: 18, background: k > 0.5 ? accent : '#333', border: '5px solid #0B0E14' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 610, textAlign: 'center', fontFamily: FONT, opacity: clamp01(k * 2) }}><div style={{ fontWeight: 900, fontSize: 56, color: accent }}>{s.year}</div><div style={{ fontSize: 32, color: C.text, marginTop: 4 }}>{s.label}</div></div>
    </div>; })}
  </div>;
};

/** Z10 动词接力胶片：主语钉在左边不动，右边的动词一个个滚过去，每换一个词，后面胶片换一张图。 */
export const VerbReel: React.FC<{ subject: string; items: { verb: string; img: React.ReactNode }[]; at: number; per?: number; size?: number; accent?: string }> = ({ subject, items, at, per = 0.9, size = 110, accent = LIME }) => {
  const t = useT(), pos = items.reduce((x, _, i) => (i === 0 ? 0 : mix(x, i, inOut((t - at - i * per) / 0.35))), 0);
  return <div style={{ display: 'flex', alignItems: 'center', gap: 50, fontFamily: FONT }}>
    <div style={{ fontSize: size, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{subject}</div>
    <div style={{ height: size * 1.3, overflow: 'hidden', width: size * 2.4 }}><div style={{ transform: `translateY(${-pos * size * 1.3}px)` }}>{items.map((it, i) => <div key={i} style={{ height: size * 1.3, display: 'flex', alignItems: 'center', fontSize: size, fontWeight: 900, color: accent }}>{it.verb}</div>)}</div></div>
    <div style={{ width: 760, height: 430, overflow: 'hidden', borderRadius: 10, border: '10px solid #111', borderLeft: '28px dashed #222', borderRight: '28px dashed #222', boxSizing: 'content-box' }}><div style={{ display: 'flex', transform: `translateX(${-pos * 760}px)` }}>{items.map((it, i) => <div key={i} style={{ width: 760, height: 430, flex: 'none' }}>{it.img}</div>)}</div></div>
  </div>;
};

// ---------- 数据信息图 ----------
/** Z11 多选一反黑：一排选项，高亮框跳着扫过，最后停在选中的那个上，它反成黑底亮字，下方说结果。 */
export const PickOne: React.FC<{ options: string[]; pick: number; at: number; result?: string; accent?: string }> = ({ options, pick, at, result, accent = LIME }) => {
  const t = useT(), hops = options.length + pick, hopT = 0.16, i = Math.min(hops, Math.floor(Math.max(0, t - at) / hopT)), cur = i % options.length, done = i >= hops, k = done ? sp(t, at + hops * hopT, 300, 12) : 0;
  return <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 50, fontFamily: FONT }}>
    <div style={{ display: 'flex', gap: 22 }}>{options.map((o, j) => { const on = t >= at && j === cur, sel = done && j === pick; return <div key={j} style={{ padding: '26px 38px', borderRadius: 18, fontSize: 44, fontWeight: 900, whiteSpace: 'nowrap', background: sel ? INK : on ? accent : '#1A202B', color: sel ? accent : on ? INK : C.muted, border: sel ? `4px solid ${accent}` : '4px solid transparent', transform: `scale(${sel ? 1 + 0.12 * k : 1})`, opacity: done && !sel ? 0.35 : 1 }}>{o}</div>; })}</div>
    {result && <div style={{ fontSize: 48, fontWeight: 700, color: C.text, opacity: prog(t, at + hops * hopT + 0.4, 0.4) }}>→ {result}</div>}
  </div>;
};

/** Z12 地图路线图钉：抽象地图上几枚图钉依次落下，虚线沿弧线从一站连到下一站，小点沿线跑。 */
export const MapRoute: React.FC<{ pins: { x: number; y: number; name: string }[]; at: number; per?: number; w?: number; h?: number; accent?: string }> = ({ pins, at, per = 0.9, w = 1500, h = 840, accent = CORAL }) => {
  const t = useT();
  return <div style={{ position: 'relative', width: w, height: h, borderRadius: 20, overflow: 'hidden', background: '#101722', backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 2px, transparent 2px), linear-gradient(90deg, rgba(255,255,255,.04) 2px, transparent 2px)', backgroundSize: '60px 60px' }}>
    <svg width={w} height={h} style={{ position: 'absolute' }}>{pins.slice(1).map((p, i) => { const a = pins[i], mx = (a.x + p.x) / 2, my = Math.min(a.y, p.y) - 120, q = inOut((t - at - (i + 1) * per + 0.55) / 0.55), L = 1600; const d = `M${a.x} ${a.y} Q${mx} ${my} ${p.x} ${p.y}`; return <g key={i}><path d={d} fill="none" stroke={accent} strokeWidth={5} strokeDasharray="14 12" opacity={0.85} style={{ clipPath: 'none' }} strokeDashoffset={0} mask={undefined} /><path d={d} fill="none" stroke="#101722" strokeWidth={9} strokeDasharray={L} strokeDashoffset={-L * q} /></g>; })}</svg>
    {pins.map((p, i) => { const k = sp(t, at + i * per, 300, 12); return <div key={i} style={{ position: 'absolute', left: p.x - 24, top: p.y - 64, transform: `translateY(${(1 - k) * -80}px)`, opacity: clamp01(k * 3) }}>
      <svg width={48} height={64}><path d="M24 62 C24 62 4 36 4 22 A20 20 0 1 1 44 22 C44 36 24 62 24 62Z" fill={accent} /><circle cx={24} cy={22} r={8} fill="#fff" /></svg>
      <div style={{ position: 'absolute', left: 56, top: 6, fontFamily: FONT, fontWeight: 900, fontSize: 38, color: C.text, whiteSpace: 'nowrap', textShadow: '0 2px 10px #000' }}>{p.name}</div></div>; })}
  </div>;
};

/** Z13 界面道具剧场：用三种界面小道具讲流程——进度条在跑、清单逐项打勾、参数滑块拖动后结果跟着变。 */
export const UiProps: React.FC<{ at: number; progress?: { label: string; dur: number }; checks?: { t: string; at: number }[]; slider?: { label: string; from: number; to: number; unit?: string; at: number; out: (v: number) => string } ; accent?: string }> = ({ at, progress, checks = [], slider, accent = LIME }) => {
  const t = useT(), card: React.CSSProperties = { background: '#141922', borderRadius: 20, padding: '28px 34px', border: '1px solid rgba(255,255,255,.1)', fontFamily: FONT, color: C.text };
  return <div style={{ display: 'flex', gap: 34, alignItems: 'flex-start' }}>
    {progress && (() => { const p = clamp01((t - at) / progress.dur); return <div style={{ ...card, width: 520 }}><div style={{ fontSize: 30, fontWeight: 700 }}>{progress.label}</div><div style={{ height: 22, borderRadius: 11, background: '#232B38', margin: '22px 0 12px', overflow: 'hidden' }}><div style={{ height: '100%', width: `${p * 100}%`, background: `repeating-linear-gradient(45deg, ${accent}, ${accent} 16px, #A6D61E 16px, #A6D61E 32px)`, backgroundPosition: `${t * 60}px 0` }} /></div><div style={{ fontFamily: MONO, fontSize: 28, color: p >= 1 ? accent : C.muted }}>{p >= 1 ? '完成 ✓' : `${Math.round(p * 100)}%`}</div></div>; })()}
    {checks.length > 0 && <div style={{ ...card, width: 460 }}>{checks.map((c, i) => { const on = t >= c.at, k = sp(t, c.at, 400, 14); return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '10px 0', fontSize: 32 }}><span style={{ width: 40, height: 40, borderRadius: 10, border: `3px solid ${on ? accent : '#475066'}`, background: on ? accent : 'transparent', color: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, transform: `scale(${on ? 0.8 + 0.2 * k : 1})` }}>{on ? '✓' : ''}</span><span style={{ color: on ? C.text : C.muted, textDecoration: 'none' }}>{c.t}</span></div>; })}</div>}
    {slider && (() => { const p = inOut((t - slider.at) / 1.2), v = mix(slider.from, slider.to, p); return <div style={{ ...card, width: 520 }}><div style={{ fontSize: 30, fontWeight: 700 }}>{slider.label}<span style={{ float: 'right', fontFamily: MONO, color: accent }}>{v.toFixed(0)}{slider.unit}</span></div><div style={{ position: 'relative', height: 10, background: '#232B38', borderRadius: 5, margin: '34px 0' }}><div style={{ height: '100%', width: `${p * 100}%`, background: accent, borderRadius: 5 }} /><div style={{ position: 'absolute', left: `calc(${p * 100}% - 20px)`, top: -15, width: 40, height: 40, borderRadius: 20, background: '#fff', boxShadow: `0 0 0 ${t > slider.at && p < 1 ? 10 : 0}px ${accent}44` }} /></div><div style={{ fontSize: 34, fontWeight: 900, color: accent }}>{slider.out(v)}</div></div>; })()}
  </div>;
};

// ---------- 运镜 ----------
/** Z14 光标锁定跟拍：一条很长的命令一个字一个字打出，镜头放大并始终跟着光标往右走，打完拉回全貌。 */
export const CursorFollow: React.FC<{ text: string; at: number; cps?: number; w?: number; zoom?: number; prompt?: string; accent?: string }> = ({ text, at, cps = 22, w = 1600, zoom = 2.2, prompt = '$', accent = LIME }) => {
  const t = useT(), dur = text.length / cps, n = Math.floor(clamp01((t - at) / dur) * text.length), ch = 26, cx = (prompt.length + 1 + n) * ch, back = inOut((t - at - dur - 0.4) / 0.7), z = mix(mix(1, zoom, prog(t, at - 0.2, 0.5)), 1, back);
  const fullW = (prompt.length + 1 + text.length) * ch + 80, fit = Math.min(1, (w - 80) / fullW), s = mix(z, fit, back), tx = mix(-cx * s + w * 0.6, (w - fullW * s) / 2, back);
  return <div style={{ width: w, height: 260, overflow: 'hidden', background: '#05080B', borderRadius: 18, border: '1px solid rgba(255,255,255,.1)', position: 'relative' }}>
    <div style={{ position: 'absolute', left: 0, top: 130 - 22 * s, transform: `translateX(${Math.min(40, tx)}px) scale(${s})`, transformOrigin: 'left center', fontFamily: MONO, fontSize: 43, whiteSpace: 'pre', color: '#D8F5C0' }}><span style={{ color: accent }}>{prompt} </span>{text.slice(0, n)}<span style={{ background: accent, color: INK, opacity: Math.floor(t * 3) % 2 && n >= text.length ? 0 : 1 }}> </span></div>
  </div>;
};

/** Z15 画中画放大：全景保持不动，选中的一块加框，旁边弹出一个放大的小窗，两条连线把框和小窗连起来。 */
export const PipZoom: React.FC<{ src: string; w: number; h: number; box: { x: number; y: number; w: number; h: number }; at: number; pip?: { x: number; y: number; w: number }; color?: string }> = ({ src, w, h, box, at, pip = { x: 0.58, y: 0.06, w: 0.38 }, color = LIME }) => {
  const t = useT(), b = inOut((t - at) / 0.4), k = sp(t, at + 0.35, 200, 16), pw = w * pip.w, ph = pw * box.h / box.w, px = w * pip.x, py = h * pip.y, sc = pw / box.w;
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', borderRadius: 14 }}>
    <Fill src={src} style={{ filter: `brightness(${mix(1, 0.6, b)})` }} />
    <div style={{ position: 'absolute', left: box.x, top: box.y, width: box.w, height: box.h, border: `4px solid ${color}`, opacity: b, boxShadow: `0 0 20px ${color}` }} />
    <svg width={w} height={h} style={{ position: 'absolute', inset: 0, opacity: k }}><line x1={box.x + box.w} y1={box.y} x2={px} y2={py} stroke={color} strokeWidth={3} /><line x1={box.x + box.w} y1={box.y + box.h} x2={px} y2={py + ph} stroke={color} strokeWidth={3} /></svg>
    <div style={{ position: 'absolute', left: px, top: py, width: pw, height: ph, overflow: 'hidden', border: `5px solid ${color}`, borderRadius: 10, transform: `scale(${k})`, transformOrigin: 'left top', boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}><Img src={src} style={{ position: 'absolute', width: w * sc, height: h * sc, left: -box.x * sc, top: -box.y * sc, maxWidth: 'none' }} /></div>
  </div>;
};

/** Z16 左右摇移：比画面宽很多的长图，镜头从左慢慢摇到右（可以来回），两边压暗做纵深。 */
export const SwayPan: React.FC<{ children: React.ReactNode; contentW: number; w?: number; h?: number; at: number; dur?: number; back?: boolean }> = ({ children, contentW, w = 1920, h = 1080, at, dur = 4, back }) => {
  const t = useT(), p = clamp01((t - at) / dur), q = back ? (p < 0.5 ? inOut(p * 2) : 1 - inOut((p - 0.5) * 2)) : inOut(p), x = -q * (contentW - w);
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: x, top: 0, width: contentW, height: h, transform: `rotateY(${(0.5 - q) * 2}deg)` }}>{children}</div>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(11,14,20,.85), transparent 14%, transparent 86%, rgba(11,14,20,.85))' }} />
  </div>;
};

// ---------- 转场 ----------
type TR = { a: React.ReactNode; b: React.ReactNode; at: number; w?: number; h?: number };
const Layer: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', ...style }}>{children}</div>;

/** Z17 光标擦除转场：一根粗光标竖线从右往左扫，扫过的地方 A 被删掉，然后反向扫回来把 B「打」出来。 */
export const CaretWipe: React.FC<TR & { color?: string }> = ({ a, b, at, w = 1920, h = 1080, color = LIME }) => {
  const t = useT(), del = inOut((t - at) / 0.45), typ = inOut((t - at - 0.55) / 0.5), x = t < at + 0.5 ? w * (1 - del) : w * typ, showB = t >= at + 0.5;
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: INK }}>
    {!showB && <Layer style={{ clipPath: `inset(0 ${(del) * 100}% 0 0)` }}>{a}</Layer>}
    {showB && <Layer style={{ clipPath: `inset(0 ${(1 - typ) * 100}% 0 0)` }}>{b}</Layer>}
    {t >= at && t < at + 1.2 && <div style={{ position: 'absolute', left: x - 8, top: 0, width: 16, height: h, background: color, boxShadow: `0 0 40px ${color}`, opacity: Math.floor(t * 8) % 2 && typ >= 1 ? 0 : 1 }} />}
  </div>;
};

/** Z18 纯色硬切节拍卡：每个重音一张满屏纯色卡、一个词，硬切，没有过渡。短口播的观点节拍。 */
export const ColorBeats: React.FC<{ beats: { at: number; text: string; bg: string; color?: string }[]; w?: number; h?: number; size?: number }> = ({ beats, w = 1920, h = 1080, size = 260 }) => {
  const t = useT(), cur = beats.filter((b) => t >= b.at).pop();
  if (!cur) return null;
  const k = sp(t, cur.at, 500, 20);
  return <div style={{ width: w, height: h, background: cur.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color: cur.color ?? INK, letterSpacing: '-.04em', transform: `scale(${mix(1.12, 1, k)})`, whiteSpace: 'nowrap' }}>{cur.text}</div></div>;
};

/** Z19 线条接力转场：A 标题下的那根线向两边伸长，绕成一个大框，B 的画面在框里出现。 */
export const LineCarry: React.FC<TR & { title: string; color?: string }> = ({ title, b, at, w = 1920, h = 1080, color = LIME }) => {
  const t = useT(), ext = inOut((t - at) / 0.5), wrap = inOut((t - at - 0.45) / 0.6), fade = prog(t, at + 0.9, 0.4);
  const bx = 160, by = 140, bw = w - 320, bh = h - 280, per = 2 * (bw + bh), lw = mix(500, bw, ext), lx = (w - lw) / 2;
  return <div style={{ position: 'relative', width: w, height: h, background: INK, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: h / 2 - 130, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: 130, color: C.text, opacity: 1 - prog(t, at, 0.3), transform: `translateY(${-prog(t, at, 0.4) * 40}px)` }}>{title}</div>
    <Layer style={{ left: bx, top: by, width: bw, height: bh, right: 'auto', bottom: 'auto', opacity: fade }}>{b}</Layer>
    {wrap <= 0 ? <div style={{ position: 'absolute', left: lx, top: h / 2 + 40 + (by + bh - h / 2 - 40) * ext, width: lw, height: 8, background: color }} />
      : <svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}><rect x={bx} y={by} width={bw} height={bh} fill="none" stroke={color} strokeWidth={8} strokeDasharray={`${bw + wrap * (per - bw)} ${per}`} strokeDashoffset={-(bw + bh) + 0} transform={`rotate(180 ${w / 2} ${h / 2})`} /></svg>}
  </div>;
};

/** Z20 长镜头世界画布：所有内容摆在一张很大的画布上，镜头一站站平移缩放过去，整段不切镜。 */
export const WorldCanvas: React.FC<{ stations: { x: number; y: number; z?: number; at: number; node: React.ReactNode }[]; w?: number; h?: number; links?: boolean; accent?: string }> = ({ stations, w = 1920, h = 1080, links = true, accent = LIME }) => {
  const t = useT(); let cx = stations[0].x, cy = stations[0].y, cz = stations[0].z ?? 1;
  stations.forEach((s, i) => { if (i === 0) return; const p = inOut((t - s.at + 0.7) / 0.9); cx = mix(cx, s.x, p); cy = mix(cy, s.y, p); cz = mix(cz, s.z ?? 1, p) * (1 - 0.25 * Math.sin(p * Math.PI)); });
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: '#0B0E14', backgroundImage: 'radial-gradient(rgba(255,255,255,.08) 2px, transparent 2px)', backgroundSize: `${40 * cz}px ${40 * cz}px`, backgroundPosition: `${-cx * cz}px ${-cy * cz}px` }}>
    <div style={{ position: 'absolute', left: w / 2, top: h / 2, transform: `scale(${cz}) translate(${-cx}px, ${-cy}px)`, transformOrigin: '0 0' }}>
      {links && <svg style={{ position: 'absolute', overflow: 'visible', left: 0, top: 0 }}>{stations.slice(1).map((s, i) => <line key={i} x1={stations[i].x} y1={stations[i].y} x2={s.x} y2={s.y} stroke={accent} strokeWidth={4} strokeDasharray="12 12" opacity={0.6} />)}</svg>}
      {stations.map((s, i) => <div key={i} style={{ position: 'absolute', left: s.x, top: s.y, transform: 'translate(-50%, -50%)' }}>{s.node}</div>)}
    </div>
  </div>;
};

/** Z21 过曝翻页转场：A 迅速过曝发白，白场里像翻页一样翻过去，B 从过曝中降下来恢复正常曝光。 */
export const OverexposeFlip: React.FC<TR> = ({ a, b, at, w = 1920, h = 1080 }) => {
  const t = useT(), up = clamp01((t - at) / 0.3), down = clamp01((t - at - 0.35) / 0.45), flip = inOut((t - at - 0.15) / 0.4);
  const showB = t >= at + 0.35, ex = showB ? 1 - outCubic(down) : outCubic(up);
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: '#fff', perspective: 2000 }}>
    <Layer style={{ filter: `brightness(${1 + ex * 3}) contrast(${1 - ex * 0.5})`, transform: showB ? `rotateY(${(1 - flip) * -60}deg)` : `rotateY(${flip * 60}deg)`, transformOrigin: showB ? 'right center' : 'left center' }}>{showB ? b : a}</Layer>
    <Layer style={{ background: '#fff', opacity: ex * 0.85 }}><span /></Layer>
  </div>;
};

/** Z22 粒子溶接转场：A 碎成一片小方块飘散，方块在半空重新聚拢，落成 B。「同一件东西换了形态」。 */
export const ParticleWeld: React.FC<TR & { cols?: number; rows?: number }> = ({ a, b, at, w = 1920, h = 1080, cols = 24, rows = 14 }) => {
  const t = useT(), cw = w / cols, ch = h / rows, p = clamp01((t - at) / 1.3);
  if (t < at) return <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden' }}><Layer>{a}</Layer></div>;
  if (p >= 1) return <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden' }}><Layer>{b}</Layer></div>;
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const i = r * cols + c, d = hash(i) * 0.35, q = clamp01((p - d) / 0.65), out = q < 0.5, s = out ? inOut(q * 2) : 1 - inOut((q - 0.5) * 2);
    const dx = (hash(i + 7) - 0.5) * 500 * s + (w / 2 - c * cw) * 0.25 * s, dy = (hash(i + 13) - 0.5) * 400 * s - 120 * s, sc = 1 - 0.65 * s;
    cells.push(<div key={i} style={{ position: 'absolute', left: c * cw, top: r * ch, width: cw + 0.5, height: ch + 0.5, overflow: 'hidden', transform: `translate(${dx}px, ${dy}px) scale(${sc}) rotate(${s * (hash(i + 3) - 0.5) * 180}deg)`, borderRadius: s * cw / 2 }}><div style={{ position: 'absolute', left: -c * cw, top: -r * ch, width: w, height: h }}>{out ? a : b}</div></div>);
  }
  return <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', background: INK }}>{cells}</div>;
};

/** Z23 后拉冷却转场：A 往后退、变小、褪色变冷，像镜头后撤喘口气，B 从更远处安静地浮现。 */
export const PullbackCool: React.FC<TR> = ({ a, b, at, w = 1920, h = 1080 }) => {
  const t = useT(), p = inOut((t - at) / 1.1), q = inOut((t - at - 0.6) / 0.9);
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: '#0A0F16' }}>
    {q < 1 && <Layer style={{ transform: `scale(${mix(1, 0.55, p)})`, filter: `saturate(${mix(1, 0, p)}) brightness(${mix(1, 0.5, p)}) hue-rotate(${p * 30}deg)`, borderRadius: p * 30, opacity: 1 - q, boxShadow: '0 40px 100px rgba(0,0,0,.6)' }}>{a}</Layer>}
    {t >= at + 0.6 && <Layer style={{ opacity: q, transform: `scale(${mix(0.92, 1, q)})`, filter: `blur(${(1 - q) * 10}px)` }}>{b}</Layer>}
  </div>;
};

/** Z24 推穿转场：镜头猛推进 A 的中心，穿过去时 B 已经在后面，从模糊放大落回正常。 */
export const PushThrough: React.FC<TR & { cx?: number; cy?: number }> = ({ a, b, at, w = 1920, h = 1080, cx = 0.5, cy = 0.5 }) => {
  const t = useT(), p = clamp01((t - at) / 0.4), q = clamp01((t - at - 0.3) / 0.5), sA = 1 + Math.pow(p, 2.2) * 7, sB = mix(1.6, 1, outCubic(q));
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: INK }}>
    {t >= at + 0.3 && <Layer style={{ transform: `scale(${sB})`, filter: `blur(${(1 - outCubic(q)) * 16}px)` }}>{b}</Layer>}
    {p < 1 && <Layer style={{ transform: `scale(${sA})`, transformOrigin: `${cx * 100}% ${cy * 100}%`, filter: `blur(${p * 12}px)`, opacity: 1 - clamp01((p - 0.7) / 0.3) }}>{a}</Layer>}
  </div>;
};

/** Z25 横甩转场：A 带着横向拖影甩出画面，B 从另一侧带拖影甩进来，中间一帧几乎全糊。平级并列的切换。 */
export const WhipPan: React.FC<TR & { dir?: 1 | -1 }> = ({ a, b, at, w = 1920, h = 1080, dir = 1 }) => {
  const t = useT(), p = clamp01((t - at) / 0.36), e = inOut(p), blur = Math.sin(p * Math.PI) * 40;
  const strip = (node: React.ReactNode, x: number) => <Layer style={{ transform: `translateX(${x}px)` }}>{[0, 1, 2].map((g) => <Layer key={g} style={{ transform: `translateX(${g * blur * 2 * -dir}px)`, opacity: g ? 0.3 : 1, filter: `blur(${blur * (g ? 1.4 : 0.6)}px)` }}>{node}</Layer>)}</Layer>;
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: INK }}>{strip(a, -dir * e * w)}{strip(b, dir * (1 - e) * w)}</div>;
};

/** 演示用：一张占满的图。 */
export const ImgFill = Fill;
