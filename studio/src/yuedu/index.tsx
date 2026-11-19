// 相框口播线的入口（独立于 src/index.tsx，打包快）。
//   成片：npx remotion render src/yuedu/index.tsx YueduFrame out/x.mp4 --props=<期目录>/props.json
//   卡片总览：npx remotion render src/yuedu/index.tsx YueduCards out/cards.mp4
import React from 'react';
import { AbsoluteFill, Composition, Sequence, Still, registerRoot } from 'remotion';
import { FrameProps, YueduFrame } from './frame';
import { CARDS } from './cards';
import { SAMPLES } from './samples';
import { K, SANS, useFonts, WIN } from './base';
import { Cover } from './cover';

const EMPTY: FrameProps = {
  fps: 30, total: 4, title: ['从“碎片化”到“系统化”', '约读书房如何解决', '“阅读指导”的标准化难题？'], speaker: { name: '单新杰', titles: ['约读书房合伙人', '一间书房项目发起人'] },
  media: { person: '', voice: '', vw: 1440, vh: 1080, face: { x: 750, y: 385, w: 154 }, plate: 'yuedu/plate.png', logo: 'yuedu/logo.png' }, subs: [], hot: [], base: [{ t: 0, do: 'G', card: { name: 'Quote', props: { text: '没有传入 props.json', kicker: '提示' }, cues: [] } }], overlays: [],
};
const SLOT = 5;
const Cards: React.FC<{ bubble?: boolean }> = ({ bubble }) => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: K.paper, fontFamily: SANS }}>
      {SAMPLES.map((s, i) => { const C = CARDS[s.name]; return <Sequence key={i} from={i * SLOT * 30} durationInFrames={SLOT * 30} layout="none"><Local i={i}><C {...s.props} t0={0} t1={SLOT} cues={[]} bubble={bubble} /></Local></Sequence>; })}
    </AbsoluteFill>
  );
};
const Local: React.FC<{ i: number; children: React.ReactNode }> = ({ children }) => <div style={{ position: 'absolute', left: 0, top: 0, width: WIN.w, height: WIN.h, overflow: 'hidden' }}>{children}</div>;

registerRoot(() => (
  <>
    <Composition id="YueduFrame" component={YueduFrame} width={1080} height={1920} fps={30} durationInFrames={120} defaultProps={EMPTY}
      calculateMetadata={({ props }) => ({ fps: props.fps, durationInFrames: Math.ceil(props.total * props.fps) })} />
    <Composition id="YueduCards" component={Cards} width={WIN.w} height={WIN.h} fps={30} durationInFrames={SAMPLES.length * SLOT * 30} defaultProps={{ bubble: false }} />
    <Still id="YueduCover" component={Cover} width={1080} height={1440} defaultProps={{ ...EMPTY, coverAt: 0 }} />
  </>
));
