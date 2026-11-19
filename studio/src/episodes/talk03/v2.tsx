// 第五期「开源组件库」第二版：同一条口播，画面换成广播风组件（bc*.tsx），前 3 秒的钩子重做。
// 钩子：人全屏，头顶上方和下巴以下各一条组件快切片，每半秒硬切一次；说到「没有一帧是我手剪的」硬切推近，砸出「0 刀手剪」。
// 数字按口播里说的来：181 个、18 组。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { C, Chip, Pop, Scene, useFonts, useT } from '../../kit/kit';
import { Beat, Lower, Plate, TalkClip, TalkStage, TalkSubs, TW, UPPER } from '../../kit/talk';
import { ChatThread, PhoneFrame, TaskRun, Terminal } from '../../components/screen';
import { FollowCTA } from '../../components/talk';
import { SlamWords } from '../../components/type';
import { BC, ChapterSplash, HalftoneBg, NotEqual, ScrambleText, SlabBanner, SplitWords } from '../../components/bc';
import { ParticleBars } from '../../components/bc-data';
import { HubToBoxes } from '../../components/bc-diagram';
import timing from './timing.json';
import cutsFile from './cuts.json';

export const talk3bClock = makeClock(timing as Timing);
const { say, ln } = talk3bClock, cut = cutsFile.cuts;
const FACE = { x: 545, y: 660, w: 315 };
const F = 'talk03/footage/';
const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 32 }) => <div style={{ fontSize: size, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{children}</div>;
const Big: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.text, size = 96 }) => <div style={{ fontSize: size, fontWeight: 900, color, lineHeight: 1.15, whiteSpace: 'nowrap' }}>{children}</div>;
const chip = { fontSize: 34, padding: '10px 22px' };
/** 广播风的纸面底：一块带网点的色块，里面的东西居中。 */
const Paper: React.FC<{ theme?: 'paper' | 'red' | 'lime' | 'blue' | 'green' | 'black'; w?: number; h?: number; children: React.ReactNode }> = ({ theme = 'black', w = 1000, h = 440, children }) => (
  <HalftoneBg theme={theme} style={{ width: w, height: h, borderRadius: 26, boxShadow: '0 24px 60px rgba(0,0,0,.55)' }}><div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div></HalftoneBg>
);

const tNoHand = say('钩子', '没有一帧'), tList = say('钩子', '图表'), tAll = say('钩子', '一共 181'), tOpen = say('钩子', '今天啊'), tPain = say('痛点', '做口播的');
const tChore = say('痛点', '剪口误'), tHalf = say('痛点', '一分钟的视频'), tNo = say('痛点', '我不想剪'), tSo = say('痛点', '所以我做了');
const tTwo = say('组件库', '它有两个部分'), t1 = say('组件库', '第一个部分'), tN = say('组件库', '181 个画面组件'), tNum = say('组件库', '你说到数字'), tSee = say('组件库', '你说到你看'), tKey = say('组件库', '你说到重点'), tSlam = say('组件库', '它就砸大字');
const t2 = say('步骤', '第二个部分'), t12 = say('步骤', '12 个步骤'), tSteps = say('步骤', '定稿'), tEach = say('步骤', '每一步干什么'), tPass = say('步骤', '做到什么程度');
const tUse = say('用法', '用法很简单'), tRepo = say('用法', '把仓库'), tCC = say('用法', 'Claude Code'), tRaw = say('用法', '再给它一条'), tRead = say('用法', '它自己会读'), tAsk = say('用法', '中间啊'), tPrev = say('用法', '我上一条视频');
const tZero = say('不收费', '这套东西啊'), tWhy = say('不收费', '为什么开源'), tVal = say('不收费', '因为值钱的'), tCode = say('不收费', '从来都不是代码'), tMade = say('不收费', '而是你拿它'), tHope = say('不收费', '希望你做出');
const tName = say('收口', '我是陈宁'), tShare = say('收口', '分享 AI'), tWant = say('收口', '想要的'), tCmt = say('收口', '在评论区打'), END = talk3bClock.total;
const words: [string, string, string][] = [['图表', 'hook-chart', 'B21 粒子柱状图'], ['大字', 'hook-title', 'B07 双语大标题'], ['时间线', 'hook-timeline', 'E18 剪辑时间线'], ['数字雨', 'hook-rain', 'E22 数字雨显影']];
const wAt = (i: number) => (i < words.length ? say('钩子', words[i][0]) - 0.05 : say('钩子', '全是组件') + 0.55);

