// 横屏深度解读风的骨架（scripts/episode.py new … --line wide 会把它复制成 studio/src/episodes/<代号>/index.tsx）。
// 每种版式和挂件怎么写，照抄 studio/src/episodes/wide01/index.tsx；位置和数值的出处见 docs/对标拆解-子祺见微.md。
// 已经接好：时钟、配音、舞台（章节导航条、频道标志条）、字幕、主持人名片。你要做的：填下面五个常量、按版式表填 beats、往 under 和舞台里放素材和挂件。
import React from 'react';
import { Audio, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { useFonts } from '../../kit/kit';
import { NameCard, Shots, WBeat, WideStage, WideSubs, useWideFonts } from '../../kit/wide';
import timing from './timing.json';

const SLUG = '__SLUG__';
export const clock = makeClock(timing as Timing);
const { at } = clock;
const CHANNEL = '频道名';                                   // 底部标志条上的频道名
const HOST = { name: '主持人', title: '一行身份' };          // 名片版式里的名字和身份
const FACE = { x: 960, y: 330, w: 200 };                   // 人脸在 1920×1080 人物视频里的中心和宽度，talk_prep.py transcribe 会打印
// 章节导航条：「前言」+ 四到六章 + 「结语」，每章名字八个字左右、中间空一格（「大国博弈 金融为核」）。chapterAt 是每章从哪一行开始。
const CHAPTERS = ['前言', '结语'];
const CHAPTER_AT = [0, clock.total - 0.1];
// 版式时间表：full 主持人全景 / side 主持人加右侧素材窗 / card 左素材窗加主持人名片 / circle 满屏素材加右上圆头像 / avatar 满屏素材加左侧小头像 / off 人不在。
// 目标：full 和 side 合起来三成到四成，card、circle、avatar 合起来一成半到两成，off 四成到五成半；平均九到十二秒换一次版式。
const beats: WBeat[] = [{ at: 0, mode: 'full', zoom: 1 }];
export const Episode: React.FC = () => {
  useFonts(); useWideFonts();
  return (
    <ClockCtx.Provider value={clock}>
      <WideStage src={`${SLUG}/person.mp4`} face={FACE} beats={beats} channel={CHANNEL} chapters={CHAPTERS} chapterAt={CHAPTER_AT}
        under={<>
          {/* 满屏素材、画框素材、数据面板放这里。例：
              <Shots area="full" until={at(9)} shots={[{ src: `${SLUG}/footage/a.mp4`, at: at(6) }, { src: `${SLUG}/footage/b.jpg`, at: at(7), credit: '画面：来源 · 日期' }]} /> */}
        </>}>
        {/* 压在主持人上面的：右侧或左侧素材窗（Shots area="right" / "left"）、TitleCard、SideBanner、TopicTag、PopWord，见 wide01 */}
        <NameCard beats={beats} name={HOST.name} title={HOST.title} />
        <WideSubs />
      </WideStage>
      <Audio src={staticFile(`${SLUG}/voice.wav`)} />
    </ClockCtx.Provider>
  );
};
void Shots; void at;
