import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { Bg, useFonts } from '../../kit/kit';
import { Footage, Shot } from '../../kit/footage';
import { Chrome } from '../../kit/chrome';
import timing from './timing.json';
import shots from './shots.json';
import { Part1 } from './part1';
import { Part2 } from './part2';
import { Finish } from '../../components/rich';

export const clock = makeClock(timing as Timing);
const chapters = [{ no: '01', title: '在公司内网', from: '一·2022不裁' }, { no: '02', title: '没有二号位', from: '二·图腾' }, { no: '03', title: '在华盛顿', from: '三·华盛顿' }, { no: '04', title: '市场与判断', from: '论点' }];
const B = '一·2022不裁', D = '一·1996';
// 底部字幕让位给强调字幕的行；底部字幕里要变色的词
const hero = [clock.ln(B, '为什么'), clock.ln(D, '我们离破产'), clock.ln('二·图腾', '我们离破产只有三十天'), clock.ln('二·董事会', '糟糕透顶'), clock.ln('论点', '一个人的丑闻'), clock.ln('论点', '从来没准备过'), clock.ln('业绩', '坏的不是数字'), clock.ln('判断', '他回不来')];
const hot = ['2022', '1996', '1600', '97%', '三十天', '七成人', '鲜花', '请律师', 'RIVA 128', '一百万颗', '60 人', 'COO', '二号位', '609', '650', '四个法案', '接近零', '14%', '4.34%', '三成', '220', '200', '962', '106%'];
// 音效：只给章节页、翻牌、强调句，全片克制
const sfx: [number, string, number][] = [
  [clock.say(B, '第一件事') - 0.2, 'whoosh.wav', 0.5], [clock.say(B, '得退回'), 'tick.wav', 0.35], [clock.say(B, '因为他记得'), 'tick.wav', 0.35],
  [clock.say(D, '只有三十天'), 'thud.wav', 0.5], [clock.say('一·律师', '董事会在写') + 1.5, 'thud.wav', 0.45],
  [clock.say('二·图腾', '第二件事') - 0.2, 'whoosh.wav', 0.5], [clock.say('二·没有二号位', '不设 COO') + 0.35, 'tick.wav', 0.35], [clock.say('二·没有二号位', '没有二号位') + 0.35, 'tick.wav', 0.35],
  [clock.say('二·董事会', '糟糕透顶'), 'thud.wav', 0.5], [clock.say('三·华盛顿', '第三件事') - 0.2, 'whoosh.wav', 0.5], [clock.say('三·华盛顿', '远程调用') + 1.3, 'thud.wav', 0.5],
  [clock.say('论点', '没有他'), 'thud.wav', 0.5], [clock.say('市场', '220') - 0.2, 'tick.wav', 0.35], [clock.say('市场', '200') - 0.2, 'tick.wav', 0.35], [clock.say('判断', '他回不来'), 'thud.wav', 0.5],
];
export const EP02: React.FC = () => {
  useFonts();
  return (
    <ClockCtx.Provider value={clock}>
      <AbsoluteFill>
        <Bg /><Footage shots={shots as Shot[]} dir="ep02/footage" /><Part1 /><Part2 /><Chrome chapters={chapters} hideBarBefore={clock.say(B, '第一件事') + 1.6} hero={hero} hot={hot} /><Finish />
        {sfx.map(([t, f, v], i) => <Sequence key={i} from={Math.round(t * clock.fps)} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
        <Audio src={staticFile('ep02/voice.wav')} />
        <Audio src={staticFile('ep02/bgm.mp3')} volume={(f) => 0.3 * Math.min(1, f / 45) * Math.min(1, Math.max(0, (clock.total * clock.fps - f) / 60))} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
