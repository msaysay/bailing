// 手势特效（正面口播用）：认出手在哪、手指指向哪，特效就从那里长出来。全部是代码画的，不用素材。
// 数据来自 scripts/hud_track.py 的 track.json（每帧两只手的手腕、掌心、五个指尖）和 hands.webm（抠出来的人，带透明）。
// 画面分四层：原片（调暗）→ 身后的光（人身光晕、远处的冲击波）→ 抠出来的人 → 身前的光（光刃、闪电、护盾、火花）。
// 每种特效是一个组件，参数是开始和结束的秒数；手没认到的帧自动淡掉。
import React from 'react';
import { AbsoluteFill, OffthreadVideo, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export type Pt = [number, number];
export type HandK = { wrist: Pt; palm: Pt; size: number; thumb: Pt; index: Pt; middle: Pt; ring: Pt; pinky: Pt };
export type FxTrack = { fps: number; frames: number; hands: { L: (HandK | null)[]; R: (HandK | null)[] } };
const Ctx = React.createContext<{ tr: FxTrack | null; f: number; t: number }>({ tr: null, f: 0, t: 0 });
export const FxProvider: React.FC<{ tr: FxTrack | null; children: React.ReactNode }> = ({ tr, children }) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(); return <Ctx.Provider value={{ tr, f, t: f / fps }}>{children}</Ctx.Provider>;
};
export const useFx = () => React.useContext(Ctx);
export const c01 = (x: number) => Math.max(0, Math.min(1, x));
export const out3 = (x: number) => 1 - Math.pow(1 - c01(x), 3), out5 = (x: number) => 1 - Math.pow(1 - c01(x), 5), in2 = (x: number) => c01(x) * c01(x);
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]], sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]], mul = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const len = (a: Pt) => Math.hypot(a[0], a[1]), norm = (a: Pt): Pt => { const l = len(a) || 1; return [a[0] / l, a[1] / l]; };
/** 可复现的随机数：同一个种子每次渲染结果一样（Remotion 并行渲染要求）。 */
export const rnd = (seed: number) => { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

/** 第 f 帧某只手（前后各两帧平滑）。frames 往前/往后取历史时用 at。 */
export const handAt = (tr: FxTrack | null, side: 'L' | 'R', f: number): HandK | null => {
  if (!tr) return null; const arr = tr.hands[side], g = (i: number) => arr[Math.max(0, Math.min(arr.length - 1, i))];
  const c = g(f); if (!c) return null; const ws = [[f - 2, 1], [f - 1, 2], [f, 3], [f + 1, 2], [f + 2, 1]] as const;
  const out: any = { size: c.size }; (['wrist', 'palm', 'thumb', 'index', 'middle', 'ring', 'pinky'] as const).forEach((k) => {
    let sx = 0, sy = 0, sw = 0; ws.forEach(([i, w]) => { const h = g(i); if (h && (h as any)[k]) { sx += (h as any)[k][0] * w; sy += (h as any)[k][1] * w; sw += w; } }); out[k] = [sx / sw, sy / sw];
  });
  return out as HandK;
};
/** 某只手在 [a, b] 秒里这一帧的样子，外加「这只手在不在」的淡入淡出系数。 */
/** 一段时间里出现得多的那只手（单手动作用：屏幕左右分轨时，一只手可能被分到任一边）。 */
export const mainSide = (tr: FxTrack | null, a: number, b: number): 'L' | 'R' => { if (!tr) return 'L'; let l = 0, r = 0; for (let i = Math.floor(a * tr.fps); i < Math.ceil(b * tr.fps); i++) { if (tr.hands.L[i]) l++; if (tr.hands.R[i]) r++; } return r > l ? 'R' : 'L'; };
export const useHand = (side: 'L' | 'R') => { const { tr, f } = useFx(); const h = handAt(tr, side, f); let seen = 0; for (let k = -3; k <= 3; k++) if (handAt(tr, side, f + k)) seen++; return { h, vis: seen / 7 }; };
/** 指尖指向：从掌心指向食指尖的单位向量。 */
export const pointDir = (h: HandK): Pt => norm(sub(h.index, h.palm));
/** 这一帧离开始和结束的淡入淡出。 */
export const env = (t: number, a: number, b: number, fin = 0.12, fout = 0.12) => c01((t - a) / fin) * c01((b - t) / fout);

/** 统一的发光滤镜（放一次就行）。 */
export const FxDefs: React.FC = () => (
  <svg width={0} height={0} style={{ position: 'absolute' }}>
    <defs>
      <filter id="g1" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      <filter id="g2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9" /></filter>
      <filter id="g3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="24" /></filter>
      <filter id="g4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="60" /></filter>
    </defs>
  </svg>
);
const Svg: React.FC<{ children: React.ReactNode; blend?: boolean; op?: number }> = ({ children, blend = true, op = 1 }) => (
  <svg width={1920} height={1080} viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0, overflow: 'visible', mixBlendMode: blend ? 'screen' : undefined, opacity: op }}>{children}</svg>
);
/** 一条发光的线：外层大光晕 + 中层颜色 + 白芯。 */
const GlowPath: React.FC<{ d: string; color: string; w: number; core?: number; op?: number }> = ({ d, color, w, core = 0.3, op = 1 }) => (
  <g opacity={op} fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} stroke={color} strokeWidth={w * 3.2} filter="url(#g3)" opacity={0.7} />
    <path d={d} stroke={color} strokeWidth={w * 1.3} filter="url(#g1)" />
    <path d={d} stroke="#fff" strokeWidth={Math.max(1.5, w * core)} />
  </g>
);

