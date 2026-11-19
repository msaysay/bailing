// 口播字效 · 强调标注 · 人物互动（19 个）。本项目自写：只参考了「口播里什么时刻需要什么样的字」这一类用途清单，没有使用任何第三方代码。
// 约定同全库：时间用秒（at），useT() 取当前秒；只用弹簧和缓动，不用随机数。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, FONT, useT } from '../kit/kit';
import { inOut, mix, outCubic, prog } from '../kit/clock';
import { spring } from '../kit/motion';

const MONO = '"JetBrains Mono", "DejaVu Sans Mono", monospace';
const LIME = '#C6F432', CORAL = '#FF5A4E';
const sp = (t: number, at: number, k = 200, d = 15) => (t < at ? 0 : spring(t - at, { from: 0, to: 1, stiffness: k, damping: d }));
const chars = (s: string) => Array.from(s);
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

/** Y01 数字重音标题：一个巨大的数字先砸下，标题从数字右侧滑出。「三个方法」「五个坑」。 */
export const CountTitle: React.FC<{ n: string; text: string; at: number; size?: number; color?: string; accent?: string }> = ({ n, text, at, size = 160, color = C.text, accent = LIME }) => {
  const t = useT(), k = sp(t, at, 260, 13), r = prog(t, at + 0.25, 0.5);
  return <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.2, fontFamily: FONT, fontWeight: 900 }}>
    <div style={{ fontSize: size * 2, lineHeight: 0.85, color: accent, transform: `scale(${mix(2.4, 1, k)})`, opacity: clamp01(k * 3), textShadow: `0 0 ${size * 0.3}px ${accent}66` }}>{n}</div>
    <div style={{ overflow: 'hidden' }}><div style={{ fontSize: size, color, whiteSpace: 'nowrap', transform: `translateX(${(1 - r) * -110}%)` }}>{text}</div></div>
  </div>;
};

/** Y02 数字弧落标题：仪表盘刻度弧扫出，数字从弧顶掉进中心，标题在下。时长、倒计时、数量揭晓。 */
export const ArcNumberTitle: React.FC<{ n: number; unit?: string; text: string; at: number; size?: number; accent?: string }> = ({ n, unit = '', text, at, size = 420, accent = LIME }) => {
  const t = useT(), sweep = inOut((t - at) / 0.9), drop = sp(t, at + 0.5, 240, 14), cur = Math.round(n * prog(t, at + 0.2, 0.9));
  const R = size / 2 - 20, ticks = 41;
  return <div style={{ position: 'relative', width: size, height: size * 0.82, fontFamily: FONT }}>
    <svg width={size} height={size} style={{ position: 'absolute', left: 0, top: 0 }}>
      {Array.from({ length: ticks }).map((_, i) => { const p = i / (ticks - 1); if (p > sweep) return null; const a = Math.PI * (0.8 + 1.4 * p), long = i % 5 === 0; return <line key={i} x1={size / 2 + Math.cos(a) * R} y1={size / 2 + Math.sin(a) * R} x2={size / 2 + Math.cos(a) * (R - (long ? 34 : 16))} y2={size / 2 + Math.sin(a) * (R - (long ? 34 : 16))} stroke={long ? accent : 'rgba(255,255,255,.4)'} strokeWidth={long ? 5 : 3} strokeLinecap="round" />; })}
    </svg>
    <div style={{ position: 'absolute', left: 0, right: 0, top: size * 0.24, textAlign: 'center', transform: `translateY(${(1 - drop) * -size * 0.4}px)`, opacity: clamp01(drop * 3) }}><span style={{ fontSize: size * 0.34, fontWeight: 900, color: C.text }}>{cur}</span><span style={{ fontSize: size * 0.1, color: accent, marginLeft: 8 }}>{unit}</span></div>
    <div style={{ position: 'absolute', left: -200, right: -200, top: size * 0.66, textAlign: 'center', fontSize: size * 0.11, fontWeight: 700, color: C.text, opacity: prog(t, at + 0.9, 0.4) }}>{text}</div>
  </div>;
};

