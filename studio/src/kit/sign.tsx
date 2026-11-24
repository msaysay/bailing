// 署名三件套：角标（底部小牌子，像「小 Lin 说」）、个人介绍（上方：称呼 + 一行身份）、简介（底部一两行，只在结尾出）。
// 出现规矩是看对标片定的（docs/署名规则.md）：都不是全程挂着。
//   角标：只在「人全屏」的时候在，切到素材、卡片、大字时收起来；开头钩子那几秒不出。
//   个人介绍：钩子说完后第一次人全屏时出一次，停 4 秒就走；长视频每隔两分钟以上、在新一章开头再出一次。
//   简介：只在最后几秒出，和个人介绍一起，当片尾。
// 用法：<Sign sign={{ badge, name, title, bio }} total={秒} full={[[0, 8], [12, 20]]} hookEnd={3} chapters={[0, 95, 210]} hot="#FFD84A" />
//   full 是「人全屏」的时间段（秒）；不给就当全片都是人全屏。骨架自己有角标或名片的（财经解读风的 ChannelTag、横屏深度解读风的 NameCard），用骨架的，这里只补缺的那几件：parts={['intro', 'bio']}。
import React from 'react';
import { AbsoluteFill, OffthreadVideo, continueRender, delayRender, interpolate, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export type SignInfo = { badge?: string; name?: string; title?: string; bio?: string };
export type SignPlan = { intro: [number, number][]; bio: [number, number]; badge: [number, number][] };
const HOLD = 4;
/** 什么时候出什么。纯函数，方便检查。 */
export const signPlan = (total: number, full?: [number, number][], hookEnd = 2.5, chapters: number[] = []): SignPlan => {
  const F = full && full.length ? full : [[0, total] as [number, number]], bioLen = Math.min(5, Math.max(3, total * 0.08)), bioAt = Math.max(0, total - bioLen);
  const firstFull = (from: number) => { for (const [a, b] of F) { const s = Math.max(a, from); if (b - s >= HOLD && s + HOLD <= bioAt) return s + 0.3; } return null; };
  const intro: [number, number][] = []; const t0 = firstFull(Math.max(hookEnd, 1.5));
  if (t0 != null) intro.push([t0, t0 + HOLD]); else if (total > hookEnd + HOLD + bioLen) intro.push([hookEnd, hookEnd + HOLD]);
  for (const c of chapters) { const last = intro.length ? intro[intro.length - 1][1] : -999; if (c - last < 120) continue; const s = firstFull(c + 1); if (s != null && s - c < 20) intro.push([s, s + HOLD]); }
  const badge = F.map(([a, b]) => [Math.max(a, hookEnd), Math.min(b, total)] as [number, number]).filter(([a, b]) => b - a > 0.6);
  return { intro, bio: [bioAt, total], badge };
};
const lum = (c: string) => { const m = /^#?([0-9a-f]{6})$/i.exec(c.trim()); if (!m) return 0.5; const n = parseInt(m[1], 16); return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255; };
const win = (t: number, a: number, b: number, i = 0.3, o = 0.22) => Math.max(0, Math.min(1, (t - a) / i, (b - t) / o));
const ease = (x: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, x)), 4);

