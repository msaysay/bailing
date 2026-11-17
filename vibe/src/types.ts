// 一期片子的数据结构。稿子只写这些，画面、时长、字幕、配乐都由它推出来。

/** 场景：一段连续的动画。它会持续到下一个带 s 的拍子为止，期间每一拍都会让它前进一步（step）。 */
export type Scene =
  | { k: 'field' } // 只有缓慢漂浮的光点，给强调字幕当背景
  | { k: 'title' }
  | { k: 'number'; items: { v: number; pre?: string; suf?: string; label: string; dec?: number; hot?: boolean }[]; note?: string }
  | { k: 'dots'; cols: number; rows: number; steps: { a?: number; b?: number; label?: string }[]; legend?: [string, string] }
  | { k: 'bars'; items: { label: string; v: number; hot?: boolean; tag?: string }[]; unit?: string; max?: number; note?: string }
  | { k: 'compare'; left: string; right: string; rows: [string, string][]; win?: 'left' | 'right' }
  | { k: 'flow'; nodes: string[]; loop?: boolean; sub?: string[] }
  | { k: 'funnel'; layers: { label: string; tip?: string }[]; weak?: number }
  | { k: 'curve'; pts: number[]; xl?: string[]; yl?: string; marks?: { x: number; label: string }[]; ref?: number[]; refLabel?: string; label?: string; note?: string }
  | { k: 'bell'; label?: string; outlier?: string }
  | { k: 'ring'; parts: { label: string; v: number; hot?: boolean }[]; center?: string; note?: string }
  | { k: 'list'; items: { t: string; d?: string }[]; head?: string }
  | { k: 'chat'; msgs: { me?: boolean; who?: string; t: string }[]; head?: string }
  | { k: 'blocks'; head?: string; items: string[]; ai: number[]; aiLabel?: string; keepLabel?: string }
  | { k: 'scatter'; n: number; keep: number; label?: string; keepLabel?: string }
  | { k: 'hub'; center: string; spokes: string[] }
  | { k: 'stairs'; items: { label: string; v: string }[]; head?: string }
  | { k: 'split'; a: string; b: string; aSub?: string; bSub?: string }
  | { k: 'quote'; lines: string[]; next?: string };

export type Beat = {
  /** 中文字幕。不带标点，一行不超过 20 字；**词** 会变色 */
  zh: string;
  /** 英文字幕 */
  en: string;
  /** 从这一拍开始换新场景 */
  s?: Scene;
  /** 强调字幕：整句放大居中，逐字出现，隐藏底部字幕 */
  big?: boolean;
  /** 手动指定时长（秒） */
  d?: number;
};

export type Episode = {
  id: string; // 'V01'
  no: number;
  title: string;
  en: string;
  group: string; // 认知篇 等
  /** 配乐调性/和弦套路的种子 */
  mood?: number;
  beats: Beat[];
};
