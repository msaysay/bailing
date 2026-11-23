// 自动生成：scripts/episode.py new 会往这里加一行。不要手改。
import React from 'react';
import { Composition } from 'remotion';
import { Episode as EP06, clock as EP06_C } from './ep06';
import { Episode as EP05, clock as EP05_C } from './ep05';
export const Registered: React.FC = () => (
  <>
    <Composition id="ep06" component={EP06} width={1920} height={1080} fps={EP06_C.fps} durationInFrames={Math.max(1, Math.ceil(EP06_C.total * EP06_C.fps))} />
    <Composition id="ep05" component={EP05} width={1920} height={1080} fps={EP05_C.fps} durationInFrames={Math.max(1, Math.ceil(EP05_C.total * EP05_C.fps))} />
  </>
);
