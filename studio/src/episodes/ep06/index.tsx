// 第六期：不露脸，这次终于不吃亏了。事为主（人不出镜），横屏 1920×1080。
// 时间全部用 say(段名, 词) 从录音里取；画面字只放口播里没有的信息；真实画面用本项目自己的官网录屏和这期录音的波形。
import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing, useClock } from '../../kit/clock';
import { Bg, C, Chip, FONT, Panel, Pop, Scene, Src, Stage, useFonts, useT } from '../../kit/kit';
import { Footage, Shot } from '../../kit/footage';
import { Chrome } from '../../kit/chrome';
import { Versus } from '../../components';
import { Bars, Finish, KineticLine } from '../../components/rich';
import { CheckList } from '../../components/rich2';
import { CodeDiff, Notifications, ScreenFrame, TaskRun, Terminal } from '../../components/screen';
import { StrikeReplace, Stamp, WordSwap } from '../../components/type';
import { SplitWords, BiTag } from '../../components/bc';
import { CommentPop, FollowCTA } from '../../components/talk';
import timing from './timing.json';
import shots from './shots.json';
import stats from './stats.json';

export const clock06 = makeClock(timing as Timing);
const chapters = [{ no: '01', title: '为什么吃亏', from: '痛点' }, { no: '02', title: '这条片子怎么来的', from: '证据' }, { no: '03', title: '接下来拼什么', from: '观点' }];
// 强调字幕承担的行（底部字幕让位）
const hero = [clock06.ln('开场', '以前做自媒体'), clock06.ln('开场', '从这条视频开始'), clock06.ln('怎么做到', '说到重点'), clock06.ln('观点', '所以啊'), clock06.ln('观点', '也不是谁剪得好')];
const hot = ['6 秒', '逐字时间', '备忘录', 'AI', '不露脸'];

