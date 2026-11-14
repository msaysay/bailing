// 第五期「开源组件库」：用户实拍的竖屏口播，讲 181 个组件和 12 个 Skill 开源。
// 开场用组件炫技片（gallery/showreel.tsx 渲出来的），之后是 A 全屏 · B 全屏+组件 · C 小圆头像+素材 · D 人物卡片 · E 标题页交替。
import React from 'react';
import { Audio, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { C, Chip, Pop, Scene, useFonts, useT } from '../../kit/kit';
import { Beat, Lower, Plate, TalkClip, TalkStage, TalkSubs, TalkTitle, TW, UPPER } from '../../kit/talk';
import { ChatThread, PhoneFrame, TaskRun, Terminal } from '../../components/screen';
import { FollowCTA, HookTitle } from '../../components/talk';
import { SlamWords } from '../../components/type';
import { Bars } from '../../components/rich';
import timing from './timing.json';
import cutsFile from './cuts.json';

export const talk3Clock = makeClock(timing as Timing);
const { say, ln } = talk3Clock, cut = cutsFile.cuts;
const FACE = { x: 545, y: 660, w: 315 };   // 量自剪好的人物视频（1080×1620）
const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 32 }) => <div style={{ fontSize: size, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{children}</div>;
const Big: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.text, size = 96 }) => <div style={{ fontSize: size, fontWeight: 900, color, lineHeight: 1.15, whiteSpace: 'nowrap' }}>{children}</div>;
const chip = { fontSize: 34, padding: '10px 22px' };

const tAll = say('钩子', '一共 181'), tOpen = say('钩子', '今天啊'), tFree = say('钩子', '不收费');
const tPain = say('痛点', '做口播的'), tChore = say('痛点', '剪口误'), tHalf = say('痛点', '一分钟的视频'), tUgly = say('痛点', '而且还不好看'), tNo = say('痛点', '我不想剪'), tSo = say('痛点', '所以我做了');
const tTwo = say('组件库', '它有两个部分'), t1 = say('组件库', '第一个部分'), tN = say('组件库', '181 个画面组件'), tNum = say('组件库', '你说到数字'), tSee = say('组件库', '你说到你看'), tKey = say('组件库', '你说到重点'), tSlam = say('组件库', '它就砸大字');
const t2 = say('步骤', '第二个部分'), t12 = say('步骤', '12 个步骤'), tList = say('步骤', '定稿'), tEach = say('步骤', '每一步干什么'), tPass = say('步骤', '做到什么程度'), tWritten = say('步骤', '都写清楚了');
const tUse = say('用法', '用法很简单'), tRepo = say('用法', '把仓库'), tCC = say('用法', 'Claude Code'), tRaw = say('用法', '再给它一条'), tRead = say('用法', '它自己会读'), tAsk = say('用法', '中间啊'), tPrev = say('用法', '我上一条视频');
const tZero = say('不收费', '这套东西啊'), tCost = say('不收费', '那是你自己'), tWhy = say('不收费', '为什么开源'), tVal = say('不收费', '因为值钱的'), tCode = say('不收费', '从来都不是代码'), tMade = say('不收费', '而是你拿它'), tHope = say('不收费', '希望你做出');
const tName = say('收口', '我是陈宁'), tShare = say('收口', '分享 AI'), tWant = say('收口', '想要的'), tCmt = say('收口', '在评论区打'), END = talk3Clock.total;

