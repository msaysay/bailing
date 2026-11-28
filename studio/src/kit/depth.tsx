// 人物层次：把字、图、光放到人的「身后」。原理：同一条口播放两层，下面一层是原画面，上面一层是只有人、背景透明的那条
// （用 python3 scripts/matte.py make 抠出来的 -fg.webm），夹在中间的东西就被人挡住了。
// 用法：
//   <Depth base="ep08/person.mp4" fg="ep08/person-fg.webm" head={{ x: 0.5, y: 0.3, r: 0.09 }}
//          behind={<BehindWord text="复利" at={3.2} until={6} />}  front={<…人前面的东西…>} />
// head 是脸在画面里的位置（x、y 是脸中心占宽高的比例，r 是脸的半高占画面高的比例），matte.py 和 talk_prep.py 的「自动裁切.json」里有。
// 时间都传秒。颜色默认金色，改成这一期骨架的强调色。
import React, { createContext, useContext } from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { inOut, mix, prog } from './clock';
import { FONT, useT } from './kit';

export type Head = { x: number; y: number; r: number };
/** 透明人像那一层。fg 写文件夹（里面是 00001.webp 起的一串帧，matte.py 默认出这个，渲染快）或 .webm（一个文件，渲染慢好几倍）。 */
const FgLayer: React.FC<{ fg: string; off: number; frames?: number; style?: React.CSSProperties }> = ({ fg, off, frames, style }) => {
  const f = useCurrentFrame(), fit: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style };
  if (/\.webm$/i.test(fg)) return <Sequence from={Math.max(0, off)} durationInFrames={frames} layout="none"><OffthreadVideo src={src(fg)} startFrom={Math.max(0, -off)} transparent muted style={fit} /></Sequence>;
  const k = f - off; if (k < 0 || (frames !== undefined && k >= frames)) return null;
  return <Img src={src(`${fg.replace(/\/$/, '')}/${String(k + 1).padStart(5, '0')}.webp`)} style={fit} />;
};
type Ctx = { head: Head; w: number; h: number; fg?: string; fgFrom: number; startFrom: number; fgFrames?: number };
const DepthCtx = createContext<Ctx>({ head: { x: 0.5, y: 0.3, r: 0.09 }, w: 1080, h: 1920, fgFrom: 0, startFrom: 0 });
export const useDepth = () => useContext(DepthCtx);
const cl = (v: number) => Math.max(0, Math.min(1, v));
const out3 = (p: number) => 1 - Math.pow(1 - cl(p), 3);
const back = (p: number) => { const c = 1.9, q = cl(p) - 1; return 1 + (c + 1) * q * q * q + c * q * q; };
const src = (s: string) => (/^(https?:|data:|\/)/.test(s) ? s : staticFile(s));
/** 出现到消失的可见度：at 进（0.3 秒），until 出（0.25 秒）。 */
const vis = (t: number, at: number, until?: number, i = 0.3, o = 0.25) => cl((t - at) / i) * (until === undefined ? 1 : 1 - cl((t - until) / o));

/** 两层人像的容器。base 原画面；fg 抠好的透明人像（没有 fg 时 behind 的东西会直接盖在人上，只适合预览）。
 *  startFrom：base 从原片第几秒开始放；fgFrom：fg 这条是从原片第几秒开始抠的（matte.py 的 --from）；fgFor：fg 有多长（秒）；fg 只抠了一段时一定要写，不然抠像放完后会找不到帧。
 *  outline：给人描一圈边（贴纸感）；dim：把背景压暗多少（0 到 1），人不受影响。 */
