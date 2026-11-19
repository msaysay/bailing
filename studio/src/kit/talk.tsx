// 竖屏口播的版式引擎：人是底，版式在「全屏 / 小圆头像 / 人物卡片 / 不出现」之间切。
// 画布 1080×1920：上面 1080×1620 是人物视频区，底部 300 留给平台的标题和按钮（组件可以压进来一点，字幕不行）。
// 版式规则见 docs/对标拆解-小Lin口播.md。时间一律从 timing.json 取；剪口时刻从 cuts.json 取，用来切景别盖住跳帧。
import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import { inOut, mix, prog, useClock } from './clock';
import { C, FONT, useT } from './kit';

export const TW = 1080, TH = 1920, PH = 1620;
/** 几个固定区域（纵向位置，像素）。SUB_Y：字幕行；UPPER：小圆头像版式里素材放的地方；LOWER：全屏版式里组件放的地方（下巴以下）。 */
export const SUB_Y = 1000, UPPER = { top: 330, height: 608 }, LOWER = { top: 1090, height: 640 };
export type Face = { x: number; y: number; w: number };   // 人脸在人物视频里的中心和宽度（像素），用 scripts/faces.py 或直接量
export type Beat = {
  at: number;
  mode: 'full' | 'bubble' | 'card' | 'off';
  /** full 时的景别：1 是原大，1.15 是推近一点。在剪口处换景别可以盖住跳帧。 */
  zoom?: number;
  /** 过渡秒数；0 是硬切（换景别用硬切，换版式用 0.5 左右）。 */
  dur?: number;
  /** bubble、card 的位置和大小 [左, 上, 宽, 高]。不给就用默认：小圆在右上，卡片在左上。 */
  box?: [number, number, number, number];
};
type St = { x: number; y: number; w: number; h: number; r: number; s: number; ax: number; ay: number; ring: number; op: number };
const target = (b: Beat, f: Face, vw: number, vh: number, prev?: St): St => {
  if (b.mode === 'full') return { x: 0, y: 0, w: TW, h: PH, r: 0, s: (TW / vw) * (b.zoom ?? 1), ax: f.x / vw, ay: f.y / vh, ring: 0, op: 1 };
  if (b.mode === 'bubble') { const [x, y, w, h] = b.box ?? [806, 118, 196, 196]; return { x, y, w, h, r: w / 2, s: (0.6 * w) / f.w, ax: 0.5, ay: 0.54, ring: 1, op: 1 }; }
  if (b.mode === 'card') { const [x, y, w, h] = b.box ?? [40, 330, 440, 640]; return { x, y, w, h, r: 40, s: (0.52 * w) / f.w, ax: 0.5, ay: 0.42, ring: 0.5, op: 1 }; }
  return { ...(prev as St), op: 0 };
};
const lerp = (a: St, b: St, p: number): St => ({ x: mix(a.x, b.x, p), y: mix(a.y, b.y, p), w: mix(a.w, b.w, p), h: mix(a.h, b.h, p), r: mix(a.r, b.r, p), s: mix(a.s, b.s, p), ax: mix(a.ax, b.ax, p), ay: mix(a.ay, b.ay, p), ring: mix(a.ring, b.ring, p), op: mix(a.op, b.op, p) });
/** 当前这一帧人物框的状态。 */
export const usePerson = (beats: Beat[], face: Face, vw: number, vh: number) => {
  const t = useT(); let st = target(beats[0], face, vw, vh), mode = beats[0].mode;
  beats.slice(1).forEach((b) => { const d = b.dur ?? 0.5, p = d <= 0 ? (t >= b.at ? 1 : 0) : inOut((t - b.at) / d); if (p > 0) { st = lerp(st, target(b, face, vw, vh, st), p); if (p > 0.5) mode = b.mode; } });
  return { st, mode };
};
/** 舞台：under 是垫在人物下面的东西（素材、整屏图形），children 是压在人物上面的东西（卡片、贴纸、字幕）。 */
export const TalkStage: React.FC<{ src: string; face: Face; vw?: number; vh?: number; beats: Beat[]; under?: React.ReactNode; children?: React.ReactNode }> = ({ src, face, vw = 1080, vh = 1620, beats, under, children }) => {
  const { st } = usePerson(beats, face, vw, vh), W = vw * st.s, H = vh * st.s;
  const left = Math.min(0, Math.max(st.w - W, st.ax * st.w - face.x * st.s)), top = Math.min(0, Math.max(st.h - H, st.ay * st.h - face.y * st.s));
  return (
    <AbsoluteFill style={{ background: '#07090D', fontFamily: FONT, color: C.text }}>
      {under}
      <div style={{ position: 'absolute', left: st.x, top: st.y, width: st.w, height: st.h, borderRadius: st.r, overflow: 'hidden', opacity: st.op, boxShadow: st.ring > 0.01 ? `0 0 0 ${7 * st.ring}px #F3F1EA, 0 24px 60px rgba(0,0,0,${0.55 * st.ring})` : 'none' }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ position: 'absolute', left, top, width: W, height: H, maxWidth: 'none' }} />
      </div>
      {children}
    </AbsoluteFill>
  );
};
/** 字幕：一行一行跟着口播走，固定在 SUB_Y。hot 里的词变色。hide 里的行不显示（被标题页盖住的那几行）。 */
export const TalkSubs: React.FC<{ hot?: string[]; y?: number; size?: number; hide?: number[] }> = ({ hot = [], y = SUB_Y, size = 54, hide = [] }) => {
  const t = useT(), { lines } = useClock(), i = lines.findIndex((l, k) => t >= l.start - 0.04 && t < (lines[k + 1]?.start ?? l.end + 0.4) - 0.04), l = lines[i];
  if (!l || hide.includes(l.n) || t > l.end + 0.5) return null;
  let parts: { s: string; hot: boolean }[] = [{ s: l.text, hot: false }];
  hot.forEach((h) => { parts = parts.flatMap((p) => (p.hot || !p.s.includes(h) ? [p] : p.s.split(h).flatMap((x, k, arr) => (k < arr.length - 1 ? [{ s: x, hot: false }, { s: h, hot: true }] : [{ s: x, hot: false }])))); });
  return <div style={{ position: 'absolute', left: 40, right: 40, top: y, textAlign: 'center', fontSize: size, fontWeight: 600, color: '#fff', lineHeight: 1.25, textShadow: '0 2px 4px rgba(0,0,0,.9), 0 0 18px rgba(0,0,0,.75)', whiteSpace: 'pre-wrap', opacity: prog(t, l.start - 0.04, 0.12) }}>{parts.filter((p) => p.s).map((p, k) => <span key={k} style={{ color: p.hot ? C.warm : undefined, fontWeight: p.hot ? 900 : undefined }}>{p.s}</span>)}</div>;
};
/** 素材片段：放在 UPPER 区的一段横屏画面，圆角，可带一行来源。从 at 开始播，到 until 淡出。 */
export const TalkClip: React.FC<{ src: string; at: number; until: number; top?: number; height?: number; credit?: string; startFrom?: number }> = ({ src, at, until, top = UPPER.top, height = UPPER.height, credit, startFrom = 0 }) => {
  const t = useT(), { fps } = useVideoConfig(); if (t < at - 0.02 || t > until + 0.3) return null; const p = prog(t, at, 0.35) * (1 - prog(t, until, 0.3));
  return (
    <Sequence from={Math.round(at * fps)} layout="none">
      <div style={{ position: 'absolute', left: 0, top, width: TW, height, overflow: 'hidden', opacity: p, transform: `scale(${mix(1.06, 1, prog(t, at, 0.5))})` }}><OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(startFrom * fps)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>
      {credit && <div style={{ position: 'absolute', left: 30, top: top + height - 44, fontSize: 22, color: 'rgba(255,255,255,.75)', textShadow: '0 1px 4px #000', opacity: p }}>{credit}</div>}
    </Sequence>
  );
};
/** 章节标题页：整屏盖住一秒多，大号序号加标题。 */
export const TalkTitle: React.FC<{ no: string; title: string; at: number; hold?: number }> = ({ no, title, at, hold = 1.6 }) => {
  const t = useT(); if (t < at - 0.02 || t > at + hold + 0.3) return null; const p = prog(t, at, 0.3), q = 1 - prog(t, at + hold, 0.3);
  return (
    <AbsoluteFill style={{ background: `radial-gradient(900px 900px at 50% 42%, #18233A 0%, #07090D 75%)`, opacity: Math.min(1, p * 3) * q, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', paddingBottom: 300 }}>
      <div style={{ fontSize: 300, fontWeight: 900, lineHeight: 1, color: 'transparent', WebkitTextStroke: `4px ${C.accent}`, transform: `translateY(${mix(60, 0, p)}px)` }}>{no}</div>
      <div style={{ width: 120 * p, height: 8, background: C.warm, margin: '30px 0' }} />
      <div style={{ fontSize: 130, fontWeight: 900, color: C.text, transform: `translateY(${mix(-40, 0, p)}px)` }}>{title}</div>
    </AbsoluteFill>
  );
};
/** LOWER 区的容器：把组件放在下巴以下，默认居中。 */
export const Lower: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => <div style={{ position: 'absolute', left: 0, top: LOWER.top, width: TW, height: LOWER.height, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', gap: 24, ...style }}>{children}</div>;
/** 压在人身上的卡片底：半透明深色，保证字看得清。 */
export const Plate: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => <div style={{ background: 'rgba(10,13,20,.86)', border: '2px solid rgba(255,255,255,.14)', borderRadius: 30, padding: '28px 40px', boxShadow: '0 24px 60px rgba(0,0,0,.5)', ...style }}>{children}</div>;
