// 《今天我们来炫个技》横屏 1920×1080，约 36 秒。开场一句话 → 11 秒炫技段（10 个手势，每个手势一种特效，镜头卡在配乐半拍上）→ 说明、开源、关注 → 结尾卡。
// 特效全部由手势驱动（kit/fx.tsx），不用素材。粗剪和配乐：同目录 prep.py；认手和抠人：scripts/hud_track.py --ep fx01。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, continueRender, delayRender, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { Arc, Aura, Beam, Blade, Converge, FxDefs, FxProvider, FxTrack, Laser, Orb, Pt, Shield, Shockwave, Sparks, Trail, c01, handAt, mainSide, out3, out5, useFx } from '../../kit/fx';
import timing from './timing.json';
import plan from './shots.json';

export const fx1Clock = makeClock(timing as Timing);
const { at, total } = fx1Clock;
export const FX1_FRAMES = Math.ceil((total + plan.tail) * 30);
const SH = plan.shots as { fx: string; start: number; end: number }[];
const S = (k: string) => SH.find((x) => x.fx === k)!;
const MON0 = SH[0].start, MON1 = SH[SH.length - 1].end, MICRO = plan.micro as number[];
const CY = '#3DF0FF', MG = '#FF3DCB', GD = '#FFC83D', VI = '#9B6BFF';
const HEI = '"X Hei", "PingFang SC", sans-serif', DIN = '"X Din", "X Hei", sans-serif';
const RELEASE = S('awaken').start + 2.25, BURST = S('burst').start + 0.08;
const HITS = [RELEASE, BURST];
const LABEL: Record<string, string> = { blade: '剑指 · 光刃', laser: '指向 · 激光', arc: '双剑指 · 闪电', charge: '聚能 · 甩出', beam: '指枪 · 等离子束', awaken: '蓄力 · 觉醒', sweep: '横扫 · 霓虹', burst: '举手 · 冲击波', shield: '推掌 · 护盾', flick: '上挑 · 火花' };

const useAssets = () => {
  const [tr, setTr] = React.useState<FxTrack | null>(null), [h] = React.useState(() => delayRender('fx1'));
  React.useEffect(() => {
    const fonts = [['X Hei', 'HarmonyOS_Sans_SC_Black.ttf'], ['X Din', 'D-DIN-PRO-700-Bold.otf']].map(([fam, f]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: '100 900' }).load().then((x) => document.fonts.add(x)).catch(() => undefined));
    Promise.all([...fonts, fetch(staticFile('fx01/track.json')).then((r) => r.json()).then(setTr)]).then(() => continueRender(h));
  }, [h]);
  return tr;
};

