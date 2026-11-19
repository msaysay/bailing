// 相框口播线的底层：品牌色、字体、坐标、时间小工具。所有数值只在这里定义，别处不手写近似值。
// 画布 1080×1920。相框（纸纹底、三行标题、署名条、标志）整片不动，变化只发生在画面窗 WIN 里。
import React from 'react';
import { continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const W = 1080, H = 1920;
/** 画面窗：人、素材、卡片、贴纸、字幕都在这里面。 */
export const WIN = { x: 0, y: 555, w: 1080, h: 813 };
/** 窗内给卡片内容用的安全区（底部 118 留给字幕）。 */
export const SAFE = { x: 60, y: 44, w: 960, h: 650 };

export const K = {
  paper: '#FAF8F2', paperDeep: '#F1EEE4', line: '#E2DDCF', ink: '#22261F', sub: '#5E665B', mute: '#9AA094',
  green: '#2F7D46', greenDeep: '#33513A', greenSoft: '#E4F0E3', logo: '#4AA159',
  orange: '#F0892E', orangeSoft: '#FDEBD8', yellow: '#F1B32E', hot: '#FFDE6B', white: '#FFFFFF',
};
export const SERIF = '"Source Han Serif SC", "Songti SC", serif';
export const SANS = 'MiSans, "PingFang SC", sans-serif';
export const SLANT = '"Smiley Sans", MiSans, sans-serif';

const FONTS: [string, string, number][] = [
  ['Source Han Serif SC', 'SourceHanSerifSC-Medium.otf', 500], ['Source Han Serif SC', 'SourceHanSerifSC-Bold.otf', 700], ['Source Han Serif SC', 'SourceHanSerifSC-Heavy.otf', 900],
  ['Smiley Sans', 'SmileySans-Oblique.otf', 400],
  ['MiSans', 'MiSans-Regular.otf', 400], ['MiSans', 'MiSans-Semibold.otf', 600], ['MiSans', 'MiSans-Heavy.otf', 900],
];
/** 字体没放进 studio/public/fonts/ 时渲染会直接报错（先跑 scripts/fetch-fonts.sh）。 */
export const useFonts = () => {
  const [h] = React.useState(() => delayRender('yuedu-fonts'));
  React.useEffect(() => {
    Promise.all(FONTS.map(([fam, f, w]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: String(w) }).load().then((x) => document.fonts.add(x))))
      .then(() => continueRender(h))
      .catch((e) => { throw new Error('字体加载失败，先运行 scripts/fetch-fonts.sh：' + e); });
  }, [h]);
};

export const useT = () => useCurrentFrame() / useVideoConfig().fps;
export const c01 = (v: number) => Math.max(0, Math.min(1, v));
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
export const outCubic = (p: number) => 1 - Math.pow(1 - c01(p), 3);
export const outQuint = (p: number) => 1 - Math.pow(1 - c01(p), 5);
export const inOut = (p: number) => { const x = c01(p); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
/** 从 at 开始，dur 秒内由 0 到 1（缓出）。 */
export const ramp = (t: number, at: number, dur = 0.45) => outCubic((t - at) / dur);
/** 弹入：略微越过再回来。 */
export const pop = (t: number, at: number, dur = 0.5) => { const p = c01((t - at) / dur); if (p <= 0) return 0; const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); };
/** 可复现的伪随机数。 */
export const rnd = (n: number, seed = 1) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };

/** 到点出现：淡入加上移。 */
export const Rise: React.FC<{ at: number; dur?: number; dy?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, dur = 0.5, dy = 26, style, children }) => {
  const p = ramp(useT(), at, dur);
  return <div style={{ ...style, opacity: p, transform: `translateY(${mix(dy, 0, p)}px)` }}>{children}</div>;
};