/** Y03 首词占满补句：首词先撑满整屏，再缩到左边，后半句一个字一个字补上。 */
export const LeadWordZoom: React.FC<{ lead: string; rest: string; at: number; size?: number; width?: number; accent?: string }> = ({ lead, rest, at, size = 130, width = 1600, accent = LIME }) => {
  const t = useT(), shrink = inOut((t - at - 0.8) / 0.5), big = (width / (chars(lead).length * size)) * 0.92, s = mix(big, 1, shrink);
  return <div style={{ width, display: 'flex', alignItems: 'baseline', justifyContent: shrink > 0.01 ? 'flex-start' : 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, whiteSpace: 'nowrap' }}>
    <span style={{ color: accent, display: 'inline-block', transform: `scale(${s * mix(1.15, 1, prog(t, at, 0.3))})`, transformOrigin: shrink > 0.01 ? 'left bottom' : 'center bottom', opacity: prog(t, at, 0.15), marginRight: mix(0, size * 0.25, shrink) }}>{lead}</span>
    {chars(rest).map((c, i) => { const k = sp(t, at + 1.15 + i * 0.05, 260, 16); return <span key={i} style={{ color: C.text, display: 'inline-block', opacity: clamp01(k * 2), transform: `translateY(${(1 - k) * 40}px)` }}>{c}</span>; })}
  </div>;
};

/** Y04 描边框标题：一个矩形框沿边画一圈，字在框里亮起，四角留小方块。「我的核心观点是」。 */
export const OutlineBoxTitle: React.FC<{ text: string; at: number; size?: number; color?: string; label?: string }> = ({ text, at, size = 96, color = LIME, label }) => {
  const t = useT(), p = inOut((t - at) / 0.8), w = chars(text).length * size + size * 1.2, h = size * 1.9, per = 2 * (w + h);
  return <div style={{ position: 'relative', width: w, height: h, fontFamily: FONT }}>
    <svg width={w + 20} height={h + 20} style={{ position: 'absolute', left: -10, top: -10 }}><rect x={10} y={10} width={w} height={h} fill="none" stroke={color} strokeWidth={4} strokeDasharray={per} strokeDashoffset={per * (1 - p)} />
      {[[10, 10], [10 + w, 10], [10, 10 + h], [10 + w, 10 + h]].map(([x, y], i) => <rect key={i} x={x - 7} y={y - 7} width={14} height={14} fill={color} opacity={prog(t, at + 0.75, 0.2)} />)}</svg>
    {label && <div style={{ position: 'absolute', left: 0, top: -size * 0.55, fontFamily: MONO, fontSize: size * 0.24, letterSpacing: '.2em', color, opacity: prog(t, at + 0.2, 0.3) }}>{label}</div>}
    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size, fontWeight: 900, color: C.text, opacity: prog(t, at + 0.45, 0.4), letterSpacing: `${mix(0.3, 0, prog(t, at + 0.45, 0.6))}em` }}>{text}</div>
  </div>;
};

/** Y05 逐字升起：每个字从基线下方升上来，带一点模糊变清。论点句、口号。 */
export const CharRise: React.FC<{ text: string; at: number; size?: number; color?: string; stagger?: number; hi?: string; accent?: string }> = ({ text, at, size = 110, color = C.text, stagger = 0.06, hi = '', accent = LIME }) => {
  const t = useT(), hs = text.indexOf(hi);
  return <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, whiteSpace: 'nowrap', overflow: 'hidden', paddingBottom: size * 0.12 }}>{chars(text).map((c, i) => { const k = outCubic((t - at - i * stagger) / 0.55), on = hi && i >= hs && i < hs + hi.length; return <span key={i} style={{ display: 'inline-block', color: on ? accent : color, transform: `translateY(${(1 - k) * 105}%)`, filter: `blur(${(1 - k) * 8}px)`, opacity: clamp01(k * 1.5) }}>{c === ' ' ? ' ' : c}</span>; })}</div>;
};

