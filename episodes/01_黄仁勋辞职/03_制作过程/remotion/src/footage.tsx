// 真实画面层：每个镜头全片只用一次，垫在组件后面；图片带缓慢推近，视频静音播放。
// 素材与署名来自 01_输入素材/commons/sources.json（scripts/commons.py 下载时登记）。
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { FPS, at, mix, seg } from './lib';
import { C, FONT, useT } from './kit';
import shots from './shots.json';

type Shot = { file: string; from: string; to: string; video?: boolean; skip?: number; pos?: string; credit: string };
/** 时间写成 "seg:2" / "seg:2:end" / "line:15"，都从 timing.json 解析，不写秒数。 */
const when = (k: string): number => { const [a, b, c] = k.split(':'); return a === 'seg' ? (c === 'end' ? seg(+b).end : seg(+b).start) : at(+b) - 0.2; };
const F = 0.4;
export const Footage: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill>
      {(shots as Shot[]).map((s) => {
        const a = when(s.from), b = when(s.to);
        if (t < a - F || t > b + F) return null;
        const op = Math.min(1, (t - (a - F)) / F, (b + F - t) / F), p = (t - a) / (b - a);
        const style: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', objectPosition: s.pos ?? 'center', transform: `scale(${mix(1.04, 1.13, p)})` };
        return (
          <AbsoluteFill key={s.file} style={{ opacity: a <= 0.01 ? Math.min(1, (b + F - t) / F) : op }}>
            {s.video
              ? <Sequence from={Math.max(0, Math.round((a - F) * FPS))} layout="none"><OffthreadVideo src={staticFile('footage/' + s.file)} muted startFrom={Math.round((s.skip ?? 0) * FPS)} style={{ ...style, transform: undefined }} /></Sequence>
              : <Img src={staticFile('footage/' + s.file)} style={style} />}
            <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(8,11,17,.62) 0%, rgba(8,11,17,.74) 55%, rgba(8,11,17,.93) 100%)' }} />
            <div style={{ position: 'absolute', left: 72, bottom: 26, fontFamily: FONT, fontSize: 18, color: C.muted }}>画面：{s.credit}</div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
