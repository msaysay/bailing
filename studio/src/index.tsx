import React from 'react';
import { Composition, Still, registerRoot } from 'remotion';
import { EP02, clock } from './episodes/ep02';
import { Cover } from './episodes/ep02/cover';
import { TALK01, talkClock } from './episodes/talk01';
import { TALK02, talk2Clock } from './episodes/talk02';
import { Cover2 } from './episodes/talk02/cover';
import { Talkcraft, TC_BAR, TC_FPS, TC_H, TC_TOTAL, TC_W } from './talkcraft';
import { Gallery, GFPS } from './gallery';
import { CATALOG, SLOT } from './gallery/all';
import { DemoClip } from './gallery/demoClip';
// 每期一个 Composition；-P1 是只到第一件事结束的预览。
registerRoot(() => (
  <>
    <Composition id="EP02" component={EP02} width={1920} height={1080} fps={clock.fps} durationInFrames={Math.ceil(clock.total * clock.fps)} />
    <Composition id="EP02-P1" component={EP02} width={1920} height={1080} fps={clock.fps} durationInFrames={Math.ceil(clock.seg('一·律师').end * clock.fps)} />
    <Composition id="TALK01" component={TALK01} width={1080} height={1920} fps={talkClock.fps} durationInFrames={Math.ceil(talkClock.total * talkClock.fps)} />
    <Composition id="TALK02" component={TALK02} width={1080} height={1920} fps={talk2Clock.fps} durationInFrames={Math.ceil(talk2Clock.total * talk2Clock.fps)} />
    <Composition id="TALKCRAFT" component={Talkcraft} width={TC_W} height={TC_H + TC_BAR} fps={TC_FPS} durationInFrames={TC_TOTAL} />
    <Composition id="GALLERY" component={Gallery} width={1920} height={1080} fps={GFPS} durationInFrames={CATALOG.length * SLOT * GFPS} />
    <Composition id="DEMO-CLIP" component={DemoClip} width={1920} height={1080} fps={30} durationInFrames={240} />
    <Composition id="DEMO-CLIP-V" component={DemoClip} width={1080} height={1920} fps={30} durationInFrames={240} />
    <Still id="EP02-COVER-DOUYIN" component={Cover} width={1080} height={1440} />
    <Still id="TALK02-COVER-DOUYIN" component={Cover2} width={1080} height={1440} />
    <Still id="TALK02-COVER-SHIPINHAO" component={Cover2} width={1080} height={1260} />
    <Still id="EP02-COVER-SHIPINHAO" component={Cover} width={1080} height={1260} />
  </>
));
