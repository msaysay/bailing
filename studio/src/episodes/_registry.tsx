// 自动生成：scripts/episode.py new 会往这里加一行。不要手改。
import React from 'react';
import { Composition } from 'remotion';
import { Episode as EP05, clock as EP05_C } from './ep05';
export const Registered: React.FC = () => (
  <>
    <Composition id="ep05" component={EP05} width={1920} height={1080} fps={EP05_C.fps} durationInFrames={Math.max(1, Math.ceil(EP05_C.total * EP05_C.fps))} />
  </>
);
