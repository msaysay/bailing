// 底层包登记的合成：封面三件套、署名演示。都由脚本调用（publish_kit.py、sign.py）。
// 每个包在 studio/src/packs/ 里放一个这样的文件；积木版的 index.tsx 会把这个文件夹里的全部登记上，装包卸包不用改代码。
import React from 'react';
import { Composition, Still } from 'remotion';
import { CoverKit, coverDefault } from '../kit/coverkit';
import { SignDemo, signDemoDefault } from '../kit/sign';
const Pack: React.FC = () => <>
  <Still id="COVERKIT" component={CoverKit} width={1080} height={1440} defaultProps={coverDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h })} />
  <Composition id="SIGN-DEMO" component={SignDemo} width={1080} height={1920} fps={30} durationInFrames={900} defaultProps={signDemoDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h, durationInFrames: Math.round(props.total * 30) })} />
</>;
export default Pack;