/** Y06 引号夹句：一对巨大的引号从两边夹进来，句子在中间展开，下方署名。 */
export const QuoteBracket: React.FC<{ text: string; by?: string; at: number; size?: number; accent?: string }> = ({ text, by, at, size = 84, accent = LIME }) => {
  const t = useT(), k = sp(t, at, 170, 15), open = inOut((t - at - 0.3) / 0.6);
  return <div style={{ display: 'flex', alignItems: 'center', fontFamily: FONT }}>
    <div style={{ fontSize: size * 3, fontWeight: 900, color: accent, lineHeight: 0.6, transform: `translateX(${(1 - k) * 300}px)`, alignSelf: 'flex-start' }}>“</div>
    <div style={{ maxWidth: open * (chars(text).length * size + 40), overflow: 'hidden', padding: '0 20px' }}>
      <div style={{ fontSize: size, fontWeight: 800, color: C.text, whiteSpace: 'nowrap', opacity: open }}>{text}</div>
      {by && <div style={{ fontSize: size * 0.34, color: C.muted, marginTop: 14, whiteSpace: 'nowrap', opacity: prog(t, at + 0.9, 0.3) }}>—— {by}</div>}
    </div>
    <div style={{ fontSize: size * 3, fontWeight: 900, color: accent, lineHeight: 0.6, transform: `translateX(${(1 - k) * -300}px)`, alignSelf: 'flex-end' }}>”</div>
  </div>;
};

/** Y07 速度块标题：色块带速度线横冲进来急停，字被色块「刷」出来。效率、提速、立刻。 */
export const SpeedSlab: React.FC<{ text: string; at: number; size?: number; bg?: string; color?: string }> = ({ text, at, size = 120, bg = LIME, color = '#0B0E14' }) => {
  const t = useT(), p = clamp01((t - at) / 0.32), x = (1 - outCubic(p)) * -1500, over = sp(t, at + 0.3, 400, 12), skew = mix(-18, 0, outCubic(p)) + (1 - over) * 0;
  const w = chars(text).length * size + size;
  return <div style={{ position: 'relative', height: size * 1.6, width: w }}>
    {Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ position: 'absolute', right: w - 20 - x * 0.2, top: size * (0.2 + i * 0.22), height: 6, width: (1 - prog(t, at + 0.25, 0.4)) * (300 + (i % 3) * 180), background: bg, opacity: 0.6 }} />)}
    <div style={{ position: 'absolute', inset: 0, background: bg, transform: `translateX(${x}px) skewX(${skew}deg) scaleX(${mix(1.04, 1, over)})`, transformOrigin: 'left', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, fontWeight: 900, fontStyle: 'italic', fontSize: size, color, whiteSpace: 'nowrap' }}>{text}</div>
  </div>;
};

/** Y08 逐字裂升：每个字被一条基线切成上下两半，上半升起、下半落下，再合拢。片名、章节题。 */
export const SplitRise: React.FC<{ text: string; at: number; size?: number; color?: string; line?: string }> = ({ text, at, size = 130, color = C.text, line = LIME }) => {
  const t = useT(), lw = inOut((t - at) / 0.45);
  return <div style={{ position: 'relative', fontFamily: FONT, fontWeight: 900, fontSize: size, whiteSpace: 'nowrap', display: 'inline-flex' }}>
    {chars(text).map((c, i) => { const k = outCubic((t - at - 0.3 - i * 0.07) / 0.5), half = (top: boolean) => <span style={{ position: top ? 'relative' : 'absolute', left: 0, top: 0, display: 'inline-block', color, clipPath: top ? 'inset(0 0 50% 0)' : 'inset(50% 0 0 0)', transform: `translateY(${(1 - k) * (top ? -size * 0.6 : size * 0.6)}px)`, opacity: clamp01(k * 2) }}>{c}</span>; return <span key={i} style={{ position: 'relative', display: 'inline-block' }}>{half(true)}{half(false)}</span>; })}
    <div style={{ position: 'absolute', left: 0, top: '54%', height: 5, width: `${lw * 100}%`, background: line, opacity: 1 - prog(t, at + 0.9 + chars(text).length * 0.07, 0.4) }} />
  </div>;
};

