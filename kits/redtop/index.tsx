import React from 'react';
import { Composition, Still, registerRoot } from 'remotion';
import { Redtop, rtDefault } from './kit/redtop';
import { CoverKit, coverDefault } from './kit/coverkit';
// 这个包只有一种风格：REDTOP 是成片（由 plan.json 驱动），COVERKIT 是封面。都由 scripts/redtop.py 调用，不用手动渲。
registerRoot(() => <>
  <Composition id="REDTOP" component={Redtop} width={1080} height={1920} fps={30} durationInFrames={300} defaultProps={rtDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.total * 30)) })} />
  <Still id="COVERKIT" component={CoverKit} width={1080} height={1440} defaultProps={coverDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h })} />
</>);
