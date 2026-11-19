// 第十三期封面（纸面风）：抖音 1080×1440、视频号 1080×1260，同一套设计按高度自适应。数字是看板里视频号那一行的真实数据。
import React from 'react';
import { AbsoluteFill, useVideoConfig } from 'remotion';
import { useFonts } from '../../kit/kit';
import { PP as P, PFONT } from '../../components/paper';

export const Cover13B: React.FC = () => {
  useFonts();
  const { height: H } = useVideoConfig(), k = H / 1440;
  const st: [string, string, boolean][] = [['流量', '1,963', false], ['留存', '11.51%', false], ['互动', '2.75%', false], ['关系', '0.46%', true]];
  return (
    <AbsoluteFill style={{ background: P.paper, fontFamily: PFONT, color: P.ink }}>
      <AbsoluteFill style={{ opacity: 0.5, backgroundImage: 'radial-gradient(rgba(21,19,15,.09) 1px, transparent 1.2px)', backgroundSize: '9px 9px' }} />
      <div style={{ position: 'absolute', left: 60, top: 60 * k, background: P.ink, color: P.paper, fontSize: 46 * k, fontWeight: 900, padding: `${8 * k}px ${26 * k}px`, borderRadius: 14, transform: 'rotate(-3deg)' }}>一个人做 IP</div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 190 * k }}>
        <div style={{ fontSize: 100 * k, fontWeight: 900, color: P.mute, lineHeight: 1.1 }}>最累的不是拍</div>
        <div style={{ fontSize: 236 * k, fontWeight: 900, letterSpacing: -8 * k, lineHeight: 1.08, color: P.hot, whiteSpace: 'nowrap' }}>是拍完</div>
        <div style={{ fontSize: 236 * k, fontWeight: 900, letterSpacing: -8 * k, lineHeight: 1.08, whiteSpace: 'nowrap' }}>以后<span style={{ display: 'inline-block', width: 250 * k, height: 26 * k, borderRadius: 13, background: P.ink, marginLeft: 26 * k, verticalAlign: 'middle' }} /></div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: 150 * k, display: 'flex', gap: 14 * k, alignItems: 'flex-end' }}>
        {st.map(([n, v, weak]) => (
          <div key={n} style={{ flex: weak ? 1.25 : 1, background: weak ? P.hot : P.card, color: weak ? '#fff' : P.ink, border: `3px solid ${weak ? P.hot : P.line}`, borderRadius: 24, padding: `${(weak ? 26 : 16) * k}px 0`, textAlign: 'center', boxShadow: weak ? '0 30px 60px rgba(255,74,28,.35)' : '0 10px 30px rgba(21,19,15,.08)' }}>
            <div style={{ fontSize: 40 * k, fontWeight: 900 }}>{n}</div>
            <div style={{ fontSize: (weak ? 78 : 56) * k, fontWeight: 900, letterSpacing: -2, lineHeight: 1.15 }}>{v}</div>
            <div style={{ fontSize: 30 * k, fontWeight: 900, color: weak ? '#fff' : P.ok }}>{weak ? '这周只改这里' : '过关'}</div>
          </div>))}
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: 54 * k, display: 'flex', alignItems: 'center', gap: 16, fontSize: 36 * k, fontWeight: 900 }}>
        <span style={{ width: 24 * k, height: 24 * k, borderRadius: 12 * k, background: P.hot }} />宁少 AI 进化论<span style={{ color: P.mute, fontWeight: 600 }}>分享 AI 时代的内容创作认知</span>
      </div>
    </AbsoluteFill>
  );
};
