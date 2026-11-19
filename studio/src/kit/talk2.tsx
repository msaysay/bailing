// 财经解读风（小 Lin 式）第二版版式：数值量自三条真实成片（免税 6:18、00 后 vibe coding 4:12、太空旅游 7:42）。
// 拆解和每个数的出处见 docs/对标拆解-小Lin口播.md。画布 1080×1920，上面 1080×1620 是人物视频区，底部 300 是黑边。
// 和第一版（kit/talk.tsx）的差别：字幕下移到胸口以下并换成标题体；小圆头像更大、能看到肩膀；
// 新增「素材带」版式（全片一半时间都是它）、频道角标、进度牌、章节角标、竖排大标题、头侧贴纸、引语。
// 人物舞台仍用 talk.tsx 的 TalkStage，时间仍只从 timing.json 取。
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import { mix, prog, useClock } from './clock';
import { C, FONT, FONT_SUB, FONT_TITLE, useT } from './kit';
import { Beat, Face, PH, TalkStage, TW } from './talk';

/** 固定区域（像素）。BAND 素材带；CHEST 人全屏时放卡片的地方（胸口，字幕上面）；SUB 字幕行；BELOW 素材带版式里字幕下面的空地。 */
export const BAND = { top: 454, height: 842 };
export const CHEST = { top: 1030, height: 290 };
export const SUB = { top: 1332, size: 62 };
export const BELOW = { top: 1440, height: 160 };
/** 右上角小圆头像：直径 280，圆心在横 79%、纵 20%，压住素材带的右上角。脸宽占圆的 42%。 */
export const BUBBLE: [number, number, number, number] = [713, 244, 280, 280];
const isImg = (src: string) => /\.(png|jpe?g|webp|gif)$/i.test(src);
const visible = (t: number, from: number, to: number, fin = 0.25, fout = 0.2) => (t < from - 0.02 || t > to + fout ? 0 : prog(t, from, fin) * (1 - prog(t, to, fout)));

/** 版式时间表里的 bubble 不写位置时，用实测的小圆。其余原样。 */
export const beats2 = (beats: Beat[]): Beat[] => beats.map((b) => (b.mode === 'bubble' && !b.box ? { ...b, box: BUBBLE, fit: b.fit ?? 0.42, ay: b.ay ?? 0.47 } : b));
/** 这一刻是哪种版式。 */
export const useMode = (beats: Beat[]) => { const t = useT(); let m = beats[0].mode; beats.forEach((b) => { if (t >= b.at + (b.dur ?? 0.5) / 2) m = b.mode; }); return m; };

/** 舞台：同 TalkStage，小圆用实测位置。 */
export const Stage2: React.FC<{ src: string; face: Face; vw?: number; vh?: number; beats: Beat[]; under?: React.ReactNode; children?: React.ReactNode }> = ({ beats, ...rest }) => <TalkStage {...rest} beats={beats2(beats)} />;

export type BandClip = {
  /** studio/public 下的路径，视频或图片。 */
  src: string;
  /** 这个画面从什么时候开始（秒）。到下一个画面的 at 为止；最后一个到 Band 的 until。 */
  at: number;
  /** 视频从第几秒开始放。 */
  startFrom?: number;
  /** cover 裁满（实拍）；contain 完整放进去（截图、图表，四周露出虚化底）。 */
  fit?: 'cover' | 'contain';
  /** 来源，小字压在素材带左下角。别人的画面必须写。 */
  credit?: string;
};
/** 素材带：全片占比最高的版式。素材横在画面中间（1080×842），上下是同一画面放大虚化压暗的底；人缩成右上小圆，字幕紧贴素材带下面。
 *  画面之间硬切，每个画面极慢地推一点。真实成片里素材带大约两秒换一个画面，同一个画面不要超过四秒。放在 Stage2 的 under 里。 */
