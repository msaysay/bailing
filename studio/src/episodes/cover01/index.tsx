// 《短视频剪辑正式进入 AI 时代》的封面：横版 1920×1080（COVER01）和竖版 1080×1440（COVER01-V，抖音、视频号的封面比例）。
// 样子和正片一致：黑底、白色粗黑体、荧光绿。素材在 studio/public/open01/（不进仓库）：cover-me.png 是原片 1.5 秒那一帧，cover-d1..3.jpg 是三条样片的截图。
import React from 'react';
import { AbsoluteFill, Img, continueRender, delayRender, staticFile } from 'remotion';

const FX = 994, FY = 505;   // 封面那一帧里人脸的中心，换图要重量
const LIME = '#D6FF3D', INK = '#0A0A0B', PAPER = '#F4F2EC', HEI = '"C Hei", sans-serif', DIN = '"C Din", "C Hei", sans-serif';
const useFontsC = () => {
  const [h] = React.useState(() => delayRender('cover-fonts'));
  React.useEffect(() => {
    Promise.all([['C Hei', 'SourceHanSansSC-Heavy.otf'], ['C Din', 'D-DIN-PRO-700-Bold.otf']].map(([fam, f]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: '100 900' }).load().then((x) => document.fonts.add(x)).catch(() => undefined))).then(() => continueRender(h));
  }, [h]);
};
const Shots: React.FC<{ h: number }> = ({ h }) => (
  <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
    {[['open01/cover-d1.jpg', 9 / 16], ['open01/cover-d3.jpg', 3 / 2], ['open01/cover-d2.jpg', 9 / 16]].map(([src, r], i) => <div key={i} style={{ height: (r as number) > 1 ? h * 0.8 : h, width: ((r as number) > 1 ? h * 0.8 : h) * (r as number), borderRadius: 10, overflow: 'hidden', outline: '2px solid rgba(244,242,236,.85)', outlineOffset: 4, boxShadow: '0 16px 40px rgba(0,0,0,.6)' }}><Img src={staticFile(src as string)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>)}
  </div>
);
export const Cover01: React.FC = () => {
  useFontsC();
  return (
    <AbsoluteFill style={{ background: INK }}>
      <Img src={staticFile('open01/cover-me.png')} style={{ position: 'absolute', left: 1500 - FX * 1.08, top: 520 - FY * 1.08, width: 1920 * 1.08, height: 1080 * 1.08, filter: 'contrast(1.1) saturate(1.08)' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(1100px 800px at 74% 45%, transparent 45%, rgba(0,0,0,.5) 100%)' }} />
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1090, height: 1080, background: INK, clipPath: 'polygon(0 0, 100% 0, calc(100% - 160px) 100%, 0 100%)' }} />
      <div style={{ position: 'absolute', left: 1090, top: 0, width: 10, height: 1080, background: LIME, transform: 'skewX(-8.4deg)', transformOrigin: 'top left' }} />
      <div style={{ position: 'absolute', left: 90, top: 86, width: 900 }}>
        <div style={{ display: 'inline-block', fontFamily: HEI, fontSize: 62, color: INK, background: LIME, padding: '2px 30px 8px', letterSpacing: 8 }}>我宣布</div>
        <div style={{ fontFamily: HEI, fontSize: 150, lineHeight: 1.18, color: PAPER, letterSpacing: 4, marginTop: 16, whiteSpace: 'nowrap' }}>短视频剪辑</div>
        <div style={{ fontFamily: HEI, fontSize: 84, lineHeight: 1.2, color: 'rgba(244,242,236,.6)', letterSpacing: 16 }}>正式进入</div>
        <div style={{ fontFamily: HEI, fontSize: 240, lineHeight: 1.05, color: LIME, whiteSpace: 'nowrap', marginLeft: -6 }}><span style={{ fontFamily: DIN, fontSize: 272 }}>AI</span>时代</div>
      </div>
      <div style={{ position: 'absolute', left: 90, top: 836, display: 'flex', alignItems: 'center', gap: 34 }}>
        <Shots h={190} />
        <div style={{ fontFamily: HEI, fontSize: 38, lineHeight: 1.45, color: PAPER, letterSpacing: 2 }}>同一段原片<br /><span style={{ color: LIME }}>AI 自动剪出 3 种</span></div>
      </div>
    </AbsoluteFill>
  );
};
export const Cover01V: React.FC = () => {
  useFontsC();
  return (
    <AbsoluteFill style={{ background: INK }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 800, overflow: 'hidden' }}>
        <Img src={staticFile('open01/cover-me.png')} style={{ position: 'absolute', left: 540 - FX * 1.15, top: 370 - FY * 1.15, width: 1920 * 1.15, height: 1080 * 1.15, filter: 'contrast(1.1) saturate(1.08)' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, transparent 55%, ${INK} 100%)` }} />
      </div>
      <div style={{ position: 'absolute', left: 60, top: 60, fontFamily: HEI, fontSize: 60, color: INK, background: LIME, padding: '2px 28px 8px', letterSpacing: 8 }}>我宣布</div>
      <div style={{ position: 'absolute', left: 60, right: 60, top: 690 }}>
        <div style={{ fontFamily: HEI, fontSize: 150, lineHeight: 1.15, color: PAPER, letterSpacing: 4, whiteSpace: 'nowrap' }}>短视频剪辑</div>
        <div style={{ fontFamily: HEI, fontSize: 84, lineHeight: 1.25, color: 'rgba(244,242,236,.6)', letterSpacing: 16 }}>正式进入</div>
        <div style={{ fontFamily: HEI, fontSize: 270, lineHeight: 1.05, color: LIME, whiteSpace: 'nowrap', marginLeft: -6 }}><span style={{ fontFamily: DIN, fontSize: 310 }}>AI</span>时代</div>
      </div>
      <div style={{ position: 'absolute', left: 60, top: 1250, height: 8, width: 960, background: LIME }} />
      <div style={{ position: 'absolute', left: 60, right: 60, top: 1290, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: HEI, fontSize: 44, lineHeight: 1.4, color: PAPER }}>同一段原片<br /><span style={{ color: LIME }}>AI 自动剪出 3 种</span></div>
        <Shots h={120} />
      </div>
    </AbsoluteFill>
  );
};
