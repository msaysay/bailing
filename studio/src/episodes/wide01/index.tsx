// 横屏深度解读风的版式演示：24 秒里把 kit/wide.tsx 的每种版式和挂件各用一遍。排新片时照着抄。
// 主持人视频和素材不进仓库：把任意一条横屏口播转成 1920×1080 放到 studio/public/wide01/person.mp4，
// 八张横图放到 studio/public/wide01/footage/c0.jpg … c7.jpg 就能渲染。
import React from 'react';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { useFonts } from '../../kit/kit';
import { CompareBars, DataPanel, NameCard, PopWord, Shots, SideBanner, TitleCard, TopicTag, WBeat, WideStage, WideSubs, useWideFonts } from '../../kit/wide';
import timing from './timing.json';

export const wide1Clock = makeClock(timing as Timing);
const { at } = wide1Clock;
const FACE = { x: 938, y: 312, w: 204 };
const F = (i: number) => `wide01/footage/c${i}.jpg`;
// 版式时间表。目标：主持人全景（含右侧素材窗）三成到四成，小头像（名片、圆、小方）一成半到两成，人不在四成到五成半。
const beats: WBeat[] = [
  { at: 0, mode: 'full', zoom: 1 },                      // 开场：主持人全景，直接抛问题
  { at: at(2), mode: 'full', zoom: 1.2, dur: 0 },        // 推近
  { at: at(3) - 0.15, mode: 'off' },                     // 满屏素材，两秒一换
  { at: at(4) - 0.15, mode: 'off' },                     // 大字标题卡
  { at: at(5) - 0.15, mode: 'off' },                     // 数据面板
  { at: at(7) - 0.15, mode: 'off' },                     // 画框素材
  { at: at(8) - 0.15, mode: 'side', zoom: 1 },           // 主持人 + 右侧素材窗
  { at: at(9) - 0.15, mode: 'circle' },                  // 满屏素材 + 右上圆头像
  { at: at(10) - 0.15, mode: 'card' },                   // 左素材窗 + 主持人名片
  { at: at(11) - 0.15, mode: 'off' },                    // 竖幅 + 满屏素材
  { at: at(12) - 0.15, mode: 'avatar' },                 // 话题角标 + 小头像
];
export const WIDE01: React.FC = () => {
  useFonts(); useWideFonts();
  return (
    <ClockCtx.Provider value={wide1Clock}>
      <WideStage src="wide01/person.mp4" face={FACE} beats={beats} channel="频道名"
        chapters={['前言', '大国博弈 金融为核', '产能强势 错配尚存', '告别追赶 转向引领', '结语']} chapterAt={[0, at(5), at(8), at(11), 23]}
        under={<>
          <Shots area="full" until={at(4) - 0.1} shots={[{ src: F(0), at: at(3) - 0.1 }, { src: F(1), at: at(3) + 1 }]} />
          <DataPanel title="中国制造" from={at(5) - 0.1} to={at(6) - 0.1} items={[{ label: '电动车 · 全球份额', value: 60, unit: '%', at: at(5), icon: '🚗' }]} />
          <CompareBars title="工业产值" note="超过了美日德的总和" from={at(6)} to={at(7) - 0.1} rows={[{ name: '中国', value: 4.7 }, { name: '美日德', value: 4.5, color: 'linear-gradient(90deg,#3E6FB8,#C24A4A)' }]} />
          <Shots area="framed" until={at(8) - 0.1} shots={[{ src: F(2), at: at(7) - 0.1 }, { src: F(3), at: at(7) + 1 }]} />
          <Shots area="full" until={at(10) - 0.1} shots={[{ src: F(4), at: at(9) - 0.1 }, { src: F(5), at: at(9) + 1 }]} />
          <Shots area="full" until={24.5} shots={[{ src: F(6), at: at(11) - 0.1 }, { src: F(7), at: at(11) + 1 }, { src: F(0), at: at(12) }, { src: F(4), at: at(12) + 1, credit: '画面：示例来源' }]} />
        </>}>
        <PopWord text="经济权力" at={at(2)} until={at(3) - 0.2} x={980} y={330} />
        <TitleCard text="全球博弈" en="Global Game" at={at(4)} hold={1.6} />
        <Shots area="right" until={at(9) - 0.1} shots={[{ src: F(1), at: at(8) }, { src: F(5), at: at(8) + 1 }]} />
        <Shots area="left" until={at(11) - 0.1} shots={[{ src: F(6), at: at(10) }, { src: F(2), at: at(10) + 1 }]} />
        <NameCard beats={beats} name="主持人" title={'财经与国际观察\nKNOWLEDGE BLOGGER'} />
        <SideBanner text="生产与计价的错配" from={at(11)} to={at(12) - 0.2} />
        <TopicTag text="量子科技" from={at(12)} to={24} />
        <WideSubs hide={[4]} />
      </WideStage>
    </ClockCtx.Provider>
  );
};
