import React from 'react';
import { Composition, Still, registerRoot } from 'remotion';
import { Zhinan, znDefault } from './kit/zhinan';
import { CoverKit, coverDefault } from './kit/coverkit';
// 这个包只有一种风格：ZHINAN 是成片（由 plan.json 驱动），COVERKIT 是封面。都由 scripts/zhinan.py 调用，不用手动渲。
registerRoot(() => <>
  <Composition id="ZHINAN" component={Zhinan} width={1080} height={1920} fps={30} durationInFrames={300} defaultProps={znDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.total * 30)) })} />
  <Still id="COVERKIT" component={CoverKit} width={1080} height={1440} defaultProps={coverDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h })} />
</>);