/** Y09 标题降格成标签：标题先居中当主角，然后缩小飞到左上角变成一枚标签，给内容让位。 */
export const TitleToLabel: React.FC<{ text: string; at: number; demoteAt: number; width?: number; height?: number; size?: number; accent?: string; children?: React.ReactNode }> = ({ text, at, demoteAt, width = 1920, height = 1080, size = 150, accent = LIME, children }) => {
  const t = useT(), k = sp(t, at, 180, 15), d = inOut((t - demoteAt) / 0.6), s = mix(1, 0.24, d);
  const tw = chars(text).length * size;
  return <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>
    <div style={{ position: 'absolute', left: mix((width - tw) / 2, 80, d), top: mix(height / 2 - size * 0.6, 70, d), transform: `scale(${s * mix(0.8, 1, k)})`, transformOrigin: 'left top', opacity: clamp01(k * 2) }}>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, whiteSpace: 'nowrap', background: d > 0.5 ? accent : 'transparent', color: d > 0.5 ? '#0B0E14' : C.text, padding: d > 0.5 ? `0 ${size * 0.3}px` : 0, borderRadius: size * 0.2 }}>{text}</div>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 160, bottom: 0, opacity: prog(t, demoteAt + 0.35, 0.4), transform: `translateY(${(1 - prog(t, demoteAt + 0.35, 0.5)) * 60}px)` }}>{children}</div>
  </div>;
};

/** Y10 字距收拢：字距从很宽收到正常，同时由虚变实。整屏一句大标题。 */
export const TrackingIn: React.FC<{ text: string; at: number; size?: number; color?: string; dur?: number }> = ({ text, at, size = 120, color = C.text, dur = 1.4 }) => {
  const t = useT(), p = outCubic((t - at) / dur);
  return <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color, whiteSpace: 'nowrap', letterSpacing: `${mix(0.9, 0.02, p)}em`, filter: `blur(${(1 - p) * 14}px)`, opacity: clamp01(p * 1.6) }}>{text}</div>;
};

/** Y11 字体对比重音：一句话里的重音词换成另一种字体（细长衬线 / 斜体），更大、带底色。「不是 A，是 B」。 */
export const ContrastEmphasis: React.FC<{ before: string; hi: string; after?: string; at: number; size?: number; accent?: string }> = ({ before, hi, after = '', at, size = 96, accent = LIME }) => {
  const t = useT(), a = prog(t, at, 0.4), k = sp(t, at + 0.45, 240, 12), bar = inOut((t - at - 0.55) / 0.35);
  return <div style={{ display: 'flex', alignItems: 'baseline', whiteSpace: 'nowrap', fontFamily: FONT, fontSize: size, color: C.text }}>
    <span style={{ fontWeight: 400, opacity: a }}>{before}</span>
    <span style={{ position: 'relative', margin: `0 ${size * 0.15}px`, display: 'inline-block', transform: `scale(${mix(0.4, 1, k)})`, opacity: clamp01(k * 2) }}>
      <span style={{ position: 'absolute', left: -10, right: -10, bottom: size * 0.08, height: size * 0.42, background: accent, transform: `scaleX(${bar})`, transformOrigin: 'left', zIndex: 0 }} />
      <span style={{ position: 'relative', fontFamily: '"Noto Serif SC", "Source Han Serif SC", serif', fontStyle: 'italic', fontWeight: 900, fontSize: size * 1.45, color: '#fff' }}>{hi}</span></span>
    <span style={{ fontWeight: 400, opacity: prog(t, at + 0.7, 0.4) }}>{after}</span>
  </div>;
};

