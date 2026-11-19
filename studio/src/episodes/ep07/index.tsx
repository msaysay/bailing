// 第七期：这条视频，是 AI 写代码画出来的。事为主（人不出镜），横屏 1920×1080。
// 时间全部用 say(段名, 词) 从录音里取；本片的组件数、镜头数、渲染时长只上画面，不进口播（stats.json，成片后回填）。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing, useClock } from '../../kit/clock';
import { Bg, C, Chip, FONT, Panel, Pop, Scene, Src, Stage, useFonts } from '../../kit/kit';
import { Footage, Shot } from '../../kit/footage';
import { Chrome } from '../../kit/chrome';
import { Quote, Stat } from '../../components';
import { Bars, Finish } from '../../components/rich';
import { CheckList, Milestones } from '../../components/rich2';
import { CodeDiff, PhoneFrame, Terminal } from '../../components/screen';
import { BrowserFrame } from '../../components/web';
import { DefinitionCard, MythFact } from '../../components/type';
import { MatrixReveal } from '../../components/fx2';
import { CommentPop, FollowCTA } from '../../components/talk';
import timing from './timing.json';
import shots from './shots.json';
import stats from './stats.json';
import groups from './groups.json';

export const clock07 = makeClock(timing as Timing);
const chapters = [{ no: '01', title: '不是点剪映', from: '反常识' }, { no: '02', title: '画面怎么来的', from: '原理' }, { no: '03', title: '这条片子的账', from: '证据' }];
const hot = ['Remotion', '232', '21', '组件库'];

