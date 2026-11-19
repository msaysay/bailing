// 炫技动效（上）：偏「科技感、过程感」的大动效，用在开场、转折和解释原理的段落。全部由当前帧决定画面，随机数都是固定种子。
import React from 'react';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';

export const MONO = '"JetBrains Mono", "DejaVu Sans Mono", "Noto Sans Mono", Menlo, monospace';
const cl = (v: number) => Math.max(0, Math.min(1, v));
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const useUid = () => 'u' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
type P3 = [number, number, number];
const fib = (n: number): P3[] => Array.from({ length: n }).map((_, i) => { const y = 1 - (2 * (i + 0.5)) / n, r = Math.sqrt(1 - y * y), th = i * 2.399963; return [r * Math.cos(th), y, r * Math.sin(th)]; });
const rot = ([x, y, z]: P3, ay: number, ax: number): P3 => { const x1 = x * Math.cos(ay) + z * Math.sin(ay), z1 = -x * Math.sin(ay) + z * Math.cos(ay); return [x1, y * Math.cos(ax) - z1 * Math.sin(ax), y * Math.sin(ax) + z1 * Math.cos(ax)]; };

/** 文字拆词元：一句话先打出来，再碎成一格格词块，词块里的字又乱码成数字。解释「AI 是怎么读一句话的」。 */
export const TokenSplit: React.FC<{ text: string; tokens: string[]; ids?: string[]; at: number; splitAt: number; idAt: number; cols?: number; hot?: number[] }> = ({ text, tokens, ids, at, splitAt, idAt, cols = 4, hot = [] }) => {
  const t = useT(), n = Math.max(0, Math.min(text.length, Math.floor((t - at) * 18))), k = prog(t, splitAt, 0.5), cw = 330, ch = 120, g = 36, rows = Math.ceil(tokens.length / cols), W = cols * cw + (cols - 1) * g, H = rows * ch + (rows - 1) * g, step = Math.floor(t * 14), glyph = 'ｱｶｻﾀﾅﾊﾏﾔﾗ0123456789<>=/#';
  return (
    <div style={{ position: 'relative', width: Math.max(W, 1100), height: Math.max(H, 300), fontFamily: FONT }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 64, fontWeight: 600, color: C.text, opacity: 1 - cl(k * 2), transform: `scale(${mix(1, 1.08, k)})` }}>{text.slice(0, n)}<span style={{ width: 4, height: 68, background: '#FF6A2B', marginLeft: 6, opacity: Math.floor(t * 2) % 2 ? 0.2 : 1 }} /></div>
      <div style={{ position: 'absolute', left: '50%', top: '50%', width: W, height: H, marginLeft: -W / 2, marginTop: -H / 2 }}>
        {tokens.map((tk, i) => { const c = i % cols, r = Math.floor(i / cols), p = prog(t, splitAt + 0.1 + i * 0.05, 0.4), s = cl((t - idAt - i * 0.04) / 0.6), id = ids?.[i] ?? String(10000 + Math.floor(rnd(i + 3) * 89999)), me = hot.includes(i);
          const shown = s <= 0 ? tk : s >= 1 ? id : id.split('').map((d, j) => (rnd(i * 7 + j) < s ? d : glyph[Math.floor(rnd(step + i * 13 + j) * glyph.length)])).join('');
          return <div key={i} style={{ position: 'absolute', left: c * (cw + g), top: r * (ch + g), width: cw, height: ch, boxSizing: 'border-box', border: `2px solid ${me ? '#FF6A2B' : C.line}`, background: me ? 'rgba(255,106,43,.14)' : 'rgba(255,255,255,.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: s > 0 ? MONO : FONT, fontSize: 58, color: me ? '#FF9A6B' : C.text, opacity: p, transform: `translate(${mix((1.5 - c) * 40, 0, p)}px, ${mix((1 - r) * 30, 0, p)}px) scale(${mix(0.6, 1, p)})` }}>{shown}</div>; })}
      </div>
    </div>
  );
};
/** 线框球：一个由点和连线组成的球慢慢转。做开场、背景，或代表「模型」「网络」。 */
export const WireSphere: React.FC<{ at: number; size?: number; points?: number; color?: string; speed?: number }> = ({ at, size = 560, points = 46, color = C.text, speed = 0.5 }) => {
  const t = useT(), p = prog(t, at, 0.9), base = React.useMemo(() => fib(points), [points]);
  const edges = React.useMemo(() => { const e: [number, number][] = []; base.forEach((a, i) => { base.map((b, j) => [j, (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2] as [number, number]).filter(([j]) => j !== i).sort((x, y) => x[1] - y[1]).slice(0, 4).forEach(([j]) => { if (i < j) e.push([i, j]); }); }); return e; }, [base]);
  const R = (size / 2 - 20) * mix(0.4, 1, p), pts = base.map((q) => rot(q, t * speed, 0.45)), X = (q: P3) => size / 2 + q[0] * R, Y = (q: P3) => size / 2 + q[1] * R;
  return <svg width={size} height={size} style={{ opacity: p }}>{edges.map(([a, b], i) => <line key={i} x1={X(pts[a])} y1={Y(pts[a])} x2={X(pts[b])} y2={Y(pts[b])} stroke={color} strokeWidth={1.5} opacity={0.12 + 0.4 * cl((pts[a][2] + pts[b][2]) / 2 + 0.5)} />)}{pts.map((q, i) => <circle key={i} cx={X(q)} cy={Y(q)} r={2 + 2.2 * cl(q[2] + 0.4)} fill={color} opacity={0.25 + 0.75 * cl(q[2] + 0.5)} />)}</svg>;
};
/** 代码球：几百条代码片段聚成一个发光的球在转。代表「一大堆代码」「模型的知识」。 */
export const TextSphere: React.FC<{ snippets: string[]; at: number; size?: number; count?: number; color?: string; speed?: number }> = ({ snippets, at, size = 640, count = 240, color = '#E8C98A', speed = 0.35 }) => {
  const t = useT(), p = prog(t, at, 1.4), base = React.useMemo(() => fib(count), [count]), R = (size / 2 - 30) * mix(2.4, 1, p);
  return (
    <div style={{ position: 'relative', width: size, height: size, opacity: cl(p * 1.5) }}>
      <div style={{ position: 'absolute', left: size / 2 - 130, top: size / 2 - 130, width: 260, height: 260, borderRadius: 130, background: 'radial-gradient(circle, #FFF3D0 0%, #FFB45A 14%, rgba(255,160,60,.25) 40%, transparent 70%)', opacity: p }} />
      {base.map((q, i) => { const [x, y, z] = rot(q, t * speed + 1, 0.3), sc = 0.7 + 0.5 * (z + 1) / 2;
        return <div key={i} style={{ position: 'absolute', left: size / 2 + x * R, top: size / 2 + y * R, transform: `translate(-50%, -50%) scale(${sc})`, fontFamily: MONO, fontSize: 13, color, opacity: z > 0 ? 0.35 + 0.65 * z : 0.12 + 0.2 * (z + 1), whiteSpace: 'nowrap', zIndex: z > 0 ? 2 : 0 }}>{snippets[i % snippets.length]}</div>; })}
    </div>
  );
};
/** 单元阵列：一面带刻度边框的格子阵列，其中几格亮起来、其余暗下去。代表「模型内部在挑选」「从很多里激活几个」。 */
export const NeuralGrid: React.FC<{ cols?: number; rows?: number; hot: number[]; at: number; hotAt: number; cell?: number }> = ({ cols = 8, rows = 4, hot, at, hotAt, cell = 150 }) => {
  const t = useT(), ch = cell * 0.74, g = 14, W = cols * cell + (cols - 1) * g, H = rows * ch + (rows - 1) * g, k = prog(t, hotAt, 0.7), a = prog(t, at, 0.6);
  return (
    <div style={{ position: 'relative', width: W + 80, height: H + 80, opacity: a }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: 30, border: `2px solid ${C.line}`, boxShadow: 'inset 0 0 60px rgba(255,255,255,.05)' }} />
      {[0, 1].map((s) => <div key={s} style={{ position: 'absolute', left: 30, right: 30, [s ? 'bottom' : 'top']: -14, height: 12, background: `repeating-linear-gradient(90deg, ${C.muted} 0 2px, transparent 2px 9px)`, opacity: 0.5 } as React.CSSProperties} />)}
      {Array.from({ length: cols * rows }).map((_, i) => { const c = i % cols, r = Math.floor(i / cols), me = hot.includes(i), p = prog(t, at + (c + r) * 0.05, 0.4), cxx = cell * (0.3 + rnd(i) * 0.4), cyy = ch * (0.3 + rnd(i + 50) * 0.4), col = me ? mixCol(k) : C.text;
        return <div key={i} style={{ position: 'absolute', left: 40 + c * (cell + g), top: 40 + r * (ch + g), width: cell, height: ch, border: `1.5px solid ${me && k > 0 ? `rgba(255,154,90,${0.3 + 0.7 * k})` : 'rgba(255,255,255,.14)'}`, boxSizing: 'border-box', opacity: p * (me ? 1 : mix(1, 0.25, k)), transform: `scale(${me ? mix(1, 1.08, k) : 1})`, boxShadow: me ? `0 0 ${50 * k}px rgba(255,130,60,${0.45 * k})` : 'none' }}>
          <svg width={cell} height={ch}>{Array.from({ length: 16 }).map((__, j) => { const ang = rnd(i * 31 + j) * Math.PI * 2, len = (0.25 + rnd(i * 17 + j) * 0.5) * cell * 0.5; return <line key={j} x1={cxx} y1={cyy} x2={cxx + Math.cos(ang) * len} y2={cyy + Math.sin(ang) * len * 0.74} stroke={col} strokeWidth={1} opacity={me ? 0.35 + 0.5 * k : 0.28} />; })}<circle cx={cxx} cy={cyy} r={me ? 3 + 4 * k : 2.5} fill={col} /></svg>
        </div>; })}
    </div>
  );
};
const mixCol = (k: number) => `rgb(${Math.round(mix(243, 255, k))},${Math.round(mix(241, 150, k))},${Math.round(mix(234, 80, k))})`;
/** 故障字：字带着红青错位一跳一跳地抖。用在「出错了」「不对劲」的那一下。 */
export const GlitchText: React.FC<{ text: string; at: number; size?: number; color?: string; calm?: boolean }> = ({ text, at, size = 200, color = '#FF5D7A', calm }) => {
  const t = useT(), step = Math.floor(t * 12), burst = !calm && rnd(step + 9) > 0.4, dx = (rnd(step) - 0.5) * size * (burst ? 0.16 : 0.03), dy = (rnd(step + 4) - 0.5) * size * (burst ? 0.06 : 0.01), a = t < at ? 0 : 1, y0 = rnd(step + 2) * 70, base: React.CSSProperties = { position: 'absolute', left: 0, top: 0, fontFamily: FONT, fontSize: size, fontWeight: 900, lineHeight: 1.1, whiteSpace: 'nowrap' };
  return (
    <div style={{ position: 'relative', display: 'inline-block', opacity: a, transform: `scale(${mix(1.6, 1, prog(t, at, 0.2))})` }}>
      <div style={{ ...base, position: 'relative', color }}>{text}</div>
      <div style={{ ...base, color: '#00E5FF', mixBlendMode: 'screen', transform: `translate(${dx}px, ${dy}px)`, opacity: 0.8 }}>{text}</div>
      <div style={{ ...base, color: '#FF2A2A', mixBlendMode: 'screen', transform: `translate(${-dx}px, ${-dy}px)`, opacity: 0.8 }}>{text}</div>
      {burst && <div style={{ ...base, color, clipPath: `inset(${y0}% 0 ${Math.max(0, 80 - y0)}% 0)`, transform: `translateX(${dx * 2.5}px)` }}>{text}</div>}
    </div>
  );
};
/** 流程报错：一串节点从左连到右，走到某一环变红、弹出报错条、画面发红抖动。讲「流程在这一步断了」。 */
export const PipelineError: React.FC<{ nodes: string[]; bad: number; error: string; at: number; errAt: number; width?: number }> = ({ nodes, bad, error, at, errAt, width = 1600 }) => {
  const t = useT(), n = nodes.length, bw = 150, gap = (width - n * bw) / (n - 1), k = prog(t, errAt, 0.3), e = t - errAt, sh = e > 0 ? Math.exp(-5 * e) * Math.sin(e * 60) * 10 : 0, H = 520;
  return (
    <div style={{ position: 'relative', width, height: H, fontFamily: FONT, transform: `translateX(${sh}px)` }}>
      <div style={{ position: 'absolute', inset: -40, background: 'radial-gradient(ellipse at 50% 50%, rgba(255,40,60,.22), transparent 70%)', opacity: k }} />
      <div style={{ position: 'absolute', left: 0, top: 0, fontFamily: MONO, fontSize: 30, color: C.text, opacity: k * (Math.floor(t * 2) % 2 ? 0.4 : 1), letterSpacing: 4 }}>▌▌ PAUSE</div>
      {nodes.map((x, i) => { const p = prog(t, at + i * 0.35, 0.4), me = i === bad, lp = cl((t - at - i * 0.35 - 0.15) / 0.3), dot = ((t * 0.9 + i * 0.3) % 1);
        return <React.Fragment key={i}>
          {i < n - 1 && <div style={{ position: 'absolute', left: i * (bw + gap) + bw + 14, top: 290, width: (gap - 28) * lp, height: 3, background: `repeating-linear-gradient(90deg, ${i >= bad - 1 && k > 0 && i <= bad ? '#FF5D7A' : '#FF8A3C'} 0 10px, transparent 10px 20px)` }}><div style={{ position: 'absolute', left: `${dot * 100}%`, top: -5, width: 13, height: 13, borderRadius: 7, background: '#FFB45A', opacity: lp >= 1 && (k === 0 || i < bad - 1) ? 1 : 0 }} /></div>}
          <div style={{ position: 'absolute', left: i * (bw + gap), top: 230, width: bw, height: 124, boxSizing: 'border-box', border: `2px solid ${me && k > 0 ? '#FF5D7A' : 'rgba(255,255,255,.3)'}`, background: me ? `rgba(255,60,90,${0.35 * k})` : 'rgba(255,255,255,.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, fontWeight: 600, color: me && k > 0 ? '#FFB3C0' : C.text, opacity: p, transform: `scale(${mix(0.7, 1, p) * (me ? 1 + 0.08 * k : 1)})`, boxShadow: me ? `0 0 ${60 * k}px rgba(255,60,90,.6)` : 'none' }}>{x}</div>
        </React.Fragment>; })}
      <div style={{ position: 'absolute', left: bad * (bw + gap) + bw / 2 - 380, top: 70, width: 760, height: 76, boxSizing: 'border-box', background: 'rgba(160,30,50,.75)', borderLeft: '8px solid #FF5D7A', display: 'flex', alignItems: 'center', gap: 22, padding: '0 28px', opacity: k, transform: `translateY(${mix(-40, 0, k)}px)` }}><span style={{ fontFamily: MONO, fontSize: 30, color: '#FFD0D8' }}>▲ ERROR</span><span style={{ fontSize: 38, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>{error}</span></div>
      <div style={{ position: 'absolute', left: 60, top: 20, opacity: cl((t - errAt - 0.5) * 4) }}><GlitchText text="?" at={errAt + 0.5} size={170} /></div>
      <div style={{ position: 'absolute', right: 60, top: 30, opacity: cl((t - errAt - 0.9) * 4) }}><GlitchText text="?" at={errAt + 0.9} size={150} /></div>
    </div>
  );
};
/** 老电视：一台显像管电视先是雪花，然后「啪」地亮出内容，带扫描线。做怀旧、回忆，或者把广告式内容装进去。 */
export const RetroTV: React.FC<{ children: React.ReactNode; at: number; onAt: number; width?: number }> = ({ children, at, onAt, width = 1000 }) => {
  const t = useT(), id = useUid(), p = prog(t, at, 0.6), h = width * 0.72, sw = width * 0.72, shh = h * 0.72, on = t - onAt, open = on < 0 ? 0 : cl(on / 0.25), frame = Math.floor(t * 30);
  return (
    <div style={{ position: 'relative', width, height: h + 40, opacity: p, transform: `scale(${mix(0.92, 1, p)})`, fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width, height: h, borderRadius: 46, background: 'linear-gradient(170deg, #C9C6BE, #8E8A82 60%, #6B675F)', boxShadow: '0 50px 120px rgba(0,0,0,.7), inset 0 4px 0 rgba(255,255,255,.5)' }} />
      <div style={{ position: 'absolute', left: width * 0.05, top: h * 0.1, width: sw + 28, height: shh + 28, borderRadius: 60, background: '#1A1917', boxShadow: 'inset 0 0 30px #000' }} />
      <div style={{ position: 'absolute', left: width * 0.05 + 14, top: h * 0.1 + 14, width: sw, height: shh, borderRadius: '48px / 56px', overflow: 'hidden', background: '#0A0A0A' }}>
        <svg width={sw} height={shh} style={{ position: 'absolute', inset: 0, opacity: on < 0 ? 0.9 : Math.max(0, 0.9 - on * 4) }}><filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={frame} /><feColorMatrix type="saturate" values="0" /></filter><rect width={sw} height={shh} filter={`url(#${id})`} /></svg>
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${(1 - open) * 50}% 0 ${(1 - open) * 50}% 0)`, filter: `brightness(${1 + Math.max(0, 1 - on * 3) * 1.5}) saturate(1.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
        <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, rgba(0,0,0,.28) 0 2px, transparent 2px 5px)' }} /><div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 30% 20%, rgba(255,255,255,.14), transparent 50%), radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.55))' }} />
      </div>
      <div style={{ position: 'absolute', right: width * 0.05, top: h * 0.14, width: width * 0.13 }}>{[0, 1].map((i) => <div key={i} style={{ width: width * 0.09, height: width * 0.09, borderRadius: '50%', margin: '0 auto 22px', background: 'radial-gradient(circle at 35% 30%, #E8E5DD, #6E6A62)', boxShadow: '0 4px 10px rgba(0,0,0,.5)' }} />)}{Array.from({ length: 7 }).map((_, i) => <div key={i} style={{ height: 6, borderRadius: 3, background: '#4A4741', marginBottom: 9 }} />)}</div>
      <div style={{ position: 'absolute', left: width * 0.12, right: width * 0.12, top: h - 6, height: 34, background: '#4A4741', borderRadius: '0 0 16px 16px' }} />
    </div>
  );
};
/** 立牌地面：一片向远处延伸的条纹地面上，一张张小牌子立起来。讲「支持很多种」「各种工具都能接」。 */
export const CardFloor: React.FC<{ cards: { label: string; color?: string }[]; at: number; width?: number; height?: number }> = ({ cards, at, width = 1600, height = 640 }) => {
  const t = useT(), a = prog(t, at, 0.8), cols = Math.ceil(cards.length / 3);
  return (
    <div style={{ position: 'relative', width, height, perspective: 900, perspectiveOrigin: '50% 20%', overflow: 'hidden', opacity: a, fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: -width * 0.4, bottom: -40, width: width * 1.8, height: 1700, transformOrigin: '50% 100%', transform: 'rotateX(68deg)', transformStyle: 'preserve-3d', backgroundImage: 'repeating-linear-gradient(90deg, rgba(0,0,0,.55) 0 3px, transparent 3px 240px), repeating-linear-gradient(0deg, #3A3F48 0 16px, #15181E 16px 44px)', backgroundPosition: `0 ${(t - at) * 40}px` }}>
        {cards.map((c, i) => { const col = i % cols, row = Math.floor(i / cols), p = prog(t, at + 0.6 + i * 0.12, 0.6), x = width * 1.0 * ((col + 0.5 + (row % 2) * 0.35) / (cols + 0.35)) + width * 0.35, y = 1700 - 330 - row * 380 - rnd(i) * 80;
          return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 340, height: 220, transformOrigin: '50% 100%', transform: `rotateX(${-86 * p}deg)`, background: '#0F1217', border: '3px solid #4A505C', borderRadius: 12, boxSizing: 'border-box', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: cl(p * 3) }}>
            <div style={{ width: 84, height: 84, borderRadius: 20, background: c.color ?? [C.accent, C.warm, '#3DD6C6', '#B48CFF', C.down, '#4ADE80'][i % 6] }} /><div style={{ fontSize: 40, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{c.label}</div></div>; })}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: height * 0.45, background: `linear-gradient(180deg, ${C.bg} 40%, transparent)` }} />
    </div>
  );
};
/** 合成波太阳：复古的条纹太阳加一片向前滚动的霓虹网格地面。做「复古」「八十年代」「夸张的宣传感」，上面可以再叠内容。 */
export const SynthSun: React.FC<{ at: number; width?: number; height?: number; children?: React.ReactNode }> = ({ at, width = 1600, height = 700, children }) => {
  const t = useT(), p = prog(t, at, 0.9), sun = height * 0.62, stops: string[] = ['#000 0%']; for (let i = 0; i < 7; i++) { const y = 46 + i * 7.6, th = 1 + i * 0.75; stops.push(`#000 ${y}%`, `transparent ${y}%`, `transparent ${y + th}%`, `#000 ${y + th}%`); }
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 24, background: 'linear-gradient(180deg, #12062B 0%, #2A0B4F 55%, #0B0418 56%)', fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: width / 2 - sun / 2, top: mix(height * 0.5, height * 0.06, p), width: sun, height: sun, borderRadius: '50%', background: 'linear-gradient(180deg, #FFD36B 0%, #FF7A59 45%, #FF3D9A 80%, #C13CFF 100%)', WebkitMaskImage: `linear-gradient(180deg, ${stops.join(', ')})`, maskImage: `linear-gradient(180deg, ${stops.join(', ')})`, filter: 'drop-shadow(0 0 60px rgba(255,90,150,.6))' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: height * 0.56, height: height * 0.44, perspective: 420, overflow: 'hidden' }}><div style={{ position: 'absolute', left: -width, right: -width, bottom: 0, height: height * 2.4, transformOrigin: '50% 100%', transform: 'rotateX(74deg)', backgroundImage: 'repeating-linear-gradient(90deg, rgba(255,60,200,.9) 0 3px, transparent 3px 120px), repeating-linear-gradient(0deg, rgba(255,60,200,.9) 0 3px, transparent 3px 120px)', backgroundPosition: `0 ${(t * 160) % 120}px` }} /><div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: '45%', background: 'linear-gradient(180deg, #0B0418, transparent)' }} /></div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: height * 0.56 - 3, height: 6, background: '#FF5EC8', boxShadow: '0 0 40px 10px rgba(255,60,200,.7)' }} />
      {children && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>}
    </div>
  );
};
/** 复古窗口：一个老系统风格的灰色窗口，里面几组对比条一格格涨出来、百分比跟着跳。把实测数据做成「跑分」的样子。 */
export const RetroWindow: React.FC<{ title: string; head: string; rows: { name: string; a: number; b: number; aText: string; bText: string; pct: string }[]; at: number; width?: number; note?: string; legend?: [string, string] }> = ({ title, head, rows, at, width = 900, note, legend }) => {
  const t = useT(), p = prog(t, at, 0.35), max = Math.max(...rows.flatMap((r) => [r.a, r.b]));
  return (
    <div style={{ width, background: '#C3C3CB', border: '3px solid', borderColor: '#fff #55555c #55555c #fff', boxShadow: '0 30px 80px rgba(0,0,0,.6)', opacity: p, transform: `scale(${mix(0.7, 1, p)})`, fontFamily: FONT, color: '#16161c' }}>
      <div style={{ background: 'linear-gradient(90deg, #1B2A8F, #3F8BD8)', color: '#fff', fontFamily: MONO, fontSize: 24, padding: '6px 12px', display: 'flex', justifyContent: 'space-between' }}><span>{title}</span><span style={{ background: '#C3C3CB', color: '#000', padding: '0 8px', border: '2px solid', borderColor: '#fff #55555c #55555c #fff', lineHeight: '24px' }}>×</span></div>
      <div style={{ padding: '18px 26px 22px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><div style={{ fontSize: 34, fontWeight: 900 }}>{head}</div>{legend && <div style={{ fontSize: 20, display: 'flex', gap: 18 }}><span><i style={{ display: 'inline-block', width: 18, height: 12, background: '#77777f', marginRight: 6 }} />{legend[0]}</span><span><i style={{ display: 'inline-block', width: 18, height: 12, background: 'linear-gradient(90deg,#FF5EC8,#38D8FF)', marginRight: 6 }} />{legend[1]}</span></div>}</div>
        {rows.map((r, i) => { const k = inOut((t - at - 0.4 - i * 0.45) / 0.9), bw = width - 470;
          return <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: 20 }}>
            <div style={{ width: 170, fontSize: 26, fontWeight: 900 }}>{r.name}</div>
            <div style={{ width: bw }}>{[[r.a, r.aText, 'repeating-linear-gradient(90deg, #77777f 0 6px, #8d8d95 6px 8px)'], [mix(r.a, r.b, k), r.bText, 'linear-gradient(90deg,#FF5EC8,#38D8FF)']].map(([v, tx, bg], j) => <div key={j} style={{ display: 'flex', alignItems: 'center', marginBottom: 5 }}><div style={{ width: ((v as number) / max) * (bw - 150), height: 20, background: bg as string, border: '2px solid', borderColor: '#55555c #fff #fff #55555c', boxSizing: 'border-box' }} /><span style={{ fontFamily: MONO, fontSize: 18, marginLeft: 10 }}>{j === 0 || k >= 1 ? (tx as string) : ''}</span></div>)}</div>
            <div style={{ flex: 1, textAlign: 'right', fontFamily: MONO, fontSize: 40, fontWeight: 900, color: '#D61E6E' }}>{k >= 1 ? r.pct : `${(parseFloat(r.pct) * k).toFixed(1)}%`}</div>
          </div>; })}
        {note && <div style={{ fontSize: 18, color: '#44444c', marginTop: 16, lineHeight: 1.5 }}>{note}</div>}
      </div>
    </div>
  );
};
/** 镀铬立体字：带厚度和金属渐变的斜体大字「咣」地出现，下面可带一行数字。复古宣传片里喊口号的那种字。 */
export const ChromeText: React.FC<{ text: string; at: number; size?: number; sub?: string }> = ({ text, at, size = 190, sub }) => {
  const t = useT(), p = cl((t - at) / 0.2), s = p < 1 ? mix(2.4, 0.94, p) : mix(0.94, 1, cl((t - at - 0.2) / 0.12)), sh = Array.from({ length: 12 }).map((_, i) => `${i + 1}px ${i + 1}px 0 ${i < 8 ? '#5B2BD6' : '#1B0B4A'}`).join(', ');
  return (
    <div style={{ display: 'inline-block', fontFamily: FONT, textAlign: 'center', opacity: t < at ? 0 : 1, transform: `scale(${s}) skewX(-10deg)` }}>
      <div style={{ position: 'relative', fontSize: size, fontWeight: 900, lineHeight: 1.15, whiteSpace: 'nowrap' }}><div style={{ color: '#5B2BD6', textShadow: sh }}>{text}</div><div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(180deg, #FFFFFF 0%, #BFF3FF 38%, #6A7BFF 50%, #FFD0F4 54%, #FF8AD8 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>{text}</div></div>
      {sub && <div style={{ fontFamily: MONO, fontSize: size * 0.34, color: '#BFF3FF', marginTop: 16, opacity: prog(t, at + 0.35, 0.3), textShadow: '0 0 20px #6A7BFF' }}>{sub}</div>}
    </div>
  );
};
/** 巨字衬底：几个巨大的半透明字铺在后面，前面照常放内容。把一句口号变成背景的一部分。 */
export const GhostType: React.FC<{ words: { text: string; at: number; x: number; y: number; size?: number; color?: string }[]; width?: number; height?: number; children?: React.ReactNode }> = ({ words, width = 1700, height = 720, children }) => {
  const t = useT();
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', fontFamily: FONT }}>
      {words.map((w, i) => { const p = prog(t, w.at, 0.7); return <div key={i} style={{ position: 'absolute', left: w.x * width, top: w.y * height, fontSize: w.size ?? 260, fontWeight: 900, lineHeight: 1, color: w.color ?? '#B79B6B', opacity: 0.42 * p, transform: `translateX(${mix(-90, 0, p)}px)`, whiteSpace: 'nowrap', letterSpacing: -4 }}>{w.text}</div>; })}
      {children && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>}
    </div>
  );
};
