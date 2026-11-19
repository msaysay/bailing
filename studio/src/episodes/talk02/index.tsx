// 第四期「自己拆自己」：用户实拍的竖屏口播，拆解上一条黄仁勋视频的生产流程。
// 版式沿用 talk01 的五种：A 全屏 · B 全屏+组件 · C 小圆头像+素材 · E 整屏标题。素材全部是用户自己的录屏、截图和上一期成片。
import React from 'react';
import { Audio, Img, Sequence, staticFile } from 'remotion';
import { ClockCtx, inOut, makeClock, mix, Timing } from '../../kit/clock';
import { C, Chip, Pop, Scene, Src, useFonts, useT } from '../../kit/kit';
import { Beat, Lower, Plate, TalkClip, TalkStage, TalkSubs, TalkTitle, TW, UPPER } from '../../kit/talk';
import { Cursor, TaskRun, Terminal } from '../../components/screen';
import { FollowCTA, HookTitle } from '../../components/talk';
import timing from './timing.json';

export const talk2Clock = makeClock(timing as Timing);
const { say, seg, ln } = talk2Clock;
const FACE = { x: 530, y: 620, w: 320 };   // 量自剪好的人物视频（1080×1620）
const F = 'talk02/footage/';
const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 32 }) => <div style={{ fontSize: size, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{children}</div>;
const Big: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.text, size = 96 }) => <div style={{ fontSize: size, fontWeight: 900, color, lineHeight: 1.15, whiteSpace: 'nowrap' }}>{children}</div>;
const chip = { fontSize: 34, padding: '10px 22px' };

// 开场
const tNoCut = say('开场', '我一帧都没剪'), tParts = say('开场', '文稿'), tCodex = say('开场', 'Codex'), tToday = say('开场', '今天呢'), tBut = say('开场', '但是我自己'), tIf = say('开场', '如果你也感兴趣'), tCmt = say('开场', '评论区可以打');
// 写稿
const s1 = say('写稿', '第一步'), tHot = say('写稿', '它能直接查'), tExp = say('写稿', '我最近体验下来'), tByte = say('写稿', '毕竟啊'), tCheck = say('写稿', '我一查'), tSo = say('写稿', '所以我就不追'), tDeep = say('写稿', '改讲一个'), tPick = say('写稿', '所以选题'), tOnly = say('写稿', '是整条链路里');
// 配音
const s2 = say('配音', '第二步'), tFish = say('配音', '把文稿丢进'), tClick = say('配音', '点一下'), tOut = say('配音', '三分半钟的口播'), tMM = say('配音', 'MiniMax'), tHS = say('配音', '火山引擎');
// 素材
const s3 = say('素材', '第三步'), tWM = say('素材', '抖音 视频号'), tNo = say('素材', '咱不能直接用'), tTik = say('素材', '所以我就让'), tFind = say('素材', '去外部平台'), tFree = say('素材', '素材呢'), tCost = say('素材', '但是接口');
// 成片
const s4 = say('成片', '第四步'), tGive = say('成片', '就是把声音'), tSelf = say('成片', '它自己对字幕'), tPic = say('成片', '配画面'), tChart = say('成片', '做数据图表'), tFx = say('成片', '加特效'), tSk = say('成片', '这个部分'), tWait = say('成片', '我大概等了'), tDone = say('成片', '成片就出来了');
// 数字人、发布、收口
const s5 = say('数字人', '第五步'), tDub = say('数字人', '用同一条配音'), tLip = say('数字人', '然后对上口型'), tAny = say('数字人', '当然了'), tTest = say('数字人', '实测下来');
const s6 = seg('发布').start, tAI = say('发布', '也是 AI 写的'), tQ = say('发布', '如果还有'), tName = say('收口', '我是陈宁'), tShare = say('收口', '分享 AI');

