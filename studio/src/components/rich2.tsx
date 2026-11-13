// 第三批组件：组织、排名、政策路径、市场与收尾。全部由时间（秒）驱动，颜色字号取自 kit。
import React from 'react';
import { prog, mix, inOut, useClock } from '../kit/clock';
import { C, Chip, Count, FONT, Panel, Pop, Src, useT } from '../kit/kit';

const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); };
const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 30 }) => <div style={{ fontSize: size, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{children}</div>;

/** 辐射架构图：n 个人全部直连中心，一条线一条线接上。 */
export const OrgRadial: React.FC<{ n: number; at: number; dur?: number; size?: number; center: string }> = ({ n, at, dur = 2.2, size = 620, center }) => {
  const t = useT(), R = size / 2 - 26, cx = size / 2, cy = size / 2;
  return (
    <svg width={size} height={size} style={{ overflow: 'visible' }}>
      {Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2, r = R * (i % 2 ? 1 : 0.8), p = prog(t, at + (i / n) * dur, 0.4), x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
        return <g key={i} opacity={p}><line x1={cx} y1={cy} x2={mix(cx, x, p)} y2={mix(cy, y, p)} stroke={C.accent} strokeWidth={1.6} opacity={0.55} /><circle cx={x} cy={y} r={9} fill={C.text} /></g>; })}
      <circle cx={cx} cy={cy} r={66} fill={C.accent} /><text x={cx} y={cy + 12} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={34} fill="#fff">{center}</text>
    </svg>
  );
};
/** 常规层级图：一个小树，到点被划掉。 */
export const OrgTreeCrossed: React.FC<{ at: number; crossAt: number }> = ({ at, crossAt }) => {
  const t = useT(), x = prog(t, crossAt, 0.35), box = (l: number, tp: number, w = 70) => <rect x={l} y={tp} width={w} height={34} rx={6} fill="none" stroke={C.muted} strokeWidth={3} />;
  return (
    <Pop at={at}><svg width={330} height={230}>
      {box(130, 6)}{box(40, 96)}{box(220, 96)}{[0, 90, 180, 270].map((l) => <g key={l}>{box(l, 186, 60)}</g>)}
      <path d="M165 40 V68 M75 68 H255 M75 68 V96 M255 68 V96 M75 130 V158 M30 158 H120 M30 158 V186 M120 158 V186 M255 130 V158 M210 158 H300 M210 158 V186 M300 158 V186" stroke={C.muted} strokeWidth={3} fill="none" />
      <path d={`M20 20 L${mix(20, 310, x)} ${mix(20, 215, x)}`} stroke={C.down} strokeWidth={10} strokeLinecap="round" opacity={x > 0 ? 1 : 0} />
    </svg></Pop>
  );
};
/** 空位：虚线框里写着职位，到点打叉。 */
export const EmptySeat: React.FC<{ title: string; at: number }> = ({ title, at }) => {
  const t = useT(), p = prog(t, at + 0.35, 0.3);
  return (
    <Pop at={at}><div style={{ position: 'relative', width: 300, height: 170, border: `4px dashed ${C.muted}`, borderRadius: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(13,17,25,.7)' }}>
      <Label size={24}>职位</Label><div style={{ fontSize: 54, fontWeight: 900, color: C.muted, whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ position: 'absolute', right: -22, top: -22, width: 64, height: 64, borderRadius: 32, background: C.down, color: '#fff', fontSize: 40, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${p})` }}>✕</div>
    </div></Pop>
  );
};

/** 里程碑线：几个节点依次点亮，线跟着长过去。 */
export const Milestones: React.FC<{ points: { year: string; title: string; note?: string; at: number; color?: string }[]; width?: number }> = ({ points, width = 1560 }) => {
  const t = useT(), n = points.length, x = (i: number) => (i / (n - 1)) * (width - 360) + 180;
  const head = points.reduce((acc, p, i) => (i === 0 ? 0 : acc + prog(t, p.at - 0.5, 0.6)), 0);
  return (
    <div style={{ position: 'relative', width, height: 330 }}>
      <div style={{ position: 'absolute', left: x(0), top: 70, width: x(n - 1) - x(0), height: 6, background: C.line, borderRadius: 3 }} />
      <div style={{ position: 'absolute', left: x(0), top: 70, width: (x(1) - x(0)) * head, height: 6, background: C.accent, borderRadius: 3 }} />
      {points.map((p, i) => { const on = prog(t, p.at, 0.35);
        return <div key={p.year + p.title} style={{ position: 'absolute', left: x(i) - 180, top: 0, width: 360, textAlign: 'center', opacity: mix(0.25, 1, on) }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: p.color ?? C.warm }}>{p.year}</div>
          <div style={{ margin: '10px auto 0', width: 30, height: 30, borderRadius: 15, background: on > 0.5 ? C.accent : C.bg, border: `4px solid ${on > 0.5 ? C.accent : C.line}`, boxSizing: 'border-box' }} />
          <div style={{ fontSize: 40, fontWeight: 900, marginTop: 22, whiteSpace: 'nowrap', transform: `translateY(${mix(16, 0, on)}px)` }}>{p.title}</div>
          {p.note && <div style={{ fontSize: 26, color: C.muted, marginTop: 8, whiteSpace: 'nowrap' }}>{p.note}</div>}
        </div>; })}
    </div>
  );
};

/** 芯片铺满：小方块一格格铺开，计数器同步涨到目标值。 */
export const ChipFill: React.FC<{ to: number; unit: string; at: number; dur?: number; label: string; src?: string }> = ({ to, unit, at, dur = 1.6, label, src }) => {
  const t = useT(), p = prog(t, at, dur), cols = 25, rows = 6, lit = Math.floor(p * cols * rows);
  return (
    <Pop at={at - 0.2}><Panel style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 20px)`, gap: 6 }}>{Array.from({ length: cols * rows }, (_, i) => <div key={i} style={{ width: 20, height: 20, borderRadius: 4, background: i < lit ? C.warm : C.line, opacity: i < lit ? 1 : 0.5 }} />)}</div>
      <div><Label>{label}</Label><div style={{ fontSize: 96, fontWeight: 900, lineHeight: 1.1, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{Math.round(to * p).toLocaleString('en-US')}<span style={{ fontSize: 44, marginLeft: 10 }}>{unit}</span></div>{src && <Src>{src}</Src>}</div>
    </Panel></Pop>
  );
};
/** 月份格：12 格里只亮 lit 格。 */
export const MonthCells: React.FC<{ lit: number; at: number; label: string; value: string; color?: string }> = ({ lit, at, label, value, color = C.down }) => {
  const t = useT();
  return (
    <Pop at={at}><Panel><Label>{label}</Label>
      <div style={{ display: 'flex', gap: 8, margin: '16px 0 12px' }}>{Array.from({ length: 12 }, (_, i) => <div key={i} style={{ width: 40, height: 56, borderRadius: 8, border: `2px solid ${i < lit ? color : C.line}`, background: i < lit ? color : 'transparent', opacity: prog(t, at + 0.2 + i * 0.04, 0.2) }} />)}</div>
      <div style={{ fontSize: 50, fontWeight: 900, color }}>{value}</div>
    </Panel></Pop>
  );
};

/** 职位翻面：同一个人，头衔从 a 翻到 b。 */
export const RoleFlip: React.FC<{ name: string; en: string; a: string; b: string; at: number; flipAt: number; src?: string }> = ({ name, en, a, b, at, flipAt, src }) => {
  const t = useT(), p = inOut((t - flipAt) / 0.7), front = p < 0.5;
  return (
    <Pop at={at} dy={40}><Panel style={{ width: 620 }}>
      <div style={{ fontSize: 64, fontWeight: 900 }}>{name}</div><Label size={26}>{en}</Label>
      <div style={{ perspective: 900, marginTop: 30 }}><div style={{ transform: `rotateX(${front ? p * 180 : (1 - p) * 180}deg)`, background: front ? C.surface : C.accent, border: `2px solid ${front ? C.line : C.accent}`, color: front ? C.text : '#fff', borderRadius: 16, padding: '20px 30px', fontSize: 54, fontWeight: 900, textAlign: 'center', whiteSpace: 'nowrap' }}>{front ? a : b}</div></div>
      {src && <Src>{src}</Src>}
    </Panel></Pop>
  );
};
/** 被打断的话：气泡里的话写到一半被一道红线截断。 */
export const CutBubble: React.FC<{ at: number; cutAt: number; who: string; tag: string; tagAt: number; src?: string }> = ({ at, cutAt, who, tag, tagAt, src }) => {
  const t = useT(), w = prog(t, at + 0.2, cutAt - at - 0.2), cut = prog(t, cutAt, 0.25);
  return (
    <Pop at={at}><div style={{ position: 'relative', width: 640 }}>
      <Label>{who}</Label>
      <div style={{ background: '#EDEAE1', borderRadius: '8px 30px 30px 30px', padding: '30px 34px', marginTop: 12, height: 150, boxSizing: 'border-box' }}>
        {[0.9, 0.7].map((k, i) => <div key={i} style={{ height: 16, borderRadius: 8, background: '#B9B5A8', marginTop: i ? 26 : 8, width: `${Math.min(k, w * (i ? 0.7 : 1.4)) * 100}%` }} />)}
      </div>
      <div style={{ position: 'absolute', left: `${58 + cut * 4}%`, top: 40, width: 10, height: 170 * cut, background: C.down, borderRadius: 5, transform: 'rotate(8deg)' }} />
      <Pop at={tagAt} style={{ marginTop: 22 }}><Chip color={C.down} style={{ fontSize: 40 }}>{tag}</Chip></Pop>
      {src && <Pop at={tagAt}><Src>{src}</Src></Pop>}
    </div></Pop>
  );
};

/** 排名格：total 个格子逐排点亮到 rank，那一格放大标红。 */
export const RankGrid: React.FC<{ total: number; rank: number; at: number; dur?: number; cols?: number; cell?: number; src?: string }> = ({ total, rank, at, dur = 2.4, cols = 50, cell = 20 }) => {
  const t = useT(), p = prog(t, at, dur), cur = Math.floor(p * rank), done = p >= 1;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gap: 5 }}>
      {Array.from({ length: total }, (_, i) => { const me = i === rank - 1;
        return <div key={i} style={{ width: cell, height: cell, borderRadius: 4, background: me && done ? C.down : i < cur ? '#3A465F' : C.line, opacity: i < cur || (me && done) ? 1 : 0.45, transform: me && done ? 'scale(2.1)' : undefined, boxShadow: me && done ? `0 0 0 3px ${C.bg}, 0 0 24px ${C.down}` : undefined, zIndex: me ? 2 : 0 }} />; })}
    </div>
  );
};

