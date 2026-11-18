// 第十一期封面（竖屏播报风）：抖音 1080×1440、视频号 1080×1260、竖屏全幅 1080×1920，按高度自适应。不用人物照片。
import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { useFonts } from '../../kit/kit';
import { BL as B, BFONT } from '../../components/bulletin';

export const Cover11: React.FC = () => {
  useFonts();
  const { height: H } = useVideoConfig(), k = Math.min(1, H / 1440), top = H > 1500 ? 300 : 70;
  return (
    <AbsoluteFill style={{ background: B.bg, fontFamily: BFONT, color: B.text }}>
      <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
      <div style={{ position: 'absolute', left: -260, top: top + 200, width: 1100, height: 1100, borderRadius: 550, background: 'radial-gradient(circle, rgba(255,45,60,.28), rgba(255,45,60,0) 65%)' }} />
      <div style={{ position: 'absolute', left: 60, right: 60, top: top * k + 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <span style={{ background: B.red, color: '#fff', fontSize: 40 * k, fontWeight: 900, padding: `${8 * k}px ${22 * k}px`, borderRadius: 8 }}>宁少 · AI 快报</span>
          <span style={{ fontSize: 36 * k, fontWeight: 900 }}>11.17</span>
        </div>
        <div style={{ fontSize: 96 * k, fontWeight: 900, color: B.mute, marginTop: 50 * k, lineHeight: 1.1 }}>黄仁勋</div>
        <div style={{ fontSize: 200 * k, fontWeight: 900, letterSpacing: -8 * k, lineHeight: 1.05 }}>想回来</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 26 * k, marginTop: 14 * k }}>
          <span style={{ fontSize: 96 * k, fontWeight: 900, color: B.mute }}>董事长：</span>
          <span style={{ fontSize: 200 * k, fontWeight: 900, color: B.red, letterSpacing: -6 * k, transform: 'rotate(-4deg)', display: 'inline-block', textShadow: `0 0 60px ${B.red}88` }}>不会</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: (H > 1500 ? 520 : 150) * k, display: 'flex', gap: 16 }}>
        {[['1158 亿', '一个季度'], ['×28', '是 2013 年全年'], ['？', '谁当 CEO']].map(([a, b], i) => (
          <div key={b} style={{ flex: 1, background: B.panel, borderTop: `8px solid ${i === 2 ? B.red : B.gold}`, borderRadius: 18, padding: `${18 * k}px 0`, textAlign: 'center' }}>
            <div style={{ fontSize: 72 * k, fontWeight: 900, color: i === 2 ? B.red : B.gold, whiteSpace: 'nowrap' }}>{a}</div>
            <div style={{ fontSize: 32 * k, fontWeight: 900, color: B.mute }}>{b}</div>
          </div>))}
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: (H > 1500 ? 450 : 70) * k, fontSize: 26 * k, color: B.mute, fontWeight: 600 }}>本视频由 AI 生成 · 不构成投资建议</div>
    </AbsoluteFill>
  );
};
