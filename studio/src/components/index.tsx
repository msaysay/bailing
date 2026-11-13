// 公共组件库。每个组件只做一件事，时间由调用方传入（秒），颜色字号取自 kit。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { prog, mix, inOut } from '../kit/clock';
import { C, Chip, Count, FONT, Panel, Pop, Src, useT } from '../kit/kit';

/** 章节页：整屏盖住，大号序号 + 标题，停留后淡出。 */
export const ChapterCard: React.FC<{ no: string; title: string; at: number; hold?: number }> = ({ no, title, at, hold = 1.5 }) => {
  const t = useT(), a = prog(t, at, 0.35), out = prog(t, at + hold, 0.4);
  if (t < at - 0.05 || out >= 1) return null;
  return (
    <AbsoluteFill style={{ background: `rgba(8,11,17,${0.9 * a * (1 - out)})`, fontFamily: FONT, color: C.text, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 48, opacity: 1 - out }}>
      <div style={{ fontSize: 280, fontWeight: 900, color: C.accent, lineHeight: 1, opacity: a, transform: `translateX(${mix(-60, 0, a)}px)` }}>{no}</div>
      <div style={{ width: 6, height: mix(0, 220, prog(t, at + 0.15, 0.4)), background: C.accent }} />
      <div style={{ fontSize: 110, fontWeight: 900, opacity: prog(t, at + 0.25, 0.4), transform: `translateX(${mix(60, 0, prog(t, at + 0.25, 0.4))}px)` }}>{title}</div>
    </AbsoluteFill>
  );
};

/** 目录：几件事依次点亮。 */
export const IndexList: React.FC<{ items: string[]; ats: number[] }> = ({ items, ats }) => (
  <div style={{ display: 'flex', gap: 28 }}>
    {items.map((x, i) => (
      <Pop key={x} at={ats[i]}><Panel style={{ padding: '28px 36px', display: 'flex', alignItems: 'baseline', gap: 20 }}>
        <span style={{ fontSize: 56, fontWeight: 900, color: C.accent }}>{i + 1}</span><span style={{ fontSize: 44, fontWeight: 600, whiteSpace: 'nowrap' }}>{x}</span>
      </Panel></Pop>
    ))}
  </div>
);

/** 年份拨盘：从一个年份滚到另一个，底下一条刻度带跟着走。 */
export const YearDial: React.FC<{ from: number; to: number; at: number; dur?: number; size?: number }> = ({ from, to, at, dur = 1.1, size = 220 }) => {
  const t = useT(), p = inOut((t - at) / dur), y = mix(from, to, p), yr = Math.round(y), W = 900, step = 60;
  return (
    <div style={{ width: W }}>
      <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', filter: `blur(${Math.sin(p * Math.PI) * 5}px)` }}>{yr}<span style={{ fontSize: size * 0.3, marginLeft: 14, color: C.muted }}>年</span></div>
      <div style={{ position: 'relative', height: 46, marginTop: 18, overflow: 'hidden', maskImage: 'linear-gradient(90deg, transparent, #000 15%, #000 85%, transparent)' }}>
        {Array.from({ length: 41 }, (_, i) => Math.floor(y) - 20 + i).map((k) => (
          <div key={k} style={{ position: 'absolute', left: W / 2 + (k - y) * step, top: 0, width: 2, height: k % 5 === 0 ? 26 : 14, background: k === yr ? C.accent : C.line }}>
            {k % 5 === 0 && <div style={{ position: 'absolute', top: 28, left: -20, width: 42, textAlign: 'center', fontSize: 16, color: C.muted }}>{k}</div>}
          </div>
        ))}
        <div style={{ position: 'absolute', left: W / 2 - 1, top: 0, width: 4, height: 30, background: C.accent }} />
      </div>
    </div>
  );
};

/** 左右对比：两块面板，各自到点出现。 */
export const Versus: React.FC<{ left: Side; right: Side; width?: number }> = ({ left, right, width = 1640 }) => (
  <div style={{ display: 'flex', gap: 40, width }}>{[left, right].map((s) => (
    <Pop key={s.label} at={s.at} style={{ flex: 1 }}><Panel style={{ borderTop: `6px solid ${s.color ?? C.line}`, minHeight: 300 }}>
      <div style={{ fontSize: 34, color: C.muted }}>{s.label}</div>
      <Pop at={s.valueAt ?? s.at} style={{ fontSize: s.size ?? 110, fontWeight: 900, color: s.color ?? C.text, lineHeight: 1.15, marginTop: 14, whiteSpace: 'nowrap' }}>{s.value}</Pop>
      {s.extra}{s.src && <Pop at={s.valueAt ?? s.at}><Src>{s.src}</Src></Pop>}
    </Panel></Pop>))}
  </div>
);
type Side = { label: string; value: React.ReactNode; at: number; valueAt?: number; color?: string; size?: number; src?: string; extra?: React.ReactNode };