// ---------- 强调标注 ----------
/** Y12 双箭头聚焦：两支箭头从左右两边射向中间的词，命中时词一抖。 */
export const ConvergingArrows: React.FC<{ text: string; at: number; size?: number; color?: string; accent?: string }> = ({ text, at, size = 110, color = C.text, accent = CORAL }) => {
  const t = useT(), p = inOut((t - at) / 0.55), hit = t > at + 0.55 ? Math.sin((t - at - 0.55) * 40) * Math.exp(-(t - at - 0.55) * 8) * 10 : 0, gap = 70 + (1 - p) * 500;
  const arrow = (dir: 1 | -1) => <svg width={220} height={60} style={{ transform: `translateX(${dir * -gap}px) scaleX(${dir})`, opacity: clamp01(p * 3) }}><line x1={0} y1={30} x2={190} y2={30} stroke={accent} strokeWidth={10} strokeLinecap="round" /><path d="M170 8 L214 30 L170 52 Z" fill={accent} /></svg>;
  return <div style={{ display: 'flex', alignItems: 'center' }}>{arrow(1)}<div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, color, whiteSpace: 'nowrap', transform: `translateX(${hit}px) scale(${1 + Math.abs(hit) / 120})` }}>{text}</div>{arrow(-1)}</div>;
};

