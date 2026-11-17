// 视觉基础：四个颜色、两种字体、缓动函数。组件里不手写颜色。
import React from 'react';
import { continueRender, delayRender, staticFile } from 'remotion';

/** 全片四色：底、字、强调（暖橙）、对照（冷青）。半透明只是这四色的深浅。 */
export const C = {
  bg: '#0A0C12',
  ink: '#ECE7DC',
  hot: '#FF7A45',
  cool: '#5CC8FF',
};
export const a = (hex: string, o: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${o})`;
};
export const SERIF = '"VSerif", "Noto Serif SC", serif';
export const SANS = '"VSans", "Noto Sans SC", "WenQuanYi Zen Hei", sans-serif';

// 字体：public/fonts 里是按全部稿子抽字后的子集（scripts/fonts.py 生成）。
const fontHandle = typeof window !== 'undefined' ? delayRender('fonts') : 0;
if (typeof window !== 'undefined') {
  const faces = [
    new FontFace('VSerif', `url(${staticFile('fonts/serif.woff2')}) format('woff2')`, { weight: '200 900' }),
    new FontFace('VSans', `url(${staticFile('fonts/sans.woff2')}) format('woff2')`, { weight: '100 900' }),
  ];
  Promise.all(faces.map((f) => f.load().then((ff) => (document.fonts as unknown as { add: (f: FontFace) => void }).add(ff))))
    .then(() => continueRender(fontHandle))
    .catch((e) => { console.error(e); continueRender(fontHandle); });
}

export const clamp = (x: number, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
/** t 从 at 起经过 dur 秒从 0 到 1（缓出） */
export const prog = (t: number, at: number, dur = 0.5) => easeOut(clamp((t - at) / dur));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const inOut = (x: number) => { x = clamp(x); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const mix = (a0: number, b0: number, p: number) => a0 + (b0 - a0) * p;
/** 稳定的伪随机 */
export const rnd = (i: number, s = 1) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };

/** 场景时钟：t=场景内秒数，step=第几拍，st=本拍内秒数，at(k)=第 k 拍开始的场景内秒数，n=本场景共几拍 */
export type Clock = { t: number; step: number; st: number; at: (k: number) => number; len: number; n: number };

/** **词** 标记的文本拆成片段 */
export const parseHot = (s: string) => s.split(/(\*\*[^*]+\*\*)/).filter(Boolean).map((x) => x.startsWith('**') ? { t: x.slice(2, -2), hot: true } : { t: x, hot: false });

/** 到点浮现 */
export const Fade: React.FC<{ p: number; dy?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ p, dy = 24, style, children }) => (
  <div style={{ ...style, opacity: p, transform: `${style?.transform ?? ''} translateY(${mix(dy, 0, p)}px)` }}>{children}</div>
);

/** 小号标签：等宽、字距拉开，用来写来源、单位、注释 */
export const Tag: React.FC<{ children: React.ReactNode; color?: string; style?: React.CSSProperties }> = ({ children, color = a(C.ink, 0.5), style }) => (
  <div style={{ fontFamily: SANS, fontSize: 24, letterSpacing: 4, color, fontWeight: 500, ...style }}>{children}</div>
);
