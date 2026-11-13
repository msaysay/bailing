import React from 'react';
import { Composition, Still, registerRoot } from 'remotion';
import { EP02, clock } from './episodes/ep02';
import { Cover } from './episodes/ep02/cover';
// 每期一个 Composition；-P1 是只到第一件事结束的预览。
registerRoot(() => (
  <>
    <Composition id="EP02" component={EP02} width={1920} height={1080} fps={clock.fps} durationInFrames={Math.ceil(clock.total * clock.fps)} />
    <Composition id="EP02-P1" component={EP02} width={1920} height={1080} fps={clock.fps} durationInFrames={Math.ceil(clock.seg('一·律师').end * clock.fps)} />
    <Still id="EP02-COVER-DOUYIN" component={Cover} width={1080} height={1440} />
    <Still id="EP02-COVER-SHIPINHAO" component={Cover} width={1080} height={1260} />
  </>
));
