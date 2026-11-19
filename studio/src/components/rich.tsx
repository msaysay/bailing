// 第二批组件：信息用图形表达，不重复口播原句。思路参考 remocn（split-flap、people grid、comment stream）、
// video-shotcraft（lower third、digit roll）与 FredTalk 的「对象 → 变化」做法，代码为本项目自写。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { prog, mix, inOut, useClock } from '../kit/clock';
import { C, FONT, Pop, Src, useT } from '../kit/kit';

const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // 固定种子的伪随机

/** 强调字幕：让这一句自己当主角。逐词到点出现，hot 的词变色放大。配合 Chrome 的 hero 行使用，底部字幕同时隐藏。 */
export const KineticLine: React.FC<{ seg: string; words: string[]; hot?: string[]; size?: number; align?: 'left' | 'center'; color?: string }> = ({ seg, words, hot = [], size = 150, align = 'left', color = C.accent }) => {
  const t = useT(), { say } = useClock();
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: `${size * 0.08}px ${size * 0.22}px`, justifyContent: align === 'center' ? 'center' : 'flex-start', alignItems: 'baseline' }}>
      {words.map((w) => { const a = say(seg, w), p = prog(t, a, 0.28), h = hot.includes(w);
        return <span key={w} style={{ fontSize: h ? size * 1.18 : size, fontWeight: 900, lineHeight: 1.12, color: h ? color : C.text, opacity: p, display: 'inline-block', transform: `translateY(${mix(size * 0.35, 0, p)}px) scale(${mix(0.86, 1, p)})`, transformOrigin: 'left bottom', filter: `blur(${(1 - p) * 10}px)`, whiteSpace: 'nowrap' }}>{w}</span>; })}
    </div>
  );
};

