// 关系与流程类组件：步骤、因果、循环、网络、资金流向、层级、时间线、力量对比…… 讲「怎么运转」「谁和谁什么关系」。
import React from 'react';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';
import { PAL } from './charts';

const cl = (v: number) => Math.max(0, Math.min(1, v));
const useUid = () => 'u' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
const draw = (p: number) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - cl(p) });

/** 步骤流：几个方块用箭头连成一行，讲到哪步哪步亮。 */
export const FlowSteps: React.FC<{ steps: { title: string; note?: string }[]; ats: number[]; width?: number }> = ({ steps, ats, width = 1600 }) => {
  const t = useT(); let act = -1; ats.forEach((a, i) => { if (t >= a) act = i; });
  return (
    <div style={{ width, display: 'flex', alignItems: 'stretch', fontFamily: FONT }}>
      {steps.map((s, i) => { const p = prog(t, ats[i], 0.45), me = i === act;
        return <React.Fragment key={i}>
          {i > 0 && <div style={{ width: 90, flex: 'none', display: 'flex', alignItems: 'center' }}><svg width={90} height={40}><line x1={8} y1={20} x2={8 + 60 * prog(t, ats[i] - 0.3, 0.3)} y2={20} stroke={C.muted} strokeWidth={5} /><path d="M66 6 L84 20 L66 34 Z" fill={C.muted} opacity={prog(t, ats[i] - 0.05, 0.2)} /></svg></div>}
          <div style={{ flex: 1, background: C.surface, border: `3px solid ${me ? C.accent : C.line}`, borderRadius: 24, padding: '30px 30px', opacity: p * (me ? 1 : 0.6), transform: `translateY(${mix(40, 0, p)}px) scale(${me ? 1.04 : 1})`, boxShadow: me ? `0 0 60px ${C.accent}44` : 'none' }}>
            <div style={{ fontSize: 30, fontWeight: 900, color: me ? C.accent : C.muted }}>第 {i + 1} 步</div><div style={{ fontSize: 50, fontWeight: 900, color: C.text, lineHeight: 1.25, margin: '6px 0' }}>{s.title}</div>{s.note && <div style={{ fontSize: 28, color: C.muted, lineHeight: 1.4 }}>{s.note}</div>}
          </div>
        </React.Fragment>; })}
    </div>
  );
};
/** 因果链：一级一级往右下走的台阶，「因为这个，所以那个」。 */
export const CauseChain: React.FC<{ items: string[]; ats: number[]; width?: number; link?: string }> = ({ items, ats, width = 1500, link = '所以' }) => {
  const t = useT(), n = items.length, bw = 480, bh = 110, sy = 150, sx = (width - bw) / (n - 1), H = (n - 1) * sy + bh;
  return (
    <div style={{ position: 'relative', width, height: H, fontFamily: FONT }}>
      <svg width={width} height={H} style={{ position: 'absolute', inset: 0 }}>{items.slice(1).map((_, i) => { const x0 = i * sx + bw * 0.5, y0 = i * sy + bh, x1 = (i + 1) * sx, y1 = (i + 1) * sy + bh / 2, p = inOut((t - ats[i + 1] + 0.5) / 0.5);
        return <g key={i}><path d={`M${x0} ${y0} V${y1} H${x1 - 14}`} fill="none" stroke={C.warm} strokeWidth={5} {...draw(p)} /><path d={`M${x1 - 20} ${y1 - 13} L${x1 - 2} ${y1} L${x1 - 20} ${y1 + 13} Z`} fill={C.warm} opacity={cl((p - 0.9) * 10)} /><text x={x0 + 18} y={y1 - 14} fontSize={28} fontWeight={900} fill={C.warm} opacity={p}>{link}</text></g>; })}</svg>
      {items.map((x, i) => { const p = prog(t, ats[i], 0.45), last = i === n - 1;
        return <div key={i} style={{ position: 'absolute', left: i * sx, top: i * sy, width: bw, height: bh, boxSizing: 'border-box', background: last ? C.warm : C.surface, border: `3px solid ${last ? C.warm : C.line}`, borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 46, fontWeight: 900, color: last ? '#14171D' : C.text, opacity: p, transform: `scale(${mix(0.85, 1, p)})`, whiteSpace: 'nowrap' }}>{x}</div>; })}
    </div>
  );
};
/** 循环圈：几个环节首尾相接成一个圈，一个光点沿着圈一直转。讲「飞轮」「恶性循环」。 */
export const Cycle: React.FC<{ nodes: string[]; at: number; r?: number; center?: string; color?: string }> = ({ nodes, at, r = 250, center, color = C.accent }) => {
  const t = useT(), n = nodes.length, W = r * 2 + 620, H = r * 2 + 150, cx = W / 2, cy = H / 2, pt = (deg: number) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)], gap = 20;
  const [dx, dy] = pt(-90 + Math.max(0, t - at - 0.6 - n * 0.35) * 70);
  return (
    <div style={{ position: 'relative', width: W, height: H, fontFamily: FONT }}>
      <svg width={W} height={H} style={{ position: 'absolute', inset: 0 }}>
        {nodes.map((_, i) => { const a0 = -90 + (i * 360) / n + gap, a1 = -90 + ((i + 1) * 360) / n - gap, [x0, y0] = pt(a0), [x1, y1] = pt(a1), p = inOut((t - at - 0.5 - i * 0.35) / 0.5), [hx, hy] = pt(a1 + 3);
          return <g key={i}><path d={`M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`} fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" {...draw(p)} /><circle cx={hx} cy={hy} r={11 * cl((p - 0.85) * 8)} fill={color} /></g>; })}
        {t > at + 0.6 + n * 0.35 && <><circle cx={dx} cy={dy} r={16} fill={C.warm} /><circle cx={dx} cy={dy} r={34} fill={C.warm} opacity={0.25} /></>}
      </svg>
      {nodes.map((x, i) => { const [px, py] = pt(-90 + (i * 360) / n), p = prog(t, at + i * 0.35, 0.45);
        return <div key={i} style={{ position: 'absolute', left: px, top: py, transform: `translate(-50%, -50%) scale(${mix(0.5, 1, p)})`, opacity: p, background: C.surface, border: `3px solid ${C.line}`, borderRadius: 60, padding: '14px 38px', fontSize: 44, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{x}</div>; })}
      {center && <div style={{ position: 'absolute', left: 0, right: 0, top: cy - 44, textAlign: 'center', fontSize: 64, fontWeight: 900, color: C.warm, opacity: prog(t, at + 0.4 + n * 0.35, 0.5) }}>{center}</div>}
    </div>
  );
};
/** 关系网：一个中心，连线伸向周围几个节点。讲「它和谁有关系」「供应链」「投资版图」。 */
export const NetworkGraph: React.FC<{ center: string; nodes: { name: string; at: number; note?: string; hot?: boolean }[]; at: number; width?: number; height?: number }> = ({ center, nodes, at, width = 1500, height = 640 }) => {
  const t = useT(), cx = width / 2, cy = height / 2, rx = width / 2 - 190, ry = height / 2 - 70, n = nodes.length, pos = (i: number) => { const a = ((-90 + (i * 360) / n + (n % 2 ? 0 : 180 / n)) * Math.PI) / 180; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; }, p0 = prog(t, at, 0.5);
  return (
    <div style={{ position: 'relative', width, height, fontFamily: FONT }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>{nodes.map((d, i) => { const [x, y] = pos(i), p = inOut((t - d.at + 0.4) / 0.5); return <line key={i} x1={cx} y1={cy} x2={mix(cx, x, p)} y2={mix(cy, y, p)} stroke={d.hot ? C.warm : C.line} strokeWidth={d.hot ? 6 : 4} strokeDasharray={d.hot ? undefined : '4 10'} />; })}</svg>
      {nodes.map((d, i) => { const [x, y] = pos(i), p = prog(t, d.at, 0.4);
        return <div key={i} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%, -50%) scale(${mix(0.4, 1, p)})`, opacity: p, background: C.surface, border: `3px solid ${d.hot ? C.warm : C.line}`, borderRadius: 20, padding: '12px 30px', textAlign: 'center' }}><div style={{ fontSize: 40, fontWeight: 900, color: d.hot ? C.warm : C.text, whiteSpace: 'nowrap' }}>{d.name}</div>{d.note && <div style={{ fontSize: 24, color: C.muted, whiteSpace: 'nowrap' }}>{d.note}</div>}</div>; })}
      <div style={{ position: 'absolute', left: cx, top: cy, transform: `translate(-50%, -50%) scale(${mix(0.3, 1, p0)})`, opacity: p0, width: 220, height: 220, borderRadius: 110, background: C.accent, boxShadow: `0 0 0 18px ${C.accent}33, 0 0 90px ${C.accent}66`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 50, fontWeight: 900, color: '#0B0E14', textAlign: 'center', lineHeight: 1.15 }}>{center}</div>
    </div>
  );
};
/** 资金流向：左边一笔钱，分成几股粗细不同的带子流向右边各处。讲「钱去哪了」。 */
export const MoneyFlow: React.FC<{ source: { name: string; text: string }; outs: { name: string; v: number; text: string; color?: string; at: number }[]; at: number; width?: number; height?: number }> = ({ source, outs, at, width = 1500, height = 560 }) => {
  const t = useT(), id = useUid(), total = outs.reduce((s, o) => s + o.v, 0), gap = 30, k = (height - gap * (outs.length - 1)) / total, lh = total * k, ly = (height - lh) / 2, xl = 330, xr = width - 420, xm = (xl + xr) / 2; let la = ly, ra = 0;
  return (
    <div style={{ position: 'relative', width, height, fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: 0, width: xl - 60, top: height / 2 - 70, textAlign: 'right', opacity: prog(t, at, 0.5) }}><div style={{ fontSize: 40, color: C.muted }}>{source.name}</div><div style={{ fontSize: 76, fontWeight: 900, color: C.text, lineHeight: 1.1, whiteSpace: 'nowrap' }}>{source.text}</div></div>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <rect x={xl - 34} y={ly} width={34} height={lh * prog(t, at, 0.6)} fill={C.text} rx={6} />
        {outs.map((o, i) => { const h = o.v * k, ya = la, yb = ra, col = o.color ?? PAL[i % PAL.length], p = inOut((t - o.at) / 0.9); la += h; ra += h + gap;
          return <g key={i}><defs><clipPath id={`${id}${i}`}><rect x={xl} y={0} width={(xr - xl + 40) * p} height={height} /></clipPath></defs>
            <g clipPath={`url(#${id}${i})`}><path d={`M${xl} ${ya} C${xm} ${ya} ${xm} ${yb} ${xr} ${yb} L${xr} ${yb + h} C${xm} ${yb + h} ${xm} ${ya + h} ${xl} ${ya + h} Z`} fill={col} opacity={0.5} /><rect x={xr} y={yb} width={34} height={h} fill={col} rx={6} /></g></g>; })}
      </svg>
      {(() => { let y = 0; return outs.map((o, i) => { const h = o.v * k, top = y, col = o.color ?? PAL[i % PAL.length], p = prog(t, o.at + 0.6, 0.4); y += h + gap;
        return <div key={i} style={{ position: 'absolute', left: xr + 60, top: top + h / 2 - 44, opacity: p, transform: `translateX(${mix(-20, 0, p)}px)`, whiteSpace: 'nowrap' }}><div style={{ fontSize: 34, color: C.text }}>{o.name}</div><div style={{ fontSize: 50, fontWeight: 900, color: col, lineHeight: 1.1 }}>{o.text}</div></div>; }); })()}
    </div>
  );
};
/** 金字塔：自下而上一层层垒起来，右边标每层是什么。讲「层级」「少数人在塔尖」。 */
export const Pyramid: React.FC<{ layers: { name: string; note?: string }[]; ats: number[]; width?: number; layerH?: number }> = ({ layers, ats, width = 760, layerH = 124 }) => {
  const t = useT(), n = layers.length;
  return (
    <div style={{ position: 'relative', width: width + 560, height: n * (layerH + 8), fontFamily: FONT }}>
      {layers.map((l, i) => { const p = prog(t, ats[i], 0.5), tw = (i / n) * 100, bw = ((i + 1) / n) * 100, col = PAL[i % PAL.length], y = i * (layerH + 8), edge = width / 2 + (((i + 0.5) / n) * width) / 2;
        return <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: 0, top: y, width, height: layerH, background: `linear-gradient(180deg, ${col}, ${col}aa)`, clipPath: `polygon(${50 - tw / 2}% 0, ${50 + tw / 2}% 0, ${50 + bw / 2}% 100%, ${50 - bw / 2}% 100%)`, opacity: p, transform: `translateY(${mix(-50, 0, p)}px)` }} />
          <div style={{ position: 'absolute', left: edge + 16, top: y + layerH / 2 - 1.5, width: (width + 30 - edge - 16) * prog(t, ats[i] + 0.25, 0.3), height: 3, background: col }} />
          <div style={{ position: 'absolute', left: width + 46, top: y + layerH / 2 - (l.note ? 44 : 30), opacity: prog(t, ats[i] + 0.4, 0.35), whiteSpace: 'nowrap' }}><div style={{ fontSize: 46, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{l.name}</div>{l.note && <div style={{ fontSize: 28, color: C.muted }}>{l.note}</div>}</div>
        </React.Fragment>; })}
    </div>
  );
};
/** 交集：两个圆从两边靠拢，重叠出中间那一块。讲「两件事的共同点」「同时满足的人」。 */
export const Venn: React.FC<{ a: string; b: string; both: string; at: number; mergeAt: number; r?: number }> = ({ a, b, both, at, mergeAt, r = 250 }) => {
  const t = useT(), p = prog(t, at, 0.5), k = inOut((t - mergeAt) / 0.9), d = mix(r + 60, r * 0.58, k), W = r * 4 + 200, cx = W / 2, q = prog(t, mergeAt + 0.7, 0.4);
  const circle = (x: number, col: string) => <div style={{ position: 'absolute', left: x - r, top: 0, width: r * 2, height: r * 2, borderRadius: r, background: `${col}55`, border: `5px solid ${col}`, boxSizing: 'border-box', mixBlendMode: 'screen' }} />;
  return (
    <div style={{ position: 'relative', width: W, height: r * 2, fontFamily: FONT, opacity: p }}>
      {circle(cx - d, C.accent)}{circle(cx + d, C.warm)}
      <div style={{ position: 'absolute', left: cx - d - r * 0.62, top: r - 34, transform: 'translateX(-50%)', fontSize: 50, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{a}</div>
      <div style={{ position: 'absolute', left: cx + d + r * 0.62, top: r - 34, transform: 'translateX(-50%)', fontSize: 50, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{b}</div>
      <div style={{ position: 'absolute', left: cx, top: r - 40, transform: `translateX(-50%) scale(${mix(0.5, 1, q)})`, opacity: q, fontSize: 58, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap', textShadow: '0 4px 20px rgba(0,0,0,.6)' }}>{both}</div>
    </div>
  );
};
/** 竖向时间线：一条竖线往下长，节点一个个挂上去。比横向里程碑能放更多字。 */
export const VTimeline: React.FC<{ items: { when: string; title: string; note?: string }[]; ats: number[]; width?: number; rowH?: number }> = ({ items, ats, width = 1200, rowH = 140 }) => {
  const t = useT(); let f = 0; ats.forEach((a) => { f += inOut((t - a + 0.3) / 0.5); }); let act = -1; ats.forEach((a, i) => { if (t >= a) act = i; });
  return (
    <div style={{ position: 'relative', width, height: items.length * rowH, fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: 258, top: 20, width: 5, height: Math.max(0, (f - 0.5) * rowH + 30), background: C.line, borderRadius: 3 }} />
      {items.map((it, i) => { const p = prog(t, ats[i], 0.45), me = i === act;
        return <div key={i} style={{ position: 'absolute', left: 0, top: i * rowH, height: rowH, width, display: 'flex', alignItems: 'flex-start', opacity: p * (me ? 1 : 0.55) }}>
          <div style={{ width: 220, textAlign: 'right', fontSize: 44, fontWeight: 900, color: me ? C.warm : C.muted, lineHeight: '64px', whiteSpace: 'nowrap' }}>{it.when}</div>
          <div style={{ width: 80, display: 'flex', justifyContent: 'center', paddingTop: 18 }}><div style={{ width: 28, height: 28, borderRadius: 14, background: me ? C.warm : C.muted, boxShadow: me ? `0 0 0 10px ${C.warm}33` : 'none', transform: `scale(${mix(0.2, 1, p)})` }} /></div>
          <div style={{ transform: `translateX(${mix(30, 0, p)}px)` }}><div style={{ fontSize: 50, fontWeight: 900, color: C.text, lineHeight: '64px' }}>{it.title}</div>{it.note && <div style={{ fontSize: 30, color: C.muted }}>{it.note}</div>}</div>
        </div>; })}
    </div>
  );
};
/** 天平：两边各放一样东西，天平往重的一边倾。讲「权衡」「哪边更重」。 */
export const BalanceScale: React.FC<{ left: { name: string; text?: string }; right: { name: string; text?: string }; tilt: number; at: number; tiltAt: number; width?: number }> = ({ left, right, tilt, at, tiltAt, width = 1300 }) => {
  const t = useT(), p = prog(t, at, 0.5), e = t - tiltAt, k = e < 0 ? 0 : 1 - Math.exp(-3.2 * e) * Math.cos(5.5 * e), ang = (tilt * 11 * k * Math.PI) / 180, H = 620, cx = width / 2, cy = 110, L = width / 2 - 230;
  const lx = cx - L * Math.cos(ang), lyy = cy - L * Math.sin(ang), rx = cx + L * Math.cos(ang), ry = cy + L * Math.sin(ang);
  const pan = (x: number, y: number, s: { name: string; text?: string }, col: string) => <div style={{ position: 'absolute', left: x - 200, top: y + 150, width: 400, boxSizing: 'border-box', background: C.surface, border: `3px solid ${col}`, borderRadius: 22, padding: '24px 20px', textAlign: 'center' }}><div style={{ fontSize: 50, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{s.name}</div>{s.text && <div style={{ fontSize: 34, fontWeight: 900, color: col }}>{s.text}</div>}</div>;
  return (
    <div style={{ position: 'relative', width, height: H, fontFamily: FONT, opacity: p }}>
      <svg width={width} height={H} style={{ position: 'absolute', inset: 0 }}>
        <path d={`M${cx} ${cy} L${cx - 70} ${H - 30} L${cx + 70} ${H - 30} Z`} fill={C.line} /><rect x={cx - 190} y={H - 34} width={380} height={14} rx={7} fill={C.line} />
        <line x1={lx} y1={lyy} x2={rx} y2={ry} stroke={C.text} strokeWidth={12} strokeLinecap="round" /><circle cx={cx} cy={cy} r={22} fill={C.text} />
        {[[lx, lyy], [rx, ry]].map(([x, y], i) => <g key={i}><line x1={x} y1={y} x2={x - 150} y2={y + 150} stroke={C.muted} strokeWidth={4} /><line x1={x} y1={y} x2={x + 150} y2={y + 150} stroke={C.muted} strokeWidth={4} /></g>)}
      </svg>
      {pan(lx, lyy, left, C.accent)}{pan(rx, ry, right, C.warm)}
    </div>
  );
};
/** 拔河：一根绳子两头各一方，中间的旗子被拉向占上风的一边。讲「博弈」「此消彼长」。 */
export const TugOfWar: React.FC<{ left: string; right: string; stops: { v: number; at: number; dur?: number }[]; at: number; width?: number; note?: string }> = ({ left, right, stops, at, width = 1500, note }) => {
  const t = useT(), p = prog(t, at, 0.5); let v = 0; stops.forEach((s) => { v = mix(v, s.v, inOut((t - s.at) / (s.dur ?? 0.9))); });
  const half = width / 2 - 260, x = width / 2 + v * half, jit = Math.sin(t * 9) * 4;
  return (
    <div style={{ position: 'relative', width, height: 380, fontFamily: FONT, opacity: p }}>
      <div style={{ position: 'absolute', left: width / 2 - 2, top: 60, width: 4, height: 230, background: `repeating-linear-gradient(180deg, ${C.muted} 0 14px, transparent 14px 26px)` }} />
      <div style={{ position: 'absolute', left: 230, right: 230, top: 170, height: 14, borderRadius: 7, background: `repeating-linear-gradient(110deg, #C9B38A 0 16px, #8F7B55 16px 32px)`, transform: `translateX(${jit}px)` }} />
      <div style={{ position: 'absolute', left: x - 5 + jit, top: 60, width: 10, height: 124, background: C.text, borderRadius: 5 }}><div style={{ position: 'absolute', left: v < 0 ? -110 : 10, top: 0, width: 110, height: 70, background: v < -0.05 ? C.accent : v > 0.05 ? C.warm : C.muted, clipPath: v < 0 ? 'polygon(100% 0, 0 50%, 100% 100%)' : 'polygon(0 0, 100% 50%, 0 100%)' }} /></div>
      <div style={{ position: 'absolute', left: 0, top: 136, width: 210, textAlign: 'center', fontSize: 60, fontWeight: 900, color: C.accent, transform: `scale(${mix(1, 1.2, cl(-v))})`, whiteSpace: 'nowrap' }}>{left}</div>
      <div style={{ position: 'absolute', right: 0, top: 136, width: 210, textAlign: 'center', fontSize: 60, fontWeight: 900, color: C.warm, transform: `scale(${mix(1, 1.2, cl(v))})`, whiteSpace: 'nowrap' }}>{right}</div>
      {note && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, textAlign: 'center', fontSize: 34, color: C.muted }}>{note}</div>}
    </div>
  );
};
/** 分层堆叠：几块板子从上面落下来一层层叠好，右边标每层是什么。讲「技术栈」「产业链上下游」。 */
export const LayerStack: React.FC<{ layers: { name: string; note?: string; color?: string }[]; ats: number[]; plate?: number }> = ({ layers, ats, plate = 400 }) => {
  const t = useT(), n = layers.length, gap = 96, H = plate * 0.62 + (n - 1) * gap + 60, base = H - plate * 0.82;
  return (
    <div style={{ position: 'relative', width: plate * 1.5 + 640, height: H, fontFamily: FONT }}>
      {layers.map((l, i) => { const p = prog(t, ats[i], 0.55), col = l.color ?? PAL[i % PAL.length], y = base - i * gap;
        return <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: plate * 0.25, top: y - (1 - p) * 220, width: plate, height: plate, opacity: p, transform: 'rotateX(60deg) rotateZ(-45deg)', background: `linear-gradient(135deg, ${col}, ${col}99)`, borderRadius: 34, border: '4px solid rgba(255,255,255,.35)', boxSizing: 'border-box', boxShadow: `-14px 14px 0 ${col}55, -40px 40px 60px rgba(0,0,0,.45)` }} />
          <div style={{ position: 'absolute', left: plate * 1.36, top: y + plate / 2 - 2, width: 120 * prog(t, ats[i] + 0.35, 0.3), height: 4, background: col }} />
          <div style={{ position: 'absolute', left: plate * 1.36 + 140, top: y + plate / 2 - (l.note ? 46 : 30), opacity: prog(t, ats[i] + 0.5, 0.35), whiteSpace: 'nowrap' }}><div style={{ fontSize: 48, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{l.name}</div>{l.note && <div style={{ fontSize: 28, color: C.muted }}>{l.note}</div>}</div>
        </React.Fragment>; })}
    </div>
  );
};
/** 台阶：一级比一级高的台阶，一个光点一级级跳上去。讲「升级」「几个阶段」。 */
export const Ladder: React.FC<{ steps: { name: string; value?: string }[]; ats: number[]; stepW?: number; stepH?: number }> = ({ steps, ats, stepW = 300, stepH = 96 }) => {
  const t = useT(), n = steps.length, H = n * stepH + 150; let f = 0; ats.forEach((a) => { f += inOut((t - a) / 0.5); }); const pos = Math.max(0, f - 1), i0 = Math.floor(pos), k = pos - i0, hop = Math.sin(k * Math.PI) * 70;
  return (
    <div style={{ position: 'relative', width: n * stepW, height: H, fontFamily: FONT }}>
      {steps.map((s, i) => { const p = prog(t, ats[i], 0.5), h = (i + 1) * stepH, done = f >= i + 0.99;
        return <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: i * stepW, bottom: 0, width: stepW - 8, height: h * p, background: `linear-gradient(180deg, ${C.accent}${done ? 'ee' : '66'}, ${C.accent}22)`, borderTop: `6px solid ${done ? C.warm : C.accent}`, borderRadius: '10px 10px 0 0', boxSizing: 'border-box' }} />
          <div style={{ position: 'absolute', left: i * stepW, width: stepW - 8, bottom: 14, textAlign: 'center', opacity: prog(t, ats[i] + 0.3, 0.3) }}><div style={{ fontSize: 38, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{s.name}</div>{s.value && <div style={{ fontSize: 28, color: C.warm, fontWeight: 900 }}>{s.value}</div>}</div>
        </React.Fragment>; })}
      {f > 0.5 && <div style={{ position: 'absolute', left: (Math.min(n - 1, pos) + 0.5) * stepW - 26, bottom: (Math.min(n - 1, pos) + 1) * stepH + 14 + hop, width: 44, height: 44, borderRadius: 22, background: C.warm, boxShadow: `0 0 0 12px ${C.warm}33, 0 0 50px ${C.warm}` }} />}
    </div>
  );
};
/** 分叉：一个起点向右分出几条路，每条路一个去向。讲「几种可能」「几个选择」。 */
export const Branch: React.FC<{ root: string; branches: { name: string; note?: string; at: number; hot?: boolean }[]; at: number; width?: number; rowH?: number }> = ({ root, branches, at, width = 1400, rowH = 150 }) => {
  const t = useT(), n = branches.length, H = n * rowH, x0 = 360, x1 = 700, p0 = prog(t, at, 0.5);
  return (
    <div style={{ position: 'relative', width, height: H, fontFamily: FONT }}>
      <svg width={width} height={H} style={{ position: 'absolute', inset: 0 }}>{branches.map((b, i) => { const y = i * rowH + rowH / 2, xm = (x0 + x1) / 2; return <path key={i} d={`M${x0} ${H / 2} C${xm} ${H / 2} ${xm} ${y} ${x1 - 10} ${y}`} fill="none" stroke={b.hot ? C.warm : C.muted} strokeWidth={b.hot ? 7 : 4} {...draw(inOut((t - b.at + 0.45) / 0.5))} />; })}</svg>
      <div style={{ position: 'absolute', left: 0, top: H / 2 - 70, width: x0, height: 140, boxSizing: 'border-box', background: C.accent, borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 54, fontWeight: 900, color: '#0B0E14', opacity: p0, transform: `scale(${mix(0.8, 1, p0)})`, whiteSpace: 'nowrap' }}>{root}</div>
      {branches.map((b, i) => { const p = prog(t, b.at, 0.4);
        return <div key={i} style={{ position: 'absolute', left: x1, top: i * rowH + 14, height: rowH - 28, right: 0, boxSizing: 'border-box', background: C.surface, border: `3px solid ${b.hot ? C.warm : C.line}`, borderRadius: 20, padding: '0 36px', display: 'flex', alignItems: 'center', gap: 26, opacity: p, transform: `translateX(${mix(-30, 0, p)}px)` }}><div style={{ fontSize: 48, fontWeight: 900, color: b.hot ? C.warm : C.text, whiteSpace: 'nowrap' }}>{b.name}</div>{b.note && <div style={{ fontSize: 30, color: C.muted, whiteSpace: 'nowrap' }}>{b.note}</div>}</div>; })}
    </div>
  );
};
/** 冰山：水面上一小块是看得见的，水面下一大块是看不见的。讲「表面原因和真正原因」。 */
export const Iceberg: React.FC<{ above: string[]; below: string[]; at: number; diveAt: number; width?: number; tags?: [string, string] }> = ({ above, below, at, diveAt, width = 1500, tags = ['看得见的', '看不见的'] }) => {
  const t = useT(), p = prog(t, at, 0.6), k = prog(t, diveAt, 0.7), H = 640, wl = 200, bob = Math.sin(t * 1.3) * 5;
  return (
    <div style={{ position: 'relative', width, height: H, fontFamily: FONT, opacity: p }}>
      <svg width={width} height={H} style={{ position: 'absolute', inset: 0 }}>
        <g transform={`translate(0 ${bob})`}><path d={`M250 ${wl} L330 60 L400 110 L450 40 L540 ${wl} Z`} fill="#DCE9FF" /><path d={`M170 ${wl} L620 ${wl} L690 330 L600 470 L470 600 L330 560 L210 440 L130 300 Z`} fill="#7FB0FF" opacity={mix(0.18, 0.85, k)} /></g>
        <rect x={0} y={wl} width={width} height={H - wl} fill="#1B4FA8" opacity={0.2} /><line x1={0} x2={width} y1={wl} y2={wl} stroke="#7FB0FF" strokeWidth={4} strokeDasharray="18 12" />
      </svg>
      <div style={{ position: 'absolute', left: 780, top: 20 }}><div style={{ fontSize: 30, fontWeight: 900, color: C.muted, marginBottom: 6 }}>{tags[0]}</div>{above.map((x, i) => <div key={i} style={{ fontSize: 50, fontWeight: 900, color: C.text, lineHeight: 1.35, opacity: prog(t, at + 0.5 + i * 0.3, 0.4) }}>{x}</div>)}</div>
      <div style={{ position: 'absolute', left: 780, top: wl + 34 }}><div style={{ fontSize: 30, fontWeight: 900, color: '#7FB0FF', marginBottom: 6, opacity: k }}>{tags[1]}</div>{below.map((x, i) => { const q = prog(t, diveAt + 0.3 + i * 0.35, 0.4); return <div key={i} style={{ fontSize: 54, fontWeight: 900, color: C.warm, lineHeight: 1.4, opacity: q, transform: `translateY(${mix(20, 0, q)}px)` }}>{x}</div>; })}</div>
    </div>
  );
};
/** 路线图：一条弯路画出来，沿途几个站点依次亮起。讲「接下来的计划」「一路经过了什么」。 */
export const Roadmap: React.FC<{ stops: { name: string; note?: string; at: number }[]; width?: number; height?: number }> = ({ stops, width = 1600, height = 460 }) => {
  const t = useT(), id = useUid(), n = stops.length, A = 80, Y = (x: number) => height / 2 + A * Math.sin((x / width) * Math.PI * 2), pts = Array.from({ length: 81 }).map((_, i) => { const x = (i / 80) * width; return `${i ? 'L' : 'M'}${x} ${Y(x)}`; }).join(' ');
  let s = 0; stops.forEach((st) => { s += inOut((t - st.at + 0.6) / 0.6); }); const F = cl((s - 0.5) / n + (0.5 / n) * prog(t, stops[n - 1].at + 0.5, 0.8));
  return (
    <div style={{ position: 'relative', width, height, fontFamily: FONT, opacity: prog(t, stops[0].at - 0.9, 0.4) }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}><defs><clipPath id={id}><rect x={0} y={0} width={F * width} height={height} /></clipPath></defs>
        <path d={pts} fill="none" stroke={C.line} strokeWidth={36} strokeLinecap="round" /><path d={pts} fill="none" stroke={C.accent} strokeWidth={36} strokeLinecap="round" clipPath={`url(#${id})`} /><path d={pts} fill="none" stroke="rgba(255,255,255,.5)" strokeWidth={3} strokeDasharray="22 22" /></svg>
      {stops.map((st, i) => { const x = ((i + 0.5) / n) * width, y = Y(x), p = prog(t, st.at, 0.4), up = i % 2 === 0;
        return <React.Fragment key={i}>
          <div style={{ position: 'absolute', left: x - 26, top: y - 26, width: 52, height: 52, borderRadius: 26, background: C.bg, border: `8px solid ${C.warm}`, boxSizing: 'border-box', transform: `scale(${mix(0.2, 1, p)})`, opacity: p }} />
          <div style={{ position: 'absolute', left: x, top: up ? y - 150 : y + 50, transform: `translateX(-50%) translateY(${mix(up ? 20 : -20, 0, p)}px)`, textAlign: 'center', opacity: p, whiteSpace: 'nowrap' }}><div style={{ fontSize: 46, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{st.name}</div>{st.note && <div style={{ fontSize: 28, color: C.muted }}>{st.note}</div>}</div>
        </React.Fragment>; })}
    </div>
  );
};
