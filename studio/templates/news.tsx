// 横屏解读片骨架（放在 src 外面免得被类型检查；scripts/episode.py new 会把它复制成 studio/src/episodes/<代号>/index.tsx）。
// 已经接好：时钟（timing.json）、配音、背景音乐、常驻外框、底部字幕、AI 标注。你只需要在「场景」那里按段加画面。
// 时间一律用 say('段名', '词') 或 seg('段名').start/end 取，不手写秒数。组件目录：studio/out/组件包/组件说明.md。
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing, useClock } from '../../kit/clock';
import { C, FONT, Scene, useFonts, useT } from '../../kit/kit';
import { BroadcastFrame, HalftoneBg } from '../../components/bc';
import timing from './timing.json';

const SLUG = '__SLUG__', SHOW = '__SHOW__', TITLE = '__TITLE__';
export const clock = makeClock(timing as Timing);
// 章节：这一章从哪一段开始（段名和 script.txt 里的「## 段名」一致）
const chapters: { no: string; title: string; from: string }[] = [];
// 底部字幕里要变色的词
const hot: string[] = [];
// 音效：[时刻, 文件, 音量]，文件在 studio/public/sfx/（tick.wav、whoosh.wav、thud.wav）
const sfx: [number, string, number][] = [];

/** 底部字幕：跟着口播一行行走，hot 里的词变色；hide 里的行不显示（被大字替代的那几行）。 */
const Subs: React.FC<{ hide?: number[] }> = ({ hide = [] }) => {
  const t = useT(), { lines } = useClock(), l = lines.find((x) => t >= x.start - .04 && t < x.end + .25);
  if (!l || hide.includes(l.n)) return null;
  const re = hot.length ? new RegExp('(' + hot.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')') : null;
  return <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, textAlign: 'center' }}><span style={{ display: 'inline-block', background: 'rgba(8,10,14,.72)', borderLeft: `5px solid ${C.warm}`, padding: '10px 26px', fontFamily: FONT, fontSize: 44, fontWeight: 600, color: '#fff' }}>{re ? l.text.split(re).map((x, i) => <span key={i} style={hot.includes(x) ? { color: C.warm, fontWeight: 900 } : undefined}>{x}</span>) : l.text}</span></div>;
};
const Scenes: React.FC = () => {
  const { seg, say } = useClock();
  return (
    <>
      {/* 在这里按段加画面，例如：
      <Scene from={seg('开场').start} to={seg('开场').end}><HalftoneBg theme="black" style={{ width: 1920, height: 1080 }} /></Scene> */}
    </>
  );
};
export const Episode: React.FC = () => {
  useFonts();
  const chap = chapters.filter((c) => clock.seg(c.from).start <= 0).length;
  return (
    <ClockCtx.Provider value={clock}>
      <AbsoluteFill style={{ background: C.bg }}>
        <BroadcastFrame width={1920} height={1080} show={SHOW} episode={TITLE} chapter={chapters[Math.max(0, chap - 1)]?.title ?? ''} index={chapters.length ? `${String(Math.max(1, chap)).padStart(2, '0')} / ${String(chapters.length).padStart(2, '0')}` : ''} from={0} to={clock.total}>
          <AbsoluteFill><Scenes /></AbsoluteFill>
        </BroadcastFrame>
        <Subs />
        <div style={{ position: 'absolute', right: 40, top: 70, fontFamily: FONT, fontSize: 22, color: 'rgba(255,255,255,.6)' }}>本视频由 AI 生成</div>
        {sfx.map(([t, f, v], i) => <Sequence key={i} from={Math.round(t * clock.fps)} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
        <Audio src={staticFile(`${SLUG}/voice.wav`)} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
