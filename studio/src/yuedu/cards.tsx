// 生成画面卡片库：没有素材时，用这里的卡把「流程、对比、数字、趋势、报告」画出来。
// 统一规格：占满画面窗 1080×813，纸白底，四个颜色（纸白、墨灰、品牌绿、强调橙），底部 118 留给字幕。
// 每张卡收到 t0/t1（起止秒）、cues（口播念到每一项的时刻）、bubble（右上角有没有人物小圆）。
// 新增一张卡：写组件 → 登记进文件末尾的 CARDS → 在 skills/frame-02-plan/卡片目录.md 里补一行。
import React from 'react';
import { Img, OffthreadVideo, staticFile, useVideoConfig, Sequence } from 'remotion';
import { c01, K, mix, outCubic, outQuint, pop, ramp, rnd, SANS, SERIF, useT, WIN } from './base';

export type CardBase = { t0: number; t1: number; cues: number[]; bubble?: boolean };
type Head = { kicker?: string; title?: string; note?: string };
const cueAt = (c: CardBase, i: number, n: number) => c.cues[i] ?? c.t0 + 0.45 + i * Math.min(1.1, Math.max(0.35, (c.t1 - c.t0 - 1.2) / Math.max(1, n)));

/** 卡片外壳：纸白底、淡点阵、左上小标和标题、右下备注。内容区在标题下面，垂直居中。 */
const Shell: React.FC<CardBase & Head & { children: React.ReactNode; pad?: number }> = ({ t0, bubble, kicker, title, note, children, pad = 60 }) => {
  const t = useT(), a = ramp(t, t0, 0.4);
  const top = title ? (bubble ? 236 : 196) : bubble ? 236 : kicker ? 110 : 50;
  return (
    <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(900px 600px at 30% 20%, #FFFFFF 0%, ${K.paper} 60%, ${K.paperDeep} 100%)`, fontFamily: SANS, color: K.ink }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${K.line} 1.6px, transparent 1.8px)`, backgroundSize: '36px 36px', opacity: 0.55 }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: 10, height: '100%', background: K.green }} />
      <div style={{ position: 'absolute', left: pad, top: 44, right: bubble ? 270 : pad, opacity: a, transform: `translateY(${mix(14, 0, a)}px)` }}>
        {kicker && <div style={{ display: 'inline-block', padding: '7px 18px', borderRadius: 999, background: K.greenSoft, color: K.green, fontSize: 28, fontWeight: 600, letterSpacing: 2 }}>{kicker}</div>}
        {title && <div style={{ marginTop: 12, fontFamily: SERIF, fontWeight: 700, fontSize: Math.min(58, Math.floor((bubble ? 700 : 940) / title.length)), lineHeight: 1.2, whiteSpace: 'nowrap' }}>{title}</div>}
      </div>
      <div style={{ position: 'absolute', left: pad, right: pad, top, bottom: 118, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
      {note && <div style={{ position: 'absolute', right: 26, top: bubble ? 252 : 22, fontSize: 20, color: K.mute, letterSpacing: 1, border: `1.5px solid ${K.line}`, borderRadius: 8, padding: '3px 10px', background: 'rgba(255,255,255,.7)' }}>{note}</div>}
    </div>
  );
};
const Check: React.FC<{ p: number; size?: number; color?: string }> = ({ p, size = 44, color = K.green }) => (
  <svg width={size} height={size} viewBox="0 0 44 44" style={{ flex: 'none' }}>
    <circle cx="22" cy="22" r="20" fill={p > 0 ? color : 'none'} stroke={p > 0 ? color : K.line} strokeWidth="3" opacity={p > 0 ? c01(p * 2) : 1} />
    <path d="M12 23 L19.5 30 L32 15" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="34" strokeDashoffset={34 * (1 - c01(p * 1.4 - 0.2))} />
  </svg>
);

/** 流程步骤：三到四步横排，口播说到哪步哪步亮。 */
export const Steps: React.FC<CardBase & Head & { steps: { t: string; s?: string }[] }> = (c) => {
  const t = useT(), n = c.steps.length, cur = c.steps.reduce((a, _, i) => (t >= cueAt(c, i, n) ? i : a), -1);
  return (
    <Shell {...c}>
      <div style={{ position: 'relative', display: 'flex', gap: 22, width: '100%' }}>
        <div style={{ position: 'absolute', left: `${50 / n}%`, right: `${50 / n}%`, top: 44, height: 4, background: K.line, borderRadius: 2 }}>
          <div style={{ width: `${c01(cur <= 0 ? 0 : (cur - 1 + ramp(t, cueAt(c, cur, n), 0.5)) / (n - 1)) * 100}%`, height: '100%', background: K.orange, borderRadius: 2 }} />
        </div>
        {c.steps.map((s, i) => {
          const at = cueAt(c, i, n), a = ramp(t, at, 0.45), on = i === cur, seen = i <= cur;
          return (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: seen ? 1 : 0.32 }}>
              <div style={{ width: 88, height: 88, borderRadius: 44, background: seen ? (on ? K.orange : K.green) : K.paper, border: `4px solid ${seen ? 'transparent' : K.line}`, color: seen ? '#fff' : K.mute, fontFamily: SERIF, fontWeight: 900, fontSize: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${seen ? mix(0.7, 1, pop(t, at, 0.4)) : 1})`, boxShadow: on ? '0 10px 24px rgba(240,137,46,.35)' : 'none', zIndex: 1 }}>{i + 1}</div>
              <div style={{ marginTop: 22, width: '100%', boxSizing: 'border-box', background: '#fff', borderRadius: 20, border: `2px solid ${on ? K.orange : K.line}`, padding: '22px 14px 24px', textAlign: 'center', boxShadow: on ? '0 16px 36px rgba(60,50,20,.14)' : '0 4px 12px rgba(60,50,20,.05)', transform: `translateY(${seen ? mix(18, 0, a) : 0}px)` }}>
                <div style={{ fontSize: Math.min(48, Math.floor((900 / n - 40) / s.t.length)), fontWeight: 900, whiteSpace: 'nowrap' }}>{s.t}</div>
                {s.s && <div style={{ marginTop: 10, fontSize: 27, color: K.sub, lineHeight: 1.35 }}>{s.s}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </Shell>
  );
};

/** 加法公式：A + B + C = 结果。 */
export const Formula: React.FC<CardBase & Head & { parts: string[]; result: string }> = (c) => {
  const t = useT(), n = c.parts.length, rAt = cueAt(c, n, n + 1), ra = ramp(t, rAt, 0.5);
  const fs = Math.min(48, Math.floor((900 - n * 78) / c.parts.join('').length));
  return (
    <Shell {...c}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {c.parts.map((x, i) => {
            const a = pop(t, cueAt(c, i, n + 1), 0.42);
            return (
              <React.Fragment key={i}>
                {i > 0 && <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 52, color: K.orange, opacity: c01(a) }}>+</div>}
                <div style={{ background: '#fff', border: `2.5px solid ${K.green}`, borderRadius: 20, padding: '28px 26px', fontSize: fs, fontWeight: 900, whiteSpace: 'nowrap', opacity: c01(a * 1.5), transform: `scale(${mix(0.8, 1, a)})`, boxShadow: '0 10px 24px rgba(47,125,70,.12)' }}>{x}</div>
              </React.Fragment>
            );
          })}
        </div>
        <svg width="40" height="50" style={{ opacity: ra }}><path d="M20 2 V40 M6 28 L20 44 L34 28" fill="none" stroke={K.green} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <div style={{ background: K.green, color: '#fff', borderRadius: 22, padding: '22px 54px', fontFamily: SERIF, fontWeight: 900, fontSize: Math.min(68, Math.floor(820 / c.result.length)), letterSpacing: 4, opacity: ra, transform: `translateY(${mix(20, 0, ra)}px)`, boxShadow: '0 16px 36px rgba(47,125,70,.3)' }}>{c.result}</div>
      </div>
    </Shell>
  );
};

/** 大数字加网点：左边数字滚上去，右边一张连着总部的门店网。数字必须是口播或资料里有的。 */
export const BigNumber: React.FC<CardBase & Head & { value: number; suffix?: string; unit: string; label?: string; hub?: string }> = (c) => {
  const t = useT(), at = cueAt(c, 0, 1), p = outQuint((t - at) / 1.3), v = Math.round(c.value * p);
  const N = 150, pts = React.useMemo(() => Array.from({ length: N }, (_, i) => { const a = rnd(i, 3) * Math.PI * 2, r = 60 + Math.sqrt(rnd(i, 7)) * 200; return { x: 250 + Math.cos(a) * r * 1.1, y: 230 + Math.sin(a) * r * 0.86, d: rnd(i, 11) }; }), []);
  return (
    <Shell {...c}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%', gap: 10 }}>
        <div style={{ flex: 'none', width: 440 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 200, lineHeight: 1, color: K.green, letterSpacing: -4, fontVariantNumeric: 'tabular-nums' }}>{v}</div>
            {c.suffix && <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 96, color: K.orange }}>{c.suffix}</div>}
          </div>
          <div style={{ marginTop: 10, fontSize: 52, fontWeight: 900 }}>{c.unit}</div>
          {c.label && <div style={{ marginTop: 12, fontSize: 28, color: K.sub, opacity: ramp(t, at + 0.9, 0.5) }}>{c.label}</div>}
        </div>
        <svg width="500" height="460" viewBox="0 0 500 460" style={{ flex: 1 }}>
          {pts.map((q, i) => { const on = q.d < p; return on ? <line key={'l' + i} x1="250" y1="230" x2={q.x} y2={q.y} stroke={K.green} strokeWidth="1" opacity={0.16} /> : null; })}
          {pts.map((q, i) => { const a = c01((p - q.d) * 8); return <circle key={i} cx={q.x} cy={q.y} r={mix(3, 6.5, a)} fill={a > 0 ? (i % 9 === 0 ? K.orange : K.green) : K.line} opacity={a > 0 ? 0.9 : 0.8} />; })}
          <circle cx="250" cy="230" r={46 + Math.sin(t * 3) * 2} fill={K.greenDeep} />
          <circle cx="250" cy="230" r={mix(46, 120, (t * 0.5) % 1)} fill="none" stroke={K.green} strokeWidth="2" opacity={0.5 * (1 - ((t * 0.5) % 1))} />
          <text x="250" y="240" textAnchor="middle" fill="#fff" fontFamily={SANS} fontWeight="600" fontSize="26">{c.hub ?? '总部'}</text>
        </svg>
      </div>
    </Shell>
  );
};

/** 两栏对比：左边旧做法被划掉，右边新做法打勾。 */
export const Compare: React.FC<CardBase & Head & { left: { name: string; items: string[] }; right: { name: string; items: string[] } }> = (c) => {
  const t = useT(), lAt = cueAt(c, 0, 2), rAt = cueAt(c, 1, 2), ra = ramp(t, rAt, 0.5);
  const col = (side: 'l' | 'r', d: { name: string; items: string[] }, at: number) => (
    <div style={{ flex: 1, background: side === 'r' ? '#fff' : 'rgba(255,255,255,.55)', border: `2.5px solid ${side === 'r' ? K.green : K.line}`, borderRadius: 24, padding: '24px 28px 28px', opacity: ramp(t, at, 0.4) * (side === 'l' ? mix(1, 0.78, ra) : 1), transform: `translateY(${mix(20, 0, ramp(t, at, 0.45))}px) scale(${side === 'r' ? mix(0.96, 1, ra) : 1})`, boxShadow: side === 'r' ? '0 18px 40px rgba(47,125,70,.16)' : 'none' }}>
      <div style={{ display: 'inline-block', fontSize: 26, fontWeight: 600, color: side === 'r' ? '#fff' : K.sub, background: side === 'r' ? K.green : K.paperDeep, borderRadius: 10, padding: '6px 16px' }}>{d.name}</div>
      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {d.items.map((x, i) => {
          const a = ramp(t, at + 0.25 + i * 0.28, 0.4), strike = side === 'l' ? ramp(t, rAt + i * 0.12, 0.35) : 0;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, opacity: a }}>
              {side === 'r' ? <Check p={a} size={38} /> : <svg width="38" height="38" style={{ flex: 'none' }}><circle cx="19" cy="19" r="17" fill="none" stroke={K.mute} strokeWidth="3" /><path d="M12 12 L26 26 M26 12 L12 26" stroke={K.mute} strokeWidth="3.5" strokeLinecap="round" /></svg>}
              <div style={{ position: 'relative', fontSize: Math.min(40, Math.floor(350 / x.length)), fontWeight: side === 'r' ? 900 : 600, color: side === 'r' ? K.ink : K.sub, whiteSpace: 'nowrap' }}>{x}{side === 'l' && <div style={{ position: 'absolute', left: -4, top: '54%', height: 3, width: `calc(${strike * 100}% + 8px)`, background: K.orange }} />}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
  return (
    <Shell {...c}>
      <div style={{ display: 'flex', gap: 20, width: '100%', alignItems: 'stretch' }}>
        {col('l', c.left, lAt)}
        <svg width="56" height="56" style={{ alignSelf: 'center', flex: 'none', opacity: ra }}><circle cx="28" cy="28" r="26" fill={K.orange} /><path d="M17 28 H38 M30 19 L39 28 L30 37" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        {col('r', c.right, rAt)}
      </div>
    </Shell>
  );
};

/** 要点清单：一条条打勾。 */
export const Checklist: React.FC<CardBase & Head & { items: (string | { t: string; s?: string })[] }> = (c) => {
  const t = useT(), n = c.items.length;
  return (
    <Shell {...c}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: n > 3 ? 14 : 20, width: '100%' }}>
        {c.items.map((it, i) => {
          const x = typeof it === 'string' ? { t: it } : it, at = cueAt(c, i, n), a = ramp(t, at, 0.45);
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 22, background: '#fff', border: `2px solid ${K.line}`, borderRadius: 20, padding: n > 3 ? '16px 26px' : '22px 28px', opacity: mix(0.3, 1, a), transform: `translateX(${mix(-24, 0, a)}px)`, boxShadow: '0 6px 16px rgba(60,50,20,.06)' }}>
              <Check p={c01((t - at) / 0.5)} size={48} />
              <div style={{ fontSize: Math.min(40, Math.floor(700 / x.t.length)), fontWeight: 900, whiteSpace: 'nowrap' }}>{x.t}</div>
              {x.s && <div style={{ marginLeft: 'auto', fontSize: 25, color: K.sub, whiteSpace: 'nowrap' }}>{x.s}</div>}
            </div>
          );
        })}
      </div>
    </Shell>
  );
};

/** 增长曲线（示意）：几条线依次画出来，线尾挂名字。没有真实数值时不标刻度，右上角标「示意」。 */
export const Curve: React.FC<CardBase & Head & { series: string[]; xLabels?: string[] }> = (c) => {
  const t = useT(), n = c.series.length, CW = 900, CH = c.bubble ? 360 : 430, cols = [K.green, K.orange, K.greenDeep, K.yellow];
  const path = (i: number) => { const pts = Array.from({ length: 9 }, (_, k) => { const x = 20 + (k / 8) * (CW - 250), g = Math.pow(k / 8, 1.25 + i * 0.25), y = CH - 46 - g * (CH - 110) * (1 - i * 0.16) - rnd(k + i * 9, 5) * 16 - i * 8; return [x, y]; }); return pts; };
  const xl = c.xLabels ?? ['入学', '第 1 期', '第 2 期', '第 3 期'];
  // 线尾的名字至少隔开 38 像素，不互相压
  const ends = c.series.map((_, i) => path(i)[8][1]), order = ends.map((y, i) => [y, i]).sort((p, q) => p[0] - q[0]), ly: number[] = [];
  order.forEach(([y, i], k) => { ly[i] = k === 0 ? y : Math.max(y, ly[order[k - 1][1]] + 38); });
  return (
    <Shell {...c} note={c.note ?? '示意'}>
      <svg width={CW} height={CH} viewBox={`0 0 ${CW} ${CH}`}>
        {[0, 1, 2, 3].map((g) => <line key={g} x1="20" x2={CW - 230} y1={CH - 46 - g * ((CH - 110) / 3)} y2={CH - 46 - g * ((CH - 110) / 3)} stroke={K.line} strokeWidth="2" strokeDasharray={g ? '4 8' : undefined} />)}
        {xl.map((x, k) => <text key={k} x={20 + (k / (xl.length - 1)) * (CW - 250)} y={CH - 10} textAnchor={k === 0 ? 'start' : k === xl.length - 1 ? 'end' : 'middle'} fill={K.mute} fontSize="22" fontFamily={SANS}>{x}</text>)}
        {c.series.map((name, i) => {
          const pts = path(i), at = cueAt(c, i, n), p = outCubic((t - at) / 1.1), d = pts.map((q, k) => (k ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' '), last = pts[pts.length - 1], la = ramp(t, at + 0.8, 0.35);
          return (
            <g key={i} opacity={t >= at ? 1 : 0}>
              <path d={d} fill="none" stroke={cols[i % 4]} strokeWidth={i === 0 ? 7 : 5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - p} />
              <circle cx={last[0]} cy={last[1]} r={9 * la} fill="#fff" stroke={cols[i % 4]} strokeWidth="5" />
              <text x={last[0] + 22} y={ly[i] + 10} fill={cols[i % 4]} fontFamily={SANS} fontWeight="900" fontSize={Math.min(32, Math.floor(200 / name.length))} opacity={la}>{name}</text>
            </g>
          );
        })}
      </svg>
    </Shell>
  );
};

/** 测评报告（示意）：左边雷达图，右边各维度得分条。分数是示意值时必须留着右上角的「示意」。 */
export const Report: React.FC<CardBase & Head & { dims: { name: string; score: number }[]; badge?: string }> = (c) => {
  const t = useT(), n = c.dims.length, R = c.bubble ? 128 : 156, cx = R + 100, cy = R + 40, at0 = cueAt(c, 0, n);
  const pt = (i: number, r: number) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; };
  const grow = outCubic((t - c.t0 - 0.3) / 0.9);
  return (
    <Shell {...c} note={c.note ?? '示意数据'}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26, width: '100%' }}>
        <svg width={cx * 2} height={cy * 2 + 6} style={{ flex: 'none' }}>
          {[0.33, 0.66, 1].map((k) => <polygon key={k} points={c.dims.map((_, i) => pt(i, R * k).join(',')).join(' ')} fill={k === 1 ? '#fff' : 'none'} stroke={K.line} strokeWidth="2" />)}
          {c.dims.map((_, i) => { const q = pt(i, R); return <line key={i} x1={cx} y1={cy} x2={q[0]} y2={q[1]} stroke={K.line} strokeWidth="1.5" />; })}
          <polygon points={c.dims.map((d, i) => pt(i, (R * d.score * grow) / 100).join(',')).join(' ')} fill="rgba(47,125,70,.22)" stroke={K.green} strokeWidth="4" strokeLinejoin="round" />
          {c.dims.map((d, i) => { const q = pt(i, (R * d.score * grow) / 100), l = pt(i, R + 26); return <g key={i}><circle cx={q[0]} cy={q[1]} r="6" fill={K.green} /><text x={l[0]} y={l[1] + 7} textAnchor={Math.abs(l[0] - cx) < 12 ? 'middle' : l[0] > cx ? 'start' : 'end'} fontSize="20" fill={K.sub} fontFamily={SANS}>{d.name.slice(0, 4)}</text></g>; })}
        </svg>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: c.bubble ? 12 : 16 }}>
          {c.badge && <div style={{ alignSelf: 'flex-start', fontSize: 23, color: K.orange, background: K.orangeSoft, padding: '5px 14px', borderRadius: 8, fontWeight: 600 }}>{c.badge}</div>}
          {c.dims.map((d, i) => {
            const at = c.cues[i] ?? at0 + i * 0.22, p = outCubic((t - at) / 0.8), hi = c.cues[i] !== undefined && t >= c.cues[i];
            return (
              <div key={i} style={{ opacity: mix(0.35, 1, c01(p * 3)) }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 27, fontWeight: hi ? 900 : 600, color: hi ? K.ink : K.sub }}><span>{d.name}</span><span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 32, color: hi ? K.orange : K.green, fontVariantNumeric: 'tabular-nums' }}>{Math.round(d.score * p)}</span></div>
                <div style={{ marginTop: 6, height: 12, borderRadius: 6, background: K.paperDeep, overflow: 'hidden' }}><div style={{ width: `${d.score * p}%`, height: '100%', borderRadius: 6, background: hi ? K.orange : K.green }} /></div>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
};

/** 后台看板（示意）：上面三块指标，下面几行门店数据。用来替代看不清的后台录屏。 */
export const Dashboard: React.FC<CardBase & Head & { tiles: { k: string; v: string }[]; rows: { name: string; v: number; tag?: string }[] }> = (c) => {
  const t = useT(), n = c.tiles.length;
  return (
    <Shell {...c} note={c.note ?? '示意数据'}>
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', gap: 16 }}>
          {c.tiles.map((x, i) => {
            const at = cueAt(c, i, n), a = ramp(t, at, 0.45), hi = c.cues[i] !== undefined && t >= c.cues[i] && (c.cues[i + 1] === undefined || t < c.cues[i + 1]);
            return (
              <div key={i} style={{ flex: 1, background: hi ? K.green : '#fff', color: hi ? '#fff' : K.ink, border: `2px solid ${hi ? K.green : K.line}`, borderRadius: 18, padding: '16px 20px', opacity: mix(0.35, 1, a), transform: `translateY(${mix(14, 0, a)}px)`, boxShadow: hi ? '0 14px 30px rgba(47,125,70,.28)' : 'none' }}>
                <div style={{ fontSize: 24, opacity: 0.8 }}>{x.k}</div>
                <div style={{ marginTop: 4, fontFamily: SERIF, fontWeight: 900, fontSize: 46, whiteSpace: 'nowrap' }}>{x.v}</div>
              </div>
            );
          })}
        </div>
        <div style={{ background: '#fff', border: `2px solid ${K.line}`, borderRadius: 18, padding: '12px 22px' }}>
          {c.rows.slice(0, c.bubble ? 3 : 4).map((r, i) => {
            const p = outCubic((t - c.t0 - 0.6 - i * 0.15) / 0.9);
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 0', borderTop: i ? `1.5px solid ${K.paperDeep}` : 'none', fontSize: 25 }}>
                <div style={{ width: 10, height: 10, borderRadius: 5, background: r.tag ? K.orange : K.green, flex: 'none' }} />
                <div style={{ width: 210, color: K.sub, whiteSpace: 'nowrap' }}>{r.name}</div>
                <div style={{ flex: 1, height: 12, borderRadius: 6, background: K.paperDeep, overflow: 'hidden' }}><div style={{ width: `${r.v * 100 * p}%`, height: '100%', background: r.tag ? K.orange : K.green, borderRadius: 6 }} /></div>
                <div style={{ width: 70, textAlign: 'right', fontWeight: 900, fontVariantNumeric: 'tabular-nums' }}>{Math.round(r.v * 100 * p)}%</div>
                {<div style={{ width: 96, textAlign: 'center', fontSize: 20, color: r.tag ? K.orange : K.green, background: r.tag ? K.orangeSoft : K.greenSoft, borderRadius: 8, padding: '4px 0' }}>{r.tag ?? '达标'}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
};

/** 分工：左右两个角色各管什么，中间一条带流动光点的连线。 */
export const Split: React.FC<CardBase & Head & { left: { role: string; items: string[] }; right: { role: string; items: string[] }; link?: string }> = (c) => {
  const t = useT(), lAt = cueAt(c, 0, 2), rAt = cueAt(c, 1, 2);
  const side = (d: { role: string; items: string[] }, at: number, tone: string, dark: boolean) => {
    const a = ramp(t, at, 0.5);
    return (
      <div style={{ flex: 1, borderRadius: 24, background: dark ? K.greenDeep : '#fff', color: dark ? '#fff' : K.ink, border: `2.5px solid ${dark ? K.greenDeep : tone}`, padding: '22px 24px 26px', opacity: mix(0.25, 1, a), transform: `translateY(${mix(18, 0, a)}px)`, boxShadow: '0 16px 36px rgba(40,60,40,.14)' }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 42, letterSpacing: 2 }}>{d.role}</div>
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {d.items.map((x, i) => { const b = ramp(t, at + 0.3 + i * 0.25, 0.4); return <div key={i} style={{ fontSize: Math.min(29, Math.floor(330 / x.length)), fontWeight: 600, padding: '10px 16px', borderRadius: 12, background: dark ? 'rgba(255,255,255,.12)' : K.orangeSoft, opacity: b, transform: `translateX(${mix(-12, 0, b)}px)`, whiteSpace: 'nowrap' }}>{x}</div>; })}
        </div>
      </div>
    );
  };
  const ra = ramp(t, rAt - 0.3, 0.5);
  return (
    <Shell {...c}>
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        {side(c.left, lAt, K.green, true)}
        <div style={{ width: 150, flex: 'none', textAlign: 'center', opacity: ra }}>
          <div style={{ fontSize: 22, color: K.sub, marginBottom: 6, whiteSpace: 'nowrap' }}>{c.link ?? ''}</div>
          <svg width="150" height="30"><line x1="6" y1="15" x2="130" y2="15" stroke={K.line} strokeWidth="4" strokeLinecap="round" /><path d="M124 5 L140 15 L124 25" fill="none" stroke={K.orange} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />{[0, 1, 2].map((k) => { const x = 6 + (((t * 0.9 + k / 3) % 1) * 120); return <circle key={k} cx={x} cy="15" r="6" fill={K.orange} />; })}</svg>
        </div>
        {side(c.right, rAt, K.orange, false)}
      </div>
    </Shell>
  );
};

/** 闭环：几个环节围成一圈依次点亮，橙色光点绕圈走。 */
export const Loop: React.FC<CardBase & Head & { nodes: string[]; center?: string }> = (c) => {
  const t = useT(), n = c.nodes.length, R = c.bubble ? 132 : 168, S = R * 2 + 340, cx = S / 2, cy = R + 80;
  const ang = (i: number) => -Math.PI / 2 + (i / n) * Math.PI * 2, done = ramp(t, cueAt(c, n - 1, n) + 0.3, 0.5), run = ((t - c.t0) * 0.22) % 1, ra = -Math.PI / 2 + run * Math.PI * 2;
  return (
    <Shell {...c}>
      <svg width={S} height={R * 2 + 160}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={K.line} strokeWidth="6" />
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={K.green} strokeWidth="6" strokeLinecap="round" pathLength={1} strokeDasharray="1" strokeDashoffset={1 - c01(c.nodes.reduce((a, _, i) => (t >= cueAt(c, i, n) ? (i + ramp(t, cueAt(c, i, n), 0.6)) / n : a), 0))} transform={`rotate(-90 ${cx} ${cy})`} />
        {done > 0 && <circle cx={cx + Math.cos(ra) * R} cy={cy + Math.sin(ra) * R} r={11} fill={K.orange} opacity={done} />}
        {c.center && <text x={cx} y={cy + 14} textAnchor="middle" fontFamily={SERIF} fontWeight="900" fontSize={Math.min(44, Math.floor((R * 1.5) / c.center.length))} fill={K.greenDeep} opacity={done}>{c.center}</text>}
        {c.nodes.map((x, i) => {
          const a = ang(i), px = cx + Math.cos(a) * R, py = cy + Math.sin(a) * R, on = pop(t, cueAt(c, i, n), 0.4), w = Math.max(120, x.length * 32 + 44), lx = px + Math.cos(a) * (w / 2 + 6) * (Math.abs(Math.cos(a)) > 0.3 ? 1 : 0), ly = py + Math.sin(a) * 44 * (Math.abs(Math.cos(a)) > 0.3 ? 0 : 1);
          return (
            <g key={i} opacity={mix(0.3, 1, c01(on))}>
              <rect x={lx - w / 2} y={ly - 30} width={w} height={60} rx={30} fill={on > 0 ? '#fff' : K.paper} stroke={on > 0 ? K.green : K.line} strokeWidth="3" />
              <text x={lx} y={ly + 11} textAnchor="middle" fontFamily={SANS} fontWeight="900" fontSize="30" fill={K.ink}>{x}</text>
            </g>
          );
        })}
      </svg>
    </Shell>
  );
};

/** 引语卡：一句话当画面，mark 里的词被黄色马克笔刷过。 */
export const Quote: React.FC<CardBase & Head & { text: string; mark?: string; by?: string }> = (c) => {
  const t = useT(), at = cueAt(c, 0, 1), a = ramp(t, c.t0 + 0.1, 0.5), m = outCubic((t - at) / 0.5);
  const i = c.mark ? c.text.indexOf(c.mark) : -1, parts = i < 0 ? [c.text] : [c.text.slice(0, i), c.mark as string, c.text.slice(i + (c.mark as string).length)];
  const fs = Math.min(68, Math.floor(Math.sqrt((860 * 300) / c.text.length)));
  return (
    <Shell {...c}>
      <div style={{ width: '100%', opacity: a, transform: `translateY(${mix(16, 0, a)}px)` }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 120, lineHeight: 0.6, color: K.green, opacity: 0.35 }}>“</div>
        <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: fs, lineHeight: 1.5, color: K.ink }}>
          {parts.map((x, k) => (k === 1 ? <span key={k} style={{ backgroundImage: `linear-gradient(${K.hot}, ${K.hot})`, backgroundRepeat: 'no-repeat', backgroundPosition: '0 78%', backgroundSize: `${m * 100}% 46%` }}>{x}</span> : <span key={k}>{x}</span>))}
        </div>
        {c.by && <div style={{ marginTop: 18, fontSize: 26, color: K.sub }}>—— {c.by}</div>}
      </div>
    </Shell>
  );
};

/** 录屏放大：左边录屏只交代「这是哪一页」，橙框标出一块；右边把这一块重排成大字。rows 里的字必须来自录屏本身。 */
export const Magnify: React.FC<CardBase & Head & { src: string; kind?: 'image' | 'video'; from?: number; focus: [number, number, number, number]; rows: [string, string][] }> = (c) => {
  const t = useT(), { fps } = useVideoConfig(), [fx, fy, fw, fh] = c.focus, fa = ramp(t, c.t0 + 0.5, 0.45), ca = ramp(t, c.t0 + 0.95, 0.5);
  const SW = 520, SH = 366, st: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'left top' };
  return (
    <Shell {...c}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, width: '100%' }}>
        <div style={{ width: SW, flex: 'none', borderRadius: 16, overflow: 'hidden', background: '#fff', border: `2px solid ${K.line}`, boxShadow: '0 16px 36px rgba(40,40,20,.16)' }}>
          <div style={{ height: 34, background: K.paperDeep, display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 14 }}>{[K.orange, K.yellow, K.logo].map((x) => <div key={x} style={{ width: 11, height: 11, borderRadius: 6, background: x }} />)}</div>
          <div style={{ position: 'relative', width: SW, height: SH }}>
            {c.kind === 'video' ? <Sequence from={Math.round(c.t0 * fps)} layout="none"><OffthreadVideo src={staticFile(c.src)} muted startFrom={Math.round((c.from ?? 0) * fps)} style={st} /></Sequence> : <Img src={staticFile(c.src)} style={st} />}
            <div style={{ position: 'absolute', left: fx * SW, top: fy * SH, width: fw * SW, height: fh * SH, border: `4px solid ${K.orange}`, borderRadius: 8, boxShadow: `0 0 0 2000px rgba(20,20,10,${0.42 * fa})`, opacity: fa, transform: `scale(${mix(1.25, 1, fa)})` }} />
          </div>
        </div>
        <div style={{ flex: 1, background: '#fff', borderRadius: 20, border: `2.5px solid ${K.orange}`, padding: '18px 24px', opacity: ca, transform: `translateX(${mix(-30, 0, ca)}px) scale(${mix(0.94, 1, ca)})`, transformOrigin: 'left center', boxShadow: '0 16px 36px rgba(240,137,46,.18)' }}>
          {c.rows.map(([k, v], i) => { const at = c.cues[i] ?? c.t0 + 1.2 + i * 0.3, a = ramp(t, at, 0.4); return <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, padding: '12px 0', borderTop: i ? `1.5px solid ${K.paperDeep}` : 'none', opacity: mix(0.3, 1, a) }}><span style={{ fontSize: 27, color: K.sub, whiteSpace: 'nowrap' }}>{k}</span><span style={{ fontFamily: SERIF, fontWeight: 900, fontSize: Math.min(40, Math.floor(260 / Math.max(1, v.length))), color: K.ink, whiteSpace: 'nowrap' }}>{v}</span></div>; })}
        </div>
      </div>
    </Shell>
  );
};

/** 阶梯：一级一级往上走（进阶、成长路径）。 */
export const Ladder: React.FC<CardBase & Head & { steps: { t: string; s?: string }[] }> = (c) => {
  const t = useT(), n = c.steps.length, Hh = c.bubble ? 340 : 420;
  return (
    <Shell {...c}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, width: '100%', height: Hh }}>
        {c.steps.map((s, i) => {
          const at = cueAt(c, i, n), a = outQuint((t - at) / 0.6), h = (Hh - 20) * (0.46 + (0.54 * (i + 1)) / n), on = t >= at, last = i === n - 1;
          return (
            <div key={i} style={{ flex: 1, height: h * mix(0.3, 1, a), opacity: mix(0.25, 1, c01(a * 2)), background: last && on ? K.green : '#fff', color: last && on ? '#fff' : K.ink, border: `2.5px solid ${on ? K.green : K.line}`, borderRadius: '20px 20px 6px 6px', padding: '18px 16px', boxSizing: 'border-box', overflow: 'hidden', boxShadow: on ? '0 12px 28px rgba(47,125,70,.16)' : 'none' }}>
              <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 30, color: last && on ? K.hot : K.orange }}>{String(i + 1).padStart(2, '0')}</div>
              <div style={{ marginTop: 6, fontSize: Math.min(38, Math.floor((880 / n - 40) / s.t.length)), fontWeight: 900, whiteSpace: 'nowrap' }}>{s.t}</div>
              {s.s && <div style={{ marginTop: 8, fontSize: 23, lineHeight: 1.35, opacity: 0.75 }}>{s.s}</div>}
            </div>
          );
        })}
      </div>
    </Shell>
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const CARDS: Record<string, React.FC<any>> = { Steps, Formula, BigNumber, Compare, Checklist, Curve, Report, Dashboard, Split, Loop, Quote, Magnify, Ladder };
export const WIN_SIZE = WIN;
