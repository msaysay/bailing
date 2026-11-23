// 风格配方引擎：给一条粗剪好的口播（人物视频 + 逐行字幕时间）和一组风格参数（styles/atlas-styles.json 里的 t，或混搭器混出来的），直接出片。
// 一个合成做所有风格：版式（full / split / card / pip / board / letterbox）、字幕样式、纹理、字体、圆角、强调形状、动效都按参数走。
// scripts/skin.py render 用 --props 传数据。横屏竖屏都行（按 w、h）。网页图鉴里的预览（site/atlas-preview.js）画的是同一套参数。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export type SkinT = { bg: string; panel: string; fg: string; hot: string; hot2: string; font: string; radius: number; stroke: number; tex: string; cap: string; layout: string; motion: string; shape: string };
export type SkinProps = { video: string; voice?: string; music?: string; w: number; h: number; total: number; lines: { text: string; start: number; end: number }[]; cuts?: number[];
  face?: number[]; srcW?: number; srcH?: number; t: SkinT; hook: string[]; hot?: string[]; name?: string; slogan?: string; brand?: string; styleName?: string };
export const skinDefault: SkinProps = { video: '', w: 1920, h: 1080, total: 3, lines: [], t: { bg: '#0A0A0B', panel: '#111214', fg: '#F4F2EC', hot: '#D6FF3D', hot2: '#FFD84A', font: 'hei', radius: 4, stroke: 0, tex: 'none', cap: 'stroke', layout: 'full', motion: 'rise', shape: 'bar' }, hook: ['标题', '强调'] };
const FONTS: Record<string, [string, string, number]> = { hei: ['K Hei', 'SourceHanSansSC-Heavy.otf', 900], song: ['K Song', 'NotoSerifSC-Black.ttf', 900], kai: ['K Kai', 'ChillKai.ttf', 700], round: ['K Round', 'ChillRoundF.ttf', 900], thin: ['K Thin', 'MiSans-Regular.otf', 400], mono: ['K Hei', 'SourceHanSansSC-Heavy.otf', 900], pixel: ['K Hei', 'SourceHanSansSC-Heavy.otf', 900], hand: ['K Kai', 'ChillKai.ttf', 700] };
const c01 = (x: number) => Math.max(0, Math.min(1, x)), o5 = (x: number) => 1 - Math.pow(1 - c01(x), 5), back = (x: number) => { const p = c01(x), k = 1.9; return 1 + (k + 1) * Math.pow(p - 1, 3) + k * Math.pow(p - 1, 2); };
const lum = (c: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(c.trim()); if (!m) return 0.5; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const useSkinFonts = (kind: string) => { const [h] = React.useState(() => delayRender('skin-font')); React.useEffect(() => { const [fam, f] = FONTS[kind] ?? FONTS.hei;
  Promise.all([new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: '100 900' }).load().then((x) => document.fonts.add(x)).catch(() => undefined), new FontFace('K Din', `url(${staticFile('fonts/D-DIN-PRO-700-Bold.otf')})`).load().then((x) => document.fonts.add(x)).catch(() => undefined)]).then(() => continueRender(h)); }, [h, kind]); };
/** 按动效预设出现。 */
const enter = (m: string, p: number): React.CSSProperties => { const q = c01(p);
  if (m === 'pop') return { transform: `scale(${back(q)})`, opacity: c01(q * 4) }; if (m === 'slam') return { transform: `scale(${1.9 - 0.9 * o5(q / 0.5)})`, opacity: c01(q * 5) };
  if (m === 'rise') return { transform: `translateY(${(1 - o5(q)) * 60}px)`, opacity: c01(q * 3) }; if (m === 'slide') return { transform: `translateX(${(1 - o5(q)) * -160}px)`, opacity: c01(q * 3) };
  if (m === 'glitch') return { transform: `translateX(${q < 0.5 ? Math.sin(q * 90) * 18 * (1 - q * 2) : 0}px)`, opacity: c01(q * 6) }; if (m === 'draw' || m === 'type') return { clipPath: `inset(0 ${(1 - o5(q)) * 100}% 0 0)` };
  return { opacity: q }; };