/** 法案合并：几张小卡依次出现，到点一起滑进一个大文件夹。 */
export const BillMerge: React.FC<{ n: number; at: number; mergeAt: number; into: string; sub: string; src?: string }> = ({ n, at, mergeAt, into, sub, src }) => {
  const t = useT(), m = inOut((t - mergeAt) / 0.9);
  return (
    <div style={{ position: 'relative', width: 1500, height: 380 }}>
      {Array.from({ length: n }, (_, i) => { const a = prog(t, at + i * 0.28, 0.35), x0 = i * 190, x1 = 1040 + i * 14, y1 = 96 + i * 8;
        return <div key={i} style={{ position: 'absolute', left: mix(x0, x1, m), top: mix(60, y1, m), width: 170, height: 220, background: '#EDEAE1', borderRadius: 10, opacity: a * mix(1, 0.0, Math.max(0, m - 0.85) / 0.15), transform: `translateY(${mix(30, 0, a)}px) scale(${mix(1, 0.7, m)}) rotate(${(i - 1.5) * 2}deg)`, padding: 18, boxSizing: 'border-box', color: '#14171D', boxShadow: '0 16px 30px #0008' }}>
          <div style={{ fontSize: 22, color: '#6B7280' }}>法案</div><div style={{ fontSize: 60, fontWeight: 900 }}>{i + 1}</div>
          {[1, 0.8, 0.9].map((w, k) => <div key={k} style={{ height: 9, borderRadius: 5, background: '#C9C5B9', marginTop: 12, width: `${w * 100}%` }} />)}
        </div>; })}
      <div style={{ position: 'absolute', left: 980, top: 30, width: 500, height: 320, borderRadius: 18, background: 'linear-gradient(180deg,#2B3A57,#1B2536)', border: `2px solid ${C.accent}`, opacity: prog(t, mergeAt - 0.4, 0.4), padding: '200px 30px 0', boxSizing: 'border-box' }}>
        <div style={{ fontSize: 44, fontWeight: 900, whiteSpace: 'nowrap' }}>{into}</div><Label size={24}>{sub}</Label>
      </div>
      {src && <div style={{ position: 'absolute', left: 0, bottom: 0 }}><Src>{src}</Src></div>}
    </div>
  );
};

