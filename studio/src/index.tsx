import React from 'react';
import { Composition, Still, registerRoot } from 'remotion';
import { EP02, clock } from './episodes/ep02';
import { Cover } from './episodes/ep02/cover';
import { TALK01, talkClock } from './episodes/talk01';
import { TALK02, talk2Clock } from './episodes/talk02';
import { WIDE01, wide1Clock } from './episodes/wide01';
import { OPEN01, OPEN_FPS, OPEN_FRAMES } from './episodes/open01';
import { OPEN02, OPEN2_FPS, OPEN2_FRAMES } from './episodes/open02';
import { FULL01, FULL_FPS, FULL_FRAMES } from './episodes/full01';
import { Cover01, Cover01V } from './episodes/cover01';
import { PetDemo, PET_DEMO_SEC } from './episodes/petdemo';
import { Gallery, GFPS } from './gallery';
import { CATALOG, SLOT } from './gallery/all';
import { DemoClip } from './gallery/demoClip';
import { Registered } from './episodes/_registry';
import { ZP, ZP_FPS, ZP_H, ZP_W, zpDefault } from './zhanpeng';
// 每期一个 Composition；-P1 是只到第一件事结束的预览。
registerRoot(() => (
  <>
    <Registered />
    <Composition id="EP02" component={EP02} width={1920} height={1080} fps={clock.fps} durationInFrames={Math.ceil(clock.total * clock.fps)} />
    <Composition id="EP02-P1" component={EP02} width={1920} height={1080} fps={clock.fps} durationInFrames={Math.ceil(clock.seg('一·律师').end * clock.fps)} />
    <Composition id="TALK01" component={TALK01} width={1080} height={1920} fps={talkClock.fps} durationInFrames={Math.ceil(talkClock.total * talkClock.fps)} />
    <Composition id="TALK02" component={TALK02} width={1080} height={1920} fps={talk2Clock.fps} durationInFrames={Math.ceil(talk2Clock.total * talk2Clock.fps)} />
    <Composition id="WIDE01" component={WIDE01} width={1920} height={1280} fps={wide1Clock.fps} durationInFrames={Math.ceil(wide1Clock.total * wide1Clock.fps)} />
    <Composition id="OPEN01" component={OPEN01} width={1080} height={1920} fps={OPEN_FPS} durationInFrames={OPEN_FRAMES} />
    <Composition id="OPEN02" component={OPEN02} width={1920} height={1080} fps={OPEN2_FPS} durationInFrames={OPEN2_FRAMES} />
    <Composition id="FULL01" component={FULL01} width={1920} height={1080} fps={FULL_FPS} durationInFrames={FULL_FRAMES} />
    <Still id="COVER01" component={Cover01} width={1920} height={1080} />
    <Still id="COVER01-V" component={Cover01V} width={1080} height={1440} />
    {/* 知识科普风（张展鹏式）：数据驱动，一个合成做所有期。scripts/zp.py render 用 --props 传每期的数据。相框老板风有自己的入口 src/yuedu/index.tsx。 */}
    <Composition id="ZP" component={ZP} width={ZP_W} height={ZP_H} fps={ZP_FPS} durationInFrames={90} defaultProps={zpDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.durationInFrames)) })} />
    <Composition id="PET-DEMO" component={PetDemo} width={1920} height={1080} fps={30} durationInFrames={PET_DEMO_SEC * 30} />
    <Composition id="GALLERY" component={Gallery} width={1920} height={1080} fps={GFPS} durationInFrames={CATALOG.length * SLOT * GFPS} />
    <Composition id="DEMO-CLIP" component={DemoClip} width={1920} height={1080} fps={30} durationInFrames={240} />
    <Composition id="DEMO-CLIP-V" component={DemoClip} width={1080} height={1920} fps={30} durationInFrames={240} />
    <Still id="EP02-COVER-DOUYIN" component={Cover} width={1080} height={1440} />
    <Still id="EP02-COVER-SHIPINHAO" component={Cover} width={1080} height={1260} />
  </>
));
