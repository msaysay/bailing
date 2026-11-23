// 06 黄仁勋回归（横屏新闻解读，2 分 10 秒，用户自己的录音）。
// 设计：墨黑底、暖白字，英伟达绿做主色、红色只用在下跌；粗黑标题 + 等宽小字标签；真实新闻画面垫底，台标都已裁掉（clips.py）。
// 规矩：画面上只放查得到出处的数字和原话（见 episodes/06_黄仁勋回归/03_制作过程/事实核对.md），每个都标来源；口播里没核实的数字画面上不出。
// 时间一律用 at(行号) / say(段名, 词)，行号见 timing.json。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing, prog, mix, useClock } from '../../kit/clock';
import { FONT, useFonts, useT } from '../../kit/kit';
import timing from './timing.json';

export const clock = makeClock(timing as Timing);
const { at, seg, total } = clock;
const FPS = 30;
const INK = '#0B0D11', PAPER = '#F2EFE8', NV = '#76B900', RED = '#E5484D', DIM = 'rgba(242,239,232,.55)', LINE = 'rgba(242,239,232,.18)';
const NUM = '"E Din", MiSans, sans-serif', MONO = '"E Din", "DejaVu Sans Mono", monospace';
const c01 = (x: number) => Math.max(0, Math.min(1, x)), out5 = (x: number) => 1 - Math.pow(1 - c01(x), 5);
const useDin = () => { const [h] = React.useState(() => delayRender('ep06-din')); React.useEffect(() => { new FontFace('E Din', `url(${staticFile('fonts/D-DIN-PRO-700-Bold.otf')})`).load().then((f) => document.fonts.add(f)).catch(() => undefined).then(() => continueRender(h)); }, [h]); };