/** 闪电：中点位移法生成折线，带分叉。每两帧重新生成一次，所以会噼啪跳。 */
export const boltPath = (a: Pt, b: Pt, seed: number, amp = 0.18, depth = 6) => {
  const r = rnd(seed); let pts: Pt[] = [a, b]; let off = len(sub(b, a)) * amp;
  for (let d = 0; d < depth; d++) {
    const nx: Pt[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) { const p = pts[i - 1], q = pts[i], m = mul(add(p, q), 0.5), n = norm([-(q[1] - p[1]), q[0] - p[0]]); nx.push(add(m, mul(n, (r() - 0.5) * 2 * off)), q); }
    pts = nx; off *= 0.55;
  }
  const branches: Pt[][] = [];
  for (let k = 0; k < 3; k++) { const i = 4 + Math.floor(r() * (pts.length - 8)), p = pts[i], dir = norm(sub(pts[i + 2], pts[i])), ang = (r() - 0.5) * 1.6, L = len(sub(b, a)) * (0.12 + r() * 0.15);
    const e: Pt = add(p, mul([dir[0] * Math.cos(ang) - dir[1] * Math.sin(ang), dir[0] * Math.sin(ang) + dir[1] * Math.cos(ang)], L)); branches.push([p, add(mul(add(p, e), 0.5), [(r() - 0.5) * L * 0.4, (r() - 0.5) * L * 0.4]), e]); }
  const toD = (ps: Pt[]) => 'M' + ps.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' L');
  return { main: toD(pts), branches: branches.map(toD) };
};
export const Bolt: React.FC<{ a: Pt; b: Pt; color?: string; w?: number; op?: number; seed?: number; strands?: number; amp?: number }> = ({ a, b, color = '#7FD8FF', w = 6, op = 1, seed = 0, strands = 2, amp = 0.18 }) => {
  const { f } = useFx(), s = Math.floor(f / 2) * 13 + seed;
  return <g>{Array.from({ length: strands }).map((_, k) => { const p = boltPath(a, b, s + k * 101, amp * (1 - k * 0.25)); return <g key={k}><GlowPath d={p.main} color={color} w={w * (k ? 0.6 : 1)} op={op} />{p.branches.map((d, i) => <GlowPath key={i} d={d} color={color} w={w * 0.4} op={op * 0.8} />)}</g>; })}</g>;
};

/** 光刃：从食指尖沿着手指方向伸出去。 */
export const Blade: React.FC<{ side: 'L' | 'R'; from: number; to: number; color?: string; length?: number }> = ({ side, from, to, color = '#3DF0FF', length = 620 }) => {
  const { t, f } = useFx(), { h, vis } = useHand(side); if (!h || t < from || t > to + 0.15) return null;
  const e = env(t, from, to, 0.08, 0.15) * vis, grow = out5((t - from) / 0.22), dir = pointDir(h), tip = h.index, end = add(tip, mul(dir, length * grow)), flick = 0.85 + 0.15 * Math.sin(f * 2.1);
  const n: Pt = [-dir[1], dir[0]], wd = 16, base1 = add(tip, mul(n, wd)), base2 = add(tip, mul(n, -wd));
  const blade = `M${base1[0]},${base1[1]} L${end[0]},${end[1]} L${base2[0]},${base2[1]} Z`;
  return <Svg op={e}>
    <path d={blade} fill={color} filter="url(#g3)" opacity={0.8 * flick} />
    <path d={blade} fill={color} filter="url(#g1)" />
    <path d={`M${tip[0]},${tip[1]} L${end[0]},${end[1]}`} stroke="#fff" strokeWidth={7} strokeLinecap="round" />
    <circle cx={tip[0]} cy={tip[1]} r={38 * flick} fill="#fff" filter="url(#g2)" />
    <circle cx={tip[0]} cy={tip[1]} r={90} fill={color} filter="url(#g3)" opacity={0.6} />
  </Svg>;
};

