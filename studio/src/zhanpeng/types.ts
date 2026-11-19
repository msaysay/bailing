// 模板吃的数据。由 scripts/zp.py board 从 分镜.json + timing.json 生成，不手写。
export type Box = {x: number; y: number; w: number; h: number};

export type StoryCaption = {
  id: string;
  text: string;
  start: number;
  end: number;
  /** Seconds from which the line stays on screen dimmed (a keyword took over). */
  dimFrom?: number;
};

export type Shot = {
  file: string;
  kind: "image" | "video";
  start: number;
  end: number;
  motion: "zoom-in" | "zoom-out" | "pan-up" | "pan-down" | "pan-left" | "pan-right" | "still";
  duration?: number;
  marks?: {x: number; y: number; r?: number; color?: string}[];
};

export type Scene = {
  id: string;
  type: "illustration" | "broll" | "paper" | "card";
  start: number;
  end: number;
  hold: number;
  transition: "ink" | "fade" | "blur" | "cut";
  out: "blur" | "cut" | "fade";
  frame: "card" | "full";
  pip: "left" | "right" | "none";
  shots: Shot[];
  text?: string;
  personFile?: string | null;
  frameColor?: string;
};

export type Overlay = {
  type: "hook" | "question" | "float" | "scatter" | "flow" | "label" | "bullets" | "bigword" | "ask" | "alert";
  start: number;
  end: number;
  text?: string;
  sub?: string;
  items?: {text: string; at: number}[];
  side?: "left" | "right";
};

export type StoryTheme = {
  colors: {white: string; red: string; yellow: string; yellowBox: string; ink: string; frame: string};
  caption: {y: number; size: number; spacing: number};
  hook: {y: number; size: number};
  pip: {left: {cx: number; cy: number; face: number}; right: {cx: number; cy: number; face: number}; rx: number; ry: number};
  camera: {drift: number};
};

export type StoryProps = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  videoFile: string;
  musicFile: string | null;
  musicVolume: number;
  captions: StoryCaption[];
  camera: {start: number; zoom: number; ease: boolean}[];
  face: Box;
  scenes: Scene[];
  overlays: Overlay[];
  /** 音效：at 秒，file 是 public/sfx/ 下的文件名。 */
  sfx?: {at: number; file: string; volume: number}[];
  theme: StoryTheme;
  title: string;
};
