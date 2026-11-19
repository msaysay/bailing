// 第十三期：IP 工作台（ClipSignal 短视频工作台）。事为主（人不出镜），横屏 1920×1080，Fish Audio 配音。
// 画面主体是用户的工作台操作录屏（public/ep13/footage/wb.mp4，已裁掉浏览器和任务栏，1140×788，30 帧）；评论页用昵称打码的截图。
// 时间全部用 say(段名, 词) 从配音里取；录屏里的数字都是用户账号的真实数据。
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing, useClock, prog, mix, inOut } from '../../kit/clock';
import { Bg, C, Chip, FONT, Panel, Pop, Scene, Stage, useFonts, useT } from '../../kit/kit';
import { Chrome } from '../../kit/chrome';
import { Finish, KineticLine } from '../../components/rich';
import { CommentPop, FollowCTA } from '../../components/talk';
import { Stamp } from '../../components/type';
import timing from './timing.json';

export const clock13 = makeClock(timing as Timing);
const RW = 1140, RH = 788, RFPS = 30;
const chapters = [{ no: '01', title: '一个圈', from: '闭环' }, { no: '02', title: '五段漏斗', from: '漏斗' }, { no: '03', title: '计划到发布', from: '计划' }];
const hero = [clock13.ln('开场', '一个人做'), clock13.ln('开场', '是拍完以后'), clock13.ln('观点', '做 IP 拼到最后'), clock13.ln('观点', '是你每周都知道')];
const hot = ['五段漏斗', '关系', '验收', 'AI', '工作台'];

type Roi = [number, number, number, number];                      // 录屏里的区域：x、y、宽、高（1140×788 坐标）
type Focus = { at: number; roi: Roi; dur?: number };
const FULL: Roi = [0, 0, RW, RH];
/** 录屏窗口：按 focus 依次推近到指定区域，没有 focus 时极缓推近。media 是录屏或截图。 */
const Win: React.FC<{ width: number; focus?: Focus[]; label?: string; media: React.ReactNode; children?: React.ReactNode; at?: number }> = ({ width, focus = [], label = 'ClipSignal 短视频工作台', media, children, at = 0 }) => {
  const t = useT(), H = Math.round(width * RH / RW);
  const steps = [{ at: -99, roi: FULL, dur: 0.6 }, ...focus];
  let cur = steps[0].roi, i = 0;
  for (; i < steps.length - 1 && t >= steps[i + 1].at; i++);
  const nx = steps[i], pv = i > 0 ? steps[i - 1].roi : FULL, p = inOut((t - nx.at) / (nx.dur ?? 0.7));
  cur = nx.roi.map((v, k) => mix(pv[k], v, i === 0 ? 1 : p)) as Roi;
  const k = Math.max(1, Math.min(RW / cur[2], RH / cur[3])) * (1 + Math.max(0, t - at) * 0.004), sc = width / RW;
  const tx = width / 2 - (cur[0] + cur[2] / 2) * k * sc, ty = H / 2 - (cur[1] + cur[3] / 2) * k * sc;
  const cx = Math.min(0, Math.max(width - RW * k * sc, tx)), cy = Math.min(0, Math.max(H - RH * k * sc, ty));
  return (
    <div style={{ width, borderRadius: 18, overflow: 'hidden', background: '#111', border: `1px solid ${C.line}`, boxShadow: '0 40px 100px rgba(0,0,0,.6)' }}>
      <div style={{ height: 40, background: '#1A1F2A', display: 'flex', alignItems: 'center', gap: 9, padding: '0 16px' }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />)}
        <span style={{ marginLeft: 12, fontSize: 18, color: C.muted, fontFamily: FONT }}>{label} · 本机运行</span>
      </div>
      <div style={{ position: 'relative', width, height: H, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: RW, height: RH, transformOrigin: '0 0', transform: `translate(${cx}px, ${cy}px) scale(${k * sc})` }}>{media}</div>
        {children}
      </div>
    </div>
  );
};
/** 录屏片段：场景开始时从录屏的 rec 秒开始播。 */
const Rec: React.FC<{ from: number; rec: number }> = ({ from, rec }) => {
  const { fps } = useClock();
  return <Sequence from={Math.round(from * fps)} layout="none"><OffthreadVideo src={staticFile('ep13/footage/wb.mp4')} muted trimBefore={Math.round(rec * RFPS)} style={{ width: RW, height: RH }} /></Sequence>;
};
const Shot: React.FC<{ file: string }> = ({ file }) => <Img src={staticFile('ep13/footage/' + file)} style={{ width: RW, height: RH }} />;
const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 30 }) => <div style={{ fontSize: size, fontWeight: 600, color, whiteSpace: 'nowrap', fontFamily: FONT }}>{children}</div>;
/** 局部标注框：画在录屏窗口上（窗口坐标）。 */
const Box: React.FC<{ at: number; x: number; y: number; w: number; h: number; color?: string; label?: string }> = ({ at, x, y, w, h, color = C.down, label }) => {
  const t = useT(), p = prog(t, at, 0.35);
  return <div style={{ position: 'absolute', left: x, top: y, width: w, height: h, border: `5px solid ${color}`, borderRadius: 12, opacity: p, transform: `scale(${mix(1.15, 1, p)})`, boxShadow: `0 0 30px ${color}66` }}>
    {label && <div style={{ position: 'absolute', left: -5, top: -52, background: color, color: '#fff', fontSize: 28, fontWeight: 900, padding: '4px 16px', borderRadius: 10, whiteSpace: 'nowrap', fontFamily: FONT }}>{label}</div>}
  </div>;
};

