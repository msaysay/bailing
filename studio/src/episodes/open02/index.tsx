// 开头片花第二版 · 横屏 1920×1080，9.5 秒。电影感分屏 + 大字排版（不用霓虹故障风）。
// ① 0–0.5 秒 全画幅自拍，上下压电影黑边，「我宣布」从下往上揭开
// ② 0.5–2.6 秒 左边斜切黑板推进来，三行大字跟着声音一行行揭开，「AI 时代」是荧光绿
// ③ 2.6–5.3 秒 黑板上的字换成「看到最后 / 这套工作流的核心内容 / 发给你」
// ④ 5.3–9.5 秒 人讲完，三块屏同时放同一段原片的三种剪法，上面一行大字说明是 AI 工作流一键剪的
// 素材在 studio/public/open01/（不进仓库）。字的时刻取自语音识别的逐字时间，换原片要重量。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const OPEN2_FPS = 30, OPEN2_FRAMES = 288;
const T = { announce: 0.0, short: 0.54, enter: 1.38, ai: 2.1, stay: 2.64, give: 3.18, core: 4.2, send: 4.8, show: 5.3, end: 9.6 };
const FACE = { x: 1010, y: 475 };
const LIME = '#D6FF3D', INK = '#0A0A0B', PAPER = '#F4F2EC';
const HEI = '"Open Hei", "PingFang SC", sans-serif', DIN = '"Open Din", "Open Hei", sans-serif';
const c01 = (x: number) => Math.max(0, Math.min(1, x));
const out3 = (x: number) => 1 - Math.pow(1 - c01(x), 3), out5 = (x: number) => 1 - Math.pow(1 - c01(x), 5), io = (x: number) => { const p = c01(x); return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
const useFonts2 = () => {
  const [h] = React.useState(() => delayRender('open2-fonts'));
  React.useEffect(() => {
    Promise.all([['Open Hei', 'SourceHanSansSC-Heavy.otf'], ['Open Din', 'D-DIN-PRO-700-Bold.otf']].map(([fam, f]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: '100 900' }).load().then((x) => document.fonts.add(x)).catch(() => undefined))).then(() => continueRender(h));
  }, [h]);
};
/** 一行字从下往上揭开（遮罩里滑上来），不抖不闪。out 之后往上滑走。 */
const Rise: React.FC<{ at: number; out?: number; t: number; children: React.ReactNode; style?: React.CSSProperties; dur?: number }> = ({ at, out = 99, t, children, style, dur = 0.42 }) => {
  if (t < at - 0.02 || t > out + 0.3) return null; const p = out5((t - at) / dur), q = out3((t - out) / 0.25);
  return <div style={{ overflow: 'hidden', ...style }}><div style={{ transform: `translateY(${(1 - p) * 110 - q * 110}%)`, opacity: 1 - q }}>{children}</div></div>;
};
/** 展示段的一块屏：边框细白线，角上一个编号标签，下面风格名。 */
const Tile: React.FC<{ src: string; x: number; y: number; w: number; h: number; at: number; t: number; no: string; name: string; from?: number }> = ({ src, x, y, w, h, at, t, no, name, from = 0 }) => {
  const { fps } = useVideoConfig(); if (t < at - 0.02) return null; const p = out5((t - at) / 0.6), drift = (t - at) * 5;
  return (
    <div style={{ position: 'absolute', left: x, top: y + (1 - p) * 420 - drift * 0.6, width: w, opacity: c01((t - at) / 0.15) }}>
      <div style={{ width: w, height: h, overflow: 'hidden', borderRadius: 14, outline: `2px solid rgba(244,242,236,.85)`, outlineOffset: 6, background: '#000', boxShadow: '0 40px 90px rgba(0,0,0,.75)', clipPath: `inset(${(1 - p) * 100}% 0 0 0 round 14px)` }}>
        <Sequence from={Math.round(at * fps)} layout="none"><OffthreadVideo src={staticFile(src)} muted startFrom={Math.round(from * fps)} playbackRate={0.5} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.06 - 0.06 * p})` }} /></Sequence>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 22, opacity: out3((t - at - 0.3) / 0.3) }}>
        <span style={{ fontFamily: DIN, fontSize: 30, color: INK, background: LIME, padding: '0 12px', borderRadius: 4 }}>{no}</span>
        <span style={{ fontFamily: HEI, fontSize: 32, letterSpacing: 2, color: PAPER }}>{name}</span>
      </div>
    </div>
  );
};
export const OPEN02: React.FC = () => {
  useFonts2();
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps;
  const panel = out5((t - (T.short - 0.08)) / 0.5);                       // 左边黑板推进来
  const leave = io((t - (T.show - 0.12)) / 0.5);                          // 讲完，整个画面往上让位给三屏
  const vx = interpolate(panel, [0, 1], [0, 400]);                         // 人往右让
  const zoom = 1.04 + 0.05 * c01(t / T.show) + 0.03 * out3((t - T.ai) / 0.3) * (t >= T.ai ? 1 : 0);   // 一直极慢地推，「AI 时代」再顶一下
  const bars = interpolate(out3(t / 0.35), [0, 1], [0, 74]);
  const PW = 980;                                                          // 黑板宽
  const phase3 = t >= T.stay - 0.02;
  return (
    <AbsoluteFill style={{ background: INK, overflow: 'hidden' }}>
      {/* —— 前三拍：人 + 黑板 —— */}
      <AbsoluteFill style={{ transform: `translateY(${-leave * 1090}px)` }}>
        <AbsoluteFill style={{ overflow: 'hidden' }}>
          <OffthreadVideo src={staticFile('open01/me.mp4')} muted style={{ position: 'absolute', left: 960 + vx - FACE.x * zoom, top: 500 - FACE.y * zoom, width: 1920 * zoom, height: 1080 * zoom, maxWidth: 'none', filter: 'contrast(1.1) saturate(1.05)' }} />
          <AbsoluteFill style={{ background: 'radial-gradient(1200px 800px at 68% 45%, transparent 40%, rgba(0,0,0,.55) 100%)' }} />
        </AbsoluteFill>
        {/* 第一拍的字：压在画面左下 */}
        <Rise at={T.announce - 0.6} out={T.short - 0.1} t={t} style={{ position: 'absolute', left: 110, top: 600 }}><div style={{ fontFamily: HEI, fontSize: 290, lineHeight: 1.08, color: PAPER, letterSpacing: 6, textShadow: '0 10px 40px rgba(0,0,0,.6)' }}>我宣布<span style={{ color: LIME }}>：</span></div></Rise>
        {/* 斜切黑板 */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: PW, height: 1080, background: INK, transform: `translateX(${(panel - 1) * (PW + 60)}px)`, clipPath: 'polygon(0 0, 100% 0, calc(100% - 150px) 100%, 0 100%)' }} />
        <div style={{ position: 'absolute', left: PW - 150 + 6, top: 0, width: 8, height: 1080, background: LIME, transform: `translateX(${(panel - 1) * (PW + 60)}px) skewX(-7.9deg)`, transformOrigin: 'top left', marginLeft: 144 }} />
        {/* 第二拍：三行大字 */}
        {!phase3 || t < T.stay + 0.3 ? (
          <div style={{ position: 'absolute', left: 100, top: 205, width: 800 }}>
            <Rise at={T.short} out={T.stay - 0.12} t={t}><div style={{ fontFamily: HEI, fontSize: 138, lineHeight: 1.16, color: PAPER, letterSpacing: 4, whiteSpace: 'nowrap' }}>短视频剪辑</div></Rise>
            <Rise at={T.enter} out={T.stay - 0.08} t={t}><div style={{ fontFamily: HEI, fontSize: 92, lineHeight: 1.3, color: 'rgba(244,242,236,.62)', letterSpacing: 14, whiteSpace: 'nowrap' }}>正式进入</div></Rise>
            <Rise at={T.ai} out={T.stay - 0.04} t={t} dur={0.5}><div style={{ fontFamily: HEI, fontSize: 250, lineHeight: 1.1, color: LIME, letterSpacing: 2, whiteSpace: 'nowrap' }}><span style={{ fontFamily: DIN, fontSize: 290 }}>AI</span>时代</div></Rise>
          </div>
        ) : null}
        {t >= T.ai && t < T.stay && <div style={{ position: 'absolute', left: 104, top: 790, width: interpolate(out5((t - T.ai) / 0.5), [0, 1], [0, 700]), height: 12, background: LIME }} />}
        {/* 第三拍：看到最后 */}
        {phase3 && (
          <div style={{ position: 'absolute', left: 100, top: 215, width: 800 }}>
            <Rise at={T.stay + 0.04} t={t}><div style={{ display: 'inline-block', fontFamily: HEI, fontSize: 70, color: INK, background: LIME, padding: '6px 30px 10px', letterSpacing: 6 }}>看到最后</div></Rise>
            <Rise at={T.give + 0.1} t={t} style={{ marginTop: 34 }}><div style={{ fontFamily: HEI, fontSize: 112, lineHeight: 1.2, color: PAPER, whiteSpace: 'nowrap' }}>这套工作流的</div></Rise>
            <Rise at={T.core} t={t}><div style={{ fontFamily: HEI, fontSize: 170, lineHeight: 1.2, color: PAPER, whiteSpace: 'nowrap' }}>核心内容</div></Rise>
            <Rise at={T.send} t={t} style={{ marginTop: 10 }}><div style={{ fontFamily: HEI, fontSize: 112, lineHeight: 1.25, color: LIME, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 24 }}>发给你<span style={{ fontFamily: DIN, transform: `translateX(${Math.sin(t * 9) * 12}px)` }}>→</span></div></Rise>
          </div>
        )}
        {/* 电影黑边和角上的小字 */}
        <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: bars, background: '#000' }} /><div style={{ position: 'absolute', left: 0, bottom: 0, width: 1920, height: bars, background: '#000' }} />
        <div style={{ position: 'absolute', right: 70, top: 96, fontFamily: DIN, fontSize: 28, letterSpacing: 6, color: 'rgba(244,242,236,.8)', display: 'flex', alignItems: 'center', gap: 12, opacity: out3(t / 0.4) }}><span style={{ width: 16, height: 16, borderRadius: 8, background: '#FF3B30', opacity: Math.floor(t * 2) % 2 ? 0.3 : 1 }} />AI EDIT · 2026</div>
      </AbsoluteFill>
      {/* —— 第四拍：三屏同放 —— */}
      {t >= T.show - 0.15 && (
        <AbsoluteFill style={{ transform: `translateY(${(1 - leave) * 1090}px)` }}>
          <AbsoluteFill style={{ background: `radial-gradient(1400px 700px at 50% 110%, #1C2410 0%, ${INK} 62%)` }} />
          <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, backgroundImage: 'linear-gradient(rgba(244,242,236,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(244,242,236,.045) 1px, transparent 1px)', backgroundSize: '96px 96px' }} />
          <div style={{ position: 'absolute', left: 80, top: 44, right: 80, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Rise at={T.show + 0.15} t={t}><div style={{ fontFamily: HEI, fontSize: 104, lineHeight: 1.15, color: PAPER, letterSpacing: 3, whiteSpace: 'nowrap' }}>这三条，全是 <span style={{ fontFamily: DIN, fontSize: 124, color: LIME }}>AI</span> 剪的</div></Rise>
            <Rise at={T.show + 0.5} t={t}><div style={{ fontFamily: HEI, fontSize: 36, lineHeight: 1.5, color: 'rgba(244,242,236,.7)', textAlign: 'right', letterSpacing: 2, paddingBottom: 14 }}>同一段原片<br />三种风格</div></Rise>
          </div>
          <Tile src="open01/d1.mp4" x={108} y={212} w={360} h={640} at={T.show + 0.3} t={t} no="01" name="快节奏风" />
          <Tile src="open01/d3.mp4" x={528} y={244} w={864} h={576} at={T.show + 0.5} t={t} no="02" name="横屏深度风" />
          <Tile src="open01/d2.mp4" x={1452} y={212} w={360} h={640} at={T.show + 0.7} t={t} no="03" name="财经解读风" />
          {/* 底下一条：是谁剪的 */}
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 22, display: 'flex', justifyContent: 'center' }}>
            <Rise at={T.show + 1.5} t={t}><div style={{ fontFamily: HEI, fontSize: 50, color: INK, background: LIME, padding: '4px 44px 8px', letterSpacing: 4, whiteSpace: 'nowrap' }}>我的 AI 自动剪辑工作流 · 一键生成</div></Rise>
          </div>
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: '#000', opacity: t > T.end - 0.2 ? c01((t - (T.end - 0.2)) / 0.2) : 0 }} />
      <Audio src={staticFile('open01/voice.wav')} />
      <Audio src={staticFile('open01/bed.wav')} volume={(fr) => (fr / fps < T.show - 0.3 ? 0.22 : 0.55)} />
      {[[T.short - 0.08, 'whoosh.wav', 0.4], [T.ai, 'thud.wav', 0.7], [T.stay, 'tick.wav', 0.4], [T.show - 0.12, 'whoosh.wav', 0.6], [T.show + 0.3, 'tick.wav', 0.5], [T.show + 0.5, 'tick.wav', 0.5], [T.show + 0.7, 'tick.wav', 0.5]].map(([at, file, v], i) => <Sequence key={i} from={Math.max(0, Math.round((at as number) * fps))} layout="none"><Audio src={staticFile('sfx/' + file)} volume={(v as number) * 0.5} /></Sequence>)}
    </AbsoluteFill>
  );
};
