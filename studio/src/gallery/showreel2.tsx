// 组件快切片（竖屏三行）：每行每 0.5 秒硬切一个组件，三行错开；每个组件从它演示的第 1.3 秒切入，直接看到成形的画面。
// 给口播开场的「钩子」用：信息密度高、颜色跳得快。无声。
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { ClockCtx } from '../kit/clock';
import { C, FONT, useFonts } from '../kit/kit';
import { CATALOG } from './all';
import { galleryClock } from './index';

export const SR2_FPS = 30, SR2_SLOT = 0.5, PRE = 1.3;
const ROWS = [
  ['B07', 'E11', 'B10', 'D05', 'B18', 'E17', 'B12', 'X14', 'B36', 'E09', 'B46', 'D01', 'B44', 'E22', 'B09', 'D04'],
  ['B21', 'E03', 'B06', 'E18', 'B23', 'D07', 'B29', 'E07', 'B32', 'E25', 'B41', 'D06', 'B43', 'X08', 'B47', 'E13'],
  ['B26', 'E08', 'B13', 'E05', 'B45', 'E16', 'B50', 'D11', 'B33', 'E10', 'B25', 'E02', 'B48', 'E15', 'B19', 'D14'],
];
export const SR2_TOTAL = Math.round(ROWS[0].length * SR2_SLOT * SR2_FPS);
const K = 1080 / 1920, RH = 608, S = Math.round(SR2_SLOT * SR2_FPS);
const Cell: React.FC<{ id: string }> = ({ id }) => {
  const it = CATALOG.find((c) => c.id === id); if (!it) throw new Error('目录里没有 ' + id);
  return (
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 1080, transform: `scale(${K})`, transformOrigin: 'left top' }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', padding: '60px 90px', boxSizing: 'border-box' }}>{it.demo(0.1)}</AbsoluteFill>
      <div style={{ position: 'absolute', left: 50, bottom: 34, fontSize: 38, fontWeight: 900, color: C.text, background: 'rgba(8,11,17,.72)', borderRadius: 10, padding: '4px 18px' }}><span style={{ color: '#A6F51B', marginRight: 14 }}>{it.id}</span>{it.name}</div>
    </div>
  );
};
export const Showreel2: React.FC = () => {
  useFonts();
  return (
    <ClockCtx.Provider value={galleryClock}>
      <AbsoluteFill style={{ background: '#07090D', fontFamily: FONT, color: C.text }}>
        {ROWS.map((row, r) => (
          <div key={r} style={{ position: 'absolute', left: 0, top: r * RH, width: 1080, height: RH, overflow: 'hidden', background: `radial-gradient(900px 500px at 50% 45%, #141B29 0%, ${C.bg} 75%)` }}>
            {row.map((id, k) => { const from = k * S + Math.round(r * S / 3) - (r ? S : 0);       // 第 2、3 行各错开三分之一拍
              return <Sequence key={id + k} from={from} durationInFrames={S} layout="none"><Sequence from={-Math.round(PRE * SR2_FPS)} layout="none"><Cell id={id} /></Sequence></Sequence>; })}
            {r > 0 && <Sequence from={ROWS[0].length * S - S + Math.round(r * S / 3)} layout="none"><Sequence from={-Math.round(PRE * SR2_FPS)} layout="none"><Cell id={row[0]} /></Sequence></Sequence>}
          </div>
        ))}
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
