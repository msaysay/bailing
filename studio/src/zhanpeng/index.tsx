// 张展鹏科普口播模板：楷体白字幕、红色钩子、插画加跟着头走的羽化头像、黄色楷体关键词。
// 风格全部锁在这个目录里，每期只换数据：scripts/zp.py board 生成 props，渲染时用 --props 传进来。
// 对标拆解和每个数值的出处见 .claude/skills/zhanpeng-talk/references/style-spec.md。
import React from 'react';
import {AbsoluteFill, Audio, Sequence, continueRender, delayRender, staticFile} from 'remotion';
import {Base} from './Base';
import {Captions} from './Captions';
import {OverlayLayer} from './Overlays';
import {SceneLayer} from './Scenes';
import type {StoryProps} from './types';
import theme from './theme.json';

export const ZP_W = 1080, ZP_H = 1920, ZP_FPS = 30;
/** 按字体包加载三个角色的字体文件。都登记成常规字重，粗细靠描边（util.bold），浏览器不会再合成假粗体。 */
const useZpFonts = (fonts: StoryProps['fonts']) => {
  const [h] = React.useState(() => delayRender('zp-fonts'));
  React.useEffect(() => {
    const roles: [string, string][] = [['ZP Sub', fonts.sub.file], ['ZP Strong', fonts.strong.file], ['ZP Big', fonts.big.file]];
    Promise.all(roles.map(([family, file]) => new FontFace(family, `url(${staticFile('fonts/' + file)})`).load().then((f) => document.fonts.add(f)).catch(() => undefined))).then(() => continueRender(h));
  }, [h, fonts]);
};
/** 层次从下到上：口播人物 → 场景（插画、空镜、论文卡、黑卡）→ 字幕下面的记号 → 字幕 → 花字。 */
export const ZP: React.FC<StoryProps> = (props) => {
  useZpFonts(props.fonts);
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Base props={props} />
      <SceneLayer props={props} />
      <OverlayLayer props={props} under />
      <Captions props={props} />
      <OverlayLayer props={props} />
      <Audio src={staticFile(props.videoFile)} />
      {(props.sfx ?? []).map((x, i) => (
        <Sequence key={i} from={Math.max(0, Math.round(x.at * props.fps))} layout="none">
          <Audio src={staticFile('sfx/' + x.file)} volume={x.volume} />
        </Sequence>
      ))}
      {props.musicFile ? <Audio src={staticFile(props.musicFile)} volume={props.musicVolume} loop /> : null}
    </AbsoluteFill>
  );
};
/** 没传 props 时的样子（只为了让 Studio 能打开）。 */
export const zpDefault: StoryProps = {
  fps: ZP_FPS, width: ZP_W, height: ZP_H, durationInFrames: 90, videoFile: 'zp/person.mp4', musicFile: null, musicVolume: 0.07,
  captions: [{id: '1', text: '先运行 zp.py board', start: 0, end: 3}], camera: [{start: 0, zoom: 1, ease: false}],
  face: {x: 0.38, y: 0.18, w: 0.22, h: 0.13}, fonts: {sub: {file: 'ChillKai.ttf', stroke: 0.011}, strong: {file: 'ChillKai.ttf', stroke: 0.018}, big: {file: 'ChillKai.ttf', stroke: 0.016}}, scenes: [], overlays: [], theme: theme as StoryProps['theme'], title: '',
};