/** Y13 对角角框：左上和右下两只直角框从远处收拢到一句话两侧，像取景器框住它。 */
export const CornerBrackets: React.FC<{ children: React.ReactNode; at: number; w: number; h: number; color?: string; arm?: number }> = ({ children, at, w, h, color = LIME, arm = 70 }) => {
  const t = useT(), k = sp(t, at, 220, 16), off = (1 - k) * 160;
  const corner = (pos: React.CSSProperties, rot: number) => <div style={{ position: 'absolute', width: arm, height: arm, borderTop: `8px solid ${color}`, borderLeft: `8px solid ${color}`, transform: `rotate(${rot}deg)`, opacity: clamp01(k * 2), ...pos }} />;
  return <div style={{ position: 'relative', width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    {corner({ left: -off - 20, top: -off - 20 }, 0)}{corner({ right: -off - 20, bottom: -off - 20 }, 180)}
    <div style={{ opacity: prog(t, at + 0.25, 0.4) }}>{children}</div>
  </div>;
};

/** Y14 手绘圈重点：一个不太圆的手绘椭圆绕着一个词画一圈半。 */
export const HandCircle: React.FC<{ children: React.ReactNode; at: number; w: number; h: number; color?: string; dur?: number }> = ({ children, at, w, h, color = CORAL, dur = 0.7 }) => {
  const t = useT(), p = inOut((t - at) / dur), N = 90, pts: string[] = [];
  for (let i = 0; i <= N * p; i++) { const a = (i / N) * Math.PI * 2.3 - 2.2, r = 1 + 0.06 * Math.sin(i * 0.31) + (i / N) * 0.07; pts.push(`${w / 2 + Math.cos(a) * (w / 2 + 24) * r},${h / 2 + Math.sin(a) * (h / 2 + 20) * r * 0.97 + (i / N) * 8}`); }
  return <div style={{ position: 'relative', width: w, height: h, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}<svg width={w + 160} height={h + 140} viewBox={`-80 -70 ${w + 160} ${h + 140}`} style={{ position: 'absolute', left: -80, top: -70, overflow: 'visible' }}><polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" /></svg></div>;
};

/** Y15 墨迹下划线：一道两头细中间粗的笔刷线从左刷到右，末尾甩出一点墨。 */
export const InkUnderline: React.FC<{ children: React.ReactNode; at: number; w: number; color?: string; dur?: number }> = ({ children, at, w, color = LIME, dur = 0.5 }) => {
  const t = useT(), p = inOut((t - at) / dur), x = w * p, th = 14;
  const d = `M0 ${th} Q ${x * 0.3} ${th * 0.2}, ${x * 0.5} ${th * 0.7} T ${x} ${th * 0.9} L ${x} ${th * 1.5} Q ${x * 0.6} ${th * 2.3}, 0 ${th * 1.6} Z`;
  return <div style={{ display: 'inline-block', position: 'relative' }}>{children}<svg width={w + 60} height={th * 3} style={{ position: 'absolute', left: 0, bottom: -th * 2.2, overflow: 'visible' }}><path d={d} fill={color} />{p > 0.98 && <circle cx={w + 26} cy={th * 1.2} r={6 * prog(t, at + dur, 0.2)} fill={color} />}</svg></div>;
};

/** Y16 准星咬合：一个大准星从屏幕外飞来，旋转缩小，咬合到目标上并闪一下，旁边弹出标签。 */
export const ReticleLock: React.FC<{ x: number; y: number; at: number; label?: string; size?: number; color?: string }> = ({ x, y, at, label, size = 160, color = CORAL }) => {
  const t = useT(), p = inOut((t - at) / 0.6), s = mix(3, 1, p), rot = mix(-140, 0, p), lock = t > at + 0.6, flash = lock ? 1 - prog(t, at + 0.6, 0.25) : 0;
  return <div style={{ position: 'absolute', left: x - size / 2, top: y - size / 2, width: size, height: size, pointerEvents: 'none' }}>
    <svg width={size} height={size} style={{ transform: `scale(${s}) rotate(${rot}deg)`, opacity: clamp01(p * 3), overflow: 'visible' }}>
      <circle cx={size / 2} cy={size / 2} r={size * 0.4} fill="none" stroke={color} strokeWidth={5} strokeDasharray={`${size * 0.5} ${size * 0.13}`} />
      {[0, 90, 180, 270].map((a) => <line key={a} x1={size / 2} y1={size * 0.02} x2={size / 2} y2={size * 0.24} stroke={color} strokeWidth={6} transform={`rotate(${a} ${size / 2} ${size / 2})`} />)}
      <circle cx={size / 2} cy={size / 2} r={6} fill={color} />
      <circle cx={size / 2} cy={size / 2} r={size * 0.4 + flash * 40} fill="none" stroke="#fff" strokeWidth={4} opacity={flash} />
    </svg>
    {label && <div style={{ position: 'absolute', left: size * 0.95, top: -size * 0.1, fontFamily: MONO, fontSize: 30, fontWeight: 700, color: '#0B0E14', background: color, padding: '6px 16px', whiteSpace: 'nowrap', transform: `scaleX(${prog(t, at + 0.65, 0.25)})`, transformOrigin: 'left' }}>{label}</div>}
  </div>;
};

/** Y17 扫描线逐处点名：一条亮线从上往下扫一张图，扫过每个标记点时那里亮框加编号和说明。 */
export const ScanAnnotate: React.FC<{ children: React.ReactNode; w: number; h: number; at: number; dur?: number; marks: { x: number; y: number; w: number; h: number; text: string }[]; color?: string }> = ({ children, w, h, at, dur = 3, marks, color = LIME }) => {
  const t = useT(), sy = inOut((t - at) / dur) * h;
  return <div style={{ position: 'relative', width: w, height: h }}>
    {children}
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,8,12,.35)' }} />
    {marks.map((m, i) => { const hitT = at + dur * (m.y + m.h / 2) / h, k = sp(t, hitT, 260, 16); return t < hitT ? null : <div key={i} style={{ position: 'absolute', left: m.x, top: m.y, width: m.w, height: m.h, border: `4px solid ${color}`, boxShadow: `0 0 24px ${color}88`, transform: `scale(${mix(1.3, 1, k)})`, opacity: clamp01(k * 2) }}>
      <div style={{ position: 'absolute', left: -4, top: -46, display: 'flex', gap: 8, whiteSpace: 'nowrap' }}><span style={{ fontFamily: MONO, fontWeight: 700, fontSize: 26, background: color, color: '#0B0E14', padding: '2px 10px' }}>{String(i + 1).padStart(2, '0')}</span><span style={{ fontFamily: FONT, fontWeight: 700, fontSize: 28, color: '#fff', background: 'rgba(0,0,0,.75)', padding: '2px 12px' }}>{m.text}</span></div></div>; })}
    {t >= at && t <= at + dur + 0.2 && <div style={{ position: 'absolute', left: -10, right: -10, top: sy, height: 4, background: color, boxShadow: `0 0 30px 6px ${color}`, opacity: 1 - prog(t, at + dur, 0.2) }} />}
  </div>;
};

/** Y18 手绘圈注箭头：在素材上画一个潦草的圈和一支弯箭头，箭头尾巴带一句手写体批注。 */
export const ScribbleNote: React.FC<{ x: number; y: number; r?: number; at: number; note: string; dx?: number; dy?: number; color?: string }> = ({ x, y, r = 90, at, note, dx = 260, dy = -180, color = CORAL }) => {
  const t = useT(), c = inOut((t - at) / 0.5), a = inOut((t - at - 0.45) / 0.4), N = 60, pts: string[] = [];
  for (let i = 0; i <= N * c; i++) { const q = (i / N) * Math.PI * 2.15 + 0.6, rr = r * (1 + 0.08 * Math.sin(i * 0.5)); pts.push(`${x + Math.cos(q) * rr * 1.25},${y + Math.sin(q) * rr * 0.85}`); }
  const sx = x + r * 1.15, sy = y - r * 0.5, ex = x + dx, ey = y + dy, mx = (sx + ex) / 2 + 60, my = (sy + ey) / 2 + 40, len = 600;
  return <AbsoluteFill style={{ pointerEvents: 'none' }}><svg width="100%" height="100%" style={{ position: 'absolute', overflow: 'visible' }}>
    <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" />
    <path d={`M${ex} ${ey} Q${mx} ${my} ${sx} ${sy}`} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - a)} />
    {a > 0.95 && <path d={`M${sx + 26} ${sy - 4} L${sx} ${sy} L${sx + 10} ${sy - 26}`} fill="none" stroke={color} strokeWidth={7} strokeLinecap="round" />}
  </svg><div style={{ position: 'absolute', left: ex - 20, top: ey - 74, fontFamily: '"Ma Shan Zheng", "ZCOOL KuaiLe", ' + FONT, fontSize: 52, fontWeight: 700, color, transform: `rotate(-6deg) scale(${sp(t, at + 0.8, 260, 13)})`, transformOrigin: 'left bottom', whiteSpace: 'nowrap' }}>{note}</div></AbsoluteFill>;
};