/** 霓虹字：白芯 + 彩色辉光，出现时从放大、模糊、错位收回来。 */
const Neon: React.FC<{ text: string; at: number; out?: number; x?: number; y: number; size: number; color?: string; align?: 'center' | 'left' }> = ({ text, at: a, out = 1e9, x = 960, y, size, color = CY, align = 'center' }) => {
  const { t } = useFx(); if (t < a || t > out + 0.25) return null; const p = out5((t - a) / 0.35), q = out3((t - out) / 0.2), g = (1 - out3((t - a) / 0.25)) * 18;
  const st: React.CSSProperties = { position: 'absolute', top: y, fontFamily: HEI, fontSize: size, letterSpacing: size * 0.04, whiteSpace: 'nowrap', lineHeight: 1, ...(align === 'center' ? { left: 0, right: 0, textAlign: 'center' } : { left: x }) };
  return <div style={{ opacity: (1 - q) * c01((t - a) / 0.06), transform: `scale(${1.6 - 0.6 * p})`, transformOrigin: align === 'center' ? `${x}px ${y + size / 2}px` : `${x}px ${y}px`, filter: `blur(${(1 - p) * 10}px)`, position: 'absolute', inset: 0 }}>
    <div style={{ ...st, color: MG, transform: `translate(${-g}px, 0)`, opacity: 0.8, mixBlendMode: 'screen' }}>{text}</div>
    <div style={{ ...st, color: CY, transform: `translate(${g}px, 0)`, opacity: 0.8, mixBlendMode: 'screen' }}>{text}</div>
    <div style={{ ...st, color: '#fff', textShadow: `0 0 18px ${color}, 0 0 50px ${color}, 0 0 100px ${color}, 0 6px 20px rgba(0,0,0,.6)` }}>{text}</div>
  </div>;
};
/** 字幕：白字黑描边，底部居中。炫技段不出。 */
const Subs: React.FC = () => {
  const { t } = useFx(), { lines } = fx1Clock, l = lines.find((x) => t >= x.start - 0.03 && t < x.end + 0.05); if (!l || (t >= MON0 && t < MON1) || l.n >= 17) return null;
  const p = out5((t - l.start) / 0.16);
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', fontFamily: HEI, fontSize: 60, letterSpacing: 3, color: '#fff', transform: `translateY(${(1 - p) * 14}px)`, WebkitTextStroke: '8px rgba(5,8,14,.88)', paintOrder: 'stroke fill', textShadow: `0 0 24px rgba(61,240,255,.45)` }}>{l.text.replace('AI', ' AI ')}</div>;
};
/** 炫技段的取景框：四个角括号 + 左上角标签 + 底部节拍条。 */
const HudFrame: React.FC = () => {
  const { t } = useFx(); if (t < MON0 || t >= MON1) return null; const k = SH.findIndex((s) => t >= s.start && t < s.end), s = SH[k], a = t - s.start, p = out5(a / 0.25);
  const corner = (x: number, y: number, sx: number, sy: number) => <path d={`M${x},${y + sy * 70} L${x},${y} L${x + sx * 70},${y}`} stroke={CY} strokeWidth={5} fill="none" style={{ filter: `drop-shadow(0 0 10px ${CY})` }} />;
  const beats = Math.floor((t - MON0) / plan.beat);
  return <AbsoluteFill>
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>{corner(50, 50, 1, 1)}{corner(1870, 50, -1, 1)}{corner(50, 1030, 1, -1)}{corner(1870, 1030, -1, -1)}</svg>
    <div style={{ position: 'absolute', left: 90, top: 80, display: 'flex', alignItems: 'center', gap: 18, transform: `translateX(${(1 - p) * -60}px)`, opacity: p }}>
      <span style={{ fontFamily: DIN, fontSize: 34, color: '#05070c', background: CY, padding: '2px 14px', borderRadius: 6, boxShadow: `0 0 24px ${CY}` }}>FX {String(k + 1).padStart(2, '0')}</span>
      <span style={{ fontFamily: HEI, fontSize: 40, color: '#fff', textShadow: `0 0 20px ${CY}, 0 3px 10px rgba(0,0,0,.8)` }}>{LABEL[s.fx]}</span>
    </div>
    <div style={{ position: 'absolute', right: 90, top: 86, fontFamily: DIN, fontSize: 28, letterSpacing: 4, color: 'rgba(255,255,255,.8)' }}>GESTURE TRACKING · <span style={{ color: CY }}>LIVE</span></div>
    <div style={{ position: 'absolute', left: 90, right: 90, bottom: 70, display: 'flex', gap: 6 }}>{Array.from({ length: 26 }).map((_, i) => <div key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i <= beats ? CY : 'rgba(255,255,255,.15)', boxShadow: i === beats ? `0 0 14px ${CY}` : 'none' }} />)}</div>
  </AbsoluteFill>;
};
/** 开场第二句：一道扫描线从上往下扫，右上角亮「AI 一键剪辑」。 */
const Scan: React.FC = () => {
  const { t } = useFx(), a = at(2) - 0.1; if (t < a || t > MON0) return null; const p = c01((t - a) / 1.4);
  return <AbsoluteFill style={{ mixBlendMode: 'screen' }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: p * 1080 - 4, height: 4, background: CY, boxShadow: `0 0 40px 12px ${CY}` }} />
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: p * 1080, background: `linear-gradient(180deg, transparent 70%, rgba(61,240,255,.10))`, backgroundImage: 'repeating-linear-gradient(0deg, rgba(61,240,255,.07) 0 2px, transparent 2px 6px)' }} />
  </AbsoluteFill>;
};