/** 激光：从指尖射向画面边缘，打到边上炸开一圈。 */
export const Laser: React.FC<{ side: 'L' | 'R'; from: number; to: number; color?: string }> = ({ side, from, to, color = '#FF3DCB' }) => {
  const { t, f } = useFx(), { h, vis } = useHand(side); if (!h || t < from || t > to + 0.15) return null;
  const e = env(t, from + 0.12, to, 0.05, 0.12) * vis, dir = pointDir(h), tip = h.index, L = 2400 * out5((t - from - 0.12) / 0.12), end = add(tip, mul(dir, L));
  const charge = c01((t - from) / 0.12), pulse = 1 + 0.25 * Math.sin(f * 1.7);
  return <Svg>
    <circle cx={tip[0]} cy={tip[1]} r={20 + 60 * charge} fill={color} filter="url(#g2)" opacity={vis} />
    <g opacity={e}>
      <path d={`M${tip[0]},${tip[1]} L${end[0]},${end[1]}`} stroke={color} strokeWidth={70 * pulse} filter="url(#g3)" opacity={0.8} />
      <path d={`M${tip[0]},${tip[1]} L${end[0]},${end[1]}`} stroke={color} strokeWidth={26} filter="url(#g1)" />
      <path d={`M${tip[0]},${tip[1]} L${end[0]},${end[1]}`} stroke="#fff" strokeWidth={10} />
      {[0, 1, 2].map((k) => { const p = ((t - from) * 3 + k / 3) % 1, c = add(tip, mul(dir, 120 + p * 900)); return <circle key={k} cx={c[0]} cy={c[1]} r={30 + p * 30} fill="none" stroke="#fff" strokeWidth={3} opacity={(1 - p) * 0.8} />; })}
      <circle cx={tip[0]} cy={tip[1]} r={55 * pulse} fill="#fff" filter="url(#g2)" />
    </g>
  </Svg>;
};

/** 两只手的食指尖之间拉一道闪电，指尖各一团电光。 */
export const Arc: React.FC<{ from: number; to: number; color?: string; strands?: number; finger?: 'index' | 'palm' }> = ({ from, to, color = '#8FD8FF', strands = 3, finger = 'index' }) => {
  const { t } = useFx(), L = useHand('L'), R = useHand('R'); if (!L.h || !R.h || t < from || t > to + 0.15) return null;
  const e = env(t, from, to, 0.06, 0.12) * Math.min(L.vis, R.vis), a = L.h[finger], b = R.h[finger];
  return <Svg op={e}>
    <Bolt a={a} b={b} color={color} w={7} strands={strands} amp={0.16} />
    {[a, b].map((p, i) => <g key={i}><circle cx={p[0]} cy={p[1]} r={70} fill={color} filter="url(#g3)" /><circle cx={p[0]} cy={p[1]} r={22} fill="#fff" filter="url(#g1)" /></g>)}
    {[a, b].map((p, i) => <Bolt key={'s' + i} a={p} b={add(p, [(i ? 1 : -1) * 160, -140])} color={color} w={3} strands={1} seed={i * 7 + 3} amp={0.3} />)}
  </Svg>;
};

