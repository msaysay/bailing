import React from 'react';
import { Composition, Still, registerRoot } from 'remotion';
import { EP02, clock } from './episodes/ep02';
import { Cover } from './episodes/ep02/cover';
import { TALK01, talkClock } from './episodes/talk01';
import { TALK02, talk2Clock } from './episodes/talk02';
import { Cover2 } from './episodes/talk02/cover';
import { TALK03, talk3Clock } from './episodes/talk03';
import { Cover3 } from './episodes/talk03/cover';
import { TALK03B, talk3bClock } from './episodes/talk03/v2';
import { Talkcraft, TC_BAR, TC_FPS, TC_H, TC_TOTAL, TC_W } from './talkcraft';
import { Gallery, GFPS } from './gallery';
import { CATALOG, SLOT } from './gallery/all';
import { Showreel, SR_FPS, SR_TOTAL } from './gallery/showreel';
import { Showreel2, SR2_FPS, SR2_TOTAL } from './gallery/showreel2';
import { DemoClip } from './gallery/demoClip';
import { EP06, clock06 } from './episodes/ep06';
import { EP07, clock07 } from './episodes/ep07';
import { Cover06, Cover07 } from './episodes/ep06/cover';
import { Poster, POSTER_W, POSTER_H } from './poster';
import { EP13, clock13 } from './episodes/ep13';
import { EP13B, clock13b } from './episodes/ep13/v2';
import { Cover13B } from './episodes/ep13/cover';
import { EP11, clock11 } from './episodes/ep11';
import { Cover11 } from './episodes/ep11/cover';
import { ZP, ZP_FPS, ZP_H, ZP_W, zpDefault } from './zhanpeng';
// 每期一个 Composition；-P1 是只到第一件事结束的预览。
registerRoot(() => (
  <>
    <Composition id="EP02" component={EP02} width={1920} height={1080} fps={clock.fps} durationInFrames={Math.ceil(clock.total * clock.fps)} />
    <Composition id="EP02-P1" component={EP02} width={1920} height={1080} fps={clock.fps} durationInFrames={Math.ceil(clock.seg('一·律师').end * clock.fps)} />
    <Composition id="EP06" component={EP06} width={1920} height={1080} fps={clock06.fps} durationInFrames={Math.ceil(clock06.total * clock06.fps)} />
    <Composition id="EP07" component={EP07} width={1920} height={1080} fps={clock07.fps} durationInFrames={Math.ceil(clock07.total * clock07.fps)} />
    <Composition id="EP13" component={EP13} width={1920} height={1080} fps={clock13.fps} durationInFrames={Math.ceil(clock13.total * clock13.fps)} />
    <Composition id="EP13B" component={EP13B} width={1920} height={1080} fps={clock13b.fps} durationInFrames={Math.ceil(clock13b.total * clock13b.fps)} />
    <Composition id="EP11" component={EP11} width={1080} height={1920} fps={clock11.fps} durationInFrames={Math.ceil(clock11.total * clock11.fps)} />
    <Composition id="TALK01" component={TALK01} width={1080} height={1920} fps={talkClock.fps} durationInFrames={Math.ceil(talkClock.total * talkClock.fps)} />
    <Composition id="TALK02" component={TALK02} width={1080} height={1920} fps={talk2Clock.fps} durationInFrames={Math.ceil(talk2Clock.total * talk2Clock.fps)} />
    <Composition id="TALK03" component={TALK03} width={1080} height={1920} fps={talk3Clock.fps} durationInFrames={Math.ceil(talk3Clock.total * talk3Clock.fps)} />
    <Composition id="TALK03B" component={TALK03B} width={1080} height={1920} fps={talk3bClock.fps} durationInFrames={Math.ceil(talk3bClock.total * talk3bClock.fps)} />
    {/* 张展鹏科普口播：数据驱动，一个合成做所有期。scripts/zp.py render 用 --props 传每期的数据。 */}
    <Composition id="ZP" component={ZP} width={ZP_W} height={ZP_H} fps={ZP_FPS} durationInFrames={90} defaultProps={zpDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.durationInFrames)) })} />
    <Composition id="TALKCRAFT" component={Talkcraft} width={TC_W} height={TC_H + TC_BAR} fps={TC_FPS} durationInFrames={TC_TOTAL} />
    <Composition id="GALLERY" component={Gallery} width={1920} height={1080} fps={GFPS} durationInFrames={CATALOG.length * SLOT * GFPS} />
    <Composition id="SHOWREEL" component={Showreel} width={1080} height={1920} fps={SR_FPS} durationInFrames={SR_TOTAL} />
    <Composition id="SHOWREEL2" component={Showreel2} width={1080} height={1824} fps={SR2_FPS} durationInFrames={SR2_TOTAL} />
    <Composition id="DEMO-CLIP" component={DemoClip} width={1920} height={1080} fps={30} durationInFrames={240} />
    <Composition id="DEMO-CLIP-V" component={DemoClip} width={1080} height={1920} fps={30} durationInFrames={240} />
    <Still id="EP13-COVER-DOUYIN" component={Cover13B} width={1080} height={1440} />
    <Still id="EP13-COVER-SHIPINHAO" component={Cover13B} width={1080} height={1260} />
    <Still id="EP11-COVER-DOUYIN" component={Cover11} width={1080} height={1440} />
    <Still id="EP11-COVER-SHIPINHAO" component={Cover11} width={1080} height={1260} />
    <Still id="EP11-COVER-FULL" component={Cover11} width={1080} height={1920} />
    <Still id="POSTER" component={Poster} width={POSTER_W} height={POSTER_H} />
    <Still id="EP06-COVER-DOUYIN" component={Cover06} width={1080} height={1440} />
    <Still id="EP06-COVER-SHIPINHAO" component={Cover06} width={1080} height={1260} />
    <Still id="EP07-COVER-DOUYIN" component={Cover07} width={1080} height={1440} />
    <Still id="EP07-COVER-SHIPINHAO" component={Cover07} width={1080} height={1260} />
    <Still id="EP02-COVER-DOUYIN" component={Cover} width={1080} height={1440} />
    <Still id="TALK02-COVER-DOUYIN" component={Cover2} width={1080} height={1440} />
    <Still id="TALK02-COVER-SHIPINHAO" component={Cover2} width={1080} height={1260} />
    <Still id="TALK03-COVER-DOUYIN" component={Cover3} width={1080} height={1440} />
    <Still id="TALK03-COVER-SHIPINHAO" component={Cover3} width={1080} height={1260} />
    <Still id="EP02-COVER-SHIPINHAO" component={Cover} width={1080} height={1260} />
  </>
));
