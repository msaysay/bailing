import React from 'react';
import { AbsoluteFill, Audio, Composition, registerRoot, staticFile } from 'remotion';
import { FPS, TOTAL } from './lib';
import { Bg, Chrome, useFonts } from './kit';
import { S1, S2, S3, S4 } from './scenes/A';
import { S5, S6, S7, S8, S9 } from './scenes/B';

const Episode: React.FC = () => {
  useFonts();
  return (
    <AbsoluteFill>
      <Bg /><S1 /><S2 /><S3 /><S4 /><S5 /><S6 /><S7 /><S8 /><S9 /><Chrome />
      <Audio src={staticFile('voice.wav')} />
    </AbsoluteFill>
  );
};
registerRoot(() => <Composition id="EP01" component={Episode} width={1920} height={1080} fps={FPS} durationInFrames={Math.ceil(TOTAL * FPS)} />);