/** 翻牌年份：四位数字逐位翻到目标值，像机场翻牌。 */
export const FlapYear: React.FC<{ from: number; to: number; at: number; dur?: number; size?: number; color?: string }> = ({ from, to, at, dur = 1.2, size = 200, color = C.text }) => {
  const t = useT(), p = inOut((t - at) / dur), cur = String(Math.round(mix(from, to, p))).padStart(4, '0'), w = size * 0.68;
  const flick = p > 0 && p < 1 ? Math.abs(Math.sin(p * 36)) : 0;
  return (
    <div style={{ display: 'flex', gap: size * 0.06, perspective: 900 }}>
      {cur.split('').map((d, i) => (
        <div key={i} style={{ position: 'relative', width: w, height: size * 1.18, background: 'linear-gradient(180deg,#1B2130 0%,#141926 49%,#0D111A 51%,#151A27 100%)', borderRadius: size * 0.08, border: `1.5px solid ${C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums', transform: `rotateX(${flick * (i + 1) * 5}deg)`, boxShadow: '0 16px 36px #0008' }}>
          {d}<div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, background: '#05070B' }} />
        </div>
      ))}
    </div>
  );
};

/** 日历翻页：从一张日期翻到下一张。 */
export const CalendarFlip: React.FC<{ a: Leaf; b: Leaf; at: number }> = ({ a, b, at }) => {
  const t = useT(), p = inOut((t - at) / 0.7);
  const leaf = (l: Leaf, rot: number, op: number, z: number) => (
    <div style={{ position: 'absolute', inset: 0, background: '#EDEAE1', color: '#14171D', borderRadius: 22, overflow: 'hidden', transformOrigin: 'top center', transform: `rotateX(${rot}deg)`, opacity: op, zIndex: z, boxShadow: '0 26px 60px #000a', display: 'flex', flexDirection: 'column' }}>
      <div style={{ background: l.color, color: '#fff', fontSize: 34, fontWeight: 600, padding: '14px 0', textAlign: 'center' }}>{l.top}</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1 }}>{l.day}</div><div style={{ fontSize: 40, fontWeight: 600, marginTop: 10 }}>{l.label}</div>
      </div>
    </div>
  );
  return <div style={{ position: 'relative', width: 330, height: 380, perspective: 1100 }}>{leaf(b, 0, 1, 1)}{leaf(a, -p * 100, p < 0.98 ? 1 : 0, 2)}</div>;
};
type Leaf = { top: string; day: string; label: string; color: string };

/** 人形点阵：total 个点，keep 个保留、其余到点熄灭（或反过来点亮）。用来表示裁员、投票占比。 */
export const PeopleGrid: React.FC<{ total: number; keep: number; cols: number; at: number; mode?: 'drop' | 'light'; dot?: number; color?: string; dur?: number }> = ({ total, keep, cols, at, mode = 'drop', dot = 26, color = C.accent, dur = 1.4 }) => {
  const t = useT(), order = Array.from({ length: total }, (_, i) => i).sort((x, y) => rnd(x) - rnd(y));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${dot}px)`, gap: dot * 0.42 }}>
      {Array.from({ length: total }, (_, i) => { const rank = order.indexOf(i), changes = mode === 'drop' ? rank >= keep : rank < keep;
        const p = changes ? prog(t, at + (rank / total) * dur, 0.35) : 0, on = mode === 'drop' ? 1 - p : p;
        return <div key={i} style={{ width: dot, height: dot * 1.25, boxSizing: 'border-box', borderRadius: `${dot / 2}px ${dot / 2}px ${dot * 0.2}px ${dot * 0.2}px`, background: on > 0.5 ? color : 'transparent', border: `2px solid ${on > 0.5 ? color : C.muted}`, opacity: mix(0.45, 1, on), transform: `scale(${mix(0.86, 1, on)})` }} />; })}
    </div>
  );
};

/** 横向条形：几家公司的数字，逐条伸长。 */
export const Bars: React.FC<{ rows: { name: string; value: number; text: string; at: number }[]; max: number; width?: number; color?: string }> = ({ rows, max, width = 760, color = C.down }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
      {rows.map((r) => { const p = prog(t, r.at, 0.7);
        return <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 22, opacity: prog(t, r.at, 0.25) }}>
          <div style={{ width: 150, fontSize: 36, fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{r.name}</div>
          <div style={{ height: 46, width: Math.max(6, (r.value / max) * width * p), background: color, borderRadius: 8 }} />
          <div style={{ fontSize: 40, fontWeight: 900, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{r.text}</div>
        </div>; })}
    </div>
  );
};

/** 倒数格：n 个格子，一格一天，逐格划掉，剩最后一格闪红。 */
export const BurnDown: React.FC<{ days: number; at: number; dur?: number; cell?: number }> = ({ days, at, dur = 1.6, cell = 44 }) => {
  const t = useT(), gone = Math.floor(prog(t, at, dur) * (days - 1));
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(10, ${cell}px)`, gap: 8 }}>
      {Array.from({ length: days }, (_, i) => { const dead = i < gone, last = i === days - 1;
        return <div key={i} style={{ width: cell, height: cell, borderRadius: 8, border: `2px solid ${last ? C.down : C.line}`, background: dead ? 'transparent' : last ? C.down : C.surface, opacity: dead ? 0.35 : 1, position: 'relative' }}>
          {dead && <div style={{ position: 'absolute', left: 4, right: 4, top: '48%', height: 3, background: C.muted, transform: 'rotate(-45deg)' }} />}
        </div>; })}
    </div>
  );
};

/** 内网帖子：一张帖子卡，评论数滚动上涨，评论气泡从下往上涌。内容用灰条示意，不编造原文。 */
export const ForumPost: React.FC<{ at: number; to: number; label: string; countLabel: string; width?: number }> = ({ at, to, label, countLabel, width = 760 }) => {
  const t = useT(), p = prog(t, at + 0.3, 1.6), n = Math.round(to * p);
  return (
    <Pop at={at} dy={40}><div style={{ width, height: 470, background: '#F2F0EA', borderRadius: 22, color: '#14171D', overflow: 'hidden', position: 'relative', boxShadow: '0 30px 70px #000a' }}>
      <div style={{ padding: '26px 34px 0', display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ width: 52, height: 52, borderRadius: 26, background: '#C9C5B9' }} /><div><div style={{ fontSize: 26, fontWeight: 600 }}>{label}</div><div style={{ fontSize: 18, color: '#6B7280' }}>内容示意，非原文</div></div>
      </div>
      {[0.92, 0.78, 0.55].map((w, i) => <div key={i} style={{ height: 14, borderRadius: 7, background: '#C9C5B9', margin: '18px 34px 0', width: `${w * 80}%` }} />)}
      <div style={{ position: 'absolute', left: 34, top: 205, right: 34, bottom: 0, overflow: 'hidden' }}>
        {Array.from({ length: 16 }, (_, i) => { const y = 300 - ((t - at) * 150 + i * 62) % 420, w = 40 + rnd(i) * 45;
          return <div key={i} style={{ position: 'absolute', left: (i % 2) * 60, top: y, width: `${w}%`, height: 40, borderRadius: 20, background: i % 3 === 0 ? '#DCE8FF' : '#E2DFD6', opacity: t > at + 0.3 ? 1 : 0 }} />; })}
      </div>
      <div style={{ position: 'absolute', right: 26, top: 22, background: C.accent, color: '#fff', borderRadius: 16, padding: '8px 22px', textAlign: 'right' }}>
        <div style={{ fontSize: 60, fontWeight: 900, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>{n.toLocaleString('en-US')}{p >= 1 ? '+' : ''}</div><div style={{ fontSize: 20 }}>{countLabel}</div>
      </div>
    </div></Pop>
  );
};

/** 新闻角标：地点 + 时间 + 画面来源，贴在实拍上。 */
export const LowerThird: React.FC<{ at: number; place: string; meta: string }> = ({ at, place, meta }) => {
  const t = useT(), p = prog(t, at, 0.5);
  return (
    <div style={{ position: 'absolute', left: 140, bottom: 210, display: 'flex', alignItems: 'stretch', fontFamily: FONT, opacity: p }}>
      <div style={{ width: 10, background: C.accent, transform: `scaleY(${p})`, transformOrigin: 'bottom' }} />
      <div style={{ background: 'rgba(8,11,17,.86)', padding: '18px 34px', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
        <div style={{ fontSize: 50, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{place}</div><div style={{ fontSize: 26, color: C.muted, marginTop: 4, whiteSpace: 'nowrap' }}>{meta}</div>
      </div>
    </div>
  );
};

/** 名牌：机构或身份，像会议桌上的名牌滑入。 */
export const Nameplate: React.FC<{ at: number; title: string; sub: string; src?: string }> = ({ at, title, sub, src }) => (
  <Pop at={at} dy={50}><div style={{ background: 'linear-gradient(180deg,#F2F0EA,#DAD6CA)', color: '#14171D', borderRadius: 10, padding: '30px 44px', minWidth: 520, boxShadow: '0 26px 50px #000a', borderBottom: '10px solid #9A9588' }}>
    <div style={{ fontSize: 26, color: '#6B7280' }}>{sub}</div><div style={{ fontSize: 62, fontWeight: 900, whiteSpace: 'nowrap', letterSpacing: 1 }}>{title}</div>
  </div>{src && <Src style={{ marginTop: 14 }}>{src}</Src>}</Pop>
);

/** 两份文件对撞：左边签名一行行累加，右边盖章。 */
export const PaperDuel: React.FC<{ left: { title: string; who: string; at: number }; right: { title: string; who: string; at: number; stamp: string } }> = ({ left, right }) => {
  const t = useT(), sheet: React.CSSProperties = { width: 600, height: 520, background: '#EDEAE1', borderRadius: 10, padding: '40px 46px', boxSizing: 'border-box', color: '#14171D', boxShadow: '0 30px 60px #0009', position: 'relative' };
  return (
    <div style={{ display: 'flex', gap: 70, justifyContent: 'center', alignItems: 'center' }}>
      <Pop at={left.at} dy={40}><div style={{ ...sheet, transform: 'rotate(-2.5deg)' }}>
        <div style={{ fontSize: 24, color: '#6B7280' }}>{left.who}</div><div style={{ fontSize: 64, fontWeight: 900, borderBottom: `4px solid ${C.accent}`, paddingBottom: 12 }}>{left.title}</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px 22px', marginTop: 26 }}>
          {Array.from({ length: 24 }, (_, i) => <svg key={i} width="150" height="26" style={{ opacity: prog(t, left.at + 0.4 + i * 0.09, 0.2) }}><path d={`M4 ${14 + rnd(i) * 6} C ${30 + rnd(i + 9) * 20} ${rnd(i + 1) * 20}, ${60 + rnd(i + 5) * 20} ${26 - rnd(i + 2) * 18}, ${100 + rnd(i + 3) * 40} ${10 + rnd(i + 4) * 10}`} stroke="#28324A" strokeWidth="2.6" fill="none" strokeLinecap="round" /></svg>)}
        </div>
      </div></Pop>
      <Pop at={right.at} dy={40}><div style={{ ...sheet, transform: 'rotate(2deg)' }}>
        <div style={{ fontSize: 24, color: '#6B7280' }}>{right.who}</div><div style={{ fontSize: 64, fontWeight: 900, borderBottom: `4px solid ${C.down}`, paddingBottom: 12 }}>{right.title}</div>
        {[1, 0.94, 0.97, 0.62, 0.9, 0.86, 0.4].map((w, i) => <div key={i} style={{ height: 13, borderRadius: 7, background: '#C9C5B9', marginTop: 24, width: `${w * 100 * prog(t, right.at + 0.35 + i * 0.16, 0.35)}%` }} />)}
        <div style={{ position: 'absolute', right: 40, bottom: 44, border: `5px solid ${C.down}`, color: C.down, borderRadius: 10, padding: '6px 18px', fontSize: 34, fontWeight: 900, opacity: prog(t, right.at + 1.5, 0.2), transform: `rotate(-10deg) scale(${mix(1.6, 1, prog(t, right.at + 1.5, 0.25))})` }}>{right.stamp}</div>
      </div></Pop>
    </div>
  );
};

/** 全片质感层：细颗粒 + 底部进度线。 */
export const Finish: React.FC = () => {
  const t = useT(), { total } = useClock();
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ opacity: 0.07, mixBlendMode: 'overlay', backgroundImage: 'radial-gradient(#fff 0.6px, transparent 0.7px)', backgroundSize: '3px 3px', backgroundPosition: `${Math.floor(t * 30) % 3}px ${Math.floor(t * 30 * 7) % 3}px` }} />
      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 5, width: `${(t / total) * 100}%`, background: C.accent }} />
    </AbsoluteFill>
  );
};
