// 广播风（上）：系统件和文字类。参考 Yin's Broadcast「After Jensen」的做法：每章换一套底色、常驻外框、双语字幕、斜贴标签、巨大描边序号。
// 拆解见 docs/对标拆解-AfterJensen.md。实现是自己写的；片名、节目名、人物都由调用方给。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { prog, mix, inOut } from '../kit/clock';
import { FONT, useT } from '../kit/kit';
import { spring } from '../kit/motion';

export const BC = { black: '#0A0A0A', paper: '#EDEAE0', red: '#F2311D', lime: '#A6F51B', blue: '#2B14D6', green: '#0B2410', ink: '#111111', white: '#F5F3EC', dim: 'rgba(245,243,236,.5)' };
/** 六套章节底色：bg 底色、fg 主字色、hi 强调色、sub 次要字色。 */
export const BC_THEMES = {
  black: { bg: BC.black, fg: BC.white, hi: BC.lime, sub: 'rgba(245,243,236,.55)' }, paper: { bg: BC.paper, fg: BC.ink, hi: BC.red, sub: 'rgba(17,17,17,.55)' }, red: { bg: BC.red, fg: BC.ink, hi: BC.white, sub: 'rgba(17,17,17,.6)' },
  lime: { bg: BC.lime, fg: BC.ink, hi: BC.ink, sub: 'rgba(17,17,17,.6)' }, blue: { bg: BC.blue, fg: BC.white, hi: BC.lime, sub: 'rgba(245,243,236,.6)' }, green: { bg: BC.green, fg: BC.white, hi: BC.lime, sub: 'rgba(245,243,236,.55)' },
} as const;
export type BcTheme = keyof typeof BC_THEMES;
export const MONO = '"JetBrains Mono", "DejaVu Sans Mono", monospace';
const cl = (v: number) => Math.max(0, Math.min(1, v));
const rnd = (i: number) => { const x = Math.sin(i * 91.3 + 17.7) * 43758.5453; return x - Math.floor(x); };
const H: React.CSSProperties = { fontFamily: FONT, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1 };

