// 组件演示片：每个组件 5 秒，左上是编号和名称，下方是适用场景。整片渲一次，再按 5 秒切成单个演示。
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../kit/clock';
import { Bg, C, FONT, useFonts, useT } from '../kit/kit';
import { CATALOG, KLINE, SLOT } from './catalog';

export const GFPS = 30;
// 给强调字幕造一份演示用的时间表：那句话在它自己的 5 秒里逐字念出
const kIdx = CATALOG.findIndex((c) => c.export === 'KineticLine'), k0 = kIdx * SLOT + 0.8;
const timing: Timing = { fps: GFPS, total: CATALOG.length * SLOT, segments: [{ id: 1, name: 'demo', start: 0, end: CATALOG.length * SLOT, lines: [1] }],
  lines: [{ n: 1, seg: 1, text: KLINE, start: k0, end: k0 + 3, chars: KLINE.split('').map((c, i) => ({ c, i, t: k0 + i * 0.2 })).filter((x) => x.c !== ' ') }] };
export const galleryClock = makeClock(timing);
export const Gallery: React.FC = () => {
  useFonts();
  const t = useT(), i = Math.min(CATALOG.length - 1, Math.floor(t / SLOT)), it = CATALOG[i];
  return (
    <ClockCtx.Provider value={galleryClock}>
      <AbsoluteFill style={{ fontFamily: FONT, color: C.text }}>
        <Bg />
        {CATALOG.map((c, k) => (
          <Sequence key={c.id} from={k * SLOT * GFPS} durationInFrames={SLOT * GFPS} layout="none">
            <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: '170px 120px 190px', boxSizing: 'border-box' }}>{c.demo(k * SLOT + 0.5)}</AbsoluteFill>
          </Sequence>
        ))}
        <div style={{ position: 'absolute', left: 72, top: 52, display: 'flex', alignItems: 'baseline', gap: 20 }}>
          <span style={{ fontSize: 40, fontWeight: 900, color: C.accent }}>{it.id}</span><span style={{ fontSize: 44, fontWeight: 900 }}>{it.name}</span>
          <span style={{ fontSize: 26, color: C.muted }}>{it.export} · {it.group}</span>
        </div>
        <div style={{ position: 'absolute', left: 72, right: 72, bottom: 54, fontSize: 30, color: C.muted }}><span style={{ color: C.text, fontWeight: 600 }}>适用：</span>{it.use}</div>
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
