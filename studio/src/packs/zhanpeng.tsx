// 知识科普风：数据驱动，一个合成做所有期。scripts/zp.py render 用 --props 传数据。
import React from 'react';
import { Composition } from 'remotion';
import { ZP, ZP_FPS, ZP_H, ZP_W, zpDefault } from '../zhanpeng';
const Pack: React.FC = () => <Composition id="ZP" component={ZP} width={ZP_W} height={ZP_H} fps={ZP_FPS} durationInFrames={90} defaultProps={zpDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.durationInFrames)) })} />;
export default Pack;