/** 闭环：六个节点围成一圈，到点依次点亮，中间写「每周转一遍」。 */
const Loop: React.FC<{ ats: number[]; size?: number; spin?: boolean }> = ({ ats, size = 640, spin }) => {
  const t = useT(), names = ['定位', '计划', '创作', '发布', '采集', '复盘'], r = size * 0.38, c = size / 2;
  const lit = ats.filter((a) => t >= a).length, rot = spin ? t * 20 : 0;
  return (
    <div style={{ position: 'relative', width: size, height: size, fontFamily: FONT }}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0, transform: `rotate(${rot}deg)` }}>
        <circle cx={c} cy={c} r={r} fill="none" stroke={C.line} strokeWidth={6} />
        <circle cx={c} cy={c} r={r} fill="none" stroke={C.accent} strokeWidth={6} strokeDasharray={2 * Math.PI * r} strokeDashoffset={2 * Math.PI * r * (1 - Math.min(1, lit / 6 + (lit ? 0 : 0)))} transform={`rotate(-90 ${c} ${c})`} strokeLinecap="round" />
      </svg>
      {names.map((n, i) => { const a = (i / 6) * Math.PI * 2 - Math.PI / 2, x = c + r * Math.cos(a), y = c + r * Math.sin(a), p = prog(t, ats[i] ?? 0, 0.3);
        return <div key={n} style={{ position: 'absolute', left: x, top: y, transform: `translate(-50%,-50%) scale(${mix(0.7, 1, p)})`, width: 150, height: 150, borderRadius: 75, background: p > 0.5 ? C.accent : C.surface, border: `3px solid ${p > 0.5 ? C.accent : C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, fontWeight: 900, color: p > 0.5 ? '#fff' : C.muted, boxShadow: p > 0.5 ? `0 0 40px ${C.accent}88` : 'none' }}>{n}</div>; })}
    </div>
  );
};

/** 五段漏斗：S1–S5 依次点亮，再从上往下扫，停在第一个偏弱的。 */
const Funnel: React.FC<{ ats: number[]; scanAt: number; weak: number; row?: string }> = ({ ats, scanAt, weak, row }) => {
  const t = useT(), names = ['流量', '留存', '互动', '关系', '转化'], scan = Math.min(weak, Math.floor(Math.max(0, t - scanAt) / 0.35));
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontFamily: FONT, width: 760 }}>
      {row && <Tag>{row}</Tag>}
      {names.map((n, i) => { const p = prog(t, ats[i], 0.3), w = 760 - i * 90, scanned = t >= scanAt && i <= scan, isWeak = t >= scanAt + weak * 0.35 && i === weak;
        return <div key={n} style={{ alignSelf: 'center', width: w, height: 84, borderRadius: 14, opacity: p, transform: `translateX(${mix(-40, 0, p)}px)`, background: isWeak ? 'rgba(255,93,93,.22)' : scanned ? 'rgba(91,155,255,.18)' : C.surface, border: `3px solid ${isWeak ? C.down : scanned ? C.accent : C.line}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px' }}>
          <span style={{ fontSize: 26, fontWeight: 900, color: C.muted }}>S{i + 1}</span><span style={{ fontSize: 44, fontWeight: 900, color: isWeak ? C.down : C.text }}>{n}</span>
          <span style={{ fontSize: 28, fontWeight: 900, color: isWeak ? C.down : C.accent, width: 70, textAlign: 'right' }}>{t < scanAt ? '' : isWeak ? '偏弱' : i < weak && scanned ? '及格' : ''}</span>
        </div>; })}
    </div>
  );
};

