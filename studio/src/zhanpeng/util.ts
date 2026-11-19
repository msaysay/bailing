import type React from "react";
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

// 三个字体角色，文件由字体包决定（fonts.json），index.tsx 负责加载。
export const SUB = '"ZP Sub", "Kaiti SC", "STKaiti", "KaiTi", serif';
export const STRONG = '"ZP Strong", "ZP Sub", "Kaiti SC", "STKaiti", "KaiTi", serif';
export const BIG = '"ZP Big", "ZP Strong", "ZP Sub", serif';
/** 用同色描边把字加粗：开源楷体只有一个字重，对标片的粗楷靠这个补。amount 是占字号的比例。 */
export const bold = (size: number, amount: number, color: string): React.CSSProperties =>
  amount > 0 ? {WebkitTextStroke: `${(size * amount * 2).toFixed(2)}px ${color}`} : {};

/** 固定的伪随机数，0 到 1。 */
export const rand = (seed: number) => {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
