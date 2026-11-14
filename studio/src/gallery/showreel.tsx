// 组件炫技片（竖屏）：三行同时各放一个组件演示，每 2.2 秒换一个，三行错开换。给「开源组件库」那条视频的开场用，无声。
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { ClockCtx } from '../kit/clock';
import { C, FONT, useFonts, useT } from '../kit/kit';
import { CATALOG } from './all';
import { galleryClock } from './index';

export const SR_FPS = 30, SR_SLOT = 2.2;
const ROWS = [
  ['E11', 'D05', 'E17', 'X14', 'E09', 'D01', 'E22'],
  ['E03', 'E18', 'D04', 'E07', 'E25', 'D06', 'X08'],
  ['D07', 'E08', 'E05', 'E16', 'D11', 'E10', 'E02'],
];
export const SR_TOTAL = Math.ceil((ROWS[0].length * SR_SLOT + 1.5) * SR_FPS);
const K = 1080 / 1920, RH = 608;
const Cell: React.FC<{ id: string }> = ({ id }) => {
  const it = CATALOG.find((c) => c.id === id); if (!it) throw new Error('目录里没有 ' + id);
  const t = useT();
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${K})`, transformOrigin: 'left top', opacity: Math.min(1, t / 0.12) }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: '90px 120px 110px', boxSizing: 'border-box' }}>{it.demo(0.1)}</AbsoluteFill>
      <div style={{ position: 'absolute', left: 60, bottom: 40, fontSize: 40, fontWeight: 900, color: C.text, background: 'rgba(8,11,17,.7)', borderRadius: 12, padding: '6px 20px' }}><span style={{ color: C.accent, marginRight: 16 }}>{it.id}</span>{it.name}</div>
    </div>
  );
};
export const Showreel: React.FC = () => {
  useFonts();
  const t = useT(), n = Math.min(181, Math.round(181 * Math.min(1, t / 6)));
  return (
    <ClockCtx.Provider value={galleryClock}>
      <AbsoluteFill style={{ background: '#07090D', fontFamily: FONT, color: C.text }}>
        {ROWS.map((row, r) => (
          <div key={r} style={{ position: 'absolute', left: 0, top: r * RH, width: 1080, height: RH, overflow: 'hidden', background: `radial-gradient(900px 500px at 50% 45%, #141B29 0%, ${C.bg} 75%)`, borderBottom: `2px solid ${C.line}` }}>
            {row.map((id, k) => { const from = Math.round((k * SR_SLOT + r * 0.5) * SR_FPS);
              return <Sequence key={id} from={from} durationInFrames={Math.round(SR_SLOT * SR_FPS) + (k === row.length - 1 ? 90 : 0)} layout="none"><Cell id={id} /></Sequence>; })}
          </div>
        ))}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 3 * RH, height: 1920 - 3 * RH, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, fontSize: 44, fontWeight: 900 }}>
          <span style={{ color: C.warm, fontSize: 64 }}>{n}</span><span>个画面组件</span><span style={{ color: C.muted, fontWeight: 600, fontSize: 34 }}>全部开源</span>
        </div>
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