const Big: React.FC<{ k?: number; children: React.ReactNode }> = ({ k = 1.4, children }) => <div style={{ transform: `scale(${k})` }}>{children}</div>;
const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 30 }) => <div style={{ fontSize: size, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{children}</div>;
const mmss = (s: number) => s < 60 ? `${Math.round(s)} 秒` : `${Math.floor(s / 60)} 分 ${Math.round(s % 60)} 秒`;

const Scenes: React.FC = () => {
  const { seg, say } = useClock();
  const tNo = say('反常识', '不是'), tApps = say('反常识', '做这条片子');
  const tWeb = say('原理', '你可以这么理解'), tCode = say('原理', '字什么时候');
  const tLib = say('组件', '我攒了'), tPick = say('组件', '这里该出');
  const tFix = say('好改', '一分钟左右');
  const tCta = say('收口', '想看这'), tNext = say('收口', '下一期');
  const l12 = clock07.lines[clock07.ln('原理', '字什么时候') - 1];
  const chars = l12.chars.slice(0, 4).map((c) => `{ "c": "${c.c}", "t": ${c.t} }`);
  const top = groups.top.slice(0, 7);
  return (
    <>
      {/* 开场：数字雨显影成真实画面（官网组件墙录屏） */}
      <Scene from={0} to={seg('开场').end}><AbsoluteFill>
        <MatrixReveal at={0} revealAt={0.1} dur={1.8}>
          <OffthreadVideo src={staticFile('ep07/footage/site-grid.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </MatrixReveal>
        <div style={{ position: 'absolute', left: 72, bottom: 26, fontFamily: FONT, fontSize: 18, color: C.muted }}>画面：宁少 AI 进化论官网 · 组件库录屏</div>
      </AbsoluteFill></Scene>

      {/* 反常识①：误区翻面 */}
      <Scene from={seg('反常识').start} to={tApps - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Big k={1.3}><MythFact myth="AI 剪辑 = AI 帮你点剪映" fact="AI 直接写代码，程序把画面算出来" at={seg('反常识').start} flipAt={tNo} width={1100} /></Big>
      </Stage></Scene>
      {/* 反常识②：本片打开过的剪辑软件 */}
      <Scene from={tApps - 0.1} to={seg('反常识').end}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 110 }}>
        <Big k={1.1}><Panel style={{ padding: '34px 50px' }}><Tag>做本片时打开过</Tag>
          <div style={{ marginTop: 22 }}><CheckList items={['剪映', 'Premiere', 'After Effects', '达芬奇'].map((x, i) => ({ text: x, ok: false, at: tApps + 0.2 + i * 0.3 }))} /></div>
        </Panel></Big>
        <Pop at={say('反常识', '都没打开')}><div style={{ textAlign: 'center' }}><div style={{ fontSize: 300, fontWeight: 900, color: C.accent, lineHeight: 1 }}>0</div><Tag size={38}>个剪辑软件</Tag></div></Pop>
      </Stage></Scene>

      {/* 原理①：名词卡 */}
      <Scene from={seg('原理').start} to={tWeb - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Big k={1.25}><DefinitionCard term="Remotion" phon="remotion.dev" pos="开源框架" at={say('原理', '画面是代码写的')} defs={['用 React 写视频：每一帧先在浏览器里画成网页', '逐帧截下来，再交给 ffmpeg 编成 mp4']} /></Big>
      </Stage></Scene>
      {/* 原理②：一条视频就是一个会动的网页（本项目工作台真实录屏） */}
      <Scene from={tWeb - 0.1} to={tCode - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center', padding: '120px 100px 170px' }}>
        <BrowserFrame url="localhost:3000/EP06" typeAt={tWeb} width={1560} height={800} at={tWeb - 0.1}>
          <OffthreadVideo src={staticFile('ep07/footage/studio.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        </BrowserFrame>
      </Stage></Scene>
      {/* 原理③：画面挂在录音里的字上（本期 timing.json 原样 + 场景代码） */}
      <Scene from={tCode - 0.1} to={seg('原理').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 34 }}>
        <CodeDiff file="studio/src/episodes/ep07/timing.json · 第 12 行字幕" width={1500} at={tCode} lines={[
          { kind: ' ', text: `"text": "${l12.text}",` }, ...chars.map((x) => ({ kind: ' ' as const, text: x }))]} />
        <CodeDiff file="studio/src/episodes/ep07/index.tsx" width={1500} at={say('原理', '都跟着我录音里的字走')} lines={[
          { kind: '+', text: "const tCode = say('原理', '字什么时候');   // 不写秒数，只认这个字" },
          { kind: '+', text: "<CodeDiff at={tCode} … />" }]} />
      </Stage></Scene>

      {/* 组件⓪：先亮出组件库（官网录屏垫底） */}
      <Scene from={seg('组件').start} to={tLib - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Pop at={say('组件', '靠组件库')}><Chip color={C.warm} style={{ fontSize: 56, padding: '18px 44px' }}>组件库</Chip></Pop>
      </Stage></Scene>
      {/* 组件①：21 组的分布 */}
      <Scene from={tLib - 0.1} to={tPick - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Big k={1.25}><Panel style={{ padding: '30px 48px' }}><Tag>{`${groups.total} 个组件 · ${groups.groups} 组 · 最多的 7 组`}</Tag>
          <div style={{ marginTop: 18 }}><Bars max={top[0].n} width={700} color={C.accent} rows={top.map((g, i) => ({ name: g.name, value: g.n, text: `${g.n}`, at: tLib + 0.3 + i * 0.12 }))} /></div>
          <Src>site/data.js · 组件目录</Src></Panel></Big>
      </Stage></Scene>
      {/* 组件②：同一个库里挑三样（真组件，真数据） */}
      <Scene from={tPick - 0.1} to={seg('组件').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 50, padding: '130px 100px 170px' }}>
        <Pop at={say('组件', '时间线')}><Panel style={{ padding: '18px 30px' }}><Tag>时间线 · 这个项目</Tag>
          <Milestones width={1500} points={[{ year: '11-13', title: '生产线开工', at: say('组件', '时间线') + 0.1 }, { year: '11-14', title: '组件到 232 个', at: say('组件', '时间线') + 0.4 }, { year: '11-14', title: '第五期上线', at: say('组件', '时间线') + 0.7 }, { year: '11-16', title: '本片', at: say('组件', '时间线') + 1.0, color: C.warm }]} />
        </Panel></Pop>
        <div style={{ display: 'flex', gap: 50, alignItems: 'flex-start' }}>
          <Pop at={say('组件', '排名')}><Panel style={{ padding: '24px 36px' }}><Tag>排名 · 组件最多的 3 组</Tag>
            <div style={{ marginTop: 14 }}><Bars max={top[0].n} width={360} color={C.warm} rows={top.slice(0, 3).map((g, i) => ({ name: g.name.replace('广播风 · ', ''), value: g.n, text: `${g.n}`, at: say('组件', '排名') + 0.1 + i * 0.12 }))} /></div></Panel></Pop>
          <Pop at={say('组件', '引用')}><Panel style={{ padding: '24px 40px', width: 760 }}><Tag>引用 · 第五期</Tag>
            <div style={{ transform: 'scale(.5)', transformOrigin: 'left top', width: 1400, height: 250 }}><Quote parts={['值钱的从来不是代码，', '而是你拿它做出了什么。']} ats={[say('组件', '引用') + 0.1, say('组件', '引用') + 0.4]} by="陈宁" /></div></Panel></Pop>
        </div>
      </Stage></Scene>

      {/* 好改①：一处真实改动（本片第一版 → 第二版） */}
      <Scene from={seg('好改').start} to={tFix - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <CodeDiff file="studio/src/episodes/ep07/index.tsx · 本片的一次返修" width={1560} at={seg('好改').start + 0.1}
          lines={(stats.diff.length ? stats.diff : [{ kind: ' ', text: '（返修记录回填）' }]) as { kind: ' ' | '+' | '-'; text: string }[]} />
      </Stage></Scene>
      {/* 好改②：只重渲那一段（真实命令和耗时） */}
      <Scene from={tFix - 0.1} to={seg('好改').end}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Terminal width={1560} title="本片 · 只重渲改过的那一段" at={tFix - 0.1} lines={[
          { cmd: `python3 scripts/seg_render.py EP07 --only ${stats.segRender.seg || '…'}`, at: tFix },
          { out: stats.segRender.out || '…', at: tFix + 1.7 },
          { out: `用时 ${stats.segRender.sec ? mmss(stats.segRender.sec) : '…'}，其余段直接用缓存`, at: say('好改', '不用整片重来'), ok: true }]} />
      </Stage></Scene>

      {/* 证据：本片的账，只在画面上 */}
      <Scene from={seg('证据').start} to={seg('证据').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 40 }}>
        <Pop at={seg('证据').start}><Tag size={36}>这条片子</Tag></Pop>
        <div style={{ display: 'flex', gap: 60 }}>
          <Big k={1.3}><Stat value={<span style={{ color: C.accent }}>{stats.components}</span>} label="个组件" at={say('证据', '几个组件')} src="index.tsx 里用到的" /></Big>
          <Big k={1.3}><Stat value={<span style={{ color: C.accent }}>{stats.shots}</span>} label="个真实镜头" at={say('证据', '几个镜头')} src="全部是本项目自己的录屏" /></Big>
          <Big k={1.3}><Stat value={<span style={{ color: C.warm }}>{mmss(stats.renderSec)}</span>} label="整片首次渲染" at={say('证据', '渲染了多久')} src="4 核云端机器" /></Big>
        </div>
      </Stage></Scene>

      {/* 收口 */}
      <Scene from={seg('收口').start} to={tCta - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <FollowCTA name="陈宁" sub="宁少 AI 进化论" at={seg('收口').start + 0.1} clickAt={say('收口', '内容创作认知')} />
      </Stage></Scene>
      <Scene from={tCta - 0.1} to={tNext - 0.1}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 90 }}>
        <PhoneFrame src="ep07/footage/showreel.mp4" height={760} at={tCta} />
        <div><Pop at={tCta}><Tag size={40} color={C.text}>评论区</Tag></Pop>
          <div style={{ marginTop: 20 }}><CommentPop width={700} comments={[{ name: '你', text: '组件', at: say('收口', '评论区打'), likes: '' }]} /></div></div>
      </Stage></Scene>
      <Scene from={tNext - 0.1} to={clock07.total}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 26 }}>
        <Pop at={tNext}><Tag size={36}>下期</Tag></Pop>
        <Pop at={tNext + 0.25}><div style={{ fontSize: 96, fontWeight: 900, textAlign: 'center' }}>我让 AI 拆了<span style={{ color: C.accent }}>三个大号</span></div></Pop>
        <Pop at={say('收口', '规律')}><Chip color={C.warm} style={{ fontSize: 34, padding: '12px 28px' }}>Fred · 小 Lin 说 · Yin's Broadcast</Chip></Pop>
      </Stage></Scene>
    </>
  );
};

export const EP07: React.FC = () => {
  useFonts();
  const c = clock07;
  const sfx: [number, string, number][] = [
    [c.say('开场', '一行行写代码') + 0.2, 'whoosh.wav', 0.45], [c.say('反常识', '不是'), 'tick.wav', 0.4], [c.say('原理', '你可以这么理解'), 'whoosh.wav', 0.35],
    [c.say('组件', '我攒了'), 'tick.wav', 0.35], [c.seg('证据').start, 'thud.wav', 0.4], [c.seg('收口').start - 0.2, 'whoosh.wav', 0.4]];
  return (
    <ClockCtx.Provider value={c}>
      <AbsoluteFill style={{ fontFamily: FONT }}>
        <Bg /><Footage shots={shots as Shot[]} dir="ep07/footage" /><Scenes />
        <Chrome chapters={chapters} hideBarBefore={c.seg('反常识').start} hot={hot} /><Finish />
        {sfx.map(([t, f, v], i) => <Sequence key={i} from={Math.max(0, Math.round(t * c.fps))} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
        <Audio src={staticFile('ep07/voice.wav')} />
        <Audio src={staticFile('ep07/bgm.mp3')} volume={(f) => 0.16 * Math.min(1, f / 45) * Math.min(1, Math.max(0, (c.total * c.fps - f) / 60))} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