const beats: Beat[] = [
  { at: 0, mode: 'bubble' },                                          // C：上一条成片
  { at: tNoCut - 0.3, mode: 'full', zoom: 1.2 },                      // A：我一帧都没剪
  { at: tParts - 0.05, mode: 'full', zoom: 1, dur: 0 },               // B：五样东西各是谁做的
  { at: tCodex - 0.05, mode: 'full', zoom: 1.1, dur: 0 },             // B：三个 Agent
  { at: tToday - 0.05, mode: 'full', zoom: 1, dur: 0 },               // A：今天这个还是数字人
  { at: tBut - 0.05, mode: 'full', zoom: 1.2, dur: 0 },               // B：自己拆自己
  { at: tIf - 0.05, mode: 'full', zoom: 1.04, dur: 0 },               // B：评论区
  { at: s1, mode: 'full', zoom: 1, dur: 0 },                          // E：01
  { at: tHot - 0.3, mode: 'bubble' },                                 // C：豆包查热榜、出稿
  { at: tByte - 0.3, mode: 'full', zoom: 1.15 },                      // A：字节自己家的
  { at: tCheck - 0.3, mode: 'bubble' },                               // C：前 50 名
  { at: tSo - 0.3, mode: 'full', zoom: 1 },                           // B：快讯改深度
  { at: tPick - 0.05, mode: 'full', zoom: 1.22, dur: 0 },             // A：选题
  { at: tOnly - 0.05, mode: 'full', zoom: 1.05, dur: 0 },             // B：整条链路
  { at: s2, mode: 'full', zoom: 1, dur: 0 },                          // E：02
  { at: tFish - 0.3, mode: 'bubble' },                                // C：Fish Audio 截图
  { at: tMM - 0.3, mode: 'full', zoom: 1 },                           // B：三个平台
  { at: s3, mode: 'full', zoom: 1.08, dur: 0 },                       // E：03，之后 B：水印
  { at: tNo - 0.05, mode: 'full', zoom: 1.22, dur: 0 },               // A：不能直接用
  { at: tTik - 0.3, mode: 'bubble' },                                 // C：终端里搜素材
  { at: tFree - 0.3, mode: 'full', zoom: 1 },                         // B：免费与成本
  { at: s4, mode: 'full', zoom: 1.06, dur: 0 },                       // E：04
  { at: tGive - 0.3, mode: 'bubble' },                                // C：Claude Code 录屏、成片
  { at: tSk - 0.3, mode: 'full', zoom: 1 },                           // B：这一步也打包成了 Skill
  { at: tWait - 0.05, mode: 'full', zoom: 1.12, dur: 0 },                       // B：等了多久
  { at: s5, mode: 'full', zoom: 1, dur: 0 },                          // E：05
  { at: tDub - 0.3, mode: 'bubble' },                                 // C：剪映录屏
  { at: tAny - 0.3, mode: 'full', zoom: 1 },                          // A：任意平台
  { at: tTest - 0.05, mode: 'full', zoom: 1.16, dur: 0 },             // A：剪映的还不错
  { at: s6 - 0.3, mode: 'bubble' },                                   // C：发布包
  { at: tQ - 0.3, mode: 'full', zoom: 1.12 },                         // A：评论区交流
  { at: tName - 0.05, mode: 'full', zoom: 1, dur: 0 },                         // B：关注
];
const hot = ['一帧都没剪', 'Skill', '自己拆自己', '豆包', '抖音热榜', '前五十', '深度故事', '拿主意', 'Fish Audio', '三分半', '水印', 'TikHub', '免费', '成本', 'Claude Code', '三四十分钟', '剪映', '数字人', 'AI 写的', '评论区', '陈宁'];
const titles: [string, string, number, number][] = [['01', '豆包写稿', s1, tHot], ['02', '配音', s2, tFish], ['03', '找素材', s3, tWM], ['04', 'AI 成片', s4, tGive], ['05', '剪映数字人', s5, tDub]];
const sfx: [number, string, number][] = [[tNoCut, 'thud.wav', 0.4], ...titles.map(([, , at]) => [at, 'whoosh.wav', 0.45] as [number, string, number]), [tClick + 0.35, 'tick.wav', 0.4], [tDone, 'thud.wav', 0.35]];

