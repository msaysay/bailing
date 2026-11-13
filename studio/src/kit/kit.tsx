// 底层统一值与常用件。组件和场景里不手写颜色、字号的近似值。
import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, staticFile, continueRender, delayRender } from 'remotion';
import { prog, mix } from './clock';

export const C = { bg: '#0B0E14', surface: '#151A24', glass: 'rgba(13,17,25,.82)', line: '#263042', text: '#F3F1EA', muted: '#8A93A6', accent: '#5B9BFF', down: '#FF5D5D', warm: '#FFD479' };
export const FONT = 'MiSans, "WenQuanYi Zen Hei", sans-serif';
export const useT = () => useCurrentFrame() / useVideoConfig().fps;

const fonts: [string, number][] = [['MiSans-Regular.otf', 400], ['MiSans-Semibold.otf', 600], ['MiSans-Heavy.otf', 900]];
export const useFonts = () => {
  const [h] = React.useState(() => delayRender('fonts'));
  React.useEffect(() => {
    Promise.all(fonts.map(([f, w]) => new FontFace('MiSans', `url(${staticFile('fonts/' + f)})`, { weight: String(w) }).load().then((x) => document.fonts.add(x)))).then(() => continueRender(h));
  }, [h]);
};
/** 到点出现：淡入 + 上移。until 给了就在那一刻淡出。 */
export const Pop: React.FC<{ at: number; until?: number; dur?: number; dy?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, until, dur = 0.45, dy = 24, style, children }) => {
  const t = useT(), p = prog(t, at, dur), q = until === undefined ? 1 : 1 - prog(t, until, 0.3);
  if (p <= 0 || q <= 0) return <div style={{ ...style, opacity: 0 }}>{children}</div>;
  return <div style={{ ...style, opacity: p * q, transform: `translateY(${mix(dy, 0, p)}px)` }}>{children}</div>;
};
/** 一段画面：只在 [from, to] 内渲染，首尾交叉淡化。 */
export const Scene: React.FC<{ from: number; to: number; hard?: boolean; children: React.ReactNode }> = ({ from, to, hard, children }) => {
  const t = useT(), F = 0.3;
  if (t < from || t > to + F) return null;
  const fin = hard || from <= 0.01 ? 1 : Math.min(1, (t - from) / F), fout = 1 - Math.max(0, (t - to) / F);
  return <AbsoluteFill style={{ opacity: Math.min(fin, fout) }}>{children}</AbsoluteFill>;
};
export const Bg: React.FC = () => <AbsoluteFill style={{ background: `radial-gradient(1400px 800px at 50% 38%, #141B29 0%, ${C.bg} 70%)` }} />;
export const Stage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <AbsoluteFill style={{ fontFamily: FONT, color: C.text, padding: '150px 140px 190px', boxSizing: 'border-box', flexDirection: 'column', ...style }}>{children}</AbsoluteFill>
);
export const Chip: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = C.text, style }) => (
  <span style={{ display: 'inline-block', fontSize: 40, fontWeight: 600, color, background: C.glass, border: `1.5px solid ${color === C.text ? C.line : color}`, borderRadius: 16, padding: '16px 30px', whiteSpace: 'nowrap', ...style }}>{children}</span>
);
export const Panel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ background: C.glass, border: `1.5px solid ${C.line}`, borderRadius: 28, padding: '40px 48px', boxSizing: 'border-box', ...style }}>{children}</div>
);
/** 数据来源标签：每个数字旁边都要有；查不到写「未取得」。 */
export const Src: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ fontSize: 22, color: C.muted, marginTop: 10, whiteSpace: 'nowrap', ...style }}>来源 · {children}</div>
);
export const Note: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ position: 'absolute', left: 140, bottom: 150, fontSize: 22, color: C.muted, background: 'rgba(8,11,17,.7)', borderRadius: 8, padding: '4px 12px' }}>{children}</div>
);
export const Count: React.FC<{ to: number; at: number; dur?: number; digits?: number }> = ({ to, at, dur = 0.8, digits = 0 }) => <>{(to * prog(useT(), at, dur)).toFixed(digits)}</>;
export const H1: React.FC<{ at: number; until?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, until, children, style }) => (
  <Pop at={at} until={until} style={{ fontSize: 76, fontWeight: 900, ...style }}>{children}</Pop>
);