const Big: React.FC<{ k?: number; children: React.ReactNode }> = ({ k = 1.4, children }) => <div style={{ transform: `scale(${k})` }}>{children}</div>;
const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 30 }) => <div style={{ fontSize: size, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{children}</div>;

/** 这期录音的真实波形，播放头跟着当前时刻走。 */
const Wave: React.FC<{ at: number }> = ({ at }) => {
  const t = useT(), { total } = useClock();
  return (
    <Pop at={at}><Panel style={{ padding: '30px 40px', width: 1640 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Tag color={C.text} size={34}>06.wav</Tag><Tag>{`单声道人声 · ${stats.cutSec} 秒 · 手机录音`}</Tag>
      </div>
      <div style={{ position: 'relative', marginTop: 24, height: 240 }}>
        <Img src={staticFile('ep06/footage/wave.png')} style={{ width: 1560, height: 240, opacity: 0.9 }} />
        <div style={{ position: 'absolute', left: `${(t / total) * 100}%`, top: -10, bottom: -10, width: 4, background: C.warm, boxShadow: `0 0 18px ${C.warm}` }} />
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(t / total) * 100}%`, background: 'rgba(255,212,121,.10)' }} />
      </div>
      <Src style={{ marginTop: 16 }}>这条视频唯一的输入：一段录音，没有一个镜头是拍的</Src>
    </Panel></Pop>
  );
};

const Scenes: React.FC = () => {
  const { seg, say } = useClock();
  const tWhy = say('吃亏在哪', '因为人不出镜'), tGrind = say('吃亏在哪', '找素材'), tTeam = say('吃亏在哪', '专业团队');
  const tWave = say('证据', '就是录了'), tAI = say('证据', '剩下的');
  const tCode = say('怎么做到', '然后一段一段'), tNum = say('怎么做到', '说到数字'), tVs = say('怎么做到', '说到对比'), tBig = say('怎么做到', '说到重点'), tQc = say('怎么做到', '最后它');
  const tLine = say('观点', '不露脸的人'), tMe = seg('收口').start, tAsk = say('收口', '你是不是'), tNext = say('收口', '下一期');
  const segRows = clock06.segments.map((s, i) => ({ name: s.name, value: s.end - s.start, text: `${(s.end - s.start).toFixed(1)} 秒`, at: tNum + 0.1 + i * 0.12 }));
  return (
    <>
      {/* 开场：一个等号被改写。底下垫官网首屏录屏 */}
      <Scene from={0} to={seg('开场').end}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <StrikeReplace before="不露脸 ＝ " wrong="吃亏" right="不吃亏" at={0.15} fixAt={say('开场', '不一样了')} size={150} />
        <Pop at={say('开场', '从这条视频开始')} style={{ marginTop: 60 }}><Chip color={C.warm} style={{ fontSize: 34, padding: '12px 28px' }}>本片：0 个出镜镜头 · 0 次手剪</Chip></Pop>
      </Stage></Scene>

      {/* 痛点①：东西都有，就差对着镜头 */}
      <Scene from={seg('痛点').start} to={say('痛点', '有人怕尴尬') - 0.1}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 120 }}>
        <Big k={1.6}><Panel style={{ padding: '40px 56px', minWidth: 640 }}>
          <Tag>想做内容的人 · 自检</Tag>
          <div style={{ marginTop: 26 }}><CheckList items={[{ text: '想法', at: say('痛点', '有想法'), ok: true }, { text: '专业', at: say('痛点', '有专业'), ok: true }, { text: '对着镜头', at: say('痛点', '不想对着镜头'), ok: false }]} /></div>
        </Panel></Big>
      </Stage></Scene>
      {/* 痛点②：三个理由一张张贴上 */}
      <Scene from={say('痛点', '有人怕尴尬') - 0.1} to={say('痛点', '结果呢') - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 46 }}>
        <Pop at={say('痛点', '有人怕尴尬') - 0.05}><Tag size={36}>不出镜的三个理由</Tag></Pop>
        <div style={{ display: 'flex', gap: 40 }}>
          <BiTag text="尴尬" at={say('痛点', '怕尴尬')} size={70} rotate={-4} />
          <BiTag text="熟人会刷到" at={say('痛点', '同事')} size={70} rotate={3} bg={C.warm} color="#111" />
          <BiTag text="不上镜" at={say('痛点', '不上镜')} size={70} rotate={-2} bg={C.accent} />
        </div>
      </Stage></Scene>
      {/* 痛点③：备忘录里的选题一条条堆着，没有一条发出去 */}
      <Scene from={say('痛点', '结果呢') - 0.1} to={seg('痛点').end}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 80 }}>
        <Notifications width={820} ats={[say('痛点', '结果呢'), say('痛点', '好内容'), say('痛点', '只能烂在'), say('痛点', '备忘录里')]} items={[
          { app: '备忘录', title: '选题 · 三月', body: '行业里没人讲透的那件事' }, { app: '备忘录', title: '选题 · 五月', body: '我做了十年才明白的一个道理' },
          { app: '备忘录', title: '选题 · 八月', body: '客户最常问我的三个问题' }, { app: '备忘录', title: '选题 · 十一月', body: '草稿，未发布' }]} />
        <Pop at={say('痛点', '备忘录里') + 0.2}><Stamp text="未发布" at={say('痛点', '备忘录里') + 0.2} size={110} /></Pop>
      </Stage></Scene>

      {/* 吃亏在哪①：出镜的人自己就是画面；不出镜，每一秒都得找东西填 */}
      <Scene from={seg('吃亏在哪').start - 0.25} to={tGrind - 0.15}><AbsoluteFill>
        <SplitWords at={seg('吃亏在哪').start} left={{ text: '出镜', sub: '人就是画面' }} right={{ text: '不出镜', sub: '每一秒都要找画面填' }} />
      </AbsoluteFill></Scene>
      {/* 吃亏在哪②：手工活一项项转圈，迟迟不完 */}
      <Scene from={tGrind - 0.15} to={tTeam - 0.15}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 90 }}>
        <Big k={1.3}><TaskRun title="手剪一条 1 分钟口播" width={860} tasks={[
          { text: '找素材：翻图库、录屏、截图', at: say('吃亏在哪', '找素材'), doneAt: 999 },
          { text: '配图表：一个个数字手敲', at: say('吃亏在哪', '配图表'), doneAt: 999 },
          { text: '对字幕：逐句拖时间轴', at: say('吃亏在哪', '对字幕'), doneAt: 999 }]} /></Big>
        <Pop at={say('吃亏在哪', '能剪大半天')}><Panel style={{ padding: '30px 44px', borderTop: `6px solid ${C.down}` }}>
          <Tag>时间轴上</Tag><div style={{ fontSize: 120, fontWeight: 900, color: C.down, lineHeight: 1.1 }}>1:00</div><Tag>成片时长</Tag>
        </Panel></Pop>
      </Stage></Scene>
      {/* 吃亏在哪③：团队的工种 vs 一个人 */}
      <Scene from={tTeam - 0.15} to={seg('吃亏在哪').end}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Versus width={1640}
          left={{ label: '专业团队', at: tTeam, value: <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, maxWidth: 640 }}>{['文案', '编导', '摄影', '剪辑', '调色', '音效'].map((x, i) => <Pop key={x} at={tTeam + 0.15 + i * 0.1}><Chip style={{ fontSize: 34, padding: '10px 22px' }}>{x}</Chip></Pop>)}</div> }}
          right={{ label: '普通人', at: say('吃亏在哪', '普通人'), color: C.warm, value: <div style={{ fontSize: 120, fontWeight: 900, color: C.warm }}>1 个人</div> }} />
      </Stage></Scene>

      {/* 证据①：出镜、手剪都是 0 */}
      <Scene from={seg('证据').start} to={tWave - 0.15}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 70 }}>
        <Pop at={seg('证据').start} style={{ position: 'absolute', top: 230 }}><Tag size={40} color={C.text}>这条视频</Tag></Pop>
        {[['出镜镜头', '我没出镜'], ['手剪的刀', '也没剪']].map(([k, w]) => (
          <Pop key={k} at={say('证据', w)}><Panel style={{ padding: '36px 70px', textAlign: 'center' }}>
            <div style={{ fontSize: 200, fontWeight: 900, lineHeight: 1, color: C.accent }}>0</div><Tag size={36}>{k}</Tag>
          </Panel></Pop>))}
      </Stage></Scene>
      {/* 证据②：唯一的输入，就是你正在听的这段录音（真实波形） */}
      <Scene from={tWave - 0.15} to={tAI - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}><Wave at={tWave - 0.1} /></Stage></Scene>
      {/* 证据③：交给 AI 的步骤清单 */}
      <Scene from={tAI - 0.1} to={seg('证据').end}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Big k={1.45}><TaskRun title="交给 AI 之后" width={980} tasks={[
          { text: '识别录音，对齐逐字时间', at: tAI + 0.1, doneAt: tAI + 0.6 }, { text: '一段一段配画面', at: tAI + 0.3, doneAt: tAI + 1.0 },
          { text: '渲染、自查、出封面', at: tAI + 0.5, doneAt: tAI + 1.4 }]} /></Big>
      </Stage></Scene>

      {/* 怎么做到①：真实的识别和对齐输出（本期录音跑出来的原样结果） */}
      <Scene from={seg('怎么做到').start} to={tCode - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Terminal width={1500} title="本期 · 第 3 步 录音对时" at={seg('怎么做到').start} lines={[
          { cmd: 'python3 scripts/asr.py 06.wav asr.json', at: seg('怎么做到').start + 0.2 },
          { out: '以前做自媒体不露脸基本就等于吃亏从这条视频开始不一样了…', at: say('怎么做到', '它先把') + 0.4 },
          { cmd: 'python3 scripts/align.py --script script.txt --asr asr.json', at: say('怎么做到', '逐字时间') },
          { out: '总长 71.4s，34 行字幕，7 段', at: say('怎么做到', '每个字落在') , ok: true },
          { out: '   5 怎么做到   33.6–51.6   9 行   对齐率 0.96', at: say('怎么做到', '都有数') }]} />
      </Stage></Scene>
      {/* 怎么做到②：本期场景代码，画面挂在录音里的字上 */}
      <Scene from={tCode - 0.1} to={tNum - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <CodeDiff file="studio/src/episodes/ep06/index.tsx" width={1560} at={tCode} lines={[
          { kind: ' ', text: "const tNum = say('怎么做到', '说到数字');" },
          { kind: ' ', text: "const tVs  = say('怎么做到', '说到对比');" },
          { kind: ' ', text: "const tBig = say('怎么做到', '说到重点');" },
          { kind: '+', text: '<Bars rows={segRows} at={tNum} />' },
          { kind: '+', text: '<Versus left={原始录音} right={剪后} at={tVs} />' }]} />
      </Stage></Scene>
      {/* 怎么做到③：说到数字 → 图表（数据：本期七段各多长） */}
      <Scene from={tNum - 0.1} to={tVs - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Big k={1.35}><Panel style={{ padding: '30px 48px' }}><Tag>本期录音 · 七段各多长</Tag>
          <div style={{ marginTop: 18 }}><Bars rows={segRows} max={20} width={900} color={C.accent} /></div>
          <Src>timing.json</Src></Panel></Big>
      </Stage></Scene>
      {/* 怎么做到④：说到对比 → 左右两栏（数据：录音剪前剪后） */}
      <Scene from={tVs - 0.1} to={tBig - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <Big k={1.25}><Versus width={1300} left={{ label: '原始录音', value: `${stats.rawSec} 秒`, at: tVs }} right={{ label: '剪掉 2 处念出来的段名', value: `${stats.cutSec} 秒`, at: tVs + 0.4, color: C.accent }} /></Big>
      </Stage></Scene>
      {/* 怎么做到⑤：说到重点 → 字幕放大（这一句本身就是示范） */}
      <Scene from={tBig - 0.1} to={tQc - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <KineticLine seg="怎么做到" words={['说到重点', '字幕放大']} hot={['字幕放大']} size={170} align="center" />
      </Stage></Scene>
      {/* 怎么做到⑥：出片前自查（本片的真实结果） */}
      <Scene from={tQc - 0.1} to={seg('怎么做到').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 70 }}>
        <Big k={1.15}><Panel style={{ padding: '36px 52px', minWidth: 700 }}><Tag>本片出片前自查 · qc.py</Tag>
          <div style={{ marginTop: 24 }}><CheckList items={Object.entries(stats.qc).map(([k, ok], i) => ({ text: k, ok: ok as boolean, at: [say('怎么做到', '黑场'), say('怎么做到', '闪帧'), say('怎么做到', '画面卡住'), say('怎么做到', '都会被拦下来')][i] }))} /></div>
        </Panel></Big>
        <Pop at={say('怎么做到', '过了才给我看')} style={{ marginTop: 30 }}><Stamp text="放行" color={C.accent} at={say('怎么做到', '过了才给我看')} size={110} rotate={-6} /></Pop>
      </Stage></Scene>

      {/* 观点：换词（强调字幕） */}
      <Scene from={seg('观点').start} to={tLine - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <WordSwap prefix="接下来拼的是：" words={['脸', '剪辑', '脑子里的东西']} ats={[say('观点', '谁剪得好'), say('观点', '谁脑子里')]} size={120} at={seg('观点').start} />
      </Stage></Scene>
      {/* 观点：同一条起跑线，垫官网组件墙录屏 */}
      <Scene from={tLine - 0.1} to={seg('观点').end}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 34 }}>
        <BiTag text="不露脸" at={tLine} size={90} rotate={-3} />
        <Pop at={say('观点', '同一条起跑线')}><Tag color={C.text} size={44}>出镜的人有的工具，你现在也有</Tag></Pop>
      </Stage></Scene>

      {/* 收口 */}
      <Scene from={tMe} to={tAsk - 0.1}><Stage style={{ alignItems: 'center', justifyContent: 'center' }}>
        <FollowCTA name="陈宁" sub="宁少 AI 进化论" at={tMe + 0.1} clickAt={say('收口', '内容创作认知')} />
      </Stage></Scene>
      <Scene from={tAsk - 0.1} to={tNext - 0.1}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 80 }}>
        <div><Pop at={tAsk}><Tag size={40} color={C.text}>评论区</Tag></Pop><div style={{ marginTop: 20 }}><CommentPop width={760} comments={[{ name: '你', text: '不露脸', at: say('收口', '评论区打'), likes: '' }]} /></div></div>
        <Pop at={say('收口', '这套工作流')}><Panel style={{ padding: '30px 44px' }}><Tag>回复你</Tag><div style={{ fontSize: 44, fontWeight: 900, marginTop: 10 }}>12 个 Skill · 232 个组件</div><Tag>两条线：出镜 / 不出镜</Tag></Panel></Pop>
      </Stage></Scene>
      <Scene from={tNext - 0.1} to={clock06.total}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 26 }}>
        <Pop at={tNext}><Tag size={36}>下期</Tag></Pop>
        <Pop at={tNext + 0.25}><div style={{ fontSize: 96, fontWeight: 900, textAlign: 'center' }}>这条视频，<span style={{ color: C.accent }}>是 AI 写代码画出来的</span></div></Pop>
      </Stage></Scene>
    </>
  );
};

export const EP06: React.FC = () => {
  useFonts();
  const c = clock06;
  const sfx: [number, string, number][] = [
    [c.say('开场', '不一样了'), 'tick.wav', 0.4], [c.seg('吃亏在哪').start, 'whoosh.wav', 0.45], [c.say('证据', '我没出镜'), 'tick.wav', 0.35],
    [c.say('怎么做到', '过了才给我看'), 'thud.wav', 0.45], [c.say('观点', '谁脑子里'), 'tick.wav', 0.35], [c.seg('收口').start - 0.2, 'whoosh.wav', 0.4]];
  return (
    <ClockCtx.Provider value={c}>
      <AbsoluteFill style={{ fontFamily: FONT }}>
        <Bg /><Footage shots={shots as Shot[]} dir="ep06/footage" /><Scenes />
        <Chrome chapters={chapters} hideBarBefore={c.seg('痛点').start} hero={hero} hot={hot} /><Finish />
        {sfx.map(([t, f, v], i) => <Sequence key={i} from={Math.max(0, Math.round(t * c.fps))} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
        <Audio src={staticFile('ep06/voice.wav')} />
        <Audio src={staticFile('ep06/bgm.mp3')} volume={(f) => 0.16 * Math.min(1, f / 45) * Math.min(1, Math.max(0, (c.total * c.fps - f) / 60))} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