export const Sign: React.FC<{ sign: SignInfo; total: number; full?: [number, number][]; hookEnd?: number; chapters?: number[]; hot?: string; fg?: string; font?: string; parts?: ('badge' | 'intro' | 'bio')[]; badgeBottom?: number; introTop?: number }> = ({ sign, total, full, hookEnd, chapters, hot = '#FFD84A', fg = '#FFFFFF', font, parts = ['badge', 'intro', 'bio'], badgeBottom, introTop }) => {
  const { width: W, height: H, fps } = useVideoConfig(), t = useCurrentFrame() / fps, U = Math.min(W, H) / 1080, tall = H > W, P = signPlan(total, full, hookEnd, chapters), onHot = lum(hot) > 0.55 ? '#111' : '#fff';
  const [h] = React.useState(() => delayRender('sign-font'));
  React.useEffect(() => { new FontFace('Sign Hei', `url(${staticFile('fonts/SourceHanSansSC-Heavy.otf')})`, { weight: '100 900' }).load().then((f) => document.fonts.add(f)).catch(() => undefined).then(() => continueRender(h)); }, [h]);
  const F = font ?? '"Sign Hei", "PingFang SC", "Microsoft YaHei", sans-serif', ending = win(t, P.bio[0], total + 9, 0.4), pad = (tall ? 64 : 80) * U;
  const badgeOn = Math.max(...P.badge.map(([a, b]) => win(t, a, b, 0.25, 0.18)), ending, 0), introOn = Math.max(...P.intro.map(([a, b]) => win(t, a, b)), 0), introIn = Math.max(...P.intro.map(([a]) => ease((t - a) / 0.45)).filter((_, i) => t >= P.intro[i][0] && t <= P.intro[i][1]), 0);
  const top = introTop ?? (tall ? H * 0.12 : H * 0.09), bb = badgeBottom ?? (tall ? H * 0.045 : H * 0.04);
  return <AbsoluteFill style={{ pointerEvents: 'none' }}>
    {/* 结尾：底部压一条暗带，简介和称呼一起出 */}
    {parts.includes('bio') && ending > 0 && (sign.bio || sign.name) ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: H * (tall ? 0.34 : 0.4), background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,.82) 62%)', opacity: ending }}>
      <div style={{ position: 'absolute', left: pad, right: pad, bottom: bb + 86 * U, transform: `translateY(${(1 - ease((t - P.bio[0]) / 0.5)) * 30 * U}px)` }}>
        {sign.name ? <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 * U, flexWrap: 'wrap' }}><span style={{ fontFamily: F, fontWeight: 900, fontSize: 72 * U, color: fg, lineHeight: 1.15 }}>{sign.name}</span>{sign.title ? <span style={{ fontFamily: F, fontWeight: 500, fontSize: 34 * U, color: hot }}>{sign.title}</span> : null}</div> : null}
        {sign.bio ? <div style={{ fontFamily: F, fontWeight: 500, fontSize: 38 * U, lineHeight: 1.5, color: 'rgba(255,255,255,.86)', marginTop: 12 * U, whiteSpace: 'pre-line', maxWidth: tall ? undefined : W * 0.6 }}>{sign.bio}</div> : null}
      </div></div> : null}
    {/* 个人介绍：上方，竖线 + 称呼 + 一行身份 */}
    {parts.includes('intro') && introOn > 0 && sign.name ? <div style={{ position: 'absolute', left: pad, top, display: 'flex', alignItems: 'stretch', gap: 18 * U, opacity: introOn, transform: `translateX(${(1 - introIn) * -40 * U}px)` }}>
      <div style={{ width: 8 * U, background: hot, transform: `scaleY(${introIn})`, transformOrigin: 'top' }} />
      <div style={{ background: 'rgba(8,9,12,.62)', padding: `${12 * U}px ${24 * U}px ${14 * U}px`, backdropFilter: 'blur(6px)' }}>
        <div style={{ fontFamily: F, fontWeight: 900, fontSize: 64 * U, color: fg, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{sign.name}</div>
        {sign.title ? <div style={{ fontFamily: F, fontWeight: 500, fontSize: 32 * U, color: 'rgba(255,255,255,.82)', marginTop: 4 * U, whiteSpace: 'nowrap' }}>{sign.title}</div> : null}
      </div></div> : null}
    {/* 角标：底部正中的小牌子，人全屏时才在 */}
    {parts.includes('badge') && badgeOn > 0 && sign.badge ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: bb, display: 'flex', justifyContent: 'center', opacity: badgeOn }}>
      <div style={{ fontFamily: F, fontWeight: 900, fontSize: 36 * U, letterSpacing: 2 * U, color: onHot, background: hot, padding: `${6 * U}px ${24 * U}px ${8 * U}px`, borderRadius: 12 * U, transform: `skewX(-7deg) scale(${interpolate(badgeOn, [0, 1], [0.9, 1])})`, boxShadow: '0 4px 14px rgba(0,0,0,.45)', whiteSpace: 'nowrap' }}>{sign.badge}</div></div> : null}
  </AbsoluteFill>;
};

/** 看效果用的演示：一段人物视频上叠署名。props 见 signDemoDefault；scripts/sign.py 会传。 */
export type SignDemoProps = { video: string; w: number; h: number; total: number; sign: SignInfo; full?: [number, number][]; hookEnd?: number; hot?: string };
export const signDemoDefault: SignDemoProps = { video: '', w: 1080, h: 1920, total: 30, sign: { badge: '频道名', name: '称呼', title: '一行身份', bio: '一两行简介' } };
export const SignDemo: React.FC<SignDemoProps> = (P) => <AbsoluteFill style={{ background: '#111' }}>
  {P.video ? <OffthreadVideo src={staticFile(P.video)} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
  <Sign sign={P.sign} total={P.total} full={P.full} hookEnd={P.hookEnd} hot={P.hot} />
</AbsoluteFill>;