const Tex: React.FC<{ t: SkinT; f: number }> = ({ t, f }) => { const dark = lum(t.bg) < 0.5, ink = dark ? '255,255,255' : '0,0,0';
  const bgs: Record<string, React.CSSProperties> = {
    grid: { backgroundImage: `linear-gradient(rgba(${ink},.06) 1px, transparent 1px), linear-gradient(90deg, rgba(${ink},.06) 1px, transparent 1px)`, backgroundSize: '80px 80px' },
    dots: { backgroundImage: `radial-gradient(rgba(${ink},.10) 3px, transparent 3.5px)`, backgroundSize: '44px 44px' },
    halftone: { backgroundImage: `radial-gradient(rgba(${ink},.16) 4px, transparent 4.5px)`, backgroundSize: '26px 26px', WebkitMaskImage: 'linear-gradient(120deg, transparent 10%, #000 60%)' },
    scan: { backgroundImage: `repeating-linear-gradient(0deg, rgba(${ink},.06) 0 2px, transparent 2px 7px)` },
    paper: { backgroundImage: 'radial-gradient(rgba(90,60,20,.10) 1.5px, transparent 2px)', backgroundSize: '9px 11px' },
    grain: { backgroundImage: 'radial-gradient(rgba(255,255,255,.10) 1.2px, transparent 1.6px)', backgroundSize: '5px 5px', backgroundPosition: `${(f * 7) % 5}px ${(f * 3) % 5}px` },
    glow: { background: `radial-gradient(900px 700px at 25% 25%, ${t.hot}55, transparent 70%), radial-gradient(900px 700px at 80% 75%, ${t.hot2}44, transparent 70%)` } };
  return t.tex === 'none' || !bgs[t.tex] ? null : <AbsoluteFill style={{ ...bgs[t.tex], pointerEvents: 'none' }} />; };

