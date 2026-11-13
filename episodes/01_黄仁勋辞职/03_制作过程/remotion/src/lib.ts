// 全片唯一时间源：timing.json（由 tools/build_timing.py 从录音生成）。场景里不手写秒数。
import timing from './timing.json';
export const FPS = timing.fps;
export const TOTAL = timing.total;
export const seg = (id: number) => timing.segments.find((s) => s.id === id)!;
export const lines = timing.lines;
/** 第 n 行字幕里，识别原文中某个词开始被念到的时刻（秒）；不给词就是这行的起点。 */
export const at = (n: number, phrase?: string): number => {
  const l = lines[n - 1];
  if (!phrase) return l.start;
  const flat = l.chars.map((c) => c.c).join('');
  const i = flat.indexOf(phrase.toLowerCase());
  if (i < 0) throw new Error(`第 ${n} 行「${l.asr}」里找不到「${phrase}」`);
  let acc = 0;
  for (const c of l.chars) { if (i < acc + c.c.length) return c.t; acc += c.c.length; }
  return l.start;
};
const clamp = (v: number) => Math.max(0, Math.min(1, v));
export const outCubic = (p: number) => 1 - Math.pow(1 - clamp(p), 3);
export const inOut = (p: number) => { const x = clamp(p); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
/** t 时刻，从 start 起 dur 秒内 0→1（缓出）。 */
export const prog = (t: number, start: number, dur = 0.5) => outCubic((t - start) / dur);
export const mix = (a: number, b: number, p: number) => a + (b - a) * p;
