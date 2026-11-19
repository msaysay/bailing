// talkcraft 动效卡预览：108 张卡按分类连着播，底部一条写编号、中文名、分类和文件名。
// 卡片来自 vendor/video-talkcraft（PolyForm Noncommercial，仅限非商用）。单张取用：import Card from './cards/<slug>'。
import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { TC_CARDS } from './registry';

export const TC_W = 960, TC_H = 540, TC_BAR = 56, TC_FPS = 30;
export const TC_STARTS: number[] = []; let acc = 0; TC_CARDS.forEach((c) => { TC_STARTS.push(acc); acc += c.meta.durationInFrames; });
export const TC_TOTAL = acc;
export const Talkcraft: React.FC = () => (
  <AbsoluteFill style={{ background: '#0B0E14' }}>
    {TC_CARDS.map((c, i) => (
      <Sequence key={c.slug} from={TC_STARTS[i]} durationInFrames={c.meta.durationInFrames}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: TC_W, height: TC_H, overflow: 'hidden' }}>
          <div style={{ width: c.meta.width, height: c.meta.height, transform: `scale(${Math.min(TC_W / c.meta.width, TC_H / c.meta.height)})`, transformOrigin: 'left top', position: 'relative' }}><c.Comp /></div>
        </div>
        <div style={{ position: 'absolute', left: 0, top: TC_H, width: TC_W, height: TC_BAR, background: '#0B0E14', color: '#F3F1EA', fontFamily: 'MiSans, "WenQuanYi Zen Hei", sans-serif', display: 'flex', alignItems: 'center', gap: 16, padding: '0 20px', boxSizing: 'border-box', fontSize: 22 }}>
          <span style={{ color: '#5B9BFF', fontWeight: 900 }}>{String(i + 1).padStart(3, '0')}</span><span style={{ fontWeight: 900 }}>{c.zh}</span><span style={{ color: '#8A93A6', fontSize: 18 }}>{c.cat} · cards/{c.slug}.tsx</span>
        </div>
      </Sequence>
    ))}
  </AbsoluteFill>
);
