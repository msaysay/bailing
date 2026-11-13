// 真实画面层：每个镜头全片只用一次，垫在组件后面。old 的镜头做旧并标「资料画面」。
import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { useClock } from './clock';
import { C, FONT, useT } from './kit';
export type Shot = { file: string; from: string; to: string; credit: string; old?: boolean; dim?: number };
const F = 0.4;
/** 时间写成 "seg:段名" / "seg:段名:end" / "say:段名:词"，都从 timing.json 解析。 */
export const useWhen = () => { const ck = useClock(); return (k: string): number => { const [a, b, c] = k.split(':'); return a === 'seg' ? (c === 'end' ? ck.seg(b).end : ck.seg(b).start) : ck.say(b, c) - 0.2; }; };
export const Footage: React.FC<{ shots: Shot[]; dir: string }> = ({ shots, dir }) => {
  const t = useT(), ck = useClock(), when = useWhen();
  return (
    <AbsoluteFill>
      {shots.map((s) => {
        const a = when(s.from), b = when(s.to);
        if (t < a - F || t > b + F) return null;
        const op = a <= 0.5 ? Math.min(1, (b + F - t) / F) : Math.min(1, (t - (a - F)) / F, (b + F - t) / F), d = s.dim ?? 0.66;
        return (
          <AbsoluteFill key={s.file} style={{ opacity: op }}>
            <Sequence from={Math.max(0, Math.round((a - F) * ck.fps))} layout="none">
              <OffthreadVideo src={staticFile(`${dir}/${s.file}`)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', filter: s.old ? 'grayscale(1) sepia(.45) contrast(1.15) brightness(.85)' : undefined }} />
            </Sequence>
            <AbsoluteFill style={{ background: `linear-gradient(180deg, rgba(8,11,17,${d - 0.04}) 0%, rgba(8,11,17,${d + 0.08}) 55%, rgba(8,11,17,.93) 100%)` }} />
            {s.old && <AbsoluteFill style={{ boxShadow: 'inset 0 0 260px 60px rgba(0,0,0,.75)' }} />}
            <div style={{ position: 'absolute', left: 72, bottom: 26, fontFamily: FONT, fontSize: 18, color: C.muted }}>画面：{s.credit}{s.old ? ' · 示意画面，非当年影像' : ''}</div>
          </AbsoluteFill>
        );
      })}
    </AbsoluteFill>
  );
};