const beats: Beat[] = [
  { at: 0, mode: 'full', zoom: 1 },                                   // 钩子：人全屏，上下贴组件快切
  { at: tNoHand - 0.04, mode: 'full', zoom: 1.22, dur: 0 },           // 硬切全屏：0 刀手剪
  { at: tList - 0.25, mode: 'bubble', dur: 0.35 },                    // C：念一个词切一个组件
  { at: tAll - 0.3, mode: 'full', zoom: 1 },                          // B：181
  { at: tOpen - 0.05, mode: 'full', zoom: 1.15, dur: 0 },             // B：全部开源
  { at: tPain - 0.05, mode: 'full', zoom: 1, dur: 0 },                // A
  { at: tChore - 0.3, mode: 'bubble' },                               // C：手剪的时间线
  { at: tNo - 0.3, mode: 'full', zoom: 1.2 },                         // A
  { at: tSo - 0.05, mode: 'full', zoom: 1.04, dur: 0 },               // A
  { at: tTwo - 0.05, mode: 'full', zoom: 1, dur: 0 },                 // B：黑白对开
  { at: tN - 0.3, mode: 'bubble' },                                   // E 之后 C
  { at: tNum - 0.3, mode: 'full', zoom: 1 },                          // B：粒子柱状图
  { at: tSee - 0.3, mode: 'bubble' },                                 // C：切素材
  { at: tKey - 0.3, mode: 'full', zoom: 1.12 },                       // B：砸大字
  { at: t2, mode: 'full', zoom: 1, dur: 0 },                          // E：02
  { at: tSteps - 0.3, mode: 'bubble' },                               // C：skills 目录
  { at: tEach - 0.3, mode: 'bubble' },                                // C：每份说明里写了什么
  { at: tUse - 0.05, mode: 'full', zoom: 1.2, dur: 0 },               // A
  { at: tRepo - 0.05, mode: 'full', zoom: 1, dur: 0 },                // B：中心到方框
  { at: tRead - 0.3, mode: 'bubble' },                                // C：对话
  { at: tPrev - 0.35, mode: 'card', box: [60, 330, 440, 620] },       // D：上一条成片
  { at: tZero - 0.3, mode: 'bubble' },                                // C：不收费和成本；剪口落在小圆里
  { at: tWhy - 0.05, mode: 'full', zoom: 1.26, dur: 0 },              // A
  { at: tVal - 0.3, mode: 'bubble' },                                 // C：不等式
  { at: tHope - 0.05, mode: 'full', zoom: 1.12, dur: 0 },             // A
  { at: tName - 0.05, mode: 'full', zoom: 1, dur: 0 },                // B
];
const hot = ['没有一帧', '全是组件', '181', '全部开源', '不收费', '半天', 'AI 替我剪', '组件库', '18 组', '图表', '切素材', '砸大字', 'Skill', '12 个', '写清楚了', 'Claude Code', 'Codex', 'WorkBuddy', '口播原片', '问你一句', '成本', '代码', '陈宁', '组件'];
const sfx: [number, string, number][] = [[tNoHand, 'thud.wav', 0.5], ...words.map((_, i) => [wAt(i) + 0.05, 'tick.wav', 0.3] as [number, string, number]), [tAll + 0.6, 'thud.wav', 0.4], [t1, 'whoosh.wav', 0.45], [tSlam, 'thud.wav', 0.45], [t2, 'whoosh.wav', 0.45], [tCode, 'tick.wav', 0.35]];
const groups: [string, number][] = [['炫技动效', 25], ['广播风 · 图解', 21], ['广播风 · 文字', 20], ['文字与强调', 16]];
const steps: [string, string][] = [['定稿', 'talk-01-shoot'], ['对字幕', 'talk-02-roughcut'], ['找素材', 'video-04-footage'], ['排版式', 'talk-03-layout'], ['出片', 'talk-04-build'], ['做封面', 'video-08-cover']];

