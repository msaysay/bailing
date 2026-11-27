// 组件包：GALLERY 是全部组件的演示片（每个 5 秒），DEMO-CLIP 是单个组件的小样。
import React from 'react';
import { Composition } from 'remotion';
import { Gallery, GFPS } from '../gallery';
import { CATALOG, SLOT } from '../gallery/all';
import { DemoClip } from '../gallery/demoClip';
const Pack: React.FC = () => <>
  <Composition id="GALLERY" component={Gallery} width={1920} height={1080} fps={GFPS} durationInFrames={CATALOG.length * SLOT * GFPS} />
  <Composition id="DEMO-CLIP" component={DemoClip} width={1920} height={1080} fps={30} durationInFrames={240} />
  <Composition id="DEMO-CLIP-V" component={DemoClip} width={1080} height={1920} fps={30} durationInFrames={240} />
</>;
export default Pack;
