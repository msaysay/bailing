import {Easing, interpolate} from "remotion";

export const clamp = {extrapolateLeft: "clamp", extrapolateRight: "clamp"} as const;

export const ramp = (value: number, from: number, to: number, a = 0, b = 1, ease = Easing.out(Easing.cubic)) =>
  interpolate(value, [from, to], [a, b], {...clamp, easing: ease});

/** 黄字弹出：0 → 1.12 → 1。 */
export const pop = (seconds: number, length = 0.28) => {
  if (seconds <= 0) return 0;
  const p = Math.min(1, seconds / length);
  return interpolate(p, [0, 0.6, 1], [0.2, 1.12, 1], {...clamp, easing: Easing.out(Easing.quad)});
};

// 三种字：宋体（字幕）、黑宋（红色钩子）、楷体（黄色关键词）。文件由 scripts/zp.py setup 放进 public/fonts/。
export const SONG = '"ZP Song", "Songti SC", "Noto Serif CJK SC", serif';
export const SONG_BLACK = '"ZP SongBlack", "ZP Song", serif';
export const KAI = '"ZP Kai", "Kaiti SC", "STKaiti", "KaiTi", "ZP Song", serif';

/** 固定的伪随机数，0 到 1。 */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