/** 快切片里的一行（1080×1824，三行各 608 高）。crop 是只露出这一行里从上往下多高的一条。硬进硬出。 */
const Reel: React.FC<{ row: number; top: number; height?: number; at: number; until: number; startFrom?: number }> = ({ row, top, height = 608, at, until, startFrom = 0 }) => {
  const t = useT(), { fps } = useVideoConfig(); if (t < at || t >= until) return null;
  return (
    <Sequence from={Math.round(at * fps)} layout="none">
      <div style={{ position: 'absolute', left: 0, top, width: TW, height, overflow: 'hidden' }}>
        <OffthreadVideo src={staticFile(F + 'showreel2.mp4')} muted startFrom={Math.round(startFrom * fps)} style={{ position: 'absolute', left: 0, top: -row * 608 - (608 - height) / 2, width: TW, height: 1824, maxWidth: 'none' }} />
      </div>
    </Sequence>
  );
};
/** 硬切的素材片段，放在 UPPER 区。 */
const Cut: React.FC<{ src: string; at: number; until: number }> = ({ src, at, until }) => {
  const t = useT(), { fps } = useVideoConfig(); if (t < at || t >= until) return null;
  return <Sequence from={Math.round(at * fps)} layout="none"><OffthreadVideo src={staticFile(F + src + '.mp4')} muted style={{ position: 'absolute', left: 0, top: UPPER.top, width: TW, height: UPPER.height }} /></Sequence>;
};
/** 整屏章节页：广播风的色块加大号序号。 */
const Chapter: React.FC<{ no: string; title: string; sub: string; theme: 'blue' | 'red'; at: number; hold: number }> = ({ no, title, sub, theme, at, hold }) => {
  const t = useT(); if (t < at || t >= at + hold) return null;
  return <AbsoluteFill style={{ background: theme === 'blue' ? BC.blue : BC.red }}><div style={{ position: 'absolute', left: 0, top: 300, width: 1080, height: 1080 }}><ChapterSplash width={1080} height={1080} no={no} title={title} sub={sub} theme={theme} at={at} /></div></AbsoluteFill>;
};