const Effects: React.FC<{ layer: 'back' | 'front' }> = ({ layer }) => {
  const { t, tr, f } = useFx(), a = S('awaken'), c = S('charge'), b = S('burst'), fl = S('flick');
  if (layer === 'back') {
    const aura = t >= a.start && t < a.end ? Math.min(0.9, out3((t - a.start) / 2.2) * 0.8 + (t >= RELEASE ? 0.3 * (1 - out3((t - RELEASE) / 0.7)) : 0)) * c01((a.end - t) / 0.2) : t >= c.start && t < c.end ? 0.45 * c01((c.end - t) / 0.2) : 0;
    return <>
      <Aura src="fx01/hands.webm" strength={aura} color={t >= c.start && t < c.end ? 'gold' : 'cyan'} />
      <Shockwave at={[960, 330]} t0={RELEASE} color={CY} size={2100} />
    </>;
  }
  const one = (k: string) => mainSide(tr, S(k).start, S(k).end), tip1 = (k: string) => handAt(tr, one(k), f)?.index ?? null;
  const tipL = handAt(tr, 'L', f)?.index ?? null, tipR = handAt(tr, 'R', f)?.index ?? null, palms = (() => { const L = handAt(tr, 'L', f), R = handAt(tr, 'R', f); return L && R ? ([(L.palm[0] + R.palm[0]) / 2, Math.min(L.palm[1], R.palm[1])] as Pt) : ([960, 200] as Pt); })();
  return <>
    {/* 开场：「炫个技」两拳之间一团能量；第二句说话时双手张开也来一团 */}
    <Orb from={at(1, '炫') - 0.05} to={MON0 - 0.05} color={GD} />
    <Orb from={at(3) - 0.1} to={at(5)} color={CY} />
    {/* 炫技段 */}
    <Blade side={one('blade')} from={S('blade').start} to={S('blade').end} color={CY} />
    <Sparks at={tip1('blade')} t0={S('blade').start + 0.05} dir={[0.2, -1]} color={CY} n={40} seed={1} />
    <Laser side={one('laser')} from={S('laser').start} to={S('laser').end} color={MG} />
    <Arc from={S('arc').start} to={S('arc').end} color="#9FDBFF" strands={3} />
    <Orb mode={one('charge')} from={c.start} to={c.start + 1.2} color={GD} grow={1.0} />
    <Converge at={tip1('charge')} from={c.start} to={c.start + 1.15} color={GD} />
    <Trail side={one('charge')} from={c.start + 1.1} to={c.end} colors={[GD, '#FF7A1A']} width={80} />
    <Sparks at={tip1('charge')} t0={c.start + 1.2} dir={[-0.5, -1]} color={GD} n={70} seed={4} />
    <Beam from={S('beam').start} to={S('beam').end} color={VI} />
    <Arc from={a.start + 0.1} to={RELEASE - 0.05} color={CY} strands={2} />
    <Converge at={tipL} from={a.start} to={RELEASE} color={CY} n={50} radius={600} />
    <Converge at={tipR} from={a.start} to={RELEASE} color={CY} n={50} radius={600} />
    <Blade side="L" from={RELEASE} to={a.end} color={GD} length={1000} />
    <Blade side="R" from={RELEASE} to={a.end} color={GD} length={1000} />
    <Sparks at={tipL} t0={RELEASE} dir={[-0.3, -1]} color={GD} n={60} seed={5} speed={1800} />
    <Sparks at={tipR} t0={RELEASE} dir={[0.3, -1]} color={GD} n={60} seed={6} speed={1800} />
    <Trail side={one('sweep')} from={S('sweep').start} to={S('sweep').end} colors={[MG, CY]} width={110} frames={16} />
    <Trail side={one('sweep')} from={S('sweep').start} to={S('sweep').end} colors={[CY, MG]} width={70} frames={12} key2="palm" />
    <Shockwave at={palms} t0={BURST} color={GD} size={1800} />
    <Sparks at={palms} t0={BURST} dir={[0, -1]} spread={6.28} color={GD} n={110} seed={8} speed={2000} />
    <Shield from={S('shield').start} to={S('shield').end} color={CY} />
    <Trail side={one('flick')} from={fl.start} to={fl.end} colors={[GD, '#fff']} width={70} />
    <Sparks at={tip1('flick')} t0={fl.start + 0.25} dir={[0.3, -1]} color={GD} n={60} seed={9} />
    <Shockwave at={tip1('flick') ?? [800, 500]} t0={fl.start + 0.25} color={GD} size={700} />
  </>;
};

const Stage: React.FC = () => {
  const { t } = useFx(), inMon = t >= MON0 && t < MON1;
  const k = SH.findIndex((s) => t >= s.start && t < s.end), cut = k >= 0 ? SH[k].start : -9, hit = 1 - out5((t - cut) / 0.25);
  const hitAmp = Math.max(0, ...HITS.map((h) => (t >= h && t < h + 0.5 ? 1 - (t - h) / 0.5 : 0)));
  const shake = hitAmp > 0 ? [Math.sin(t * 97) * 26 * hitAmp, Math.cos(t * 83) * 20 * hitAmp] : [0, 0];
  const pre = c01((t - (MON0 - 0.45)) / 0.45) * (t < MON0 ? 1 : 0);                                     // 砸进炫技段前，画面往前冲
  const microK = MICRO.filter((m) => m <= t).length, talkZoom = inMon ? 1 : (microK % 2 ? 1.07 : 1) * (1 + 0.012 * ((t % 6) / 6));
  const zoom = (inMon ? 1.04 + hit * 0.08 : talkZoom) * (1 + pre * 0.25);
  const grade = inMon ? 'brightness(.42) saturate(.65) contrast(1.15)' : t < MON0 ? `brightness(${0.95 - pre * 0.4}) contrast(1.06)` : 'brightness(.95) contrast(1.06) saturate(1.05)';
  const ca = hitAmp * 14 + hit * (inMon ? 6 : 0);
  return <AbsoluteFill style={{ transform: `translate(${shake[0]}px, ${shake[1]}px) scale(${zoom})` }}>
    <OffthreadVideo src={staticFile('fx01/person.mp4')} muted style={{ width: '100%', height: '100%', filter: grade }} />
    {inMon ? <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 40%, rgba(20,40,90,.25), rgba(4,6,16,.55))', mixBlendMode: 'multiply' }} /> : null}
    <Effects layer="back" />
    {inMon ? <OffthreadVideo transparent muted src={staticFile('fx01/hands.webm')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: `brightness(1.02) contrast(1.08) ${ca > 1 ? `drop-shadow(${ca}px 0 0 rgba(255,40,200,.6)) drop-shadow(${-ca}px 0 0 rgba(40,240,255,.6))` : ''}` }} /> : null}
    <Effects layer="front" />
  </AbsoluteFill>;
};

