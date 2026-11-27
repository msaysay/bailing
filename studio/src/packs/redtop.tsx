// 红顶双标题口播风：数据驱动。scripts/redtop.py 用 --props 传 plan.json。
import React from 'react';
import { Composition } from 'remotion';
import { Redtop, rtDefault } from '../kit/redtop';
const Pack: React.FC = () => <Composition id="REDTOP" component={Redtop} width={1080} height={1920} fps={30} durationInFrames={300} defaultProps={rtDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.total * 30)) })} />;
export default Pack;
