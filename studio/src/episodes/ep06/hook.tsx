// 第六期开场 0–5 秒：跟着词点硬切四镜，一镜比一镜重。只用推近和砸入，不用闪白、震屏。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useClock, prog, mix, inOut } from '../../kit/clock';
import { C, FONT, useT } from '../../kit/kit';
import { StrikeReplace } from '../../components/type';

const Cut: React.FC<{ from: number; to: number; children: React.ReactNode }> = ({ from, to, children }) => { const t = useT(); return t >= from && t < to ? <AbsoluteFill style={{ fontFamily: FONT, color: C.text }}>{children}</AbsoluteFill> : null; };
/** 推近：进镜头时从 k0 收到 1，之后极缓推近，保持画面在动。 */
const Push: React.FC<{ at: number; k0?: number; children: React.ReactNode }> = ({ at, k0 = 1.18, children }) => {
  const t = useT(), p = prog(t, at, 0.28), s = mix(k0, 1, p) + Math.max(0, t - at) * 0.025;
  return <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${s})`, opacity: Math.min(1, Math.max(0, (t - at) / 0.13)) }}>{children}</AbsoluteFill>;
};

/** 取景框：四角括号、红点、时间码在走，中间只有一个空的人形虚线。 */
const Viewfinder: React.FC<{ at: number }> = ({ at }) => {
  const t = useT(), rec = Math.floor(t * 2.2) % 2 === 0, tc = `00:00:${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 30)).padStart(2, '0')}`;
  const W = 1500, H = 800, br = (s: React.CSSProperties) => <div style={{ position: 'absolute', width: 90, height: 90, borderColor: C.text, borderStyle: 'solid', borderWidth: 0, ...s }} />;
  return (
    <div style={{ position: 'relative', width: W, height: H, opacity: prog(t, at, 0.2) }}>
      {br({ left: 0, top: 0, borderLeftWidth: 6, borderTopWidth: 6 })}{br({ right: 0, top: 0, borderRightWidth: 6, borderTopWidth: 6 })}
      {br({ left: 0, bottom: 0, borderLeftWidth: 6, borderBottomWidth: 6 })}{br({ right: 0, bottom: 0, borderRightWidth: 6, borderBottomWidth: 6 })}
      <div style={{ position: 'absolute', left: 60, top: 46, display: 'flex', alignItems: 'center', gap: 16, fontSize: 40, fontWeight: 900 }}>
        <div style={{ width: 30, height: 30, borderRadius: 15, background: rec ? C.down : 'transparent', border: `3px solid ${C.down}` }} /><span style={{ color: C.down }}>REC</span>
      </div>
      <div style={{ position: 'absolute', right: 60, top: 50, fontSize: 36, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: C.muted }}>{tc}</div>
      <svg width={420} height={560} viewBox="0 0 420 560" style={{ position: 'absolute', left: (W - 420) / 2, top: 150 }}>
        <circle cx={210} cy={150} r={105} fill="none" stroke={C.muted} strokeWidth={6} strokeDasharray="18 16" />
        <path d="M30 560 C30 380 110 300 210 300 C310 300 390 380 390 560" fill="none" stroke={C.muted} strokeWidth={6} strokeDasharray="18 16" />
      </svg>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 40, textAlign: 'center', fontSize: 34, fontWeight: 600, color: C.muted }}>镜头前：没有人</div>
    </div>
  );
};

export const Hook: React.FC = () => {
  const t = useT(), { say, seg } = useClock();
  const t1 = say('开场', '不露脸'), t2 = say('开场', '吃亏'), t3 = say('开场', '从这条视频开始'), tFix = say('开场', '开始'), end = seg('开场').end;
  const slam = prog(t, t2, 0.22), arrow = inOut((t - t2 - 0.1) / 0.5);
  return (
    <>
      <Cut from={0} to={t1}><Push at={-1} k0={1.08}><Viewfinder at={0} /></Push></Cut>
      <Cut from={t1} to={t2}><Push at={t1} k0={1.35}>
        <div style={{ fontSize: 330, fontWeight: 900, letterSpacing: -6, lineHeight: 1 }}>不露脸</div>
      </Push></Cut>
      <Cut from={t2} to={t3}><AbsoluteFill style={{ background: 'radial-gradient(1100px 700px at 50% 55%, rgba(255,93,93,.16), rgba(0,0,0,0) 70%)' }} />
        <Push at={t2} k0={1}>
          <div style={{ fontSize: 90, fontWeight: 900, color: C.muted, marginBottom: 10 }}>不露脸 ＝</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 50 }}>
            <div style={{ fontSize: 380, fontWeight: 900, color: C.down, lineHeight: 1, transform: `scale(${mix(1.7, 1, slam)})`, opacity: slam }}>吃亏</div>
            <svg width={190} height={360} viewBox="0 0 190 360" style={{ opacity: Math.min(1, arrow * 2) }}>
              <path d={`M95 10 L95 ${10 + 300 * arrow}`} stroke={C.down} strokeWidth={30} strokeLinecap="round" />
              {arrow > 0.85 && <path d="M20 250 L95 335 L170 250" fill="none" stroke={C.down} strokeWidth={30} strokeLinecap="round" strokeLinejoin="round" />}
            </svg>
          </div>
        </Push></Cut>
      <Cut from={t3} to={end}><Push at={t3} k0={1.12}>
        <StrikeReplace before="不露脸 ＝ " wrong="吃亏" right="不吃亏" at={t3} fixAt={tFix} size={170} />
        <div style={{ display: 'flex', gap: 30, marginTop: 70 }}>
          {[['0', '出镜镜头'], ['0', '手剪的刀'], ['0', '句真人配音']].map(([n, k], i) => { const p = prog(t, t3 + 0.25 + i * 0.3, 0.25);
            return <div key={k} style={{ opacity: p, transform: `translateY(${mix(40, 0, p)}px)`, background: C.surface, border: `2px solid ${C.line}`, borderRadius: 20, padding: '14px 34px', display: 'flex', alignItems: 'baseline', gap: 14 }}>
              <span style={{ fontSize: 80, fontWeight: 900, color: C.accent }}>{n}</span><span style={{ fontSize: 34, fontWeight: 600, color: C.muted }}>{k}</span></div>; })}
        </div>
      </Push></Cut>
    </>
  );
};
