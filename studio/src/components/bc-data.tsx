// 广播风（中）：粒子质感的数据件和磷光终端。柱子、环、容器都由发光颗粒堆成；颗粒位置用固定种子，每帧画在 canvas 上。
import React from 'react';
import { prog, mix, inOut } from '../kit/clock';
import { FONT, useT } from '../kit/kit';
import { BC, MONO, Thin } from './bc';

const cl = (v: number) => Math.max(0, Math.min(1, v));
const rnd = (i: number) => { const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
const H: React.CSSProperties = { fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 };
const PAL = { lime: [[214, 255, 90], [70, 190, 20]], red: [[255, 120, 90], [200, 30, 20]], white: [[255, 255, 255], [170, 175, 180]] } as const;
type Tone = keyof typeof PAL;
/** 画布：每帧调用 draw 重画一次。 */
const Canvas: React.FC<{ w: number; h: number; draw: (c: CanvasRenderingContext2D, t: number) => void; style?: React.CSSProperties }> = ({ w, h, draw, style }) => { const ref = React.useRef<HTMLCanvasElement>(null), t = useT(); React.useLayoutEffect(() => { const c = ref.current?.getContext('2d'); if (!c) return; c.clearRect(0, 0, w, h); draw(c, t); }); return <canvas ref={ref} width={w} height={h} style={{ display: 'block', ...style }} />; };
/** 在一个矩形里撒颗粒：越靠上越亮，颗粒会闪。 */
const fill = (c: CanvasRenderingContext2D, t: number, x: number, y: number, w: number, h: number, tone: Tone, seed: number, density = 0.03) => {
  const n = Math.floor(w * h * density), [a, b] = PAL[tone], st = Math.floor(t * 10);
  for (let i = 0; i < n; i++) { const px = x + rnd(seed + i * 3) * w, fy = rnd(seed + i * 3 + 1), py = y + fy * h, tw = 0.35 + 0.65 * rnd(seed + i + st * 31), k = 1 - fy, s = 2 + rnd(seed + i * 3 + 2) * 3.2; c.fillStyle = `rgba(${Math.round(mix(b[0], a[0], k))},${Math.round(mix(b[1], a[1], k))},${Math.round(mix(b[2], a[2], k))},${tw})`; c.fillRect(px, py, s, s); }
  c.fillStyle = `rgba(${a[0]},${a[1]},${a[2]},.9)`; if (h > 4) c.fillRect(x, y, w, 3);
};

/** 粒子柱状图：一排由发光颗粒堆成的柱子依次长起来，可以把其中一根标成白色的「纪录」。 */
export const ParticleBars: React.FC<{ bars: { label?: string; v: number; text?: string; tone?: Tone }[]; at: number; width?: number; height?: number; gap?: number; stagger?: number; tag?: { i: number; text: string } }> = ({ bars, at, width = 1100, height = 560, gap = 18, stagger = 0.18, tag }) => {
  const t = useT(), n = bars.length, max = Math.max(...bars.map((b) => b.v)), bw = (width - gap * (n - 1)) / n, top = 70, bot = 50, bh = height - top - bot, lv = (i: number) => inOut((t - at - i * stagger) / 0.9);
  return (
    <div style={{ position: 'relative', width, height }}>
      <Canvas w={width} h={height} draw={(c, tt) => { c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(0, height - bot, width, 2); bars.forEach((b, i) => { const h = (b.v / max) * bh * lv(i); fill(c, tt, i * (bw + gap), height - bot - h, bw, h, b.tone ?? 'lime', i * 977); }); }} />
      {bars.map((b, i) => { const h = (b.v / max) * bh * lv(i), x = i * (bw + gap); return <React.Fragment key={i}>{b.text && <div style={{ position: 'absolute', left: x - 40, width: bw + 80, top: height - bot - h - 52, textAlign: 'center', opacity: cl((lv(i) - 0.7) * 4) }}><Thin size={44} color={BC.white} style={{ transformOrigin: 'center' }}>{b.text}</Thin></div>}{b.label && <div style={{ position: 'absolute', left: x - 30, width: bw + 60, top: height - bot + 12, textAlign: 'center', fontFamily: MONO, fontSize: 16, letterSpacing: '0.08em', color: BC.dim, whiteSpace: 'nowrap' }}>{b.label}</div>}</React.Fragment>; })}
      {tag && <div style={{ position: 'absolute', left: tag.i * (bw + gap) - 150, top: 4, fontFamily: MONO, fontSize: 18, background: BC.white, color: BC.ink, padding: '4px 12px', opacity: cl((lv(tag.i) - 0.8) * 5), whiteSpace: 'nowrap' }}>{tag.text}</div>}
    </div>
  );
};
/** 粒子容器：线框盒子里装着一缸发光颗粒，液面从一个高度降到另一个高度，右边带刻度。讲「少了多少」「缩水到多少」。 */
export const ParticleTank: React.FC<{ from?: number; to: number; at: number; dropAt: number; ticks?: number[]; width?: number; height?: number; tone?: Tone }> = ({ from = 1, to, at, dropAt, ticks = [], width = 420, height = 560, tone = 'lime' }) => {
  const t = useT(), lv = mix(from, to, inOut((t - dropAt) / 1.4)) * prog(t, at, 0.9), px = 40, bw = width - px * 2 - 60, top = 40, bh = height - 90, ey = 26;
  return (
    <div style={{ position: 'relative', width, height, opacity: prog(t, at, 0.4) }}>
      <Canvas w={width} h={height} draw={(c, tt) => {
        c.strokeStyle = 'rgba(255,90,70,.7)'; c.lineWidth = 1.5; c.setLineDash([5, 5]); c.strokeRect(px, top, bw, bh); c.beginPath(); c.ellipse(px + bw / 2, top, bw / 2, ey, 0, 0, 7); c.stroke(); c.beginPath(); c.ellipse(px + bw / 2, top + bh, bw / 2, ey, 0, 0, 7); c.stroke(); c.setLineDash([]);
        const h = bh * lv; fill(c, tt, px + 6, top + bh - h, bw - 12, h, tone, 5, 0.045); c.fillStyle = 'rgba(240,255,200,.95)'; c.beginPath(); c.ellipse(px + bw / 2, top + bh - h, bw / 2 - 6, ey * 0.7, 0, 0, 7); c.fill();
        ticks.forEach((v) => { const y = top + bh * (1 - v); c.fillStyle = 'rgba(255,90,70,.9)'; c.fillRect(px + bw + 4, y, 16, 2); c.font = `16px ${MONO}`; c.fillText(String(Math.round(v * 100)), px + bw + 26, y + 6); });
      }} />
    </div>
  );
};
/** 粒子环：一个斜放的颗粒圆环，只亮到某个比例，外面两圈细轨道。讲占比、份额、毛利率这类「一圈里的多少」。 */
export const ParticleRing: React.FC<{ pct: number; from?: number; at: number; changeAt?: number; size?: number; tone?: Tone; label?: string }> = ({ pct, from, at, changeAt, size = 560, tone = 'lime', label }) => {
  const t = useT(), a = prog(t, at, 0.5), cur = from === undefined ? pct * inOut((t - at) / 1.4) : mix(from, pct, inOut((t - (changeAt ?? at)) / 1.2)), W = size * 1.5, Hh = size * 0.8, cx = W / 2, cy = Hh / 2, sq = 0.36;
  return (
    <div style={{ position: 'relative', width: W, height: Hh, opacity: a }}>
      <Canvas w={W} h={Hh} draw={(c, tt) => {
        c.strokeStyle = 'rgba(166,245,27,.45)'; c.lineWidth = 1.5; [0.62, 0.72].forEach((r) => { c.beginPath(); c.ellipse(cx, cy, size * r, size * r * sq, 0, 0, 7); c.stroke(); });
        const n = 9000, [p1, p2] = PAL[tone], st = Math.floor(tt * 10), rot = tt * 0.25;
        for (let i = 0; i < n; i++) { const u = rnd(i * 2); if (u > cur / 100) continue; const ang = u * Math.PI * 2 + rot - Math.PI / 2, r = size * (0.3 + rnd(i * 2 + 1) * 0.2), hgt = (rnd(i * 5 + 3) - 0.5) * size * 0.07, x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r * sq + hgt, k = 0.5 + 0.5 * Math.sin(ang), tw = 0.3 + 0.7 * rnd(i + st * 17); c.fillStyle = `rgba(${Math.round(mix(p2[0], p1[0], k))},${Math.round(mix(p2[1], p1[1], k))},${Math.round(mix(p2[2], p1[2], k))},${tw})`; const s = 2 + k * 3; c.fillRect(x, y, s, s); }
      }} />
      {label && <div style={{ position: 'absolute', left: 0, right: 0, top: cy - 26, textAlign: 'center', fontFamily: MONO, fontSize: 30, letterSpacing: '0.16em', color: BC.white }}>{label}</div>}
    </div>
  );
};
/** 粒子区间柱：坐标轴上一根颗粒柱先冲到最低点再收回到收盘位置，右边两个瘦高的百分比。讲「盘中跌了多少、收盘跌了多少」。 */
export const ParticleRange: React.FC<{ low: number; close: number; ticks?: number[]; at: number; lowAt: number; closeAt: number; labels?: [string, string]; width?: number; height?: number }> = ({ low, close, ticks = [0, -5, -10, -15], at, lowAt, closeAt, labels = ['INTRADAY LOW · 盘中最低', 'CLOSE · 收盘'], width = 1500, height = 560 }) => {
  const t = useT(), lo = Math.min(...ticks), Y = (v: number) => 40 + (v / lo) * (height - 90), cw = 760, k1 = inOut((t - lowAt) / 0.7), k2 = inOut((t - closeAt) / 0.9), v = mix(mix(0, low, k1), close, k2);
  return (
    <div style={{ position: 'relative', width, height, opacity: prog(t, at, 0.4) }}>
      <Canvas w={cw} h={height} draw={(c, tt) => { ticks.forEach((tk) => { c.fillStyle = tk === 0 ? 'rgba(255,255,255,.8)' : 'rgba(255,255,255,.14)'; c.fillRect(70, Y(tk), cw - 70, tk === 0 ? 2 : 1); c.fillStyle = 'rgba(255,255,255,.6)'; c.font = `16px ${MONO}`; c.fillText(`${tk}%`, 14, Y(tk) + 5); }); const x = 420, w = 150; if (k2 > 0) fill(c, tt, x, Y(close), w, Y(low) - Y(close), 'red', 400, 0.008); fill(c, tt, x, Y(0), w, Y(v) - Y(0), 'red', 11, 0.05); c.fillStyle = '#fff'; c.fillRect(x - 30, Y(v), w + 60, 3); }} />
      <div style={{ position: 'absolute', left: cw + 60, top: 20 }}><div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: '0.1em', color: BC.red, opacity: k1 }}>{labels[0]}</div><div style={{ opacity: k1 }}><Thin size={210} color={BC.red}>{`−${Math.abs(low * k1).toFixed(1)}%`}</Thin></div>
        <div style={{ fontFamily: MONO, fontSize: 18, letterSpacing: '0.1em', color: BC.white, opacity: k2, marginTop: 30 }}>{labels[1]}</div><div style={{ opacity: k2 }}><Thin size={210} color={BC.white}>{`−${Math.abs(mix(low, close, k2)).toFixed(1)}%`}</Thin></div></div>
    </div>
  );
};
/** 长尾分布：左边一个滚动的大数字，右边一排从高到低的细柱。讲「总量很大，但集中在头几个」。 */
export const LongTailBars: React.FC<{ to: number; unit: string; label?: string; values: number[]; peak?: string; chips?: string[]; at: number; width?: number; height?: number }> = ({ to, unit, label, values, peak, chips = [], at, width = 1500, height = 520 }) => {
  const t = useT(), p = inOut((t - at) / 1.3), max = Math.max(...values), bx = width * 0.5, bw = (width - bx) / values.length;
  return (
    <div style={{ position: 'relative', width, height }}>
      <div style={{ position: 'absolute', left: 0, top: height * 0.22 }}><div style={{ ...H, fontSize: 230, color: BC.white }}>{(to * p).toFixed(1)}{unit}</div>{label && <div style={{ fontFamily: MONO, fontSize: 24, letterSpacing: '0.12em', color: BC.white, marginTop: 14 }}>{label}</div>}<div style={{ display: 'flex', gap: 12, marginTop: 22 }}>{chips.map((c, i) => <div key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 24, background: BC.lime, color: BC.ink, padding: '4px 14px', opacity: prog(t, at + 1.3 + i * 0.2, 0.2) }}>{c}</div>)}</div></div>
      {values.map((v, i) => { const k = inOut((t - at - 0.2 - i * 0.04) / 0.6); return <div key={i} style={{ position: 'absolute', left: bx + i * bw, bottom: 0, width: bw - 5, height: (v / max) * (height - 60) * k, background: `linear-gradient(180deg, #E4FF7A, ${BC.lime} 30%, #2E7A0A)`, boxShadow: i < 3 ? `0 0 24px ${BC.lime}99` : 'none' }} />; })}
      {peak && <div style={{ position: 'absolute', left: bx - 6, top: 0, fontFamily: MONO, fontSize: 20, color: BC.white, opacity: cl((p - 0.6) * 3) }}>{peak}</div>}
    </div>
  );
};
/** 像素字：把一串字母数字渲染成粗颗粒的像素字。配磷光终端做大标题和大数字。 */
export const PixelText: React.FC<{ text: string; size?: number; color?: string; at?: number; glow?: boolean }> = ({ text, size = 200, color = BC.lime, at = 0, glow = true }) => {
  const ref = React.useRef<HTMLCanvasElement>(null), t = useT(), n = Math.min(text.length, Math.max(0, Math.floor((t - at) * 22))), shown = text.slice(0, n), cw = Math.max(1, text.length * 7), ch = 12;
  const rgb = [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16));
  React.useLayoutEffect(() => { const c = ref.current?.getContext('2d'); if (!c) return; c.clearRect(0, 0, cw, ch); c.font = 'bold 11px "DejaVu Sans Mono", monospace'; c.textBaseline = 'top'; c.fillStyle = '#fff'; c.fillText(shown, 0, 0); const d = c.getImageData(0, 0, cw, ch); for (let i = 0; i < d.data.length; i += 4) { const on = d.data[i + 3] > 110; d.data[i] = rgb[0]; d.data[i + 1] = rgb[1]; d.data[i + 2] = rgb[2]; d.data[i + 3] = on ? 255 : 0; } c.putImageData(d, 0, 0); });
  const sc = size / ch;
  return <canvas ref={ref} width={cw} height={ch} style={{ display: 'block', width: cw * sc, height: size, imageRendering: 'pixelated', filter: glow ? `drop-shadow(0 0 ${size * 0.06}px ${color})` : undefined }} />;
};
/** 磷光终端：一块绿色磷光屏，顶上一行标题，里面的内容（命令行、清单、像素大字、横条）像终端一样一行行打出来。讲「全网监测」「我们扫了一遍」。 */
export const PhosphorTerminal: React.FC<{ title: string; right?: string; at: number; children: React.ReactNode; width?: number; height?: number }> = ({ title, right, at, children, width = 1700, height = 780 }) => { const t = useT(), p = prog(t, at, 0.3); return <div style={{ position: 'relative', width, height, background: 'radial-gradient(ellipse at 50% 40%, #0D2A0C 0%, #030A03 80%)', overflow: 'hidden', fontFamily: MONO, color: BC.lime, opacity: p }}><div style={{ display: 'flex', justifyContent: 'space-between', padding: '22px 34px 14px', fontSize: 22, letterSpacing: '0.14em', borderBottom: '2px solid rgba(166,245,27,.35)' }}><span>{title}</span><span style={{ opacity: 0.7 }}>{right}</span></div><div style={{ padding: '26px 34px' }}>{children}</div><div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, rgba(0,0,0,.32) 0 2px, transparent 2px 5px)', pointerEvents: 'none' }} /><div style={{ position: 'absolute', left: 0, right: 0, top: `${((t * 22) % 120) - 10}%`, height: 90, background: 'linear-gradient(180deg, transparent, rgba(166,245,27,.07), transparent)' }} /></div>; };
/** 终端里的一行：带提示符的命令逐字打出；也可以是普通输出行、被划掉的行。 */
export const TermLine: React.FC<{ text: string; at: number; prompt?: boolean; color?: string; strike?: number; size?: number; cps?: number }> = ({ text, at, prompt, color, strike, size = 26, cps = 40 }) => { const t = useT(), n = Math.floor(Math.max(0, t - at) * cps), s = text.slice(0, n), done = n >= text.length, k = strike === undefined ? 0 : inOut((t - strike) / 0.4); return <div style={{ fontSize: size, lineHeight: 1.7, letterSpacing: '0.1em', color: color ?? (prompt ? BC.lime : 'rgba(210,235,190,.85)'), opacity: t < at ? 0 : 1, whiteSpace: 'pre', position: 'relative', display: 'table' }}>{prompt ? '> ' : ''}{s}{!done && <span style={{ background: 'currentColor' }}> </span>}{k > 0 && <span style={{ position: 'absolute', left: 0, top: '50%', height: 3, width: `${k * 100}%`, background: BC.red }} />}</div>; };
/** 终端里的横条排名：每行一个名字、一根横条、一个数。 */
export const TermBars: React.FC<{ rows: { name: string; sub?: string; v: number; text: string; color?: string }[]; at: number; gap?: number; width?: number }> = ({ rows, at, gap = 0.9, width = 1500 }) => { const t = useT(), max = Math.max(...rows.map((r) => r.v)); return <div style={{ width }}>{rows.map((r, i) => { const k = inOut((t - at - i * gap) / 0.7); return <div key={i} style={{ display: 'flex', alignItems: 'center', height: 96, opacity: t < at + i * gap ? 0 : 1 }}><div style={{ width: 300, fontSize: 24, letterSpacing: '0.1em' }}><div style={{ color: '#E8F5DA' }}>{r.name}</div>{r.sub && <div style={{ opacity: 0.6, fontSize: 20 }}>{r.sub}</div>}</div><div style={{ width: (r.v / max) * (width - 520) * k, height: 46, background: r.color ?? BC.lime, boxShadow: `0 0 26px ${(r.color ?? BC.lime)}88` }} /><div style={{ marginLeft: 26, fontSize: 26, color: '#E8F5DA', opacity: cl((k - 0.7) * 4) }}>{r.text}</div></div>; })}</div>; };
/** 衰减曲线：一块面积从高处随时间衰减下去，可以在某一年立一根虚线标「到这里就没了」。讲「优势会消退」。 */
export const DecayCurve: React.FC<{ years?: number; rate?: number; mark?: { x: number; text: string }; at: number; markAt?: number; width?: number; height?: number; color?: string; ink?: string; xLabel?: string }> = ({ years = 10, rate = 0.7, mark, at, markAt = 0, width = 1500, height = 460, color = BC.lime, ink = BC.ink, xLabel }) => {
  const t = useT(), p = inOut((t - at) / 1.6), X = (y: number) => 60 + (y / years) * (width - 120), Y = (v: number) => height - 60 - v * (height - 110), pts = Array.from({ length: 61 }).map((_, i) => { const y = (i / 60) * years; return `${X(y)},${Y(Math.exp(-rate * y))}`; }), k = mark ? prog(t, markAt, 0.4) : 0, id = React.useId().replace(/[^a-z0-9]/gi, '');
  return (
    <svg width={width} height={height}>
      <defs><clipPath id={id}><rect x={0} y={0} width={X(years * p)} height={height} /></clipPath></defs>
      <line x1={60} x2={width - 60} y1={height - 60} y2={height - 60} stroke={ink} strokeWidth={2} />{Array.from({ length: years + 1 }).map((_, i) => <g key={i}><line x1={X(i)} x2={X(i)} y1={height - 60} y2={height - 50} stroke={ink} strokeWidth={2} /><text x={X(i)} y={height - 26} textAnchor="middle" fontFamily={MONO} fontSize={18} fill={ink} opacity={0.6}>{i}</text></g>)}
      {xLabel && <text x={width - 60} y={height - 2} textAnchor="end" fontFamily={MONO} fontSize={16} fill={ink} opacity={0.6}>{xLabel}</text>}
      <g clipPath={`url(#${id})`}><polygon points={`${X(0)},${height - 60} ${pts.join(' ')} ${X(years)},${height - 60}`} fill={color} /><polyline points={pts.join(' ')} fill="none" stroke={ink} strokeWidth={3} /></g>
      {mark && <g opacity={k}><line x1={X(mark.x)} x2={X(mark.x)} y1={40} y2={height - 60} stroke={BC.red} strokeWidth={3} strokeDasharray="8 8" /><rect x={X(mark.x) + 14} y={Y(0.32) - 30} width={mark.text.length * 26 + 30} height={50} fill={BC.red} /><text x={X(mark.x) + 28} y={Y(0.32) + 5} fontFamily={FONT} fontWeight={900} fontSize={28} fill="#fff">{mark.text}</text></g>}
    </svg>
  );
};
/** 倍数对比：一个巨大的倍数从 1.0 滚到目标值，旁边一短一长两根条。讲「是另一组的几倍」。 */
export const MultipleCompare: React.FC<{ to: number; unit?: string; rows: [{ name: string; color?: string }, { name: string; color?: string }]; zh?: string; at: number; ink?: string; hi?: string; width?: number }> = ({ to, unit = '×', rows, zh, at, ink = BC.ink, hi = BC.blue, width = 1700 }) => {
  const t = useT(), p = inOut((t - at - 0.6) / 1.4), v = mix(1, to, p), bw = width * 0.36;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 90, width }}>
      <div style={{ ...H, fontSize: 420, color: ink, opacity: prog(t, at, 0.3), minWidth: width * 0.5 }}>{v.toFixed(1)}{unit}</div>
      <div>{rows.map((r, i) => <div key={i} style={{ marginBottom: 34, opacity: prog(t, at + 0.2 + i * 0.2, 0.3) }}><div style={{ fontFamily: MONO, fontSize: 20, letterSpacing: '0.12em', color: i ? hi : ink, opacity: i ? 1 : 0.6, marginBottom: 10 }}>{r.name}</div><div style={{ width: i ? (bw / to) * v : bw / to, height: 44, background: r.color ?? (i ? hi : 'rgba(17,17,17,.25)') }} /></div>)}{zh && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: ink, opacity: prog(t, at + 2, 0.3) }}>{zh}</div>}</div>
    </div>
  );
};
/** 年份加格子：一个大年份，旁边一格格方块填上去，下面的「第几年」跟着数。讲「从那年到现在过去了多少年」。 */
export const YearGrid: React.FC<{ year: string; total: number; cols?: number; first?: number; label?: (n: number) => string; zh?: string; at: number; ink?: string; hi?: string }> = ({ year, total, cols = 9, first = 3, label = (n) => `YEAR ${n}`, zh, at, ink = BC.ink, hi = BC.blue }) => {
  const t = useT(), n = Math.round(total * inOut((t - at - 0.5) / 1.6));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 80 }}>
      <div style={{ ...H, fontSize: 420, color: ink, opacity: t < at ? 0 : 1, transform: `scale(${mix(1.25, 1, cl((t - at) / 0.2))})`, transformOrigin: 'left center' }}>{year}</div>
      <div><div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 34px)`, gap: 7 }}>{Array.from({ length: total }).map((_, i) => <div key={i} style={{ width: 34, height: 34, background: i < n ? (i < first ? BC.red : hi) : 'rgba(17,17,17,.08)' }} />)}</div><div style={{ ...H, fontSize: 120, color: hi, marginTop: 26, whiteSpace: 'nowrap' }}>{label(n)}</div>{zh && <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 30, color: ink, marginTop: 12, opacity: prog(t, at + 2.1, 0.3) }}>{zh}</div>}</div>
    </div>
  );
};
