// 纯函数：把一期稿子排成时间轴。React 和配乐脚本共用，保证画面和音乐的切点一致。
import type { Episode, Scene } from './types.ts';

export const FPS = 30;
export const W = 1920;
export const H = 1080;
export const TAIL = 2.0; // 结尾留白（秒）

export const plain = (zh: string) => zh.replace(/\*\*/g, '');
/** 英文里的弯引号在中文字体里是全角宽度，统一换成直引号 */
export const enFix = (en: string) => en.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');

/** 一拍的时长：按字数估阅读时间。无配音的片子，观众要读完中文再扫一眼英文。 */
export function beatDur(zh: string, big?: boolean, d?: number): number {
  if (d) return d;
  const n = plain(zh).replace(/\s/g, '').length;
  const base = Math.min(5.2, Math.max(2.5, 1.2 + n * 0.22));
  return big ? Math.max(3.2, base + 0.7) : base;
}

export type TBeat = { i: number; zh: string; en: string; big: boolean; start: number; end: number; scene: number; step: number };
export type TScene = { i: number; scene: Scene; start: number; end: number; steps: number[] };
export type Timeline = { beats: TBeat[]; scenes: TScene[]; total: number };

export function layout(ep: Episode): Timeline {
  const beats: TBeat[] = [];
  const scenes: TScene[] = [];
  let t = 0.6; // 片头先给一点点空
  for (const [i, b] of ep.beats.entries()) {
    if (b.s || scenes.length === 0) {
      if (scenes.length) scenes[scenes.length - 1].end = t;
      scenes.push({ i: scenes.length, scene: b.s ?? { k: 'field' }, start: i === 0 ? 0 : t, end: 0, steps: [] });
    }
    const sc = scenes[scenes.length - 1];
    sc.steps.push(t);
    const d = beatDur(b.zh, b.big, b.d);
    beats.push({ i, zh: b.zh, en: b.en, big: !!b.big, start: t, end: t + d, scene: sc.i, step: sc.steps.length - 1 });
    t += d;
  }
  const total = t + TAIL;
  scenes[scenes.length - 1].end = total;
  return { beats, scenes, total };
}

export const frames = (ep: Episode) => Math.ceil(layout(ep).total * FPS);
