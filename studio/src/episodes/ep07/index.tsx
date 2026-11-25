// 07 试片：14 秒竖屏口播，财经解读风。用来实测第三批组件（虚字、关键词光球）和署名三件套。
// 画面上的字都来自口播，没有加口播里没有的事实。版式表见 episodes/07_超级个体试片/03_制作过程/版式表.md。
import React from 'react';
import { Audio, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { useFonts } from '../../kit/kit';
import { Beat } from '../../kit/talk';
import { Card2, ChannelTag, Chest, Stage2, Subs2 } from '../../kit/talk2';
import { GhostWord, KeywordOrb, Starfield } from '../../kit/talk3';
import { Sign } from '../../kit/sign';
import timing from './timing.json';

const SLUG = 'ep07';
const SIGN = { badge: '宁少说', name: '宁少', title: '', bio: '陪伴 AI 时代的超级个体' };   // 来自 brands/ningshao/fingerprint.json；身份还没填，所以不出
export const clock = makeClock(timing as Timing);
const { at } = clock, T = (timing as Timing).total;
const FACE = { x: 563, y: 615, w: 243 };
const ORB: [number, number] = [at(4) - 0.15, at(5) - 0.15];   // 「最值得看的是两份文件」这一句：人缩成小圆，满屏光球
const beats: Beat[] = [
  { at: 0, mode: 'full', zoom: 1 },
  { at: at(2), mode: 'full', zoom: 1.16, dur: 0 },             // 「开了几场会」：推近
  { at: ORB[0], mode: 'bubble', dur: 0.3 },
  { at: ORB[1], mode: 'full', zoom: 1, dur: 0.3 },             // 回到人：胸口两张文件卡
  { at: at(7), mode: 'full', zoom: 1.16, dur: 0 },             // 「通关能不能少跑几道手续」：推近
];
export const Episode: React.FC = () => {
  useFonts();
  return (
    <ClockCtx.Provider value={clock}>
      <Stage2 src={`${SLUG}/person.mp4`} face={FACE} beats={beats} under={<Starfield from={ORB[0]} to={ORB[1]} />}>
        <GhostWord text="深圳" at={0.5} hold={1.4} top={850} />
        <KeywordOrb text="两份文件" en="TWO DOCUMENTS" from={ORB[0] + 0.1} to={ORB[1] - 0.1} cy={880} />
        {/* 文件一讲的时候，文件二先是问号；讲到文件二再揭开 */}
        <Chest from={ORB[1] + 0.2} to={at(6) - 0.05}>
          <Card2 title="中美怎么谈" tag="文件一" at={at(5)} tone="gold" w={470} h={200} />
          <Card2 title="？" tag="文件二" at={at(5) + 0.3} w={470} h={200} />
        </Chest>
        <Chest from={at(6) - 0.05} to={T + 1}>
          <Card2 title="中美怎么谈" tag="文件一" at={0} on={false} w={470} h={200} />
          <Card2 title="通关少跑手续" tag="文件二" at={at(6)} tone="gold" w={470} h={200} />
        </Chest>
        <Subs2 hot={['两份文件', '中美', '通关']} />
        <ChannelTag name={SIGN.badge} beats={beats} />
      </Stage2>
      {/* 署名：角标用骨架自带的（上面那行），这里补个人介绍和结尾简介 */}
      <Sign sign={SIGN} total={T} full={[[0, ORB[0]], [ORB[1], T]]} hookEnd={0} parts={['intro', 'bio']} hot="#F2E26B" introTop={150} />
      <Audio src={staticFile(`${SLUG}/voice.wav`)} />
    </ClockCtx.Provider>
  );
};