export const SkinTalk: React.FC<SkinProps> = (P) => {
  const f = useCurrentFrame(), { fps } = useVideoConfig(), t = f / fps, T = P.t, W = P.w, H = P.h, tall = H > W, U = Math.min(W, H) / 1080;      // U：按短边缩放的单位
  useSkinFonts(T.font);
  const FAM = `"${(FONTS[T.font] ?? FONTS.hei)[0]}", "PingFang SC", sans-serif`, WT = (FONTS[T.font] ?? FONTS.hei)[2], dark = lum(T.bg) < 0.5;
  const panelDark = /^rgba/.test(T.panel) ? dark : lum(T.panel) < 0.5, onPanel = panelDark ? '#FFFFFF' : '#141414', onHot = lum(T.hot) > 0.55 ? '#141414' : '#FFFFFF';
  const sw = P.srcW ?? 1920, sh = P.srcH ?? 1080, face = P.face ?? [sw / 2, sh * 0.42, sw * 0.13];
  // 人物：把脸放到 (cx, cy)，脸宽 fw；剪口处推近、拉回交替，盖住跳帧
  const cutK = (P.cuts ?? []).filter((c) => c <= t).length, lastCut = [...(P.cuts ?? [])].reverse().find((c) => c <= t) ?? -9, hit = 1 - o5((t - lastCut) / 0.25);
  const Person: React.FC<{ cx: number; cy: number; fw: number }> = ({ cx, cy, fw }) => { const k = (fw * (cutK % 2 ? 1.08 : 1) * (1 + hit * 0.04)) / face[2];
    return <OffthreadVideo src={staticFile(P.video)} muted style={{ position: 'absolute', left: cx - face[0] * k, top: cy - face[1] * k, width: sw * k, height: sh * k, maxWidth: 'none' }} />; };
  const L = T.layout, line = P.lines.find((l) => t >= l.start - 0.03 && t < l.end + 0.06), hotWord = line && (P.hot ?? []).find((h) => line.text.includes(h)), kwAt = line?.start ?? 0;
  const hookEnd = Math.min(P.total, (P.lines[Math.min(2, P.lines.length - 1)]?.end ?? 3) + 0.2), hookOn = t < hookEnd, hookP = (d: number) => (t - d) / 0.5;
  const seen = Array.from(new Set(P.lines.filter((l) => l.start <= t && l.start >= hookEnd - 0.1).map((l) => (P.hot ?? []).find((h) => l.text.includes(h))).filter(Boolean) as string[])).filter((x) => x !== hotWord).slice(-4);
  const big: React.CSSProperties = { fontFamily: FAM, fontWeight: WT, lineHeight: 1.12, letterSpacing: T.font === 'thin' ? '0.02em' : '-0.01em', whiteSpace: 'nowrap' };
  const strokeTxt = (px: number, col = 'rgba(0,0,0,.88)'): React.CSSProperties => ({ WebkitTextStroke: `${px}px ${col}`, paintOrder: 'stroke fill' });
  /** 强调形状：跟在一个词旁边。 */
  const Accent: React.FC<{ p: number; w?: number }> = ({ p, w = 100 }) => { const q = o5(p);
    if (T.shape === 'bar') return <div style={{ position: 'absolute', left: -26 * U, top: '8%', width: 10 * U, height: `${84 * q}%`, background: T.hot }} />;
    if (T.shape === 'underline') return <div style={{ position: 'absolute', left: 0, bottom: -10 * U, height: 10 * U, width: `${w * q}%`, background: T.hot }} />;
    if (T.shape === 'brush') return <div style={{ position: 'absolute', left: '-3%', bottom: '8%', height: '42%', width: `${106 * q}%`, background: T.hot, opacity: 0.5, borderRadius: 20 * U, transform: 'rotate(-1.2deg)' }} />;
    if (T.shape === 'circle') return <div style={{ position: 'absolute', left: -44 * U, top: '36%', width: 24 * U * q, height: 24 * U * q, borderRadius: '50%', background: T.hot }} />;
    if (T.shape === 'bracket') return <>{[[0, 0, 1, 1], [1, 0, -1, 1], [0, 1, 1, -1], [1, 1, -1, -1]].map(([x, y, sx, sy], i) => <div key={i} style={{ position: 'absolute', [x ? 'right' : 'left']: -18 * U * (2 - q), [y ? 'bottom' : 'top']: -8 * U, width: 22 * U, height: 22 * U, borderLeft: sx > 0 ? `${4 * U}px solid ${T.hot}` : undefined, borderRight: sx < 0 ? `${4 * U}px solid ${T.hot}` : undefined, borderTop: sy > 0 ? `${4 * U}px solid ${T.hot}` : undefined, borderBottom: sy < 0 ? `${4 * U}px solid ${T.hot}` : undefined } as React.CSSProperties} />)}</>;
    return null; };
  /** 标题（钩子）：两行，小字 + 大字。onDark 决定小字颜色。 */
  const Hook: React.FC<{ size: number; col: string; sub: string; align?: 'left' | 'center' }> = ({ size, col, sub, align = 'left' }) => !hookOn ? null : <div style={{ textAlign: align, opacity: c01((hookEnd - t) / 0.25) }}>
    <div style={{ ...big, fontSize: size * 0.5, color: sub, ...enter(T.motion, hookP(0.15)), transformOrigin: 'left bottom' }}>{P.hook[0]}</div>
    <div style={{ position: 'relative', display: 'inline-block', marginTop: size * 0.12 }}><Accent p={hookP(0.75)} />
      <div style={{ ...big, position: 'relative', fontSize: size, color: T.shape === 'brush' || T.shape === 'bracket' ? col : T.hot, ...(T.cap === 'pop' ? strokeTxt(Math.max(10, T.stroke * 1.6) * U, dark ? '#000' : T.fg) : {}), ...enter(T.motion, hookP(0.4)), transformOrigin: 'left center' }}>{P.hook[1]}</div></div></div>;
  /** 关键词：说到 hot 里的词时弹一下。 */
  const Keyword: React.FC<{ size: number; col?: string }> = ({ size, col }) => !hotWord || hookOn ? null : <div style={{ position: 'relative', display: 'inline-block' }}><Accent p={(t - kwAt - 0.25) / 0.4} />
    <div style={{ ...big, position: 'relative', fontSize: size, color: col ?? T.hot, ...(T.cap === 'pop' ? strokeTxt(Math.max(10, T.stroke * 1.6) * U, dark ? '#000' : T.fg) : {}), ...enter(T.motion, (t - kwAt) / 0.4), transformOrigin: 'left center' }}>{hotWord}</div></div>;
  /** 字幕：五种样式。 */
  const CAP = (L === 'split' || L === 'board' || L === 'card' || L === 'pip') && (T.cap === 'plain' || T.cap === 'stroke') ? 'bar' : T.cap;
  const Subs: React.FC<{ y: number }> = ({ y }) => { if (!line) return null; const size = (tall ? 58 : 56) * U, re = hotWord ? line.text.split(hotWord) : [line.text], base = CAP === 'box' ? onHot : CAP === 'bar' ? '#FFFFFF' : T.fg;
    const st: React.CSSProperties = CAP === 'stroke' ? strokeTxt(9 * U) : CAP === 'pop' ? strokeTxt(Math.max(12, T.stroke * 1.5) * U, dark ? '#000' : T.fg) : {}, p = o5((t - line.start) / 0.16);
    return <div style={{ position: 'absolute', left: L === 'split' && !tall ? W * 0.44 : 0, right: 0, top: y, textAlign: 'center', transform: `translateY(${(1 - p) * 14}px)` }}>
      <span style={{ display: 'inline-block', fontFamily: FAM, fontWeight: T.font === 'thin' ? 600 : WT, fontSize: size, color: base, padding: CAP === 'bar' || CAP === 'box' ? `${10 * U}px ${28 * U}px` : 0, background: CAP === 'bar' ? 'rgba(0,0,0,.74)' : CAP === 'box' ? T.hot : undefined, borderLeft: CAP === 'bar' ? `${8 * U}px solid ${T.hot}` : undefined, borderRadius: CAP === 'box' ? Math.min(40, T.radius * 1.2) * U : 0, textShadow: CAP === 'plain' && L !== 'board' ? '0 2px 14px rgba(0,0,0,.55)' : undefined, ...st }}>
        {re.map((x, i) => <React.Fragment key={i}>{x}{i < re.length - 1 ? <span style={{ color: CAP === 'box' ? base : T.hot === base ? T.hot2 : T.hot, ...(CAP === 'pop' ? { display: 'inline-block', transform: `scale(${1 + 0.18 * (1 - o5((t - line.start) / 0.3))})` } : {}) }}>{hotWord}</span> : null}</React.Fragment>)}</span></div>; };
  const subY = H - (tall ? 420 : 150) * U, R = T.radius * 2 * U;
  /** 要点清单：前面说过的关键词，一条条攒下来。 */
  const Points: React.FC<{ col: string }> = ({ col }) => hookOn || !seen.length ? null : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 * U, marginTop: 34 * U }}>{seen.map((x, i) => <div key={x} style={{ display: 'flex', alignItems: 'center', gap: 16 * U, fontFamily: FAM, fontWeight: T.font === 'thin' ? 500 : 700, fontSize: 58 * U, color: col, opacity: 0.55 + 0.45 * (i / Math.max(1, seen.length - 1)) }}>
    <span style={{ width: 16 * U, height: 16 * U, background: T.hot2, borderRadius: T.radius ? '50%' : 0, flex: 'none' }} />{x}</div>)}</div>;
  let body: React.ReactNode;
  if (L === 'split') { const pw = tall ? W : W * 0.44 * o5((t - 0.2) / 0.5);
    body = tall ? <><div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H * 0.34, background: T.panel }} /><div style={{ position: 'absolute', left: 0, top: H * 0.34 - 6 * U, width: W, height: 12 * U, background: T.hot }} />
        <div style={{ position: 'absolute', left: 0, top: H * 0.34, width: W, height: H * 0.66, overflow: 'hidden' }}><Person cx={W / 2} cy={H * 0.26} fw={W * 0.36} /></div>
        <div style={{ position: 'absolute', left: 70 * U, top: 150 * U }}><Hook size={150 * U} col={onPanel} sub={panelDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)'} /><Keyword size={150 * U} /></div></>
      : <><AbsoluteFill><Person cx={W * 0.5 + W * 0.21 * o5((t - 0.2) / 0.5)} cy={H * 0.42} fw={W * 0.17} /></AbsoluteFill>
        <div style={{ position: 'absolute', left: -200, top: -40, width: pw + 200, height: H + 80, background: T.panel, transform: 'skewX(-8deg)', borderRight: `${10 * U}px solid ${T.hot}`, boxShadow: '40px 0 90px rgba(0,0,0,.35)' }} />
        <div style={{ position: 'absolute', left: 90 * U, top: H * 0.26, width: W * 0.4 }}><Hook size={150 * U} col={onPanel} sub={panelDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)'} /><Keyword size={190 * U} /><Points col={onPanel} /></div></>; }
  else if (L === 'card' || L === 'pip') { const pip = L === 'pip', cw = tall ? W - 120 * U : W * 0.5, ch = tall ? H * 0.3 : H * 0.6, cx0 = tall ? 60 * U : pip ? 80 * U : W - cw - 90 * U, cy0 = tall ? 190 * U : H * 0.14;
    body = <>{pip ? null : <AbsoluteFill><Person cx={tall ? W / 2 : W * 0.24} cy={tall ? H * 0.62 : H * 0.44} fw={tall ? W * 0.34 : W * 0.16} /></AbsoluteFill>}
      <div style={{ position: 'absolute', left: cx0, top: cy0, width: cw, height: ch, background: T.panel, backdropFilter: /^rgba/.test(T.panel) ? 'blur(24px)' : undefined, borderRadius: R, border: T.stroke ? `${T.stroke * 2 * U}px solid ${lum(/^#/.test(T.panel) ? T.panel : T.bg) > 0.6 ? T.fg : T.hot}` : `1px solid rgba(${dark ? '255,255,255' : '0,0,0'},.14)`, boxShadow: '0 30px 80px rgba(0,0,0,.3)', padding: 60 * U, boxSizing: 'border-box', ...enter(T.motion === 'type' || T.motion === 'draw' ? 'fade' : T.motion, (t - 0.3) / 0.5) }}>
        <div style={{ fontFamily: '"K Din", sans-serif', fontSize: 30 * U, letterSpacing: '0.2em', color: T.hot }}>{P.styleName ?? 'KEY POINT'}</div>
        <div style={{ marginTop: 30 * U }}><Hook size={118 * U} col={onPanel} sub={panelDark ? 'rgba(255,255,255,.7)' : 'rgba(0,0,0,.6)'} /><Keyword size={170 * U} col={T.shape === 'brush' || T.shape === 'bracket' ? onPanel : undefined} /><Points col={onPanel} /></div>
        <div style={{ position: 'absolute', left: 60 * U, right: 60 * U, bottom: 54 * U, height: 12 * U, background: `rgba(${panelDark ? '255,255,255' : '0,0,0'},.12)`, borderRadius: R }}><div style={{ width: `${c01(t / P.total) * 100}%`, height: '100%', background: T.hot2, borderRadius: R }} /></div></div>
      {pip ? <div style={{ position: 'absolute', left: tall ? W / 2 - 230 * U : W - 620 * U, top: tall ? H * 0.52 : H * 0.2, width: 460 * U, height: 460 * U, borderRadius: '50%', overflow: 'hidden', border: `${8 * U}px solid ${T.hot}`, boxShadow: '0 30px 70px rgba(0,0,0,.4)', background: '#000' }}><Person cx={230 * U} cy={220 * U} fw={230 * U} /></div> : null}</>; }
  else if (L === 'board') { const bx = 70 * U, by = (tall ? 150 : 60) * U, bw = W - bx * 2, bh = H - by - (tall ? 520 : 200) * U, ww = tall ? bw - 100 * U : bw * 0.5, wh = tall ? bh * 0.52 : bh - 110 * U;
    body = <><div style={{ position: 'absolute', left: bx, top: by, width: bw, height: bh, background: T.panel, borderRadius: R, boxShadow: '0 20px 60px rgba(0,0,0,.22)' }} />
      <div style={{ position: 'absolute', left: bx + 50 * U, top: by + (tall ? bh * 0.4 : 55 * U), width: ww, height: wh, overflow: 'hidden', borderRadius: R, border: `${Math.max(6, T.stroke * 2.5) * U}px solid #fff`, boxShadow: '0 14px 40px rgba(0,0,0,.28)', background: '#000', transform: 'rotate(-1.2deg)' }}><Person cx={ww / 2} cy={wh * 0.42} fw={ww * 0.3} /></div>
      <div style={{ position: 'absolute', left: tall ? bx + 60 * U : bx + ww + 130 * U, top: by + (tall ? 70 * U : bh * 0.26) }}><Hook size={150 * U} col={onPanel} sub={panelDark ? 'rgba(255,255,255,.65)' : 'rgba(0,0,0,.55)'} /><Keyword size={190 * U} col={T.shape === 'brush' || T.shape === 'bracket' ? onPanel : undefined} /><Points col={onPanel} /></div></>; }
  else { const bar = L === 'letterbox' ? (tall ? 0 : 118 * U) : 0;
    body = <><AbsoluteFill><Person cx={W / 2} cy={H * (tall ? 0.36 : 0.42)} fw={W * (tall ? 0.36 : 0.19)} /></AbsoluteFill>
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(0,0,0,${dark ? 0.5 : 0.25}) 0%, transparent 34%, transparent 62%, rgba(0,0,0,${dark ? 0.62 : 0.3}) 100%)` }} />
      {T.tex === 'grain' || L === 'letterbox' ? <AbsoluteFill style={{ background: `linear-gradient(120deg, ${T.hot2}22, transparent 50%, ${T.hot}22)`, mixBlendMode: 'overlay' }} /> : null}
      <div style={{ position: 'absolute', left: 90 * U, top: (tall ? 200 : 90) * U + bar }}><Hook size={(tall ? 150 : 140) * U} col="#FFFFFF" sub="rgba(255,255,255,.8)" /><Keyword size={(tall ? 140 : 130) * U} /></div>
      {bar ? <><div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: bar * o5(t / 0.5), background: '#000' }} /><div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: bar * o5(t / 0.5), background: '#000' }} /></> : null}</>; }
  const full = L === 'full' || L === 'letterbox';
  return <AbsoluteFill style={{ background: T.bg, overflow: 'hidden' }}>
    {full ? null : <Tex t={T} f={f} />}
    {body}
    {full ? <Tex t={T} f={f} /> : null}
    <Subs y={L === 'letterbox' && !tall ? H - 250 * U : subY} />
    {P.name ? <div style={{ position: 'absolute', left: 80 * U, bottom: (tall ? 250 : 60) * U, display: 'flex', alignItems: 'center', gap: 16 * U, opacity: c01((t - 1.2) / 0.4) * c01((6 - t) / 0.4) }}>
      <div style={{ fontFamily: FAM, fontWeight: WT, fontSize: 40 * U, color: onHot, background: T.hot, padding: `${4 * U}px ${18 * U}px`, borderRadius: Math.min(R, 20 * U) }}>{P.name}</div>
      <div style={{ fontFamily: FAM, fontWeight: 600, fontSize: 28 * U, color: full || dark ? '#fff' : T.fg, textShadow: full ? '0 2px 10px rgba(0,0,0,.7)' : undefined }}>{P.slogan}</div></div> : null}
    {P.brand ? <div style={{ position: 'absolute', right: 60 * U, top: (L === 'letterbox' && !tall ? 150 : 44) * U, fontFamily: FAM, fontWeight: 600, fontSize: 24 * U, letterSpacing: '0.1em', color: full || dark ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.6)' }}>{P.brand}</div> : null}
    <AbsoluteFill style={{ background: lum(T.hot) > 0.5 ? '#fff' : T.hot, opacity: 0.22 * (1 - o5((t - lastCut) / 0.12)), pointerEvents: 'none' }} />
    {P.voice ? <Audio src={staticFile(P.voice)} /> : null}{P.music ? <Audio src={staticFile(P.music)} volume={0.5} /> : null}
  </AbsoluteFill>;
};
