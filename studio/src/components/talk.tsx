// 口播叠加类组件：画面主体是人在说话时用。原则：人脸永远不被盖住，组件放在人的另一侧或下三分之一。
import React from 'react';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';

const cl = (v: number) => Math.max(0, Math.min(1, v));
const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 3.3) * 43758.5453; return x - Math.floor(x); };

/** 口播分屏：人从全屏缩到一侧变成一张卡，另一侧腾出来放内容。口播里插图表、网页时的标准做法。 */
export const TalkSplit: React.FC<{ speaker: React.ReactNode; children: React.ReactNode; at: number; until?: number; side?: 'left' | 'right'; ratio?: number; width?: number; height?: number }> = ({ speaker, children, at, until, side = 'left', ratio = 0.36, width = 1920, height = 1080 }) => {
  const t = useT(), k = inOut((t - at) / 0.7) * (until === undefined ? 1 : 1 - inOut((t - until) / 0.7)), m = 40, w = mix(width, width * ratio, k), h = mix(height, height - m * 2, k), x = side === 'left' ? mix(0, m, k) : mix(0, width - width * ratio - m, k);
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: C.bg }}>
      <div style={{ position: 'absolute', left: side === 'left' ? width * ratio + m * 2 : m, top: m, width: width * (1 - ratio) - m * 3, height: height - m * 2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: cl((k - 0.5) * 2), transform: `translateX(${mix(side === 'left' ? 60 : -60, 0, k)}px)` }}>{children}</div>
      <div style={{ position: 'absolute', left: x, top: mix(0, m, k), width: w, height: h, borderRadius: 34 * k, overflow: 'hidden', boxShadow: `0 30px 80px rgba(0,0,0,${0.6 * k})` }}><div style={{ position: 'absolute', left: (w - width) / 2, top: (h - height) / 2, width, height }}>{speaker}</div></div>
    </div>
  );
};
/** 侧边要点：要点卡从人的另一侧一张张滑进来。人在左就放右，人在右就放左。 */
export const SideBullets: React.FC<{ items: string[]; ats: number[]; side?: 'left' | 'right'; width?: number; title?: string }> = ({ items, ats, side = 'right', width = 640, title }) => {
  const t = useT(), d = side === 'right' ? 1 : -1;
  return (
    <div style={{ width, display: 'flex', flexDirection: 'column', gap: 18, fontFamily: FONT }}>
      {title && <div style={{ fontSize: 34, fontWeight: 900, color: C.warm, opacity: prog(t, ats[0] - 0.3, 0.3) }}>{title}</div>}
      {items.map((x, i) => { const p = prog(t, ats[i], 0.45); return <div key={i} style={{ background: C.glass, borderLeft: `8px solid ${C.accent}`, borderRadius: 14, padding: '18px 28px', fontSize: 44, fontWeight: 900, color: C.text, lineHeight: 1.3, opacity: p, transform: `translateX(${mix(80 * d, 0, p)}px)` }}>{x}</div>; })}
    </div>
  );
};
/** 逐字字幕：一句字幕里，念到哪个词哪个词变色并跳一下。短视频常见的强节奏字幕。 */
export const KaraokeCaption: React.FC<{ words: { t: string; at: number }[]; size?: number; color?: string }> = ({ words, size = 68, color = C.warm }) => {
  const t = useT();
  return (
    <div style={{ display: 'inline-flex', flexWrap: 'wrap', justifyContent: 'center', background: 'rgba(8,11,17,.78)', borderRadius: size * 0.3, padding: `${size * 0.22}px ${size * 0.5}px`, fontFamily: FONT, fontSize: size, fontWeight: 900, opacity: prog(t, words[0].at - 0.25, 0.25) }}>
      {words.map((w, i) => { const on = t >= w.at, cur = on && (i === words.length - 1 || t < words[i + 1].at), b = cur ? 1 - cl((t - w.at) / 0.18) : 0;
        return <span key={i} style={{ color: cur ? color : on ? C.text : 'rgba(243,241,234,.38)', transform: `translateY(${-b * size * 0.14}px) scale(${1 + b * 0.12})`, display: 'inline-block', margin: `0 ${size * 0.04}px` }}>{w.t}</span>; })}
    </div>
  );
};
/** 点赞飘屏：爱心和短评从下往上飘。讲「全网都在讨论」「评论区炸了」时的气氛。 */
export const ReactionFloat: React.FC<{ texts?: string[]; at: number; count?: number; width?: number; height?: number; dur?: number }> = ({ texts = [], at, count = 16, width = 520, height = 640, dur = 2.4 }) => {
  const t = useT();
  return (
    <div style={{ position: 'relative', width, height, fontFamily: FONT }}>
      {Array.from({ length: count }).map((_, i) => { const st = at + rnd(i) * 2.6, p = cl((t - st) / dur); if (p <= 0 || p >= 1) return null; const x = rnd(i + 20) * (width - 140) + Math.sin(p * 6 + i) * 26, y = height - 60 - p * (height - 80), tx = texts.length && i % 3 === 1 ? texts[i % texts.length] : null, col = [C.down, '#FF8FB1', C.warm][i % 3], s = mix(0.4, 1, cl(p * 5)) * (0.8 + rnd(i + 5) * 0.6);
        return <div key={i} style={{ position: 'absolute', left: x, top: y, opacity: 1 - cl((p - 0.7) / 0.3), transform: `scale(${s})` }}>{tx
          ? <div style={{ background: C.glass, border: `2px solid ${C.line}`, borderRadius: 40, padding: '6px 22px', fontSize: 32, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{tx}</div>
          : <svg width={64} height={58} viewBox="0 0 64 58"><path d="M32 56 C8 38 0 26 0 16 C0 6 8 0 16 0 C24 0 30 5 32 10 C34 5 40 0 48 0 C56 0 64 6 64 16 C64 26 56 38 32 56 Z" fill={col} /></svg>}</div>; })}
    </div>
  );
};
/** 评论弹出：观众评论一条条从下面顶上来，旧的往上挪并变淡。引用评论区的声音。 */
export const CommentPop: React.FC<{ comments: { name: string; text: string; at: number; likes?: string }[]; width?: number; keep?: number }> = ({ comments, width = 760, keep = 3 }) => {
  const t = useT(), rowH = 132; let f = 0; comments.forEach((c) => { f += inOut((t - c.at) / 0.4); });
  return (
    <div style={{ position: 'relative', width, height: keep * rowH, fontFamily: FONT }}>
      {comments.map((c, i) => { const age = f - 1 - i, p = prog(t, c.at, 0.4); if (age < -1 || age > keep) return null;
        return <div key={i} style={{ position: 'absolute', left: 0, bottom: age * rowH, width, height: rowH - 16, boxSizing: 'border-box', background: C.glass, border: `2px solid ${C.line}`, borderRadius: 22, padding: '0 24px', display: 'flex', alignItems: 'center', gap: 22, opacity: p * mix(1, 0, cl((age - (keep - 1.4)) / 1)), transform: `scale(${mix(0.8, 1, p)})`, transformOrigin: 'left bottom' }}>
          <div style={{ width: 70, height: 70, borderRadius: 35, background: [C.accent, C.warm, '#3DD6C6', '#B48CFF'][i % 4], color: '#0B0E14', fontSize: 38, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{c.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 24, color: C.muted }}>{c.name}</div><div style={{ fontSize: 36, fontWeight: 600, color: C.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.text}</div></div>
          {c.likes && <div style={{ fontSize: 26, color: C.down, fontWeight: 900, whiteSpace: 'nowrap' }}>♥ {c.likes}</div>}
        </div>; })}
    </div>
  );
};
/** 弹幕：几行文字从右往左飞过。讲「网友怎么说」，比评论弹出更热闹。 */
export const Danmaku: React.FC<{ items: string[]; at: number; rows?: number; width?: number; speed?: number; size?: number; hot?: number; gap?: number }> = ({ items, at, rows = 4, width = 1700, speed = 330, size = 46, hot, gap = 0.5 }) => {
  const t = useT();
  return (
    <div style={{ position: 'relative', width, height: rows * size * 1.9, overflow: 'hidden', fontFamily: FONT }}>
      {items.map((x, i) => { const st = at + i * gap + rnd(i) * 0.12, e = t - st; if (e < 0) return null; const me = i === hot;
        return <div key={i} style={{ position: 'absolute', top: (i % rows) * size * 1.9 + 8, left: width - e * speed, fontSize: me ? size * 1.25 : size, fontWeight: 900, color: me ? C.warm : C.text, whiteSpace: 'nowrap', textShadow: '0 2px 0 #000, 0 0 12px rgba(0,0,0,.9)', border: me ? `3px solid ${C.warm}` : 'none', borderRadius: 12, padding: me ? '0 16px' : 0 }}>{x}</div>; })}
    </div>
  );
};
/** 推近强调：说到重点时画面猛地推近一下再回去。口播最省事的「加重语气」。 */
export const ZoomPunch: React.FC<{ children: React.ReactNode; hits: { at: number; scale?: number; hold?: number; origin?: string }[]; width?: number; height?: number }> = ({ children, hits, width = 1920, height = 1080 }) => {
  const t = useT(); let s = 1, origin = '50% 40%'; hits.forEach((h) => { const k = prog(t, h.at, 0.16) * (1 - inOut((t - h.at - (h.hold ?? 1.2)) / 0.5)); if (k > 0.001) { s = mix(1, h.scale ?? 1.18, k); origin = h.origin ?? origin; } });
  return <div style={{ width, height, overflow: 'hidden', position: 'relative' }}><div style={{ width, height, transform: `scale(${s})`, transformOrigin: origin }}>{children}</div></div>;
};
/** 取景框：给口播画面加四个角标、录制红点和走动的时间码。做「采访感」「纪实感」。 */
export const SpeakerFrame: React.FC<{ children: React.ReactNode; title?: string; tag?: string; at: number; width?: number; height?: number }> = ({ children, title, tag = 'REC', at, width = 1920, height = 1080 }) => {
  const t = useT(), p = prog(t, at, 0.5), L = 70 * p, m = 44, e = Math.max(0, t - at), tc = `00:${String(Math.floor(e / 60)).padStart(2, '0')}:${String(Math.floor(e % 60)).padStart(2, '0')}:${String(Math.floor((e % 1) * 30)).padStart(2, '0')}`;
  const corner = (h: 'left' | 'right', v: 'top' | 'bottom') => <div style={{ position: 'absolute', [h]: m, [v]: m, width: L, height: L, [`border${v === 'top' ? 'Top' : 'Bottom'}`]: `6px solid ${C.text}`, [`border${h === 'left' ? 'Left' : 'Right'}`]: `6px solid ${C.text}` }} />;
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', fontFamily: FONT }}>{children}
      {corner('left', 'top')}{corner('right', 'top')}{corner('left', 'bottom')}{corner('right', 'bottom')}
      <div style={{ position: 'absolute', left: m + 34, top: m + 26, display: 'flex', alignItems: 'center', gap: 14, opacity: p }}><div style={{ width: 24, height: 24, borderRadius: 12, background: C.down, opacity: Math.floor(t * 2) % 2 ? 0.25 : 1 }} /><div style={{ fontSize: 30, fontWeight: 900, color: C.text, letterSpacing: 3 }}>{tag}</div></div>
      <div style={{ position: 'absolute', right: m + 34, top: m + 26, fontSize: 30, fontWeight: 600, color: C.text, opacity: p, fontVariantNumeric: 'tabular-nums' }}>{tc}</div>
      {title && <div style={{ position: 'absolute', left: m + 34, bottom: m + 26, fontSize: 36, fontWeight: 900, color: C.text, opacity: p, textShadow: '0 2px 10px rgba(0,0,0,.8)' }}>{title}</div>}
    </div>
  );
};
/** 关键词贴纸：一张带白边的贴纸「啪」地贴在人旁边，可带一个指向箭头。 */
export const KeywordSticker: React.FC<{ text: string; at: number; color?: string; rotate?: number; size?: number; arrow?: 'left' | 'right' }> = ({ text, at, color = C.warm, rotate = -6, size = 84, arrow }) => {
  const t = useT(), e = t - at, s = e < 0 ? 0 : 1 + Math.exp(-7 * e) * Math.cos(16 * e) * -0.55, wig = Math.sin(t * 2.4) * 1.2;
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 18, flexDirection: arrow === 'left' ? 'row' : 'row-reverse', fontFamily: FONT, transform: `scale(${Math.max(0, s)}) rotate(${rotate + wig}deg)`, opacity: e < 0 ? 0 : 1 }}>
      {arrow && <svg width={120} height={70} viewBox="0 0 120 70" style={{ transform: arrow === 'right' ? 'scaleX(-1)' : undefined }}><path d="M114 12 C80 2 40 14 14 42" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" /><path d="M8 18 L10 48 L38 40" fill="none" stroke={color} strokeWidth={8} strokeLinecap="round" strokeLinejoin="round" /></svg>}
      <div style={{ background: color, color: '#14171D', fontSize: size, fontWeight: 900, padding: `${size * 0.1}px ${size * 0.42}px`, borderRadius: size * 0.24, border: `${size * 0.09}px solid #fff`, boxShadow: '0 16px 40px rgba(0,0,0,.5)', whiteSpace: 'nowrap' }}>{text}</div>
    </div>
  );
};
/** 关注引导：头像、账号名和关注按钮，鼠标移过来点一下，按钮变成已关注。 */
export const FollowCTA: React.FC<{ name: string; sub?: string; at: number; clickAt: number; width?: number }> = ({ name, sub, at, clickAt, width = 900 }) => {
  const t = useT(), p = prog(t, at, 0.5), mv = inOut((t - clickAt + 0.8) / 0.7), on = t >= clickAt, press = on ? 1 - cl((t - clickAt) / 0.25) : 0, ring = cl((t - clickAt) / 0.5);
  return (
    <div style={{ position: 'relative', width, fontFamily: FONT, opacity: p, transform: `translateY(${mix(60, 0, p)}px)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 28, background: C.glass, border: `2px solid ${C.line}`, borderRadius: 80, padding: '20px 26px' }}>
        <div style={{ width: 110, height: 110, borderRadius: 55, background: `linear-gradient(135deg, ${C.accent}, #B48CFF)`, color: '#0B0E14', fontSize: 60, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{name[0]}</div>
        <div style={{ flex: 1 }}><div style={{ fontSize: 54, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>{name}</div>{sub && <div style={{ fontSize: 28, color: C.muted }}>{sub}</div>}</div>
        <div style={{ position: 'relative', fontSize: 44, fontWeight: 900, padding: '16px 46px', borderRadius: 60, background: on ? 'transparent' : C.down, color: on ? C.muted : '#fff', border: `3px solid ${on ? C.line : C.down}`, transform: `scale(${1 - press * 0.1})`, whiteSpace: 'nowrap' }}>{on ? '✓ 已关注' : '+ 关注'}
          {on && ring < 1 && <div style={{ position: 'absolute', inset: -ring * 30, borderRadius: 80, border: `4px solid ${C.down}`, opacity: 1 - ring }} />}</div>
      </div>
      <svg width={64} height={64} viewBox="0 0 24 24" style={{ position: 'absolute', left: mix(width + 40, width - 150, mv), top: mix(210, 86, mv), opacity: cl(mv * 3) * (1 - cl((t - clickAt - 0.8) / 0.4)), transform: `scale(${1 - press * 0.15})` }}><path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.6 14 L18 14 Z" fill="#fff" stroke="#000" strokeWidth={1.2} strokeLinejoin="round" /></svg>
    </div>
  );
};
/** 章节进度条：一根细条随时间走，上面标着几个章节，走到哪章哪章亮。让观众知道「还有多久」。 */
export const ProgressChapters: React.FC<{ chapters: { name: string; at: number }[]; from: number; to: number; width?: number }> = ({ chapters, from, to, width = 1700 }) => {
  const t = useT(), f = cl((t - from) / (to - from)); let act = -1; chapters.forEach((c, i) => { if (t >= c.at) act = i; });
  return (
    <div style={{ position: 'relative', width, height: 96, fontFamily: FONT, opacity: prog(t, from, 0.4) }}>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 58, height: 10, borderRadius: 5, background: C.line }} /><div style={{ position: 'absolute', left: 0, top: 58, height: 10, borderRadius: 5, width: f * width, background: C.accent }} /><div style={{ position: 'absolute', left: f * width - 11, top: 52, width: 22, height: 22, borderRadius: 11, background: C.text }} />
      {chapters.map((c, i) => { const x = ((c.at - from) / (to - from)) * width, me = i === act;
        return <React.Fragment key={i}><div style={{ position: 'absolute', left: x - 2, top: 52, width: 4, height: 22, background: C.bg }} /><div style={{ position: 'absolute', left: x + 6, top: 0, fontSize: me ? 36 : 30, fontWeight: 900, color: me ? C.text : C.muted, whiteSpace: 'nowrap' }}>{c.name}</div></React.Fragment>; })}
    </div>
  );
};
/** 钩子标题条：开头三秒压在画面上方的大标题，色块逐行刷出来。告诉观众「这条讲什么、凭什么看」。 */
export const HookTitle: React.FC<{ lines: string[]; at: number; until?: number; size?: number; colors?: string[] }> = ({ lines, at, until, size = 96, colors = [C.warm, '#F3F1EA'] }) => {
  const t = useT(), out = until === undefined ? 0 : prog(t, until, 0.35);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: size * 0.12, fontFamily: FONT, transform: `rotate(-2.5deg) translateY(${-out * 60}px)`, opacity: 1 - out }}>
      {lines.map((x, i) => { const p = inOut((t - at - i * 0.22) / 0.4); return <div key={i} style={{ position: 'relative', marginLeft: i * size * 0.5 }}><div style={{ position: 'absolute', inset: 0, background: colors[i % colors.length], transform: `scaleX(${p})`, transformOrigin: 'left' }} /><div style={{ position: 'relative', fontSize: size, fontWeight: 900, color: '#14171D', padding: `${size * 0.04}px ${size * 0.3}px`, whiteSpace: 'nowrap', clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>{x}</div></div>; })}
    </div>
  );
};
/** 冲击：画面抖一下、闪一下白。配合「砰」的一声，用在反转或重磅数字出现的那一帧。 */
export const Impact: React.FC<{ children: React.ReactNode; at: number; power?: number; width?: number; height?: number }> = ({ children, at, power = 26, width = 1920, height = 1080 }) => {
  const t = useT(), e = t - at, d = e < 0 ? 0 : Math.exp(-9 * e), dx = Math.sin(e * 70) * power * d, dy = Math.cos(e * 55) * power * 0.6 * d;
  return <div style={{ position: 'relative', width, height, overflow: 'hidden' }}><div style={{ width, height, transform: `translate(${dx}px, ${dy}px) scale(${1 + d * 0.05})` }}>{children}</div><div style={{ position: 'absolute', inset: 0, background: '#fff', opacity: e < 0 ? 0 : Math.max(0, 0.75 - e * 6) }} /></div>;
};
/** 转场揭开：从一个画面切到另一个画面：斜线划过、圆形扩开或百叶窗。 */
export const WipeReveal: React.FC<{ from: React.ReactNode; to: React.ReactNode; at: number; dur?: number; kind?: 'wipe' | 'circle' | 'blinds'; width?: number; height?: number }> = ({ from, to, at, dur = 0.7, kind = 'wipe', width = 1920, height = 1080 }) => {
  const t = useT(), p = inOut((t - at) / dur), n = 6;
  const clip = kind === 'circle' ? `circle(${p * 75}% at 50% 50%)` : kind === 'wipe' ? `polygon(0 0, ${p * 130}% 0, ${p * 130 - 30}% 100%, 0 100%)` : undefined;
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden' }}><div style={{ position: 'absolute', inset: 0 }}>{from}</div>
      {kind === 'blinds' ? Array.from({ length: n }).map((_, i) => <div key={i} style={{ position: 'absolute', left: (i * width) / n, top: 0, width: (width / n) * cl(p * 1.6 - (i / n) * 0.6) + 1, height, overflow: 'hidden' }}><div style={{ position: 'absolute', left: -(i * width) / n, top: 0, width, height }}>{to}</div></div>)
        : <div style={{ position: 'absolute', inset: 0, clipPath: clip }}>{to}</div>}
      {kind === 'wipe' && p > 0 && p < 1 && <div style={{ position: 'absolute', left: `${p * 130 - 15}%`, top: -40, width: 10, height: height * 1.2, background: C.warm, transform: `translateX(-5px) rotate(${(Math.atan((0.3 * width) / height) * 180) / Math.PI}deg)`, boxShadow: `0 0 40px ${C.warm}` }} />}
    </div>
  );
};