/** 等离子束：两指尖之间一道粗光柱，外面绕两股螺旋。 */
export const Beam: React.FC<{ from: number; to: number; color?: string }> = ({ from, to, color = '#9B6BFF' }) => {
  const { t, f } = useFx(), L = useHand('L'), R = useHand('R'); if (!L.h || !R.h || t < from || t > to + 0.15) return null;
  const e = env(t, from, to, 0.08, 0.12) * Math.min(L.vis, R.vis), a = L.h.index, b = R.h.index, d = sub(b, a), n = norm([-d[1], d[0]]), N = 40;
  const helix = (ph: number) => 'M' + Array.from({ length: N + 1 }).map((_, i) => { const p = i / N, c = add(a, mul(d, p)), o = Math.sin(p * Math.PI * 6 + f * 0.6 + ph) * 34 * Math.sin(p * Math.PI); const q = add(c, mul(n, o)); return `${q[0].toFixed(1)},${q[1].toFixed(1)}`; }).join(' L');
  return <Svg op={e}>
    <path d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={color} strokeWidth={110} filter="url(#g4)" opacity={0.9} />
    <path d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke={color} strokeWidth={40} filter="url(#g2)" />
    <path d={`M${a[0]},${a[1]} L${b[0]},${b[1]}`} stroke="#fff" strokeWidth={14 + 4 * Math.sin(f)} />
    <GlowPath d={helix(0)} color="#FF5BD8" w={5} />
    <GlowPath d={helix(Math.PI)} color="#3DF0FF" w={5} />
    {[a, b].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={60} fill="#fff" filter="url(#g2)" />)}
  </Svg>;
};

/** 能量球：在两只手中间（或一只手的指尖）。半径跟着两手距离变。 */
export const Orb: React.FC<{ from: number; to: number; color?: string; mode?: 'between' | 'L' | 'R'; grow?: number }> = ({ from, to, color = '#FFC83D', mode = 'between', grow = 0.4 }) => {
  const { t, f } = useFx(), L = useHand('L'), R = useHand('R'); if (t < from || t > to + 0.2) return null;
  let c: Pt, r: number, vis: number, tips: Pt[] = [];
  if (mode === 'between') { if (!L.h || !R.h) return null; c = mul(add(L.h.palm, R.h.palm), 0.5); c = [c[0], c[1] - 40]; r = Math.min(170, len(sub(L.h.palm, R.h.palm)) * 0.26); vis = Math.min(L.vis, R.vis); tips = [L.h.index, R.h.index, L.h.middle, R.h.middle]; }
  else { const H = mode === 'L' ? L : R; if (!H.h) return null; c = add(H.h.index, mul(pointDir(H.h), 40)); r = 40 + 110 * out3((t - from) / Math.max(0.2, grow)); vis = H.vis; tips = [H.h.index, H.h.middle, H.h.thumb]; }
  const e = env(t, from, to, 0.15, 0.15) * vis, rr = r * out5((t - from) / 0.35) * (1 + 0.05 * Math.sin(f * 1.3));
  return <Svg op={e}>
    <circle cx={c[0]} cy={c[1]} r={rr * 2.4} fill={color} filter="url(#g4)" opacity={0.75} />
    <circle cx={c[0]} cy={c[1]} r={rr} fill={color} filter="url(#g2)" />
    <circle cx={c[0]} cy={c[1]} r={rr * 0.55} fill="#fff" filter="url(#g1)" />
    {[0, 1, 2].map((k) => <ellipse key={k} cx={c[0]} cy={c[1]} rx={rr * 1.25} ry={rr * 0.42} fill="none" stroke="#fff" strokeWidth={3} strokeDasharray="40 30" transform={`rotate(${k * 60 + f * (k % 2 ? -6 : 8)} ${c[0]} ${c[1]})`} opacity={0.75} />)}
    {tips.map((p, i) => <Bolt key={i} a={c} b={p} color={color} w={3.5} strands={1} seed={i * 17} amp={0.25} />)}
  </Svg>;
};

/** 聚能：粒子从四周螺旋着往一个点收。 */
export const Converge: React.FC<{ at: Pt | null; from: number; to: number; color?: string; n?: number; radius?: number }> = ({ at, from, to, color = '#FFC83D', n = 70, radius = 700 }) => {
  const { t } = useFx(); if (!at || t < from || t > to) return null; const r = rnd(42), e = env(t, from, to, 0.2, 0.1);
  return <Svg op={e}>{Array.from({ length: n }).map((_, i) => {
    const ph = r(), sp = 0.6 + r() * 0.9, a0 = r() * Math.PI * 2, p = ((t - from) * sp + ph) % 1, rad = radius * (1 - p) * (0.5 + r() * 0.6), ang = a0 + p * 2.4, x = at[0] + Math.cos(ang) * rad, y = at[1] + Math.sin(ang) * rad;
    const tx = at[0] + Math.cos(ang - 0.25) * rad * 1.18, ty = at[1] + Math.sin(ang - 0.25) * rad * 1.18;
    return <g key={i} opacity={in2(p) * 0.4 + 0.6 * Math.sin(p * Math.PI)}><path d={`M${tx},${ty} L${x},${y}`} stroke={color} strokeWidth={4} filter="url(#g1)" /><circle cx={x} cy={y} r={3 + 4 * p} fill="#fff" /></g>;
  })}</Svg>;
};