const beats: Beat[] = [
  { at: 0, mode: 'bubble', box: [440, 762, 200, 200] },              // C：组件炫技片两行，人在中间
  { at: tAll - 0.3, mode: 'full', zoom: 1 },                          // B：181
  { at: tOpen - 0.05, mode: 'full', zoom: 1.15, dur: 0 },             // B：全部开源 不收费
  { at: tPain - 0.05, mode: 'full', zoom: 1, dur: 0 },                // A：拍完才是开始
  { at: tChore - 0.3, mode: 'bubble' },                               // C：手剪的时间线
  { at: tNo - 0.3, mode: 'full', zoom: 1.2 },                         // A：我不想剪
  { at: tSo - 0.05, mode: 'full', zoom: 1.04, dur: 0 },               // A：让 AI 替我剪
  { at: tTwo - 0.05, mode: 'full', zoom: 1, dur: 0 },                 // B：两个部分
  { at: tN - 0.3, mode: 'bubble' },                                   // E 之后 C：组件演示
  { at: tNum - 0.3, mode: 'full', zoom: 1 },                          // B：出图表
  { at: tSee - 0.3, mode: 'bubble' },                                 // C：切素材
  { at: tKey - 0.3, mode: 'full', zoom: 1.12 },                       // B：砸大字
  { at: t2, mode: 'full', zoom: 1, dur: 0 },                          // E：02，之后 B
  { at: tList - 0.3, mode: 'bubble' },                                // C：skills 目录
  { at: tEach - 0.3, mode: 'full', zoom: 1.06 },                      // B：每一步怎么写的
  { at: tUse - 0.05, mode: 'full', zoom: 1.2, dur: 0 },               // A：用法很简单
  { at: tRepo - 0.05, mode: 'full', zoom: 1, dur: 0 },                // B：给它两样
  { at: tRead - 0.3, mode: 'bubble' },                                // C：对话
  { at: tPrev - 0.35, mode: 'card', box: [60, 330, 440, 620] },       // D：上一条成片
  { at: tZero - 0.3, mode: 'full', zoom: 1 },                         // B：不收费
  { at: cut[0], mode: 'full', zoom: 1.12, dur: 0 },                   // 剪口：硬切景别
  { at: tWhy - 0.05, mode: 'full', zoom: 1.26, dur: 0 },              // A：为什么开源
  { at: tVal - 0.05, mode: 'full', zoom: 1, dur: 0 },                 // B：不是代码
  { at: tHope - 0.05, mode: 'full', zoom: 1.12, dur: 0 },             // A：希望你做出好的作品
  { at: tName - 0.05, mode: 'full', zoom: 1, dur: 0 },                // B：关注、评论
];
const hot = ['没有一帧', '全是组件', '181', '全部开源', '不收费', '半天', 'AI 替我剪', '组件库', '18 组', '图表', '切素材', '砸大字', 'Skill', '12 个', '写清楚了', 'Claude Code', 'Codex', 'WorkBuddy', '口播原片', '问你一句', '成本', '代码', '陈宁', '组件'];
const sfx: [number, string, number][] = [[tAll, 'thud.wav', 0.4], [t1, 'whoosh.wav', 0.45], [tSlam, 'thud.wav', 0.45], [t2, 'whoosh.wav', 0.45], [tCode, 'tick.wav', 0.35]];
const groups: [string, number][] = [['炫技动效', 25], ['画面效果', 21], ['文字与强调', 16], ['数据图表', 15]];
const steps: [string, string, string][] = [['定稿', 'talk-01-shoot', '定稿'], ['对字幕', 'talk-02-roughcut', '对字幕'], ['找素材', 'video-04-footage', '找素材'], ['排版式', 'talk-03-layout', '排版式'], ['出片', 'talk-04-build', '出片'], ['做封面', 'video-08-cover', '做封面']];

/** 炫技片里的一行（成片是 1080×1920 三行各 608 高）：只露出第 row 行。 */
const ReelRow: React.FC<{ row: number; top: number; at: number; until: number; startFrom?: number }> = ({ row, top, at, until, startFrom = 0 }) => {
  const t = useT(), { fps } = useVideoConfig(); if (t < at - 0.02 || t > until + 0.3) return null;
  return (
    <Sequence from={Math.round(at * fps)} layout="none">
      <div style={{ position: 'absolute', left: 0, top, width: TW, height: 608, overflow: 'hidden', opacity: Math.min(1, (t - at) / 0.25) * (1 - Math.max(0, (t - until) / 0.3)) }}>
        <OffthreadVideo src={staticFile('talk03/footage/showreel.mp4')} muted startFrom={Math.round(startFrom * fps)} style={{ position: 'absolute', left: 0, top: -row * 608, width: TW, height: 1920, maxWidth: 'none' }} />
      </div>
    </Sequence>
  );
};

