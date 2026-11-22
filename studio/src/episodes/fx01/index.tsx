// 《今天我们来炫个技》横屏 1920×1080，约 32 秒。开场一句 → 6.5 秒「全息工作台」炫技段 → 说明、开源、关注 → 结尾卡。
// 炫技段里手是在「操作」工作台：剑指 → 两侧面板从指尖展开；指枪拉开 → 时间线被拉长；蓄力举手 → 工作台铺满全屏；
// 横扫 → 卡片跟着手滑；推掌 → 渲染进度；上挑 → 成片导出飞走。面板垫在人后面，跟手的小件画在人前面并躲开脸（face.json）。
// 粗剪和配乐：同目录 prep.py；认手和抠人：scripts/hud_track.py --ep fx01。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, continueRender, delayRender, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { FxProvider, FxTrack, Pt, c01, handAt, mainSide, out3, out5, useFx } from '../../kit/fx';
import { AMB, Box, FILL, Floor, HHEI, HandRig, ICE, ICE2, ICE3, Link, List, MONO, Monitor, Nodes, Panel, Progress, Readout, Ring, Ripple, Timeline, Wave, inBox, useMat } from '../../kit/holo';
import timing from './timing.json';
import plan from './shots.json';

export const fx1Clock = makeClock(timing as Timing);
const { at, total } = fx1Clock;
export const FX1_FRAMES = Math.ceil((total + plan.tail) * 30);
const SH = plan.shots as { fx: string; start: number; end: number }[];
const S = (k: string) => SH.find((x) => x.fx === k)!;
const MON0 = SH[0].start, MON1 = SH[SH.length - 1].end, MICRO = plan.micro as number[];
const REL = S('expand').start + 1.22;                        // 举手的那一刻：工作台铺开
const STYLES = ['财经解读风', '横屏深度解读风', '知识科普风', '商业快节奏风', '相框老板风', '访谈纪实风'];

const useAssets = () => {
  const [tr, setTr] = React.useState<FxTrack | null>(null), [face, setFace] = React.useState<number[][] | null>(null), [h] = React.useState(() => delayRender('fx1'));
  React.useEffect(() => {
    const fonts = [['H Hei', 'HarmonyOS_Sans_SC_Bold.ttf'], ['H Din', 'D-DIN-PRO-700-Bold.otf']].map(([fam, f]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: '100 900' }).load().then((x) => document.fonts.add(x)).catch(() => undefined));
    Promise.all([...fonts, fetch(staticFile('fx01/track.json')).then((r) => r.json()).then(setTr), fetch(staticFile('fx01/face.json')).then((r) => r.json()).then(setFace)]).then(() => continueRender(h));
  }, [h]);
  return { tr, face };
};
const FaceCtx = React.createContext<number[][] | null>(null);
/** 这一帧的人脸框（往外放一圈，前景的东西都躲开它）。 */
const useFace = (): Box | null => { const fs = React.useContext(FaceCtx), { f } = useFx(); const b = fs?.[Math.min(f, (fs?.length ?? 1) - 1)]; return b ? { x: b[0] - 40, y: b[1] - 90, w: b[2] + 80, h: b[3] + 110 } : null; };