export const FX01: React.FC = () => {
  const tr = useAssets();
  return <ClockCtx.Provider value={fx1Clock}><FxProvider tr={tr}><Inner /></FxProvider></ClockCtx.Provider>;
};
const Inner: React.FC = () => {
  const { t } = useFx(), inMon = t >= MON0 && t < MON1, k = SH.findIndex((s) => t >= s.start && t < s.end), cut = k >= 0 ? SH[k].start : -9;
  const flash = Math.max(t >= MON0 && t < MON0 + 0.3 ? 1 - (t - MON0) / 0.3 : 0, inMon ? 0.55 * (1 - out3((t - cut) / 0.12)) : 0, ...HITS.map((h) => (t >= h && t < h + 0.18 ? 0.45 * (1 - (t - h) / 0.18) : 0)), t >= MON1 && t < MON1 + 0.2 ? 0.7 * (1 - (t - MON1) / 0.2) : 0);
  const endA = t - total;
  return <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
    <FxDefs />
    <Stage />
    <Scan />
    {/* 开场两句的字 */}
    <Neon text="炫个技" at={at(1, '炫')} out={at(2) - 0.05} x={90} y={560} size={200} color={GD} align="left" />
    <Neon text="AI 一键剪辑" at={at(2, 'AI')} out={MON0 - 0.05} y={150} size={150} color={CY} />
    {/* 说明段：月薪几万 / 一键生成；开源；关注 */}
    <Neon text="像这样的动效" at={at(4)} out={at(5) - 0.05} y={130} size={120} color={CY} />
    <Neon text="月薪几万的剪辑师" at={at(5, '月')} out={at(7) - 0.05} y={130} size={120} color={MG} />
    <Neon text="一键生成" at={at(8, '一键')} out={at(9) - 0.05} y={120} size={190} color={CY} />
    <Neon text="核心工作流 · 开源" at={at(11, '开源')} out={at(12) - 0.05} y={130} size={120} color={GD} />
    <Neon text="做出好作品 回来分享" at={at(13, '做出')} out={at(14) - 0.05} y={130} size={110} color={CY} />
    <Neon text="评论区打「工作流」" at={at(16)} out={at(17) - 0.05} y={130} size={120} color={GD} />
    <Neon text="宁少" at={at(17)} out={total} x={120} y={640} size={150} color={CY} align="left" />
    <Neon text="陪伴 AI 时代的超级个体" at={at(18)} out={total} x={124} y={810} size={58} color={CY} align="left" />
    <HudFrame />
    <Subs />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.55) 100%)', pointerEvents: 'none' }} />
    <AbsoluteFill style={{ background: '#fff', opacity: flash, mixBlendMode: 'screen' }} />
    {endA >= 0 ? <AbsoluteFill style={{ background: 'radial-gradient(900px 600px at 50% 45%, #0d2230, #03050a 70%)', opacity: c01(endA / 0.2) }}>
      <Neon text="想要这套 AI 剪辑工作流" at={total + 0.1} y={330} size={64} color={CY} />
      <Neon text="评论区打「工作流」" at={total + 0.35} y={450} size={150} color={GD} />
      <Neon text="宁少 AI 进化论" at={total + 0.8} y={680} size={50} color={CY} />
    </AbsoluteFill> : null}
    <div style={{ position: 'absolute', right: 60, top: 40, fontFamily: HEI, fontSize: 26, letterSpacing: 3, color: 'rgba(255,255,255,.7)', display: inMon ? 'none' : 'block' }}>宁少 AI 进化论</div>
    <Audio src={staticFile('fx01/voice.wav')} /><Audio src={staticFile('fx01/music.wav')} />
  </AbsoluteFill>;
};
