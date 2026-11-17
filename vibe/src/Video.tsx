// 一期成片：背景光点 + 当前场景 + 顶栏 + 双语字幕 + 进度线 + 配乐。
import React, { useMemo } from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { C, a, SERIF, SANS, clamp, mix, rnd, parseHot, prog, inOut, type Clock } from './kit';
import { SceneView } from './scenes';
import { layout, FPS, plain, enFix } from './timeline';
import type { Episode } from './types';

const Particles: React.FC<{ t: number }> = ({ t }) => (
  <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
    {Array.from({ length: 70 }, (_, i) => {
      const sp = 6 + rnd(i, 1) * 14, x = (rnd(i, 2) * 1920 + t * sp * (rnd(i, 3) > 0.5 ? 1 : -1) + 1920 * 4) % 1920, y = (rnd(i, 4) * 1080 - t * sp * 0.6 + 1080 * 8) % 1080;
      const tw = 0.5 + 0.5 * Math.sin(t * (0.6 + rnd(i, 5)) + i);
      return <circle key={i} cx={x} cy={y} r={0.8 + rnd(i, 6) * 1.8} fill={rnd(i, 7) > 0.85 ? C.hot : C.ink} opacity={0.08 + 0.22 * tw} />;
    })}
  </svg>
);

const BigCaption: React.FC<{ zh: string; en: string; t: number; dur: number }> = ({ zh, en, t, dur }) => {
  const segs = parseHot(zh), total = plain(zh).length;
  const out = 1 - clamp((t - (dur - 0.3)) / 0.3);
  let idx = 0;
  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', opacity: out, paddingBottom: 40 }}>
      <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: total > 12 ? 78 : 96, color: C.ink, letterSpacing: 4, textAlign: 'center', maxWidth: 1600, lineHeight: 1.4 }}>
        {segs.map((sg, k) => (
          <span key={k} style={{ color: sg.hot ? C.hot : undefined, textShadow: sg.hot ? `0 0 40px ${a(C.hot, 0.45)}` : 'none' }}>
            {[...sg.t].map((ch, j) => {
              const i = idx++, p = clamp((t - 0.1 - i * 0.045) / 0.25);
              return <span key={j} style={{ opacity: p, display: 'inline-block', transform: `translateY(${mix(18, 0, p)}px)`, filter: `blur(${mix(6, 0, p)}px)`, whiteSpace: 'pre' }}>{ch}</span>;
            })}
          </span>
        ))}
      </div>
      <div style={{ marginTop: 34, fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: a(C.ink, 0.55), opacity: prog(t, 0.2 + total * 0.045, 0.6), textAlign: 'center', maxWidth: 1500 }}>{enFix(en)}</div>
    </AbsoluteFill>
  );
};