export const Band: React.FC<{ clips: BandClip[]; until: number; top?: number; height?: number }> = ({ clips, until, top = BAND.top, height = BAND.height }) => {
  const t = useT(), { fps } = useVideoConfig(); if (!clips.length || t < clips[0].at - 0.02 || t > until + 0.25) return null;
  const op = prog(t, clips[0].at, 0.22) * (1 - prog(t, until, 0.22));
  return (
    <AbsoluteFill style={{ opacity: op, background: '#0B0C10' }}>
      {clips.map((c, i) => {
        const end = clips[i + 1]?.at ?? until + 0.25; if (t < c.at - 0.001 || t >= end) return null;
        const z = mix(1, 1.045, Math.min(1, (t - c.at) / Math.max(1.5, end - c.at)));
        const media = (st: React.CSSProperties) => (isImg(c.src) ? <Img src={staticFile(c.src)} style={st} /> : <OffthreadVideo src={staticFile(c.src)} muted startFrom={Math.round((c.startFrom ?? 0) * fps)} style={st} />);
        return (
          <Sequence key={i} from={Math.round(c.at * fps)} layout="none">
            <AbsoluteFill style={{ overflow: 'hidden' }}>{media({ position: 'absolute', left: '-25%', top: '-10%', width: '150%', height: '120%', objectFit: 'cover', filter: 'blur(46px) brightness(.27) saturate(.75)' })}</AbsoluteFill>
            <div style={{ position: 'absolute', left: 0, top, width: TW, height, overflow: 'hidden', background: c.fit === 'contain' ? 'rgba(0,0,0,.35)' : '#000' }}>
              {media({ width: '100%', height: '100%', objectFit: c.fit ?? 'cover', transform: `scale(${z})` })}
            </div>
            {c.credit && <div style={{ position: 'absolute', left: 24, top: top + height - 42, fontFamily: FONT, fontSize: 22, color: 'rgba(255,255,255,.78)', textShadow: '0 1px 4px #000' }}>{c.credit}</div>}
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

/** 字幕：一行，白字细黑边，固定在胸口以下（三条成片里都在画面高度 71% 处，不管哪种版式都不动）。实测一行最多 14 个字，全白不变色。 */
export const Subs2: React.FC<{ hot?: string[]; hide?: number[]; top?: number; size?: number }> = ({ hot = [], hide = [], top = SUB.top, size = SUB.size }) => {
  const t = useT(), { lines } = useClock(), i = lines.findIndex((l, k) => t >= l.start - 0.04 && t < (lines[k + 1]?.start ?? l.end + 0.4) - 0.04), l = lines[i];
  if (!l || hide.includes(l.n) || t > l.end + 0.5) return null;
  let parts: { s: string; hot: boolean }[] = [{ s: l.text, hot: false }];
  hot.forEach((h) => { parts = parts.flatMap((p) => (p.hot || !p.s.includes(h) ? [p] : p.s.split(h).flatMap((x, k, arr) => (k < arr.length - 1 ? [{ s: x, hot: false }, { s: h, hot: true }] : [{ s: x, hot: false }])))); });
  const fit = Math.min(size, Math.floor(1000 / Math.max(1, l.text.length)));      // 超过十六个字自动缩一点，不折行
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: FONT_SUB, fontSize: fit, fontWeight: 400, color: '#fff', lineHeight: 1.2, whiteSpace: 'nowrap', transform: 'skewX(-7deg)', WebkitTextStroke: '5px rgba(12,14,20,.82)', paintOrder: 'stroke fill', textShadow: '0 3px 10px rgba(0,0,0,.55)' }}>
      {parts.filter((p) => p.s).map((p, k) => <span key={k} style={p.hot ? { color: C.warm } : undefined}>{p.s}</span>)}
    </div>
  );
};

/** 频道角标：人物视频区底边正中的小牌子，一半压在黑边上。只在人全屏时出现。 */
export const ChannelTag: React.FC<{ name: string; beats: Beat[] }> = ({ name, beats }) => {
  const m = useMode(beats); if (m !== 'full') return null;
  return <div style={{ position: 'absolute', left: 0, right: 0, top: PH - 30, display: 'flex', justifyContent: 'center' }}><div style={{ fontFamily: FONT_TITLE, fontSize: 30, letterSpacing: 2, color: '#1B1D16', background: 'linear-gradient(180deg,#F1EFD9,#D9D6B4)', border: '3px solid #23261C', borderRadius: 14, padding: '6px 26px 8px', boxShadow: '0 4px 14px rgba(0,0,0,.5)', transform: 'skewX(-7deg)' }}>{name}</div></div>;
};

/** 胸口区：人全屏时卡片放这里，一排，左对齐起，不压脸也不压字幕。里面放组件库的卡片或 Card2。 */
export const Chest: React.FC<{ from: number; to: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ from, to, children, style }) => {
  const t = useT(), v = visible(t, from, to); if (v <= 0) return null;
  return <div style={{ position: 'absolute', left: 60, right: 60, top: CHEST.top, height: CHEST.height, display: 'flex', alignItems: 'flex-end', gap: 20, opacity: v, ...style }}>{children}</div>;
};
/** 一张小卡：深色（讲过了、没讲到）或亮色（正在讲）。at 是它弹出来的时刻。 */
export const Card2: React.FC<{ title: string; sub?: string; tag?: string; at: number; on?: boolean; tone?: 'dark' | 'gold' | 'green' | 'red'; w?: number; h?: number }> = ({ title, sub, tag, at, on = true, tone = 'dark', w = 300, h = 190 }) => {
  const t = useT(), p = prog(t, at, 0.28); if (p <= 0) return <div style={{ width: w, height: h }} />;
  const bg = { dark: 'linear-gradient(160deg,#2A2C33,#15161B)', gold: 'linear-gradient(160deg,#FFF3A8,#E7C94C)', green: 'linear-gradient(160deg,#2F8F86,#1B5F5A)', red: 'linear-gradient(160deg,#B6373A,#7D1F22)' }[tone];
  const ink = tone === 'gold' ? '#3A2F05' : '#F4EFD6';
  return (
    <div style={{ width: w, height: h, boxSizing: 'border-box', borderRadius: 16, background: bg, border: `3px solid ${tone === 'gold' ? '#FFF7C8' : 'rgba(255,255,255,.22)'}`, boxShadow: '0 14px 34px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', opacity: on ? 1 : 0.45, filter: on ? undefined : 'grayscale(1)', transform: `translateY(${mix(40, 0, p)}px) scale(${mix(0.86, 1, p)})` }}>
      {tag && <div style={{ position: 'absolute', top: -22, left: 18, fontFamily: FONT_TITLE, fontSize: 24, color: '#2A2606', background: '#E9E58A', borderRadius: 6, padding: '2px 14px' }}>{tag}</div>}
      <div style={{ fontFamily: FONT_TITLE, fontSize: Math.min(66, Math.floor((w - 40) / Math.max(2, title.length))), color: ink, letterSpacing: 4 }}>{title}</div>
      {sub && <div style={{ fontFamily: FONT, fontSize: 20, color: ink, opacity: 0.7, marginTop: 4 }}>{sub}</div>}
    </div>
  );
};

/** 进度牌：贯穿全片的一排小牌子（「三种玩法」「四个渠道」），讲到哪个哪个变金色。人全屏时在胸口，素材带版式时在字幕下面。
 *  steps 写每个牌子从什么时候开始轮到它；shows 写这排牌子在哪些时间段出现（一般是每次切换话题的那几秒）。 */
export const Progress: React.FC<{ items: string[]; steps: number[]; shows: [number, number][]; beats: Beat[] }> = ({ items, steps, shows, beats }) => {
  const t = useT(), m = useMode(beats), s = shows.find(([a, b]) => t >= a - 0.02 && t <= b + 0.2); if (!s) return null;
  const v = visible(t, s[0], s[1]); let cur = -1; steps.forEach((x, i) => { if (t >= x) cur = i; });
  const w = Math.min(300, Math.floor((TW - 120 - 20 * (items.length - 1)) / items.length));
  return (
    <div style={{ position: 'absolute', left: 60, right: 60, top: m === 'full' ? CHEST.top + CHEST.height - 130 : BELOW.top, display: 'flex', gap: 20, justifyContent: 'center', opacity: v }}>
      {items.map((x, i) => <div key={i} style={{ width: w, height: 120, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT_TITLE, fontSize: Math.min(52, Math.floor((w - 30) / Math.max(2, x.length))), letterSpacing: 3, color: i === cur ? '#3A2F05' : 'rgba(255,255,255,.5)', background: i === cur ? 'linear-gradient(160deg,#FFF3A8,#E7C94C)' : 'linear-gradient(160deg,#2A2C33,#15161B)', border: `3px solid ${i === cur ? '#FFF7C8' : 'rgba(255,255,255,.16)'}`, boxShadow: i === cur ? '0 0 30px rgba(255,226,110,.45)' : '0 8px 20px rgba(0,0,0,.4)', transform: `scale(${i === cur ? 1.04 : 1})` }}>{x}</div>)}
    </div>
  );
};

/** 章节角标：这一章从头到尾挂在左上角的一条小横幅（「维珍银河 · 基础版」），让观众知道现在讲的是哪一个。人全屏时也在。 */
export const ChapterTag: React.FC<{ title: string; badge?: string; from: number; to: number; color?: string }> = ({ title, badge, from, to, color = '#5B3FA8' }) => {
  const t = useT(), v = visible(t, from, to, 0.35); if (v <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 0, top: 300, opacity: v, transform: `translateX(${mix(-60, 0, prog(t, from, 0.35))}px)` }}>
      {badge && <div style={{ marginLeft: 44, marginBottom: 6, display: 'inline-block', fontFamily: FONT_TITLE, fontSize: 22, color: '#2A2606', background: '#E9E58A', borderRadius: 5, padding: '1px 12px' }}>{badge}</div>}
      <div style={{ fontFamily: FONT_TITLE, fontSize: 38, letterSpacing: 4, color: '#fff', background: `linear-gradient(90deg, ${color}, ${color}CC 70%, transparent)`, padding: '8px 90px 10px 44px', clipPath: 'polygon(0 0, 100% 0, calc(100% - 26px) 100%, 0 100%)' }}>{title}</div>
    </div>
  );
};