/** Fish Audio 截图：先看整段文稿，说到「点一下」时推到右下角的生成按钮和 3:38 的两条音频。 */
const FishPan: React.FC<{ at: number; until: number }> = ({ at, until }) => {
  const t = useT(); if (t < at || t > until + 0.3) return null;
  const p = inOut((t - tClick + 0.5) / 0.7), a = { x: 250, y: 105, w: 800 }, b = { x: 830, y: 620, w: 760 };
  const s = TW / mix(a.w, b.w, p), x = mix(a.x, b.x, p), y = mix(a.y, b.y, p), op = Math.min(1, (t - at) / 0.3) * (1 - Math.max(0, (t - until) / 0.3));
  return (
    <div style={{ position: 'absolute', left: 0, top: UPPER.top, width: TW, height: UPPER.height, overflow: 'hidden', opacity: op }}>
      <Img src={staticFile('talk02/fish.png')} style={{ position: 'absolute', left: -x * s, top: -y * s, width: 2000 * s, maxWidth: 'none' }} />
      {p > 0.95 && <Cursor points={[{ x: 0.6, y: 0.4, at: tClick + 0.1 }, { x: 0.88, y: 0.69, at: tClick + 0.4, click: true }]} />}
    </div>
  );
};
const rows: [string, string, string][] = [['文稿', '豆包', '文稿'], ['配音', 'Fish Audio', '配音'], ['画面', 'TikHub 搜素材', '画面'], ['字幕', '按录音逐字对齐', '字幕']];
const pipe: [string, boolean][] = [['选题', true], ['写稿', false], ['配音', false], ['素材', false], ['成片', false], ['数字人', false], ['封面', false]];