export const Depth: React.FC<{ base: string; fg?: string; head?: Head; w?: number; h?: number; startFrom?: number; fgFrom?: number; fgFor?: number; behind?: React.ReactNode; front?: React.ReactNode; outline?: { color?: string; width?: number }; glow?: string; dim?: number; muted?: boolean; style?: React.CSSProperties }> = ({ base, fg, head = { x: 0.5, y: 0.3, r: 0.09 }, w, h, startFrom = 0, fgFrom, fgFor, behind, front, outline, glow, dim = 0, muted, style }) => {
  const { width, height, fps } = useVideoConfig(), W = w ?? width, H = h ?? height, f0 = fgFrom ?? startFrom, off = Math.round((f0 - startFrom) * fps);
  const ow = outline?.width ?? 0, oc = outline?.color ?? '#fff', sh = ow ? Array.from({ length: 8 }, (_, i) => `drop-shadow(${(Math.cos((i * Math.PI) / 4) * ow).toFixed(1)}px ${(Math.sin((i * Math.PI) / 4) * ow).toFixed(1)}px 0 ${oc})`).join(' ') : '';
  const fit: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
  return <DepthCtx.Provider value={{ head, w: W, h: H, fg, fgFrom: f0, startFrom, fgFrames: fgFor ? Math.round(fgFor * fps) : undefined }}>
    <div style={{ position: 'relative', width: W, height: H, overflow: 'hidden', background: '#000', ...style }}>
      <OffthreadVideo src={src(base)} startFrom={Math.round(startFrom * fps)} muted={muted} style={fit} />
      {dim ? <AbsoluteFill style={{ background: `rgba(0,0,0,${dim})` }} /> : null}
      <AbsoluteFill>{behind}</AbsoluteFill>
      {fg ? <FgLayer fg={fg} off={off} frames={fgFor ? Math.round(fgFor * fps) : undefined} style={{ filter: [sh, glow ? `drop-shadow(0 0 28px ${glow})` : ''].join(' ').trim() || undefined }} /> : null}
      <AbsoluteFill>{front}</AbsoluteFill>
    </div></DepthCtx.Provider>;
};

/** 身后大字：一两个字的关键词，从人身后升起来（rise）、砸下来（slam）或从一侧滑进来（slide），头把字挡住一部分。最多 4 个字。 */
export const BehindWord: React.FC<{ text: string; at: number; until?: number; color?: string; mode?: 'rise' | 'slam' | 'slide'; size?: number; dy?: number; stroke?: boolean }> = ({ text, at, until, color = '#F2E26B', mode = 'rise', size, dy = 0, stroke }) => {
  const t = useT(), { head, w, h } = useDepth(), n = Math.max(1, text.length), fs = size ?? Math.min((w * 0.94) / n, h * 0.3), p = mode === 'slam' ? back((t - at) / 0.32) : out3((t - at) / 0.45), v = vis(t, at, until, 0.12);
  const tf = mode === 'rise' ? `translateY(${mix(fs * 0.7, 0, p)}px)` : mode === 'slam' ? `scale(${mix(1.9, 1, p)})` : `translateX(${mix(-w * 0.6, 0, p)}px)`;
  return <div style={{ position: 'absolute', left: 0, right: 0, top: head.y * h - fs * 0.98 + dy * h, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: fs, lineHeight: 1, letterSpacing: fs * 0.02, color: stroke ? 'transparent' : color, WebkitTextStroke: stroke ? `${Math.max(4, fs * 0.02)}px ${color}` : undefined, opacity: v, transform: tf, textShadow: stroke ? undefined : '0 10px 40px rgba(0,0,0,.45)', whiteSpace: 'nowrap' }}>{text}</div>;
};

