// 《短视频剪辑正式进入 AI 时代》横屏深度解读风（子祺式）版，1920×1280，约 51 秒。
// 原片是远景（脸宽约 108 像素），主持人全景一律放大：平时 1.8 倍，强调句 2.25 倍，结尾露环境 1.4 倍；换景别正好盖住剪口和收气口。
// 先跑同目录 prep.py 出 person.mp4、voice.wav、timing.json、cuts.json；素材放 studio/public/wide02/footage/（不进仓库）。
import React from 'react';
import { AbsoluteFill, Audio, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { useFonts } from '../../kit/kit';
import { DataPanel, NameCard, PopWord, Shots, SideBanner, TitleCard, TopicTag, WBeat, WideStage, WideSubs, useWideFonts } from '../../kit/wide';
import timing from './timing.json';

export const wide2Clock = makeClock(timing as Timing);
const { at, total } = wide2Clock;
export const WIDE2_TAIL = 2.6;
const FACE = { x: 957, y: 434, w: 108 };
const F = (f: string) => `wide02/footage/${f}`;
const Z1 = 1.8, Z2 = 2.25, ZW = 1.4;
const CH = ['前言', '千万大V 联手打磨', '不靠剪映 一句成片', '动嘴就改 自动加效', '蒸馏博主 持续进化', '结语'];
const chapAt = (k: number) => wide2Clock.segments[k].start;

// 版式时间表。行号见 prep.py 打印的字幕表。
const beats: WBeat[] = [
  { at: 0, mode: 'full', zoom: Z1 },
  { at: at(2, 'AI'), mode: 'full', zoom: Z2, dur: 0 },                 // 「AI 时代」推近
  { at: at(3) - 0.1, mode: 'side', zoom: 1 },                           // 这条视频：右侧窗放成片
  { at: at(5), mode: 'full', zoom: Z2, dur: 0 },                        // 段间剪口，换景别
  { at: 8.467, mode: 'full', zoom: Z1, dur: 0 },                        // 收气口
  { at: at(8) - 0.05, mode: 'off' },                                    // 章一标题卡 → 数据面板
  { at: at(9) - 0.1, mode: 'card' },                                    // 左窗 + 名片
  { at: at(11) - 0.05, mode: 'full', zoom: Z1 },                        // 章二：有人问我
  { at: 16.6, mode: 'full', zoom: Z2, dur: 0 },                         // 「我想说的是」推近
  { at: 17.367, mode: 'full', zoom: Z1, dur: 0 },
  { at: 19.3, mode: 'side', zoom: 1 },                                  // 一句话剪出来：右侧窗放 AI 助手
  { at: at(18) - 0.05, mode: 'off' },                                   // 过去这样这样的特效：满屏
  { at: at(20) - 0.1, mode: 'circle' },                                 // 月薪还很贵
  { at: at(21) - 0.05, mode: 'card' },                                  // 现在普通人用 WorkBuddy、Codex
  { at: at(24) - 0.05, mode: 'side', zoom: 1 },                         // 章三：跟 AI 说一句
  { at: 31.967, mode: 'side', zoom: 1.35, dur: 0 },
  { at: 32.867, mode: 'side', zoom: 1, dur: 0 },
  { at: at(27) - 0.05, mode: 'circle' },                                // AI 自动判断加动效
  { at: at(29) - 0.05, mode: 'avatar' },                                // 章四：蒸馏头部博主
  { at: at(32) - 0.05, mode: 'full', zoom: Z2 },                        // 持续迭代
  { at: at(33) - 0.05, mode: 'full', zoom: ZW },                        // 结语：露环境
  { at: at(34) - 0.05, mode: 'full', zoom: Z1, dur: 0 },
  { at: at(36) - 0.1, mode: 'card' },                                   // 我是宁少：名片
  { at: total, mode: 'off' },
];

export const WIDE02: React.FC = () => {
  useFonts(); useWideFonts();
  return (
    <ClockCtx.Provider value={wide2Clock}>
      <WideStage src="wide02/person.mp4" face={FACE} beats={beats} channel="宁少 AI 进化论"
        chapters={CH} chapterAt={[0, chapAt(1), chapAt(2), chapAt(3), chapAt(4), chapAt(5)]}
        under={<>
          <DataPanel title="联手打磨" from={at(8) + 0.8} to={at(9) - 0.15} items={[{ label: '合作大V · 粉丝量级', value: 1000, unit: '万+', at: at(8) + 0.85, icon: '👥' }]} />
          <Shots area="full" until={at(21) - 0.1} shots={[
            { src: F('hud.mp4'), at: at(18) - 0.05, startFrom: 3.3 },
            { src: F('hud.mp4'), at: at(18, '这样'), startFrom: 7.4 },
            { src: F('hud.mp4'), at: at(18, '这样') + 0.42, startFrom: 13.6 },
            { src: F('hud.mp4'), at: at(18, '这样') + 0.84, startFrom: 16.6 },
            { src: F('hud.mp4'), at: at(19), startFrom: 10.4 },
            { src: F('hud.mp4'), at: at(19) + 0.9, startFrom: 12.6 },
            { src: F('hud.mp4'), at: at(20) - 0.1, startFrom: 5.0 },
            { src: F('hud.mp4'), at: at(20) + 0.9, startFrom: 14.8 },
          ]} />
          <Shots area="full" until={at(29) - 0.1} shots={[
            { src: F('full02c.mp4'), at: at(27) - 0.05, startFrom: 25.5 },
            { src: F('hud.mp4'), at: at(27) + 0.9, startFrom: 9.6 },
            { src: F('full02c.mp4'), at: at(28), startFrom: 24.8 },
            { src: F('hud.mp4'), at: at(28) + 1.0, startFrom: 8.2 },
          ]} />
          <Shots area="full" until={at(32) - 0.1} shots={[
            { src: F('tpl-xiaolin.jpg'), at: at(29) - 0.05 },
            { src: F('tpl-ziqi.jpg'), at: at(29) + 0.95 },
            { src: F('tpl-zhanpeng.jpg'), at: at(30) },
            { src: F('tpl-danjie.jpg'), at: at(30) + 0.9 },
            { src: F('three.jpg'), at: at(31) - 0.05, fit: 'contain' },
          ]} />
        </>}>
        <PopWord text="AI 时代" at={at(2, 'AI')} until={at(3) - 0.15} x={1180} y={250} color="#F7E3A1" />
        <Shots area="right" until={at(5) - 0.1} shots={[{ src: F('full02c.mp4'), at: at(3) - 0.05, startFrom: 0.6 }, { src: F('hud.mp4'), at: at(4), startFrom: 7.6 }]} />
        <PopWord text="开源" at={at(7, '开源')} until={at(8) - 0.1} x={1250} y={300} size={170} />
        <TitleCard text={CH[1]} en="Co-created With Top Creators" at={at(8) - 0.05} hold={0.75} />
        <Shots area="left" until={at(11) - 0.15} shots={[{ src: F('tpl-danjie.jpg'), at: at(9) - 0.05 }, { src: F('full02c.mp4'), at: at(10), startFrom: 25.0 }]} />
        <TitleCard text={CH[2]} en="One Sentence, One Film" at={at(11) - 0.05} hold={0.75} />
        <PopWord text="剪映？" at={at(13, '剪映')} until={at(14) - 0.1} x={1220} y={280} color="#FF8A6A" size={150} />
        <PopWord text="为什么还需要" at={at(15, '为什么')} until={at(16) - 0.15} x={1080} y={260} size={110} />
        <Shots area="right" until={at(18) - 0.1} shots={[{ src: F('onekey.jpg'), at: 19.3, fit: 'contain' }, { src: F('full02c.mp4'), at: at(17), startFrom: 1.6 }]} />
        <SideBanner text="专业剪辑师" from={at(19)} to={at(20) - 0.15} />
        <Shots area="left" until={at(24) - 0.15} shots={[{ src: F('options.jpg'), at: at(21) - 0.05, fit: 'contain' }, { src: F('onekey.jpg'), at: at(22), fit: 'contain' }, { src: F('full02c.mp4'), at: at(23, '一键'), startFrom: 2.6 }]} />
        <TitleCard text={CH[3]} en="Just Tell The AI" at={at(24) - 0.05} hold={0.6} />
        <Shots area="right" until={at(27) - 0.1} shots={[{ src: F('step.jpg'), at: at(24) + 0.6, fit: 'contain' }, { src: F('terminal.jpg'), at: at(25), fit: 'contain' }, { src: F('options.jpg'), at: at(26), fit: 'contain' }]} />
        <TitleCard text={CH[4]} en="Distilled From The Best" at={at(29) - 0.05} hold={0.7} />
        <TopicTag text="蒸馏 · 头部博主风格" from={at(29) + 0.7} to={at(32) - 0.15} />
        <PopWord text="持续迭代" at={at(32, '迭代')} until={at(33) - 0.1} x={1160} y={280} size={140} />
        <PopWord text="评论区打「工作流」" at={at(35)} until={at(36) - 0.15} x={900} y={250} size={100} color="#F7E3A1" />
        <Shots area="left" until={total + 0.1} shots={[{ src: F('hud.mp4'), at: at(36) - 0.15, startFrom: 4.2 }, { src: F('full02c.mp4'), at: at(37), startFrom: 23.0 }]} />
        <NameCard beats={beats} name="宁少" title={'宁少 AI 进化论\n陪伴 AI 时代的超级个体'} />
        <TitleCard text="评论区打 工作流" en="Get The Workflow" at={total} hold={WIDE2_TAIL} lines={['核心工作流 开源给大家']} />
        <WideSubs />
      </WideStage>
      <Audio src={staticFile('wide02/voice.wav')} />
    </ClockCtx.Provider>
  );
};