export const TALK03: React.FC = () => {
  useFonts();
  const t = useT();
  return (
    <ClockCtx.Provider value={talk3Clock}>
      <TalkStage src="talk03/person.mp4" face={FACE} beats={beats} under={<>
        <ReelRow row={0} top={130} at={0} until={tAll - 0.35} />
        <ReelRow row={1} top={1100} at={0} until={tAll - 0.35} />
        <TalkClip src="talk02/footage/jianying.mp4" at={tChore - 0.25} until={tNo - 0.3} credit="录屏：剪映时间线" />
        <ReelRow row={2} top={UPPER.top} at={tN - 0.25} until={tNum - 0.3} startFrom={7.7} />
        <TalkClip src="talk02/footage/doubao-hot-table.mp4" at={tSee - 0.25} until={tKey - 0.3} credit="录屏素材" />
      </>}>
        {/* B：181 */}
        <Scene from={tAll - 0.05} to={tOpen - 0.1}><Lower style={{ top: 1150 }}><Pop at={tAll} dy={0}><Plate style={{ display: 'flex', alignItems: 'center', gap: 30, padding: '20px 50px', borderTop: `6px solid ${C.warm}` }}>
          <div style={{ fontSize: 200, fontWeight: 900, color: C.warm, lineHeight: 1 }}>{Math.round(181 * Math.min(1, Math.max(0, (t - tAll) / 0.7)))}</div><div><Big size={64}>个画面组件</Big><Tag>刚才那些只是其中几个</Tag></div>
        </Plate></Pop></Lower></Scene>
        {/* B：全部开源 不收费 */}
        <div style={{ position: 'absolute', left: 110, top: 1250 }}><HookTitle size={116} lines={['全部开源', '不收费']} at={say('钩子', '全部开源') - 0.1} until={tPain - 0.15} /></div>

        {/* C：手剪要做的四件事 */}
        <Scene from={tChore - 0.1} to={tNo - 0.35}><Lower style={{ top: 1100 }}><Plate style={{ width: 920, boxSizing: 'border-box', borderTop: `6px solid ${C.down}` }}>
          <Tag>拍完之后，手剪要做的</Tag>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, margin: '16px 0 6px' }}>{['剪口误', '对字幕', '找画面', '配图表'].map((w) => <Pop key={w} at={say('痛点', w) - 0.05} dy={10}><Chip color={C.down} style={chip}>{w}</Chip></Pop>)}</div>
          <Pop at={tHalf}><div style={{ display: 'flex', alignItems: 'baseline', gap: 20 }}><Big size={64}>1 分钟成片</Big><Pop at={say('痛点', '能剪半天')} dy={0}><Big size={64} color={C.down}>≈ 半天</Big></Pop></div></Pop>
        </Plate></Lower></Scene>

        {/* B：两个部分 */}
        <Scene from={tTwo} to={t1 - 0.15} hard><Lower style={{ top: 1150, flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
          <Pop at={tTwo}><Plate style={{ width: 430, boxSizing: 'border-box', textAlign: 'center' }}><Tag color={C.accent}>01</Tag><Big size={72}>组件库</Big></Plate></Pop>
          <Pop at={tTwo + 0.3}><Plate style={{ width: 430, boxSizing: 'border-box', textAlign: 'center' }}><Tag color={C.accent}>02</Tag><Big size={72}>Skill</Big></Plate></Pop>
        </Lower></Scene>

        {/* C：181 个，18 组（列出最大的四组，数字取自组件目录） */}
        <Scene from={tN - 0.1} to={tNum - 0.35}><Lower style={{ top: 1100 }}><Plate style={{ width: 920, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}><Big size={84} color={C.warm}>181</Big><Tag size={36}>个组件</Tag><Pop at={say('组件库', '分成 18 组')} dy={0} style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}><Big size={84}>18</Big><Tag size={36}>组</Tag></Pop></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 14 }}>{groups.map(([g, n], i) => <Pop key={g} at={tN + 0.4 + i * 0.25} dy={10}><Chip style={{ fontSize: 30, padding: '8px 18px' }}>{g} {n}</Chip></Pop>)}</div>
        </Plate></Lower></Scene>

        {/* B：说到数字，出图表（画的就是组件库自己的分组数量） */}
        <Scene from={tNum - 0.05} to={tSee - 0.35}><Lower><Pop at={tNum}><Plate style={{ width: 900, boxSizing: 'border-box', borderTop: `6px solid ${C.accent}` }}>
          <Tag>组件最多的四组</Tag>
          <div style={{ marginTop: 18 }}><Bars max={25} width={480} rows={groups.map(([name, value], i) => ({ name, value, text: value + ' 个', at: say('组件库', '它就能出图表') - 0.2 + i * 0.25 }))} /></div>
        </Plate></Pop></Lower></Scene>

        {/* C：说到「你看」，切素材 */}
        <Scene from={tSee} to={tKey - 0.35}><Lower style={{ top: 1100 }}><Pop at={tSee + 0.2}><Plate style={{ width: 900, boxSizing: 'border-box' }}><Tag>版式自己换</Tag><Big size={60}>人缩成小圆 · 素材顶上来</Big></Plate></Pop></Lower></Scene>

        {/* B：砸大字 */}
        <Scene from={tSlam - 0.05} to={t2 - 0.15} hard><Lower style={{ top: 1180 }}><SlamWords size={170} width={1000} words={[{ text: '砸' }, { text: '大', color: C.down }, { text: '字', color: C.warm }]} ats={[tSlam, tSlam + 0.3, tSlam + 0.55]} /></Lower></Scene>

        {/* B：12 个步骤说明 */}
        <Scene from={t12 - 0.05} to={tList - 0.35}><Lower style={{ top: 1150 }}><Pop at={t12} dy={0}><Plate style={{ display: 'flex', alignItems: 'center', gap: 30, padding: '20px 50px', borderTop: `6px solid ${C.accent}` }}>
          <div style={{ fontSize: 190, fontWeight: 900, color: C.accent, lineHeight: 1 }}>12</div><div><Big size={60}>个步骤说明</Big><Tag>每个一份 SKILL.md</Tag></div>
        </Plate></Pop></Lower></Scene>

        {/* C：skills 目录（文件名是仓库里真实的），下面逐个点亮 */}
        <Scene from={tList - 0.1} to={tEach - 0.35}>
          <div style={{ position: 'absolute', left: 40, top: UPPER.top + 10, transform: 'scale(.909)', transformOrigin: 'left top' }}><Terminal at={tList - 0.05} title="skills/" width={1100} lines={[{ cmd: 'ls skills/', at: tList }, { out: 'talk-01-shoot     talk-02-roughcut', at: tList + 0.6 }, { out: 'talk-03-layout    talk-04-build', at: tList + 0.9 }, { out: 'video-01-script … video-08-cover', at: tList + 1.2 }, { out: '共 12 个', at: tList + 1.6, ok: true }]} /></div>
          <Lower style={{ top: 1100 }}><Plate style={{ width: 940, boxSizing: 'border-box' }}><div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>{steps.map(([w, f, k]) => <Pop key={w} at={say('步骤', k) - 0.05} dy={10}><div style={{ background: '#1B2230', border: `2px solid ${C.line}`, borderRadius: 16, padding: '10px 20px', width: 264, boxSizing: 'border-box' }}><div style={{ fontSize: 40, fontWeight: 900, color: C.text }}>{w}</div><div style={{ fontSize: 20, color: C.accent, fontFamily: 'ui-monospace, Menlo, monospace' }}>{f}</div></div></Pop>)}</div></Plate></Lower>
        </Scene>

        {/* B：每份说明里写了什么（SKILL.md 的真实小标题） */}
        <Scene from={tEach - 0.05} to={tUse - 0.15}><Lower><Plate style={{ width: 860, boxSizing: 'border-box', padding: '20px 40px' }}>
          {([['输入', '拿到什么才能开工', tEach], ['步骤', '这一步干什么', tEach + 0.4], ['检查', '怎么自查', tPass], ['放行条件', '做到什么程度才算过', tPass + 0.5]] as [string, string, number][]).map(([k, v, at], i) => <Pop key={k} at={at} dy={12}><div style={{ display: 'flex', alignItems: 'center', height: 80, borderBottom: i < 3 ? `1px solid ${C.line}` : 'none' }}><div style={{ width: 230, fontSize: 42, fontWeight: 900, color: i === 3 ? C.warm : C.text }}>{k}</div><div style={{ fontSize: 34, fontWeight: 600, color: C.muted }}>{v}</div></div></Pop>)}
        </Plate></Lower></Scene>

        {/* B：给它两样，谁来跑都行 */}
        <Scene from={tRepo - 0.05} to={tRead - 0.35} hard><Lower style={{ top: 1130 }}><Plate style={{ width: 940, boxSizing: 'border-box' }}>
          <Tag>你只给两样</Tag>
          <div style={{ display: 'flex', gap: 14, margin: '14px 0 20px' }}><Pop at={tRepo}><Chip color={C.warm} style={{ ...chip, fontSize: 42 }}>这个仓库</Chip></Pop><Pop at={tRaw}><Chip color={C.warm} style={{ ...chip, fontSize: 42 }}>口播原片.mp4</Chip></Pop></div>
          <Tag>交给谁</Tag>
          <div style={{ display: 'flex', gap: 14, marginTop: 14 }}><Pop at={tCC}><Chip style={chip}>Claude Code</Chip></Pop><Pop at={say('用法', 'Codex')}><Chip style={chip}>Codex</Chip></Pop><Pop at={say('用法', 'WorkBuddy')}><Chip style={chip}>WorkBuddy</Chip></Pop></div>
        </Plate></Lower></Scene>

        {/* C：它自己做，只在关键点问一句（对话是示意） */}
        <Scene from={tRead - 0.1} to={tPrev - 0.4}>
          <div style={{ position: 'absolute', left: 50, top: UPPER.top + 30 }}><ChatThread width={980} messages={[{ who: 'me', text: '按 skills/README.md 做这条口播', at: tRead }, { who: 'other', text: '稿子整理好了，剪掉一处口吃。版式表你看一眼？', at: tAsk - 0.4 }]} /></div>
          <div style={{ position: 'absolute', left: 50, top: UPPER.top - 6, fontSize: 22, color: C.muted }}>示意</div>
          <Lower style={{ top: 1090 }}><div style={{ transform: 'scale(.9)', transformOrigin: 'center top' }}><TaskRun title="它自己往下做" width={900} tasks={[{ text: '转写，剪口误', at: tRead, doneAt: tRead + 0.7 }, { text: '对齐字幕', at: tRead + 0.7, doneAt: say('用法', '一步步做') + 0.3 }, { text: '排版式（等你点头）', at: say('用法', '一步步做') + 0.3, doneAt: say('用法', '问你一句') + 0.4 }, { text: '写代码，渲染，自查', at: say('用法', '问你一句') + 0.4, doneAt: tPrev - 0.6 }]} /></div></Lower>
        </Scene>

        {/* D：人在左，上一条成片在右 */}
        <Scene from={tPrev - 0.1} to={tZero - 0.4}>
          <div style={{ position: 'absolute', left: 600, top: 320 }}><PhoneFrame src="talk03/footage/prev.mp4" at={tPrev - 0.1} height={640} /></div>
          <Lower style={{ top: 1100 }}><Pop at={say('用法', '从原片到成片')}><Plate style={{ width: 900, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><Tag>口播原片</Tag><Big size={70}>89 秒</Big></div><Big size={70} color={C.muted}>→</Big><div style={{ textAlign: 'right' }}><Tag>成片</Tag><Big size={70} color={C.warm}>89 秒 · 0 刀手剪</Big></div></Plate></Pop></Lower>
        </Scene>

        {/* B：不收费，成本在哪 */}
        <Scene from={tZero - 0.05} to={tWhy - 0.1} hard><Lower style={{ top: 1150, flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch', gap: 20 }}>
          <Pop at={tZero}><Plate style={{ width: 330, boxSizing: 'border-box', borderTop: '6px solid #28C840', padding: '24px 30px' }}><Tag size={28}>Skill + 组件库</Tag><Big size={90} color="#28C840">¥0</Big></Plate></Pop>
          <Pop at={cut[0] + 0.1}><Plate style={{ width: 290, boxSizing: 'border-box', borderTop: `6px solid ${C.warm}`, padding: '24px 30px' }}><Tag size={28}>AI 额度</Tag><Big size={64} color={C.warm}>自付</Big></Plate></Pop>
          <Pop at={say('不收费', '找素材的接口')}><Plate style={{ width: 290, boxSizing: 'border-box', borderTop: `6px solid ${C.warm}`, padding: '24px 30px' }}><Tag size={28}>素材接口</Tag><Big size={64} color={C.warm}>自付</Big></Plate></Pop>
        </Lower></Scene>

        {/* B：值钱的不是代码 */}
        <Scene from={tVal} to={tHope - 0.1} hard><Lower style={{ top: 1150 }}><Plate style={{ width: 900, boxSizing: 'border-box' }}>
          <Tag>值钱的是</Tag>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30, marginTop: 8 }}>
            <Pop at={tCode} dy={0}><Big size={84} color={C.muted}><span style={{ textDecoration: 'line-through', textDecorationColor: C.down, textDecorationThickness: 8 }}>代码</span></Big></Pop>
            <Pop at={tMade + 0.3} dy={0}><Big size={84} color={C.warm}>→ 你的作品</Big></Pop>
          </div>
        </Plate></Lower></Scene>

        {/* B：关注，然后评论区打「组件」 */}
        <Scene from={tName - 0.05} to={tWant - 0.2} hard><Lower style={{ top: 1180 }}><FollowCTA name="陈宁" sub="AI 时代的内容创作认知" at={tName} clickAt={tShare + 1.2} width={920} /></Lower></Scene>
        <Scene from={tWant - 0.1} to={END + 1}><Lower style={{ top: 1150 }}><Pop at={tWant}><Plate style={{ width: 900, boxSizing: 'border-box' }}>
          <Tag>想要仓库地址</Tag>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 18 }}>
            <div style={{ flex: 1, height: 96, borderRadius: 48, background: '#1B2230', border: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 36px', fontSize: 52, fontWeight: 900, color: C.text }}>{'组件'.slice(0, Math.max(0, Math.floor((t - tCmt - 0.3) / 0.25)))}<span style={{ width: 4, height: 54, background: C.accent, marginLeft: 6 }} /></div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', background: C.down, borderRadius: 48, padding: '20px 44px' }}>发送</div>
          </div>
        </Plate></Pop></Lower></Scene>

        {/* 左上角常驻说明 */}
        <div style={{ position: 'absolute', left: 40, top: 60, fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,.85)', background: 'rgba(8,11,17,.55)', borderRadius: 10, padding: '6px 14px' }}>真人出镜 · AI 剪辑</div>

        {/* E：章节标题页 */}
        <TalkTitle no="01" title="组件库" at={t1 - 0.05} hold={tN - t1 - 0.3} />
        <TalkTitle no="02" title="Skill" at={t2 - 0.05} hold={t12 - t2 - 0.3} />
        <TalkSubs hot={hot} hide={[ln('组件库', '第一个部分'), ln('步骤', '第二个部分')]} />
      </TalkStage>
      <Audio src={staticFile('talk03/voice.wav')} />
      {sfx.map(([at, f, v], i) => <Sequence key={i} from={Math.round(at * talk3Clock.fps)} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
    </ClockCtx.Provider>
  );
};