export const TALK02: React.FC = () => {
  useFonts();
  return (
    <ClockCtx.Provider value={talk2Clock}>
      <TalkStage src="talk02/person.mp4" face={FACE} beats={beats} under={<>
        <TalkClip src={F + 'final-a.mp4'} at={0} until={tNoCut - 0.3} credit="上一条成片：辞职之后的三件事" />
        <TalkClip src={F + 'doubao-hot-run.mp4'} at={tHot - 0.25} until={tExp - 0.15} credit="录屏：豆包" />
        <TalkClip src={F + 'doubao-script.mp4'} at={tExp - 0.1} until={tByte - 0.3} credit="录屏：豆包" />
        <TalkClip src={F + 'doubao-hot-table.mp4'} at={tCheck - 0.25} until={tSo - 0.3} credit="录屏：豆包" />
        <FishPan at={tFish - 0.25} until={tMM - 0.3} />
        <TalkClip src={F + 'claude-code.mp4'} at={tGive - 0.25} until={tSelf - 0.15} credit="录屏：Claude Code" />
        <TalkClip src={F + 'final-b.mp4'} at={tSelf - 0.1} until={tSk - 0.3} credit="上一条成片" />
        <TalkClip src={F + 'jianying.mp4'} at={tDub - 0.25} until={tAny - 0.3} credit="录屏：剪映" />
        <TalkClip src={F + 'doubao-titles.mp4'} at={s6 - 0.25} until={tQ - 0.3} credit="录屏：豆包" />
      </>}>
        {/* C 开场：上一条成片的规格 */}
        <Scene from={0} to={tNoCut - 0.35}><Lower style={{ top: 1100 }}><Pop at={0.3}><Plate style={{ width: 900, boxSizing: 'border-box', borderTop: `6px solid ${C.warm}` }}>
          <Tag>昨天发的那条</Tag><Big size={70}>辞职之后的三件事</Big>
          <div style={{ display: 'flex', gap: 14, marginTop: 16 }}><Chip style={chip}>横屏 1920×1080</Chip><Chip style={chip}>3 分 38 秒</Chip></div>
        </Plate></Pop></Lower></Scene>

        {/* B：四样东西各是谁做的，最后一行是出镜的人 */}
        <Scene from={tParts - 0.05} to={tCodex - 0.1} hard><Lower><Plate style={{ width: 860, boxSizing: 'border-box', padding: '22px 40px' }}>
          {rows.map(([k, v, w]) => <Pop key={k} at={say('开场', w) - 0.05} dy={12}><div style={{ display: 'flex', alignItems: 'center', height: 78, borderBottom: `1px solid ${C.line}` }}><div style={{ width: 200, fontSize: 44, fontWeight: 900, color: C.text }}>{k}</div><div style={{ fontSize: 38, fontWeight: 600, color: C.accent }}>{v}</div></div></Pop>)}
          <Pop at={say('开场', '连出镜的那个我')} dy={12}><div style={{ display: 'flex', alignItems: 'center', height: 78 }}><div style={{ width: 200, fontSize: 44, fontWeight: 900, color: C.warm }}>出镜</div><div style={{ fontSize: 38, fontWeight: 600, color: C.warm }}>剪映数字人</div></div></Pop>
        </Plate></Lower></Scene>

        {/* B：同一套 Skill，换哪个 Agent 都行 */}
        <Scene from={tCodex - 0.05} to={tToday - 0.1} hard><Lower style={{ top: 1150 }}><Plate style={{ width: 940, boxSizing: 'border-box' }}>
          <Tag>同一套 Skill · 任选一个 Agent 来跑</Tag>
          <div style={{ display: 'flex', gap: 14, marginTop: 18 }}><Chip color={C.accent} style={chip}>Claude Code</Chip><Pop at={tCodex}><Chip style={chip}>Codex</Chip></Pop><Pop at={say('开场', 'WorkBuddy 也能跑')}><Chip style={chip}>WorkBuddy</Chip></Pop></div>
        </Plate></Lower></Scene>

        {/* B：片名 */}
        <div style={{ position: 'absolute', left: 150, top: 1290 }}><HookTitle size={120} lines={['自己拆自己']} at={tBut + 0.1} until={tIf - 0.15} /></div>

        {/* B：评论区打 skill */}
        <Scene from={tIf} to={s1 - 0.15}><Lower style={{ top: 1150 }}><Pop at={tIf}><Plate style={{ width: 900, boxSizing: 'border-box' }}>
          <Tag>想要这套流程</Tag>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 18 }}>
            <div style={{ flex: 1, height: 96, borderRadius: 48, background: '#1B2230', border: `2px solid ${C.line}`, display: 'flex', alignItems: 'center', padding: '0 36px', fontSize: 52, fontWeight: 900, color: C.text }}>{'skill'.slice(0, Math.max(0, Math.floor((useT() - tCmt - 0.3) / 0.09)))}<span style={{ width: 4, height: 54, background: C.accent, marginLeft: 6 }} /></div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', background: C.down, borderRadius: 48, padding: '20px 44px' }}>发送</div>
          </div>
        </Plate></Pop></Lower></Scene>

        {/* C：豆包查抖音热榜 */}
        <Scene from={tHot - 0.1} to={tExp - 0.2}><Lower style={{ top: 1100 }}><Pop at={tHot}><Plate style={{ width: 900, boxSizing: 'border-box', borderTop: `6px solid ${C.accent}` }}>
          <Tag>豆包自己打开页面抓榜单</Tag><Big size={72}>实时热榜 · 前 50 名</Big><Src>抖音热榜 · 11 月 14 日 09:20 抓取</Src>
        </Plate></Pop></Lower></Scene>
        {/* C：豆包出的第三稿 */}
        <Scene from={tExp} to={tByte - 0.35}><Lower style={{ top: 1100 }}><Pop at={tExp + 0.1}><Plate style={{ width: 900, boxSizing: 'border-box', borderLeft: `10px solid ${C.warm}` }}>
          <Tag color={C.warm}>豆包写到第三稿（故事版）</Tag><Big size={58}>观点和情绪<br />全部交给故事来承载</Big>
        </Plate></Pop></Lower></Scene>

        {/* C：前 50 名里没有他 */}
        <Scene from={tCheck - 0.1} to={tSo - 0.35}><Lower style={{ top: 1100 }}><Plate style={{ width: 900, boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 40, borderTop: `6px solid ${C.down}` }}>
          <Pop at={say('写稿', '已经掉出')} dy={0}><div style={{ fontSize: 220, fontWeight: 900, color: C.down, lineHeight: 0.9 }}>0</div></Pop>
          <div><Tag>前 50 名里</Tag><Big size={60}>条相关话题</Big><Tag size={28}>没有黄仁勋 · 没有英伟达</Tag></div>
        </Plate></Lower></Scene>

        {/* B：快讯改成深度故事 */}
        <Scene from={tSo - 0.05} to={tPick - 0.1}><Lower style={{ top: 1130 }}><Plate style={{ width: 900, boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
            <Big size={76} color={C.muted}><span style={{ textDecoration: 'line-through', textDecorationColor: C.down, textDecorationThickness: 8 }}>快讯</span></Big>
            <Pop at={tDeep} dy={0}><Big size={76} color={C.warm}>→ 深度故事</Big></Pop>
          </div>
          <Pop at={tDeep + 0.3}><Tag size={30}>定稿：《他走之后》· 口播 195 秒</Tag></Pop>
        </Plate></Lower></Scene>

        {/* B：整条链路，只有选题是人 */}
        <Scene from={tOnly - 0.05} to={s2 - 0.15} hard><Lower style={{ top: 1130 }}><Plate style={{ width: 960, boxSizing: 'border-box' }}>
          <Tag>整条链路 · 谁来做</Tag>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 18 }}>{pipe.map(([name, me], i) => <Pop key={name} at={tOnly + i * 0.22} dy={10}><div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 38, fontWeight: 900, color: me ? '#14171D' : C.text, background: me ? C.warm : '#1B2230', border: `2px solid ${me ? C.warm : C.line}`, borderRadius: 16, padding: '12px 22px' }}>{name}<span style={{ fontSize: 26, fontWeight: 600, color: me ? '#14171D' : C.accent }}>{me ? '我' : 'AI'}</span></div></Pop>)}</div>
        </Plate></Lower></Scene>

        {/* C：Fish Audio */}
        <Scene from={tFish - 0.1} to={tMM - 0.35}><Lower style={{ top: 1100 }}><Plate style={{ width: 900, boxSizing: 'border-box', borderTop: `6px solid ${C.accent}` }}>
          <Tag>Fish Audio · 语音合成</Tag>
          <div style={{ display: 'flex', gap: 14, margin: '16px 0 10px' }}><Pop at={say('配音', '选个音色')}><Chip style={chip}>音色：干练商务男声</Chip></Pop><Pop at={say('配音', '选个音色') + 0.3}><Chip style={chip}>模型：Drama 3</Chip></Pop></div>
          <Pop at={tOut}><div style={{ display: 'flex', alignItems: 'baseline', gap: 22 }}><Big size={110} color={C.warm}>3:38</Big><Tag>3185 个字符，一次生成</Tag></div></Pop>
        </Plate></Lower></Scene>

        {/* B：三个可选的配音平台 */}
        <Scene from={tMM - 0.05} to={s3 - 0.15}><Lower><Plate style={{ width: 880, boxSizing: 'border-box', padding: '20px 40px' }}>
          {([['Fish Audio', '这条片子在用', tMM - 0.05, C.warm], ['MiniMax', '海螺语音', tMM, C.text], ['火山引擎', '豆包语音', tHS, C.text]] as [string, string, number, string][]).map(([n, d, at, col], i) => <Pop key={n} at={at} dy={12}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 92, borderBottom: i < 2 ? `1px solid ${C.line}` : 'none' }}><div style={{ fontSize: 52, fontWeight: 900, color: col }}>{n}</div><div style={{ fontSize: 32, fontWeight: 600, color: C.muted }}>{d}</div></div></Pop>)}
        </Plate></Lower></Scene>

        {/* B：抖音、视频号的素材带水印 */}
        <Scene from={tWM - 0.1} to={tNo - 0.1} hard><Lower style={{ top: 1200, flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
          <Pop at={tWM}><Chip color={C.down} style={{ fontSize: 46, padding: '18px 34px' }}>抖音 ✕</Chip></Pop><Pop at={say('素材', '视频号')}><Chip color={C.down} style={{ fontSize: 46, padding: '18px 34px' }}>视频号 ✕</Chip></Pop>
        </Lower></Scene>

        {/* C：终端里用 TikHub 搜素材（命令和结果取自上一期的 sources.json） */}
        <Scene from={tTik - 0.1} to={tFree - 0.35}>
          <div style={{ position: 'absolute', left: 40, top: UPPER.top + 10, transform: 'scale(.909)', transformOrigin: 'left top' }}><Terminal at={tTik - 0.05} title="scripts/tikhub.py" width={1100} lines={[{ cmd: 'tikhub.py xsearch "tech layoffs 2022"', at: tTik + 0.2 }, { out: 'X @CNBC       layoffs.mp4', at: tFind }, { out: 'X @Reuters    flowers.mp4', at: tFind + 0.35 }, { out: 'X @BloombergTV  ousted.mp4', at: tFind + 0.7 }, { out: '来源已登记 → sources.json', at: tFind + 1.1, ok: true }]} /></div>
          <Lower style={{ top: 1100 }}><Pop at={tFind}><Plate style={{ width: 900, boxSizing: 'border-box' }}><Tag>去哪找</Tag><Big size={56}>X 上新闻机构的横屏原片</Big><Tag size={28}>没有平台水印 · 每条登记来源</Tag></Plate></Pop></Lower>
        </Scene>

        {/* B：下载免费，接口收费 */}
        <Scene from={tFree - 0.05} to={s4 - 0.15}><Lower style={{ top: 1130, flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch', gap: 24 }}>
          <Pop at={tFree}><Plate style={{ width: 440, boxSizing: 'border-box', borderTop: `6px solid #28C840` }}><Tag>下载 · yt-dlp</Tag><Big size={100} color="#28C840">免费</Big></Plate></Pop>
          <Pop at={tCost}><Plate style={{ width: 440, boxSizing: 'border-box', borderTop: `6px solid ${C.warm}` }}><Tag>搜索 · TikHub 接口</Tag><Big size={100} color={C.warm}>付费</Big></Plate></Pop>
        </Lower></Scene>

        {/* C：交给 Claude Code 的只有两样 */}
        <Scene from={tGive - 0.1} to={tSelf - 0.25}><Lower style={{ top: 1100 }}><Pop at={tGive}><Plate style={{ width: 900, boxSizing: 'border-box', borderTop: `6px solid ${C.accent}` }}>
          <Tag>交给它的只有两样</Tag>
          <div style={{ display: 'flex', gap: 14, marginTop: 16 }}><Chip style={{ ...chip, fontSize: 44 }}>配音文件</Chip><Chip style={{ ...chip, fontSize: 44 }}>逐字稿</Chip></div>
        </Plate></Pop></Lower></Scene>
        {/* C：它自己跑的四步 */}
        <Scene from={tSelf - 0.05} to={tSk - 0.35}><Lower style={{ top: 1090 }}><div style={{ transform: 'scale(.94)', transformOrigin: 'center top' }}><TaskRun title="自动剪辑流程" width={900} tasks={[{ text: '按录音逐字对齐字幕', at: tSelf, doneAt: tPic }, { text: '搜真实镜头垫底', at: tPic, doneAt: tChart }, { text: '从组件库里挑图表', at: tChart, doneAt: tFx }, { text: '音效和质感层', at: tFx, doneAt: tFx + 0.6 }]} /></div></Lower></Scene>

        {/* B：这一步也打包成了 Skill */}
        <Scene from={tSk - 0.05} to={tWait - 0.1}><Lower style={{ top: 1150 }}><Pop at={tSk}><Plate style={{ width: 900, boxSizing: 'border-box', borderTop: `6px solid ${C.warm}` }}>
          <Tag>这套 Skill 里有什么</Tag>
          <div style={{ display: 'flex', gap: 14, marginTop: 16 }}><Chip style={{ ...chip, fontSize: 42 }}>12 个步骤说明</Chip><Pop at={say('成片', '也可以教给你')}><Chip style={{ ...chip, fontSize: 42 }}>181 个画面组件</Chip></Pop></div>
          <Pop at={say('成片', '用你想用的')}><Tag size={28}>交给哪个 Agent，它都照着步骤一步步做</Tag></Pop>
        </Plate></Pop></Lower></Scene>

        {/* B：等了多久，得到什么 */}
        <Scene from={tWait - 0.05} to={s5 - 0.15} hard><Lower style={{ top: 1150 }}><Plate style={{ width: 920, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Pop at={tWait}><div><Tag>我只做一件事</Tag><Big size={84}>等</Big></div></Pop>
          <Pop at={tDone} dy={0}><div style={{ textAlign: 'right' }}><Tag>拿到</Tag><Big size={84} color={C.warm}>3 分 38 秒成片</Big></div></Pop>
        </Plate></Lower></Scene>

        {/* C：剪映里叠数字人 */}
        <Scene from={tDub - 0.1} to={tAny - 0.35}><Lower style={{ top: 1100 }}><Plate style={{ width: 900, boxSizing: 'border-box', borderTop: `6px solid ${C.accent}` }}>
          <Tag>剪映 · 数字人</Tag>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 16 }}><Pop at={tDub}><Chip style={chip}>定制形象：我的形象 1</Chip></Pop><Pop at={tDub + 0.5}><Chip style={chip}>配音轨 3:38</Chip></Pop><Pop at={tLip}><Chip color={C.warm} style={chip}>圆形小窗 · 叠在成片右下角</Chip></Pop></div>
        </Plate></Lower></Scene>

        {/* C：豆包给的发布包 */}
        <Scene from={s6 - 0.1} to={tQ - 0.35}><Lower style={{ top: 1100 }}><Pop at={s6}><Plate style={{ width: 900, boxSizing: 'border-box', borderTop: `6px solid ${C.warm}` }}>
          <Tag>发布包里有什么</Tag>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, marginTop: 16 }}><Chip style={chip}>标题 3 选 1</Chip><Chip style={chip}>描述</Chip><Pop at={tAI}><Chip style={chip}>5 个话题</Chip></Pop><Pop at={tAI + 0.25}><Chip style={chip}>置顶评论</Chip></Pop></div>
        </Plate></Pop></Lower></Scene>

        {/* B：关注 */}
        <Scene from={tName - 0.05} to={talk2Clock.total + 1}><Lower style={{ top: 1180 }}><FollowCTA name="陈宁" sub="评论区打 skill，拿这套流程" at={tName} clickAt={tShare + 1.2} width={920} /></Lower></Scene>

        {/* 左上角常驻说明 */}
        <div style={{ position: 'absolute', left: 40, top: 150, fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,.85)', background: 'rgba(8,11,17,.55)', borderRadius: 10, padding: '6px 14px' }}>真人出镜 · AI 剪辑</div>

        {/* E：章节标题页 */}
        {titles.map(([no, title, at, next]) => <TalkTitle key={no} no={no} title={title} at={at - 0.05} hold={next - at - 0.3} />)}
        <TalkSubs hot={hot} hide={[ln('写稿', '第一步'), ln('写稿', '写稿'), ln('写稿', '我用的是豆包'), ln('配音', '第二步'), ln('素材', '第三步'), ln('成片', '第四步'), ln('数字人', '第五步')]} />
      </TalkStage>
      <Audio src={staticFile('talk02/voice.wav')} />
      {sfx.map(([t, f, v], i) => <Sequence key={i} from={Math.round(t * talk2Clock.fps)} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
    </ClockCtx.Provider>
  );
};