/** 身后大数字：数字在人身后一路数上去，单位小一号跟在后面。适合「三千亿」「涨了 47%」这类一句话里最重的那个数。 */
export const BehindNumber: React.FC<{ to: number; at: number; until?: number; unit?: string; prefix?: string; decimals?: number; color?: string; dur?: number; label?: string }> = ({ to, at, until, unit = '', prefix = '', decimals = 0, color = '#F2E26B', dur = 1.1, label }) => {
  const t = useT(), { head, w, h } = useDepth(), p = out3((t - at) / dur), s = (to * p).toFixed(decimals), fs = Math.min((w * 0.86) / Math.max(2, (prefix + s).length * 0.62 + unit.length * 0.5), h * 0.26), v = vis(t, at, until, 0.15);
  return <div style={{ position: 'absolute', left: 0, right: 0, top: head.y * h - fs * 1.08, textAlign: 'center', fontFamily: FONT, color, opacity: v, transform: `translateY(${mix(fs * 0.4, 0, out3((t - at) / 0.4))}px)`, textShadow: '0 10px 40px rgba(0,0,0,.45)', whiteSpace: 'nowrap' }}>
    {label ? <div style={{ fontSize: fs * 0.2, fontWeight: 700, color: '#fff', marginBottom: fs * 0.04 }}>{label}</div> : null}
    <span style={{ fontSize: fs, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{prefix}{s}</span><span style={{ fontSize: fs * 0.42, fontWeight: 900, marginLeft: fs * 0.04 }}>{unit}</span></div>;
};

/** 身后滚字墙：几行字在人身后一左一右地横着滚，像新闻墙。当氛围用，字要淡。适合「铺天盖地都在说」「热搜刷屏」。 */
export const BehindMarquee: React.FC<{ lines: string[]; at: number; until?: number; color?: string; opacity?: number; speed?: number; top?: number; bottom?: number }> = ({ lines, at, until, color = '#fff', opacity = 0.34, speed = 90, top = 0.06, bottom = 0.62 }) => {
  const t = useT(), { w, h } = useDepth(), v = vis(t, at, until, 0.5, 0.4), rh = ((bottom - top) * h) / lines.length, fs = rh * 0.62;
  return <div style={{ position: 'absolute', left: 0, right: 0, top: top * h, height: (bottom - top) * h, opacity: v * opacity, overflow: 'hidden', fontFamily: FONT, fontWeight: 900, color }}>
    {lines.map((l, i) => { const dir = i % 2 ? 1 : -1, one = l + '　·　', rep = one.repeat(Math.ceil((w * 3) / Math.max(1, one.length * fs))), shift = ((t - at) * speed * (1 + (i % 3) * 0.25)) % (one.length * fs);
      return <div key={i} style={{ position: 'absolute', top: i * rh, left: dir < 0 ? -shift : undefined, right: dir > 0 ? -shift : undefined, fontSize: fs, lineHeight: `${rh}px`, whiteSpace: 'nowrap', WebkitTextStroke: i % 2 ? `2px ${color}` : undefined, color: i % 2 ? 'transparent' : color }}>{rep}</div>; })}</div>;
};

/** 头后光环：头后面一圈光加放射线，慢慢转。讲到「主角登场」「这个人很关键」「高光时刻」时用，一条片子一次。 */
export const Halo: React.FC<{ at: number; until?: number; color?: string; rays?: number; scale?: number }> = ({ at, until, color = '#F2E26B', rays = 18, scale = 1 }) => {
  const t = useT(), { head, w, h } = useDepth(), v = vis(t, at, until, 0.35), R = head.r * h * 2.3 * scale * back((t - at) / 0.5), cx = head.x * w, cy = head.y * h, rot = (t - at) * 14;
  return <svg width={w} height={h} style={{ position: 'absolute', inset: 0, opacity: v }}>
    <defs><radialGradient id="haloG"><stop offset="0" stopColor={color} stopOpacity="0.55" /><stop offset="1" stopColor={color} stopOpacity="0" /></radialGradient></defs>
    <circle cx={cx} cy={cy} r={R * 1.8} fill="url(#haloG)" />
    <g transform={`rotate(${rot} ${cx} ${cy})`}>{Array.from({ length: rays }, (_, i) => { const a = (i / rays) * Math.PI * 2, r0 = R * 1.12, r1 = R * (i % 2 ? 1.5 : 1.85); return <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={cx + Math.cos(a) * r1} y2={cy + Math.sin(a) * r1} stroke={color} strokeWidth={i % 2 ? 6 : 10} strokeLinecap="round" opacity={0.85} />; })}</g>
    <circle cx={cx} cy={cy} r={R} fill="none" stroke={color} strokeWidth={10} /></svg>;
};

/** 换背景：人不动，身后的背景换成纯色、渐变、一张图，或者只是压暗、变虚。从头的位置一圈扩开。讲到回忆、假设、「换个场景想」时用。
 *  kind：color 纯色或渐变（value 写 CSS 颜色）· image 一张图（value 写路径）· blur 原背景变虚 · dim 原背景压暗 */
export const BgSwap: React.FC<{ at: number; until?: number; kind?: 'color' | 'image' | 'blur' | 'dim'; value?: string; grid?: boolean }> = ({ at, until, kind = 'color', value = 'linear-gradient(160deg,#101B3A,#3A1650)', grid }) => {
  const t = useT(), { head, w, h } = useDepth(), p = inOut((t - at) / 0.5) * (until === undefined ? 1 : 1 - inOut((t - until) / 0.4)), R = p * Math.hypot(w, h) * 1.05;
  if (p <= 0) return null;
  const clip = `circle(${R}px at ${head.x * w}px ${head.y * h}px)`;
  return <AbsoluteFill style={{ clipPath: clip, background: kind === 'color' ? value : kind === 'dim' ? 'rgba(0,0,0,.62)' : undefined, backdropFilter: kind === 'blur' ? 'blur(22px) brightness(.8)' : undefined }}>
    {kind === 'image' ? <Img src={src(value)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
    {grid ? <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.07) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.07) 2px,transparent 2px)', backgroundSize: `${w / 12}px ${w / 12}px` }} /> : null}</AbsoluteFill>;
};

/** 环绕字：一圈字绕着头转，转到后面的那半圈被头挡住。要放两次：behind 里放一次 side="behind"，front 里放一次 side="front"，其余参数一样。
 *  省事的写法：const o = orbit({ text: '…', at: 2 })，然后 behind={o.behind} front={o.front}。 */
export const OrbitText: React.FC<{ text: string; at: number; until?: number; side: 'behind' | 'front'; color?: string; size?: number; speed?: number; tilt?: number; ry?: number }> = ({ text, at, until, side, color = '#fff', size, speed = 0.16, tilt = -10, ry = 0.3 }) => {
  const t = useT(), { head, w, h } = useDepth(), v = vis(t, at, until, 0.4), chars = (text + '　').split(''), n = chars.length, RX = Math.min(w * 0.42, head.r * h * 2.5), RY = RX * ry, fs = size ?? Math.min(RX * 0.3, ((2 * Math.PI * RX) / n) * 0.62), cy = head.y * h + head.r * h * 1.55, grow = out3((t - at) / 0.6);
  return <div style={{ position: 'absolute', left: head.x * w, top: cy, transform: `rotate(${tilt}deg)`, opacity: v }}>{chars.map((c, i) => { const a = (i / n - (t - at) * speed) * Math.PI * 2, z = Math.sin(a), isBack = z < 0;
    if ((side === 'behind') !== isBack) return null;
    return <span key={i} style={{ position: 'absolute', left: -Math.cos(a) * RX * grow - fs / 2, top: z * RY * grow - fs / 2, width: fs, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: fs, lineHeight: 1, color, transform: `scale(${0.78 + 0.34 * (z + 1) / 2})`, opacity: isBack ? 0.7 : 1, textShadow: '0 4px 14px rgba(0,0,0,.6)' }}>{c}</span>; })}</div>;
};
export const orbit = (p: Omit<React.ComponentProps<typeof OrbitText>, 'side'>) => ({ behind: <OrbitText {...p} side="behind" />, front: <OrbitText {...p} side="front" /> });

/** 肩后弹卡：几张图或几张字卡从肩膀后面弹出来，扇形排开，下半截被人挡住。说到「这几家公司」「这几样东西」时用，最多 4 张。 */
export const PopCards: React.FC<{ items: { img?: string; title?: string; sub?: string; color?: string }[]; at: number; until?: number; gap?: number; size?: number }> = ({ items, at, until, gap = 0.12, size = 0.3 }) => {
  const t = useT(), { head, w, h } = useDepth(), n = items.length, cw = w * size, ch = cw * 1.2, v = until === undefined ? 1 : 1 - cl((t - until) / 0.25);
  return <>{items.map((it, i) => { const k = n === 1 ? 0 : (i / (n - 1)) * 2 - 1, p = back((t - at - i * gap) / 0.42), sideX = k < 0 ? -1 : 1, x = head.x * w + k * w * 0.36 - cw / 2 + (Math.abs(k) < 0.34 && n > 2 ? sideX * 0 : 0), y0 = head.y * h + head.r * h * 2.2, y = mix(y0, head.y * h - ch * (1.2 - Math.abs(k) * 0.62), p);
    return <div key={i} style={{ position: 'absolute', left: x, top: y, width: cw, height: ch, borderRadius: 22, overflow: 'hidden', background: it.color ?? '#151A24', border: '5px solid #fff', boxShadow: '0 18px 44px rgba(0,0,0,.5)', transform: `rotate(${k * 9}deg) scale(${mix(0.5, 1, p)})`, opacity: cl((t - at - i * gap) / 0.1) * v, fontFamily: FONT, color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
      {it.img ? <Img src={src(it.img)} style={{ width: '100%', height: it.title ? '62%' : '100%', objectFit: 'cover' }} /> : null}
      {it.title ? <div style={{ padding: `${cw * 0.07}px ${cw * 0.08}px` }}><div style={{ fontSize: cw * 0.17, fontWeight: 900, lineHeight: 1.15 }}>{it.title}</div>{it.sub ? <div style={{ fontSize: cw * 0.09, opacity: 0.75, marginTop: 6 }}>{it.sub}</div> : null}</div> : null}</div>; })}</>;
};

/** 两侧词条：关键词一条条从人身后往两边伸出来，左一条右一条往下排，靠里的一头被肩膀挡住。适合「三个原因」「几个标签」。每条不超过 6 个字，最多 6 条。 */
export const SideTags: React.FC<{ items: string[]; at: number; until?: number; gap?: number; color?: string; ink?: string }> = ({ items, at, until, gap = 0.22, color = '#F2E26B', ink = '#111' }) => {
  const t = useT(), { head, w, h } = useDepth(), fs = w * 0.058, rowH = fs * 2.05, y0 = head.y * h - head.r * h * 0.6, v = until === undefined ? 1 : 1 - cl((t - until) / 0.25);
  return <>{items.map((s, i) => { const left = i % 2 === 0, row = Math.floor(i / 2), p = out3((t - at - i * gap) / 0.38), tw = (s.length + 1.6) * fs, cx = head.x * w, x = left ? mix(cx - tw * 0.5, Math.max(w * 0.02, cx - head.r * h * 1.0 - tw), p) : mix(cx - tw * 0.5, Math.min(w * 0.98 - tw, cx + head.r * h * 1.0), p);
    return <div key={i} style={{ position: 'absolute', left: x, top: y0 + row * rowH, width: tw, height: fs * 1.62, borderRadius: fs * 0.3, background: i === 0 ? color : 'rgba(255,255,255,.94)', color: ink, fontFamily: FONT, fontWeight: 900, fontSize: fs, lineHeight: `${fs * 1.62}px`, textAlign: 'center', opacity: cl((t - at - i * gap) / 0.12) * v, boxShadow: '0 10px 26px rgba(0,0,0,.4)', transform: `rotate(${left ? -3 : 3}deg)` }}>{s}</div>; })}</>;
};

/** 残影：人身后拖出几道带颜色的剪影，往两侧散开再收回来。讲到「速度」「变化太快」「分身乏术」时用。需要 Depth 上有 fg。hues 是每道影子的色相（度）。 */
export const Echo: React.FC<{ at: number; until?: number; hues?: number[]; spread?: number }> = ({ at, until, hues = [310, 180, 20], spread = 0.07 }) => {
  const t = useT(), { w, fg, fgFrom, startFrom, fgFrames } = useDepth(), { fps } = useVideoConfig(), end = until ?? at + 1.6, p = Math.sin(cl((t - at) / (end - at)) * Math.PI), off = Math.round((fgFrom - startFrom) * fps);
  if (!fg || p <= 0.01) return null;
  return <>{hues.map((hue, i) => { const k = (Math.floor(i / 2) + 1) * (i % 2 ? -1 : 1);
    return <AbsoluteFill key={i} style={{ transform: `translateX(${k * spread * w * p}px)`, opacity: 0.7 * p }}><FgLayer fg={fg} off={off} frames={fgFrames} style={{ filter: `brightness(0) invert(1) sepia(1) saturate(30) hue-rotate(${hue}deg)` }} /></AbsoluteFill>; })}</>;
};

/** 身后走势线：一条线在人身后从左画到右，线头带一个数。讲涨跌、趋势时用，比单独切一张图更连贯。pts 是 0 到 1 的高度，至少 4 个点。 */
export const BehindTrend: React.FC<{ pts: number[]; at: number; until?: number; color?: string; label?: string; dur?: number; top?: number; bottom?: number }> = ({ pts, at, until, color = '#FF5D5D', label, dur = 1.4, top = 0.08, bottom = 0.5 }) => {
  const t = useT(), { w, h } = useDepth(), p = inOut((t - at) / dur), v = vis(t, at, until, 0.2), X = (i: number) => w * (0.06 + (0.88 * i) / (pts.length - 1)), Y = (y: number) => h * (bottom - (bottom - top) * y), d = pts.map((y, i) => `${i ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(y).toFixed(1)}`).join(' '), f = p * (pts.length - 1), i0 = Math.min(pts.length - 2, Math.floor(f)), fr = f - i0, hx = mix(X(i0), X(i0 + 1), fr), hy = mix(Y(pts[i0]), Y(pts[i0 + 1]), fr);
  return <div style={{ position: 'absolute', inset: 0, opacity: v }}><svg width={w} height={h} style={{ position: 'absolute', inset: 0 }}>
    <path d={`${d} L${X(pts.length - 1)} ${h * bottom} L${X(0)} ${h * bottom} Z`} fill={color} opacity={0.16 * p} />
    <path d={d} fill="none" stroke={color} strokeWidth={w * 0.014} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={`${p} 1`} style={{ filter: `drop-shadow(0 0 14px ${color})` }} />
    <circle cx={hx} cy={hy} r={w * 0.02} fill="#fff" stroke={color} strokeWidth={w * 0.008} opacity={p > 0 ? 1 : 0} /></svg>
    {label ? <div style={{ position: 'absolute', left: Math.min(hx + w * 0.03, w * 0.7), top: hy - w * 0.1, fontFamily: FONT, fontWeight: 900, fontSize: w * 0.075, color, opacity: cl((p - 0.85) / 0.15), textShadow: '0 4px 18px rgba(0,0,0,.6)', whiteSpace: 'nowrap' }}>{label}</div> : null}</div>;
};

/** 聚光：背景暗下去，只在人身后留一团光。说最重要的那句话时用，配乐同时压低。 */
export const Spot: React.FC<{ at: number; until?: number; color?: string; dark?: number }> = ({ at, until, color = 'rgba(255,236,170,.5)', dark = 0.78 }) => {
  const t = useT(), { head, w, h } = useDepth(), v = vis(t, at, until, 0.45, 0.4);
  return <AbsoluteFill style={{ opacity: v, background: `radial-gradient(ellipse ${head.r * h * 5}px ${head.r * h * 7}px at ${head.x * w}px ${(head.y + head.r * 1.5) * h}px, ${color} 0%, rgba(0,0,0,${dark * 0.5}) 55%, rgba(0,0,0,${dark}) 100%)` }} />;
};

/** 身后问号 / 叹号 / 符号雨：一堆符号从人身后往上冒。设问句、「凭什么」「真的吗」时用。 */
export const SymbolBurst: React.FC<{ at: number; until?: number; symbol?: string; count?: number; color?: string }> = ({ at, until, symbol = '？', count = 13, color = '#fff' }) => {
  const t = useT(), { head, w, h } = useDepth(), end = until ?? at + 2.2;
  return <>{Array.from({ length: count }, (_, i) => { const r = (n: number) => { const x = Math.sin((i + 1) * 91.7 * n) * 43758.5453; return x - Math.floor(x); }, st = at + r(1) * 0.5, p = cl((t - st) / (end - st)), a = -Math.PI / 2 + (r(2) - 0.5) * 2.4, dist = head.r * h * (2.2 + r(3) * 2.6) * out3(p * 1.6), fs = w * (0.12 + r(4) * 0.15);
    return <div key={i} style={{ position: 'absolute', left: head.x * w + Math.cos(a) * dist - fs / 2, top: head.y * h + Math.sin(a) * dist - fs / 2, fontFamily: FONT, fontWeight: 900, fontSize: fs, lineHeight: 1, color: i % 3 === 0 ? '#F2E26B' : color, opacity: cl(p * 8) * (1 - cl((p - 0.7) / 0.3)), transform: `rotate(${(r(5) - 0.5) * 50}deg) scale(${back(p * 3)})`, textShadow: '0 6px 18px rgba(0,0,0,.5)' }}>{symbol}</div>; })}</>;
};

// —— 演示：把上面每个效果在同一段人像上各放 3.5 秒。python3 scripts/matte.py demo <人物视频> 会用你自己的片子渲出来。——
export type DepthDemoProps = { base: string; fg: string; w: number; h: number; head: Head; clip: number };
export const depthDemoDefault: DepthDemoProps = { base: 'depth-demo/person.mp4', fg: 'depth-demo/person-fg', w: 1080, h: 1920, head: { x: 0.5, y: 0.3, r: 0.09 }, clip: 3.5 };
const o1 = orbit({ text: '超级个体 · 一个人就是一支队伍 ·', at: 0.2 });
export const DEPTH_DEMOS: { name: string; behind?: React.ReactNode; front?: React.ReactNode; extra?: Partial<React.ComponentProps<typeof Depth>> }[] = [
  { name: '身后大字 · 升起', behind: <BehindWord text="复利" at={0.3} /> },
  { name: '身后大字 · 砸下 · 空心', behind: <BehindWord text="凭什么" at={0.3} mode="slam" stroke color="#fff" /> },
  { name: '身后大数字', behind: <BehindNumber to={3000} unit="亿" at={0.3} label="示例：全年投入" /> },
  { name: '身后滚字墙', behind: <BehindMarquee lines={['示例热搜一', '示例热搜二 上榜', '全网都在讨论', '示例话题 刷屏', '示例热搜五']} at={0.2} />, extra: { dim: 0.35 } },
  { name: '头后光环', behind: <Halo at={0.3} /> },
  { name: '换背景 · 渐变加网格', behind: <BgSwap at={0.4} grid /> },
  { name: '换背景 · 虚化 + 描边贴纸', behind: <BgSwap at={0.3} kind="blur" />, extra: { outline: { width: 7 } } },
  { name: '环绕字', behind: o1.behind, front: o1.front },
  { name: '肩后弹卡', behind: <PopCards at={0.3} items={[{ title: '示例甲', sub: '第一家', color: '#1F3A8A' }, { title: '示例乙', sub: '第二家', color: '#7A1F5C' }, { title: '示例丙', sub: '第三家', color: '#0F5E4A' }]} /> },
  { name: '两侧词条', behind: <SideTags at={0.3} items={['门槛低', '回本快', '能复制', '风险小']} /> },
  { name: '残影', behind: <Echo at={0.4} until={2.6} /> },
  { name: '身后走势线', behind: <BehindTrend at={0.3} pts={[0.2, 0.28, 0.22, 0.4, 0.36, 0.62, 0.55, 0.9]} label="+47%" /> },
  { name: '聚光', behind: <Spot at={0.3} /> },
  { name: '符号冒出', behind: <SymbolBurst at={0.3} /> },
];
export const DepthDemo: React.FC<DepthDemoProps> = ({ base, fg, w, h, head, clip }) => {
  const { fps } = useVideoConfig(), n = Math.round(clip * fps);
  return <AbsoluteFill style={{ background: '#000' }}>{DEPTH_DEMOS.map((d, i) => <Sequence key={i} from={i * n} durationInFrames={n}>
    <Depth base={base} fg={fg} w={w} h={h} head={head} muted behind={d.behind} front={d.front} {...d.extra} />
    <div style={{ position: 'absolute', left: 30, bottom: 30, padding: '10px 22px', borderRadius: 12, background: 'rgba(0,0,0,.7)', color: '#fff', fontFamily: FONT, fontSize: Math.round(w * 0.034), fontWeight: 700 }}>{String(i + 1).padStart(2, '0')} · {d.name}</div></Sequence>)}</AbsoluteFill>;
};
