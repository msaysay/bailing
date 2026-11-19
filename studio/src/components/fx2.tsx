// 炫技动效（下）：剪辑软件类界面、空间变换、转场和收尾。
import React from 'react';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';
import { MONO } from './fx';

const cl = (v: number) => Math.max(0, Math.min(1, v));
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const useUid = () => 'u' + React.useId().replace(/[^a-zA-Z0-9]/g, '');
const ORANGE = '#FF6A2B';
const Cursor: React.FC<{ x: number; y: number; o?: number }> = ({ x, y, o = 1 }) => <svg width={44} height={44} viewBox="0 0 24 24" style={{ position: 'absolute', left: x, top: y, opacity: o, zIndex: 9 }}><path d="M4 2 L4 19 L8.5 15 L11.5 22 L14.5 20.7 L11.6 14 L18 14 Z" fill="#fff" stroke="#000" strokeWidth={1.2} strokeLinejoin="round" /></svg>;

/** 关键帧时间线：几条轨道上排着菱形关键帧，播放头扫过去，鼠标把其中一个关键帧拖到新位置。讲「精细调整」「专业级控制」。 */
export const KeyframeTimeline: React.FC<{ tracks: { name: string; keys: number[] }[]; at: number; playFrom: number; playTo: number; drag?: { track: number; key: number; to: number; at: number }; width?: number }> = ({ tracks, at, playFrom, playTo, drag, width = 1500 }) => {
  const t = useT(), a = prog(t, at, 0.5), lw = 230, tw = width - lw - 30, rh = 58, ph = cl((t - playFrom) / (playTo - playFrom)), H = tracks.length * rh + 70, dk = drag ? inOut((t - drag.at) / 0.8) : 0;
  const dragX = drag ? lw + mix(tracks[drag.track].keys[drag.key], drag.to, dk) * tw : 0, dragY = drag ? 60 + drag.track * rh + rh / 2 : 0, appear = drag ? cl((t - drag.at + 0.7) / 0.5) : 0;
  return (
    <div style={{ position: 'relative', width, height: H, background: '#12151B', border: `2px solid ${C.line}`, borderRadius: 18, overflow: 'hidden', opacity: a, fontFamily: FONT }}>
      <div style={{ position: 'absolute', left: lw, top: 0, width: tw, height: 50, backgroundImage: `repeating-linear-gradient(90deg, ${C.muted} 0 2px, transparent 2px ${tw / 40}px)`, backgroundSize: '100% 14px', backgroundRepeat: 'no-repeat', backgroundPosition: '0 36px', opacity: 0.6 }} />
      {tracks.map((tr, i) => <div key={i} style={{ position: 'absolute', left: 0, top: 60 + i * rh, width, height: rh - 8, opacity: prog(t, at + 0.1 + i * 0.07, 0.3) }}>
        <div style={{ position: 'absolute', left: 24, top: 0, lineHeight: `${rh - 8}px`, fontSize: 26, color: C.text, whiteSpace: 'nowrap' }}><span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 4, background: [ORANGE, C.accent, '#3DD6C6', C.warm, '#B48CFF'][i % 5], marginRight: 14 }} />{tr.name}</div>
        <div style={{ position: 'absolute', left: lw, top: 6, width: tw, height: rh - 20, background: 'rgba(255,255,255,.07)', borderRadius: 6 }} />
        {tr.keys.map((kx, j) => { const me = drag && drag.track === i && drag.key === j, x = me ? mix(kx, drag!.to, dk) : kx, lit = x <= ph;
          return <div key={j} style={{ position: 'absolute', left: lw + x * tw - 9, top: (rh - 8) / 2 - 9, width: 18, height: 18, transform: `rotate(45deg) scale(${me ? 1 + 0.5 * Math.sin(Math.PI * dk) : 1})`, background: me ? '#fff' : lit ? ORANGE : '#7A4A2E', boxShadow: lit || me ? `0 0 14px ${ORANGE}` : 'none' }} />; })}
      </div>)}
      <div style={{ position: 'absolute', left: lw + ph * tw - 1.5, top: 0, width: 3, height: H, background: ORANGE }}><div style={{ position: 'absolute', left: -9, top: 0, width: 21, height: 24, background: ORANGE, clipPath: 'polygon(0 0, 100% 0, 100% 60%, 50% 100%, 0 60%)' }} /></div>
      {drag && <Cursor x={mix(dragX + 200, dragX, appear) - 6} y={mix(dragY + 120, dragY, appear) - 4} o={appear} />}
    </div>
  );
};
/** 缓动曲线：一条速度曲线被手柄从一种形状拉成另一种，下面的小球按这条曲线来回跑。讲「节奏」「手感」「调参数」。 */
export const EaseCurve: React.FC<{ from: [number, number, number, number]; to: [number, number, number, number]; at: number; morphAt: number; size?: number; label?: [string, string] }> = ({ from, to, at, morphAt, size = 520, label }) => {
  const t = useT(), a = prog(t, at, 0.5), k = inOut((t - morphAt) / 1), c = from.map((v, i) => mix(v, to[i], k)), S = size, X = (v: number) => v * S, Y = (v: number) => S - v * S;
  const bez = (u: number, p1: number, p2: number) => 3 * (1 - u) * (1 - u) * u * p1 + 3 * (1 - u) * u * u * p2 + u * u * u, ease = (x: number) => { let lo = 0, hi = 1; for (let i = 0; i < 22; i++) { const m = (lo + hi) / 2; if (bez(m, c[0], c[2]) < x) lo = m; else hi = m; } return bez((lo + hi) / 2, c[1], c[3]); };
  const loop = ((Math.max(0, t - at)) % 1.8) / 1.8, tp = cl(loop / 0.7), bx = ease(tp), d = `M0 ${S} C${X(c[0])} ${Y(c[1])} ${X(c[2])} ${Y(c[3])} ${S} 0`, draw = inOut((t - at) / 0.9);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 80, opacity: a, fontFamily: FONT }}>
      <svg width={S + 40} height={S + 40} viewBox={`-20 -20 ${S + 40} ${S + 40}`} style={{ overflow: 'visible' }}>
        <rect x={0} y={0} width={S} height={S} fill="rgba(255,255,255,.03)" stroke={C.line} strokeWidth={2} />{[1, 2, 3].map((i) => <g key={i}><line x1={(S * i) / 4} x2={(S * i) / 4} y1={0} y2={S} stroke={C.line} /><line y1={(S * i) / 4} y2={(S * i) / 4} x1={0} x2={S} stroke={C.line} /></g>)}
        <line x1={0} y1={S} x2={X(c[0])} y2={Y(c[1])} stroke={C.muted} strokeWidth={2} opacity={draw} /><line x1={S} y1={0} x2={X(c[2])} y2={Y(c[3])} stroke={C.muted} strokeWidth={2} opacity={draw} />
        <path d={d} fill="none" stroke={C.warm} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
        <circle cx={X(c[0])} cy={Y(c[1])} r={13} fill={C.bg} stroke={ORANGE} strokeWidth={5} opacity={draw} /><circle cx={X(c[2])} cy={Y(c[3])} r={13} fill={C.bg} stroke={ORANGE} strokeWidth={5} opacity={draw} />
        <circle cx={X(tp)} cy={Y(bx)} r={9} fill="#fff" opacity={draw} />
      </svg>
      <div style={{ width: 560 }}>
        <div style={{ fontFamily: MONO, fontSize: 30, color: C.muted, marginBottom: 14 }}>cubic-bezier({c.map((v) => v.toFixed(2)).join(', ')})</div>
        {label && <div style={{ fontSize: 54, fontWeight: 900, color: C.text, marginBottom: 40 }}>{k < 0.5 ? label[0] : label[1]}</div>}
        <div style={{ position: 'relative', height: 90, borderBottom: `3px solid ${C.line}` }}><div style={{ position: 'absolute', left: bx * 480, bottom: 8, width: 70, height: 70, borderRadius: 35, background: ORANGE, boxShadow: `0 0 40px ${ORANGE}99` }} /></div>
      </div>
    </div>
  );
};
/** 爆炸分层：一张平面图先倒成斜视角，再一层层上下拉开，每层拉出一条标注。讲「这个画面其实是由这些部件组成的」。 */
export const ExplodeView: React.FC<{ layers: React.ReactNode[]; labels: string[]; at: number; explodeAt: number; w?: number; h?: number; gap?: number }> = ({ layers, labels, at, explodeAt, w = 640, h = 360, gap = 86 }) => {
  const t = useT(), k1 = inOut((t - at) / 0.9), k2 = inOut((t - explodeAt) / 1), n = layers.length, W = w + 760, H = h + (n - 1) * gap + 120, cx = w * 0.55 + 40, cy = H / 2;
  return (
    <div style={{ position: 'relative', width: W, height: H, fontFamily: FONT }}>
      {layers.map((l, i) => { const off = -(i - (n - 1) / 2) * gap * k2;
        return <div key={i} style={{ position: 'absolute', left: cx - w / 2, top: cy - h / 2, width: w, height: h, transform: `translateY(${off}px) rotateX(${56 * k1}deg) rotateZ(${-34 * k1}deg) scale(${mix(1, 0.86, k1)})`, borderRadius: 12, overflow: 'hidden', boxShadow: `0 ${10 + 30 * k2}px ${30 + 40 * k2}px rgba(0,0,0,.5)`, outline: `${2 * k2}px solid rgba(120,160,255,.6)` }}>{l}</div>; })}
      {labels.map((lb, i) => { const off = -(i - (n - 1) / 2) * gap * k2, p = prog(t, explodeAt + 0.5 + (n - 1 - i) * 0.14, 0.4), y = cy + off;
        return <React.Fragment key={i}><div style={{ position: 'absolute', left: cx + w * 0.42, top: y - 1, width: (W - 330 - cx - w * 0.42) * p, height: 2, background: C.muted }} /><div style={{ position: 'absolute', left: W - 310, top: y - 22, fontSize: 34, fontWeight: 600, color: C.text, opacity: p, whiteSpace: 'nowrap' }}>{lb}</div></React.Fragment>; })}
    </div>
  );
};
/** 参数连代码：左边上面是滑杆参数、下面是源码，右边是同一个画面；拖滑杆时源码不动，改源码时参数不动，两条连线都通向画面。讲「两套东西互不干扰」。 */
export const ParamsToCode: React.FC<{ params: { name: string; from: number; to: number; at: number }[]; code: string[]; edit?: { line: number; text: string; at: number; who?: string }; children: React.ReactNode; at: number; titles?: [string, string, string]; width?: number }> = ({ params, code, edit, children, at, titles = ['参数', '源码', '同一画面'], width = 1600 }) => {
  const t = useT(), a = prog(t, at, 0.6), lw = width * 0.56, H = 640, ph = 250, pv = width * 0.32, px = width - pv, py = H / 2 - (pv * 0.5625 + 60) / 2;
  const panel: React.CSSProperties = { position: 'absolute', left: 0, width: lw, background: '#161A21', border: `2px solid ${C.line}`, borderRadius: 18, boxSizing: 'border-box', padding: '20px 30px' }, moving = params.some((p) => t > p.at && t < p.at + 0.9), typing = edit ? t > edit.at && t < edit.at + 1.4 : false;
  return (
    <div style={{ position: 'relative', width, height: H, opacity: a, fontFamily: FONT }}>
      <svg width={width} height={H} style={{ position: 'absolute', inset: 0 }}>{[[ph / 2, moving], [ph + 30 + (H - ph - 30) / 2, typing]].map(([y, on], i) => <path key={i} d={`M${lw} ${y} C${lw + 90} ${y} ${px - 90} ${H / 2} ${px} ${H / 2}`} fill="none" stroke={on ? ORANGE : C.muted} strokeWidth={on ? 4 : 2} strokeDasharray="6 8" strokeDashoffset={-t * 40} />)}</svg>
      <div style={{ ...panel, top: 0, height: ph }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}><span style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{titles[0]}</span><span style={{ fontFamily: MONO, fontSize: 20, color: C.muted }}>params.json</span></div>
        {params.map((p, i) => { const v = mix(p.from, p.to, inOut((t - p.at) / 0.9)), on = t > p.at && t < p.at + 0.9;
          return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 24, height: 54 }}><div style={{ width: 90, fontSize: 26, color: C.muted }}>{p.name}</div>
            <div style={{ flex: 1, position: 'relative', height: 6, background: C.line, borderRadius: 3 }}><div style={{ width: `${v}%`, height: '100%', background: on ? ORANGE : C.text, borderRadius: 3 }} /><div style={{ position: 'absolute', left: `${v}%`, top: -10, width: 26, height: 26, marginLeft: -13, borderRadius: 13, background: on ? ORANGE : '#fff', boxShadow: on ? `0 0 20px ${ORANGE}` : 'none' }} /></div>
            <div style={{ width: 80, textAlign: 'right', fontFamily: MONO, fontSize: 26, color: on ? ORANGE : C.text }}>{Math.round(v)}%</div></div>; })}
      </div>
      <div style={{ ...panel, top: ph + 30, height: H - ph - 30 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 28, fontWeight: 900, color: C.text }}>{titles[1]}</span><span style={{ fontFamily: MONO, fontSize: 20, color: C.muted }}>scene.tsx</span></div>
        {code.map((ln, i) => { const me = edit && edit.line === i, n = me ? Math.floor(cl((t - edit!.at) / 1.2) * edit!.text.length) : 0, started = me && t >= edit!.at;
          return <div key={i} style={{ fontFamily: MONO, fontSize: 25, lineHeight: '40px', color: me && started ? '#FFD9C4' : '#AEB6C6', background: me && started ? 'rgba(255,106,43,.14)' : 'transparent', whiteSpace: 'pre', paddingLeft: 10, borderLeft: `4px solid ${me && started ? ORANGE : 'transparent'}` }}><span style={{ color: '#4A5263', marginRight: 22 }}>{String(i + 1).padStart(2, '0')}</span>{me && started ? edit!.text.slice(0, n) : ln}{me && typing && <span style={{ background: ORANGE, color: '#fff', fontFamily: FONT, fontSize: 18, padding: '2px 10px', borderRadius: 6, marginLeft: 10 }}>{edit!.who ?? 'Agent'}</span>}</div>; })}
      </div>
      <div style={{ position: 'absolute', left: px, top: py, width: pv, background: '#161A21', border: `2px solid ${moving || typing ? ORANGE : C.line}`, borderRadius: 18, boxSizing: 'border-box', padding: 16 }}><div style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 12 }}>{titles[2]}</div><div style={{ width: pv - 36, height: (pv - 36) * 0.5625, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>{children}</div></div>
    </div>
  );
};
/** 卡片墙飞行：一面卡片墙先平铺，然后整面倒下去变成一条向远处延伸的卡片流，镜头贴着飞过去。讲「模板很多」「作品很多」「社区」。 */
export const CardWallFly: React.FC<{ cols?: number; rows?: number; at: number; flyAt: number; cards?: React.ReactNode[]; width?: number; height?: number }> = ({ cols = 14, rows = 7, at, flyAt, cards, width = 1700, height = 720 }) => {
  const t = useT(), k = inOut((t - flyAt) / 1.4), cw = 108, chh = 66, g = 12, W = cols * (cw + g), H = rows * (chh + g), drift = Math.max(0, t - flyAt) * 90, tones = ['#F3F1EA', '#1B2130', '#1B2130', '#E9D9B0', '#0E1118', '#F3F1EA', '#26304A'];
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', perspective: 900 }}>
      <div style={{ position: 'absolute', left: width / 2 - W / 2, top: height / 2 - H / 2, width: W, height: H, transform: `rotateX(${58 * k}deg) rotateZ(${-22 * k}deg) scale(${mix(1, 2.3, k)}) translate(${-drift * k}px, ${drift * 0.4 * k}px)` }}>
        {Array.from({ length: cols * rows }).map((_, i) => { const c = i % cols, r = Math.floor(i / cols), p = prog(t, at + (c * 0.5 + r) * 0.035, 0.35), tone = tones[Math.floor(rnd(i) * tones.length)], dark = tone[1] < '8';
          return <div key={i} style={{ position: 'absolute', left: c * (cw + g), top: r * (chh + g), width: cw, height: chh, background: tone, borderRadius: 6, opacity: p, transform: `scale(${mix(0.4, 1, p)})`, overflow: 'hidden', boxShadow: '0 6px 14px rgba(0,0,0,.4)' }}>{cards?.[i % (cards.length || 1)] ?? <><div style={{ position: 'absolute', left: 10, top: 12, width: 30 + rnd(i + 1) * 50, height: 8, background: dark ? '#fff' : '#14171D', opacity: 0.8, borderRadius: 2 }} /><div style={{ position: 'absolute', left: 10, top: 28, width: 20 + rnd(i + 2) * 40, height: 5, background: dark ? '#8A93A6' : '#6B7280', borderRadius: 2 }} /><div style={{ position: 'absolute', right: 10, bottom: 10, width: 18, height: 18, borderRadius: 9, background: [ORANGE, C.accent, C.warm, '#3DD6C6'][i % 4] }} /></>}</div>; })}
      </div>
    </div>
  );
};
/** 剪辑时间线：像剪辑软件一样的多轨时间线，片段一块块落上去，播放头走过，镜头推近其中一个片段。讲「一句话生成一串片段」「成片是这么拼出来的」。 */
export const EditTimeline: React.FC<{ clips: { track: number; start: number; len: number; label: string; color?: string }[]; at: number; zoomAt?: number; focus?: number; width?: number }> = ({ clips, at, zoomAt, focus = 0, width = 1600 }) => {
  const t = useT(), a = prog(t, at, 0.5), lw = 150, tw = width - lw, tracks = Math.max(...clips.map((c) => c.track)) + 1, rh = 64, H = 60 + tracks * rh + 110, k = zoomAt === undefined ? 0 : inOut((t - zoomAt) / 0.9), fc = clips[focus], ox = lw + (fc.start + fc.len / 2) * tw, oy = 60 + fc.track * rh + rh / 2, ph = cl((t - at - 0.6) / 4) * 0.9;
  const cols = [ORANGE, '#C98A4A', '#3DB8C6', '#7A6BE0'];
  return (
    <div style={{ width, height: H, overflow: 'hidden', borderRadius: 18, border: `2px solid ${C.line}`, opacity: a, fontFamily: FONT }}>
      <div style={{ position: 'relative', width, height: H, background: '#1A1C22', transform: `scale(${mix(1, 3.4, k)})`, transformOrigin: `${ox}px ${oy}px` }}>
        <div style={{ position: 'absolute', left: lw, top: 0, width: tw, height: 44, backgroundImage: `repeating-linear-gradient(90deg, ${C.muted} 0 2px, transparent 2px ${tw / 32}px)`, backgroundSize: '100% 12px', backgroundRepeat: 'no-repeat', backgroundPosition: '0 30px', opacity: 0.5 }} />
        <div style={{ position: 'absolute', left: 20, top: 8, fontFamily: MONO, fontSize: 24, color: C.text }}>01:00:21:26</div>
        {Array.from({ length: tracks }).map((_, i) => <div key={i} style={{ position: 'absolute', left: 0, top: 60 + i * rh, width, height: rh - 6, background: 'rgba(255,255,255,.03)' }}><span style={{ position: 'absolute', left: 20, top: 14, fontFamily: MONO, fontSize: 22, color: C.muted }}>V{tracks - i}</span></div>)}
        {clips.map((c, i) => { const p = prog(t, at + 0.3 + i * 0.16, 0.35); return <div key={i} style={{ position: 'absolute', left: lw + c.start * tw, top: 60 + c.track * rh + 4, width: c.len * tw - 6, height: rh - 14, background: c.color ?? cols[c.track % cols.length], borderRadius: 6, opacity: p, transform: `translateY(${mix(-30, 0, p)}px)`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', boxSizing: 'border-box', overflow: 'hidden' }}><span style={{ width: 16, height: 16, background: '#fff', borderRadius: 3, flex: 'none' }} /><span style={{ fontSize: 22, fontWeight: 900, color: '#fff', whiteSpace: 'nowrap' }}>{c.label}</span></div>; })}
        <div style={{ position: 'absolute', left: 0, top: 60 + tracks * rh + 6, width, height: 92, background: 'rgba(40,200,120,.12)' }}><span style={{ position: 'absolute', left: 20, top: 30, fontFamily: MONO, fontSize: 22, color: C.muted }}>A1</span>
          <div style={{ position: 'absolute', left: lw, top: 6, width: tw, height: 80, display: 'flex', alignItems: 'center', gap: 2 }}>{Array.from({ length: 220 }).map((_, i) => <div key={i} style={{ flex: 1, height: `${8 + (0.5 + 0.5 * Math.sin(i * 0.21)) * rnd(i) * 88}%`, background: '#33D17A', opacity: i / 220 <= ph ? 1 : 0.5 }} />)}</div></div>
        <div style={{ position: 'absolute', left: lw + ph * tw - 1.5, top: 0, width: 3, height: H, background: '#FF4747' }} />
      </div>
    </div>
  );
};
/** 标志揭示：标志先放大出现在正中，再缩到左边，名字从它后面滑出来。片头片尾亮出账号或品牌。 */
export const BrandReveal: React.FC<{ mark: React.ReactNode; name: string; sub?: string; at: number; light?: boolean; size?: number }> = ({ mark, name, sub, at, light, size = 120 }) => {
  const t = useT(), p = prog(t, at, 0.5), k = inOut((t - at - 0.9) / 0.7), ink = light ? '#14171D' : C.text;
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: FONT, opacity: p }}>
      <div style={{ transform: `scale(${mix(0.4, 1, p) * mix(2.4, 1, k)})`, flex: 'none' }}>{mark}</div>
      <div style={{ maxWidth: k * 1200, overflow: 'hidden' }}><div style={{ paddingLeft: size * 0.3, transform: `translateX(${mix(-80, 0, k)}px)`, opacity: k }}><div style={{ fontSize: size, fontWeight: 900, color: ink, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{name}</div>{sub && <div style={{ fontSize: size * 0.28, color: light ? '#6B7280' : C.muted, whiteSpace: 'nowrap', marginTop: 6 }}>{sub}</div>}</div></div>
    </div>
  );
};
/** 浅色收尾卡：浅底大标题（一个词标成强调色），右边一张卡片里打出一段话，最后亮出网址按钮。和全片深色调反着来，结尾一下子「亮」了。 */
export const EndCardLight: React.FC<{ lines: [string, string]; accent: string; desc?: string; prompt: string; url: string; tags?: string[]; at: number; urlAt: number; width?: number; height?: number }> = ({ lines, accent, desc, prompt, url, tags = [], at, urlAt, width = 1700, height = 760 }) => {
  const t = useT(), p = prog(t, at, 0.6), n = Math.floor(cl((t - at - 0.8) / 2.2) * prompt.length), k = inOut((t - urlAt) / 0.7), i2 = lines[1].indexOf(accent);
  return (
    <div style={{ position: 'relative', width, height, borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(ellipse at 60% 40%, #F6F5F1, #E4E3DD)', fontFamily: FONT, color: '#14171D', opacity: p }}>
      <div style={{ position: 'absolute', left: mix(110, width / 2 - 330, k), top: mix(190, 150, k), width: 660, textAlign: k > 0.5 ? 'center' : 'left' }}>
        {lines.map((l, i) => <div key={i} style={{ fontSize: 124, fontWeight: 600, lineHeight: 1.2, whiteSpace: 'nowrap', opacity: prog(t, at + 0.2 + i * 0.2, 0.5), transform: `translateY(${mix(40, 0, prog(t, at + 0.2 + i * 0.2, 0.5))}px)` }}>{i === 1 && i2 >= 0 ? <>{l.slice(0, i2)}<span style={{ color: ORANGE }}>{accent}</span>{l.slice(i2 + accent.length)}</> : l}</div>)}
        <div style={{ opacity: (1 - k) * prog(t, at + 0.7, 0.5) }}>{desc && <div style={{ fontSize: 30, color: '#6B7280', marginTop: 30, lineHeight: 1.6 }}>{desc}</div>}<div style={{ display: 'flex', gap: 26, marginTop: 20 }}>{tags.map((x, i) => <span key={i} style={{ fontSize: 24, color: '#14171D' }}>· {x}</span>)}</div></div>
      </div>
      <div style={{ position: 'absolute', right: 110, top: 170, width: 640, height: 420, background: '#fff', borderRadius: 16, boxShadow: '0 30px 80px rgba(0,0,0,.12)', padding: '34px 38px', boxSizing: 'border-box', opacity: (1 - k) * prog(t, at + 0.5, 0.5), transform: `translateY(${mix(40, 0, prog(t, at + 0.5, 0.5)) - k * 40}px)` }}>
        <div style={{ fontFamily: MONO, fontSize: 18, color: '#9AA1AE', marginBottom: 18 }}>● PROMPT</div><div style={{ fontSize: 32, lineHeight: 1.7 }}>{prompt.slice(0, n)}<span style={{ display: 'inline-block', width: 3, height: 34, background: ORANGE, verticalAlign: 'text-bottom', marginLeft: 3 }} /></div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 520, display: 'flex', justifyContent: 'center', opacity: k, transform: `translateY(${mix(30, 0, k)}px)` }}><div style={{ fontFamily: MONO, fontSize: 44, padding: '18px 50px', border: `3px solid ${ORANGE}`, borderRadius: 14, background: '#fff', boxShadow: `0 0 0 10px ${ORANGE}22` }}>{url} <span style={{ color: ORANGE }}>↗</span></div></div>
    </div>
  );
};
/** 像素溶解：前一个画面碎成一格格像素，后一个画面从像素里拼出来。配像素风、游戏、数码类话题的转场。 */
export const PixelDissolve: React.FC<{ from: React.ReactNode; to: React.ReactNode; at: number; dur?: number; cols?: number; width?: number; height?: number }> = ({ from, to, at, dur = 0.9, cols = 32, width = 1920, height = 1080 }) => {
  const t = useT(), p = cl((t - at) / dur), cs = width / cols, rows = Math.ceil(height / cs); let rects = '';
  if (p > 0 && p < 1) for (let i = 0; i < cols * rows; i++) if (rnd(i) * 0.8 + ((i % cols) / cols) * 0.2 < p) rects += `<rect x='${(i % cols) * cs}' y='${Math.floor(i / cols) * cs}' width='${cs + 0.5}' height='${cs + 0.5}'/>`;
  const mask = p >= 1 ? undefined : `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}'>${rects}</svg>`)}")`;
  return <div style={{ position: 'relative', width, height, overflow: 'hidden' }}><div style={{ position: 'absolute', inset: 0 }}>{from}</div>{p > 0 && <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: mask, maskImage: mask, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }}>{to}</div>}</div>;
};
/** 数字雨显影：画面先是一层绿色的数字雨和高反差轮廓，一条亮线扫过去，扫过的地方变回真实画面。讲「从代码到现实」「把抽象的东西落地」。 */
export const MatrixReveal: React.FC<{ children: React.ReactNode; at: number; revealAt: number; dur?: number; width?: number; height?: number }> = ({ children, at, revealAt, dur = 1.2, width = 1920, height = 1080 }) => {
  const t = useT(), p = inOut((t - revealAt) / dur), a = prog(t, at, 0.5), cw = 30, n = Math.ceil(width / cw), step = Math.floor(t * 9), glyph = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿ0123456789';
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: '#020705', opacity: a }}>
      <div style={{ position: 'absolute', inset: 0, filter: 'grayscale(1) contrast(2.6) brightness(.75)', opacity: 0.85 }}>{children}</div><div style={{ position: 'absolute', inset: 0, background: '#00FF88', mixBlendMode: 'multiply' }} />
      {Array.from({ length: n }).map((_, i) => { const sp = 160 + rnd(i) * 260, y = ((t * sp + rnd(i + 40) * height * 2) % (height * 1.6)) - height * 0.6;
        return <div key={i} style={{ position: 'absolute', left: i * cw, top: y, width: cw, fontFamily: MONO, fontSize: 24, lineHeight: '28px', color: '#5CFFA8', textAlign: 'center', opacity: 0.25 + rnd(i + 7) * 0.6, WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 85%)', maskImage: 'linear-gradient(180deg, transparent, #000 85%)' }}>{Array.from({ length: 14 }).map((__, j) => <div key={j} style={{ color: j === 13 ? '#E8FFF2' : undefined }}>{glyph[Math.floor(rnd(i * 31 + j + (j > 9 ? step : 0)) * glyph.length)]}</div>)}</div>; })}
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>{children}</div>
      {p > 0 && p < 1 && <div style={{ position: 'absolute', left: p * width - 4, top: 0, width: 8, height, background: '#C8FFE0', boxShadow: '0 0 50px 14px rgba(90,255,170,.8)' }} />}
    </div>
  );
};
/** 扫光：一道斜着的高光从内容上划过。给标志、标题、卡片加一下「亮相」。 */
export const LightSweep: React.FC<{ children: React.ReactNode; at: number; dur?: number; repeat?: number }> = ({ children, at, dur = 0.8, repeat }) => {
  const t = useT(), e = repeat ? ((t - at) % repeat) : t - at, p = t < at ? 0 : cl(e / dur);
  return <div style={{ position: 'relative', display: 'inline-block', overflow: 'hidden' }}>{children}<div style={{ position: 'absolute', top: '-20%', bottom: '-20%', left: `${mix(-45, 120, p)}%`, width: '28%', transform: 'skewX(-22deg)', background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.75), transparent)', mixBlendMode: 'screen', opacity: p > 0 && p < 1 ? 1 : 0 }} /></div>;
};
/** 录像带画面：给画面加扫描线、一条往下走的错位带、暂停或播放标记和走动的时间。讲「等一下，倒回去看看」「暂停一下」。 */
export const VhsOverlay: React.FC<{ children: React.ReactNode; label?: string; at: number; width?: number; height?: number }> = ({ children, label = 'PAUSE', at, width = 1920, height = 1080 }) => {
  const t = useT(), id = useUid(), k = prog(t, at, 0.3), by = ((t * 0.35) % 1.2 - 0.1) * height, bh = height * 0.07, jit = (rnd(Math.floor(t * 20)) - 0.5) * 30, e = Math.max(0, t - at), tc = `0:${String(Math.floor(e / 60)).padStart(2, '0')}:${String(Math.floor(e % 60)).padStart(2, '0')}`;
  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', background: '#000' }}>
      <div style={{ position: 'absolute', inset: 0, filter: `saturate(${mix(1, 0.75, k)}) contrast(${mix(1, 1.12, k)})` }}>{children}</div>
      <div style={{ position: 'absolute', left: 0, top: by, width, height: bh, overflow: 'hidden', opacity: k }}><div style={{ position: 'absolute', left: 22 + jit, top: -by, width, height, filter: 'brightness(1.35) hue-rotate(20deg)' }}>{children}</div><div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, rgba(255,255,255,.25) 0 2px, transparent 2px 6px)' }} /></div>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0, opacity: 0.12 * k, mixBlendMode: 'screen' }}><filter id={id}><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={1} seed={Math.floor(t * 30)} /><feColorMatrix type="saturate" values="0" /></filter><rect width={width} height={height} filter={`url(#${id})`} /></svg>
      <div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(180deg, rgba(0,0,0,.22) 0 2px, transparent 2px 5px)', opacity: k }} /><div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(0,0,0,.6))', opacity: k }} />
      <div style={{ position: 'absolute', left: width * 0.035, top: height * 0.05, fontFamily: MONO, fontSize: height * 0.045, color: '#fff', letterSpacing: 4, opacity: k * (Math.floor(t * 2) % 2 ? 0.35 : 1), textShadow: '3px 0 0 rgba(255,0,60,.6), -3px 0 0 rgba(0,220,255,.6)' }}>{label === 'PAUSE' ? '▌▌ ' : label === 'STOP' ? '■ ' : '▶ '}{label}</div>
      <div style={{ position: 'absolute', right: width * 0.035, bottom: height * 0.05, fontFamily: MONO, fontSize: height * 0.04, color: '#fff', opacity: k, textShadow: '3px 0 0 rgba(255,0,60,.6), -3px 0 0 rgba(0,220,255,.6)' }}>SP {tc}</div>
    </div>
  );
};
/** 空间运镜：把任意内容（窗口、截图、卡片）当成一块板，在三维里倾斜、推近、转正，按几个关键姿态依次过渡。展示软件界面时最出效果。 */
export const Tilt3D: React.FC<{ children: React.ReactNode; keys: { at: number; rx?: number; ry?: number; rz?: number; s?: number; x?: number; y?: number; dur?: number }[]; width?: number; height?: number; perspective?: number }> = ({ children, keys, width = 1920, height = 1080, perspective = 1400 }) => {
  const t = useT(), st = { rx: 0, ry: 0, rz: 0, s: 1, x: 0, y: 0, ...keys[0] };
  keys.slice(1).forEach((k) => { const p = inOut((t - k.at) / (k.dur ?? 1)); (['rx', 'ry', 'rz', 's', 'x', 'y'] as const).forEach((f) => { if (k[f] !== undefined) st[f] = mix(st[f], k[f]!, p); }); });
  return <div style={{ width, height, perspective, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: prog(t, keys[0].at, 0.5) }}><div style={{ transform: `translate(${st.x}px, ${st.y}px) rotateX(${st.rx}deg) rotateY(${st.ry}deg) rotateZ(${st.rz}deg) scale(${st.s})`, boxShadow: '0 60px 140px rgba(0,0,0,.6)', borderRadius: 16 }}>{children}</div></div>;
};
