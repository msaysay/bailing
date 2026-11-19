// 张展鹏科普口播模板：宋体白字幕、红色钩子、插画加羽化头像、黄色楷体关键词。
// 风格全部锁在这个目录里，每期只换数据：scripts/zp.py board 生成 props，渲染时用 --props 传进来。
// 对标拆解和每个数值的出处见 .claude/skills/zhanpeng-talk/references/style-spec.md。
import React from 'react';
import {AbsoluteFill, Audio, continueRender, delayRender, staticFile} from 'remotion';
import {Base} from './Base';
import {Captions} from './Captions';
import {OverlayLayer} from './Overlays';
import {SceneLayer} from './Scenes';
import type {StoryProps} from './types';
import theme from './theme.json';

export const ZP_W = 1080, ZP_H = 1920, ZP_FPS = 30;
// 字重按用的时候的数登记，浏览器就不会再给它合成一层假粗体。
const FONTS: [string, string, string][] = [['ZP Song', 'zp-song.ttf', '600'], ['ZP SongBlack', 'zp-song-black.ttf', '900'], ['ZP Kai', 'zp-kai.ttf', '700']];
const useZpFonts = () => {
  const [h] = React.useState(() => delayRender('zp-fonts'));
  React.useEffect(() => {
    Promise.all(FONTS.map(([family, file, weight]) => new FontFace(family, `url(${staticFile('fonts/' + file)})`, {weight}).load().then((f) => document.fonts.add(f)).catch(() => undefined))).then(() => continueRender(h));
  }, [h]);
};
/** 层次从下到上：口播人物 → 场景（插画、空镜、论文卡、黑卡）→ 字幕下面的记号 → 字幕 → 花字。 */
export const ZP: React.FC<StoryProps> = (props) => {
  useZpFonts();
  return (
    <AbsoluteFill style={{backgroundColor: '#000'}}>
      <Base props={props} />
      <SceneLayer props={props} />
      <OverlayLayer props={props} under />
      <Captions props={props} />
      <OverlayLayer props={props} />
      <Audio src={staticFile(props.videoFile)} />
      {props.musicFile ? <Audio src={staticFile(props.musicFile)} volume={props.musicVolume} loop /> : null}
    </AbsoluteFill>
  );
};
/** 没传 props 时的样子（只为了让 Studio 能打开）。 */
export const zpDefault: StoryProps = {
  fps: ZP_FPS, width: ZP_W, height: ZP_H, durationInFrames: 90, videoFile: 'zp/person.mp4', musicFile: null, musicVolume: 0.07,
  captions: [{id: '1', text: '先运行 zp.py board', start: 0, end: 3}], camera: [{start: 0, zoom: 1, ease: false}],
  face: {x: 0.38, y: 0.18, w: 0.22, h: 0.13}, scenes: [], overlays: [], theme: theme as StoryProps['theme'], title: '',
};
