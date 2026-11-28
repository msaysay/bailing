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
import { FULL02, FULL2_FPS, FULL2_FRAMES } from './episodes/full02';
import { WIDE02, wide2Clock, WIDE2_TAIL } from './episodes/wide02';
import { FX01, FX1_FRAMES } from './episodes/fx01';
import { Cover06 } from './episodes/ep06/cover';
import { SkinTalk, skinDefault } from './kit/skin';
import { CoverKit, coverDefault } from './kit/coverkit';
import { SignDemo, signDemoDefault } from './kit/sign';
import { Redtop, rtDefault } from './kit/redtop';
import { Talk3Demo, TALK3_DEMO_SEC } from './kit/talk3';
import { DepthDemo, depthDemoDefault, DEPTH_DEMOS } from './kit/depth';
import { Cover01, Cover01V } from './episodes/cover01';
import { PetDemo, PET_DEMO_SEC } from './episodes/petdemo';
import { Gallery, GFPS } from './gallery';
import { CATALOG, SLOT } from './gallery/all';
import { DemoClip } from './gallery/demoClip';
import { Registered } from './episodes/_registry';
import { HudFilm, HUD_FPS, HUD_H, HUD_W, hudDefault } from './kit/hud';
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
    <Composition id="FULL02" component={FULL02} width={1920} height={1080} fps={FULL2_FPS} durationInFrames={FULL2_FRAMES} />
    {/* 不带字幕的一版，给别的片子当素材用 */}
    <Composition id="FULL02-CLEAN" component={FULL02} width={1920} height={1080} fps={FULL2_FPS} durationInFrames={FULL2_FRAMES} defaultProps={{ clean: true }} />
    <Composition id="WIDE02" component={WIDE02} width={1920} height={1280} fps={wide2Clock.fps} durationInFrames={Math.ceil((wide2Clock.total + WIDE2_TAIL) * wide2Clock.fps)} />
    <Composition id="FX01" component={FX01} width={1920} height={1080} fps={30} durationInFrames={FX1_FRAMES} />
    <Still id="EP06-COVER-DOUYIN" component={Cover06} width={1080} height={1440} />
    <Still id="EP06-COVER-SHIPINHAO" component={Cover06} width={1080} height={1260} />
    {/* 风格配方引擎：一个合成做所有风格。scripts/skin.py render 用 --props 传数据。 */}
    <Composition id="SKIN" component={SkinTalk} width={1920} height={1080} fps={30} durationInFrames={90} defaultProps={skinDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.total * 30)), width: props.w, height: props.h })} />
    {/* 封面三件套：scripts/publish_kit.py 用 --props 传主图、文字、排法和尺寸。 */}
    <Composition id="TALK3-DEMO" component={Talk3Demo} width={1080} height={1920} fps={30} durationInFrames={TALK3_DEMO_SEC * 30} defaultProps={{}} />
    <Composition id="REDTOP" component={Redtop} width={1080} height={1920} fps={30} durationInFrames={300} defaultProps={rtDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.total * 30)) })} />
    <Composition id="SIGN-DEMO" component={SignDemo} width={1080} height={1920} fps={30} durationInFrames={900} defaultProps={signDemoDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h, durationInFrames: Math.round(props.total * 30) })} />
    <Still id="COVERKIT" component={CoverKit} width={1080} height={1440} defaultProps={coverDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h })} />
    <Still id="COVER01" component={Cover01} width={1920} height={1080} />
    <Still id="COVER01-V" component={Cover01V} width={1080} height={1440} />
    {/* 知识科普风（张展鹏式）：数据驱动，一个合成做所有期。scripts/zp.py render 用 --props 传每期的数据。相框老板风有自己的入口 src/yuedu/index.tsx。 */}
    <Composition id="ZP" component={ZP} width={ZP_W} height={ZP_H} fps={ZP_FPS} durationInFrames={90} defaultProps={zpDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.durationInFrames)) })} />
    {/* 手势全息风：数据驱动。scripts/hud.py render 用 --props 传每期的 plan。 */}
    <Composition id="HUD" component={HudFilm} width={HUD_W} height={HUD_H} fps={HUD_FPS} durationInFrames={90} defaultProps={hudDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.total * HUD_FPS)), width: props.w ?? HUD_W, height: props.h ?? HUD_H })} />
    <Composition id="DEPTH-DEMO" component={DepthDemo} width={1080} height={1920} fps={30} durationInFrames={300} defaultProps={depthDemoDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h, durationInFrames: Math.round(props.clip * 30) * DEPTH_DEMOS.length })} />
    <Composition id="PET-DEMO" component={PetDemo} width={1920} height={1080} fps={30} durationInFrames={PET_DEMO_SEC * 30} />
    <Composition id="GALLERY" component={Gallery} width={1920} height={1080} fps={GFPS} durationInFrames={CATALOG.length * SLOT * GFPS} />
    <Composition id="DEMO-CLIP" component={DemoClip} width={1920} height={1080} fps={30} durationInFrames={240} />
    <Composition id="DEMO-CLIP-V" component={DemoClip} width={1080} height={1920} fps={30} durationInFrames={240} />
    <Still id="EP02-COVER-DOUYIN" component={Cover} width={1080} height={1440} />
    <Still id="EP02-COVER-SHIPINHAO" component={Cover} width={1080} height={1260} />
  </>
));
