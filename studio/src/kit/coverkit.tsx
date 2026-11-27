// 封面三件套：同一张主图、同一组文字，出三种排法（A 大字压底 / B 满图描边大字 / C 色块分屏），每种按尺寸自适应（抖音 1080×1440、视频号 1080×1260、横版 1920×1080）。
// scripts/publish_kit.py 用 --props 传：主图、时效标签、两行标题、最多三个数字小卡、署名、配色。规矩：标题不超过 10 个字、不压人脸、数字只用核对过的。
import React from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, staticFile, useVideoConfig } from 'remotion';

export type CoverProps = { img: string; layout: 'A' | 'B' | 'C'; w: number; h: number; tag?: string; l1: string; l2: string; chips?: string[][]; brand?: string; bg?: string; hot?: string; fg?: string; faceY?: number; faceX?: number; font?: string };
export const coverDefault: CoverProps = { img: '', layout: 'A', w: 1080, h: 1440, l1: '第一行', l2: '第二行' };
const lum = (c: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(c.trim()); if (!m) return 0.5; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
export const CoverKit: React.FC<CoverProps> = (P) => {
  const { width: W, height: H } = useVideoConfig(), wide = W > H, U = Math.min(W, H) / 1080, bg = P.bg ?? '#0A0A0B', hot = P.hot ?? '#D6FF3D', fg = P.fg ?? '#F4F2EC', onHot = lum(hot) > 0.55 ? '#111' : '#fff';
  const [h] = React.useState(() => delayRender('cover-font'));
  React.useEffect(() => { new FontFace('C Hei', `url(${staticFile('fonts/' + (P.font || 'SourceHanSansSC-Heavy.otf'))})`, { weight: '100 900' }).load().then((f) => document.fonts.add(f)).catch(() => undefined).then(() => continueRender(h)); }, [h, P.font]);
  const F = '"C Hei", "PingFang SC", sans-serif', n = Math.max(P.l1.length, P.l2.length, 4), size = Math.min(wide ? 150 : 170, ((wide ? W * 0.5 : W - 128 * U) / n) * 0.98) * (wide ? 1 : 1), pos = `${(P.faceX ?? 0.5) * 100}% ${(P.faceY ?? 0.3) * 100}%`;
  const Tag = P.tag ? <div style={{ position: 'absolute', left: 64 * U, top: 64 * U, background: hot, color: onHot, fontFamily: F, fontWeight: 900, fontSize: 40 * U, padding: `${8 * U}px ${22 * U}px` }}>{P.tag}</div> : null;
  const Chips = (P.chips ?? []).length ? <div style={{ display: 'flex', gap: 20 * U, marginTop: 36 * U, flexWrap: 'wrap' }}>{(P.chips ?? []).slice(0, 3).map(([a, b]) => <div key={a} style={{ border: `2px solid rgba(255,255,255,.32)`, padding: `${10 * U}px ${24 * U}px`, background: 'rgba(0,0,0,.25)' }}><div style={{ fontFamily: F, fontWeight: 900, fontSize: 50 * U, color: '#fff' }}>{a}</div><div style={{ fontFamily: F, fontSize: 25 * U, color: 'rgba(255,255,255,.65)' }}>{b}</div></div>)}</div> : null;
  const Brand = P.brand ? <div style={{ position: 'absolute', left: 64 * U, bottom: 54 * U, display: 'flex', alignItems: 'center', gap: 14 * U }}><div style={{ width: 14 * U, height: 14 * U, background: hot }} /><span style={{ fontFamily: F, fontWeight: 600, fontSize: 30 * U, color: '#fff', textShadow: '0 2px 10px rgba(0,0,0,.7)' }}>{P.brand}</span></div> : null;
  const big: React.CSSProperties = { fontFamily: F, fontWeight: 900, fontSize: size, lineHeight: 1.1, whiteSpace: 'nowrap', letterSpacing: '-0.01em' };
  if (P.layout === 'A') { const ih = wide ? H : H * 0.62;                                                   // 大字压底：图在上，标题从下巴以下开始
    return <AbsoluteFill style={{ background: bg }}>
      <div style={{ position: 'absolute', left: wide ? W * 0.42 : 0, top: 0, width: wide ? W * 0.58 : W, height: ih, overflow: 'hidden' }}><Img src={staticFile(P.img)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} />
        <div style={{ position: 'absolute', inset: 0, background: wide ? `linear-gradient(90deg, ${bg} 0%, transparent 45%)` : `linear-gradient(180deg, transparent 45%, ${bg} 100%)` }} /></div>
      {Tag}
      <div style={{ position: 'absolute', left: 64 * U, right: 64 * U, top: wide ? H * 0.3 : ih - 150 * U }}><div style={{ ...big, color: fg }}>{P.l1}</div><div style={{ ...big, color: hot }}>{P.l2}</div>{Chips}</div>{Brand}
    </AbsoluteFill>; }
  if (P.layout === 'B') return <AbsoluteFill style={{ background: '#000' }}>                              {/* 满图描边大字 */}
      <Img src={staticFile(P.img)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} />
      <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.35) 0%, transparent 28%, transparent 48%, rgba(0,0,0,.88) 100%)' }} />{Tag}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: (wide ? 120 : 190) * U, textAlign: 'center' }}>
        <div style={{ ...big, fontSize: size * 1.04, color: '#fff', WebkitTextStroke: `${18 * U}px #000`, paintOrder: 'stroke fill' }}>{P.l1}</div>
        <div style={{ ...big, fontSize: size * 1.04, color: hot, WebkitTextStroke: `${18 * U}px #000`, paintOrder: 'stroke fill', transform: 'rotate(-2deg)', marginTop: 6 * U }}>{P.l2}</div></div>{Brand}
    </AbsoluteFill>;
  const th = wide ? H : Math.max(H * 0.4, (P.tag ? 250 : 170) * U + size * 2.6);                                                                            // C 色块分屏：上面一整块强调色
  return <AbsoluteFill style={{ background: bg }}>
    <div style={{ position: 'absolute', left: wide ? W * 0.46 : 0, top: wide ? 0 : th - 40 * U, width: wide ? W * 0.54 : W, height: wide ? H : H - th + 40 * U, overflow: 'hidden' }}><Img src={staticFile(P.img)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: pos }} /></div>
    <div style={{ position: 'absolute', left: 0, top: 0, width: wide ? W * 0.5 : W, height: th, background: hot, clipPath: wide ? 'polygon(0 0, 100% 0, 88% 100%, 0 100%)' : 'polygon(0 0, 100% 0, 100% 88%, 0 100%)' }} />
    <div style={{ position: 'absolute', left: 64 * U, top: (wide ? H * 0.26 : 150 * U) }}>
      {P.tag ? <div style={{ fontFamily: F, fontWeight: 900, fontSize: 38 * U, color: hot, background: onHot, display: 'inline-block', padding: `${6 * U}px ${20 * U}px`, marginBottom: 22 * U }}>{P.tag}</div> : null}
      <div style={{ ...big, color: onHot }}>{P.l1}</div><div style={{ ...big, color: onHot, textDecoration: 'underline', textDecorationThickness: 12 * U, textUnderlineOffset: 14 * U }}>{P.l2}</div></div>
    <div style={{ position: 'absolute', left: 64 * U, bottom: 130 * U }}>{Chips}</div>{Brand}
  </AbsoluteFill>;
};
