// 底层统一值：颜色、字体、字阶、常用件。场景里不手写近似值。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, staticFile, continueRender, delayRender } from 'remotion';
import { FPS, prog, seg, lines, mix } from './lib';

export const C = { bg: '#0B0E14', surface: '#151A24', line: '#263042', text: '#F3F1EA', muted: '#8A93A6', accent: '#5B9BFF', down: '#FF5D5D', warm: '#FFD479' };
export const FONT = 'MiSans, "WenQuanYi Zen Hei", sans-serif';
export const useT = () => useCurrentFrame() / FPS;

const fonts: [string, number][] = [['MiSans-Regular.otf', 400], ['MiSans-Semibold.otf', 600], ['MiSans-Heavy.otf', 900]];
export const useFonts = () => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    Promise.all(fonts.map(([f, w]) => { const ff = new FontFace('MiSans', `url(${staticFile('fonts/' + f)})`, { weight: String(w) }); return ff.load().then((x) => document.fonts.add(x)); }))
      .then(() => continueRender(h)).catch((e) => { throw e; });
  }, [h]);
};

/** 到点出现：淡入 + 上移 24px。 */
export const Pop: React.FC<{ at: number; dur?: number; dy?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, dur = 0.45, dy = 24, style, children }) => {
  const p = prog(useT(), at, dur);
  return <div style={{ opacity: p, transform: `translateY(${mix(dy, 0, p)}px)`, ...style }}>{children}</div>;
};

/** 一段画面：只在本段时间内渲染，段首段尾各 0.3 秒交叉淡化。 */
export const Scene: React.FC<{ id: number; children: React.ReactNode }> = ({ id, children }) => {
  const t = useT(), s = seg(id), F = 0.3;
  if (t < s.start || t > s.end + F) return null;
  const fin = id === 1 ? 1 : Math.min(1, (t - s.start) / F), fout = id === 9 ? 1 : 1 - Math.max(0, (t - s.end) / F);
  return <AbsoluteFill style={{ opacity: Math.min(fin, fout) }}>{children}</AbsoluteFill>;
};

export const Bg: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(1400px 800px at 50% 38%, #141B29 0%, ${C.bg} 70%)` }}>
    <AbsoluteFill style={{ backgroundImage: `linear-gradient(${C.line}33 1px, transparent 1px), linear-gradient(90deg, ${C.line}33 1px, transparent 1px)`, backgroundSize: '96px 96px', opacity: 0.35 }} />
  </AbsoluteFill>
);

const TITLES = ['', '五天', '公告说了什么', '往前倒五天', '谁来接', '市场怎么算', '两截，两笔账', '一个细节', '接下来看什么', '说明'];
export const Chrome: React.FC = () => {
  const t = useT();
  const cur = [9, 8, 7, 6, 5, 4, 3, 2, 1].find((i) => t >= seg(i).start) ?? 1;
  const l = lines.find((x) => t >= x.start && t < x.end);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: C.text }}>
      <div style={{ position: 'absolute', left: 72, top: 56, display: 'flex', alignItems: 'center', gap: 16, fontSize: 26, color: C.muted, fontWeight: 600 }}>
        <span style={{ color: C.accent }}>{String(cur).padStart(2, '0')}</span><span style={{ width: 28, height: 2, background: C.line }} /><span>{TITLES[cur]}</span>
      </div>
      <div style={{ position: 'absolute', right: 72, top: 56, fontSize: 22, color: C.muted, border: `1px solid ${C.line}`, borderRadius: 999, padding: '8px 18px' }}>本视频由 AI 自动生成</div>
      {l && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, textAlign: 'center', fontSize: 46, fontWeight: 600, textShadow: '0 2px 12px #000a' }}>{l.text}</div>}
    </AbsoluteFill>
  );
};

export const Stage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ fontFamily: FONT, color: C.text, padding: '150px 140px 190px', boxSizing: 'border-box', flexDirection: 'column', ...style }}>{children}</AbsoluteFill>
);
export const Chip: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.text, style }) => (
  <span style={{ display: 'inline-block', fontSize: 40, fontWeight: 600, color, background: C.surface, border: `1.5px solid ${color === C.text ? C.line : color}`, borderRadius: 16, padding: '16px 30px', ...style }}>{children}</span>
);
export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'absolute', left: 140, bottom: 150, fontSize: 22, color: C.muted }}>{children}</div>
);
/** 数字从 0 滚到目标值。 */
export const Count: React.FC<{ to: number; at: number; dur?: number; digits?: number }> = ({ to, at, dur = 0.8, digits = 0 }) => <>{(to * prog(useT(), at, dur)).toFixed(digits)}</>;
