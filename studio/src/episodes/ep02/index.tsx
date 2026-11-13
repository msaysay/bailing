import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { Bg, useFonts } from '../../kit/kit';
import { Footage, Shot } from '../../kit/footage';
import { Chrome } from '../../kit/chrome';
import timing from './timing.json';
import shots from './shots.json';
import { Part1 } from './part1';

export const clock = makeClock(timing as Timing);
const chapters = [{ no: '01', title: '在公司内网', from: '一·2022不裁' }, { no: '02', title: '没有二号位', from: '二·图腾' }, { no: '03', title: '在华盛顿', from: '三·华盛顿' }];
export const EP02: React.FC = () => {
  useFonts();
  return (
    <ClockCtx.Provider value={clock}>
      <AbsoluteFill>
        <Bg /><Footage shots={shots as Shot[]} dir="ep02/footage" /><Part1 /><Chrome chapters={chapters} hideBarBefore={clock.say('一·2022不裁', '第一件事') + 1.6} />
        <Audio src={staticFile('ep02/voice.wav')} />
        <Audio src={staticFile('ep02/bgm.mp3')} volume={(f) => 0.3 * Math.min(1, f / 45)} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