/** 字幕：白字深色描边，底部居中，不发光。炫技段不出，最后两行有名牌就不出。 */
const Subs: React.FC = () => {
  const { t } = useFx(), l = fx1Clock.lines.find((x) => t >= x.start - 0.03 && t < x.end + 0.05); if (!l || (t >= MON0 && t < MON1) || l.n >= 17) return null;
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 952, textAlign: 'center', fontFamily: HHEI, fontSize: 54, letterSpacing: 2, color: '#fff', WebkitTextStroke: '7px rgba(4,8,14,.85)', paintOrder: 'stroke fill' }}>{l.text.replace('AI', ' AI ')}</div>;
};
/** 侧边关键词面板：说话时在人右边亮一块小全息牌，写这一句的重点。不压头。 */
const KEYS: [number, number, string, string][] = [
  [1, 2, 'TODAY', '炫个技'], [2, 3, 'AI EDIT', 'AI 一键剪辑'], [4, 5, 'LOOK', '像这样的动效'], [5, 7, 'BEFORE', '月薪几万的剪辑师'], [7, 9, 'NOW', '一键生成'],
  [10, 12, 'OPEN SOURCE', '核心工作流 开源'], [12, 14, 'SHARE', '做出好作品 回来分享'], [14, 16, 'JOIN', '粉丝群'], [16, 17, 'COMMENT', '评论区打「工作流」'],
];
const KeyPanel: React.FC = () => {
  const { t } = useFx(); const k = KEYS.find(([a, b]) => t >= at(a) - 0.05 && t < (b <= 18 ? at(b) : total) - 0.08); if (!k || (t >= MON0 && t < MON1)) return null;
  const s = at(k[0]) - 0.05, e = (k[1] <= 18 ? at(k[1]) : total) - 0.08, big = Math.min(72, Math.floor(440 / k[3].length));
  return <Panel b={{ x: 1400, y: 340, w: 490, h: 200 }} at={s} out={e} title={k[2]} code={`K-${String(KEYS.indexOf(k) + 1).padStart(2, '0')}`} tilt={-12} solid>
    <div style={{ fontFamily: HHEI, fontSize: big, color: '#fff', lineHeight: 1.2, marginTop: 18, whiteSpace: 'nowrap' }}>{k[3]}</div>
    <div style={{ position: 'absolute', left: 0, bottom: 0, width: `${c01((t - s) / Math.max(0.5, e - s)) * 100}%`, height: 3, background: ICE }} />
  </Panel>;
};
/** 名牌：最后两句，左下角。 */
const NamePlate: React.FC = () => {
  const { t } = useFx(), s = at(17) - 0.05; if (t < s || t > total + 0.1) return null;
  return <Panel b={{ x: 70, y: 740, w: 560, h: 180 }} at={s} out={total} title="CREATOR" code="ID-01" tilt={12} solid>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}><span style={{ fontFamily: HHEI, fontSize: 62, color: '#fff' }}>宁少</span><span style={{ fontFamily: MONO, fontSize: 20, color: ICE2, letterSpacing: 3 }}>AI 进化论</span></div>
    <div style={{ fontFamily: HHEI, fontSize: 28, color: ICE, marginTop: 4, opacity: c01((t - at(18)) / 0.3) }}>陪伴 AI 时代的超级个体</div>
  </Panel>;
};

