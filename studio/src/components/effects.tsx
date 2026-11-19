// 画面效果：套在任意内容外面的一层处理（模糊、调色、发光、暗角、光照、颗粒、扭曲……），每个都带一个「从没有到有」的过程。
// 运动手感：把 kit/motion.ts 里的弹簧、惯性、振荡、噪声、跟随包成可以直接套的外壳。
import React from 'react';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';
import { dampedFollow, inertia, noise, oscillate, spring, springFollow } from '../kit/motion';

const cl = (v: number) => Math.max(0, Math.min(1, v));
const useUid = () => 'u' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
type Kids = { children: React.ReactNode };
const wrap: React.CSSProperties = { position: 'relative', display: 'inline-block' }, cover: React.CSSProperties = { position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 'inherit' };

/** 焦点转换：画面从虚到实（或从实到虚）。开场对焦、把注意力从背景转到前景。 */
export const FocusPull: React.FC<Kids & { at: number; from?: number; to?: number; dur?: number }> = ({ children, at, from = 18, to = 0, dur = 0.9 }) => { const p = inOut((useT() - at) / dur); return <div style={{ ...wrap, filter: `blur(${mix(from, to, p)}px)`, transform: `scale(${mix(1.04, 1, p)})` }}>{children}</div>; };
/** 磨砂玻璃板：一块半透明的毛玻璃盖在画面上，后面的画面被模糊，上面可以放字。实拍上压字幕板最干净的做法。 */
export const GlassPanel: React.FC<Kids & { at: number; radius?: number; tint?: string; style?: React.CSSProperties }> = ({ children, at, radius = 18, tint = 'rgba(20,24,32,.45)', style }) => { const p = prog(useT(), at, 0.5); return <div style={{ backdropFilter: `blur(${radius * p}px) saturate(1.3)`, WebkitBackdropFilter: `blur(${radius * p}px) saturate(1.3)`, background: tint, border: '1.5px solid rgba(255,255,255,.22)', borderRadius: 24, opacity: p, transform: `translateY(${mix(30, 0, p)}px)`, ...style }}>{children}</div>; };
/** 调色：画面逐渐变成另一种色调（做旧、冷调、黑白、高饱和）。回忆段、情绪转折。 */
export const ColorGrade: React.FC<Kids & { at: number; dur?: number; hue?: number; saturate?: number; contrast?: number; brightness?: number; sepia?: number; gray?: number }> = ({ children, at, dur = 0.8, hue = 0, saturate = 1, contrast = 1, brightness = 1, sepia = 0, gray = 0 }) => { const p = inOut((useT() - at) / dur); return <div style={{ ...wrap, filter: `hue-rotate(${hue * p}deg) saturate(${mix(1, saturate, p)}) contrast(${mix(1, contrast, p)}) brightness(${mix(1, brightness, p)}) sepia(${sepia * p}) grayscale(${gray * p})` }}>{children}</div>; };
/** 浮起：卡片或商品从平贴变成浮起来，底下长出影子。强调「就是这一张」。 */
export const Lift: React.FC<Kids & { at: number; height?: number; color?: string }> = ({ children, at, height = 26, color = 'rgba(0,0,0,.6)' }) => { const p = prog(useT(), at, 0.5); return <div style={{ ...wrap, transform: `translateY(${-height * 0.5 * p}px) scale(${1 + 0.035 * p})`, filter: `drop-shadow(0 ${height * p}px ${height * 1.4 * p}px ${color})` }}>{children}</div>; };
/** 压印：内容像被按进去一样，边缘出现向内的阴影。做凹槽、按下的按钮、厚度感。 */
export const Emboss: React.FC<Kids & { at: number; depth?: number; color?: string; radius?: number }> = ({ children, at, depth = 16, color = 'rgba(8,6,20,.85)', radius = 20 }) => { const p = prog(useT(), at, 0.5); return <div style={{ ...wrap, borderRadius: radius, overflow: 'hidden', transform: `scale(${1 - 0.02 * p})` }}>{children}<div style={{ ...cover, boxShadow: `inset 0 ${depth * 0.6 * p}px ${depth * 1.4 * p}px ${depth * 0.4 * p}px ${color}` }} /></div>; };
/** 发光：内容外面一圈光，可以一呼一吸。标记焦点、提示「看这里」。 */
export const GlowPulse: React.FC<Kids & { at: number; color?: string; size?: number; pulse?: boolean }> = ({ children, at, color = '#FFF17A', size = 30, pulse = true }) => { const t = useT(), p = prog(t, at, 0.5), k = pulse ? oscillate(t - at, { offset: 0.8, amplitude: 0.2, frequency: 0.7 }) : 1; return <div style={{ ...wrap, filter: `drop-shadow(0 0 ${size * p * k}px ${color}) drop-shadow(0 0 ${size * 0.35 * p * k}px ${color})` }}>{children}</div>; };
/** 混合叠印：内容和后面的画面按一种混合方式叠在一起（差值、滤色、正片叠底……）。做双重曝光、撞色。 */
export const BlendLayer: React.FC<Kids & { at: number; mode?: React.CSSProperties['mixBlendMode']; style?: React.CSSProperties }> = ({ children, at, mode = 'difference', style }) => { const p = prog(useT(), at, 0.5); return <div style={{ mixBlendMode: mode, opacity: p, ...style }}>{children}</div>; };
/** 渐隐显露：内容从一侧带着柔和的边缘慢慢显出来。比硬擦除柔和，适合图片和长文字。 */
export const MaskWipe: React.FC<Kids & { at: number; dur?: number; dir?: 'right' | 'left' | 'down' | 'up'; soft?: number }> = ({ children, at, dur = 1, dir = 'right', soft = 30 }) => { const p = inOut((useT() - at) / dur), e = mix(-soft, 100 + soft, p), ang = { right: 90, left: 270, down: 180, up: 0 }[dir], m = `linear-gradient(${ang}deg, #000 ${e - soft}%, transparent ${e}%)`; return <div style={{ ...wrap, WebkitMaskImage: m, maskImage: m }}>{children}</div>; };
/** 染色：一层渐变色盖上来，把画面压暗或染成一种氛围。给实拍压一块能放字的暗区。 */
export const Tint: React.FC<Kids & { at: number; gradient?: string; dur?: number }> = ({ children, at, gradient = 'linear-gradient(32deg, #181130 0%, rgba(173,57,108,.67) 38%, transparent 80%)', dur = 0.7 }) => { const p = prog(useT(), at, dur); return <div style={wrap}>{children}<div style={{ ...cover, background: gradient, opacity: p }} /></div>; };
/** 暗角：四周暗下去，视线自然落到中间。 */
export const Vignette: React.FC<Kids & { at: number; size?: number; color?: string }> = ({ children, at, size = 35, color = 'rgba(8,6,16,.95)' }) => { const p = prog(useT(), at, 0.8); return <div style={wrap}>{children}<div style={{ ...cover, background: `radial-gradient(ellipse at 50% 50%, transparent ${mix(100, size, p)}%, ${color} ${mix(160, size + 55, p)}%)` }} /></div>; };
/** 聚光：四周压暗，一束光打在画面上的某一处，还可以从一处移到另一处。在一张图上依次指给观众看。 */
export const Spotlight: React.FC<Kids & { at: number; stops: { x: number; y: number; at: number }[]; radius?: number; dim?: number; color?: string }> = ({ children, at, stops, radius = 22, dim = 0.72, color = 'rgba(255,239,170,.35)' }) => {
  const t = useT(), p = prog(t, at, 0.6); let x = stops[0].x, y = stops[0].y; stops.slice(1).forEach((s) => { const k = inOut((t - s.at) / 0.8); x = mix(x, s.x, k); y = mix(y, s.y, k); });
  return <div style={wrap}>{children}<div style={{ ...cover, background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, transparent ${radius * 0.6}%, rgba(0,0,0,${dim * p}) ${radius * 1.5}%)` }} /><div style={{ ...cover, background: `radial-gradient(circle at ${x * 100}% ${y * 100}%, ${color} 0%, transparent ${radius}%)`, mixBlendMode: 'screen', opacity: p }} /></div>;
};
/** 颗粒：一层会动的胶片颗粒。让过于干净的图形和截图有点质感。 */
export const Grain: React.FC<Kids & { at: number; amount?: number; frequency?: number }> = ({ children, at, amount = 0.5, frequency = 0.8 }) => { const t = useT(), id = useUid(), p = prog(t, at, 0.5); return <div style={wrap}>{children}<svg style={{ ...cover, width: '100%', height: '100%', mixBlendMode: 'overlay', opacity: amount * p }}><filter id={id}><feTurbulence type="fractalNoise" baseFrequency={frequency} numOctaves={2} seed={Math.floor(t * 30)} /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter={`url(#${id})`} /></svg></div>; };
/** 纹理叠印：一层网格、横线、点阵或纸纹叠在内容上。做图纸感、印刷感。 */
export const TextureOverlay: React.FC<Kids & { at: number; kind?: 'grid' | 'lines' | 'dots' | 'paper'; size?: number; blend?: React.CSSProperties['mixBlendMode']; color?: string }> = ({ children, at, kind = 'grid', size = 24, blend = 'multiply', color = 'rgba(20,24,40,.55)' }) => {
  const p = prog(useT(), at, 0.6), id = useUid(), bg = kind === 'grid' ? `linear-gradient(${color} 2px, transparent 2px), linear-gradient(90deg, ${color} 2px, transparent 2px)` : kind === 'lines' ? `repeating-linear-gradient(0deg, ${color} 0 2px, transparent 2px ${size}px)` : `radial-gradient(${color} 22%, transparent 24%)`;
  return <div style={wrap}>{children}{kind === 'paper' ? <svg style={{ ...cover, width: '100%', height: '100%', mixBlendMode: blend, opacity: 0.6 * p }}><filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.04 0.6" numOctaves={3} seed={3} /><feColorMatrix type="saturate" values="0" /></filter><rect width="100%" height="100%" filter={`url(#${id})`} /></svg> : <div style={{ ...cover, backgroundImage: bg, backgroundSize: `${size}px ${size}px`, mixBlendMode: blend, opacity: p }} />}</div>;
};
/** 热浪扭曲：画面像隔着热气或水面一样晃起来，再恢复。做「晕了」「回忆」或一次形变转场。 */
export const HeatWave: React.FC<Kids & { at: number; dur?: number; scale?: number; frequency?: number; hold?: boolean }> = ({ children, at, dur = 1.6, scale = 40, frequency = 0.012, hold }) => {
  const t = useT(), id = useUid(), e = cl((t - at) / dur), k = hold ? inOut(e * 2) : Math.sin(e * Math.PI);
  return <div style={wrap}><svg width={0} height={0} style={{ position: 'absolute' }}><filter id={id} x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency={`${frequency} ${frequency * 1.6}`} numOctaves={1} seed={3 + Math.floor(t * 4)} result="n" /><feDisplacementMap in="SourceGraphic" in2="n" scale={scale * k} xChannelSelector="R" yChannelSelector="G" /></filter></svg><div style={{ filter: k > 0.001 ? `url(#${id})` : undefined }}>{children}</div></div>;
};
/** 描边装裱：一圈边框沿着内容的四边画出来。把一张图、一个数字「框」起来。 */
export const PictureFrame: React.FC<Kids & { at: number; width?: number; color?: string; gap?: number; dur?: number }> = ({ children, at, width = 8, color = '#FFF17A', gap = 14, dur = 0.9 }) => { const p = inOut((useT() - at) / dur); return <div style={{ ...wrap, padding: gap + width }}>{children}<svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}><rect x={width / 2} y={width / 2} width={`calc(100% - ${width}px)`} height={`calc(100% - ${width}px)`} fill="none" stroke={color} strokeWidth={width} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p} /></svg></div>; };

/** 弹簧弹入：内容带着回弹冲进来（放大、上移或侧移）。重点数字、小卡片入场。 */
export const SpringIn: React.FC<Kids & { at: number; kind?: 'scale' | 'up' | 'left' | 'right'; stiffness?: number; damping?: number; distance?: number }> = ({ children, at, kind = 'scale', stiffness = 125, damping = 8, distance = 260 }) => { const t = useT(), v = spring(t - at, { from: 0, to: 1, stiffness, damping }), tf = kind === 'scale' ? `scale(${Math.max(0, v)})` : kind === 'up' ? `translateY(${(1 - v) * distance}px)` : `translateX(${(1 - v) * distance * (kind === 'left' ? -1 : 1)}px)`; return <div style={{ ...wrap, transform: tf, opacity: t < at ? 0 : cl((t - at) * 8) }}>{children}</div>; };
/** 惯性滑入：内容快速滑进来，越来越慢，自然停住。比匀速或普通缓动更像真东西。 */
export const InertiaSlide: React.FC<Kids & { at: number; velocity?: number; friction?: number; dir?: 'left' | 'right' | 'up' | 'down' }> = ({ children, at, velocity = 1800, friction = 3, dir = 'left' }) => { const t = useT(), rest = velocity / friction, d = inertia(t - at, { velocity, friction }) - rest, tf = dir === 'left' ? `translateX(${d}px)` : dir === 'right' ? `translateX(${-d}px)` : dir === 'up' ? `translateY(${-d}px)` : `translateY(${d}px)`; return <div style={{ ...wrap, transform: tf, opacity: t < at ? 0 : cl((t - at) * 6) }}>{children}</div>; };
/** 呼吸：内容停在那里时轻轻地一大一小、一上一下或一明一暗。让静止的东西不死。 */
export const Breathe: React.FC<Kids & { at?: number; kind?: 'scale' | 'y' | 'rotate' | 'opacity'; amplitude?: number; frequency?: number }> = ({ children, at = 0, kind = 'scale', amplitude, frequency = 0.5 }) => { const t = useT(), a = amplitude ?? { scale: 0.05, y: 14, rotate: 3, opacity: 0.3 }[kind], v = oscillate(Math.max(0, t - at), { amplitude: a, frequency }); return <div style={{ ...wrap, transform: kind === 'scale' ? `scale(${1 + v})` : kind === 'y' ? `translateY(${v}px)` : kind === 'rotate' ? `rotate(${v}deg)` : undefined, opacity: kind === 'opacity' ? 1 - a + v : 1 }}>{children}</div>; };
/** 漂浮：内容没有规律地轻轻飘动和微转，像手持或悬浮。同一个 seed 每次渲染都一样。 */
export const Drift: React.FC<Kids & { amplitude?: number; frequency?: number; rotate?: number; seed?: number | string }> = ({ children, amplitude = 16, frequency = 0.5, rotate = 1.5, seed = 1 }) => { const t = useT(), s = typeof seed === 'number' ? seed : seed.length; return <div style={{ ...wrap, transform: `translate(${noise(t, { amplitude, frequency, seed: s })}px, ${noise(t, { amplitude, frequency, seed: s + 17 })}px) rotate(${noise(t, { amplitude: rotate, frequency: frequency * 0.8, seed: s + 41 })}deg)` }}>{children}</div>; };
/** 跟随：一个标签或光标追着会移动的目标走。阻尼式稳稳跟上，弹簧式会冲过头再回来。 */
export const Follow: React.FC<Kids & { target: (time: number) => [number, number]; since: number; kind?: 'damped' | 'spring'; showTarget?: boolean; width?: number; height?: number }> = ({ children, target, since, kind = 'damped', showTarget, width = 1400, height = 560 }) => {
  const t = useT(), f = kind === 'damped' ? dampedFollow : springFollow, x = f(t, (q) => target(q)[0], { since }), y = f(t, (q) => target(q)[1], { since }), [tx, ty] = target(t);
  return <div style={{ position: 'relative', width, height }}>{showTarget && <div style={{ position: 'absolute', left: tx - 26, top: ty - 26, width: 52, height: 52, borderRadius: 26, border: `5px dashed ${C.text}`, boxSizing: 'border-box' }} />}<div style={{ position: 'absolute', left: x, top: y, transform: 'translate(-50%, -50%)' }}>{children}</div></div>;
};
/** 手感曲线：把一个运动函数画成曲线，一个点沿着曲线走，旁边一个小球按它动。教学或选手感时用。 */
export const MotionGraph: React.FC<{ title: string; note?: string; value: (time: number) => number; range: [number, number]; span?: number; at: number; width?: number }> = ({ title, note, value, range, span = 3, at, width = 620 }) => {
  const t = useT(), h = 220, e = cl((t - at) / span), X = (s: number) => (s / span) * width, Y = (v: number) => h - 20 - ((v - range[0]) / (range[1] - range[0])) * (h - 40), d = Array.from({ length: 121 }).map((_, i) => { const s = (i / 120) * span; return `${i ? 'L' : 'M'}${X(s)} ${Y(value(s))}`; }).join(' '), cur = value(e * span);
  return (
    <div style={{ width, fontFamily: FONT, opacity: prog(t, at - 0.3, 0.3) }}>
      <div style={{ fontSize: 38, fontWeight: 900, color: C.text }}>{title}</div>{note && <div style={{ fontSize: 24, color: C.muted, marginBottom: 8 }}>{note}</div>}
      <svg width={width} height={h} style={{ background: 'rgba(255,255,255,.04)', borderRadius: 12, overflow: 'visible' }}><line x1={0} x2={width} y1={h / 2} y2={h / 2} stroke={C.line} /><path d={d} fill="none" stroke="#BFE9D0" strokeWidth={4} /><line x1={X(e * span)} x2={X(e * span)} y1={0} y2={h} stroke={C.warm} strokeWidth={2} /><circle cx={X(e * span)} cy={Y(cur)} r={10} fill={C.warm} /></svg>
      <div style={{ position: 'relative', height: 56, marginTop: 12 }}><div style={{ position: 'absolute', left: ((cur - range[0]) / (range[1] - range[0])) * (width - 44), top: 6, width: 44, height: 44, borderRadius: 22, background: C.accent }} /></div>
    </div>
  );
};
