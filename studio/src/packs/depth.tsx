// 人物层次（字在人后面）工作包：DEPTH-DEMO 把每个效果在同一段人像上各放 3.5 秒。python3 scripts/matte.py demo <人物视频> 调用。
import React from 'react';
import { Composition } from 'remotion';
import { DepthDemo, depthDemoDefault, DEPTH_DEMOS } from '../kit/depth';
const Pack: React.FC = () => <Composition id="DEPTH-DEMO" component={DepthDemo} width={1080} height={1920} fps={30} durationInFrames={300} defaultProps={depthDemoDefault} calculateMetadata={({ props }) => ({ width: props.w, height: props.h, durationInFrames: Math.round(props.clip * 30) * DEPTH_DEMOS.length })} />;
export default Pack;
