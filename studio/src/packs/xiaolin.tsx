// 财经解读风：TALK02 是版式演示（没带原片，只用来照抄写法），TALK3-DEMO 是专属组件演示（能直接渲）。
import React from 'react';
import { Composition } from 'remotion';
import { TALK02, talk2Clock } from '../episodes/talk02';
import { Talk3Demo, TALK3_DEMO_SEC } from '../kit/talk3';
const Pack: React.FC = () => <>
  <Composition id="TALK02" component={TALK02} width={1080} height={1920} fps={talk2Clock.fps} durationInFrames={Math.ceil(talk2Clock.total * talk2Clock.fps)} />
  <Composition id="TALK3-DEMO" component={Talk3Demo} width={1080} height={1920} fps={30} durationInFrames={TALK3_DEMO_SEC * 30} defaultProps={{}} />
</>;
export default Pack;