/** 路径与闸门：几个节点连成一条线，信号沿线流动，到点落下一道闸把它截断。 */
export const RouteGate: React.FC<{ nodes: { label: string; sub?: string; at: number }[]; gateAfter: number; gateAt: number; gateLabel: string }> = ({ nodes, gateAfter, gateAt, gateLabel }) => {
  const t = useT(), W = 1560, n = nodes.length, x = (i: number) => 150 + (i / (n - 1)) * (W - 300), g = prog(t, gateAt, 0.35), gx = (x(gateAfter) + x(gateAfter + 1)) / 2;
  return (
    <div style={{ position: 'relative', width: W, height: 360 }}>
      {nodes.slice(0, -1).map((nd, i) => { const p = prog(t, nodes[i + 1].at - 0.4, 0.5), blocked = i >= gateAfter && g > 0.5;
        return <div key={i} style={{ position: 'absolute', left: x(i) + 130, top: 118, width: (x(i + 1) - x(i) - 260) * p, height: 8, borderRadius: 4, background: blocked ? C.line : C.accent, overflow: 'hidden' }}>
          {!blocked && <div style={{ position: 'absolute', left: `${((t * 60) % 100)}%`, top: 0, width: 60, height: 8, background: '#fff', opacity: 0.8 }} />}</div>; })}
      {nodes.map((nd, i) => { const dead = i > gateAfter && g > 0.5;
        return <Pop key={nd.label} at={nd.at} style={{ position: 'absolute', left: x(i) - 130, top: 50, width: 260 }}><div style={{ background: C.glass, border: `2px solid ${dead ? C.line : C.accent}`, borderRadius: 18, padding: '26px 10px', textAlign: 'center', opacity: dead ? 0.45 : 1 }}>
          <div style={{ fontSize: 40, fontWeight: 900, whiteSpace: 'nowrap' }}>{nd.label}</div>{nd.sub && <div style={{ fontSize: 22, color: C.muted, marginTop: 4, whiteSpace: 'nowrap' }}>{nd.sub}</div>}</div></Pop>; })}
      <div style={{ position: 'absolute', left: gx - 9, top: mix(-140, 20, g), width: 18, height: 210, background: C.down, borderRadius: 9, opacity: g, boxShadow: `0 0 30px ${C.down}` }} />
      <div style={{ position: 'absolute', left: gx - 150, top: 250, width: 300, textAlign: 'center', fontSize: 34, fontWeight: 900, color: C.down, opacity: prog(t, gateAt + 0.2, 0.3), whiteSpace: 'nowrap' }}>{gateLabel}</div>
    </div>
  );
};
/** 掉到接近零：一根柱子从满高缩到贴地。 */
export const NearZero: React.FC<{ at: number; label: string; src?: string }> = ({ at, label, src }) => {
  const t = useT(), p = inOut((t - at) / 1.2);
  return (
    <Pop at={at - 0.3}><Panel style={{ display: 'flex', gap: 34, alignItems: 'flex-end' }}>
      <div style={{ width: 90, height: 200, display: 'flex', alignItems: 'flex-end', borderBottom: `3px solid ${C.muted}` }}><div style={{ width: 90, height: mix(190, 6, p), background: p > 0.9 ? C.down : C.accent, borderRadius: '8px 8px 0 0' }} /></div>
      <div><Label>{label}</Label><div style={{ fontSize: 80, fontWeight: 900, color: C.down, whiteSpace: 'nowrap', opacity: prog(t, at + 0.8, 0.3) }}>接近 0</div>{src && <Src>{src}</Src>}</div>
    </Panel></Pop>
  );
};