/** 冲击波：一圈光环从中心荡开，带一层白闪。 */
export const Shockwave: React.FC<{ at: Pt; t0: number; color?: string; size?: number }> = ({ at, t0, color = '#3DF0FF', size = 1500 }) => {
  const { t } = useFx(), a = t - t0; if (a < 0 || a > 0.9) return null;
  return <Svg>{[0, 0.08, 0.18].map((d, i) => { const p = out5((a - d) / 0.7); if (a < d) return null; const R = size * p;
    return <g key={i}><circle cx={at[0]} cy={at[1]} r={R} fill="none" stroke={i === 1 ? '#fff' : color} strokeWidth={(1 - p) * 90 + 4} filter="url(#g2)" opacity={1 - p} /><circle cx={at[0]} cy={at[1]} r={R} fill="none" stroke="#fff" strokeWidth={(1 - p) * 10 + 1} opacity={(1 - p) * 0.9} /></g>; })}
    <circle cx={at[0]} cy={at[1]} r={200 * (1 - out3(a / 0.3))} fill="#fff" filter="url(#g3)" opacity={0.6 * (1 - out3(a / 0.3))} />
  </Svg>;
};

/** 火花：从一点向某个方向喷，带重力往下落。 */
export const Sparks: React.FC<{ at: Pt | null; t0: number; dir?: Pt; spread?: number; n?: number; color?: string; speed?: number; seed?: number }> = ({ at, t0, dir = [0, -1], spread = 1.4, n = 60, color = '#FFC83D', speed = 1500, seed = 1 }) => {
  const { t } = useFx(), a = t - t0; if (!at || a < 0 || a > 1.3) return null; const r = rnd(seed * 31 + 7), base = Math.atan2(dir[1], dir[0]);
  return <Svg>{Array.from({ length: n }).map((_, i) => {
    const ang = base + (r() - 0.5) * spread, v = speed * (0.35 + r() * 0.8), life = 0.5 + r() * 0.7, p = a / life; if (p > 1) return null;
    const x = at[0] + Math.cos(ang) * v * a, y = at[1] + Math.sin(ang) * v * a + 1400 * a * a, px = at[0] + Math.cos(ang) * v * Math.max(0, a - 0.035), py = at[1] + Math.sin(ang) * v * Math.max(0, a - 0.035) + 1400 * Math.max(0, a - 0.035) ** 2;
    return <g key={i} opacity={1 - p}><path d={`M${px},${py} L${x},${y}`} stroke={color} strokeWidth={5} filter="url(#g1)" /><path d={`M${px},${py} L${x},${y}`} stroke="#fff" strokeWidth={2} /></g>;
  })}</Svg>;
};

/** 拖尾：食指尖过去十几帧的轨迹，头粗尾细，颜色渐变。 */
export const Trail: React.FC<{ side: 'L' | 'R'; from: number; to: number; colors?: [string, string]; frames?: number; width?: number; key2?: 'index' | 'palm' }> = ({ side, from, to, colors = ['#FF3DCB', '#3DF0FF'], frames = 14, width = 46, key2 = 'index' }) => {
  const { t, f, tr } = useFx(); if (t < from || t > to + 0.3) return null; const pts: Pt[] = [];
  for (let k = frames; k >= 0; k--) { const h = handAt(tr, side, f - k); if (h && t - k / 30 >= from - 0.05) pts.push(h[key2]); }
  if (pts.length < 3) return null; const e = env(t, from, to, 0.05, 0.25), id = `tr${side}${Math.round(from * 10)}`;
  return <Svg op={e}>
    <defs><linearGradient id={id} gradientUnits="userSpaceOnUse" x1={pts[0][0]} y1={pts[0][1]} x2={pts[pts.length - 1][0]} y2={pts[pts.length - 1][1]}><stop offset="0" stopColor={colors[0]} stopOpacity={0} /><stop offset="1" stopColor={colors[1]} /></linearGradient></defs>
    {pts.slice(1).map((p, i) => { const q = pts[i], k = (i + 1) / pts.length; return <g key={i}>
      <line x1={q[0]} y1={q[1]} x2={p[0]} y2={p[1]} stroke={`url(#${id})`} strokeWidth={width * k * 2.4} strokeLinecap="round" filter="url(#g3)" opacity={0.8} />
      <line x1={q[0]} y1={q[1]} x2={p[0]} y2={p[1]} stroke={`url(#${id})`} strokeWidth={width * k} strokeLinecap="round" filter="url(#g1)" />
      <line x1={q[0]} y1={q[1]} x2={p[0]} y2={p[1]} stroke="#fff" strokeWidth={Math.max(2, width * k * 0.25)} strokeLinecap="round" opacity={k} /></g>; })}
  </Svg>;
};

