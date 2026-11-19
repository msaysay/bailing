// 财经解读风第二版的版式演示：16 秒里把 kit/talk2.tsx 的每种版式和挂件各用一遍。排新片时照着抄。
// 人物视频和素材不进仓库：把任意一条竖屏口播裁成 1080×1620 放到 studio/public/talk02/person.mp4，
// 六张横图放到 studio/public/talk02/footage/c0.jpg … c5.jpg 就能渲染。
import React from 'react';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { useFonts } from '../../kit/kit';
import { Beat } from '../../kit/talk';
import { Band, BandQuote, BandStat, BigWord, Card2, ChannelTag, ChapterTag, Chest, HeadSide, Panel, Progress, SideTitle, Stage2, Subs2 } from '../../kit/talk2';
import timing from './timing.json';

export const talk2Clock = makeClock(timing as Timing);
const { at } = talk2Clock;
const FACE = { x: 541, y: 751, w: 209 };
// 版式时间表。剪口处换景别（zoom）或换版式；full ↔ bubble 用 0.3 秒过渡，景别用硬切。
const beats: Beat[] = [
  { at: 0, mode: 'full', zoom: 1 },
  { at: at(2), mode: 'full', zoom: 1.18, dur: 0 },          // 「一共是三种」：推近
  { at: at(3) - 0.15, mode: 'bubble', dur: 0.3 },            // 素材带
  { at: at(5) - 0.15, mode: 'full', zoom: 1, dur: 0.3 },     // 回到人，头两侧贴两个人
  { at: at(6) - 0.15, mode: 'bubble', dur: 0.3 },            // 素材带 + 大数字
  { at: at(7) - 0.1, mode: 'off', dur: 0.2 },                // 关键词大字，人不在
  { at: at(8) - 0.15, mode: 'bubble', dur: 0.3, box: [400, 300, 280, 280] },   // 主题面板，小圆挪到面板里
];
export const TALK02: React.FC = () => {
  useFonts();
  return (
    <ClockCtx.Provider value={talk2Clock}>
      <Stage2 src="talk02/person.mp4" face={FACE} beats={beats}
        under={<>
          <Band until={at(5) - 0.1} clips={[{ src: 'talk02/footage/c0.jpg', at: at(3) - 0.1, fit: 'contain' }, { src: 'talk02/footage/c1.jpg', at: at(3) + 1 }, { src: 'talk02/footage/c2.jpg', at: at(4), credit: '画面：示例来源 · 2026-04' }]} />
          <Band until={at(7) - 0.1} clips={[{ src: 'talk02/footage/c3.jpg', at: at(6) - 0.1 }, { src: 'talk02/footage/c4.jpg', at: at(6) + 1 }]} />
          <Panel from={at(8) - 0.1} to={16.5} tone="dark" />
        </>}>
        {/* 人全屏：胸口一排卡片，逐张弹出 */}
        <Chest from={0.2} to={at(3) - 0.2}>
          <Card2 title="玩法一" tag="基础版" at={0.4} />
          <Card2 title="玩法二" tag="Pro 版" at={0.8} tone="green" />
          <Card2 title="玩法三" tag="顶配" at={1.2} tone="gold" />
        </Chest>
        {/* 素材带：左上竖排大标题、右半边引语 */}
        <SideTitle text="太空旅游" en="Space Tourism" from={at(3)} to={at(5) - 0.2} />
        <BandQuote lines={['当时大家都说', '这是未来。']} at={[at(4), at(4) + 0.6]} from={at(4)} to={at(5) - 0.2} />
        {/* 人全屏：头两侧各贴一个人，说到谁谁亮 */}
        <HeadSide side="left" name="甲方" tag="蓝色起源" from={at(5)} to={at(6) - 0.2} on={[[at(5), at(5) + 1]]} />
        <HeadSide side="right" name="乙方" tag="维珍银河" from={at(5) + 0.2} to={at(6) - 0.2} on={[[at(5) + 1, at(6)]]} />
        {/* 这一章的角标 + 素材带上的大数字 + 字幕下面的进度牌 */}
        <ChapterTag title="维珍银河" badge="基础版" from={at(6)} to={at(7) - 0.2} />
        <BandStat label="订单下降" value="13" unit="%" source="来源：示例研究 · 2026" from={at(6) + 0.9} to={at(7) - 0.2} />
        <Progress items={['维珍银河', '蓝色起源', 'Axiom']} steps={[at(5), at(6) + 1]} shows={[[at(5), at(7) - 0.2]]} beats={beats} />
        <BigWord text="太空旅游 争霸" sub="THE SPACE TOURISM RACE" at={at(7)} hold={1.5} />
        {/* 主题面板：深色底上摆卡片，人是小圆 */}
        <div style={{ position: 'absolute', left: 90, top: 640, display: 'flex', gap: 30, alignItems: 'flex-start' }}>
          {timing.total > 0 && <><Card2 title="维珍银河" tag="基础版" at={at(8) + 0.1} w={420} h={520} /><Card2 title="45 万" sub="美元 / 人" at={at(8) + 0.6} tone="gold" w={300} h={190} /></>}
        </div>
        <Subs2 hide={[7]} />
        <ChannelTag name="频道名" beats={beats} />
      </Stage2>
    </ClockCtx.Provider>
  );
};