export const Video: React.FC<{ ep: Episode }> = ({ ep }) => {
  const frame = useCurrentFrame(), t = frame / FPS;
  const tl = useMemo(() => layout(ep), [ep]);
  const beat = tl.beats.find((b) => t >= b.start && t < b.end) ?? (t < tl.beats[0].start ? undefined : tl.beats[tl.beats.length - 1]);
  const lastEnd = tl.beats[tl.beats.length - 1].end;
  const capOn = beat && t < lastEnd + 0.2;
  const big = capOn && beat.big ? beat : undefined;
  const bigFade = big ? clamp((t - big.start) / 0.35) * (1 - clamp((t - (big.end - 0.3)) / 0.3)) : 0;

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 80% 70% at 50% 42%, ${a('#1B2233', 0.9)} 0%, ${C.bg} 70%)` }} />
      <Particles t={t} />

      {/* 场景：前后交叠 0.4 秒淡入淡出，并带一点缓慢推近 */}
      <div style={{ position: 'absolute', left: 0, top: 110, width: 1920, height: 700, opacity: 1 - 0.85 * bigFade }}>
        {tl.scenes.map((sc) => {
          if (t < sc.start - 0.01 || t > sc.end + 0.4) return null;
          const fin = sc.i === 0 ? 1 : clamp((t - sc.start) / 0.45), fout = 1 - clamp((t - sc.end) / 0.4);
          const st = Math.max(0, t - sc.start), stepIdx = Math.max(0, sc.steps.filter((x) => x <= t).length - 1);
          const c: Clock = { t: st, step: stepIdx, st: t - sc.steps[stepIdx], at: (k) => sc.steps[Math.min(k, sc.steps.length - 1)] - sc.start, len: sc.end - sc.start, n: sc.steps.length };
          // 镜头：整场缓慢推近，并且每进一拍再轻推一下，保证画面每一拍都有可见变化
          const push = sc.steps.slice(1).reduce((m, x) => m + inOut((t - x) / 0.9), 0);
          const zoom = 1 + 0.02 * clamp(st / Math.max(1, sc.end - sc.start)) + 0.022 * Math.min(push, 2.5);
          return (
            <AbsoluteFill key={sc.i} style={{ opacity: fin * fout, transform: `scale(${zoom * mix(0.97, 1, fin)})`, filter: fin < 1 ? `blur(${mix(8, 0, fin)}px)` : undefined }}>
              <SceneView s={sc.scene} c={c} ep={ep} en={sc.scene.k === 'quote' ? enFix(tl.beats.filter((b) => b.scene === sc.i).map((b) => b.en).join(' ')) : undefined} />
            </AbsoluteFill>
          );
        })}
      </div>

      {big && <BigCaption key={big.i} zh={big.zh} en={big.en} t={t - big.start} dur={big.end - big.start} />}

      {/* 顶栏 */}
      <div style={{ position: 'absolute', left: 64, top: 46, display: 'flex', alignItems: 'center', gap: 14, fontFamily: SANS, fontSize: 26, fontWeight: 700, color: a(C.ink, 0.85), letterSpacing: 2 }}>
        <span style={{ width: 12, height: 12, borderRadius: 6, background: C.hot, boxShadow: `0 0 12px ${C.hot}` }} />宁少AI进化论
      </div>
      <div style={{ position: 'absolute', right: 64, top: 48, fontFamily: SANS, fontSize: 22, color: a(C.ink, 0.45), letterSpacing: 5 }}>
        AI内容创作知识大赏 · {String(ep.no).padStart(2, '0')}
      </div>

      {/* 双语字幕 */}
      {capOn && !beat.big && tl.scenes[beat.scene].scene.k !== 'quote' && (() => {
        const lt = t - beat.start, p = clamp(lt / 0.18) * (1 - clamp((lt - (beat.end - beat.start) + 0.12) / 0.12));
        return (
          <div style={{ position: 'absolute', left: 0, right: 0, top: 862, textAlign: 'center', opacity: p }}>
            <div style={{ fontFamily: SANS, fontSize: 48, fontWeight: 600, color: C.ink, letterSpacing: 3, textShadow: '0 2px 16px rgba(0,0,0,.8)' }}>
              {parseHot(beat.zh).map((x, i) => <span key={i} style={{ color: x.hot ? C.hot : undefined }}>{x.t}</span>)}
            </div>
            <div style={{ marginTop: 14, fontFamily: SERIF, fontStyle: 'italic', fontSize: 27, color: a(C.ink, 0.55), letterSpacing: 0.5 }}>{enFix(beat.en)}</div>
          </div>
        );
      })()}

      <div style={{ position: 'absolute', left: 0, bottom: 0, height: 4, width: `${(t / tl.total) * 100}%`, background: a(C.hot, 0.8) }} />
      <AbsoluteFill style={{ pointerEvents: 'none', background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 60%, rgba(0,0,0,.55) 100%)' }} />

      <Audio src={staticFile(`audio/${ep.id}.wav`)} />
    </AbsoluteFill>
  );
};