/** 瘦高数字：把字横向压窄，做出「又瘦又高」的数据字。 */
export const Thin: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 160, color, style }) => <span style={{ display: 'inline-block', fontFamily: FONT, fontWeight: 400, fontSize: size, lineHeight: 1, color, transform: 'scaleX(.62)', transformOrigin: 'left center', whiteSpace: 'nowrap', letterSpacing: '0.02em', ...style }}>{children}</span>;
/** 半调网点底：一整块章节底色，上面一层细网点。六套配色之一。 */
export const HalftoneBg: React.FC<{ theme?: BcTheme; dots?: boolean; children?: React.ReactNode; style?: React.CSSProperties }> = ({ theme = 'paper', dots = true, children, style }) => { const th = BC_THEMES[theme], dark = theme === 'black' || theme === 'blue' || theme === 'green'; return <div style={{ position: 'relative', background: th.bg, color: th.fg, overflow: 'hidden', ...style }}>{dots && <div style={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${dark ? 'rgba(255,255,255,.09)' : 'rgba(0,0,0,.1)'} 1.6px, transparent 1.8px)`, backgroundSize: '14px 14px', WebkitMaskImage: 'linear-gradient(120deg, transparent 5%, #000 45%, transparent 95%)', maskImage: 'linear-gradient(120deg, transparent 5%, #000 45%, transparent 95%)' }} />}<div style={{ position: 'relative', width: '100%', height: '100%' }}>{children}</div></div>; };
/** 说明行：画面左上角一行等宽小字，交代「这是什么数据、什么口径」。 */
export const MetaLine: React.FC<{ text: string; at: number; color?: string; size?: number }> = ({ text, at, color = 'currentColor', size = 22 }) => { const t = useT(), n = Math.floor(cl((t - at) / 0.6) * text.length); return <div style={{ fontFamily: MONO, fontSize: size, letterSpacing: '0.12em', color, opacity: 0.75, whiteSpace: 'nowrap' }}>{text.slice(0, n)}</div>; };
/** 斜贴标签：一块实色小标签歪着贴上来，中英各半。给人或事下一个短结论。 */
export const BiTag: React.FC<{ text: string; at: number; bg?: string; color?: string; rotate?: number; size?: number }> = ({ text, at, bg = BC.red, color = '#fff', rotate = -3, size = 34 }) => { const t = useT(), v = spring(t - at, { from: 0, to: 1, stiffness: 260, damping: 16 }); return <div style={{ display: 'inline-block', ...H, fontSize: size, letterSpacing: '-0.01em', background: bg, color, padding: `${size * 0.22}px ${size * 0.5}px`, transform: `rotate(${rotate}deg) scale(${Math.max(0, v)})`, opacity: t < at ? 0 : 1, whiteSpace: 'nowrap' }}>{text}</div>; };
/** 常驻外框：四角角标、左上节目名、顶部带刻度的进度线、右上计时、左侧竖排章节号。整片挂着，让画面像一档节目。 */
export const BroadcastFrame: React.FC<{ show: string; episode: string; ticker?: string; chapter: string; index: string; from: number; to: number; color?: string; children?: React.ReactNode; width?: number; height?: number }> = ({ show, episode, ticker = '', chapter, index, from, to, color = BC.white, children, width = 1920, height = 1080 }) => {
  const t = useT(), f = cl((t - from) / (to - from)), e = Math.max(0, t - from), tc = `T+${String(Math.floor(e / 60)).padStart(2, '0')}:${(e % 60).toFixed(1).padStart(4, '0')}`, m = 26, L = 22;
  const corner = (h: 'left' | 'right', v: 'top' | 'bottom') => <div style={{ position: 'absolute', [h]: m, [v]: m, width: L, height: L, [`border${v === 'top' ? 'Top' : 'Bottom'}`]: `2px solid ${color}`, [`border${h === 'left' ? 'Left' : 'Right'}`]: `2px solid ${color}`, opacity: 0.7 } as React.CSSProperties} />;
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}>{children}
      <div style={{ position: 'absolute', inset: 0, color, fontFamily: MONO, fontSize: 15, letterSpacing: '0.14em', pointerEvents: 'none' }}>
        {corner('left', 'top')}{corner('right', 'top')}{corner('left', 'bottom')}{corner('right', 'bottom')}
        <div style={{ position: 'absolute', left: m + 34, top: m + 2, whiteSpace: 'nowrap' }}>{show} <span style={{ color: BC.red }}>●</span> {episode}</div>
        <div style={{ position: 'absolute', left: width * 0.32, top: m + 8, width: width * 0.36, height: 2, background: `repeating-linear-gradient(90deg, ${color} 0 14px, transparent 14px 22px)`, opacity: 0.35 }} /><div style={{ position: 'absolute', left: width * 0.32, top: m + 8, width: width * 0.36 * f, height: 2, background: color }} /><div style={{ position: 'absolute', left: width * 0.32 + width * 0.36 * f - 4, top: m + 4, width: 8, height: 10, background: color }} />
        <div style={{ position: 'absolute', right: m + 34, top: m + 2, whiteSpace: 'nowrap', textAlign: 'right' }}>{ticker}{ticker ? ' · ' : ''}{tc}</div>
        <div style={{ position: 'absolute', left: m + 2, top: height / 2, transform: 'rotate(-90deg) translateX(-50%)', transformOrigin: 'left top', whiteSpace: 'nowrap', opacity: 0.7 }}>{index} · {chapter}</div>
      </div>
    </div>
  );
};
/** 双语字幕条：底部一个深色条，左边一根强调色竖线；上面一行外文，念到的词变亮；下面一行中文用强调色。 */
export const BilingualCaption: React.FC<{ words: { t: string; at: number }[]; zh: string; at: number; until: number; color?: string; size?: number }> = ({ words, zh, at, until, color = BC.lime, size = 30 }) => {
  const t = useT(); if (t < at || t > until) return null;
  return <div style={{ display: 'inline-block', background: 'rgba(10,10,10,.82)', borderLeft: `5px solid ${color}`, padding: `${size * 0.4}px ${size * 0.8}px`, fontFamily: FONT, textAlign: 'center', opacity: prog(t, at, 0.15) }}><div style={{ fontSize: size, fontWeight: 600, lineHeight: 1.3 }}>{words.map((w, i) => <span key={i} style={{ color: t >= w.at ? '#fff' : 'rgba(255,255,255,.4)' }}>{w.t} </span>)}</div><div style={{ fontSize: size * 0.86, fontWeight: 600, color, lineHeight: 1.4 }}>{zh}</div></div>;
};
/** 章节页：整屏章节底色，左边标题和中文副题，右边巨大的描边序号，上下两行半透明的标题来回滚。 */
export const ChapterSplash: React.FC<{ no: string; title: string; sub: string; theme?: BcTheme; at: number; width?: number; height?: number }> = ({ no, title, sub, theme = 'paper', at, width = 1920, height = 1080 }) => {
  const t = useT(), th = BC_THEMES[theme], p = prog(t, at, 0.35), off = Math.max(0, t - at) * 60, ghost = Array.from({ length: 5 }).map(() => `${title} · ${sub}`).join(' · '), oc = theme === 'paper' ? BC.red : theme === 'red' ? BC.white : th.hi;
  return (
    <HalftoneBg theme={theme} style={{ width, height }}>
      {[0.1, 0.72].map((y, i) => <div key={i} style={{ position: 'absolute', top: height * y, left: i ? -off - 300 : off - 900, ...H, fontSize: height * 0.16, whiteSpace: 'nowrap', color: th.fg, opacity: 0.08 }}>{ghost}</div>)}
      <div style={{ position: 'absolute', right: width * 0.03, top: height * 0.22, ...H, fontSize: height * 0.6, color: 'transparent', WebkitTextStroke: `${height * 0.006}px ${oc}`, transform: `translateX(${mix(120, 0, p)}px)`, opacity: p }}>{no}</div>
      <div style={{ position: 'absolute', left: width * 0.06, top: height * 0.33 }}><div style={{ width: 70 * p, height: 8, background: oc, marginBottom: 50 }} /><div style={{ ...H, fontSize: height * 0.14, color: th.fg, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - inOut((t - at) / 0.5)) * 100}% 0 0)` }}>{title}</div><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: height * 0.055, color: oc, marginTop: 24, opacity: prog(t, at + 0.35, 0.3) }}>{sub}</div></div>
    </HalftoneBg>
  );
};
/** 双语大标题：两行外文大字（第二行强调色，句号是个圆环），旁边跟一行中文。片名、结论页用。 */
export const BilingualTitle: React.FC<{ lines: [string, string]; zh: string; sub?: string; at: number; size?: number; color?: string; hi?: string }> = ({ lines, zh, sub, at, size = 230, color = BC.white, hi = BC.lime }) => {
  const t = useT(), p = (i: number) => cl((t - at - i * 0.18) / 0.22), s = (i: number) => mix(1.5, 1, p(i));
  return (
    <div style={{ display: 'inline-block' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: size * 0.2 }}><div style={{ ...H, fontSize: size, color, opacity: t < at ? 0 : 1, transform: `scale(${s(0)})`, transformOrigin: 'left bottom' }}>{lines[0]}</div><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.42, color, opacity: prog(t, at + 0.5, 0.3), whiteSpace: 'nowrap' }}>{zh}</div></div>
      <div style={{ display: 'flex', alignItems: 'baseline', opacity: t < at + 0.18 ? 0 : 1, transform: `scale(${s(1)})`, transformOrigin: 'left top' }}><div style={{ ...H, fontSize: size, color: hi }}>{lines[1]}</div><div style={{ width: size * 0.16, height: size * 0.16, borderRadius: '50%', border: `${size * 0.035}px solid ${color}`, marginLeft: size * 0.05, boxSizing: 'border-box' }} /></div>
      {sub && <div style={{ fontFamily: MONO, fontSize: size * 0.1, letterSpacing: '0.1em', color, opacity: 0.7 * prog(t, at + 0.7, 0.3), marginTop: size * 0.12 }}>{sub}</div>}
    </div>
  );
};
/** 横幅：一条实色横幅从一侧刷出来，上面一行粗字。整宽压一句判词，或者小一号斜贴当印章。 */
export const SlabBanner: React.FC<{ text: string; at: number; bg?: string; color?: string; rotate?: number; size?: number; full?: boolean; sub?: string }> = ({ text, at, bg = BC.red, color = BC.ink, rotate = -2, size = 80, full, sub }) => { const t = useT(), p = inOut((t - at) / 0.35); return <div style={{ display: full ? 'block' : 'inline-block', transform: `rotate(${rotate}deg)` }}><div style={{ background: bg, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)`, padding: `${size * 0.16}px ${size * 0.5}px`, textAlign: full ? 'center' : 'left' }}><span style={{ ...H, fontSize: size, color, whiteSpace: 'nowrap' }}>{text}</span></div>{sub && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.4, color: '#fff', textAlign: 'center', marginTop: size * 0.2, opacity: prog(t, at + 0.35, 0.3) }}>{sub}</div>}</div>; };
/** 黑白对开：画面从中间分成一黑一白两半，各放一个大词。讲「内部和外部」「之前和之后」这类二分。 */
export const SplitWords: React.FC<{ left: { text: string; sub?: string }; right: { text: string; sub?: string }; at: number; width?: number; height?: number }> = ({ left, right, at, width = 1920, height = 1080 }) => {
  const t = useT(), p = inOut((t - at) / 0.5), side = (s: { text: string; sub?: string }, bg: string, c: string, sc: string, d: number, k: number) => <div style={{ position: 'absolute', left: d > 0 ? width / 2 : 0, top: 0, width: width / 2, height, background: bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translateX(${(1 - p) * d * width * 0.5}px)` }}><div style={{ ...H, fontSize: height * 0.15, color: c, transform: `scale(${mix(1.4, 1, cl((t - at - k) / 0.2))})`, opacity: t < at + k ? 0 : 1 }}>{s.text}</div>{s.sub && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: height * 0.085, color: sc, marginTop: 24, opacity: prog(t, at + k + 0.2, 0.3) }}>{s.sub}</div>}</div>;
  return <div style={{ position: 'relative', width, height, overflow: 'hidden', background: BC.red }}>{side(left, BC.black, BC.lime, BC.white, -1, 0.4)}{side(right, BC.paper, BC.red, BC.ink, 1, 0.75)}</div>;
};
/** 不等式标题：上一行一个词，下一行一个「≠」加另一个词。把「A 不等于 B」做成标题。 */
export const NotEqual: React.FC<{ a: string; b: string; sub?: string; at: number; size?: number; color?: string; hi?: string; op?: string }> = ({ a, b, sub, at, size = 200, color = BC.white, hi = BC.lime, op = '≠' }) => { const t = useT(), k = (d: number) => cl((t - at - d) / 0.2); return <div style={{ display: 'inline-block' }}><div style={{ ...H, fontSize: size, color, opacity: t < at ? 0 : 1, transform: `scale(${mix(1.3, 1, k(0))})`, transformOrigin: 'left bottom' }}>{a}</div><div style={{ display: 'flex', alignItems: 'center', gap: size * 0.2 }}><div style={{ ...H, fontSize: size, color: BC.red, opacity: t < at + 0.5 ? 0 : 1, transform: `scale(${mix(2.2, 1, k(0.5))}) rotate(${mix(-30, 0, k(0.5))}deg)` }}>{op}</div><div style={{ ...H, fontSize: size, color: hi, opacity: t < at + 0.9 ? 0 : 1, transform: `translateX(${mix(60, 0, k(0.9))}px)` }}>{b}</div></div>{sub && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.24, color, marginTop: size * 0.12, opacity: prog(t, at + 1.2, 0.3) }}>{sub}</div>}</div>; };
/** 衬线提问：一句衬线体的大问题安静地出现。和全片的粗黑体反着来，表示「停下来想一想」。 */
export const SerifQuestion: React.FC<{ lines: string[]; sub?: string; at: number; size?: number; color?: string; hi?: string }> = ({ lines, sub, at, size = 150, color = BC.ink, hi = BC.blue }) => { const t = useT(); return <div>{lines.map((l, i) => { const p = prog(t, at + i * 0.3, 0.7); return <div key={i} style={{ fontFamily: '"DejaVu Serif", "FreeSerif", Georgia, serif', fontSize: size, lineHeight: 1.12, letterSpacing: '-0.02em', color, opacity: p, filter: `blur(${(1 - p) * 10}px)`, whiteSpace: 'nowrap' }}>{l}</div>; })}{sub && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size * 0.3, color: hi, marginTop: size * 0.22, opacity: prog(t, at + lines.length * 0.3 + 0.3, 0.4) }}>{sub}</div>}</div>; };
/** 标签堆：一个大数字加一摞歪歪扭扭的黑白标签，一张张砸下来。讲「一夜之间好几家都这么干了」。 */
export const LabelStack: React.FC<{ count: string; label: string; note?: string; n?: number; at: number; gap?: number; fg?: string }> = ({ count, label, note, n = 6, at, gap = 0.28, fg = BC.ink }) => {
  const t = useT(), shown = Math.min(n, Math.floor(Math.max(0, t - at) / gap) + (t >= at ? 1 : 0)), m = count.match(/^(\d+)(.*)$/), num = m ? Math.min(Number(m[1]), Math.max(1, shown)) + m[2] : count;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 110 }}>
      <div><div style={{ ...H, fontSize: 420, color: fg }}>{t < at ? '' : num}</div>{note && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 50, color: fg, marginTop: 20, opacity: prog(t, at + n * gap, 0.3) }}>{note}</div>}</div>
      <div style={{ position: 'relative', width: 620, height: n * 96 + 40 }}>{Array.from({ length: n }).map((_, i) => { const e = t - at - i * gap, k = cl(e / 0.14), dark = i % 2 === 0; return <div key={i} style={{ position: 'absolute', left: (i % 2) * 150 + rnd(i) * 40, top: i * 96, ...H, fontSize: 56, letterSpacing: '-0.02em', background: dark ? BC.ink : BC.white, color: dark ? BC.red : BC.ink, padding: '14px 30px', transform: `rotate(${(rnd(i + 5) - 0.5) * 9}deg) scale(${mix(2.2, 1, k)})`, opacity: e < 0 ? 0 : 1, whiteSpace: 'nowrap', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>{label}</div>; })}</div>
    </div>
  );
};
/** 预测卡：一条预测占一屏——右边巨大的描边序号，左边两行大字结论，下面可带一组「标签 ≠ 标签」或一排月份刻度。 */
export const ForecastCard: React.FC<{ no: string; lines: [string, string]; zh?: string; tags?: [string, string]; ticks?: { labels: string[]; lit: number }; at: number; color?: string; hi?: string; width?: number }> = ({ no, lines, zh, tags, ticks, at, color = BC.white, hi = BC.lime, width = 1700 }) => {
  const t = useT(), p = prog(t, at, 0.4);
  return (
    <div style={{ position: 'relative', width, height: 620 }}>
      <div style={{ position: 'absolute', right: 0, top: -40, ...H, fontSize: 700, color: 'transparent', WebkitTextStroke: `5px ${no === '3' ? BC.red : hi}`, opacity: 0.55 * p, transform: `translateX(${mix(80, 0, p)}px)` }}>{no}</div>
      <div style={{ ...H, fontSize: 150, color, opacity: p, whiteSpace: 'nowrap' }}>{lines[0]}</div><div style={{ ...H, fontSize: 150, color: hi, marginTop: 10, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - inOut((t - at - 0.5) / 0.45)) * 100}% 0 0)` }}>{lines[1]}</div>
      {tags && <div style={{ display: 'flex', alignItems: 'center', gap: 34, marginTop: 50 }}><BiTag text={tags[0]} at={at + 1.2} bg={hi} color={BC.ink} rotate={0} size={44} /><div style={{ ...H, fontSize: 90, color: BC.red, opacity: prog(t, at + 1.6, 0.2) }}>≠</div><BiTag text={tags[1]} at={at + 1.9} bg={BC.white} color={BC.ink} rotate={0} size={44} /></div>}
      {ticks && <div style={{ display: 'flex', gap: 14, marginTop: 56 }}>{ticks.labels.map((l, i) => <div key={i} style={{ width: 120 }}><div style={{ height: 16, background: i < ticks.lit && t >= at + 1.1 + i * 0.16 ? hi : 'rgba(255,255,255,.2)' }} /><div style={{ fontFamily: MONO, fontSize: 18, color, opacity: 0.6, marginTop: 8 }}>{l}</div></div>)}</div>}
      {zh && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color, marginTop: 34, opacity: prog(t, at + 1, 0.3) }}>{zh}</div>}
    </div>
  );
};
/** 实拍压巨字：一两个巨大的词压在视频或图片的下半部，各用一种颜色；可带一枚斜贴标签。 */
export const FootageTitle: React.FC<{ children: React.ReactNode; words: { text: string; color?: string }[]; tag?: string; at: number; width?: number; height?: number; pos?: 'bottom' | 'center' }> = ({ children, words, tag, at, width = 1920, height = 1080, pos = 'bottom' }) => {
  const t = useT();
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: '#000' }}><div style={{ position: 'absolute', inset: 0, opacity: 0.8 }}>{children}</div><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.1) 40%, rgba(0,0,0,.6))' }} />
      {tag && <div style={{ position: 'absolute', right: width * 0.04, top: height * 0.5 }}><BiTag text={tag} at={at + 0.9} bg={BC.lime} color={BC.ink} size={height * 0.04} /></div>}
      <div style={{ position: 'absolute', left: 0, right: 0, ...(pos === 'bottom' ? { bottom: height * 0.14 } : { top: height * 0.34 }), display: 'flex', justifyContent: 'center', gap: width * 0.03 }}>{words.map((w, i) => { const k = cl((t - at - i * 0.25) / 0.22); return <div key={i} style={{ ...H, fontSize: height * 0.26 * Math.min(1, 10.5 / words.reduce((n, x) => n + x.text.length + 1, 0)), color: w.color ?? BC.white, opacity: t < at + i * 0.25 ? 0 : 1, transform: `translateY(${mix(80, 0, k)}px) scale(${mix(1.2, 1, k)})`, textShadow: '0 10px 40px rgba(0,0,0,.6)', whiteSpace: 'nowrap' }}>{w.text}</div>; })}</div>
    </div>
  );
};
/** 地名清单：几行大字地名（各一种颜色，后面跟中文小字）依次压在画面上。讲「从这里到那里到那里」。 */
export const PlaceList: React.FC<{ items: { text: string; zh?: string; color?: string }[]; ats: number[]; size?: number }> = ({ items, ats, size = 110 }) => { const t = useT(), cols = [BC.white, BC.lime, BC.red]; return <div>{items.map((it, i) => { const k = cl((t - ats[i]) / 0.2); return <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: size * 0.2, opacity: t < ats[i] ? 0 : 1, transform: `translateX(${mix(-60, 0, k)}px)` }}><span style={{ ...H, fontSize: size, lineHeight: 1.12, color: it.color ?? cols[i % 3], textShadow: '0 6px 30px rgba(0,0,0,.7)' }}>{it.text}</span>{it.zh && <span style={{ fontFamily: FONT, fontWeight: 600, fontSize: size * 0.36, color: BC.white }}>{it.zh}</span>}</div>; })}</div>; };
/** 片尾来源：亮色底上片名，下面密密的一屏来源清单一行行出现。把「数据从哪来」摆出来。 */
export const SourcesRoll: React.FC<{ title: string; sub?: string; lines: string[]; at: number; theme?: BcTheme; width?: number; height?: number }> = ({ title, sub, lines, at, theme = 'lime', width = 1920, height = 1080 }) => { const t = useT(), th = BC_THEMES[theme]; return <HalftoneBg theme={theme} style={{ width, height }}><div style={{ position: 'absolute', left: width * 0.05, top: height * 0.08, right: width * 0.05 }}><div style={{ ...H, fontSize: height * 0.1, color: th.fg, opacity: prog(t, at, 0.3) }}>{title}</div>{sub && <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: height * 0.034, color: th.fg, marginTop: 14, opacity: prog(t, at + 0.2, 0.3) }}>{sub}</div>}<div style={{ marginTop: height * 0.05, fontFamily: MONO, fontSize: height * 0.0185, lineHeight: 1.75, color: th.fg }}>{lines.map((l, i) => <div key={i} style={{ opacity: 0.85 * prog(t, at + 0.5 + i * 0.07, 0.2), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{l}</div>)}</div></div></HalftoneBg>; };
/** 乱码解出：一串字先是乱码，一位位「解」成真正的数字或词。给关键数字加一点悬念。 */
export const ScrambleText: React.FC<{ text: string; at: number; dur?: number; children?: (s: string) => React.ReactNode }> = ({ text, at, dur = 0.9, children }) => { const t = useT(), p = cl((t - at) / dur), step = Math.floor(t * 16), G = '0123456789#%+-ABCEF', s = t < at ? '' : text.split('').map((c, i) => (c === ' ' || rnd(i * 3 + 1) < p ? c : G[Math.floor(rnd(step * 7 + i * 13) * G.length)])).join(''); return <>{children ? children(s) : s}</>; };
/** 翻牌价格板：深色面板上，一行大号翻牌数字从旧价翻到新价，下面可带第二行小一号的；角上斜贴结论。 */
export const PriceBoard: React.FC<{ head: string; rows: { name: string; zh?: string; from: string; to: string; hi?: number }[]; tag?: string; at: number; flipAt: number; width?: number }> = ({ head, rows, tag, at, flipAt, width = 1300 }) => {
  const t = useT(), p = prog(t, at, 0.4), cell = (ch: string, big: boolean, on: boolean, k: number) => { const s = big ? 190 : 110; return <div style={{ width: s * 0.72, height: s, background: '#000', borderRadius: 10, marginLeft: 8, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', ...H, fontSize: s * 0.86, color: on ? BC.lime : BC.white, transform: `perspective(600px) rotateX(${Math.sin(k * Math.PI) * -70}deg)` }}>{ch}<div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, background: 'rgba(60,60,60,.9)' }} /></div>; };
  return (
    <div style={{ position: 'relative', width, opacity: p, transform: `translateY(${mix(40, 0, p)}px)` }}>
      <div style={{ background: '#161616', border: '3px solid #000', padding: '30px 44px 40px', boxShadow: '0 30px 80px rgba(0,0,0,.4)' }}>
        <div style={{ fontFamily: MONO, fontSize: 22, letterSpacing: '0.12em', color: BC.white, marginBottom: 20 }}>{head}</div>
        {rows.map((r, i) => { const big = i === 0, k = cl((t - flipAt - i * 0.35) / 0.5), cur = k < 0.5 ? r.from : r.to; return <div key={i} style={{ display: 'flex', alignItems: 'center', marginTop: i ? 26 : 0 }}><div style={{ flex: 1 }}><div style={{ ...H, fontSize: big ? 64 : 44, color: BC.white }}>{r.name}</div>{r.zh && <div style={{ fontFamily: FONT, fontSize: 24, color: BC.dim, marginTop: 6 }}>{r.zh}</div>}</div>{cur.split('').map((ch, j) => <React.Fragment key={j}>{cell(ch, big, k >= 0.5 && r.hi === j, r.from[j] === r.to[j] ? 0 : k)}</React.Fragment>)}</div>; })}
      </div>
      {tag && <div style={{ position: 'absolute', right: -30, bottom: -30 }}><BiTag text={tag} at={flipAt + 0.9} bg={BC.ink} color={BC.red} size={50} /></div>}
    </div>
  );
};
/** 霓虹招牌：砖墙上的一块霓虹灯管招牌，一段段闪亮，下面可以再亮几行小字。做片头片尾的台标。 */
export const NeonSign: React.FC<{ title: string; sub?: string; lines?: { text: string; color?: string }[]; at: number; hot?: number; width?: number; height?: number; color?: string }> = ({ title, sub, lines = [], at, hot = 0, width = 1920, height = 1080, color = BC.lime }) => {
  const t = useT(), e = t - at, on = (d: number, seed: number) => { const x = e - d; if (x < 0) return 0; if (x > 0.7) return 1; return rnd(Math.floor(x * 24) + seed) > 0.45 ? 1 : 0.15; }, glow = (c: string, k: number) => `0 0 ${6 * k}px #fff, 0 0 ${24 * k}px ${c}, 0 0 ${70 * k}px ${c}, 0 0 ${140 * k}px ${c}`, tube: React.CSSProperties = { ...H, letterSpacing: '0.02em', color: 'transparent' };
  return (
    <AbsoluteFill style={{ width, height, position: 'relative', overflow: 'hidden', background: '#0b0b0a' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: '#1b1712', backgroundImage: 'linear-gradient(#0c0a08 3px, transparent 3px), linear-gradient(90deg, #0c0a08 3px, transparent 3px), linear-gradient(90deg, #0c0a08 3px, transparent 3px)', backgroundSize: '120px 46px, 120px 92px, 120px 92px', backgroundPosition: '0 0, 0 0, 60px 46px', opacity: 0.9 }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 50% 42%, ${color}${Math.round(40 * on(0.2, 3)).toString(16).padStart(2, '0')} 0%, rgba(0,0,0,.25) 45%, rgba(0,0,0,.9) 90%)` }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: height * 0.16, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex' }}>{title.split('').map((ch, i) => { const k = on(0.15 + i * 0.12, i * 7), c = i === hot ? color : '#fff'; return <span key={i} style={{ ...tube, fontSize: height * 0.26, WebkitTextStroke: `${height * 0.008}px ${k > 0.5 ? (i === hot ? '#E9FFC0' : '#fff') : '#333'}`, textShadow: k > 0.5 ? glow(c === '#fff' ? '#9fdc3a' : c, 1) : 'none', opacity: 0.25 + 0.75 * k }}>{ch}</span>; })}</div>
        {sub && <div style={{ ...tube, fontSize: height * 0.085, letterSpacing: '0.22em', WebkitTextStroke: `${height * 0.004}px ${color}`, textShadow: on(1.1, 40) > 0.5 ? glow(color, 0.7) : 'none', opacity: 0.2 + 0.8 * on(1.1, 40), marginTop: 10 }}>{sub}</div>}
        {lines.map((l, i) => { const k = on(1.7 + i * 0.5, 60 + i * 9), c = l.color ?? color; return <div key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: height * 0.058, color: k > 0.5 ? '#fff' : '#333', textShadow: k > 0.5 ? glow(c, 0.6) : 'none', letterSpacing: '0.12em', marginTop: 22, opacity: e < 1.7 + i * 0.5 ? 0 : 0.3 + 0.7 * k }}>{l.text}</div>; })}
      </div>
    </AbsoluteFill>
  );
};
/** 信号锁定：黑场里一条横线上几个节点依次亮起，中间一个红圈定住，上面小字从「搜索信号」变成「信号锁定」。做冷开场。 */
export const SignalLock: React.FC<{ at: number; lockAt: number; labels?: [string, string]; nodes?: number; width?: number; color?: string }> = ({ at, lockAt, labels = ['SEARCHING FOR SIGNAL · 正在搜索信号', 'SIGNAL LOCKED · 信号已锁定'], nodes = 4, width = 1100, color = BC.lime }) => {
  const t = useT(), k = prog(t, lockAt, 0.3), sweep = cl((t - at) / (lockAt - at));
  return (
    <div style={{ position: 'relative', width, height: 220 }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, textAlign: 'center', fontFamily: MONO, fontSize: 22, letterSpacing: '0.2em', color: k > 0.5 ? color : BC.dim, opacity: Math.floor(t * 3) % 2 || k > 0.5 ? 1 : 0.4 }}>{k > 0.5 ? labels[1] : labels[0]}</div>
      <div style={{ position: 'absolute', left: 0, top: 118, width: width * sweep, height: 8, borderRadius: 4, background: color, boxShadow: `0 0 30px ${color}`, opacity: mix(0.5, 1, k) }} />
      {Array.from({ length: nodes }).map((_, i) => { const x = ((i + 0.5) / nodes) * width, lit = sweep >= (i + 0.5) / nodes; return <div key={i} style={{ position: 'absolute', left: x - 9, top: 113, width: 18, height: 18, borderRadius: 9, background: lit ? '#fff' : '#333', boxShadow: lit ? `0 0 20px ${color}` : 'none' }} />; })}
      <div style={{ position: 'absolute', left: width / 2 - 26, top: 96, width: 52, height: 52, borderRadius: 26, border: `6px solid ${BC.red}`, boxSizing: 'border-box', transform: `scale(${mix(2.4, 1, k)})`, opacity: k, background: BC.black }} />
    </div>
  );
};
