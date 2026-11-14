// 运动函数：给一个时间（秒），算出一个值。全部是纯函数，同一个时间永远得到同一个值，渲染可复现。
// 用法：const y = spring(t - at, { from: 80, to: 0 })；t 用 useT() 取。

/** 弹簧：从 from 冲向 to，越过一点再弹回来。stiffness 越大越快，damping 越小弹得越久。 */
export const spring = (time: number, o: { from?: number; to?: number; stiffness?: number; damping?: number; mass?: number } = {}) => {
  const { from = 0, to = 1, stiffness = 120, damping = 10, mass = 1 } = o; if (time <= 0) return from;
  const w0 = Math.sqrt(stiffness / mass), z = damping / (2 * Math.sqrt(stiffness * mass)), d = to - from;
  if (z < 1) { const wd = w0 * Math.sqrt(1 - z * z); return to - d * Math.exp(-z * w0 * time) * (Math.cos(wd * time) + ((z * w0) / wd) * Math.sin(wd * time)); }
  return to - d * Math.exp(-w0 * time) * (1 + w0 * time);
};
/** 惯性：带着初速度滑出去，被摩擦慢慢停下。最终停在 from + velocity / friction。 */
export const inertia = (time: number, o: { from?: number; velocity: number; friction?: number }) => { const { from = 0, velocity, friction = 2 } = o; return time <= 0 ? from : from + (velocity / friction) * (1 - Math.exp(-friction * time)); };
/** 振荡：围着 offset 来回摆。frequency 是每秒几个来回。 */
export const oscillate = (time: number, o: { offset?: number; amplitude?: number; frequency?: number; phase?: number } = {}) => { const { offset = 0, amplitude = 1, frequency = 1, phase = 0 } = o; return offset + amplitude * Math.sin(2 * Math.PI * (frequency * time + phase)); };
const hash = (n: number, seed: number) => { const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453; return x - Math.floor(x); };
const seedNum = (s: number | string) => (typeof s === 'number' ? s : Array.from(s).reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 9973, 7));
/** 平滑噪声：没有规律但连续的轻微晃动，同一个 seed 永远是同一条曲线。做漂浮、手持感。 */
export const noise = (time: number, o: { offset?: number; amplitude?: number; frequency?: number; seed?: number | string } = {}) => {
  const { offset = 0, amplitude = 1, frequency = 1, seed = 1 } = o, s = seedNum(seed), x = time * frequency, i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
  return offset + amplitude * ((hash(i, s) * (1 - u) + hash(i + 1, s) * u) * 2 - 1);
};
/** 阻尼跟随：平滑地追一个会变的目标，不会越过。since 是开始追的时刻（从那里起算，省计算）。 */
export const dampedFollow = (time: number, target: (t: number) => number, o: { damping?: number; since?: number } = {}) => {
  const { damping = 4, since = 0 } = o, dt = 1 / 120; let x = target(since);
  for (let t = since; t < time; t += dt) x += (target(t) - x) * (1 - Math.exp(-damping * dt));
  return x;
};
/** 弹簧跟随：追目标时会越过一点再弹回来，更有「活」的感觉。 */
export const springFollow = (time: number, target: (t: number) => number, o: { stiffness?: number; damping?: number; since?: number } = {}) => {
  const { stiffness = 115, damping = 9, since = 0 } = o, dt = 1 / 240; let x = target(since), v = 0;
  for (let t = since; t < time; t += dt) { v += (stiffness * (target(t) - x) - damping * v) * dt; x += v * dt; }
  return x;
};
const c01 = (p: number) => Math.max(0, Math.min(1, p));
/** 命名缓动：输入 0 到 1 的进度，输出 0 到 1 的位置（回弹类会短暂超出）。 */
export const EASE: Record<string, (p: number) => number> = {
  linear: (p) => c01(p),
  quadIn: (p) => c01(p) ** 2, quadOut: (p) => 1 - (1 - c01(p)) ** 2, quadInOut: (p) => { const x = c01(p); return x < 0.5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2; },
  cubicIn: (p) => c01(p) ** 3, cubicOut: (p) => 1 - (1 - c01(p)) ** 3, cubicInOut: (p) => { const x = c01(p); return x < 0.5 ? 4 * x ** 3 : 1 - (-2 * x + 2) ** 3 / 2; },
  quartOut: (p) => 1 - (1 - c01(p)) ** 4, quartInOut: (p) => { const x = c01(p); return x < 0.5 ? 8 * x ** 4 : 1 - (-2 * x + 2) ** 4 / 2; },
  expoOut: (p) => (c01(p) >= 1 ? 1 : 1 - 2 ** (-10 * c01(p))), expoInOut: (p) => { const x = c01(p); return x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 2 ** (20 * x - 10) / 2 : (2 - 2 ** (-20 * x + 10)) / 2; },
  sineInOut: (p) => -(Math.cos(Math.PI * c01(p)) - 1) / 2, smooth: (p) => { const x = c01(p); return x * x * (3 - 2 * x); },
  backOut: (p) => { const x = c01(p) - 1; return 1 + 2.70158 * x ** 3 + 1.70158 * x ** 2; },
  elasticOut: (p) => { const x = c01(p); return x <= 0 ? 0 : x >= 1 ? 1 : 2 ** (-10 * x) * Math.sin(((x * 10 - 0.75) * 2 * Math.PI) / 3) + 1; },
  bounceOut: (p) => { let x = c01(p); const n = 7.5625, d = 2.75; if (x < 1 / d) return n * x * x; if (x < 2 / d) return n * (x -= 1.5 / d) * x + 0.75; if (x < 2.5 / d) return n * (x -= 2.25 / d) * x + 0.9375; return n * (x -= 2.625 / d) * x + 0.984375; },
  stepStart: (p) => (p > 0 ? 1 : 0), stepEnd: (p) => (p >= 1 ? 1 : 0),
};
