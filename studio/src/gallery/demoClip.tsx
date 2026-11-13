// 演示素材：用代码生成的抽象「示例视频」和「示例图片」，给需要媒体的组件做演示。不使用任何外部素材。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, getInputProps } from 'remotion';
import { FONT } from '../kit/kit';
export const DemoClip: React.FC = () => {
  const f = useCurrentFrame(), { width: W, height: H, fps } = useVideoConfig(), t = f / fps;
  const { hue = 215, label = '示例视频' } = getInputProps() as { hue?: number; label?: string };
  return (
    <AbsoluteFill style={{ background: `linear-gradient(${120 + t * 6}deg, hsl(${hue},70%,22%), hsl(${hue + 40},65%,38%))`, fontFamily: FONT, overflow: 'hidden' }}>
      {Array.from({ length: 7 }, (_, i) => { const r = 120 + i * 60, a = t * (0.25 + i * 0.07) + i;
        return <div key={i} style={{ position: 'absolute', left: W / 2 + Math.cos(a) * W * 0.32 - r / 2, top: H / 2 + Math.sin(a * 1.3) * H * 0.28 - r / 2, width: r, height: r, borderRadius: i % 2 ? r / 2 : 24, background: `hsla(${hue + i * 18},80%,${60 + i * 3}%,.28)`, transform: `rotate(${a * 40}deg)` }} />; })}
      {Array.from({ length: 9 }, (_, i) => <div key={i} style={{ position: 'absolute', left: W * 0.08 + i * W * 0.1, bottom: H * 0.12, width: W * 0.06, height: H * (0.12 + 0.22 * Math.abs(Math.sin(t * 0.9 + i * 0.7))), background: `hsla(${hue + 60},90%,78%,.55)`, borderRadius: 10 }} />)}
      <div style={{ position: 'absolute', left: W * 0.07, top: H * 0.08, fontSize: Math.min(W, H) * 0.11, fontWeight: 900, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.4)' }}>{label}</div>
      <div style={{ position: 'absolute', left: W * 0.07, top: H * 0.08 + Math.min(W, H) * 0.15, fontSize: Math.min(W, H) * 0.04, color: 'rgba(255,255,255,.8)' }}>代码生成的演示素材 · {t.toFixed(1)}s</div>
    </AbsoluteFill>
  );
};
