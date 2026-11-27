// 红顶双标题口播风：一条竖屏口播，全片顶上挂两行大标题（白一行、金一行，压在暗红渐变上），
// 字幕在胸口逐行累加（重点词金色），人物画面在「全屏 / 推近 / 黑底圆框 / 黑底圆角框 / 手机壳截图」之间硬切，
// 开头几秒右侧出竖排名牌，结尾黑底三行字。拆解和每个数的出处见 docs/对标拆解-红顶双标题口播.md。
// 整条片子由一份 plan.json 驱动（scripts/redtop.py plan 生成，AI 再改），不用写画面代码。画布 1080×1920。
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export type RtBeat = { at: number; mode: 'full' | 'circle' | 'card' | 'phone'; zoom?: number };
export type RtLine = { text: string; at: number; hot?: string[] };
export type RtStack = { from: number; to: number; lines: RtLine[] };
export type RtMark = { at: number; to?: number; type: 'box' | 'hl'; x: number; y: number; w: number; h: number };
export type RtInsert = { from: number; to: number; src: string; startFrom?: number; pan?: [number, number]; marks?: RtMark[] };
export type RtPlan = {
  video: string; audio?: string; total: number; vw: number; vh: number; face: { x: number; y: number; w: number };
  title: [string, string]; theme?: { top?: string; gold?: string; nameBg?: string };
  beats: RtBeat[]; subs: RtStack[]; inserts?: RtInsert[];
  sign?: { name: string; title?: string; from: number; to: number } | null;
  cta?: { lines: string[]; from: number } | null;
  font?: string;
};
export const rtDefault: RtPlan = { video: '', total: 10, vw: 1080, vh: 1920, face: { x: 540, y: 760, w: 280 }, title: ['第一行标题', '第二行标题'], beats: [{ at: 0, mode: 'full' }], subs: [] };

const W = 1080, H = 1920;
// —— 量自对标片（720×1280，换算成比例）——
const TOP_SOLID = 0.13, TOP_FADE = 0.30;                 // 顶上暗红：到 13% 是实色，到 30% 渐隐
const TITLE_Y = [0.079, 0.150], TITLE_SIZE = 0.1 * W;  // 两行标题的顶边、字号
const SUB_Y = 0.693, SUB_SIZE = 0.084 * W, SUB_LH = 1.3; // 字幕第一行的顶边、字号、行距
const CIRCLE = { d: 0.729 * W, cy: 0.374 * H }, CARD = { w: 0.732 * W, h: 0.422 * H, top: 0.172 * H, r: 0.05 * W };
const PHONE = { w: 0.665 * W, top: 0.125 * H, h: 0.86 * H, bezel: 16, r: 86 };
const FACE_FULL = 0.262, FACE_MASK = 0.215;              // 脸宽占画面宽：全屏时、框里时
const c01 = (x: number) => Math.max(0, Math.min(1, x)), ease = (x: number) => 1 - Math.pow(1 - c01(x), 3);
const src = (s: string) => (/^(https?:|data:)/.test(s) ? s : staticFile(s));
const isVid = (s: string) => /\.(mp4|mov|webm|m4v)$/i.test(s);

/** 一行字幕：重点词金色。hot 里的词在这一行里出现就上色。 */
const Rich: React.FC<{ text: string; hot?: string[]; gold: string }> = ({ text, hot = [], gold }) => {
  const out: React.ReactNode[] = []; let rest = text, k = 0;
  while (rest) { const hit = hot.filter(Boolean).map((h) => [rest.indexOf(h), h] as [number, string]).filter(([i]) => i >= 0).sort((a, b) => a[0] - b[0] || b[1].length - a[1].length)[0]; if (!hit) { out.push(rest); break; } if (hit[0] > 0) out.push(rest.slice(0, hit[0])); out.push(<span key={k++} style={{ color: gold }}>{hit[1]}</span>); rest = rest.slice(hit[0] + hit[1].length); }
  return <>{out}</>;
};