/** 跌幅尺：0 在左，越往右跌得越深；游标按给定的停靠点依次移动。幅度示意，不是走势图。 */
export const DropRuler: React.FC<{ max: number; stops: { v: number; at: number; dur?: number }[]; marks?: { v: number; at: number; label: string; color?: string }[]; width?: number }> = ({ max, stops, marks = [], width = 1560 }) => {
  const t = useT(), X = (v: number) => (v / max) * width;
  let v = 0, reached = 0; stops.forEach((s) => { const p = inOut((t - s.at) / (s.dur ?? 1.1)); v = mix(v, s.v, p); if (p > 0) reached = Math.max(reached, mix(reached, s.v, p)); });
  return (
    <div style={{ position: 'relative', width, height: 190 }}>
      <div style={{ position: 'absolute', left: 0, top: 78, width, height: 30, background: C.surface, border: `1px solid ${C.line}`, borderRadius: 15 }} />
      <div style={{ position: 'absolute', left: 0, top: 78, width: X(reached), height: 30, background: `${C.down}44`, borderRadius: 15 }} />
      <div style={{ position: 'absolute', left: 0, top: 78, width: X(v), height: 30, background: C.down, borderRadius: 15 }} />
      {Array.from({ length: Math.floor(max / 5) + 1 }, (_, i) => i * 5).map((k) => <div key={k} style={{ position: 'absolute', left: X(k) - 40, top: 122, width: 80, textAlign: 'center', fontSize: 24, color: C.muted }}>{k === 0 ? '0%' : `−${k}%`}</div>)}
      {marks.map((m) => <Pop key={m.label} at={m.at} dy={-14} style={{ position: 'absolute', left: X(m.v) - 160, top: 150, width: 320, textAlign: 'center' }}><div style={{ width: 4, height: 26, background: m.color ?? C.warm, margin: '0 auto' }} /><div style={{ fontSize: 30, fontWeight: 900, color: m.color ?? C.warm, whiteSpace: 'nowrap' }}>{m.label}</div></Pop>)}
      <div style={{ position: 'absolute', left: X(v) - 3, top: 58, width: 6, height: 70, background: C.text, borderRadius: 3 }} />
      <div style={{ position: 'absolute', left: X(v) - 110, top: -6, width: 220, textAlign: 'center', fontSize: 52, fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{v < 0.05 ? '0%' : `−${v.toFixed(1)}%`}</div>
    </div>
  );
};
/** 两根横条比大小。 */
export const DuoBars: React.FC<{ a: Bar; b: Bar; width?: number }> = ({ a, b, width = 620 }) => {
  const t = useT(), mx = Math.max(a.v, b.v);
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>{[a, b].map((r) => <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: prog(t, r.at, 0.3) }}>
    <div style={{ width: 130, fontSize: 34, fontWeight: 600, textAlign: 'right' }}>{r.name}</div><div style={{ height: 40, width: (r.v / mx) * width * prog(t, r.at, 0.7), background: r.color, borderRadius: 8 }} /><div style={{ fontSize: 34, fontWeight: 900, whiteSpace: 'nowrap' }}>{r.text}</div></div>)}</div>;
};
type Bar = { name: string; v: number; text: string; at: number; color: string };

