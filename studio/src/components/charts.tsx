// 数据图表类组件：折线、柱、占比、排名、瀑布、仪表、漏斗、表格…… 数字一律由调用方给，组件不造数。
import React from 'react';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';

export const PAL = [C.accent, C.warm, '#3DD6C6', '#B48CFF', C.down, '#4ADE80'];
const cl = (v: number) => Math.max(0, Math.min(1, v));
const useUid = () => 'u' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
const fmt = (v: number) => (Math.abs(v) >= 100 || Number.isInteger(v) ? Math.round(v).toLocaleString('en-US') : v.toFixed(1));

/** 折线图：一条线从左画到右，线头带着当前数值走；可以在某个点上钉一个注释。 */
export const LineChart: React.FC<{ data: { x: string; y: number }[]; at: number; dur?: number; width?: number; height?: number; color?: string; unit?: string; title?: string; mark?: { i: number; text: string } }> = ({ data, at, dur = 2.2, width = 1300, height = 540, color = C.accent, unit = '', title, mark }) => {
  const t = useT(), id = useUid(), p = inOut((t - at) / dur), a = prog(t, at - 0.3, 0.4), n = data.length;
  const pl = 100, pr = 170, pt = 30, pb = 64, W = width - pl - pr, H = height - pt - pb;
  const ys = data.map((d) => d.y), lo = Math.min(...ys), hi = Math.max(...ys), pad = (hi - lo) * 0.15 || 1, y0 = lo - pad, y1 = hi + pad;
  const X = (i: number) => pl + (i / (n - 1)) * W, Y = (v: number) => pt + (1 - (v - y0) / (y1 - y0)) * H;
  const d = data.map((q, i) => `${i ? 'L' : 'M'}${X(i)} ${Y(q.y)}`).join(' ');
  const f = p * (n - 1), i0 = Math.min(n - 2, Math.floor(f)), hv = mix(data[i0].y, data[i0 + 1].y, f - i0), hx = pl + p * W, hy = Y(hv);
  const every = n > 8 ? Math.ceil(n / 6) : 1, mp = mark ? prog(t, at + (mark.i / (n - 1)) * dur, 0.35) : 0;
  return (
    <div style={{ width, opacity: a, fontFamily: FONT }}>
      {title && <div style={{ fontSize: 40, fontWeight: 900, color: C.text, marginLeft: pl, marginBottom: 6 }}>{title}</div>}
      <svg width={width} height={height}>
        <defs><clipPath id={id}><rect x={0} y={0} width={hx} height={height} /></clipPath><linearGradient id={id + 'g'} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".35" /><stop offset="1" stopColor={color} stopOpacity="0" /></linearGradient></defs>
        {[0, 1, 2, 3].map((i) => { const v = y0 + ((y1 - y0) * i) / 3; return <g key={i}><line x1={pl} x2={pl + W} y1={Y(v)} y2={Y(v)} stroke={C.line} strokeWidth={2} /><text x={pl - 16} y={Y(v) + 9} textAnchor="end" fontSize={26} fill={C.muted}>{fmt(v)}</text></g>; })}
        {data.map((q, i) => (i % every === 0 || i === n - 1) && <text key={i} x={X(i)} y={height - 18} textAnchor="middle" fontSize={26} fill={C.muted}>{q.x}</text>)}
        <g clipPath={`url(#${id})`}><path d={`${d} L${X(n - 1)} ${pt + H} L${pl} ${pt + H} Z`} fill={`url(#${id}g)`} /><path d={d} fill="none" stroke={color} strokeWidth={7} strokeLinejoin="round" strokeLinecap="round" /></g>
        {mark && mp > 0 && <g opacity={mp}><line x1={X(mark.i)} x2={X(mark.i)} y1={Y(data[mark.i].y) - 14} y2={Y(data[mark.i].y) - 70} stroke={C.warm} strokeWidth={3} /><circle cx={X(mark.i)} cy={Y(data[mark.i].y)} r={11} fill={C.bg} stroke={C.warm} strokeWidth={5} /><text x={X(mark.i)} y={Y(data[mark.i].y) - 84} textAnchor="middle" fontSize={32} fontWeight={900} fill={C.warm}>{mark.text}</text></g>}
        <circle cx={hx} cy={hy} r={12} fill={color} /><circle cx={hx} cy={hy} r={24} fill={color} opacity={0.25} />
        <text x={hx + 30} y={hy + 16} fontSize={48} fontWeight={900} fill={C.text}>{fmt(hv)}<tspan fontSize={28} fill={C.muted}> {unit}</tspan></text>
      </svg>
    </div>
  );
};
/** 柱状图：几根柱子依次长出来，可以把其中一根标成重点。 */
export const ColumnChart: React.FC<{ data: { x: string; y: number; text?: string }[]; at: number; hi?: number; width?: number; height?: number; color?: string }> = ({ data, at, hi, width = 1200, height = 520, color = C.accent }) => {
  const t = useT(), max = Math.max(...data.map((d) => d.y)), bh = height - 130;
  return (
    <div style={{ width, height, display: 'flex', alignItems: 'flex-end', gap: 28, fontFamily: FONT, borderBottom: `3px solid ${C.line}`, boxSizing: 'border-box', paddingBottom: 0, position: 'relative' }}>
      {data.map((d, i) => { const p = prog(t, at + i * 0.14, 0.7), me = i === hi, col = me ? C.warm : color;
        return <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%', opacity: hi === undefined || me ? 1 : 0.6 }}>
          <div style={{ fontSize: me ? 44 : 32, fontWeight: 900, color: me ? C.warm : C.text, opacity: prog(t, at + i * 0.14 + 0.4, 0.3), marginBottom: 8 }}>{d.text ?? fmt(d.y)}</div>
          <div style={{ width: '100%', height: (d.y / max) * bh * p, background: `linear-gradient(180deg, ${col}, ${col}55)`, borderRadius: '12px 12px 0 0' }} />
          <div style={{ position: 'absolute', bottom: -50, fontSize: 28, color: me ? C.text : C.muted, fontWeight: me ? 900 : 500 }}>{d.x}</div>
        </div>; })}
    </div>
  );
};
/** 构成条：一根长条按比例切成几段，说明「钱从哪来」「人分几类」。 */
export const StackedBar: React.FC<{ parts: { name: string; v: number; color?: string }[]; at: number; width?: number; title?: string; unit?: string }> = ({ parts, at, width = 1400, title, unit = '%' }) => {
  const t = useT(), total = parts.reduce((s, x) => s + x.v, 0), p = inOut((t - at) / 1.4);
  return (
    <div style={{ width, fontFamily: FONT }}>
      {title && <div style={{ fontSize: 44, fontWeight: 900, color: C.text, marginBottom: 22, opacity: prog(t, at - 0.2, 0.4) }}>{title}</div>}
      <div style={{ width: width * p, height: 120, borderRadius: 18, overflow: 'hidden' }}><div style={{ width, height: '100%', display: 'flex' }}>{parts.map((x, i) => <div key={i} style={{ width: `${(x.v / total) * 100}%`, background: x.color ?? PAL[i % PAL.length], borderRight: `4px solid ${C.bg}`, boxSizing: 'border-box' }} />)}</div></div>
      <div style={{ display: 'flex', marginTop: 20 }}>{parts.map((x, i) => { const q = prog(t, at + 0.5 + i * 0.28, 0.4);
        return <div key={i} style={{ width: `${(x.v / total) * 100}%`, opacity: q, transform: `translateY(${mix(16, 0, q)}px)`, boxSizing: 'border-box', paddingRight: 10 }}><div style={{ fontSize: 56, fontWeight: 900, color: x.color ?? PAL[i % PAL.length], lineHeight: 1.1 }}>{fmt(unit === '%' ? (x.v / total) * 100 : x.v)}<span style={{ fontSize: 28 }}>{unit}</span></div><div style={{ fontSize: 30, color: C.text, whiteSpace: 'nowrap' }}>{x.name}</div></div>; })}</div>
    </div>
  );
};
/** 环形构成：一个圆环分成几段，旁边带图例；中间可以放一个总数。 */
export const Donut: React.FC<{ parts: { name: string; v: number; color?: string }[]; at: number; size?: number; center?: { value: string; label: string } }> = ({ parts, at, size = 480, center }) => {
  const t = useT(), total = parts.reduce((s, x) => s + x.v, 0), p = inOut((t - at) / 1.6), r = size / 2 - 46, c = 2 * Math.PI * r; let acc = 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 80, fontFamily: FONT }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={70} />
          {parts.map((x, i) => { const st = acc / total; acc += x.v; const len = cl((p - st) / (x.v / total)) * (x.v / total) * c; return <circle key={i} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={x.color ?? PAL[i % PAL.length]} strokeWidth={70} strokeDasharray={`${Math.max(0, len - 5)} ${c}`} strokeDashoffset={-st * c} />; })}</svg>
        {center && <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: prog(t, at + 0.4, 0.5) }}><div style={{ fontSize: 76, fontWeight: 900, color: C.text, lineHeight: 1 }}>{center.value}</div><div style={{ fontSize: 28, color: C.muted, marginTop: 8 }}>{center.label}</div></div>}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>{parts.map((x, i) => { const q = prog(t, at + 0.5 + i * 0.25, 0.4);
        return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 20, opacity: q, transform: `translateX(${mix(24, 0, q)}px)` }}><div style={{ width: 30, height: 30, borderRadius: 8, background: x.color ?? PAL[i % PAL.length] }} /><div style={{ fontSize: 38, color: C.text, width: 260 }}>{x.name}</div><div style={{ fontSize: 50, fontWeight: 900, color: C.text }}>{fmt((x.v / total) * 100)}<span style={{ fontSize: 26, color: C.muted }}>%</span></div></div>; })}</div>
    </div>
  );
};
/** 排名赛跑：几根横条随时间此消彼长，名次变了就上下换位。讲「谁超过了谁」。 */
export const BarRace: React.FC<{ names: string[]; frames: { label: string; values: number[] }[]; at: number; ats: number[]; dur?: number; width?: number; unit?: string }> = ({ names, frames, at, ats, dur = 1.1, width = 1300, unit = '' }) => {
  const t = useT(); let f = 0; ats.forEach((a) => { f += inOut((t - a) / dur); });
  const i0 = Math.min(frames.length - 2, Math.floor(f)), k = cl(f - i0), rank = (fr: number) => { const o = names.map((_, j) => j).sort((x, y) => frames[fr].values[y] - frames[fr].values[x]); const r: number[] = []; o.forEach((j, pos) => { r[j] = pos; }); return r; };
  const r0 = rank(i0), r1 = rank(i0 + 1), vals = names.map((_, j) => mix(frames[i0].values[j], frames[i0 + 1].values[j], k)), max = Math.max(...vals), rowH = 92, a = prog(t, at, 0.5), bw = width - 420;
  return (
    <div style={{ position: 'relative', width, height: names.length * rowH, opacity: a, fontFamily: FONT }}>
      {names.map((nm, j) => <div key={j} style={{ position: 'absolute', left: 0, top: mix(r0[j], r1[j], k) * rowH, height: rowH - 18, width, display: 'flex', alignItems: 'center' }}>
        <div style={{ width: 200, textAlign: 'right', paddingRight: 22, fontSize: 36, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', boxSizing: 'border-box' }}>{nm}</div>
        <div style={{ width: Math.max(8, (vals[j] / max) * bw), height: '100%', background: PAL[j % PAL.length], borderRadius: 10 }} /><div style={{ marginLeft: 18, fontSize: 40, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{fmt(vals[j])}<span style={{ fontSize: 24, color: C.muted }}> {unit}</span></div>
      </div>)}
      <div style={{ position: 'absolute', right: 0, bottom: -10, fontSize: 130, fontWeight: 900, color: C.text, opacity: 0.16, lineHeight: 1 }}>{frames[Math.round(f)].label}</div>
    </div>
  );
};
/** 瀑布图：从一个起点出发，一项项加上去、减下来，最后落到终点。讲「利润是怎么被吃掉的」。 */
export const Waterfall: React.FC<{ items: { name: string; v: number; total?: boolean }[]; at: number; width?: number; height?: number }> = ({ items, at, width = 1300, height = 500 }) => {
  const t = useT(); let run = 0; const bars = items.map((it) => { const from = it.total ? 0 : run, to = it.total ? it.v : run + it.v; run = to; return { ...it, lo: Math.min(from, to), hi: Math.max(from, to) }; });
  const max = Math.max(...bars.map((b) => b.hi)), bh = height - 110, k = bh / max;
  return (
    <div style={{ position: 'relative', width, height, display: 'flex', gap: 22, fontFamily: FONT }}>
      {bars.map((b, i) => { const p = prog(t, at + i * 0.4, 0.5), col = b.total ? C.accent : b.v >= 0 ? '#4ADE80' : C.down, h = (b.hi - b.lo) * k * p;
        return <div key={i} style={{ flex: 1, position: 'relative', height: '100%' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 60 + b.lo * k + (b.total || b.v >= 0 ? 0 : (b.hi - b.lo) * k * (1 - p)), height: h, background: col, borderRadius: 8 }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 60 + b.hi * k + 8, textAlign: 'center', fontSize: 34, fontWeight: 900, color: b.total ? C.text : col, opacity: prog(t, at + i * 0.4 + 0.3, 0.3) }}>{b.total ? fmt(b.v) : (b.v > 0 ? '+' : '') + fmt(b.v)}</div>
          <div style={{ position: 'absolute', left: -10, right: -10, bottom: 8, textAlign: 'center', fontSize: 26, color: C.muted, whiteSpace: 'nowrap', opacity: p }}>{b.name}</div>
        </div>; })}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 58, height: 3, background: C.line }} />
    </div>
  );
};
/** 仪表盘：半圆表盘，指针摆到某个位置。讲「热度」「风险」「估值水位」。 */
export const Gauge: React.FC<{ value: number; at: number; label: string; zones?: [string, string, string]; size?: number; text?: string }> = ({ value, at, label, zones = ['低', '中', '高'], size = 640, text }) => {
  const t = useT(), p = inOut((t - at) / 1.5), cx = size / 2, cy = size / 2, r = size / 2 - 50, pt = (deg: number, rr = r) => [cx + rr * Math.cos((deg * Math.PI) / 180), cy + rr * Math.sin((deg * Math.PI) / 180)];
  const arc = (a0: number, a1: number) => { const [x0, y0] = pt(a0), [x1, y1] = pt(a1); return `M${x0} ${y0} A${r} ${r} 0 0 1 ${x1} ${y1}`; }, ang = 180 + 180 * (value / 100) * p, [nx, ny] = pt(ang, r - 60), cols = ['#4ADE80', C.warm, C.down];
  return (
    <div style={{ width: size, fontFamily: FONT, opacity: prog(t, at - 0.3, 0.4) }}>
      <svg width={size} height={size / 2 + 30}>
        {[0, 1, 2].map((i) => <path key={i} d={arc(180 + i * 60 + 1.5, 240 + i * 60 - 1.5)} fill="none" stroke={cols[i]} strokeWidth={46} opacity={ang >= 180 + i * 60 ? 1 : 0.28} />)}
        {zones.map((z, i) => { const [x, y] = pt(210 + i * 60, r - 62); return <text key={i} x={x} y={y + 10} textAnchor="middle" fontSize={28} fill={C.muted}>{z}</text>; })}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={C.text} strokeWidth={10} strokeLinecap="round" /><circle cx={cx} cy={cy} r={22} fill={C.text} />
      </svg>
      <div style={{ textAlign: 'center', marginTop: 4 }}><div style={{ fontSize: 84, fontWeight: 900, color: C.text, lineHeight: 1.1 }}>{text ?? fmt(value * p)}</div><div style={{ fontSize: 32, color: C.muted }}>{label}</div></div>
    </div>
  );
};
/** 指标卡：几张小卡片，每张一个指标、一个涨跌、一条迷你走势。讲「一组经营数据」。 */
export const KpiCards: React.FC<{ items: { label: string; value: string; delta: string; up?: boolean; series: number[]; at: number }[]; cardW?: number }> = ({ items, cardW = 430 }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', gap: 30, fontFamily: FONT }}>
      {items.map((it, i) => { const p = prog(t, it.at, 0.5), lo = Math.min(...it.series), hi = Math.max(...it.series), w = cardW - 72, h = 100, col = it.up === false ? C.down : '#4ADE80';
        const d = it.series.map((v, j) => `${j ? 'L' : 'M'}${(j / (it.series.length - 1)) * w} ${h - 6 - ((v - lo) / (hi - lo || 1)) * (h - 12)}`).join(' ');
        return <div key={i} style={{ width: cardW, background: C.surface, border: `2px solid ${C.line}`, borderRadius: 24, padding: 34, boxSizing: 'border-box', opacity: p, transform: `translateY(${mix(40, 0, p)}px)` }}>
          <div style={{ fontSize: 30, color: C.muted }}>{it.label}</div><div style={{ fontSize: 78, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{it.value}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: col, marginBottom: 14 }}>{it.up === false ? '▼' : '▲'} {it.delta}</div>
          <svg width={w} height={h}><path d={d} fill="none" stroke={col} strokeWidth={5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - inOut((t - it.at - 0.3) / 1.2)} /></svg>
        </div>; })}
    </div>
  );
};
/** 漏斗：一层层变窄。讲「看到的人很多，付钱的人很少」。 */
export const Funnel: React.FC<{ stages: { name: string; v: number; text: string }[]; ats: number[]; width?: number }> = ({ stages, ats, width = 820 }) => {
  const t = useT(), v0 = stages[0].v, rowH = 104;
  return (
    <div style={{ fontFamily: FONT }}>
      {stages.map((s, i) => { const p = prog(t, ats[i], 0.5), tw = (s.v / v0) * 100, bw = ((stages[i + 1]?.v ?? s.v * 0.7) / v0) * 100, col = PAL[i % PAL.length];
        return <div key={i} style={{ display: 'flex', alignItems: 'center', height: rowH, marginBottom: 8, opacity: p, transform: `translateY(${mix(-24, 0, p)}px)` }}>
          <div style={{ width: 260, textAlign: 'right', paddingRight: 30, fontSize: 38, fontWeight: 600, color: C.text, boxSizing: 'border-box', whiteSpace: 'nowrap' }}>{s.name}</div>
          <div style={{ width, height: rowH, background: `linear-gradient(180deg, ${col}, ${col}99)`, clipPath: `polygon(${50 - tw / 2}% 0, ${50 + tw / 2}% 0, ${50 + bw / 2}% 100%, ${50 - bw / 2}% 100%)` }} />
          <div style={{ width: 300, paddingLeft: 30, fontSize: 48, fontWeight: 900, color: col, boxSizing: 'border-box', whiteSpace: 'nowrap' }}>{s.text}</div>
        </div>; })}
    </div>
  );
};
/** 表格高亮：一张表逐行出现，然后其中一行（或一格）被框出来，其余变暗。 */
export const TableHighlight: React.FC<{ head: string[]; rows: string[][]; at: number; hi: { r: number; c?: number }; hiAt: number; width?: number }> = ({ head, rows, at, hi, hiAt, width = 1300 }) => {
  const t = useT(), k = prog(t, hiAt, 0.5), cols = `1.3fr ${head.slice(1).map(() => '1fr').join(' ')}`;
  return (
    <div style={{ width, fontFamily: FONT }}>
      <div style={{ display: 'grid', gridTemplateColumns: cols, padding: '0 30px 14px', borderBottom: `3px solid ${C.line}`, opacity: prog(t, at, 0.4) }}>{head.map((h, i) => <div key={i} style={{ fontSize: 28, color: C.muted, textAlign: i ? 'right' : 'left' }}>{h}</div>)}</div>
      {rows.map((r, i) => { const p = prog(t, at + 0.2 + i * 0.16, 0.4), me = i === hi.r;
        return <div key={i} style={{ display: 'grid', gridTemplateColumns: cols, padding: '20px 30px', marginTop: 8, borderRadius: 14, opacity: p * (me ? 1 : mix(1, 0.35, k)), transform: `translateX(${mix(-24, 0, p)}px) scale(${me ? mix(1, 1.03, k) : 1})`, background: me ? `rgba(255,212,121,${0.14 * k})` : 'transparent', boxShadow: me ? `inset 0 0 0 ${3 * k}px ${C.warm}` : 'none' }}>
          {r.map((c, j) => <div key={j} style={{ fontSize: 40, fontWeight: j === 0 || (me && (hi.c === undefined || hi.c === j)) ? 900 : 500, color: me && hi.c === j ? C.warm : C.text, textAlign: j ? 'right' : 'left', whiteSpace: 'nowrap' }}>{c}</div>)}
        </div>; })}
    </div>
  );
};
/** 斜率图：左右两列数字用线连起来，谁升谁降一眼看出。讲「两个时间点之间的变化」。 */
export const SlopeChart: React.FC<{ labels: [string, string]; rows: { name: string; a: number; b: number }[]; at: number; width?: number; height?: number; unit?: string }> = ({ labels, rows, at, width = 1100, height = 540, unit = '' }) => {
  const t = useT(), all = rows.flatMap((r) => [r.a, r.b]), lo = Math.min(...all), hi = Math.max(...all), xl = 340, xr = width - 240, Y = (v: number) => 80 + (1 - (v - lo) / (hi - lo || 1)) * (height - 130);
  return (
    <div style={{ position: 'relative', width, height, fontFamily: FONT }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        <line x1={xl} x2={xl} y1={60} y2={height - 20} stroke={C.line} strokeWidth={3} /><line x1={xr} x2={xr} y1={60} y2={height - 20} stroke={C.line} strokeWidth={3} />
        <text x={xl} y={36} textAnchor="middle" fontSize={32} fontWeight={900} fill={C.muted}>{labels[0]}</text><text x={xr} y={36} textAnchor="middle" fontSize={32} fontWeight={900} fill={C.muted}>{labels[1]}</text>
        {rows.map((r, i) => { const p = inOut((t - at - 0.3 - i * 0.3) / 0.9), col = r.b >= r.a ? '#4ADE80' : C.down;
          return <g key={i}><circle cx={xl} cy={Y(r.a)} r={11 * prog(t, at + i * 0.3, 0.3)} fill={col} /><line x1={xl} y1={Y(r.a)} x2={mix(xl, xr, p)} y2={mix(Y(r.a), Y(r.b), p)} stroke={col} strokeWidth={6} strokeLinecap="round" /><circle cx={xr} cy={Y(r.b)} r={11 * cl((p - 0.9) * 10)} fill={col} /></g>; })}
      </svg>
      {rows.map((r, i) => { const col = r.b >= r.a ? '#4ADE80' : C.down;
        return <React.Fragment key={i}>
          <div style={{ position: 'absolute', right: width - xl + 26, top: Y(r.a) - 26, fontSize: 34, color: C.text, whiteSpace: 'nowrap', opacity: prog(t, at + i * 0.3, 0.4) }}>{r.name} <b style={{ fontWeight: 900 }}>{fmt(r.a)}{unit}</b></div>
          <div style={{ position: 'absolute', left: xr + 26, top: Y(r.b) - 30, fontSize: 42, fontWeight: 900, color: col, whiteSpace: 'nowrap', opacity: prog(t, at + 1.1 + i * 0.3, 0.4) }}>{fmt(r.b)}{unit}</div>
        </React.Fragment>; })}
    </div>
  );
};
/** 四象限：横竖两条轴分出四块，把几家公司、几种做法摆进去。 */
export const Quadrant: React.FC<{ x: [string, string]; y: [string, string]; dots: { name: string; x: number; y: number; at: number; hot?: boolean }[]; width?: number; height?: number; corners?: [string, string, string, string] }> = ({ x, y, dots, width = 1100, height = 600, corners }) => {
  const t = useT(), a = prog(t, dots[0].at - 0.6, 0.5);
  return (
    <div style={{ position: 'relative', width, height, fontFamily: FONT, opacity: a }}>
      <div style={{ position: 'absolute', left: width / 2 - 1.5, top: 0, width: 3, height, background: C.line }} /><div style={{ position: 'absolute', top: height / 2 - 1.5, left: 0, height: 3, width, background: C.line }} />
      {corners?.map((c, i) => <div key={i} style={{ position: 'absolute', left: i % 2 ? width / 2 + 24 : 24, top: i < 2 ? 18 : height / 2 + 18, fontSize: 28, color: C.muted, opacity: 0.7 }}>{c}</div>)}
      <div style={{ position: 'absolute', left: -150, top: height / 2 - 20, width: 130, textAlign: 'right', fontSize: 28, color: C.muted }}>{x[0]}</div><div style={{ position: 'absolute', left: width + 20, top: height / 2 - 20, fontSize: 28, color: C.muted, whiteSpace: 'nowrap' }}>{x[1]}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: -46, textAlign: 'center', fontSize: 28, color: C.muted }}>{y[1]}</div><div style={{ position: 'absolute', left: 0, right: 0, bottom: -46, textAlign: 'center', fontSize: 28, color: C.muted }}>{y[0]}</div>
      {dots.map((d, i) => { const p = prog(t, d.at, 0.45), col = d.hot ? C.warm : C.accent;
        return <div key={i} style={{ position: 'absolute', left: d.x * width, top: (1 - d.y) * height, transform: `translate(-50%, -50%) scale(${mix(0.3, 1, p)})`, opacity: p, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: d.hot ? 44 : 30, height: d.hot ? 44 : 30, borderRadius: 30, background: col, boxShadow: `0 0 0 ${d.hot ? 14 : 8}px ${col}33` }} /><div style={{ fontSize: d.hot ? 38 : 30, fontWeight: 900, color: d.hot ? C.warm : C.text, marginTop: 14, whiteSpace: 'nowrap' }}>{d.name}</div>
        </div>; })}
    </div>
  );
};
/** 进度条组：几条进度条各自走到自己的位置。讲「完成度」「渗透率」。 */
export const ProgressBars: React.FC<{ rows: { name: string; pct: number; text?: string; at: number; color?: string }[]; width?: number }> = ({ rows, width = 1200 }) => {
  const t = useT();
  return (
    <div style={{ width, display: 'flex', flexDirection: 'column', gap: 40, fontFamily: FONT }}>
      {rows.map((r, i) => { const p = inOut((t - r.at) / 1.1), col = r.color ?? PAL[i % PAL.length];
        return <div key={i} style={{ opacity: prog(t, r.at - 0.2, 0.3) }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}><div style={{ fontSize: 40, fontWeight: 600, color: C.text }}>{r.name}</div><div style={{ fontSize: 52, fontWeight: 900, color: col }}>{r.text ?? `${Math.round(r.pct * p)}%`}</div></div>
          <div style={{ height: 30, borderRadius: 15, background: C.surface, border: `2px solid ${C.line}`, overflow: 'hidden' }}><div style={{ width: `${r.pct * p}%`, height: '100%', background: `linear-gradient(90deg, ${col}88, ${col})`, borderRadius: 15 }} /></div>
        </div>; })}
    </div>
  );
};
/** 热力格：行列交叉的一片格子，颜色越亮数值越大。讲「哪个时段最忙」「哪个品类最热」。 */
export const Heatmap: React.FC<{ rows: string[]; cols: string[]; values: number[][]; at: number; cell?: number; color?: string; hot?: [number, number]; hotAt?: number }> = ({ rows, cols, values, at, cell = 84, color = C.accent, hot, hotAt = 0 }) => {
  const t = useT(), g = 8;
  return (
    <div style={{ fontFamily: FONT }}>
      <div style={{ display: 'flex', marginLeft: 150 }}>{cols.map((c, i) => <div key={i} style={{ width: cell + g, textAlign: 'center', fontSize: 26, color: C.muted, marginBottom: 10 }}>{c}</div>)}</div>
      {rows.map((r, i) => <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: g }}>
        <div style={{ width: 150, fontSize: 30, color: C.text, textAlign: 'right', paddingRight: 22, boxSizing: 'border-box' }}>{r}</div>
        {cols.map((_, j) => { const p = prog(t, at + (i + j) * 0.06, 0.4), me = hot && hot[0] === i && hot[1] === j, k = me ? prog(t, hotAt, 0.4) : 0;
          return <div key={j} style={{ width: cell, height: cell, marginRight: g, borderRadius: 12, background: color, opacity: p * mix(0.1, 1, values[i][j]), transform: `scale(${mix(0.6, 1, p) * mix(1, 1.18, k)})`, boxShadow: me ? `0 0 0 ${5 * k}px ${C.warm}` : 'none' }} />; })}
      </div>)}
    </div>
  );
};
/** 行情带：一条横向滚动的行情条，红涨绿跌随调用方定。做市场类话题的气氛。 */
export const TickerTape: React.FC<{ items: { sym: string; px: string; chg: number }[]; at: number; speed?: number; upColor?: string; downColor?: string; rows?: number }> = ({ items, at, speed = 150, upColor = '#4ADE80', downColor = C.down, rows = 2 }) => {
  const t = useT(), iw = 380, loop = items.length * iw, off = (Math.max(0, t - at) * speed) % loop, rep = [...items, ...items, ...items, ...items];
  return (
    <div style={{ width: 1800, opacity: prog(t, at, 0.5), fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 18 }}>
      {Array.from({ length: rows }).map((_, r) => <div key={r} style={{ height: 110, background: C.surface, borderTop: `2px solid ${C.line}`, borderBottom: `2px solid ${C.line}`, overflow: 'hidden', position: 'relative' }}>
        <div style={{ position: 'absolute', left: r % 2 ? -loop + off : -off, top: 0, height: '100%', display: 'flex', alignItems: 'center' }}>{rep.map((it, i) => { const col = it.chg >= 0 ? upColor : downColor;
          return <div key={i} style={{ width: iw, flex: 'none', display: 'flex', alignItems: 'baseline', gap: 16, paddingLeft: 30, boxSizing: 'border-box' }}><span style={{ fontSize: 40, fontWeight: 900, color: C.text }}>{it.sym}</span><span style={{ fontSize: 34, color: C.muted }}>{it.px}</span><span style={{ fontSize: 34, fontWeight: 900, color: col }}>{it.chg >= 0 ? '▲' : '▼'}{Math.abs(it.chg).toFixed(1)}%</span></div>; })}</div>
      </div>)}
    </div>
  );
};
