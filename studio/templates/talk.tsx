// 竖屏口播骨架（scripts/episode.py new 会把它复制成 studio/src/episodes/<代号>/index.tsx）。完整示例见 studio/src/episodes/talk01/index.tsx。
// 已经接好：时钟、配音、人物视频舞台、字幕。你要做的：量人脸位置填 FACE，按「版式表」填 beats，在 TalkStage 里按段加卡片和素材。
import React from 'react';
import { Audio, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { useFonts } from '../../kit/kit';
import { Beat, TalkStage, TalkSubs } from '../../kit/talk';
import timing from './timing.json';

const SLUG = '__SLUG__';
export const clock = makeClock(timing as Timing);
const FACE = { x: 540, y: 620, w: 300 };   // 人脸在剪好的人物视频（1080×1620）里的中心和宽度，talk_prep.py transcribe 会打印
const beats: Beat[] = [{ at: 0, mode: 'full', zoom: 1 }];   // 版式时间表：full 全屏 / bubble 右上小圆 / card 卡片 / off 不出现
const hot: string[] = [];
export const Episode: React.FC = () => {
  useFonts();
  return (
    <ClockCtx.Provider value={clock}>
      <TalkStage src={`${SLUG}/person.mp4`} face={FACE} beats={beats}>
        {/* 在这里按段加卡片、素材（TalkClip、Lower、Plate），参考 talk01 */}
        <TalkSubs hot={hot} />
      </TalkStage>
      <Audio src={staticFile(`${SLUG}/voice.wav`)} />
    </ClockCtx.Provider>
  );
};