/** 六边形护盾：两掌之间撑开一面蜂窝光盾，从中心一圈圈亮开，表面有扫光。 */
export const Shield: React.FC<{ from: number; to: number; color?: string }> = ({ from, to, color = '#3DF0FF' }) => {
  const { t, f } = useFx(), L = useHand('L'), R = useHand('R'); if (!L.h || !R.h || t < from || t > to + 0.2) return null;
  const e = env(t, from, to, 0.1, 0.2) * Math.min(L.vis, R.vis), c = mul(add(L.h.palm, R.h.palm), 0.5), rx = len(sub(L.h.palm, R.h.palm)) * 0.5 + 180, ry = rx * 0.78, open = out5((t - from) / 0.45), s = 46, hexes: React.ReactNode[] = [];
  const hexD = (x: number, y: number) => 'M' + Array.from({ length: 6 }).map((_, i) => { const a = (Math.PI / 3) * i + Math.PI / 6; return `${(x + s * 0.92 * Math.cos(a)).toFixed(1)},${(y + s * 0.92 * Math.sin(a)).toFixed(1)}`; }).join(' L') + 'Z';
  for (let row = -14; row <= 14; row++) for (let col = -16; col <= 16; col++) {
    const x = c[0] + col * s * Math.sqrt(3) + (row % 2 ? (s * Math.sqrt(3)) / 2 : 0), y = c[1] + row * s * 1.5, d = Math.hypot((x - c[0]) / rx, (y - c[1]) / ry); if (d > open) continue;
    const ring = Math.abs(((t - from) * 1.6 - d) % 1), lit = Math.max(0, 1 - ring * 6), edge = c01((d - open * 0.85) / 0.15);
    hexes.push(<path key={row + '_' + col} d={hexD(x, y)} fill={color} fillOpacity={0.05 + lit * 0.35} stroke={color} strokeWidth={2 + lit * 3} strokeOpacity={0.45 + lit * 0.5 + edge * 0.4} />);
  }
  const sweep = ((t - from) * 0.9) % 1;
  return <Svg op={e}>
    <ellipse cx={c[0]} cy={c[1]} rx={rx * open} ry={ry * open} fill={color} opacity={0.12} filter="url(#g3)" />
    <g filter="url(#g1)" opacity={0.7}>{hexes}</g><g>{hexes}</g>
    <ellipse cx={c[0]} cy={c[1]} rx={rx * open} ry={ry * open} fill="none" stroke="#fff" strokeWidth={6} filter="url(#g1)" />
    <ellipse cx={c[0]} cy={c[1]} rx={rx * open} ry={ry * open} fill="none" stroke={color} strokeWidth={24} filter="url(#g3)" />
    <rect x={c[0] - rx + sweep * rx * 2 - 60} y={c[1] - ry} width={120} height={ry * 2} fill="#fff" opacity={0.18} filter="url(#g3)" transform={`skewX(-20)`} />
    {[L.h.palm, R.h.palm].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={70 + 10 * Math.sin(f)} fill={color} filter="url(#g3)" />)}
  </Svg>;
};

/** 人身上的光晕：抠出来的人做成一圈彩色辉光，垫在人后面。strength 0 到 1。 */
export const Aura: React.FC<{ src: string; strength: number; color?: 'cyan' | 'gold' | 'violet' }> = ({ src, strength, color = 'cyan' }) => {
  if (strength <= 0.01) return null; const hue = { cyan: 150, gold: 0, violet: 220 }[color];
  return <AbsoluteFill style={{ opacity: strength, mixBlendMode: 'screen' }}>
    <OffthreadVideo transparent muted src={staticFile(src)} style={{ width: '100%', height: '100%', transform: `scale(${1 + 0.05 * strength})`, filter: `brightness(0) invert(1) sepia(1) saturate(8) hue-rotate(${hue}deg) blur(${18 + 22 * strength}px)` }} />
    <OffthreadVideo transparent muted src={staticFile(src)} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', transform: `scale(${1 + 0.015 * strength})`, filter: `brightness(0) invert(1) sepia(1) saturate(8) hue-rotate(${hue}deg) blur(6px)` }} />
  </AbsoluteFill>;
};
