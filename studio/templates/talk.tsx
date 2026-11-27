// 竖屏口播骨架 · 财经解读风第二版（scripts/episode.py new 会把它复制成 studio/src/episodes/<代号>/index.tsx）。
// 每种版式和挂件怎么写，照抄 studio/src/episodes/talk02/index.tsx；位置和数值的出处见 docs/对标拆解-小Lin口播.md。
// 已经接好：时钟、配音、人物舞台、字幕、频道角标。你要做的：填 FACE、按版式表填 beats、往 under 里放素材带、往舞台里放卡片和挂件。
import React from 'react';
import { Audio, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { useFonts } from '../../kit/kit';
import { Beat } from '../../kit/talk';
import { Band, ChannelTag, Stage2, Subs2 } from '../../kit/talk2';
import { Sign, fullOf } from '../../kit/sign';
import timing from './timing.json';

const SLUG = '__SLUG__';
// 署名三件套（用户在开工单里填的；留空的那样不出）：badge 角标（底边正中的小牌子，只在人全屏时在）、name + title 个人介绍（开头出 4 秒）、bio 简介（结尾才出）。规矩见 docs/署名规则.md
const SIGN = { badge: '', name: '', title: '', bio: '' };
export const clock = makeClock(timing as Timing);
const { at } = clock;
const FACE = { x: 540, y: 620, w: 300 };   // 人脸在剪好的人物视频（1080×1620）里的中心和宽度，talk_prep.py transcribe 会打印
// 版式时间表：full 人全屏 / bubble 右上小圆（配素材带或主题面板）/ off 人不在（关键词大字）。时间用 at(行号, '词')，不写秒数。
// 目标：人全屏 30% 到 45%，小圆 40% 到 55%；人全屏一段 4 秒左右，每个剪口换景别（zoom 1 ↔ 1.18，dur: 0）或换版式。
const beats: Beat[] = [{ at: 0, mode: 'full', zoom: 1 }];
export const Episode: React.FC = () => {
  useFonts();
  return (
    <ClockCtx.Provider value={clock}>
      <Stage2 src={`${SLUG}/person.mp4`} face={FACE} beats={beats}
        under={<>
          {/* 素材带：每段一个 <Band>，clips 里约两秒一个画面。例：
              <Band until={at(9)} clips={[{ src: `${SLUG}/footage/a.mp4`, at: at(6) }, { src: `${SLUG}/footage/b.jpg`, at: at(7), credit: '画面：来源 · 日期' }]} /> */}
        </>}>
        {/* 卡片和挂件：Chest + Card2、Progress、ChapterTag、SideTitle、HeadSide、BandQuote、BandStat、BigWord，见 talk02 */}
        <Subs2 />
        {SIGN.badge && <ChannelTag name={SIGN.badge} beats={beats} />}
      </Stage2>
      <Sign sign={SIGN} total={(timing as Timing).total} full={fullOf(beats, (timing as Timing).total)} hookEnd={0} parts={['intro', 'bio']} hot="#F2E26B" introTop={150} />
      <Audio src={staticFile(`${SLUG}/voice.wav`)} />
    </ClockCtx.Provider>
  );
};
void Band;