/** 目标价卡：旧价被划掉，新价落定。 */
export const TargetCard: React.FC<{ firm: string; from: number; to: number; at: number; cutAt: number; note?: string; src?: string }> = ({ firm, from, to, at, cutAt, note, src }) => {
  const t = useT(), c = prog(t, cutAt, 0.35);
  return (
    <Pop at={at} dy={40}><Panel style={{ width: 600 }}>
      <Label>{firm} · 目标价</Label>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 10 }}>
        <div style={{ position: 'relative', fontSize: 80, fontWeight: 900, color: C.muted }}>${from}<div style={{ position: 'absolute', left: -6, top: '52%', height: 6, width: `calc(${c * 100}% + ${12 * c}px)`, background: C.down }} /></div>
        <div style={{ fontSize: 60, color: C.muted, opacity: c }}>→</div>
        <div style={{ fontSize: 120, fontWeight: 900, color: C.down, opacity: c, transform: `translateY(${mix(20, 0, c)}px)` }}>${to}</div>
      </div>
      {note && <Label size={26}>{note}</Label>}{src && <Src>{src}</Src>}
    </Panel></Pop>
  );
};
/** 清单：逐条打勾，最后一条打叉。 */
export const CheckList: React.FC<{ items: { text: string; at: number; ok: boolean }[] }> = ({ items }) => {
  const t = useT();
  return <div style={{ display: 'flex', gap: 30 }}>{items.map((it) => { const p = prog(t, it.at, 0.3), col = it.ok ? C.accent : C.down;
    return <div key={it.text} style={{ opacity: p, transform: `translateY(${mix(24, 0, p)}px)`, background: C.glass, border: `2px solid ${col}`, borderRadius: 22, padding: '30px 36px', minWidth: 250, textAlign: 'center' }}>
      <div style={{ width: 84, height: 84, borderRadius: 42, background: col, color: '#fff', fontSize: 54, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', transform: `scale(${prog(t, it.at + 0.15, 0.3)})` }}>{it.ok ? '✓' : '✕'}</div>
      <div style={{ fontSize: 50, fontWeight: 900, marginTop: 18, whiteSpace: 'nowrap', color: it.ok ? C.text : C.down }}>{it.text}</div></div>; })}</div>;
};
/** 财报数字：营收大数字 + 去年同期与本期两根柱。 */
export const Earnings: React.FC<{ at: number; value: number; unit: string; label: string; yoy: number; yoyAt: number; src?: string }> = ({ at, value, unit, label, yoy, yoyAt, src }) => {
  const t = useT(), g = prog(t, yoyAt, 0.9), prev = 100 / (1 + yoy / 100);
  return (
    <Pop at={at} dy={40}><Panel style={{ display: 'flex', gap: 60, alignItems: 'flex-end' }}>
      <div><Label>{label}</Label><div style={{ fontSize: 170, fontWeight: 900, lineHeight: 1.05, whiteSpace: 'nowrap' }}><Count to={value} at={at} /><span style={{ fontSize: 60, marginLeft: 12 }}>{unit}</span></div>{src && <Src>{src}</Src>}</div>
      <div style={{ display: 'flex', gap: 22, alignItems: 'flex-end', height: 250, opacity: prog(t, yoyAt - 0.2, 0.3) }}>
        <div style={{ textAlign: 'center' }}><div style={{ width: 90, height: prev * 2.1, background: C.line, borderRadius: '8px 8px 0 0' }} /><Label size={22}>去年同期</Label></div>
        <div style={{ textAlign: 'center' }}><div style={{ fontSize: 44, fontWeight: 900, color: C.accent, opacity: g }}>+{Math.round(yoy * g)}%</div><div style={{ width: 90, height: mix(prev, 100, g) * 2.1, background: C.accent, borderRadius: '8px 8px 0 0' }} /><Label size={22}>上季度</Label></div>
      </div>
    </Panel></Pop>
  );
};
/** 片尾：账号名、定位句、关注按钮、AI 说明。 */
export const Outro: React.FC<{ at: number; name: string; tagline: string; followAt: number; note: string }> = ({ at, name, tagline, followAt, note }) => {
  const t = useT(), f = prog(t, followAt, 0.35);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 26 }}>
      <Pop at={at} dy={30}><div style={{ width: 150, height: 150, borderRadius: 75, background: C.accent, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80, fontWeight: 900, color: '#fff' }}>{name.slice(0, 1)}</div></Pop>
      <Pop at={at + 0.15} style={{ fontSize: 110, fontWeight: 900 }}>{name}</Pop>
      <Pop at={at + 0.5}><Label size={40}>{tagline}</Label></Pop>
      <div style={{ marginTop: 14, background: f > 0.6 ? C.down : 'transparent', border: `3px solid ${C.down}`, color: f > 0.6 ? '#fff' : C.down, borderRadius: 999, padding: '16px 54px', fontSize: 48, fontWeight: 900, opacity: prog(t, followAt - 0.3, 0.3), transform: `scale(${1 + Math.sin(Math.min(1, f) * Math.PI) * 0.12})` }}>{f > 0.6 ? '已关注' : '+ 关注'}</div>
      <Pop at={followAt + 0.4}><Label size={24}>{note}</Label></Pop>
    </div>
  );
};
export { rnd as _rnd, useClock as _useClock };
