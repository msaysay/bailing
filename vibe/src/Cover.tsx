// 封面：横版 1920×1080（视频号/B站），竖版 1080×1440（抖音 3:4）。只放期号、片名、一句钩子。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { C, a, SERIF, SANS, rnd, parseHot } from './kit';
import type { Episode } from './types';

export const Cover: React.FC<{ ep: Episode; v: boolean }> = ({ ep, v }) => {
  const hook = ep.beats.find((b) => b.big)?.zh ?? '';
  const Wd = v ? 1080 : 1920, Ht = v ? 1440 : 1080;
  return (
    <AbsoluteFill style={{ background: C.bg, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 60% at 50% 45%, ${a('#1B2233', 0.95)} 0%, ${C.bg} 70%)` }} />
      <svg width={Wd} height={Ht} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: 60 }, (_, i) => <circle key={i} cx={rnd(i, 2) * Wd} cy={rnd(i, 4) * Ht} r={0.8 + rnd(i, 6) * 2} fill={rnd(i, 7) > 0.85 ? C.hot : C.ink} opacity={0.1 + 0.25 * rnd(i, 8)} />)}
      </svg>
      <div style={{ position: 'absolute', top: v ? 80 : 60, left: 0, right: 0, textAlign: 'center', fontFamily: SANS, fontSize: v ? 30 : 28, letterSpacing: 10, color: a(C.hot, 0.95) }}>AI内容创作知识大赏 · {ep.group}</div>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ fontFamily: SERIF, fontSize: v ? 60 : 56, color: a(C.ink, 0.35), letterSpacing: 8 }}>No.{String(ep.no).padStart(2, '0')}</div>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: v ? (ep.title.length > 6 ? 118 : 150) : (ep.title.length > 8 ? 130 : 160), color: C.ink, letterSpacing: 6, marginTop: 20, textAlign: 'center', lineHeight: 1.2, maxWidth: v ? 980 : 1700, textShadow: `0 0 60px ${a(C.hot, 0.25)}` }}>{ep.title}</div>
      <div style={{ width: 120, height: 4, background: C.hot, margin: v ? '56px 0' : '44px 0' }} />
      <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: v ? 52 : 52, color: a(C.ink, 0.9), textAlign: 'center', maxWidth: v ? 900 : 1400, lineHeight: 1.45 }}>
        {parseHot(hook).map((x, i) => <span key={i} style={{ color: x.hot ? C.hot : undefined }}>{x.t}</span>)}
      </div>
      </div>
      <div style={{ position: 'absolute', bottom: v ? 80 : 56, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontSize: 30, fontWeight: 700, color: a(C.ink, 0.8), letterSpacing: 3 }}>
        <span style={{ width: 14, height: 14, borderRadius: 7, background: C.hot }} />宁少AI进化论
      </div>
    </AbsoluteFill>
  );
};