const Scenes: React.FC = () => {
  const { seg, say } = useClock();
  const W = 1500;                                   // 录屏窗口宽，高约 1037
  const tB = say('开场', '是拍完以后'), tData = say('开场', '三个平台'), tNext = say('开场', '下一条'), tCom = say('开场', '评论区要回'), tWb = say('开场', '这些事');
  const tF = seg('漏斗').start, tFz = say('漏斗', '最有用的'), tFu = say('漏斗', '流量'), tScan = say('漏斗', '从上往下'), tMe = say('漏斗', '比如我的视频号');
  const tPlan = say('计划', '再按复盘'), tGoal = say('计划', '目标定多少');
  const tC = seg('创作').start, tAuto = say('创作', '一条是'), tMine = say('创作', '我最近这几条'), tLive = say('创作', '另一条');
  const tPub = seg('发布和评论').start, tCm = say('发布和评论', '评论区有人');
  const tView = seg('观点').start, tEnd = seg('收口').start, tKey = say('收口', '再在评论区'), tGift = say('收口', '我把五段漏斗');
  const big = (s: number) => ({ fontSize: s, fontWeight: 900, letterSpacing: -3, lineHeight: 1.05, fontFamily: FONT });
  return (
    <>
      {/* 开场①：硬切两句大字 */}
      <Scene from={0} to={tB} hard><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...big(120), color: C.muted }}>最累的</div>
        <div style={{ ...big(220), transform: `scale(${mix(1.25, 1, prog(useT(), 0.9, 0.3))})` }}>不是拍视频</div>
      </Stage></Scene>
      <Scene from={tB} to={tData - 0.05} hard><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ ...big(260), color: C.warm, transform: `scale(${mix(1.3, 1, prog(useT(), tB, 0.25))})`, opacity: Math.min(1, (useT() - tB) / 0.13) }}>是拍完以后</div>
      </Stage></Scene>
      {/* 开场②：三张真实画面卡，一句一张 */}
      <Scene from={tData - 0.05} to={tWb - 0.1} hard><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 36, padding: '150px 70px 190px' }}>
        {[{ at: tData, t: '三个平台的数据', f: <Win width={560} at={tData} focus={[{ at: -50, roi: [160, 50, 980, 120] }]} media={<><Rec from={tData - 0.05} rec={1} /></>} /> },
          { at: tNext, t: '下一条拍什么', f: <Win width={560} at={tNext} focus={[{ at: -50, roi: [150, 0, 990, 470] }]} media={<Rec from={tData - 0.05} rec={56} />} /> },
          { at: tCom, t: '评论区要回', f: <Win width={560} at={tCom} focus={[{ at: -50, roi: [150, 120, 520, 540] }]} media={<Shot file="comments-blur.png" />} /> }].map((x) => (
          <Pop key={x.t} at={x.at} dy={50}><div style={{ display: 'flex', flexDirection: 'column', gap: 18, alignItems: 'center' }}>{x.f}<Tag size={40} color={C.text}>{x.t}</Tag></div></Pop>))}
      </Stage></Scene>
      {/* 开场③：交给一个工作台——看板录屏展开 */}
      <Scene from={tWb - 0.1} to={seg('开场').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', padding: '110px 100px 170px' }}>
        <div style={{ transform: `scale(${mix(0.6, 1, inOut((useT() - tWb) / 0.7))})` }}><Win width={1300} at={tWb} media={<Rec from={tWb - 0.1} rec={0} />} /></div>
      </Stage></Scene>

      {/* 闭环：六个节点依次点亮 */}
      <Scene from={seg('闭环').start} to={seg('闭环').end}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Loop size={720} ats={['定位', '计划', '创作', '发布', '采集', '复盘'].map((w) => say('闭环', w))} />
        <Pop at={say('闭环', '每周')} style={{ position: 'absolute' }}><div style={{ fontSize: 56, fontWeight: 900, textAlign: 'center', fontFamily: FONT }}>每周<br /><span style={{ color: C.warm }}>转一圈</span></div></Pop>
      </Stage></Scene>

      {/* 漏斗①：看板录屏，推近到五段漏斗表 */}
      <Scene from={tF} to={tFu - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center', padding: '110px 100px 170px' }}>
        <Win width={W} at={tF} focus={[{ at: tFz, roi: [165, 195, 975, 280] }]} media={<Rec from={tF} rec={0} />} />
      </Stage></Scene>
      {/* 漏斗②：组件重画五段，从上往下扫到第一个偏弱的 */}
      <Scene from={tFu - 0.1} to={tMe - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 40, paddingTop: 120 }}>
        <Funnel ats={['流量', '留存', '互动', '关系', '转化'].map((w) => say('漏斗', w))} scanAt={tScan} weak={3} />
        <div style={{ height: 120, display: 'flex', alignItems: 'center' }}><Pop at={say('漏斗', '就是这周')}><Stamp text="本周只改这一件" at={say('漏斗', '就是这周')} size={64} rotate={-4} /></Pop></div>
      </Stage></Scene>
      {/* 漏斗③：回到真实看板，红框框住视频号那一行的「关系」 */}
      <Scene from={tMe - 0.1} to={seg('漏斗').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', padding: '110px 100px 170px' }}>
        <Win width={W} at={tMe} focus={[{ at: tMe - 0.2, roi: [165, 330, 975, 140], dur: 0.01 }]} media={<Rec from={tMe - 0.1} rec={2} />}>
          <Box at={say('漏斗', '卡在关系')} x={568} y={498} w={135} h={108} label="S4 关系 · 偏弱" />
        </Win>
        <Pop at={say('漏斗', '看的人不少')} style={{ position: 'absolute', bottom: 210, display: 'flex', gap: 24 }}>
          <Chip style={{ fontSize: 34, padding: '10px 26px' }}>视频号 · 流量 及格</Chip>
          <Chip color={C.down} style={{ fontSize: 34, padding: '10px 26px' }}>关系 0.46% · 偏弱</Chip>
        </Pop>
      </Stage></Scene>

      {/* 计划①：复盘录屏滚过 */}
      <Scene from={seg('计划').start} to={tPlan + 0.6}><Stage style={{ alignItems: 'center', justifyContent: 'center', padding: '110px 100px 170px' }}>
        <Win width={W} at={seg('计划').start} media={<Rec from={seg('计划').start} rec={40.5} />} />
      </Stage></Scene>
      {/* 计划②：计划表，推近到目标与验收那一列 */}
      <Scene from={tPlan + 0.6} to={seg('计划').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', padding: '110px 100px 170px' }}>
        <Win width={W} at={tPlan + 0.6} focus={[{ at: tGoal, roi: [700, 120, 440, 400] }]} media={<Rec from={tPlan + 0.6} rec={53} />} />
        <Pop at={say('计划', '验收')} style={{ position: 'absolute', bottom: 200 }}><Chip color={C.warm} style={{ fontSize: 36, padding: '12px 30px' }}>每条选题：目标指标 + 验收口径</Chip></Pop>
      </Stage></Scene>

      {/* 创作：两块看板，分别标签；说到不露脸，插第六期开场两秒 */}
      <Scene from={tC} to={seg('创作').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', padding: '110px 100px 170px' }}>
        <Win width={W} at={tC} media={<Rec from={tC} rec={79.5} />}>
          <Pop at={tAuto} style={{ position: 'absolute', left: 40, top: 34 }}><Chip color={C.accent} style={{ fontSize: 32, padding: '8px 22px', background: 'rgba(8,11,17,.85)' }}>① 选题直出 · AI 全自动</Chip></Pop>
          <Pop at={tLive} style={{ position: 'absolute', left: 40, top: 500 }}><Chip color={C.warm} style={{ fontSize: 32, padding: '8px 22px', background: 'rgba(8,11,17,.85)' }}>② 口播剪辑 · 录口播，AI 剪</Chip></Pop>
        </Win>
        <Pop at={tMine} until={tLive - 0.1} style={{ position: 'absolute', right: 150, top: 170 }}>
          <div style={{ width: 640, borderRadius: 16, overflow: 'hidden', border: `3px solid ${C.accent}`, boxShadow: '0 30px 80px rgba(0,0,0,.7)' }}>
            <Sequence from={Math.round(tMine * 30)} layout="none"><OffthreadVideo src={staticFile('ep13/footage/ep06-hook.mp4')} muted style={{ width: 640, height: 360, display: 'block' }} /></Sequence>
            <div style={{ background: C.accent, color: '#fff', fontSize: 26, fontWeight: 900, padding: '6px 16px', fontFamily: FONT }}>最近的不露脸视频 · 0 镜头 0 手剪</div>
          </div>
        </Pop>
      </Stage></Scene>

      {/* 发布：勾三个平台 */}
      <Scene from={tPub} to={tCm - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center', padding: '110px 100px 170px' }}>
        <Win width={W} at={tPub} focus={[{ at: tPub + 0.3, roi: [560, 30, 560, 360] }]} media={<Rec from={tPub} rec={121} />} />
        <Pop at={say('发布和评论', '还能定时')} style={{ position: 'absolute', bottom: 200 }}><Chip color={C.warm} style={{ fontSize: 36, padding: '12px 30px' }}>视频号 · 抖音 · 小红书 一次排队</Chip></Pop>
      </Stage></Scene>
      {/* 评论：打码截图，推近到自动回复规则 */}
      <Scene from={tCm - 0.1} to={seg('发布和评论').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', padding: '110px 100px 170px' }}>
        <Win width={W} at={tCm} focus={[{ at: tCm + 0.5, roi: [640, 450, 500, 170] }]} media={<Shot file="comments-blur.png" />} />
        <Pop at={say('发布和评论', '我看一眼')} style={{ position: 'absolute', bottom: 200 }}><Chip color={C.accent} style={{ fontSize: 34, padding: '12px 30px' }}>先起草 · 人点一下才发 · 昵称已打码</Chip></Pop>
      </Stage></Scene>

      {/* 观点：强调字幕，背后闭环转起来 */}
      <Scene from={tView} to={tEnd - 0.05}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', opacity: 0.22 }}><Loop size={900} spin ats={[0, 0, 0, 0, 0, 0]} /></div>
        <KineticLine seg="观点" words={['拼到最后', '拼的不是', '哪一条爆了']} size={100} align="center" />
        <div style={{ marginTop: 30 }}><KineticLine seg="观点" words={['每周都知道', '下一条该怎么改']} hot={['下一条该怎么改']} size={120} align="center" color={C.warm} /></div>
      </Stage></Scene>

      {/* 收口 */}
      <Scene from={tEnd} to={tKey - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <FollowCTA name="宁少" sub="宁少 AI 进化论" at={tEnd + 0.1} clickAt={say('收口', '先关注')} />
      </Stage></Scene>
      <Scene from={tKey - 0.1} to={clock13.total}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 80 }}>
        <div><Pop at={tKey - 0.1}><Tag size={40} color={C.text}>评论区</Tag></Pop><div style={{ marginTop: 20 }}><CommentPop width={680} comments={[{ name: '你', text: '工作台', at: say('收口', '打'), likes: '' }]} /></div></div>
        <Pop at={tGift}><Panel style={{ padding: '26px 34px' }}><Tag>回复你</Tag><div style={{ transform: 'scale(.62)', transformOrigin: 'left top', width: 760 * 0.62, height: 470 * 0.62, marginTop: 12 }}><Funnel ats={[tGift, tGift + 0.1, tGift + 0.2, tGift + 0.3, tGift + 0.4]} scanAt={tGift + 0.5} weak={3} /></div><div style={{ fontSize: 34, fontWeight: 900 }}>五段漏斗复盘表</div></Panel></Pop>
      </Stage></Scene>
    </>
  );
};

export const EP13: React.FC = () => {
  useFonts();
  const c = clock13;
  const sfx: [number, string, number][] = [
    [c.say('开场', '不是拍视频'), 'thud.wav', 0.5], [c.say('开场', '是拍完以后'), 'whoosh.wav', 0.45], [c.say('开场', '这些事'), 'whoosh.wav', 0.4],
    [c.say('闭环', '复盘'), 'tick.wav', 0.4], [c.say('漏斗', '就是这周'), 'thud.wav', 0.45], [c.say('漏斗', '卡在关系'), 'tick.wav', 0.4], [c.seg('收口').start - 0.2, 'whoosh.wav', 0.4]];
  return (
    <ClockCtx.Provider value={c}>
      <AbsoluteFill style={{ fontFamily: FONT }}>
        <Bg /><Scenes />
        <Chrome chapters={chapters} hideBarBefore={c.seg('闭环').start} hero={hero} hot={hot} /><Finish />
        {sfx.map(([t, f, v], i) => <Sequence key={i} from={Math.max(0, Math.round(t * c.fps))} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
        <Audio src={staticFile('ep13/voice.wav')} />
        <Audio src={staticFile('ep13/bgm.mp3')} volume={(f) => 0.14 * Math.min(1, f / 45) * Math.min(1, Math.max(0, (c.total * c.fps - f) / 60))} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