export const TALK03B: React.FC = () => {
  useFonts();
  const t = useT();
  return (
    <ClockCtx.Provider value={talk3bClock}>
      <TalkStage src="talk03/person.mp4" face={FACE} beats={beats} under={<>
        {words.map(([, src], i) => <Cut key={src} src={src} at={wAt(i)} until={wAt(i + 1)} />)}
        <TalkClip src="talk02/footage/jianying.mp4" at={tChore - 0.25} until={tNo - 0.3} credit="录屏：剪映时间线" />
        <Reel row={2} top={UPPER.top} at={tN - 0.05} until={tNum - 0.3} startFrom={4.85} />
        <TalkClip src="talk02/footage/doubao-hot-table.mp4" at={tSee - 0.25} until={tKey - 0.3} credit="录屏素材" />
      </>}>
        {/* 钩子：头顶上方一条、下巴以下一块，都是组件快切片，各镶一道亮线 */}
        <Reel row={0} top={0} height={300} at={0} until={tNoHand - 0.04} />
        <Reel row={1} top={1090} at={0} until={tNoHand - 0.04} startFrom={0.4} />
        {t < tNoHand - 0.04 && <><div style={{ position: 'absolute', left: 0, top: 300, width: TW, height: 8, background: BC.lime }} /><div style={{ position: 'absolute', left: 0, top: 1082, width: TW, height: 8, background: BC.lime }} /><div style={{ position: 'absolute', left: 0, top: 1698, width: TW, height: 8, background: BC.lime }} /></>}
        {/* 硬切那一下闪一帧 */}
        {t >= tNoHand - 0.04 && t < tNoHand + 0.05 && <AbsoluteFill style={{ background: BC.lime, opacity: 0.5 - (t - tNoHand + 0.04) * 5.5 }} />}
        {/* B：0 刀手剪 */}
        <Scene from={tNoHand - 0.04} to={tList - 0.3} hard><Lower style={{ top: 1100 }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}><ScrambleText text="0" at={tNoHand} dur={0.45}>{(s) => <div style={{ fontSize: 420, fontWeight: 900, lineHeight: 0.86, color: BC.lime, textShadow: '0 10px 40px rgba(0,0,0,.6)' }}>{s}</div>}</ScrambleText><div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1, color: BC.white, paddingBottom: 26, textShadow: '0 10px 40px rgba(0,0,0,.7)' }}>刀手剪</div></div>
          <SlabBanner text="这条 78 秒 · 从头到尾 AI 剪" at={tNoHand + 0.5} size={50} rotate={-3} />
        </Lower></Scene>

        {/* C：念到哪个词，下面记下它是哪个组件 */}
        <Scene from={tList - 0.1} to={tAll - 0.35}><Lower style={{ top: 1110, gap: 14 }}>
          {words.map(([, , label], i) => <Pop key={label} at={wAt(i) + 0.05} dy={10} dur={0.2}><div style={{ fontSize: 40, fontWeight: 900, color: BC.ink, background: i % 2 ? BC.white : BC.lime, padding: '8px 26px', transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)`, whiteSpace: 'nowrap' }}>{label}</div></Pop>)}
        </Lower></Scene>

        {/* B：181 个 */}
        <Scene from={tAll - 0.05} to={say('钩子', '全部开源') - 0.3}><Lower style={{ top: 1120 }}><div style={{ display: 'flex', alignItems: 'center', gap: 30 }}><ScrambleText text="181" at={tAll} dur={0.6}>{(x) => <div style={{ fontSize: 290, fontWeight: 900, lineHeight: 0.9, color: BC.lime, textShadow: '0 10px 40px rgba(0,0,0,.6)' }}>{x}</div>}</ScrambleText><SlabBanner text="个画面组件" at={tAll + 0.5} size={46} rotate={-2} bg={BC.white} /></div></Lower></Scene>
        {/* B：全部开源 */}
        <Scene from={say('钩子', '全部开源') - 0.15} to={tPain - 0.15} hard><Lower style={{ top: 1180, gap: 34 }}><SlabBanner text="全部开源" at={say('钩子', '全部开源') - 0.1} size={150} rotate={-3} bg={BC.lime} /><SlabBanner text="不收费" at={say('钩子', '不收费') - 0.05} size={110} rotate={2} /></Lower></Scene>

        {/* C：手剪要做的四件事 */}
        <Scene from={tChore - 0.1} to={tNo - 0.35}><Lower style={{ top: 1110, gap: 22 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '22px 26px', width: 900 }}>{['剪口误', '对字幕', '找画面', '配图表'].map((w, i) => <SlabBanner key={w} text={w} at={say('痛点', w) - 0.05} size={76} rotate={i % 2 ? 2 : -3} />)}</div>
          <Pop at={tHalf}><div style={{ display: 'flex', alignItems: 'baseline', gap: 20, marginTop: 20 }}><Big size={64}>1 分钟成片</Big><Pop at={say('痛点', '能剪半天')} dy={0}><Big size={84} color={BC.lime}>≈ 半天</Big></Pop></div></Pop>
        </Lower></Scene>

        {/* B：两个部分，黑白对开 */}
        <Scene from={tTwo} to={t1 - 0.15} hard><Lower style={{ top: 1130 }}><div style={{ borderRadius: 26, overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,.55)' }}><SplitWords width={1000} height={400} left={{ text: '组件库', sub: '01' }} right={{ text: 'SKILL', sub: '02' }} at={tTwo} /></div></Lower></Scene>

        {/* C：181 个，18 组 */}
        <Scene from={tN - 0.1} to={tNum - 0.35}><Lower style={{ top: 1110, height: 260, flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-end', gap: 50 }}>
          <Pop at={tN} dy={0}><div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}><div style={{ fontSize: 220, fontWeight: 900, lineHeight: 1, color: BC.lime }}>181</div><div style={{ fontSize: 60, fontWeight: 900, color: BC.white }}>个</div></div></Pop>
          <Pop at={say('组件库', '分成 18 组')} dy={0}><div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}><div style={{ fontSize: 220, fontWeight: 900, lineHeight: 1, color: BC.white }}>18</div><div style={{ fontSize: 60, fontWeight: 900, color: BC.white }}>组</div></div></Pop>
        </Lower></Scene>

        {/* B：说到数字，出图表（画的是组件库里最多的四组） */}
        <Scene from={tNum - 0.05} to={tSee - 0.35}><Lower style={{ top: 1100 }}><Paper theme="black" w={1000} h={560}><ParticleBars at={say('组件库', '它就能出图表') - 0.5} width={860} height={420} bars={groups.map(([label, v], i) => ({ label, v, text: v + ' 个', tone: i === 2 ? 'white' : 'lime' as const }))} tag={{ i: 0, text: '最多的一组' }} /></Paper></Lower></Scene>

        {/* C：说到「你看」，切素材 */}
        <Scene from={tSee} to={tKey - 0.35}><Lower style={{ top: 1130 }}><SlabBanner text="人缩成小圆 · 素材顶上来" at={tSee + 0.2} size={62} rotate={-2} bg={BC.white} /></Lower></Scene>

        {/* B：砸大字 */}
        <Scene from={tSlam - 0.05} to={t2 - 0.15} hard><Lower style={{ top: 1180 }}><SlamWords size={190} width={1000} words={[{ text: '砸', color: BC.white }, { text: '大', color: BC.red }, { text: '字', color: BC.lime }]} ats={[tSlam, tSlam + 0.3, tSlam + 0.55]} /></Lower></Scene>

        {/* B：12 个步骤说明 */}
        <Scene from={t12 - 0.05} to={tSteps - 0.35}><Lower style={{ top: 1130 }}><div style={{ display: 'flex', alignItems: 'center', gap: 30 }}><ScrambleText text="12" at={t12} dur={0.5}>{(s) => <div style={{ fontSize: 330, fontWeight: 900, lineHeight: 0.9, color: BC.lime, textShadow: '0 10px 40px rgba(0,0,0,.6)' }}>{s}</div>}</ScrambleText><div><SlabBanner text="个步骤说明" at={t12 + 0.3} size={54} rotate={-2} bg={BC.white} /><div style={{ marginTop: 22 }}><SlabBanner text="每个一份 SKILL.md" at={t12 + 0.6} size={40} rotate={1} /></div></div></div></Lower></Scene>

        {/* C：skills 目录，下面逐个点亮 */}
        <Scene from={tSteps - 0.1} to={tEach - 0.35}>
          <div style={{ position: 'absolute', left: 40, top: UPPER.top + 10, transform: 'scale(.909)', transformOrigin: 'left top' }}><Terminal at={tSteps - 0.05} title="skills/" width={1100} lines={[{ cmd: 'ls skills/', at: tSteps }, { out: 'talk-01-shoot     talk-02-roughcut', at: tSteps + 0.6 }, { out: 'talk-03-layout    talk-04-build', at: tSteps + 0.9 }, { out: 'video-01-script … video-08-cover', at: tSteps + 1.2 }, { out: '共 12 个', at: tSteps + 1.6, ok: true }]} /></div>
          <Lower style={{ top: 1100 }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, width: 940 }}>{steps.map(([w, f]) => <Pop key={w} at={say('步骤', w) - 0.05} dy={10}><div style={{ background: 'rgba(10,10,10,.9)', borderLeft: `8px solid ${BC.lime}`, padding: '10px 20px', width: 305, boxSizing: 'border-box' }}><div style={{ fontSize: 42, fontWeight: 900, color: BC.white }}>{w}</div><div style={{ fontSize: 20, color: BC.lime, fontFamily: 'ui-monospace, Menlo, monospace' }}>{f}</div></div></Pop>)}</div></Lower>
        </Scene>

        {/* B：每份说明里写了什么 */}
        <Scene from={tEach - 0.05} to={tUse - 0.15}><Lower style={{ top: 1120 }}><SlabBanner text="每份 SKILL.md 都是这四段" at={tEach + 0.2} size={56} rotate={-2} bg={BC.lime} /></Lower><Lower style={{ top: UPPER.top + 110 }}><Plate style={{ width: 960, boxSizing: 'border-box', padding: '20px 40px', background: 'rgba(10,10,10,.9)', borderRadius: 0, borderLeft: `10px solid ${BC.lime}` }}>
          {([['输入', '拿到什么才能开工', tEach], ['步骤', '这一步干什么', tEach + 0.4], ['检查', '怎么自查', tPass], ['放行条件', '做到什么程度才算过', tPass + 0.5]] as [string, string, number][]).map(([k, v, at], i) => <Pop key={k} at={at} dy={12}><div style={{ display: 'flex', alignItems: 'center', height: 80, borderBottom: i < 3 ? '1px solid rgba(245,243,236,.2)' : 'none' }}><div style={{ width: 230, fontSize: 42, fontWeight: 900, color: i === 3 ? BC.lime : BC.white }}>{k}</div><div style={{ fontSize: 34, fontWeight: 600, color: 'rgba(245,243,236,.6)' }}>{v}</div></div></Pop>)}
        </Plate></Lower></Scene>

        {/* B：仓库加原片，交给谁都行 */}
        <Scene from={tRepo - 0.05} to={tRead - 0.35} hard><Lower style={{ top: 1110 }}><Paper theme="blue" w={1020} h={560}><HubToBoxes hub="仓库 + 原片" boxes={['Claude Code', 'Codex', 'WorkBuddy']} tags={[{ text: '读的是同一套 Skill', at: tRaw }]} at={tRepo} width={960} height={500} /></Paper></Lower></Scene>

        {/* C：它自己做，只在关键点问一句（对话是示意） */}
        <Scene from={tRead - 0.1} to={tPrev - 0.4}>
          <div style={{ position: 'absolute', left: 50, top: UPPER.top + 30 }}><ChatThread width={980} messages={[{ who: 'me', text: '按 skills/README.md 做这条口播', at: tRead }, { who: 'other', text: '稿子整理好了，剪掉一处口吃。版式表你看一眼？', at: tAsk - 0.4 }]} /></div>
          <div style={{ position: 'absolute', left: 50, top: UPPER.top - 6, fontSize: 22, color: C.muted }}>示意</div>
          <Lower style={{ top: 1090 }}><div style={{ transform: 'scale(.9)', transformOrigin: 'center top' }}><TaskRun title="它自己往下做" width={900} tasks={[{ text: '转写，剪口误', at: tRead, doneAt: tRead + 0.7 }, { text: '对齐字幕', at: tRead + 0.7, doneAt: say('用法', '一步步做') + 0.3 }, { text: '排版式（等你点头）', at: say('用法', '一步步做') + 0.3, doneAt: say('用法', '问你一句') + 0.4 }, { text: '写代码，渲染，自查', at: say('用法', '问你一句') + 0.4, doneAt: tPrev - 0.6 }]} /></div></Lower>
        </Scene>

        {/* D：人在左，上一条成片在右 */}
        <Scene from={tPrev - 0.1} to={tZero - 0.4}>
          <div style={{ position: 'absolute', left: 600, top: 320 }}><PhoneFrame src="talk03/footage/prev.mp4" at={tPrev - 0.1} height={640} /></div>
          <Lower style={{ top: 1110 }}><SlabBanner text="89 秒原片 → 89 秒成片" at={say('用法', '从原片到成片')} size={64} rotate={-2} bg={BC.white} /><div style={{ marginTop: 10 }}><SlabBanner text="0 刀手剪" at={say('用法', '就是这么出来的')} size={90} rotate={2} bg={BC.lime} /></div></Lower>
        </Scene>

        {/* C：不收费在上，成本在下 */}
        <Scene from={tZero - 0.05} to={tWhy - 0.1}>
          <Lower style={{ top: UPPER.top + 60 }}><Pop at={tZero}><Paper theme="lime" w={1000} h={480}><div style={{ textAlign: 'center', color: BC.ink }}><div style={{ fontSize: 44, fontWeight: 700 }}>Skill + 组件库</div><div style={{ fontSize: 300, fontWeight: 900, lineHeight: 1 }}>¥0</div></div></Paper></Pop></Lower>
          <Lower style={{ top: 1110, flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch', gap: 24 }}>
            <Pop at={cut[0] + 0.1}><div style={{ width: 440, background: 'rgba(245,243,236,.06)', borderTop: `10px solid ${BC.red}`, padding: '24px 30px', boxSizing: 'border-box' }}><Tag size={32}>AI 额度</Tag><Big size={96} color={BC.white}>自付</Big></div></Pop>
            <Pop at={say('不收费', '找素材的接口')}><div style={{ width: 440, background: 'rgba(245,243,236,.06)', borderTop: `10px solid ${BC.red}`, padding: '24px 30px', boxSizing: 'border-box' }}><Tag size={32}>素材接口</Tag><Big size={96} color={BC.white}>自付</Big></div></Pop>
          </Lower>
        </Scene>

        {/* B：代码 ≠ 你的作品 */}
        <Scene from={tVal - 0.1} to={tHope - 0.1}><Lower style={{ top: UPPER.top + 40 }}><Paper theme="blue" w={1000} h={540}><NotEqual a="代码" b="你的作品" sub="值钱的是后一个" at={tCode - 0.2} size={150} /></Paper></Lower></Scene>

        {/* B：关注，然后评论区打「组件」 */}
        <Scene from={tName - 0.05} to={tWant - 0.2} hard><Lower style={{ top: 1180 }}><FollowCTA name="陈宁" sub="AI 时代的内容创作认知" at={tName} clickAt={tShare + 1.2} width={920} /></Lower></Scene>
        <Scene from={tWant - 0.1} to={END + 1}><Lower style={{ top: 1150 }}><Pop at={tWant}><Plate style={{ width: 900, boxSizing: 'border-box', background: 'rgba(10,10,10,.9)', borderRadius: 0, borderLeft: `10px solid ${BC.lime}` }}>
          <Tag>想要仓库地址</Tag>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 18 }}>
            <div style={{ flex: 1, height: 96, background: BC.white, display: 'flex', alignItems: 'center', padding: '0 36px', fontSize: 56, fontWeight: 900, color: BC.ink }}>{'组件'.slice(0, Math.max(0, Math.floor((t - tCmt - 0.3) / 0.25)))}<span style={{ width: 5, height: 56, background: BC.red, marginLeft: 6 }} /></div>
            <div style={{ fontSize: 40, fontWeight: 900, color: BC.ink, background: BC.lime, padding: '20px 44px' }}>发送</div>
          </div>
        </Plate></Pop></Lower></Scene>

        <div style={{ position: 'absolute', left: 40, top: 60, fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,.85)', background: 'rgba(8,11,17,.55)', borderRadius: 10, padding: '6px 14px', opacity: t < tNoHand ? 0 : 1 }}>真人出镜 · AI 剪辑</div>

        {/* E：章节页 */}
        <Chapter no="01" title="LIBRARY" sub="组件库" theme="blue" at={t1 - 0.05} hold={tN - t1 - 0.05} />
        <Chapter no="02" title="SKILLS" sub="步骤说明" theme="red" at={t2 - 0.05} hold={t12 - t2 - 0.1} />
        <TalkSubs hot={hot} hide={[ln('组件库', '第一个部分'), ln('步骤', '第二个部分')]} />
      </TalkStage>
      <Audio src={staticFile('talk03/voice.wav')} />
      <Audio src={staticFile('talk03/bgm.mp3')} volume={(f) => { const x = f / talk3bClock.fps; return (x < tAll - 0.5 ? 0.24 : x < tAll + 0.5 ? 0.24 - 0.1 * (x - tAll + 0.5) : 0.14) * Math.min(1, x / 0.3) * Math.min(1, Math.max(0, (END - x) / 1.5)); }} />
      {sfx.map(([at, f, v], i) => <Sequence key={i} from={Math.round(at * talk3bClock.fps)} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
    </ClockCtx.Provider>
  );
};
