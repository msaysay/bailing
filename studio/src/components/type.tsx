// 文字与强调类组件：口播里「这句话要被看见」时用。字都由调用方给，注意不要和底部字幕逐字重复。
import React from 'react';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';

const cl = (v: number) => Math.max(0, Math.min(1, v));
const GREEN = '#4ADE80';

/** 打字机：一行字一个个敲出来，后面跟着光标。适合搜索词、提问、一句结论。 */
export const Typewriter: React.FC<{ text: string; at: number; cps?: number; size?: number; color?: string; width?: number }> = ({ text, at, cps = 12, size = 84, color = C.text, width = 1400 }) => {
  const t = useT(), n = Math.max(0, Math.min(text.length, Math.floor((t - at) * cps))), done = n >= text.length, on = !done || Math.floor(t * 2) % 2 === 0;
  return <div style={{ width, fontFamily: FONT, fontSize: size, fontWeight: 900, color, lineHeight: 1.35 }}>{text.slice(0, n)}<span style={{ display: 'inline-block', width: size * 0.08, height: size * 0.95, background: C.accent, marginLeft: 6, verticalAlign: 'text-bottom', opacity: on ? 1 : 0 }} /><span style={{ opacity: 0 }}>{text.slice(n)}</span></div>;
};
/** 换词：一句话里只有一个词在换，其余不动。适合「不是 A，不是 B，是 C」。 */
export const WordSwap: React.FC<{ prefix: string; words: string[]; ats: number[]; suffix?: string; size?: number; at: number }> = ({ prefix, words, ats, suffix = '', size = 100, at }) => {
  const t = useT(); let cur = 0; ats.forEach((a) => { cur += inOut((t - a) / 0.45); }); const lh = size * 1.3, w = Math.max(...words.map((x) => x.length)) * size, last = Math.round(cur) === words.length - 1;
  return (
    <div style={{ display: 'flex', alignItems: 'center', fontFamily: FONT, fontSize: size, fontWeight: 900, color: C.text, opacity: prog(t, at, 0.4), whiteSpace: 'nowrap' }}>
      <span>{prefix}</span>
      <div style={{ height: lh, width: w + size * 0.5, overflow: 'hidden', margin: `0 ${size * 0.15}px`, background: C.surface, borderRadius: size * 0.16, border: `3px solid ${last ? C.warm : C.line}` }}><div style={{ transform: `translateY(${-cur * lh}px)` }}>{words.map((x, i) => <div key={i} style={{ height: lh, lineHeight: `${lh}px`, textAlign: 'center', color: i === words.length - 1 ? C.warm : C.muted }}>{x}</div>)}</div></div>
      <span>{suffix}</span>
    </div>
  );
};
/** 荧光笔：一段话里，几处关键词被荧光笔依次划过。适合引用原文后划重点。 */
export const Highlighter: React.FC<{ parts: { t: string; at?: number; color?: string }[]; at: number; size?: number; width?: number }> = ({ parts, at, size = 60, width = 1300 }) => {
  const t = useT();
  return <div style={{ width, fontFamily: FONT, fontSize: size, fontWeight: 600, color: C.text, lineHeight: 1.7, opacity: prog(t, at, 0.5) }}>{parts.map((x, i) => x.at === undefined ? <span key={i}>{x.t}</span>
    : <span key={i} style={{ backgroundImage: `linear-gradient(${x.color ?? 'rgba(255,212,121,.5)'}, ${x.color ?? 'rgba(255,212,121,.5)'})`, backgroundRepeat: 'no-repeat', backgroundSize: `${inOut((t - x.at) / 0.6) * 100}% 52%`, backgroundPosition: '0 86%', fontWeight: 900 }}>{x.t}</span>)}</div>;
};
/** 编号要点：大号的 1、2、3 带着要点依次出现，讲到哪条哪条最亮。 */
export const NumberedPoints: React.FC<{ items: { title: string; note?: string }[]; ats: number[]; width?: number }> = ({ items, ats, width = 1300 }) => {
  const t = useT(); let act = -1; ats.forEach((a, i) => { if (t >= a) act = i; });
  return (
    <div style={{ width, display: 'flex', flexDirection: 'column', gap: 34, fontFamily: FONT }}>
      {items.map((it, i) => { const p = prog(t, ats[i], 0.45), me = i === act;
        return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 40, opacity: p * (me ? 1 : 0.45), transform: `translateX(${mix(-50, 0, p)}px)` }}>
          <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1, width: 130, textAlign: 'center', color: me ? C.warm : 'transparent', WebkitTextStroke: `3px ${me ? C.warm : C.muted}` }}>{i + 1}</div>
          <div><div style={{ fontSize: 64, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{it.title}</div>{it.note && <div style={{ fontSize: 32, color: C.muted, marginTop: 6 }}>{it.note}</div>}</div>
        </div>; })}
    </div>
  );
};
/** 关键词云：一堆词大小不一地冒出来，最后其中一个被点亮。讲「大家都在说什么」。 */
export const KeywordCloud: React.FC<{ words: { text: string; w: 1 | 2 | 3; at: number }[]; hot: number; hotAt: number; width?: number }> = ({ words, hot, hotAt, width = 1400 }) => {
  const t = useT(), k = prog(t, hotAt, 0.5), fs = [46, 72, 112];
  return (
    <div style={{ width, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '18px 44px', fontFamily: FONT }}>
      {words.map((x, i) => { const p = prog(t, x.at, 0.4), me = i === hot;
        return <div key={i} style={{ fontSize: fs[x.w - 1], fontWeight: x.w === 1 ? 600 : 900, lineHeight: 1.25, color: me ? `rgb(${Math.round(mix(243, 255, k))},${Math.round(mix(241, 212, k))},${Math.round(mix(234, 121, k))})` : C.text, opacity: p * (me ? 1 : mix(x.w === 1 ? 0.6 : 0.9, 0.22, k)), transform: `scale(${mix(0.5, 1, p) * (me ? mix(1, 1.15, k) : 1)})`, whiteSpace: 'nowrap' }}>{x.text}</div>; })}
    </div>
  );
};
/** 词条卡：像词典一样解释一个术语：词、读音或英文、词性、一两条释义。 */
export const DefinitionCard: React.FC<{ term: string; phon?: string; pos?: string; defs: string[]; at: number; width?: number }> = ({ term, phon, pos, defs, at, width = 1150 }) => {
  const t = useT(), p = prog(t, at, 0.55);
  return (
    <div style={{ width, background: '#F3F1EA', borderRadius: 26, padding: '54px 64px', boxSizing: 'border-box', fontFamily: FONT, color: '#14171D', opacity: p, transform: `translateY(${mix(50, 0, p)}px) rotate(${mix(1.5, 0, p)}deg)`, boxShadow: '0 44px 100px rgba(0,0,0,.6)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 26 }}><div style={{ fontSize: 110, fontWeight: 900, lineHeight: 1.1 }}>{term}</div>{phon && <div style={{ fontSize: 36, color: '#6B7280' }}>{phon}</div>}{pos && <div style={{ fontSize: 28, fontWeight: 900, color: '#F3F1EA', background: '#14171D', padding: '2px 16px', borderRadius: 8 }}>{pos}</div>}</div>
      <div style={{ height: 4, background: '#14171D', margin: '22px 0 26px', width: `${prog(t, at + 0.3, 0.6) * 100}%` }} />
      {defs.map((d, i) => { const q = prog(t, at + 0.7 + i * 0.5, 0.4); return <div key={i} style={{ display: 'flex', gap: 22, fontSize: 44, lineHeight: 1.45, marginBottom: 12, opacity: q, transform: `translateY(${mix(14, 0, q)}px)` }}><span style={{ fontWeight: 900, color: '#2563EB' }}>{i + 1}.</span><span>{d}</span></div>; })}
    </div>
  );
};
/** 公式：几个词用加减乘除和等号连成一条式子。把一个判断压成一行。 */
export const Formula: React.FC<{ items: { text: string; op?: boolean; at: number; color?: string }[]; size?: number }> = ({ items, size = 76 }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size * 0.38, fontFamily: FONT }}>
      {items.map((x, i) => { const p = prog(t, x.at, 0.4);
        return x.op ? <div key={i} style={{ fontSize: size * 1.3, fontWeight: 900, color: C.muted, opacity: p, transform: `scale(${mix(0.4, 1, p)})` }}>{x.text}</div>
          : <div key={i} style={{ fontSize: size, fontWeight: 900, color: x.color ? '#14171D' : C.text, background: x.color ?? C.surface, border: `3px solid ${x.color ?? C.line}`, borderRadius: size * 0.3, padding: `${size * 0.3}px ${size * 0.55}px`, opacity: p, transform: `translateY(${mix(40, 0, p)}px)`, whiteSpace: 'nowrap' }}>{x.text}</div>; })}
    </div>
  );
};
/** 盖章：一枚印章砸在内容上（已证实、谣言、作废、通过）。 */
export const Stamp: React.FC<{ text: string; at: number; color?: string; size?: number; rotate?: number; dx?: number; dy?: number; children?: React.ReactNode }> = ({ text, at, color = C.down, size = 130, rotate = -12, dx = 0, dy = 0, children }) => {
  const t = useT(), p = cl((t - at) / 0.16), s = p < 1 ? mix(3.2, 0.94, p) : mix(0.94, 1, cl((t - at - 0.16) / 0.12)), shake = p >= 1 ? Math.max(0, 1 - (t - at - 0.16) / 0.25) * 5 : 0;
  return (
    <div style={{ position: 'relative', display: 'inline-block', transform: `translateY(${shake}px)` }}>{children}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 900, color, border: `${size * 0.08}px solid ${color}`, outline: `${size * 0.03}px solid ${color}`, outlineOffset: size * 0.05, borderRadius: size * 0.16, padding: `${size * 0.05}px ${size * 0.4}px`, letterSpacing: size * 0.12, transform: `translate(${dx}px, ${dy}px) rotate(${rotate}deg) scale(${s})`, opacity: t < at ? 0 : mix(0.2, 0.92, p), whiteSpace: 'nowrap', background: 'rgba(11,14,20,.35)' }}>{text}</div>
      </div>
    </div>
  );
};
/** 倒计时环：一个圆环随时间走空，中间是剩下的秒数。适合「给你三秒想一想」。 */
export const Countdown: React.FC<{ from: number; at: number; size?: number; label?: string }> = ({ from, at, size = 440, label }) => {
  const t = useT(), left = Math.max(0, from - Math.max(0, t - at)), r = size / 2 - 30, c = 2 * Math.PI * r, col = left <= Math.min(3, from / 3) ? C.down : C.accent, n = Math.ceil(left), beat = 1 - (left - Math.floor(left));
  return (
    <div style={{ width: size, fontFamily: FONT, opacity: prog(t, at - 0.3, 0.3), textAlign: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.line} strokeWidth={26} /><circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={col} strokeWidth={26} strokeLinecap="round" strokeDasharray={`${(left / from) * c} ${c}`} /></svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.5, fontWeight: 900, color: left <= 0 ? C.down : C.text, transform: `scale(${left > 0 && t >= at ? mix(1.18, 1, cl(beat * 3)) : 1})` }}>{n}</div>
      </div>
      {label && <div style={{ fontSize: 40, color: C.muted, marginTop: 20 }}>{label}</div>}
    </div>
  );
};
/** 误区翻面：一张卡先写「你以为」，翻过来是「其实」。 */
export const MythFact: React.FC<{ myth: string; fact: string; at: number; flipAt: number; width?: number; tags?: [string, string] }> = ({ myth, fact, at, flipAt, width = 1100, tags = ['你以为', '其实'] }) => {
  const t = useT(), p = prog(t, at, 0.5), rot = inOut((t - flipAt) / 0.7) * 180, front = rot < 90, h = 440;
  const face = (tag: string, text: string, col: string, back: boolean) => <div style={{ position: 'absolute', inset: 0, background: C.surface, border: `4px solid ${col}`, borderRadius: 30, padding: '44px 60px', boxSizing: 'border-box', transform: back ? 'rotateY(180deg)' : undefined, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
    <div style={{ alignSelf: 'flex-start', fontSize: 36, fontWeight: 900, color: '#14171D', background: col, padding: '4px 24px', borderRadius: 10, marginBottom: 26 }}>{tag}</div><div style={{ fontSize: 68, fontWeight: 900, color: C.text, lineHeight: 1.3 }}>{text}</div></div>;
  return <div style={{ width, height: h, perspective: 1800, fontFamily: FONT, opacity: p, transform: `translateY(${mix(40, 0, p)}px)` }}><div style={{ position: 'relative', width: '100%', height: '100%', transform: `rotateY(${rot}deg)` }}>{front ? face(tags[0], myth, C.down, false) : face(tags[1], fact, GREEN, true)}</div></div>;
};
/** 利弊两栏：左边一条条打勾，右边一条条打叉。 */
export const ProsCons: React.FC<{ pros: string[]; cons: string[]; prosAts: number[]; consAts: number[]; titles?: [string, string]; width?: number }> = ({ pros, cons, prosAts, consAts, titles = ['好处', '代价'], width = 1500 }) => {
  const t = useT(), a = prog(t, Math.min(prosAts[0], consAts[0]) - 0.4, 0.4);
  const col = (title: string, items: string[], ats: number[], c: string, mark: string) => <div style={{ flex: 1, background: C.surface, border: `2px solid ${C.line}`, borderTop: `8px solid ${c}`, borderRadius: 24, padding: '34px 44px' }}>
    <div style={{ fontSize: 52, fontWeight: 900, color: c, marginBottom: 22 }}>{title}</div>
    {items.map((x, i) => { const p = prog(t, ats[i], 0.4); return <div key={i} style={{ display: 'flex', gap: 22, alignItems: 'center', fontSize: 44, fontWeight: 600, color: C.text, marginBottom: 20, opacity: p, transform: `translateX(${mix(-30, 0, p)}px)` }}><span style={{ width: 54, height: 54, borderRadius: 27, background: c, color: '#14171D', fontSize: 36, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', transform: `scale(${mix(0.2, 1, p)})` }}>{mark}</span>{x}</div>; })}</div>;
  return <div style={{ width, display: 'flex', gap: 40, fontFamily: FONT, opacity: a }}>{col(titles[0], pros, prosAts, GREEN, '✓')}{col(titles[1], cons, consAts, C.down, '✕')}</div>;
};
/** 比分牌：两边各一个数字，变化时数字滚动。讲「几比几」「谁领先」。 */
export const Scoreboard: React.FC<{ a: { name: string; from: number; to: number; color?: string }; b: { name: string; from: number; to: number; color?: string }; at: number; changeAt: number; size?: number }> = ({ a, b, at, changeAt, size = 260 }) => {
  const t = useT(), p = prog(t, at, 0.5), k = inOut((t - changeAt) / 0.6);
  const side = (s: { name: string; from: number; to: number; color?: string }, col: string) => <div style={{ textAlign: 'center' }}>
    <div style={{ width: size * 1.25, height: size * 1.2, background: '#06080C', border: `3px solid ${C.line}`, borderRadius: 26, overflow: 'hidden', position: 'relative' }}><div style={{ transform: `translateY(${-(s.from === s.to ? 0 : k) * size * 1.2}px)` }}>{[s.from, s.to].map((v, i) => <div key={i} style={{ height: size * 1.2, lineHeight: `${size * 1.2}px`, fontSize: size, fontWeight: 900, color: s.color ?? col }}>{v}</div>)}</div><div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, background: 'rgba(0,0,0,.6)' }} /></div>
    <div style={{ fontSize: 48, fontWeight: 900, color: C.text, marginTop: 22 }}>{s.name}</div></div>;
  return <div style={{ display: 'flex', alignItems: 'flex-start', gap: 50, fontFamily: FONT, opacity: p, transform: `scale(${mix(0.9, 1, p)})` }}>{side(a, C.accent)}<div style={{ fontSize: size * 0.7, fontWeight: 900, color: C.muted, lineHeight: `${size * 1.2}px` }}>:</div>{side(b, C.warm)}</div>;
};
/** 划掉改写：一句话里的一个词被划掉，上方手写式地改成另一个词。讲「纠正一个说法」。 */
export const StrikeReplace: React.FC<{ before: string; wrong: string; right: string; after?: string; at: number; fixAt: number; size?: number }> = ({ before, wrong, right, after = '', at, fixAt, size = 88 }) => {
  const t = useT(), k = inOut((t - fixAt) / 0.4), q = prog(t, fixAt + 0.35, 0.4);
  return (
    <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 900, color: C.text, opacity: prog(t, at, 0.4), paddingTop: size * 1.1, whiteSpace: 'nowrap' }}>{before}
      <span style={{ position: 'relative', display: 'inline-block', color: `rgba(243,241,234,${mix(1, 0.4, k)})`, margin: `0 ${size * 0.1}px` }}>{wrong}
        <span style={{ position: 'absolute', left: -6, top: '54%', height: size * 0.09, width: `calc(${k * 100}% + 12px)`, background: C.down, borderRadius: 4, transform: 'rotate(-2deg)' }} />
        <span style={{ position: 'absolute', left: '50%', bottom: '100%', transform: `translateX(-50%) rotate(-4deg) scale(${mix(0.5, 1, q)})`, color: C.warm, opacity: q, fontSize: size * 1.05, whiteSpace: 'nowrap' }}>{right}</span>
      </span>{after}
    </div>
  );
};
/** 砸字：几个大词一个个砸进画面。开场钩子、情绪最重的一句。 */
export const SlamWords: React.FC<{ words: { text: string; color?: string }[]; ats: number[]; size?: number; width?: number }> = ({ words, ats, size = 180, width = 1600 }) => {
  const t = useT();
  return <div style={{ width, display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: `0 ${size * 0.25}px`, fontFamily: FONT }}>{words.map((w, i) => { const p = cl((t - ats[i]) / 0.18), s = p < 1 ? mix(2.8, 0.95, p * p) : mix(0.95, 1, cl((t - ats[i] - 0.18) / 0.1));
    return <div key={i} style={{ fontSize: size, fontWeight: 900, lineHeight: 1.2, color: w.color ?? C.text, opacity: t < ats[i] ? 0 : mix(0.3, 1, p), transform: `scale(${s})`, whiteSpace: 'nowrap' }}>{w.text}</div>; })}</div>;
};
/** 提问卡：一个大问号加一个问题，下面可以冒出几个备选答案。把观众拉进来想。 */
export const QuestionCard: React.FC<{ q: string; at: number; hints?: string[]; hintAts?: number[]; width?: number }> = ({ q, at, hints = [], hintAts = [], width = 1400 }) => {
  const t = useT(), p = prog(t, at, 0.5), wob = Math.sin((t - at) * 2.2) * 6;
  return (
    <div style={{ width, display: 'flex', alignItems: 'center', gap: 60, fontFamily: FONT }}>
      <div style={{ fontSize: 420, fontWeight: 900, lineHeight: 0.9, color: C.warm, opacity: p, transform: `rotate(${mix(-40, 8 + wob, p)}deg) scale(${mix(0.3, 1, p)})`, flex: 'none' }}>？</div>
      <div><div style={{ fontSize: 84, fontWeight: 900, color: C.text, lineHeight: 1.3, opacity: prog(t, at + 0.3, 0.5), transform: `translateX(${mix(40, 0, prog(t, at + 0.3, 0.5))}px)` }}>{q}</div>
        <div style={{ display: 'flex', gap: 22, marginTop: 34, flexWrap: 'wrap' }}>{hints.map((h, i) => { const k = prog(t, hintAts[i], 0.4); return <div key={i} style={{ fontSize: 40, fontWeight: 600, color: C.text, border: `3px solid ${C.line}`, background: C.surface, borderRadius: 50, padding: '10px 34px', opacity: k, transform: `translateY(${mix(24, 0, k)}px)` }}>{h}</div>; })}</div></div>
    </div>
  );
};
/** 滚动大字带：几行镂空大字来回滚动当背景，中间压一个标题。做转场或章节的气氛。 */
export const Marquee: React.FC<{ text: string; at: number; rows?: number; size?: number; speed?: number; children?: React.ReactNode }> = ({ text, at, rows = 3, size = 170, speed = 110, children }) => {
  const t = useT(), p = prog(t, at, 0.6), unit = (text.length + 1) * size, off = (Math.max(0, t - at) * speed) % unit, line = Array.from({ length: 8 }).map(() => text).join('　');
  return (
    <div style={{ position: 'relative', width: 1900, height: rows * size * 1.2, overflow: 'hidden', fontFamily: FONT, opacity: p }}>
      {Array.from({ length: rows }).map((_, r) => <div key={r} style={{ position: 'absolute', top: r * size * 1.2, left: r % 2 ? -unit + off : -off - unit / 2, fontSize: size, fontWeight: 900, lineHeight: 1.2, whiteSpace: 'nowrap', color: r === Math.floor(rows / 2) ? 'rgba(91,155,255,.22)' : 'transparent', WebkitTextStroke: `2px ${r === Math.floor(rows / 2) ? 'transparent' : 'rgba(138,147,166,.4)'}` }}>{line}</div>)}
      {children && <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>}
    </div>
  );
};