/** 竖排大标题：讲一个概念（「劳动总量谬误」）的那一段，挂在素材带左上方，从上往下排。只配素材带版式用。 */
export const SideTitle: React.FC<{ text: string; en?: string; from: number; to: number }> = ({ text, en, from, to }) => {
  const t = useT(), v = visible(t, from, to, 0.4); if (v <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 54, top: 96, display: 'flex', gap: 10, opacity: v }}>
      <div style={{ writingMode: 'vertical-rl', fontFamily: FONT_TITLE, fontSize: 84, letterSpacing: 10, color: '#fff', textShadow: '0 4px 18px rgba(0,0,0,.8)', clipPath: `inset(0 0 ${100 - prog(t, from, 0.6) * 100}% 0)` }}>{text}</div>
      {en && <div style={{ writingMode: 'vertical-rl', fontFamily: FONT, fontSize: 20, letterSpacing: 4, color: 'rgba(255,255,255,.6)', paddingTop: 8 }}>{en}</div>}
    </div>
  );
};

/** 头侧贴纸：人全屏时贴在头的左边或右边的东西（人物头像、标志、名字）。两个人对比时一边一个，说到谁谁亮、另一个变灰。 */
export const HeadSide: React.FC<{ side: 'left' | 'right'; name: string; img?: string; tag?: string; from: number; to: number; on?: [number, number][] }> = ({ side, name, img, tag, from, to, on }) => {
  const t = useT(), v = visible(t, from, to); if (v <= 0) return null;
  const lit = !on || on.some(([a, b]) => t >= a && t < b), p = prog(t, from, 0.3);
  return (
    <div style={{ position: 'absolute', top: 250, [side]: 44, width: 290, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: v * (lit ? 1 : 0.5), filter: lit ? undefined : 'grayscale(1)', transform: `scale(${mix(0.7, lit ? 1 : 0.88, p)}) rotate(${side === 'left' ? -3 : 3}deg)` } as React.CSSProperties}>
      {tag && <div style={{ fontFamily: FONT_TITLE, fontSize: 30, color: '#E8E4D2', background: 'linear-gradient(160deg,#2A2C33,#15161B)', border: '2px solid rgba(255,255,255,.2)', borderRadius: 10, padding: '8px 22px', marginBottom: -8 }}>{tag}</div>}
      {img && <Img src={staticFile(img)} style={{ width: 230, height: 260, objectFit: 'contain', filter: 'drop-shadow(0 0 0 #fff) drop-shadow(0 8px 16px rgba(0,0,0,.5))' }} />}
      <div style={{ fontFamily: FONT_TITLE, fontSize: 58, color: '#DDEBFF', WebkitTextStroke: '8px #1D3B66', paintOrder: 'stroke fill', marginTop: img ? -26 : 8 }}>{name}</div>
    </div>
  );
};

