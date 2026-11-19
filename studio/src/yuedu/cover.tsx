// 封面（1080×1440）：纸纹底、三行标题、一帧人物、署名。props 和成片是同一份，多一个 coverAt（取人物视频的第几秒）。
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, staticFile, Freeze, useVideoConfig } from 'remotion';
import { FrameProps } from './frame';
import { K, SANS, SERIF, useFonts } from './base';

export const Cover: React.FC<FrameProps & { coverAt?: number }> = (p) => {
  useFonts();
  const { fps } = useVideoConfig(), m = p.media, s = (1080 / m.vw) * 1.18, vw = m.vw * s, vh = m.vh * s;
  const left = Math.min(0, Math.max(1080 - vw, 540 - m.face.x * s)), top = Math.min(0, Math.max(760 - vh, 250 - m.face.y * s));
  const fit = (x: string, max: number, room: number) => Math.min(max, Math.floor(room / Math.max(1, x.length - 1)));
  return (
    <AbsoluteFill style={{ background: K.paper }}>
      <Img src={staticFile(m.plate)} style={{ position: 'absolute', left: 0, top: 0, width: 1080, height: 1920 }} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 96, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, color: K.ink, fontSize: fit(p.title[0], 84, 960), whiteSpace: 'nowrap', letterSpacing: 2 }}>{p.title[0]}</div>
      <div style={{ position: 'absolute', left: 130, right: 130, top: 232, height: 124, borderRadius: 30, background: `linear-gradient(180deg, #F4BC3D, ${K.yellow})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 900, color: '#fff', fontSize: fit(p.title[1], 84, 760), letterSpacing: 8, whiteSpace: 'nowrap', textShadow: '0 3px 0 rgba(170,110,0,.35)' }}>{p.title[1]}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 388, textAlign: 'center', fontFamily: SERIF, fontWeight: 900, color: K.ink, fontSize: fit(p.title[2], 84, 1000), whiteSpace: 'nowrap', letterSpacing: 2 }}>{p.title[2]}</div>
      <div style={{ position: 'absolute', left: 0, top: 540, width: 1080, height: 760, overflow: 'hidden', background: '#111' }}>
        {m.person ? <Freeze frame={0}><OffthreadVideo src={staticFile(m.person)} muted startFrom={Math.round((p.coverAt ?? 0) * fps)} style={{ position: 'absolute', left, top, width: vw, height: vh, maxWidth: 'none' }} /></Freeze> : null}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 1326, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: 60, color: K.greenDeep, letterSpacing: 6 }}>{p.speaker.name}</div>
        <div style={{ width: 3, height: 58, background: K.greenDeep, margin: '0 22px 0 16px' }} />
        <div style={{ fontFamily: SANS, fontSize: 27, color: '#2E3A30', lineHeight: 1.3 }}>{p.speaker.titles.slice(0, 2).map((x, i) => <div key={i}>{x}</div>)}</div>
        <Img src={staticFile(m.logo)} style={{ width: 70, height: 72, marginLeft: 22 }} />
      </div>
    </AbsoluteFill>
  );
};
