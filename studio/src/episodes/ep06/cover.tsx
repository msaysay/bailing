// 06 黄仁勋回归 · 封面。同一套设计按尺寸自适应：抖音 1080×1440，视频号 1080×1260。数字只用核对过的（见事实核对.md）。
import React from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import { FONT, useFonts } from '../../kit/kit';
const INK = '#0B0D11', PAPER = '#F2EFE8', NV = '#76B900';
export const Cover06: React.FC = () => {
  useFonts(); const { height: H } = useVideoConfig(), img = H * 0.62;
  return <AbsoluteFill style={{ background: INK, fontFamily: FONT }}>
    <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: img, overflow: 'hidden' }}>
      <Img src={staticFile('ep06/cover.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '42% 20%', transform: 'scale(1.25)', transformOrigin: '40% 25%' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(11,13,17,.15) 40%, rgba(11,13,17,1) 100%)' }} />
    </div>
    <div style={{ position: 'absolute', left: 64, top: 64, background: NV, color: INK, fontWeight: 900, fontSize: 40, padding: '8px 22px' }}>复职当天</div>
    <div style={{ position: 'absolute', left: 64, right: 64, top: img - 150 }}>
      <div style={{ fontWeight: 900, fontSize: 150, lineHeight: 1.08, color: PAPER }}>11 天被请回</div>
      <div style={{ fontWeight: 900, fontSize: 150, lineHeight: 1.08, color: NV }}>谁说了算？</div>
      <div style={{ display: 'flex', gap: 22, marginTop: 40 }}>
        {[['全票', '董事会'], ['+33%', '开盘涨幅'], ['7 周', '连跌之后']].map(([a, b]) => <div key={a} style={{ border: '2px solid rgba(242,239,232,.3)', padding: '12px 26px' }}><div style={{ fontWeight: 900, fontSize: 52, color: PAPER }}>{a}</div><div style={{ fontSize: 26, color: 'rgba(242,239,232,.6)' }}>{b}</div></div>)}
      </div>
    </div>
    <div style={{ position: 'absolute', left: 64, bottom: 60, display: 'flex', alignItems: 'center', gap: 16 }}><div style={{ width: 14, height: 14, background: NV }} /><span style={{ fontSize: 32, fontWeight: 600, color: PAPER }}>宁少 AI 进化论</span></div>
  </AbsoluteFill>;
};
