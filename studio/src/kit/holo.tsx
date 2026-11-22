// 全息工作台（科幻电影里那种）：细线、冰蓝、半透明面板，内容是剪辑工作流本身（时间线、波形、流程节点、风格列表、渲染进度）。
// 和 kit/fx.tsx 配合：fx 给手的位置，这里画面板。面板默认垫在人后面（被身体和手挡住），只有跟着手走的小件画在人前面，而且躲开人脸。
import React from 'react';
import { OffthreadVideo, staticFile } from 'remotion';
import { Pt, c01, out3, out5, useFx } from './fx';

export const ICE = '#A8EEFF', ICE2 = 'rgba(168,238,255,.55)', ICE3 = 'rgba(168,238,255,.18)', AMB = '#FFB547', FILL = 'rgba(60,150,220,.08)';
export const MONO = '"H Din", "H Hei", monospace', HHEI = '"H Hei", "PingFang SC", sans-serif';
const glow = 'drop-shadow(0 0 4px rgba(140,220,255,.55))';
export type Box = { x: number; y: number; w: number; h: number };
export const inBox = (p: Pt, b: Box | null, pad = 40) => !!b && p[0] > b.x - pad && p[0] < b.x + b.w + pad && p[1] > b.y - pad && p[1] < b.y + b.h + pad;
/** 全息面板出现：边框先描出来，再从上往下扫出内容，前几帧闪一下。消失时缩成一条线。返回 null 表示这时候不在。 */
export const useMat = (at: number, out = 1e9) => {
  const { t, f } = useFx(); if (t < at || t > out + 0.25) return null;
  const a = t - at, draw = out5(a / 0.35), body = out3((a - 0.12) / 0.3), q = out3((t - out) / 0.22), flick = a < 0.18 ? (f % 2 ? 0.55 : 1) : 1;
  return { draw, body: body * (1 - q), op: flick * (1 - q), squash: 1 - q * 0.95, a };
};

/** 面板：四角括号 + 细边框 + 标题条 + 内容。tilt 是绕竖轴转的角度（左边的面板朝右转，像围着人摆了一圈）。 */
export const Panel: React.FC<{ b: Box; at: number; out?: number; title: string; code?: string; tilt?: number; from?: Pt; children?: React.ReactNode; accent?: boolean; solid?: boolean }> = ({ b, at, out, title, code, tilt = 0, from, children, accent, solid }) => {
  const m = useMat(at, out), { t } = useFx(); if (!m) return null;
  const fly = from ? 1 - out5(m.a / 0.45) : 0, dx = from ? (from[0] - (b.x + b.w / 2)) * fly : 0, dy = from ? (from[1] - (b.y + b.h / 2)) * fly : 0, sc = from ? 0.2 + 0.8 * out5(m.a / 0.45) : 1;
  const P = 2 * (b.w + b.h), col = accent ? AMB : ICE, c = 26;
  const corner = (x: number, y: number, sx: number, sy: number) => `M${x},${y + sy * c} L${x},${y} L${x + sx * c},${y}`;
  return <div style={{ position: 'absolute', left: b.x, top: b.y, width: b.w, height: b.h, opacity: m.op, transform: `translate(${dx}px, ${dy}px) perspective(1600px) rotateY(${tilt}deg) scale(${sc}, ${sc * m.squash})`, transformOrigin: tilt > 0 ? 'left center' : tilt < 0 ? 'right center' : 'center', filter: glow }}>
    <div style={{ position: 'absolute', inset: 0, background: solid ? 'rgba(6,14,26,.62)' : FILL, backdropFilter: solid ? 'blur(10px)' : undefined, opacity: m.body, backgroundImage: 'repeating-linear-gradient(0deg, rgba(168,238,255,.05) 0 1px, transparent 1px 4px)' }} />
    <svg width={b.w} height={b.h} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <rect x={0.5} y={0.5} width={b.w - 1} height={b.h - 1} fill="none" stroke={ICE2} strokeWidth={1.2} strokeDasharray={P} strokeDashoffset={P * (1 - m.draw)} />
      {[corner(0, 0, 1, 1), corner(b.w, 0, -1, 1), corner(0, b.h, 1, -1), corner(b.w, b.h, -1, -1)].map((d, i) => <path key={i} d={d} stroke={col} strokeWidth={3} fill="none" />)}
      <line x1={0} y1={40} x2={b.w * m.draw} y2={40} stroke={ICE3} strokeWidth={1} />
    </svg>
    <div style={{ position: 'absolute', left: 16, top: 9, right: 16, display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 18, letterSpacing: 3, color: col, opacity: m.body }}>
      <span>{title}</span><span style={{ color: ICE2 }}>{code ?? ''} <span style={{ opacity: Math.floor(t * 3) % 2 ? 1 : 0.3 }}>●</span></span>
    </div>
    <div style={{ position: 'absolute', left: 16, right: 16, top: 52, bottom: 14, opacity: m.body, clipPath: `inset(0 0 ${(1 - m.body) * 100}% 0)` }}>{children}</div>
  </div>;
};