/** 炫技段：全息工作台。 */
const Workbench: React.FC<{ layer: 'back' | 'front' }> = ({ layer }) => {
  const { t, f, tr } = useFx(), face = useFace(); if (t < MON0 - 0.1 || t > MON1 + 0.3) return null;
  const sm = S('summon'), pi = S('pinch'), ex = S('expand'), sw = S('swipe'), pu = S('push'), fl = S('flick'), END = MON1 - 0.05;
  const L = handAt(tr, 'L', f), R = handAt(tr, 'R', f), tipAt = (side: 'L' | 'R', time: number) => handAt(tr, side, Math.round(time * 30))?.index ?? ([960, 540] as Pt);
  if (layer === 'back') {
    const C: Pt = [960, 470], st = (i: number) => REL + 0.04 * i;
    return <>
      <Floor at={REL} out={END} />
      <Ring c={[960, 430]} r={500} at={ex.start + 0.1} out={END} />
      {/* 剑指召出来的两块：风格列表、监视器 */}
      <Panel b={{ x: 40, y: 60, w: 560, h: 300 }} at={sm.start + 0.05} out={END} title="STYLE · 风格" code="S-06" tilt={18} from={tipAt('L', sm.start + 0.1)}>
        <List items={STYLES.slice(0, 5)} sel={Math.floor(Math.max(0, t - sm.start) * 3) % 5} size={24} />
      </Panel>
      <Panel b={{ x: 1320, y: 60, w: 560, h: 300 }} at={sm.start + 0.1} out={END} title="LIVE CAM" code="CAM-1" tilt={-18} from={tipAt('R', sm.start + 0.1)}>
        <Monitor w={528} h={228} src="fx01/person.mp4" />
      </Panel>
      {/* 举手：其余的面板从身后飞出去铺满 */}
      <Panel b={{ x: 40, y: 390, w: 560, h: 250 }} at={st(0)} out={END} title="PIPELINE · 流程" code="P-05" tilt={18} from={C}><Nodes w={528} h={170} p={c01((t - REL) / 2.2)} /></Panel>
      <Panel b={{ x: 40, y: 670, w: 560, h: 200 }} at={st(1)} out={END} title="AUDIO · 降噪" code="A-48K" tilt={18} from={C}><Wave w={528} h={120} /></Panel>
      <Panel b={{ x: 1320, y: 390, w: 560, h: 250 }} at={st(2)} out={END} title="TIMELINE · 时间线" code="T-30FPS" tilt={-18} from={C}><Timeline w={528} h={170} seed={3} /></Panel>
      <Panel b={{ x: 1320, y: 670, w: 560, h: 200 }} at={st(3)} out={END} title="STATS" code="SYS" tilt={-18} from={C}>
        <Readout rows={[['HAND TRACK', `${L && R ? 2 : L || R ? 1 : 0} / 2`], ['GESTURE', ['SUMMON', 'PINCH', 'EXPAND', 'SWIPE', 'PUSH', 'FLICK'][Math.max(0, SH.findIndex((s) => t >= s.start && t < s.end))]], ['LATENCY', `${(11 + (f % 7)).toFixed(0)} ms`], ['FPS', '30.00']]} />
      </Panel>
      <Panel b={{ x: 700, y: 24, w: 520, h: 96 }} at={st(4)} out={END} title="AI EDIT WORKSTATION" code="v2.6" from={C}>
        <div style={{ fontFamily: MONO, fontSize: 18, color: ICE2, letterSpacing: 4 }}>NINGSHAO · ONE TAKE · ONE CLICK</div>
      </Panel>
    </>;
  }
  // —— 前景：跟着手走的东西，躲开脸 ——
  const rigOp = (t >= MON0 && t < MON1 ? 1 : 0);
  const pinchY = (a: Pt, b: Pt) => Math.max((a[1] + b[1]) / 2 + 170, (face ? face.y + face.h : 700) + 30);
  const swipeSide = mainSide(tr, sw.start, sw.end), flSide = mainSide(tr, fl.start, fl.end), H0 = handAt(tr, swipeSide, Math.round((sw.start + 0.05) * 30)), Hs = handAt(tr, swipeSide, f);
  const mid: Pt | null = L && R ? [(L.palm[0] + R.palm[0]) / 2, (L.palm[1] + R.palm[1]) / 2] : null;
  const flT = t - fl.start, flTip = handAt(tr, flSide, Math.round((fl.start + 0.2) * 30))?.index ?? [700, 560], dock: Pt = [1760, 110], fp = out5((flT - 0.2) / 0.45);
  const flPos: Pt = flT < 0.2 ? (handAt(tr, flSide, f)?.index ?? flTip) : [flTip[0] + (dock[0] - flTip[0]) * fp, flTip[1] + (dock[1] - flTip[1]) * fp - Math.sin(fp * Math.PI) * 160];
  return <>
    <HandRig h={L} face={face} label="L·IDX" op={rigOp} />
    <HandRig h={R} face={face} label="R·IDX" op={rigOp} />
    {/* 剑指：指尖连到面板 */}
    <Link a={t >= sm.start && t < sm.end && L ? L.index : null} b={[600, 360]} op={c01((t - sm.start) / 0.1)} />
    <Link a={t >= sm.start && t < sm.end && R ? R.index : null} b={[1320, 360]} op={c01((t - sm.start) / 0.1)} />
    <Ripple at={L?.index ?? null} t0={sm.start + 0.05} /><Ripple at={R?.index ?? null} t0={sm.start + 0.08} />
    {/* 指枪拉开：时间线跟着两指尖拉长 */}
    {t >= pi.start && t < pi.end + 0.2 && L && R ? (() => { const y = pinchY(L.index, R.index), x0 = Math.min(L.index[0], R.index[0]), x1 = Math.max(L.index[0], R.index[0]), w = Math.max(120, x1 - x0), op = c01((t - pi.start) / 0.1) * c01((pi.end + 0.2 - t) / 0.2);
      return <div style={{ position: 'absolute', inset: 0, opacity: op }}>
        <Link a={L.index} b={[x0, y]} /><Link a={R.index} b={[x1, y]} />
        <div style={{ position: 'absolute', left: x0, top: y, width: w, height: 120, background: FILL, border: `1px solid ${ICE2}`, filter: 'drop-shadow(0 0 4px rgba(140,220,255,.55))' }}>
          <div style={{ position: 'absolute', left: 8, top: -26, fontFamily: MONO, fontSize: 16, color: ICE, letterSpacing: 3 }}>TIMELINE · {(w / 40).toFixed(1)}s</div>
          <div style={{ position: 'absolute', left: 6, top: 6 }}><Timeline w={w - 12} h={106} seed={3} play={c01((t - pi.start) / (pi.end - pi.start))} /></div>
        </div>
      </div>; })() : null}
    {/* 横扫：一排风格卡跟着手滑过 */}
    {t >= sw.start && t < sw.end + 0.15 && H0 && Hs ? (() => { const dx = (Hs.palm[0] - H0.palm[0]) * 1.3, op = c01((t - sw.start) / 0.08) * c01((sw.end + 0.15 - t) / 0.15);
      return <div style={{ position: 'absolute', inset: 0, opacity: op }}>{STYLES.map((s, i) => { const x = -300 + i * 330 + dx, y = 850; if (x < -320 || x > 1940) return null; const hot = Math.abs(x + 150 - 960) < 165;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: 300, height: 120, background: hot ? 'rgba(255,181,71,.18)' : FILL, border: `1.5px solid ${hot ? AMB : ICE2}`, filter: 'drop-shadow(0 0 4px rgba(140,220,255,.55))', transform: `perspective(900px) rotateY(${(x + 150 - 960) / -40}deg)` }}>
          <div style={{ position: 'absolute', left: 14, top: 10, fontFamily: MONO, fontSize: 16, color: hot ? AMB : ICE2, letterSpacing: 2 }}>STYLE {String(i + 1).padStart(2, '0')}</div>
          <div style={{ position: 'absolute', left: 14, bottom: 14, fontFamily: HHEI, fontSize: 34, color: '#fff' }}>{s}</div></div>; })}</div>; })() : null}
    {/* 推掌：两掌之间撑开渲染面板 */}
    {t >= pu.start && t < pu.end + 0.2 && mid ? (() => { const y = Math.max(mid[1] - 20, (face ? face.y + face.h : 700) + 20), w = 560, op = c01((t - pu.start) / 0.1) * c01((pu.end + 0.2 - t) / 0.2), p = c01((t - pu.start - 0.15) / (pu.end - pu.start - 0.3)), s = out5((t - pu.start) / 0.3);
      return <div style={{ position: 'absolute', left: mid[0] - w / 2, top: Math.min(y, 860), width: w, height: 150, opacity: op, transform: `scale(${0.6 + 0.4 * s})`, background: 'rgba(20,40,60,.35)', border: `1.5px solid ${ICE}`, padding: '18px 24px', boxSizing: 'border-box', filter: 'drop-shadow(0 0 6px rgba(140,220,255,.6))' }}>
        <Progress p={p} w={w - 48} label="RENDERING · 成片" />
      </div>; })() : null}
    <Ripple at={L?.palm ?? null} t0={pu.start + 0.05} r={200} /><Ripple at={R?.palm ?? null} t0={pu.start + 0.05} r={200} />
    {/* 上挑：成片卡从指尖飞到左上角停靠 */}
    {flT >= 0 && t < MON1 + 0.3 ? <div style={{ position: 'absolute', left: flPos[0] - 120, top: flPos[1] - 40, width: 240, height: 80, background: fp >= 1 ? 'rgba(255,181,71,.2)' : FILL, border: `1.5px solid ${fp >= 1 ? AMB : ICE}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontFamily: MONO, fontSize: 22, color: '#fff', letterSpacing: 2, filter: 'drop-shadow(0 0 6px rgba(140,220,255,.6))', opacity: c01(flT / 0.08) * c01((MON1 + 0.3 - t) / 0.3) }}>
      {fp >= 1 ? <><span style={{ color: AMB }}>✓</span> EXPORTED</> : 'FINAL.MP4'}</div> : null}
    <Ripple at={dock} t0={fl.start + 0.65} color={AMB} r={140} />
  </>;
};

const Stage: React.FC = () => {
  const { t } = useFx(), inMon = t >= MON0 && t < MON1, microK = MICRO.filter((m) => m <= t).length;
  const zoom = inMon || t >= total ? 1 : microK % 2 ? 1.05 : 1;                                    // 收气口处推近一点，以画面顶边为准放大，头不会被裁
  const dim = inMon ? (t < REL ? 0.62 : 0.5) : 1;
  return <AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: '50% 0%' }}>
    <OffthreadVideo src={staticFile('fx01/person.mp4')} muted style={{ width: '100%', height: '100%', filter: inMon ? `brightness(${dim}) saturate(.7) contrast(1.1)` : 'contrast(1.04)' }} />
    {inMon ? <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(10,30,60,.35), rgba(5,15,30,.25))', mixBlendMode: 'multiply' }} /> : null}
    <Workbench layer="back" />
    {inMon ? <OffthreadVideo transparent muted src={staticFile('fx01/hands.webm')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: 'contrast(1.05)' }} /> : null}
    <Workbench layer="front" />
  </AbsoluteFill>;
};

export const FX01: React.FC = () => {
  const { tr, face } = useAssets();
  return <ClockCtx.Provider value={fx1Clock}><FxProvider tr={tr}><FaceCtx.Provider value={face}><Inner /></FaceCtx.Provider></FxProvider></ClockCtx.Provider>;
};
const Inner: React.FC = () => {
  const { t } = useFx(), inMon = t >= MON0 && t < MON1, k = SH.findIndex((s) => t >= s.start && t < s.end), cut = k >= 0 ? SH[k].start : -9;
  const flash = Math.max(t >= MON0 && t < MON0 + 0.2 ? 0.35 * (1 - (t - MON0) / 0.2) : 0, inMon ? 0.12 * (1 - out3((t - cut) / 0.1)) : 0, t >= REL && t < REL + 0.25 ? 0.3 * (1 - (t - REL) / 0.25) : 0);
  const endA = t - total, endM = useMat(total, 1e9);
  const corner = (x: number, y: number, sx: number, sy: number) => <path d={`M${x},${y + sy * 44} L${x},${y} L${x + sx * 44},${y}`} stroke={ICE2} strokeWidth={2} fill="none" />;
  return <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
    <Stage />
    {/* 全程的取景角 */}
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, opacity: 0.8 }}>{corner(30, 30, 1, 1)}{corner(1890, 30, -1, 1)}{corner(30, 1050, 1, -1)}{corner(1890, 1050, -1, -1)}</svg>
    <KeyPanel />
    <NamePlate />
    <Subs />
    <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 60%, rgba(0,0,0,.4) 100%)', pointerEvents: 'none' }} />
    <AbsoluteFill style={{ background: '#CFF6FF', opacity: flash, mixBlendMode: 'screen' }} />
    {endA >= 0 && endM ? <AbsoluteFill style={{ background: '#03070d', opacity: c01(endA / 0.25) }}>
      <Ring c={[960, 540]} r={330} at={total} />
      <Panel b={{ x: 560, y: 410, w: 800, h: 260 }} at={total + 0.15} title="GET THE WORKFLOW" code="OPEN">
        <div style={{ fontFamily: HHEI, fontSize: 30, color: ICE2 }}>想要这套 AI 剪辑工作流</div>
        <div style={{ fontFamily: HHEI, fontSize: 76, color: '#fff', marginTop: 8 }}>评论区打<span style={{ color: AMB }}>「工作流」</span></div>
        <div style={{ fontFamily: MONO, fontSize: 20, color: ICE2, letterSpacing: 4, marginTop: 6 }}>宁少 AI 进化论</div>
      </Panel>
    </AbsoluteFill> : null}
    <div style={{ position: 'absolute', right: 70, top: 44, fontFamily: MONO, fontSize: 20, letterSpacing: 4, color: 'rgba(200,240,255,.7)', display: inMon || endA >= 0 ? 'none' : 'block' }}>宁少 AI 进化论</div>
    <Audio src={staticFile('fx01/voice.wav')} /><Audio src={staticFile('fx01/music.wav')} />
  </AbsoluteFill>;
};