export const Redtop: React.FC<RtPlan> = (P) => {
  const { fps } = useVideoConfig(), t = useCurrentFrame() / fps, gold = P.theme?.gold ?? '#FEBE17', top = P.theme?.top ?? '#4B1600', nameBg = P.theme?.nameBg ?? '#18509E';
  const [h] = React.useState(() => delayRender('redtop-font'));
  React.useEffect(() => { new FontFace('RT', `url(${staticFile('fonts/' + (P.font ?? 'AlibabaPuHuiTi-3-105-Heavy.ttf'))})`, { weight: '100 900' }).load().then((f) => document.fonts.add(f)).catch(() => undefined).then(() => continueRender(h)); }, [h, P.font]);
  const F = '"RT", "PingFang SC", "Microsoft YaHei", sans-serif';
  const bi = P.beats.reduce((a, b, i) => (t >= b.at ? i : a), 0), beat = P.beats[bi], since = t - beat.at, ins = (P.inserts ?? []).find((x) => t >= x.from && t < x.to);
  const mode = ins ? 'phone' : beat.mode === 'phone' ? 'full' : beat.mode, dark = mode === 'circle' || mode === 'card';
  // 人物视频怎么摆：让脸落在目标位置、占目标宽度
  const place = (faceW: number, cx: number, cy: number, bw = W, bh = H) => { const sMin = Math.max(bw / P.vw, bh / P.vh), s = Math.max(sMin, (faceW * W) / P.face.w); return { s, left: cx - P.face.x * s, top: cy - P.face.y * s, width: P.vw * s, height: P.vh * s }; };
  const clamp = (b: { s: number; left: number; top: number; width: number; height: number }, x0: number, y0: number, x1: number, y1: number) => ({ ...b, left: Math.min(x0, Math.max(x1 - b.width, b.left)), top: Math.min(y0, Math.max(y1 - b.height, b.top)) });
  const punch = 1 + 0.03 * (1 - ease(since / 0.18));        // 每次切换后轻微回落一下
  const video = (box: { left: number; top: number; width: number; height: number }, extra?: React.CSSProperties) => <OffthreadVideo src={src(P.video)} muted style={{ position: 'absolute', left: box.left, top: box.top, width: box.width, height: box.height, maxWidth: 'none', ...extra }} />;
  // 全屏：原片铺满；推近时以脸为中心放大，脸在屏幕上的位置不动
  const s0 = Math.max(W / P.vw, H / P.vh), z = beat.zoom ?? 1, fx0 = (W - P.vw * s0) / 2 + P.face.x * s0, fy0 = (H - P.vh * s0) / 2 + P.face.y * s0, sz = s0 * z;
  const base = clamp({ s: sz, left: fx0 - P.face.x * sz, top: fy0 - P.face.y * sz, width: P.vw * sz, height: P.vh * sz }, 0, 0, W, H);
  let stage: React.ReactNode;
  if (mode === 'circle') { const b = place(FACE_MASK, CIRCLE.d / 2, CIRCLE.d * 0.46, CIRCLE.d, CIRCLE.d), bb = clamp(b, 0, 0, CIRCLE.d, CIRCLE.d);
    stage = <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${top} 14%, #000 27%)` }}><div style={{ position: 'absolute', left: (W - CIRCLE.d) / 2, top: CIRCLE.cy - CIRCLE.d / 2, width: CIRCLE.d, height: CIRCLE.d, borderRadius: '50%', overflow: 'hidden', transform: `scale(${punch})` }}>{video(bb)}</div></AbsoluteFill>;
  } else if (mode === 'card') { const b = clamp(place(FACE_MASK, CARD.w / 2, CARD.h * 0.42, CARD.w, CARD.h), 0, 0, CARD.w, CARD.h);
    stage = <AbsoluteFill style={{ background: `linear-gradient(180deg, ${top} 0%, ${top} 14%, #000 27%)` }}><div style={{ position: 'absolute', left: (W - CARD.w) / 2, top: CARD.top, width: CARD.w, height: CARD.h, borderRadius: CARD.r, overflow: 'hidden', transform: `scale(${punch})` }}>{video(b)}</div></AbsoluteFill>;
  } else if (mode === 'phone' && ins) { const u = t - ins.from, e = ease(u / 0.3), sw = PHONE.w - PHONE.bezel * 2, sh = PHONE.h - PHONE.bezel * 2, pan = ins.pan ? ins.pan[0] + (ins.pan[1] - ins.pan[0]) * c01(u / Math.max(0.5, ins.to - ins.from - 0.4)) : 0;
    stage = <AbsoluteFill style={{ background: '#000' }}>
      {video({ left: base.left - 80, top: base.top - 80, width: base.width + 160, height: base.height + 160 }, { filter: 'blur(26px) brightness(.72)' })}
      <div style={{ position: 'absolute', left: (W - PHONE.w) / 2, top: PHONE.top + (1 - e) * 140, width: PHONE.w, height: PHONE.h, borderRadius: PHONE.r, background: '#0c0c0e', boxShadow: '0 30px 90px rgba(0,0,0,.65), inset 0 0 0 3px #3a3a40', opacity: e }}>
        <div style={{ position: 'absolute', left: PHONE.bezel, top: PHONE.bezel, width: sw, height: sh, borderRadius: PHONE.r - PHONE.bezel, overflow: 'hidden', background: '#fff' }}>
          {isVid(ins.src) ? <OffthreadVideo src={src(ins.src)} muted startFrom={Math.round((ins.startFrom ?? 0) * fps)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /> : <Img src={src(ins.src)} style={{ position: 'absolute', left: 0, top: 0, width: '100%', transform: `translateY(${-pan * 100}%)` }} />}
          {(ins.marks ?? []).map((m, i) => { const q = ease((t - m.at) / 0.25); if (t < m.at || (m.to != null && t > m.to)) return null;
            return m.type === 'box' ? <div key={i} style={{ position: 'absolute', left: m.x * sw, top: m.y * sh, width: m.w * sw, height: m.h * sh, border: '5px solid #E0262E', borderRadius: 14, opacity: q, transform: `scale(${1.06 - 0.06 * q})`, boxSizing: 'border-box' }} />
              : <div key={i} style={{ position: 'absolute', left: m.x * sw, top: m.y * sh, width: m.w * sw * q, height: m.h * sh, background: '#FFE94D', mixBlendMode: 'multiply' }} />; })}
        </div>
        <div style={{ position: 'absolute', left: PHONE.w / 2 - 110, top: PHONE.bezel - 2, width: 220, height: 44, borderRadius: '0 0 24px 24px', background: '#0c0c0e' }} />
      </div></AbsoluteFill>;
  } else stage = <AbsoluteFill style={{ background: '#000' }}><div style={{ position: 'absolute', inset: 0, transform: `scale(${punch})` }}>{video(base)}</div></AbsoluteFill>;

  const stack = P.subs.find((x) => t >= x.from && t < x.to), sign = P.sign && t >= P.sign.from && t < P.sign.to + 0.3 ? P.sign : null, cta = P.cta && t >= P.cta.from ? P.cta : null;
  const stroke = (px: number, col: string, extra = ''): React.CSSProperties => ({ textShadow: Array.from({ length: 16 }, (_, i) => `${(Math.cos((i / 16) * Math.PI * 2) * px / 2).toFixed(1)}px ${(Math.sin((i / 16) * Math.PI * 2) * px / 2).toFixed(1)}px 0 ${col}`).join(', ') + (extra ? ', ' + extra : '') });
  return <AbsoluteFill style={{ background: '#000' }}>
    {stage}
    {/* 顶上的暗红渐变：全片都在（黑底版式时它垫在框下面，上面已经画了） */}
    {dark ? null : <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H * TOP_FADE, background: `linear-gradient(180deg, ${top} 0%, ${top} ${(TOP_SOLID / TOP_FADE) * 100}%, ${top}00 100%)` }} />}
    {/* 两行标题：全片都在 */}
    {P.title.map((l, i) => <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: TITLE_Y[i] * H, textAlign: 'center', fontFamily: F, fontSize: Math.min(TITLE_SIZE, (W - 110) / Math.max(1, l.length)), lineHeight: 1.12, color: i ? gold : '#fff', letterSpacing: 2, whiteSpace: 'nowrap', ...stroke(i ? 9 : 7, i ? '#3A1500' : '#3A1200', '0 6px 14px rgba(0,0,0,.6)') }}>{l}</div>)}
    {/* 字幕：一句话里的几行逐行累加 */}
    {stack && !cta ? <div style={{ position: 'absolute', left: 40, right: 40, top: SUB_Y * H, textAlign: 'center', opacity: 1 - c01((t - (stack.to - 0.08)) / 0.08) }}>
      {stack.lines.map((l, i) => { const q = ease((t - l.at) / 0.16); if (t < l.at) return null;
        return <div key={i} style={{ fontFamily: F, fontSize: Math.min(SUB_SIZE, (W - 90) / Math.max(1, l.text.length)), lineHeight: SUB_LH, color: '#fff', whiteSpace: 'nowrap', ...stroke(8, '#1E0D04', '0 5px 12px rgba(0,0,0,.65)'), transform: `translateX(${(1 - q) * -46}px)`, filter: q < 1 ? `blur(${(1 - q) * 9}px)` : undefined, opacity: 0.2 + 0.8 * q }}><Rich text={l.text} hot={l.hot} gold={gold} /></div>; })}
    </div> : null}
    {/* 竖排名牌：开头出一次 */}
    {sign ? (() => { const q = ease((t - sign.from) / 0.3) * (1 - c01((t - sign.to) / 0.25));
      return <div style={{ position: 'absolute', right: 58, top: 0.555 * H, display: 'flex', gap: 0, alignItems: 'flex-start', opacity: q, transform: `translateX(${(1 - q) * 50}px)` }}>
        <div style={{ writingMode: 'vertical-rl', fontFamily: F, fontSize: 56, color: '#fff', background: nameBg, borderRadius: 30, padding: '26px 8px', letterSpacing: 6, marginTop: sign.title ? 150 : 0, boxShadow: '0 6px 20px rgba(0,0,0,.4)' }}>{sign.name}</div>
        {sign.title ? <div style={{ writingMode: 'vertical-rl', fontFamily: F, fontSize: 32, color: '#2A2A2A', background: 'rgba(255,255,255,.94)', borderRadius: 22, padding: '20px 6px', letterSpacing: 3, marginLeft: -6, boxShadow: '0 6px 20px rgba(0,0,0,.3)' }}>{sign.title}</div> : null}
      </div>; })() : null}
    {/* 结尾：黑底三行字 */}
    {cta ? <AbsoluteFill style={{ background: '#000', opacity: c01((t - cta.from) / 0.25) }}><div style={{ position: 'absolute', left: 0, right: 0, top: 0.40 * H, textAlign: 'center' }}>{cta.lines.map((l, i) => <div key={i} style={{ fontFamily: F, fontSize: Math.min(70, (W - 140) / Math.max(1, l.length)), lineHeight: 1.75, color: '#FBEBCB', textShadow: '0 0 26px rgba(255,170,90,.75), 0 0 6px rgba(255,220,170,.6)', opacity: c01((t - cta.from - 0.12 * i) / 0.3) }}>{l}</div>)}</div></AbsoluteFill> : null}
    {P.audio ? <Audio src={src(P.audio)} /> : null}
  </AbsoluteFill>;
};
