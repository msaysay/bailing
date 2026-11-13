// 真实画面层：每个镜头全片只用一次，垫在组件后面。old 的镜头做旧并标「资料画面」。
import React from 'react';
import { AbsoluteFill, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { useClock } from './clock';
import { C, FONT, useT } from './kit';
export type Shot = { file: string; from: string; to: string; credit: string; old?: boolean; dim?: number; faceTo?: [number, number] };
export type Faces = Record<string, { box: [number, number, number, number] }>;
/** 避开人脸：给了 faceTo（脸要去的位置，画面比例）就放大并平移画面，把脸挪过去；放大不超过 maxScale。
 *  返回 CSS transform 和挪动后的人脸框（给自查用，算法与 scripts/facecheck.py 保持一致）。 */
export const reframe = (box: [number, number, number, number] | undefined, to: [number, number] | undefined, maxScale = 1.5) => {
  if (!box || !to) return { s: 1, dx: 0, dy: 0 };
  const cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
  let s = Math.min(maxScale, 1 + 2 * Math.max(Math.abs(to[0] - cx), Math.abs(to[1] - cy)));
  const lim = (s - 1) / 2, clamp = (v: number) => Math.max(-lim, Math.min(lim, v));
  // 以画面中心放大 s 倍后，脸心在 0.5 + (c - 0.5) * s；再平移到目标，平移量受限于不露边
  return { s, dx: clamp(to[0] - (0.5 + (cx - 0.5) * s)), dy: clamp(to[1] - (0.5 + (cy - 0.5) * s)) };
};
const F = 0.4;
/** 时间写成 "seg:段名" / "seg:段名:end" / "say:段名:词"，都从 timing.json 解析。 */
export const useWhen = () => { const ck = useClock(); return (k: string): number => { const [a, b, c] = k.split(':'); return a === 'seg' ? (c === 'end' ? ck.seg(b).end : ck.seg(b).start) : ck.say(b, c) - 0.2; }; };
export const Footage: React.FC<{ shots: Shot[]; dir: string; faces?: Faces }> = ({ shots, dir, faces = {} }) => {
  const t = useT(), ck = useClock(), when = useWhen();
  return (
    <AbsoluteFill>
      {shots.map((s) => {
        const a = when(s.from), b = when(s.to);
        if (t < a - F || t > b + F) return null;
        const op = a <= 0.5 ? Math.min(1, (b + F - t) / F) : Math.min(1, (t - (a - F)) / F, (b + F - t) / F), d = s.dim ?? 0.66, r = reframe(faces[s.file]?.box, s.faceTo);
        return (
          <AbsoluteFill key={s.file} style={{ opacity: op }}>
            <Sequence from={Math.max(0, Math.round((a - F) * ck.fps))} layout="none">
              <OffthreadVideo src={staticFile(`${dir}/${s.file}`)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `translate(${r.dx * 100}%, ${r.dy * 100}%) scale(${r.s})`, filter: s.old ? 'grayscale(1) sepia(.45) contrast(1.15) brightness(.85)' : undefined }} />
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