/** 时间线：几条轨道，每条若干段，播放头走动。 */
export const Timeline: React.FC<{ w: number; h: number; seed?: number; play?: number }> = ({ w, h, seed = 1, play }) => {
  const { t } = useFx(), rows = 4, ph = play ?? ((t * 0.18) % 1); let r = seed * 97;
  const nx = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  return <svg width={w} height={h} style={{ overflow: 'visible' }}>
    {Array.from({ length: rows }).map((_, k) => { const y = 8 + k * ((h - 24) / rows), hh = (h - 24) / rows - 8; let x = 0; const segs: React.ReactNode[] = [];
      while (x < w) { const sw = 40 + nx() * 140; segs.push(<rect key={x} x={x + 2} y={y} width={Math.max(4, Math.min(sw, w - x) - 4)} height={hh} fill={k === 0 ? 'rgba(255,181,71,.28)' : 'rgba(120,210,255,.18)'} stroke={k === 0 ? AMB : ICE2} strokeWidth={1} />); x += sw; }
      return <g key={k}>{segs}</g>; })}
    {Array.from({ length: 30 }).map((_, i) => <line key={i} x1={(i / 30) * w} y1={h - 10} x2={(i / 30) * w} y2={h - (i % 5 ? 4 : 0)} stroke={ICE2} strokeWidth={1} />)}
    <line x1={ph * w} y1={0} x2={ph * w} y2={h} stroke="#fff" strokeWidth={2} /><path d={`M${ph * w - 7},0 L${ph * w + 7},0 L${ph * w},10 Z`} fill="#fff" />
  </svg>;
};
/** 波形：一排竖条跟着时间起伏。 */
export const Wave: React.FC<{ w: number; h: number; n?: number }> = ({ w, h, n = 64 }) => {
  const { t } = useFx();
  return <svg width={w} height={h}>{Array.from({ length: n }).map((_, i) => { const v = 0.15 + 0.85 * Math.abs(Math.sin(i * 0.7 + t * 5) * Math.sin(i * 0.23 + t * 2.1)), bh = v * h; return <rect key={i} x={(i / n) * w} y={(h - bh) / 2} width={w / n - 2} height={bh} fill={ICE} opacity={0.35 + v * 0.5} />; })}</svg>;
};
/** 流程节点：转写 → 粗剪 → 字幕 → 版式 → 成片，按 p（0 到 1）依次点亮。 */
export const Nodes: React.FC<{ w: number; h: number; p: number; labels?: string[] }> = ({ w, h, p, labels = ['转写', '粗剪', '字幕', '版式', '成片'] }) => {
  const n = labels.length, xs = labels.map((_, i) => 30 + (i * (w - 60)) / (n - 1)), y = h / 2 - 10;
  return <svg width={w} height={h} style={{ overflow: 'visible' }}>
    <line x1={xs[0]} y1={y} x2={xs[n - 1]} y2={y} stroke={ICE3} strokeWidth={2} />
    <line x1={xs[0]} y1={y} x2={xs[0] + (xs[n - 1] - xs[0]) * c01(p)} y2={y} stroke={ICE} strokeWidth={2} />
    {labels.map((l, i) => { const on = p >= i / (n - 1) - 0.001; return <g key={i}>
      <circle cx={xs[i]} cy={y} r={16} fill={on ? 'rgba(168,238,255,.25)' : 'rgba(0,0,0,.3)'} stroke={on ? ICE : ICE3} strokeWidth={2} />
      {on ? <circle cx={xs[i]} cy={y} r={5} fill="#fff" /> : null}
      <text x={xs[i]} y={y + 50} textAnchor="middle" fontFamily={HHEI} fontSize={22} fill={on ? '#fff' : 'rgba(255,255,255,.45)'}>{l}</text></g>; })}
  </svg>;
};
/** 列表：一列条目，第 sel 个高亮（琥珀色）。 */
export const List: React.FC<{ items: string[]; sel?: number; size?: number }> = ({ items, sel = -1, size = 26 }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{items.map((x, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: HHEI, fontSize: size, color: i === sel ? '#14110a' : '#fff', background: i === sel ? AMB : 'transparent', borderLeft: `3px solid ${i === sel ? AMB : ICE3}`, padding: '3px 12px' }}><span style={{ fontFamily: MONO, fontSize: size * 0.7, color: i === sel ? '#14110a' : ICE2 }}>{String(i + 1).padStart(2, '0')}</span>{x}</div>)}</div>
);
/** 读数：一排「名字 ……… 数」。 */
export const Readout: React.FC<{ rows: [string, string][]; size?: number }> = ({ rows, size = 20 }) => (
  <div style={{ fontFamily: MONO, fontSize: size, color: ICE2, lineHeight: 1.65, letterSpacing: 1.5 }}>{rows.map(([k, v], i) => <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${ICE3}` }}><span>{k}</span><span style={{ color: '#fff' }}>{v}</span></div>)}</div>
);
/** 进度条加百分数。 */
export const Progress: React.FC<{ p: number; label?: string; w: number }> = ({ p, label = 'RENDERING', w }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: MONO, fontSize: 22, color: ICE, letterSpacing: 3 }}><span>{p >= 1 ? 'COMPLETE' : label}</span><span style={{ color: '#fff', fontSize: 40 }}>{Math.round(p * 100)}<span style={{ fontSize: 20 }}>%</span></span></div>
    <div style={{ width: w, height: 14, marginTop: 10, border: `1px solid ${ICE2}`, padding: 2, boxSizing: 'border-box' }}><div style={{ width: `${p * 100}%`, height: '100%', background: `repeating-linear-gradient(90deg, ${p >= 1 ? AMB : ICE} 0 10px, transparent 10px 13px)` }} /></div>
  </div>
);
/** 小监视器：放这条片子的原片（LIVE CAM）。 */
export const Monitor: React.FC<{ w: number; h: number; src: string }> = ({ w, h, src }) => (
  <div style={{ width: w, height: h, position: 'relative', overflow: 'hidden', border: `1px solid ${ICE3}` }}>
    <OffthreadVideo muted src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(.6) brightness(.9) sepia(.3) hue-rotate(160deg) saturate(1.6)', opacity: 0.85 }} />
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.25) 0 1px, transparent 1px 3px)' }} />
    <div style={{ position: 'absolute', left: 8, top: 6, fontFamily: MONO, fontSize: 16, color: '#FF6B6B', letterSpacing: 2 }}>● REC</div>
  </div>
);

/** 大圆环：画在人身后，几圈刻度和弧段慢慢转。 */
export const Ring: React.FC<{ c: Pt; r: number; at: number; out?: number }> = ({ c, r, at, out = 1e9 }) => {
  const m = useMat(at, out), { t } = useFx(); if (!m) return null; const R = r * (0.6 + 0.4 * out5(m.a / 0.6));
  const arc = (rad: number, a0: number, a1: number) => { const p = (a: number) => [c[0] + Math.cos(a) * rad, c[1] + Math.sin(a) * rad]; const [x0, y0] = p(a0), [x1, y1] = p(a1); return `M${x0},${y0} A${rad},${rad} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1},${y1}`; };
  return <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: m.op * 0.9, filter: glow }}>
    <circle cx={c[0]} cy={c[1]} r={R} fill="none" stroke={ICE3} strokeWidth={1} />
    <circle cx={c[0]} cy={c[1]} r={R * 1.12} fill="none" stroke={ICE2} strokeWidth={1.5} strokeDasharray="2 14" transform={`rotate(${t * 12} ${c[0]} ${c[1]})`} />
    {[0, 1, 2, 3].map((k) => <path key={k} d={arc(R * 0.92, t * 0.4 + k * 1.57, t * 0.4 + k * 1.57 + 0.9)} stroke={ICE} strokeWidth={4} fill="none" />)}
    {[0, 1, 2].map((k) => <path key={'b' + k} d={arc(R * 1.25, -t * 0.25 + k * 2.09, -t * 0.25 + k * 2.09 + 0.5)} stroke={AMB} strokeWidth={2} fill="none" />)}
    {Array.from({ length: 72 }).map((_, i) => { const a = (i / 72) * Math.PI * 2, r1 = R * 1.02, r2 = R * (i % 6 ? 1.05 : 1.09); return <line key={i} x1={c[0] + Math.cos(a) * r1} y1={c[1] + Math.sin(a) * r1} x2={c[0] + Math.cos(a) * r2} y2={c[1] + Math.sin(a) * r2} stroke={ICE2} strokeWidth={1} />; })}
  </svg>;
};
/** 地面网格：透视的一片线，从画面底部往远处延伸。 */
export const Floor: React.FC<{ at: number; out?: number }> = ({ at, out = 1e9 }) => {
  const m = useMat(at, out), { t } = useFx(); if (!m) return null; const hz = 700, vx = 960;
  return <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: m.op * 0.6 }}>
    {Array.from({ length: 25 }).map((_, i) => { const x = -1400 + i * 200; return <line key={i} x1={vx + (x - vx) * 0.08} y1={hz} x2={x + 960} y2={1080 + 200} stroke={ICE3} strokeWidth={1} opacity={m.draw} />; })}
    {Array.from({ length: 8 }).map((_, i) => { const p = ((i + t * 0.8) % 8) / 8, y = hz + Math.pow(p, 2.2) * 500; return <line key={'h' + i} x1={0} y1={y} x2={1920} y2={y} stroke={ICE3} strokeWidth={1} opacity={p * m.draw} />; })}
  </svg>;
};
/** 手部跟踪准星：掌心到五个指尖的细线、指尖小圆点，食指尖一个十字准星和坐标。脸附近不画。 */
export const HandRig: React.FC<{ h: { palm: Pt; wrist: Pt; thumb: Pt; index: Pt; middle: Pt; ring: Pt; pinky: Pt } | null; face: Box | null; label: string; op?: number }> = ({ h, face, label, op = 1 }) => {
  const { t } = useFx(); if (!h || op <= 0.01) return null; const tips = [h.thumb, h.index, h.middle, h.ring, h.pinky], show = (p: Pt) => !inBox(p, face, 10);
  const ix = h.index, rr = 22 + 3 * Math.sin(t * 8);
  return <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: op, filter: glow }}>
    {show(h.wrist) && show(h.palm) ? <line x1={h.wrist[0]} y1={h.wrist[1]} x2={h.palm[0]} y2={h.palm[1]} stroke={ICE2} strokeWidth={1.2} /> : null}
    {tips.map((p, i) => show(p) && show(h.palm) ? <g key={i}><line x1={h.palm[0]} y1={h.palm[1]} x2={p[0]} y2={p[1]} stroke={ICE2} strokeWidth={1.2} /><circle cx={p[0]} cy={p[1]} r={5} fill="none" stroke={ICE} strokeWidth={1.5} /></g> : null)}
    {show(h.palm) ? <circle cx={h.palm[0]} cy={h.palm[1]} r={9} fill="none" stroke={ICE} strokeWidth={1.5} /> : null}
    {show(ix) ? <g>
      <circle cx={ix[0]} cy={ix[1]} r={rr} fill="none" stroke="#fff" strokeWidth={1.5} strokeDasharray="6 5" transform={`rotate(${t * 90} ${ix[0]} ${ix[1]})`} />
      {[[-1, 0], [1, 0], [0, -1], [0, 1]].map(([a, b], i) => <line key={i} x1={ix[0] + a * (rr + 4)} y1={ix[1] + b * (rr + 4)} x2={ix[0] + a * (rr + 14)} y2={ix[1] + b * (rr + 14)} stroke="#fff" strokeWidth={1.5} />)}
      <text x={ix[0] + rr + 18} y={ix[1] - rr - 6} fontFamily={MONO} fontSize={16} fill={ICE} letterSpacing={2}>{label} {Math.round(ix[0])},{Math.round(ix[1])}</text>
    </g> : null}
  </svg>;
};
/** 点击波纹：一圈细环散开。 */
export const Ripple: React.FC<{ at: Pt | null; t0: number; r?: number; color?: string }> = ({ at, t0, r = 160, color = ICE }) => {
  const { t } = useFx(), a = t - t0; if (!at || a < 0 || a > 0.7) return null;
  return <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, filter: glow }}>{[0, 0.1, 0.2].map((d, i) => { const p = out5((a - d) / 0.5); return a > d ? <circle key={i} cx={at[0]} cy={at[1]} r={r * p} fill="none" stroke={i === 1 ? '#fff' : color} strokeWidth={2.5 * (1 - p) + 0.5} opacity={1 - p} /> : null; })}</svg>;
};
/** 连线：从手指到面板的一根细线，带一个移动的光点。 */
export const Link: React.FC<{ a: Pt | null; b: Pt; op?: number }> = ({ a, b, op = 1 }) => {
  const { t } = useFx(); if (!a || op <= 0.01) return null; const p = (t * 1.8) % 1, m: Pt = [a[0] + (b[0] - a[0]) * p, a[1] + (b[1] - a[1]) * p];
  return <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: op, filter: glow }}><line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={ICE2} strokeWidth={1.2} strokeDasharray="4 6" /><circle cx={m[0]} cy={m[1]} r={4} fill="#fff" /></svg>;
};