/** 出现：往上滑 + 淡入，out 之后淡出。 */
const In: React.FC<{ at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties; dx?: number; dy?: number }> = ({ at: a, out = 1e9, children, style, dx = 0, dy = 40 }) => {
  const t = useT(); if (t < a - 0.02 || t > out + 0.3) return null; const p = out5((t - a) / 0.5), q = c01((t - out) / 0.25);
  return <div style={{ ...style, opacity: Math.min(1, p * 1.5) * (1 - q), transform: `${style?.transform ?? ''} translate(${(1 - p) * dx}px, ${(1 - p) * dy}px)` }}>{children}</div>;
};
const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = NV, size = 22, style }) => <div style={{ fontFamily: MONO, fontSize: size, letterSpacing: '.18em', color, whiteSpace: 'nowrap', ...style }}>{children}</div>;
const Src: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => <div style={{ fontFamily: FONT, fontSize: 19, color: DIM, ...style }}>{children}</div>;
/** 一段视频：从 at 开始播。 */
const Clip: React.FC<{ src: string; at: number; style?: React.CSSProperties; rate?: number; from?: number }> = ({ src, at: a, style, rate = 1, from = 0 }) => <Sequence from={Math.round(a * FPS)} layout="none"><OffthreadVideo src={staticFile(`ep06/clips/${src}.mp4`)} muted playbackRate={rate} startFrom={Math.round(from * FPS)} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} /></Sequence>;
/** 满屏画面 + 压暗 + 左下角来源；慢慢推近。 */
const Full: React.FC<{ src: string; from: number; to: number; credit: string; dim?: number; tone?: 'none' | 'red' }> = ({ src, from, to, credit, dim = 0.55, tone = 'none' }) => {
  const t = useT(); if (t < from - 0.02 || t >= to) return null; const z = 1.04 + 0.05 * c01((t - from) / Math.max(1, to - from));
  return <AbsoluteFill>
    <AbsoluteFill style={{ transform: `scale(${z})` }}><Clip src={src} at={from} style={{ filter: tone === 'red' ? 'grayscale(.7) contrast(1.1)' : 'saturate(.9)' }} /></AbsoluteFill>
    {tone === 'red' ? <AbsoluteFill style={{ background: 'rgba(120,10,20,.35)', mixBlendMode: 'multiply' }} /> : null}
    <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(11,13,17,${dim + 0.25}) 0%, rgba(11,13,17,${dim}) 45%, rgba(11,13,17,${dim - 0.2}) 100%)` }} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 60%, rgba(11,13,17,.85))' }} />
    <Src style={{ position: 'absolute', left: 80, bottom: 170 }}>画面：{credit}</Src>
  </AbsoluteFill>;
};
/** 小窗：带细边框和来源的一块画面。 */
const Window: React.FC<{ src: string; at: number; x: number; y: number; w: number; h: number; credit: string; out?: number; from?: number; contain?: boolean }> = ({ src, at: a, x, y, w, h, credit, out, from = 0, contain }) => (
  <In at={a} out={out} dy={30} style={{ position: 'absolute', left: x, top: y }}>
    <div style={{ width: w, height: h, overflow: 'hidden', background: '#000', border: `1px solid ${LINE}`, boxShadow: '0 30px 80px rgba(0,0,0,.55)' }}><Clip src={src} at={a} from={from} style={contain ? { objectFit: 'contain' } : undefined} /></div>
    <Src style={{ marginTop: 10 }}>画面：{credit}</Src>
  </In>
);
const Big: React.FC<{ children: React.ReactNode; size?: number; color?: string; style?: React.CSSProperties }> = ({ children, size = 120, color = PAPER, style }) => <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: size, lineHeight: 1.1, color, letterSpacing: '-0.01em', whiteSpace: 'nowrap', ...style }}>{children}</div>;
/** 引语卡：英文原话 + 中文 + 谁说的。 */
const Quote: React.FC<{ en: string; zh: string; who: string; at: number; out?: number; x: number; y: number; w: number; color?: string }> = ({ en, zh, who, at: a, out, x, y, w, color = NV }) => (
  <In at={a} out={out} style={{ position: 'absolute', left: x, top: y, width: w }}>
    <div style={{ borderLeft: `6px solid ${color}`, paddingLeft: 34 }}>
      <div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 40, lineHeight: 1.3, color: PAPER }}>“{en}”</div>
      <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, lineHeight: 1.3, color, marginTop: 18 }}>{zh}</div>
      <Src style={{ marginTop: 18, fontSize: 22 }}>— {who}</Src>
    </div>
  </In>
);
/** 章节卡：编号 + 标题，一条绿线扫过。 */
const Chapter: React.FC<{ no: string; title: string; from: number; to: number; sub?: string }> = ({ no, title, from, to, sub }) => {
  const t = useT(); if (t < from || t >= to) return null; const p = out5((t - from) / 0.6);
  return <AbsoluteFill style={{ background: INK, justifyContent: 'center', paddingLeft: 160 }}>
    <div style={{ fontFamily: NUM, fontSize: 300, color: NV, lineHeight: 0.9, opacity: p, transform: `translateX(${(1 - p) * -60}px)` }}>{no}</div>
    <div style={{ height: 4, width: 900 * p, background: NV, margin: '30px 0' }} />
    <Big size={130} style={{ opacity: c01((t - from - 0.15) / 0.3) }}>{title}</Big>
    {sub ? <Tag color={DIM} size={26} style={{ marginTop: 26, opacity: c01((t - from - 0.4) / 0.3) }}>{sub}</Tag> : null}
  </AbsoluteFill>;
};

// ---------- 开场 ----------
const Opening: React.FC = () => {
  const t = useT(), e = seg('开场').end;
  const days = Array.from({ length: 12 });
  return <>
    <Full src="stage1" from={0} to={at(3)} credit="NVIDIA 官方" dim={0.35} />
    {t < at(3) ? <AbsoluteFill style={{ padding: '0 0 0 110px', justifyContent: 'center' }}>
      <In at={0.1}><Tag>BREAKING · 2026.11.23</Tag></In>
      <In at={0.25}><Big size={200} style={{ marginTop: 20 }}>REINSTATED</Big></In>
      <In at={at(2) + 0.2}><div style={{ display: 'flex', gap: 20, marginTop: 30 }}>{['董事会全票', '即刻生效'].map((x) => <div key={x} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color: INK, background: NV, padding: '6px 22px' }}>{x}</div>)}</div></In>
      <In at={at(2) + 0.5}><Src style={{ marginTop: 22, fontSize: 22 }}>来源：NVIDIA 公告、SEC 8-K 文件（2026-11-23）</Src></In>
    </AbsoluteFill> : null}
    {/* 11 天：一格一天 */}
    {t >= at(3) && t < at(4) ? <AbsoluteFill>
      <Full src="bbg_huang" from={at(3)} to={at(4)} credit="Bloomberg TV" dim={0.6} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 14 }}>{days.map((_, i) => { const on = t >= at(3) + 0.12 * i; return <div key={i} style={{ width: 110, height: 150, border: `2px solid ${i === 0 ? RED : i === 11 ? NV : LINE}`, background: on ? (i === 0 ? 'rgba(229,72,77,.25)' : i === 11 ? 'rgba(118,185,0,.25)' : 'rgba(242,239,232,.08)') : 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: on ? 1 : 0.3 }}>
          <div style={{ fontFamily: NUM, fontSize: 46, color: PAPER }}>{12 + i}</div><div style={{ fontFamily: MONO, fontSize: 16, color: DIM }}>NOV</div></div>; })}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: 1460, marginTop: 24 }}>
          <In at={at(3)}><Tag color={RED} size={26}>11.12 辞职</Tag></In><In at={at(3) + 1.2}><Tag size={26}>11.23 复职</Tag></In>
        </div>
      </AbsoluteFill>
    </AbsoluteFill> : null}
    {/* 盘前大涨：真实行情画面 + 两个数 */}
    {t >= at(4) && t < at(5) ? <AbsoluteFill style={{ background: INK }}>
      <Window src="ticker" at={at(4)} x={880} y={190} w={940} h={529} credit="Bloomberg TV 盘前行情" />
      <div style={{ position: 'absolute', left: 110, top: 230 }}>
        <In at={at(4) + 0.1}><Tag>NVDA · 11.23</Tag></In>
        <In at={at(4) + 0.3}><div style={{ fontFamily: NUM, fontSize: 190, color: NV, lineHeight: 1, marginTop: 18 }}>+33%</div></In>
        <In at={at(4) + 0.5}><div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 36, color: PAPER, marginTop: 10 }}>开盘涨幅</div></In>
        <In at={at(4) + 0.8}><Src style={{ marginTop: 26, fontSize: 22, lineHeight: 1.6 }}>来源：路透、彭博<br />盘前最高约 +29%（Bloomberg TV）</Src></In>
      </div>
    </AbsoluteFill> : null}
    {/* 三个职位回来了，董事长没有 */}
    {t >= at(5) && t < e ? <AbsoluteFill>
      <Full src="keynote" from={at(5)} to={e} credit="NVIDIA 官方" dim={0.8} />
      <div style={{ position: 'absolute', left: 110, top: 250, display: 'flex', gap: 30 }}>
        {[['总裁', 'PRESIDENT'], ['CEO', 'CHIEF EXECUTIVE'], ['董事', 'BOARD MEMBER']].map(([zh, en], i) => <In key={zh} at={at(6) + i * 0.35}>
          <div style={{ width: 380, height: 230, border: `2px solid ${NV}`, background: 'rgba(118,185,0,.12)', padding: '30px 34px', boxSizing: 'border-box' }}>
            <Tag size={18} color={NV}>{en}</Tag><div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 40 }}><Big size={76}>{zh}</Big><span style={{ fontFamily: NUM, fontSize: 70, color: NV }}>✓</span></div>
          </div></In>)}
      </div>
      <In at={at(7)} style={{ position: 'absolute', left: 110, top: 540 }}>
        <div style={{ width: 1200, border: `2px solid ${LINE}`, padding: '26px 34px', display: 'flex', alignItems: 'center', gap: 34, boxSizing: 'border-box', background: 'rgba(11,13,17,.6)' }}>
          <Big size={64} color={DIM}>董事长</Big><span style={{ fontFamily: NUM, fontSize: 64, color: RED }}>✕</span>
          <div><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color: PAPER }}>仍是 Harvey C. Jones</div><Src>来源：NVIDIA 公告；PBS / MPR</Src></div>
        </div>
      </In>
    </AbsoluteFill> : null}
  </>;
};

// ---------- 时间线 ----------
const EVENTS = [{ d: '11.12', n: 9 }, { d: '11.17', n: 12 }, { d: '11.20', n: 16 }, { d: '11.22', n: 17 }, { d: '11.23', n: 18 }];
const Timeline: React.FC = () => {
  const t = useT(), s = seg('时间线'); if (t < s.start || t >= s.end) return null;
  const k = EVENTS.reduce((a, e, i) => (t >= at(e.n) - 0.1 ? i : a), -1), six = t >= at(19);
  const X = (i: number) => 160 + i * 400;
  return <AbsoluteFill style={{ background: INK }}>
    {/* 下半部分：每个节点的画面 */}
    {k === 0 ? <>
      <Window src="mics" at={at(9)} x={110} y={330} w={800} h={450} credit="路透（资料画面）" />
      <div style={{ position: 'absolute', left: 990, top: 340 }}>
        <In at={at(9) + 0.2}><Tag color={RED}>RESIGNED</Tag></In>
        <In at={at(9) + 0.4}><Big size={64} style={{ marginTop: 14 }}>辞去 总裁 · CEO · 董事</Big></In>
        <In at={at(10, 'CFO')}><div style={{ marginTop: 40, fontFamily: FONT, fontWeight: 600, fontSize: 38, color: PAPER }}>临时 CEO：<span style={{ color: NV }}>Colette Kress</span>（原 CFO）</div></In>
        <In at={at(11)}><div style={{ marginTop: 20, fontFamily: FONT, fontWeight: 600, fontSize: 38, color: PAPER }}>董事会：全球物色新 CEO</div></In>
        <In at={at(10, 'CFO') + 0.3}><Src style={{ marginTop: 26 }}>来源：NVIDIA 8-K（2026-11-12）</Src></In>
      </div>
    </> : null}
    {k === 1 ? <>
      <Window src="stage2" at={at(12)} x={110} y={330} w={800} h={450} credit="NVIDIA 官方（资料画面）" />
      <div style={{ position: 'absolute', left: 990, top: 350, width: 820 }}>
        <In at={at(12) + 0.2}><div style={{ borderLeft: `6px solid ${PAPER}`, paddingLeft: 28 }}><Tag color={DIM}>HUANG</Tag><Big size={52} style={{ marginTop: 10 }}>公开道歉，表示愿意回来</Big></div></In>
        <In at={at(14)}><div style={{ borderLeft: `6px solid ${RED}`, paddingLeft: 28, marginTop: 46 }}><Tag color={RED}>BOARD</Tag><Big size={52} style={{ marginTop: 10 }} color={RED}>无意恢复其 CEO 职务</Big></div></In>
        <In at={at(14) + 0.4}><Src style={{ marginTop: 26 }}>来源：AP / Yahoo Finance（11-17）</Src></In>
      </div>
    </> : null}
    {k === 2 ? <>
      <Window src="trump2" at={at(16)} x={160} y={300} w={300} h={533} credit="Yahoo Finance" contain />
      <Quote at={at(16) + 0.3} x={600} y={380} w={1180} en="I would love to see Jensen be given a second chance." zh="希望黄仁勋能得到第二次机会" who="特朗普，11 月 20 日（Yahoo Finance）" color={PAPER} />
    </> : null}
    {k === 3 ? <>
      <Window src="shake" at={at(17)} x={110} y={330} w={800} h={450} credit="ABC News（资料画面）" />
      <div style={{ position: 'absolute', left: 990, top: 380, width: 820 }}>
        <In at={at(17) + 0.2}><Tag color={DIM}>TRUMP</Tag></In>
        <In at={at(17) + 0.4}><Big size={60} style={{ marginTop: 12 }}>公开呼吁董事会复聘</Big></In>
        <In at={at(17) + 0.8}><Src style={{ marginTop: 22 }}>来源：Al Jazeera（11-21）；特朗普 11-23 对 CNBC 称是他「说服」了董事会</Src></In>
      </div>
    </> : null}
    {k === 4 ? <>
      <Window src="together" at={at(18)} x={110} y={330} w={800} h={450} credit="ABC News（资料画面）" />
      <div style={{ position: 'absolute', left: 990, top: 380 }}>
        <In at={at(18) + 0.2}><Tag>REINSTATED</Tag></In>
        <In at={at(18) + 0.4}><div style={{ display: 'flex', gap: 20, marginTop: 16 }}>{['全票', '即刻生效'].map((x) => <div key={x} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 60, color: INK, background: NV, padding: '6px 26px' }}>{x}</div>)}</div></In>
        <In at={at(18) + 0.8}><Src style={{ marginTop: 22 }}>来源：NVIDIA 8-K（2026-11-23）</Src></In>
      </div>
      {six ? <AbsoluteFill style={{ background: 'rgba(11,13,17,.82)', justifyContent: 'center', alignItems: 'center' }}>
        <In at={at(19)}><div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}><span style={{ fontFamily: NUM, fontSize: 320, color: NV, lineHeight: 1 }}>6</span><Big size={110}>天</Big></div></In>
        <In at={at(19) + 0.3}><Tag color={DIM} size={30} style={{ marginTop: 20 }}>11.17 回绝 → 11.23 复职</Tag></In>
      </AbsoluteFill> : null}
    </> : null}
    {/* 上方：时间轴 */}
    <div style={{ position: 'absolute', left: 0, right: 0, top: 120, opacity: six ? 0.25 : 1 }}>
      <div style={{ position: 'absolute', left: X(0), top: 48, width: X(4) - X(0), height: 2, background: LINE }} />
      <div style={{ position: 'absolute', left: X(0), top: 48, width: (X(Math.max(0, k)) - X(0)) * out5((t - at(EVENTS[Math.max(0, k)].n)) / 0.5) + (k > 0 ? 0 : 0), height: 2, background: NV }} />
      {EVENTS.map((e, i) => { const on = i <= k, cur = i === k; return <div key={e.d} style={{ position: 'absolute', left: X(i) - 60, top: 0, width: 120, textAlign: 'center' }}>
        <div style={{ fontFamily: NUM, fontSize: 34, color: cur ? NV : on ? PAPER : DIM }}>{e.d}</div>
        <div style={{ width: cur ? 22 : 14, height: cur ? 22 : 14, borderRadius: '50%', margin: `${cur ? 4 : 8}px auto 0`, background: on ? (i === 0 ? RED : NV) : INK, border: `2px solid ${on ? (i === 0 ? RED : NV) : DIM}` }} /></div>; })}
    </div>
  </AbsoluteFill>;
};

// ---------- 为什么 ----------
const Why: React.FC = () => {
  const t = useT(), s = seg('为什么'); if (t < s.start || t >= s.end) return null;
  return <AbsoluteFill style={{ background: INK, justifyContent: 'center', paddingLeft: 160 }}>
    <In at={s.start}><Big size={150}>为什么改口？</Big></In>
    <div style={{ display: 'flex', gap: 30, marginTop: 70 }}>{['没人接手', '钱', '合规'].map((x, i) => <In key={x} at={at(21) + i * 0.3}><div style={{ width: 420, borderTop: `4px solid ${NV}`, paddingTop: 20 }}><div style={{ fontFamily: NUM, fontSize: 70, color: NV }}>0{i + 1}</div><div style={{ fontFamily: FONT, fontWeight: 600, fontSize: 40, color: DIM, marginTop: 6 }}>{x}</div></div></In>)}</div>
  </AbsoluteFill>;
};

// ---------- 01 没人接手 ----------
const NoSuccessor: React.FC = () => {
  const t = useT(), s = seg('没人接手'); if (t < s.start || t >= s.end) return null;
  return <>
    <Chapter no="01" title="没人接手" from={s.start} to={at(23)} sub="NO SUCCESSOR" />
    {t >= at(23) && t < at(26) ? <AbsoluteFill>
      <Full src="keynote2" from={at(23)} to={at(26)} credit="NVIDIA 官方" dim={0.62} />
      <In at={at(23) + 0.2} style={{ position: 'absolute', left: 110, top: 200 }}><Tag>NEXT CYCLE</Tag><Big size={110} style={{ marginTop: 12 }}>Vera Rubin</Big><Src style={{ marginTop: 10, fontSize: 22 }}>英伟达下一代 AI 计算平台（NVIDIA 官方）</Src></In>
      {t >= at(24) ? <>
        <Window src="witt" at={at(24)} x={1180} y={200} w={620} h={349} credit="CNBC（11-09）" />
        <Quote at={at(24) + 0.3} x={110} y={480} w={1000} en="Nvidia is Jensen Huang." zh="英伟达就是黄仁勋" who="作家 Stephen Witt，CNBC 11 月 9 日" />
      </> : null}
    </AbsoluteFill> : null}
    {t >= at(26) && t < s.end ? <AbsoluteFill style={{ background: INK }}>
      <Window src="musk" at={at(26)} x={200} y={250} w={330} h={587} credit="Yahoo Finance" contain />
      <Quote at={at(26) + 0.3} x={680} y={380} w={1120} en="The mistake has been corrected." zh="错误已被纠正" who="马斯克在 X 上的回应，11 月 23 日（CNN）" color={PAPER} />
    </AbsoluteFill> : null}
  </>;
};

// ---------- 02 钱是答案 ----------
const Money: React.FC = () => {
  const t = useT(), s = seg('钱是答案'); if (t < s.start || t >= s.end) return null;
  const weeks = Array.from({ length: 7 });
  return <>
    <Chapter no="02" title="钱是答案" from={s.start} to={at(29)} sub="FOLLOW THE MONEY" />
    {t >= at(29) && t < at(31) ? <AbsoluteFill>
      <Full src="seat" from={at(29)} to={at(31)} credit="Bloomberg TV" dim={0.55} tone="red" />
      <In at={at(29) + 0.2} style={{ position: 'absolute', left: 110, top: 300 }}><Tag color={RED}>MARKET CAP</Tag><div style={{ fontFamily: NUM, fontSize: 200, color: RED, lineHeight: 1, marginTop: 14 }}>▼</div></In>
    </AbsoluteFill> : null}
    {t >= at(31) && t < at(33) ? <AbsoluteFill style={{ background: INK }}>
      <div style={{ position: 'absolute', left: 110, top: 200 }}>
        <In at={at(31)}><Tag color={RED}>NVDA · WEEKLY</Tag></In>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, marginTop: 40 }}>{weeks.map((_, i) => <In key={i} at={at(31) + 0.12 * i} dy={-30}><div style={{ width: 120 }}><div style={{ height: 40 + i * 34, background: RED, opacity: 0.85 }} /><div style={{ fontFamily: MONO, fontSize: 20, color: DIM, marginTop: 10, textAlign: 'center' }}>W{i + 1}</div></div></In>)}</div>
        <Src style={{ marginTop: 6, fontSize: 18 }}>示意：七根柱代表连跌七周，高度不代表具体跌幅</Src>
      </div>
      <div style={{ position: 'absolute', left: 1180, top: 220 }}>
        <In at={at(31) + 0.3}><div style={{ fontFamily: NUM, fontSize: 170, color: PAPER, lineHeight: 1 }}>7<span style={{ fontSize: 60, marginLeft: 12 }}>周连跌</span></div><Src style={{ fontSize: 24, marginTop: 10 }}>2008 年以来最长（CNBC，11-20）</Src></In>
        <In at={at(32)}><div style={{ fontFamily: NUM, fontSize: 170, color: RED, lineHeight: 1, marginTop: 50 }}>-46%</div><Src style={{ fontSize: 24, marginTop: 10 }}>七周累计跌幅（CNBC）</Src></In>
      </div>
    </AbsoluteFill> : null}
    {t >= at(33) && t < at(35) ? <AbsoluteFill style={{ background: INK }}>
      <Window src="revenue" at={at(33)} x={110} y={230} w={1000} h={562} credit="CNBC" />
      <div style={{ position: 'absolute', left: 1200, top: 300 }}>
        <In at={at(33) + 0.3}><Tag>EARNINGS</Tag><Big size={80} color={NV} style={{ marginTop: 12 }}>业绩：超预期</Big></In>
        <In at={at(34)}><Tag color={RED} style={{ marginTop: 60 }}>VALUATION</Tag><Big size={80} color={RED} style={{ marginTop: 12 }}>股价：崩</Big></In>
      </div>
    </AbsoluteFill> : null}
    {t >= at(35) && t < s.end ? (() => { const tilt = mix(0, 14, out5((t - at(35) - 0.6) / 0.8)); return <AbsoluteFill style={{ background: INK, alignItems: 'center' }}>
      <svg width={1400} height={640} style={{ marginTop: 200 }}>
        <g transform={`rotate(${tilt} 700 140)`}>
          <line x1={150} y1={140} x2={1250} y2={140} stroke={PAPER} strokeWidth={6} />
          <line x1={250} y1={140} x2={250} y2={300} stroke={DIM} strokeWidth={2} /><line x1={1150} y1={140} x2={1150} y2={300} stroke={DIM} strokeWidth={2} />
          <rect x={110} y={300} width={280} height={150} fill="rgba(242,239,232,.06)" stroke={DIM} strokeWidth={2} /><rect x={1010} y={300} width={280} height={150} fill="rgba(229,72,77,.2)" stroke={RED} strokeWidth={3} />
          <text x={250} y={392} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={56} fill={DIM}>员工</text>
          <text x={1150} y={392} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={56} fill={RED}>市值</text>
        </g>
        <path d="M700,140 L640,600 L760,600 Z" fill="rgba(242,239,232,.08)" stroke={DIM} strokeWidth={2} /><circle cx={700} cy={140} r={14} fill={PAPER} />
      </svg>
    </AbsoluteFill>; })() : null}
  </>;
};

// ---------- 03 合规 ----------
const Compliance: React.FC = () => {
  const t = useT(), s = seg('合规'); if (t < s.start || t >= s.end) return null;
  return <>
    <Chapter no="03" title="合规风险解除" from={s.start} to={at(37)} sub="NATIONAL SECURITY CLEARED" />
    {t >= at(37) && t < at(39) ? <AbsoluteFill style={{ background: INK }}>
      <Quote at={at(37)} x={160} y={330} w={1600} en="…received input from senior levels of the United States government." zh="听取了美国政府高层的意见" who="英伟达董事会复职声明（ABC News 引述）" />
    </AbsoluteFill> : null}
    {t >= at(39) && t < s.end ? <AbsoluteFill style={{ background: INK }}>
      <Window src="post" at={at(39)} x={110} y={220} w={1000} h={562} credit="Bloomberg TV（特朗普 11-23 发帖）" />
      <div style={{ position: 'absolute', left: 1200, top: 300, width: 620 }}>
        <In at={at(39) + 0.3}><Tag>BOARD</Tag><Big size={58} style={{ marginTop: 12, whiteSpace: 'normal' }}>认为其回归<br /><span style={{ color: NV }}>不存在国家安全风险</span></Big><Src style={{ marginTop: 18 }}>来源：路透（11-23）</Src></In>
      </div>
    </AbsoluteFill> : null}
  </>;
};

// ---------- 结尾 ----------
const Ending: React.FC = () => {
  const t = useT(), s = seg('结尾'); if (t < s.start) return null;
  const seats = [['董事长', 'Harvey C. Jones'], ['独立调查', '继续进行'], ['华盛顿', '政府意见']];
  return <>
    {t < at(41) ? <AbsoluteFill>
      <Full src="bbg_stage" from={s.start} to={at(41)} credit="Bloomberg TV" dim={0.6} />
      <In at={s.start + 0.2} style={{ position: 'absolute', left: 110, top: 380 }}><Big size={130}>回来 <span style={{ color: RED }}>≠</span> 回到从前</Big></In>
    </AbsoluteFill> : null}
    {t >= at(41) && t < at(42) ? <AbsoluteFill style={{ background: INK, justifyContent: 'center', paddingLeft: 160, gap: 40 }}>
      <In at={at(41)}><div style={{ borderLeft: `6px solid ${PAPER}`, paddingLeft: 30 }}><Tag color={DIM}>CHAIRMAN</Tag><Big size={70} style={{ marginTop: 10 }}>董事长：仍是 Harvey C. Jones</Big></div></In>
      <In at={at(41, '对老黄')}><div style={{ borderLeft: `6px solid ${RED}`, paddingLeft: 30 }}><Tag color={RED}>INVESTIGATION</Tag><Big size={70} style={{ marginTop: 10 }}>独立调查：<span style={{ color: RED }}>继续进行</span></Big><Src style={{ marginTop: 12 }}>来源：NVIDIA 声明，调查 “will proceed to conclusion”</Src></div></In>
    </AbsoluteFill> : null}
    {t >= at(42) && t < at(43) ? <AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center' }}>
      <In at={at(42)}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 34 }}>
        <div style={{ width: 360, padding: '24px 0', border: `3px solid ${NV}`, background: 'rgba(118,185,0,.14)', textAlign: 'center' }}><Tag size={18}>DRIVER</Tag><Big size={60} style={{ marginTop: 8 }}>黄仁勋</Big></div>
        <div style={{ display: 'flex', gap: 26 }}>{seats.map(([a, b], i) => <In key={a} at={at(42, '方向盘') + i * 0.25}><div style={{ width: 360, padding: '22px 0', border: `2px solid ${LINE}`, textAlign: 'center' }}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color: PAPER }}>{a}</div><div style={{ fontFamily: FONT, fontSize: 26, color: DIM, marginTop: 6 }}>{b}</div></div></In>)}</div>
      </div></In>
    </AbsoluteFill> : null}
    {t >= at(43) && t < at(45) ? <AbsoluteFill>
      <Full src="bbg_huang" from={at(43)} to={at(45)} credit="Bloomberg TV" dim={0.7} />
      <AbsoluteFill style={{ justifyContent: 'center', paddingLeft: 160 }}>
        <In at={at(43) + 0.2}><Big size={120}>这 <span style={{ fontFamily: NUM, color: NV }}>11</span> 天</Big></In>
        <In at={at(44)}><Big size={120} style={{ marginTop: 20 }}>谁在决定 CEO？</Big></In>
      </AbsoluteFill>
    </AbsoluteFill> : null}
    {t >= at(45) ? <AbsoluteFill style={{ background: INK, justifyContent: 'center', alignItems: 'center' }}>
      <In at={at(45)}><Big size={96}>评论区说说<span style={{ color: NV }}>你的判断</span></Big></In>
      <In at={at(45) + 0.4}><Tag color={DIM} size={26} style={{ marginTop: 40 }}>宁少 AI 进化论</Tag></In>
      <In at={at(45) + 0.6}><Src style={{ marginTop: 50, fontSize: 18, textAlign: 'center', lineHeight: 1.7 }}>资料来源：NVIDIA 公告与 SEC 8-K · 路透 · CNBC · Bloomberg · ABC News · Yahoo Finance · AP · CNN<br />画面为新闻机构及 NVIDIA 公开发布的内容</Src></In>
    </AbsoluteFill> : null}
  </>;
};

/** 字幕：底部居中，深色底条。 */
const Subs: React.FC = () => {
  const t = useT(), { lines } = useClock(), l = lines.find((x) => t >= x.start - 0.04 && t < x.end + 0.2); if (!l || t >= at(45)) return null;
  return <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, textAlign: 'center' }}><span style={{ display: 'inline-block', background: 'rgba(8,10,14,.78)', padding: '10px 28px', fontFamily: FONT, fontSize: 44, fontWeight: 600, color: PAPER }}>{l.text}</span></div>;
};

export const Episode: React.FC = () => {
  useFonts(); useDin();
  const t = useT();
  return (
    <ClockCtx.Provider value={clock}>
      <AbsoluteFill style={{ background: INK }}>
        <Opening /><Timeline /><Why /><NoSuccessor /><Money /><Compliance /><Ending />
        <Subs />
        <div style={{ position: 'absolute', left: 80, top: 50, display: 'flex', gap: 18, alignItems: 'center', opacity: t < at(45) ? 1 : 0 }}><div style={{ width: 10, height: 10, background: NV }} /><Tag color={PAPER} size={20}>宁少 AI 进化论</Tag></div>
        <div style={{ position: 'absolute', right: 80, top: 48, fontFamily: FONT, fontSize: 20, color: DIM }}>本视频由 AI 生成 · 配音为作者本人</div>
        <Audio src={staticFile('ep06/voice.wav')} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
