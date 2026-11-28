// 网格取景框口播风（对标直男财经）：数据驱动。scripts/zhinan.py 用 --props 传 plan.json。
import React from 'react';
import { Composition } from 'remotion';
import { Zhinan, znDefault } from '../kit/zhinan';
const Pack: React.FC = () => <Composition id="ZHINAN" component={Zhinan} width={1080} height={1920} fps={30} durationInFrames={300} defaultProps={znDefault} calculateMetadata={({ props }) => ({ durationInFrames: Math.max(1, Math.round(props.total * 30)) })} />;
export default Pack;
