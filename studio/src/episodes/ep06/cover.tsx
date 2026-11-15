// 第六、七期共用的封面：主图取自成片的一帧（无人脸），标题不超过 10 个字分两行，最多三个核对过的数字。
// 抖音 1080×1440、视频号 1080×1260，同一套设计按尺寸自适应；四周留 60px。
import React from 'react';
import { AbsoluteFill, Img, staticFile, useVideoConfig } from 'remotion';
import { C, FONT, useFonts } from '../../kit/kit';

const stroke = (px: number): React.CSSProperties => ({ WebkitTextStroke: `${px}px #05070B`, paintOrder: 'stroke fill', textShadow: '0 10px 30px rgba(0,0,0,.65)' });
export type CoverProps = { img: string; tag: string; l1: string; l2: string; chips: [string, string][] };
export const NoFaceCover: React.FC<CoverProps> = ({ img, tag, l1, l2, chips }) => {
  useFonts();
  const { height: H } = useVideoConfig(), k = H / 1440;
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.text }}>
      <Img src={staticFile(img)} style={{ position: 'absolute', left: '50%', top: 0, height: H * 0.56, transform: 'translateX(-50%)' }} />
      <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(8,11,17,.3) 0%, rgba(8,11,17,0) 20%, rgba(8,11,17,0) 34%, rgba(8,11,17,.92) 50%, ${C.bg} 56%)` }} />
      <div style={{ position: 'absolute', left: 60, top: 60 * k + 10 }}>
        <div style={{ background: C.down, color: '#fff', fontSize: 50 * k, fontWeight: 900, padding: `${10 * k}px ${26 * k}px`, borderRadius: 12, transform: 'rotate(-3deg)', boxShadow: '0 10px 24px rgba(0,0,0,.5)' }}>{tag}</div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: H * 0.48 }}>
        <div style={{ fontSize: 200 * k, fontWeight: 900, lineHeight: 1.04, letterSpacing: -4, whiteSpace: 'nowrap', ...stroke(10 * k) }}>{l1}</div>
        <div style={{ fontSize: 150 * k, fontWeight: 900, lineHeight: 1.1, color: C.warm, letterSpacing: -2, whiteSpace: 'nowrap', ...stroke(8 * k) }}>{l2}</div>
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: H * 0.48 + 400 * k, display: 'flex', gap: 18 * k }}>
        {chips.map(([n, t]) => (
          <div key={t} style={{ flex: 1, background: 'rgba(21,26,36,.92)', border: `2px solid ${C.line}`, borderRadius: 18, padding: `${16 * k}px ${10 * k}px`, textAlign: 'center' }}>
            <div style={{ fontSize: 72 * k, fontWeight: 900, lineHeight: 1.05, color: n === '0' ? C.accent : C.text, whiteSpace: 'nowrap' }}>{n}</div>
            <div style={{ fontSize: 30 * k, fontWeight: 600, color: C.muted, whiteSpace: 'nowrap' }}>{t}</div>
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', left: 60, right: 60, bottom: 54 * k, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ width: 64 * k, height: 64 * k, borderRadius: 32 * k, background: C.accent, color: '#fff', fontSize: 38 * k, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>宁</div>
        <div style={{ fontSize: 36 * k, fontWeight: 600 }}>宁少 AI 进化论<span style={{ color: C.muted, marginLeft: 16 }}>分享 AI 时代的内容创作认知</span></div>
      </div>
    </AbsoluteFill>
  );
};
export const Cover06: React.FC = () => <NoFaceCover img="ep06/cover/f.png" tag="不出镜系列" l1="不露脸" l2="也不吃亏了" chips={[['0', '个出镜镜头'], ['0', '次手剪'], ['1 段', '录音']]} />;
export const Cover07: React.FC = () => <NoFaceCover img="ep07/cover/f.png" tag="0 个剪辑软件" l1="每一帧" l2="都是代码画的" chips={[['232', '个画面组件'], ['14', '本片用到'], ['3 分 34 秒', '整片渲染']]} />;