// ---------- 人物互动 ----------
/** Y19 人后大字视差：巨大的字放在人物后面（前景是抠好的人或任何前景），字和人以不同速度移动，出层次。 */
export const BehindText: React.FC<{ text: string; at: number; w?: number; h?: number; size?: number; color?: string; bg?: React.ReactNode; fg?: React.ReactNode }> = ({ text, at, w = 1920, h = 1080, size = 420, color = LIME, bg, fg }) => {
  const t = useT(), k = sp(t, at, 120, 18), drift = (t - at) * 18;
  return <div style={{ position: 'relative', width: w, height: h, overflow: 'hidden', background: '#0B0E14' }}>
    {bg}
    <div style={{ position: 'absolute', left: 0, right: 0, top: h * 0.12, textAlign: 'center', fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1, color, letterSpacing: '-.04em', whiteSpace: 'nowrap', transform: `translateX(${-drift}px) translateY(${(1 - k) * 200}px) scale(${mix(1.3, 1, k)})`, opacity: clamp01(k * 2) }}>{text}</div>
    <div style={{ position: 'absolute', inset: 0, transform: `translateX(${drift * 0.4}px) scale(${mix(1.08, 1, k)})`, transformOrigin: '50% 100%' }}>{fg}</div>
  </div>;
};
