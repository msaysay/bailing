// 封面：同一套设计按尺寸自适应。抖音 1080×1440（3:4，个人主页网格比例），视频号 1080×1260（6:7，信息流比例）。
// 关键内容都放在中间 3:4 安全区内，四周各留 60px，避开平台叠加的标题和按钮。
import React from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import { C, FONT, useFonts } from '../../kit/kit';

const stroke = (px: number): React.CSSProperties => ({ WebkitTextStroke: `${px}px #05070B`, paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,.65)' });
export const Cover3: React.FC = () => {
  useFonts();
  const { width: W, height: H } = useVideoConfig(), k = H / 1440;           // 以抖音版为基准缩放
  const chips: [string, string][] = [['181', '个画面组件'], ['12', '个步骤说明'], ['¥0', '不收费']];
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.text }}>
      <Img src={staticFile('talk03/cover/face.png')} style={{ position: 'absolute', left: -W * 0.075, top: -350 * k, width: W * 1.15, maxWidth: 'none', filter: 'contrast(1.08) saturate(0.95)' }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(8,11,17,.35) 0%, rgba(8,11,17,0) 22%, rgba(8,11,17,0) 36%, rgba(8,11,17,.9) 52%, ${C.bg} 58%)` }} />
      <AbsoluteFill style={{ boxShadow: 'inset 0 0 220px 40px rgba(0,0,0,.55)' }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 70, background: 'linear-gradient(180deg, #080B11 35%, rgba(8,11,17,0))' }} />
      {/* 左上角：事件标签 */}
      <div style={{ position: 'absolute', left: 60, top: 60 * k + 10, display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ background: C.down, color: '#fff', fontSize: 50 * k, fontWeight: 900, padding: `${10 * k}px ${26 * k}px`, borderRadius: 12, transform: 'rotate(-3deg)', boxShadow: '0 10px 24px rgba(0,0,0,.5)' }}>免费开源</div>
      </div>
      {/* 主标题 */}
      <div style={{ position: 'absolute', left: 60, right: 60, top: H * 0.5, textAlign: 'left' }}>
        <div style={{ fontSize: 190 * k, fontWeight: 900, lineHeight: 1.02, letterSpacing: -4, ...stroke(10 * k) }}>181 个组件</div>
        <div style={{ fontSize: 112 * k, fontWeight: 900, lineHeight: 1.12, color: C.warm, letterSpacing: -2, whiteSpace: 'nowrap', ...stroke(8 * k) }}>让 AI 替你剪口播</div>
      </div>
      {/* 三个数字 */}
      <div style={{ position: 'absolute', left: 60, right: 60, top: H * 0.5 + 420 * k, display: 'flex', gap: 18 * k }}>
        {chips.map(([n, t]) => (
          <div key={t} style={{ flex: 1, background: 'rgba(21,26,36,.92)', border: `2px solid ${C.line}`, borderRadius: 18, padding: `${16 * k}px ${10 * k}px`, textAlign: 'center' }}>
            <div style={{ fontSize: 76 * k, fontWeight: 900, lineHeight: 1.05, color: n === '¥0' ? C.down : C.text, whiteSpace: 'nowrap' }}>{n}</div>
            <div style={{ fontSize: 30 * k, fontWeight: 600, color: C.muted, whiteSpace: 'nowrap' }}>{t}</div>
          </div>
        ))}
      </div>
      {/* 底部：账号 */}
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: 54 * k, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 64 * k, height: 64 * k, borderRadius: 32 * k, background: C.accent, color: '#fff', fontSize: 38 * k, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>陈</div>
        <div style={{ fontSize: 36 * k, fontWeight: 600 }}>陈宁<span style={{ color: C.muted, marginLeft: 16 }}>AI 时代的内容创作认知</span></div>
      </div>
    </AbsoluteFill>
  );
};
