// 时钟：全片唯一时间源是 scripts/align.py 生成的 timing.json。场景里不手写秒数。
import React from 'react';
export type Line = { n: number; seg: number; text: string; start: number; end: number; chars: { c: string; i: number; t: number }[] };
export type Timing = { fps: number; total: number; segments: { id: number; name: string; start: number; end: number; lines: number[] }[]; lines: Line[] };
export type Clock = ReturnType<typeof makeClock>;
export const makeClock = (tm: Timing) => {
  const seg = (k: number | string) => { const s = tm.segments.find((x) => x.id === k || x.name === k); if (!s) throw new Error('没有这一段：' + k); return s; };
  /** 第 n 行字幕里某个词开始被念到的时刻；不给词就是这行的起点。 */
  const at = (n: number, phrase?: string): number => {
    const l = tm.lines[n - 1]; if (!l) throw new Error('没有第 ' + n + ' 行');
    if (!phrase) return l.start;
    const p = l.text.indexOf(phrase); if (p < 0) throw new Error(`第 ${n} 行「${l.text}」里找不到「${phrase}」`);
    return (l.chars.find((c) => c.i >= p) ?? l.chars[l.chars.length - 1]).t;
  };
  /** 在某一段里按文字找行号，省得数行。 */
  const ln = (segKey: number | string, phrase: string): number => {
    const s = seg(segKey); const l = tm.lines.find((x) => x.seg === s.id && x.text.includes(phrase));
    if (!l) throw new Error(`「${s.name}」段里找不到「${phrase}」`); return l.n;
  };
  /** 最常用：某段里某个词被念到的时刻。 */
  const say = (segKey: number | string, phrase: string) => at(ln(segKey, phrase), phrase);
  return { fps: tm.fps, total: tm.total, lines: tm.lines, segments: tm.segments, seg, at, ln, say };
};
export const ClockCtx = React.createContext<Clock>(null as unknown as Clock);
export const useClock = () => React.useContext(ClockCtx);
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const outCubic = (p: number) => 1 - Math.pow(1 - clamp(p), 3);
export const inOut = (p: number) => { const x = clamp(p); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
export const prog = (t: number, start: number, dur = 0.5) => outCubic((t - start) / dur);
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