/** 引语：某个人说的原话，压在素材带的右半边（人在左半边的采访画面），前面一个大引号。逐行出现。 */
export const BandQuote: React.FC<{ lines: string[]; at: number[]; from: number; to: number }> = ({ lines, at, from, to }) => {
  const t = useT(), v = visible(t, from, to); if (v <= 0) return null;
  return (
    <div style={{ position: 'absolute', left: 500, right: 40, top: BAND.top + 150, opacity: v, fontFamily: FONT_TITLE, color: '#fff', textShadow: '0 3px 12px rgba(0,0,0,.85)' }}>
      <div style={{ fontSize: 150, lineHeight: 0.6, textAlign: 'right', color: 'rgba(255,255,255,.75)' }}>”</div>
      {lines.map((x, i) => <div key={i} style={{ fontSize: 54, lineHeight: 1.6, letterSpacing: 3, opacity: prog(t, at[i] ?? from, 0.25), transform: `translateY(${mix(14, 0, prog(t, at[i] ?? from, 0.25))}px)` }}>{x}</div>)}
    </div>
  );
};

/** 大数字：压在素材带中间的一个数（「13%」），上面一行小标题，下面一行来源。 */
export const BandStat: React.FC<{ value: string; unit?: string; label: string; source?: string; from: number; to: number }> = ({ value, unit, label, source, from, to }) => {
  const t = useT(), v = visible(t, from, to); if (v <= 0) return null; const p = prog(t, from, 0.4);
  return (
    <div style={{ position: 'absolute', left: 0, top: BAND.top, width: TW, height: BAND.height, background: 'rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: v }}>
      <div style={{ fontFamily: FONT_TITLE, fontSize: 46, letterSpacing: 6, color: '#fff' }}>{label}</div>
      <div style={{ fontFamily: FONT_TITLE, fontSize: 300, lineHeight: 1.05, color: '#F4E79A', transform: `scale(${mix(1.5, 1, p)})`, textShadow: '0 0 60px rgba(244,231,154,.35)' }}>{value}<span style={{ fontSize: 110 }}>{unit}</span></div>
      {source && <div style={{ fontFamily: FONT, fontSize: 24, color: 'rgba(255,255,255,.65)', borderTop: '2px solid rgba(255,255,255,.3)', paddingTop: 12, marginTop: 6 }}>{source}</div>}
    </div>
  );
};

/** 关键词大字：一个新词第一次出现时整屏打出来一秒多（「VIBE CODING」「太空旅游争霸」），深色底，砸进来。vertical 是竖排。 */
export const BigWord: React.FC<{ text: string; sub?: string; at: number; hold?: number; vertical?: boolean; bg?: string }> = ({ text, sub, at, hold = 1.4, vertical, bg = 'radial-gradient(900px 1200px at 50% 45%, #1A2238 0%, #05060A 78%)' }) => {
  const t = useT(); if (t < at - 0.02 || t > at + hold + 0.25) return null; const p = prog(t, at, 0.32), q = 1 - prog(t, at + hold, 0.25);
  return (
    <AbsoluteFill style={{ background: bg, opacity: Math.min(1, p * 4) * q, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
      <div style={{ writingMode: vertical ? 'vertical-rl' : undefined, fontFamily: FONT_TITLE, fontSize: vertical ? 190 : Math.min(240, Math.floor(960 / Math.max(2, text.length / (text.includes(' ') ? 2 : 1)))), lineHeight: 1.08, letterSpacing: 10, textAlign: 'center', color: '#fff', whiteSpace: vertical ? undefined : 'pre-wrap', textShadow: '6px 0 0 rgba(255,60,90,.55), -6px 0 0 rgba(60,200,255,.55), 0 0 60px rgba(255,255,255,.25)', transform: `scale(${mix(1.6, 1, p)})`, filter: `blur(${mix(14, 0, p)}px)` }}>{text.replace(' ', '\n')}</div>
      {sub && <div style={{ fontFamily: FONT, fontSize: 30, letterSpacing: 14, color: 'rgba(255,255,255,.6)', marginTop: 30 }}>{sub}</div>}
    </AbsoluteFill>
  );
};

/** 主题面板底：讲一组同类东西（「三种玩法」「四个小工具」）时换上的整屏底，深色或浅色，上面摆卡片，人是小圆。放在 Stage2 的 under 里。 */
export const Panel: React.FC<{ from: number; to: number; tone?: 'dark' | 'light'; children?: React.ReactNode }> = ({ from, to, tone = 'dark', children }) => {
  const t = useT(), v = visible(t, from, to); if (v <= 0) return null;
  const bg = tone === 'dark' ? 'radial-gradient(1300px 900px at 50% 108%, #26324A 0%, #0B0E15 55%, #06070B 100%)' : 'radial-gradient(1200px 1200px at 50% 40%, #DDEBF6 0%, #BCD3E6 100%)';
  return <AbsoluteFill style={{ background: bg, opacity: v }}><AbsoluteFill style={{ backgroundImage: `radial-gradient(${tone === 'dark' ? 'rgba(255,255,255,.07)' : 'rgba(40,70,110,.12)'} 2px, transparent 2px)`, backgroundSize: '54px 54px' }} />{children}</AbsoluteFill>;
};