/** 大数字：数字滚到位，下面一行说明。 */
export const BigNumber: React.FC<{ to: number; unit: string; label: string; at: number; color?: string; size?: number; src?: string }> = ({ to, unit, label, at, color = C.text, size = 260, src }) => (
  <Pop at={at} dy={40}>
    <div style={{ fontSize: 34, color: C.muted }}>{label}</div>
    <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1.05, color, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}><Count to={to} at={at} dur={0.7} /><span style={{ fontSize: size * 0.34, marginLeft: 12 }}>{unit}</span></div>
    {src && <Src>{src}</Src>}
  </Pop>
);

/** 引用卡：一句原话，逐段出现，下面署名。 */
export const Quote: React.FC<{ parts: string[]; ats: number[]; by: string; src?: string }> = ({ parts, ats, by, src }) => (
  <div style={{ borderLeft: `8px solid ${C.accent}`, paddingLeft: 48 }}>
    <div style={{ fontSize: 120, fontWeight: 900, color: C.accent, lineHeight: 0.6, height: 60 }}>“</div>
    <div style={{ fontSize: 92, fontWeight: 900, lineHeight: 1.3 }}>{parts.map((x, i) => <Pop key={x} at={ats[i]} dy={16} style={{ display: 'inline-block', marginRight: 18 }}>{x}</Pop>)}</div>
    <Pop at={ats[ats.length - 1] + 0.3} style={{ fontSize: 34, color: C.muted, marginTop: 26 }}>—— {by}</Pop>
    {src && <Pop at={ats[ats.length - 1] + 0.3}><Src>{src}</Src></Pop>}
  </div>
);

/** 环形占比。 */
export const Ring: React.FC<{ pct: number; at: number; label: string; src?: string; size?: number }> = ({ pct, at, label, src, size = 300 }) => {
  const t = useT(), p = prog(t, at, 1.0), r = size / 2 - 18, len = 2 * Math.PI * r;
  return (
    <Pop at={at} style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={22} />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.accent} strokeWidth={22} strokeLinecap="round" strokeDasharray={`${len * (pct / 100) * p} ${len}`} />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.3, fontWeight: 900 }}>{Math.round(pct * p)}%</div>
      </div>
      <div><div style={{ fontSize: 44, fontWeight: 600, whiteSpace: 'nowrap' }}>{label}</div>{src && <Src>{src}</Src>}</div>
    </Pop>
  );
};

/** 一个带来源的统计项。 */
export const Stat: React.FC<{ value: React.ReactNode; label: string; at: number; src?: string; color?: string }> = ({ value, label, at, src, color = C.text }) => (
  <Pop at={at}><Panel style={{ minWidth: 420 }}>
    <div style={{ fontSize: 30, color: C.muted, whiteSpace: 'nowrap' }}>{label}</div>
    <div style={{ fontSize: 96, fontWeight: 900, color, lineHeight: 1.15, whiteSpace: 'nowrap' }}>{value}</div>
    {src && <Src>{src}</Src>}
  </Panel></Pop>
);

/** 两份文件并排：各自到点出现，正文是几条逐行写出的横线。 */
export const DocPair: React.FC<{ left: Doc; right: Doc }> = ({ left, right }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', gap: 60, justifyContent: 'center' }}>{[left, right].map((d) => (
      <Pop key={d.title} at={d.at} dy={40}><div style={{ width: 560, height: 500, background: '#EDEAE1', borderRadius: 10, padding: '44px 48px', boxSizing: 'border-box', color: '#14171D', boxShadow: '0 30px 60px #0008', transform: `rotate(${d.tilt ?? 0}deg)` }}>
        <div style={{ fontSize: 24, color: '#6B7280' }}>{d.who}</div>
        <div style={{ fontSize: 60, fontWeight: 900, marginTop: 6, borderBottom: `4px solid ${d.color}`, paddingBottom: 14 }}>{d.title}</div>
        {[1, 0.92, 0.97, 0.6, 0.88, 0.74].map((w, i) => <div key={i} style={{ height: 14, borderRadius: 7, background: '#C9C5B9', marginTop: 24, width: `${w * 100 * prog(t, d.at + 0.35 + i * 0.22, 0.4)}%` }} />)}
      </div></Pop>))}
    </div>
  );
};
type Doc = { title: string; who: string; at: number; color: string; tilt?: number };
export { Chip };
