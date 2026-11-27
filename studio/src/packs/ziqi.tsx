// 横屏深度解读风：WIDE01 是版式演示（没带原片，只用来照抄写法）。
import React from 'react';
import { Composition } from 'remotion';
import { WIDE01, wide1Clock } from '../episodes/wide01';
const Pack: React.FC = () => <Composition id="WIDE01" component={WIDE01} width={1920} height={1280} fps={wide1Clock.fps} durationInFrames={Math.ceil(wide1Clock.total * wide1Clock.fps)} />;
export default Pack;
