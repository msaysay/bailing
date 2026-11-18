// 第十一期封面（竖屏播报风）：抖音 1080×1440、视频号 1080×1260、竖屏全幅 1080×1920，按高度自适应。
// 上半部是成片里黄仁勋的一帧（彭博社画面），脸在上面；标题从下巴以下开始，不压脸。
import React from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import { useFonts } from '../../kit/kit';
import { BL as B, BFONT } from '../../components/bulletin';

export const Cover11: React.FC = () => {
  useFonts();
  const { height: H } = useVideoConfig(), full = H > 1500, k = Math.min(1, H / 1440);
  const imgH = full ? 900 : H * 0.6, textTop = full ? 860 : H * 0.5;
  return (
    <AbsoluteFill style={{ background: B.bg, fontFamily: BFONT, color: B.text }}>
      <Img src={staticFile('ep11/cover/huang.png')} style={{ position: 'absolute', left: 0, top: full ? 230 : 0, width: '100%', height: imgH, objectFit: 'cover', objectPosition: '50% 18%' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: (full ? 230 : 0) + imgH * 0.45, height: imgH * 0.56, background: `linear-gradient(180deg, rgba(9,9,12,0), ${B.bg} 85%)` }} />
      {full && <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 260, background: `linear-gradient(180deg, ${B.bg} 70%, rgba(9,9,12,0))`, transform: 'translateY(0)' }} />}
      <div style={{ position: 'absolute', left: 60, top: (full ? 290 : 60) * (full ? 1 : k) }}>
        <span style={{ background: B.red, color: '#fff', fontSize: 40 * k, fontWeight: 900, padding: `${8 * k}px ${22 * k}px`, borderRadius: 8 }}>宁少 · AI 快报</span>
        <span style={{ fontSize: 36 * k, fontWeight: 900, marginLeft: 16, textShadow: '0 2px 10px #000' }}>11.17</span>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: textTop }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 * k }}>
          <span style={{ fontSize: 84 * k, fontWeight: 900, color: B.mute }}>黄仁勋</span>
          <span style={{ fontSize: 170 * k, fontWeight: 900, letterSpacing: -6 * k, lineHeight: 1.05 }}>想回来</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 20 * k, marginTop: 6 * k }}>
          <span style={{ fontSize: 84 * k, fontWeight: 900, color: B.mute }}>董事长</span>
          <span style={{ fontSize: 190 * k, fontWeight: 900, color: B.red, letterSpacing: -6 * k, lineHeight: 1.05, textShadow: `0 0 60px ${B.red}88` }}>不会</span>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: (full ? 330 : 80) * (full ? 1 : k), display: 'flex', gap: 16 }}>
        {[['1158 亿', '一个季度'], ['×28', '是 2013 年全年'], ['？', '谁当 CEO']].map(([a, b], i) => (
          <div key={b} style={{ flex: 1, background: B.panel, borderTop: `8px solid ${i === 2 ? B.red : B.gold}`, borderRadius: 18, padding: `${16 * k}px 0`, textAlign: 'center' }}>
            <div style={{ fontSize: 66 * k, fontWeight: 900, color: i === 2 ? B.red : B.gold, whiteSpace: 'nowrap' }}>{a}</div>
            <div style={{ fontSize: 30 * k, fontWeight: 900, color: B.mute }}>{b}</div>
          </div>))}
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: (full ? 280 : 34) * (full ? 1 : k), fontSize: 24 * k, color: B.mute, fontWeight: 600 }}>本视频由 AI 生成 · 画面：彭博社 · 不构成投资建议</div>
    </AbsoluteFill>
  );
};
