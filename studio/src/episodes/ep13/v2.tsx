// 第十三期第二版：IP 工作台。全片用「纸面风」（components/paper.tsx，这一期新做、做完收进组件库的一组）。
// 手机上看横屏，字必须大：真实录屏只负责交代「这是哪一页」，关键区域用同样的真实数据重排成大字卡片。
// 时间全部用 say(段名, 词) 从配音里取；卡片里的数字照录屏原样（视频号 7 条、近 30 天，采集于 11/17）。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing, useClock, prog, mix, inOut } from '../../kit/clock';
import { useFonts, useT } from '../../kit/kit';
import { Beat, BigFollow, CheckRows, CommentFlow, DeckWindow, Dot, FieldRows, FunnelStages, HeadlineStack, LaneTrack, LoopRing, MacroCard, PaperFrame, PP as P, Rise, Roi, StatGrid, Stage, Swipe, TapButton, TodoHandoff, TypeBox, spr } from '../../components/paper';
import timing from './timing.json';

export const clock13b = makeClock(timing as Timing);
const heroLines = [clock13b.ln('开场', '一个人做'), clock13b.ln('开场', '是拍完以后'), clock13b.ln('观点', '做 IP 拼到最后'), clock13b.ln('观点', '是你每周都知道')];
const hotWords = ['五段漏斗', '关系', '验收', '工作台', '定时'];
const LOOP = ['定位', '计划', '创作', '发布', '采集', '复盘'];
// 我的视频号这一行，照看板原样
const STAGES: Stage[] = [{ name: '流量', value: '1,963', status: '及格' }, { name: '留存', value: '11.51%', status: '及格' }, { name: '互动', value: '2.75%', status: '良好' }, { name: '关系', value: '0.46%', status: '偏弱', weak: true }, { name: '转化', value: '0.00%', status: '偏弱', weak: true }];

/** 工作台录屏（已裁掉浏览器和任务栏，1140×788）。rec 是从录屏第几秒开始播。 */
const Deck: React.FC<{ at: number; rec: number; width: number; label: string; roi?: Roi; roiAt?: number }> = ({ rec, ...p }) => <DeckWindow src="ep13/footage/wb.mp4" sw={1140} sh={788} trim={rec} {...p} />;

const Scenes: React.FC = () => {
  const t = useT(), { seg, say } = useClock();
  const tNot = say('开场', '不是拍视频'), tB = say('开场', '是拍完以后'), tList = say('开场', '三个平台'), tHand = say('开场', '这些事');
  const tF = seg('漏斗').start, tFz = say('漏斗', '最有用的'), tScan = say('漏斗', '从上往下'), tOnly = say('漏斗', '就是这周'), tMe = say('漏斗', '比如我的视频号'), tStuck = say('漏斗', '卡在关系'), tFew = say('漏斗', '看的人不少');
  const tP = seg('计划').start, tPlan = say('计划', '再按复盘'), tWhat = say('计划', '拍什么'), tStruct = say('计划', '用什么结构'), tGoal = say('计划', '目标定多少'), tCheck = say('计划', '验收');
  const tC = seg('创作').start, tAuto = say('创作', '一条是'), tMine = say('创作', '我最近这几条'), tLive = say('创作', '另一条');
  const tPub = seg('发布和评论').start, tQ = say('发布和评论', '三个平台'), tTimer = say('发布和评论', '还能定时'), tCm = say('发布和评论', '评论区有人'), tRule = say('发布和评论', '它按规则'), tSend = say('发布和评论', '我看一眼');
  const tV = seg('观点').start, tE = seg('收口').start, tFollow = say('收口', '先关注'), tKey = say('收口', '再在评论区'), tGift = say('收口', '我把五段漏斗');
  const X0 = (1920 - (5 * 320 + 4 * 24)) / 2, me = t >= tMe, shrink = inOut((t - tNot + 0.45) / 0.35);
  return (
    <>
      {/* 开场①②：两句大字硬切 */}
      <Beat from={0} to={tB} hard><AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: mix(250, 84, shrink), fontWeight: 900, color: t < tNot - 0.3 ? P.ink : P.mute, letterSpacing: mix(-6, 4, shrink), lineHeight: 1.15, whiteSpace: 'nowrap' }}>一个人做 IP{t >= tNot - 0.45 ? ' · 最累的' : ''}</div>
        <div style={{ fontSize: 270, fontWeight: 900, letterSpacing: -8, lineHeight: 1.1, transform: `scale(${mix(1.16, 1, prog(t, tNot, 0.3))})`, opacity: prog(t, tNot - 0.05, 0.15), height: t < tNot - 0.1 ? 0 : undefined }}>
          不是<span style={{ position: 'relative' }}>拍视频<Swipe at={tNot + 0.75} h={30} /></span></div>
      </AbsoluteFill></Beat>
      <Beat from={tB} to={tList - 0.05} hard><AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'relative', fontSize: 330, fontWeight: 900, letterSpacing: -10, color: P.hot, transform: `scale(${mix(1.3, 1, prog(t, tB, 0.28))})` }}>是拍完以后
          <div style={{ position: 'absolute', left: 0, bottom: -6, height: 26, borderRadius: 13, background: P.ink, width: `${inOut((t - tB - 0.3) / 0.4) * 100}%` }} /></div>
      </AbsoluteFill></Beat>
      {/* 开场③：三件杂事的清单，交给工作台时一口气打勾，工作台窗口升起 */}
      <Beat from={tList - 0.05} to={seg('开场').end - 0.2} hard softOut><AbsoluteFill style={{ padding: '120px 150px 0' }}>
        <div style={{ transform: `scale(${mix(1, 0.6, inOut((t - tHand - 0.85) / 0.45))})`, transformOrigin: 'left top' }}>
          <TodoHandoff doneAt={tHand + 0.15} items={[{ title: '看数据', note: '× 3 个平台', at: tList }, { title: '想选题', note: '下一条拍什么', at: say('开场', '下一条') }, { title: '回评论', note: '一条一条回', at: say('开场', '评论区要回') }]} />
        </div>
        <Rise at={tHand + 0.9} dy={260} dur={0.55} style={{ position: 'absolute', right: 110, bottom: 150 }}><Deck at={tList - 0.05} rec={0} width={900} label="ClipSignal 短视频工作台 · 我的电脑上" /></Rise>
      </AbsoluteFill></Beat>

      {/* 闭环 */}
      <Beat from={seg('闭环').start} to={seg('闭环').end}>
        <LoopRing names={LOOP} cx={960} cy={455} r={250} fs={72} ats={LOOP.map((w) => say('闭环', w))}
          center={<Rise at={say('闭环', '每周')} dy={20}><div style={{ fontSize: 76, fontWeight: 900, color: P.mute }}>每周</div><div style={{ fontSize: 170, fontWeight: 900, letterSpacing: -6, lineHeight: 1, color: P.hot }}>一圈</div></Rise>} />
      </Beat>

      {/* 漏斗①：看板录屏 + 放大的三平台数字 */}
      <Beat from={tF} to={tFz - 0.1}><AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 90px 110px', gap: 60 }}>
        <Deck at={tF} rec={0} width={720} roi={[165, 62, 975, 100]} roiAt={tF + 0.3} label="数据看板" />
        <MacroCard at={tF + 0.3} from="数据看板 · 近 30 天" width={980}>
          <StatGrid cols={['播放', '涨粉']} colW={[0, 210]} at={say('漏斗', '三个平台') + 0.25} hi={[0, 1]} rows={[{ name: '视频号', color: P.ok, vals: ['2.3 万', '138'] }, { name: '抖音', color: P.blue, vals: ['2,995', '2'] }, { name: '小红书', color: P.hot, vals: ['5', '0'] }]} />
          <Rise at={say('漏斗', '每天自动')} style={{ marginTop: 26, fontSize: 46, fontWeight: 900, color: P.hot }}>↻ 每天自动采集 · 上次 11/17 19:52</Rise>
        </MacroCard>
      </AbsoluteFill></Beat>
      {/* 漏斗②：五段依次亮 → 扫到第一个偏弱 → 换成我的视频号真实数字，关系那一段放大 */}
      <Beat from={tFz - 0.1} to={seg('漏斗').end}><AbsoluteFill>
        <div style={{ position: 'absolute', left: X0, top: 140 }}>
          {!me ? <div style={{ fontSize: 104, fontWeight: 900, letterSpacing: -3 }}>五段漏斗</div>
            : <Rise at={tMe - 0.05} dy={20} style={{ display: 'flex', alignItems: 'center', gap: 22, fontSize: 92, fontWeight: 900 }}><Dot c={P.ok} s={44} />我的视频号<span style={{ fontSize: 44, color: P.mute, fontWeight: 600 }}>7 条作品 · 中位数</span></Rise>}
        </div>
        <div style={{ position: 'absolute', left: X0, top: 330 }}><FunnelStages stages={STAGES} ats={STAGES.map((s) => say('漏斗', s.name))} scanAt={tScan} valuesAt={tMe} focusAt={tStuck} /></div>
        {!me && <Rise at={tOnly} style={{ position: 'absolute', left: X0 + 3 * 344 - 330, top: 714, width: 980, textAlign: 'center', fontSize: 86, fontWeight: 900, color: P.hot }}>↑ 这周只改这一段</Rise>}
        {me && <Rise at={tFew} style={{ position: 'absolute', left: X0, right: X0, top: 740, display: 'flex', alignItems: 'center', gap: 26, fontSize: 58, fontWeight: 900 }}>
          <span style={{ background: P.ink, color: P.paper, padding: '6px 26px', borderRadius: 16, whiteSpace: 'nowrap' }}>工作台的结论</span>只改结尾：给出关注理由 + 一份可拿走的资产</Rise>}
      </AbsoluteFill></Beat>

      {/* 计划①：复盘 → 下周计划 */}
      <Beat from={tP} to={tWhat - 0.1}><AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 90px 110px', gap: 70 }}>
        <Deck at={tP} rec={40.5} width={860} label="复盘" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, alignItems: 'flex-start' }}>
          <Rise at={tP + 0.1}><div style={{ fontSize: 150, fontWeight: 900, letterSpacing: -5, lineHeight: 1.1 }}>复盘</div><div style={{ fontSize: 50, fontWeight: 600, color: P.mute }}>这周哪里弱</div></Rise>
          <Rise at={tPlan - 0.1} style={{ fontSize: 110, fontWeight: 900, color: P.hot, lineHeight: 1 }}>↓</Rise>
          <Rise at={tPlan}><div style={{ fontSize: 150, fontWeight: 900, letterSpacing: -5, lineHeight: 1.1, color: P.hot }}>下周计划</div><div style={{ fontSize: 50, fontWeight: 600, color: P.mute }}>它直接写好</div></Rise>
        </div>
      </AbsoluteFill></Beat>
      {/* 计划②：放大一条真实的计划 */}
      <Beat from={tWhat - 0.1} to={seg('计划').end}><AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 120 }}>
        <MacroCard at={tWhat - 0.05} from="计划 · 本周第 1 条（P0）" width={1680} style={{ transformOrigin: 'center' }}>
          <FieldRows stamp={{ text: '下周验收', at: tCheck }} rows={[
            { k: '拍什么', at: tWhat, v: <span style={{ fontSize: 66, fontWeight: 900, letterSpacing: -2, whiteSpace: 'nowrap' }}>自己拆自己②：一段口播怎么被 AI 剪成片</span> },
            { k: '用什么结构', at: tStruct, v: <span style={{ display: 'flex', gap: 16 }}>{['教程型', '反常识断言', '资产给予', '60–120 秒'].map((x) => <span key={x} style={{ fontSize: 56, fontWeight: 900, border: `4px solid ${P.ink}`, borderRadius: 18, padding: '4px 24px' }}>{x}</span>)}</span> },
            { k: '目标', at: tGoal, v: <span style={{ fontSize: 62, fontWeight: 900, letterSpacing: -1, whiteSpace: 'nowrap' }}>播放 ≥ <b style={{ color: P.hot }}>2,000</b> · 关注率 ≥ <b style={{ color: P.hot }}>1.03%</b> · 分享率 ≥ <b style={{ color: P.hot }}>2.95%</b></span> }]} />
        </MacroCard>
      </AbsoluteFill></Beat>

      {/* 创作：两条路 */}
      <Beat from={tC} to={seg('创作').end}><AbsoluteFill style={{ padding: '110px 110px 0' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 30 }}><span style={{ fontSize: 120, fontWeight: 900, letterSpacing: -4 }}>两条路</span><span style={{ fontSize: 46, fontWeight: 600, color: P.mute }}>选题定了以后</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 26, marginTop: 20 }}>
          <LaneTrack title="选题直出" badge="AI 全自动" stages={['选题', '定结构', '写脚本', 'AI 生成', '成片']} on={tAuto} color={P.hot} tokenAt={tAuto + 0.2} />
          <LaneTrack title="口播剪辑" badge="我录 · AI 剪" stages={['选题', '定结构', '口播提纲', '录口播', 'AI 剪']} on={tLive} color={P.ink} tokenAt={tLive + 0.2} />
        </div>
        {t >= tMine && t < tLive && <div style={{ position: 'absolute', right: 110, top: 470, width: 720, borderRadius: 24, overflow: 'hidden', border: `8px solid ${P.hot}`, boxShadow: '0 40px 90px rgba(21,19,15,.4)', transform: `scale(${mix(0.7, 1, spr((t - tMine) / 0.45))})`, transformOrigin: 'right top', opacity: Math.min(1, (t - tMine) / 0.15, (tLive - t) / 0.2) }}>
          <Sequence from={Math.round(tMine * 30)} layout="none"><OffthreadVideo src={staticFile('ep13/footage/ep06-hook.mp4')} muted style={{ width: 720, height: 405, display: 'block' }} /></Sequence>
          <div style={{ background: P.hot, color: '#fff', fontSize: 40, fontWeight: 900, padding: '6px 20px' }}>我最近这条 · 0 镜头 0 手剪</div>
        </div>}
      </AbsoluteFill></Beat>

      {/* 发布：三个平台一起排队 */}
      <Beat from={tPub} to={tCm - 0.1}><AbsoluteFill style={{ flexDirection: 'row', alignItems: 'center', padding: '0 90px 110px', gap: 60 }}>
        <Deck at={tPub} rec={121} width={640} roi={[652, 80, 458, 118]} roiAt={tPub + 0.3} label="发布" />
        <MacroCard at={tPub + 0.25} from="发布到" width={1040}>
          <CheckRows items={[{ name: '视频号', color: P.ok }, { name: '抖音', color: P.blue }, { name: '小红书', color: P.hot }]} ats={[tQ, tQ + 0.3, tQ + 0.6]} />
          <Rise at={tTimer} style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', gap: 18, fontSize: 60, fontWeight: 900, color: '#fff', background: P.hot, borderRadius: 20, padding: '8px 32px' }}>
            <svg width={56} height={56} viewBox="0 0 56 56"><circle cx={28} cy={28} r={22} fill="none" stroke="#fff" strokeWidth={6} /><path d={`M28 14 L28 28 L${28 + 11 * Math.cos(t * 3)} ${28 + 11 * Math.sin(t * 3)}`} fill="none" stroke="#fff" strokeWidth={6} strokeLinecap="round" /></svg>定时发布 · 到点自己发</Rise>
        </MacroCard>
      </AbsoluteFill></Beat>
      {/* 评论：有人打关键词 → 规则 → 草稿 → 我点一下 */}
      <Beat from={tCm - 0.1} to={seg('发布和评论').end}><AbsoluteFill style={{ padding: '120px 130px 0' }}>
        <CommentFlow comment="skill" meta="评论区 · 待处理 38 条" rule="规则：评论区打「skill」领资料" draft="回复草稿 已写好" at={tCm} ruleAt={tRule} />
        <Rise at={tCm + 0.2} dy={60} style={{ position: 'absolute', right: 110, top: 110 }}><DeckWindow src="ep13/footage/comments-blur.png" sw={1140} sh={788} at={tCm} width={600} roi={[660, 470, 470, 100]} roiAt={tRule} label="评论 · 昵称已打码" /></Rise>
        <Rise at={tSend - 0.15} style={{ position: 'absolute', right: 140, bottom: 190 }}><TapButton label="发送" done="已发送 ✓" at={tSend} /></Rise>
      </AbsoluteFill></Beat>

      {/* 观点：大字，背后闭环淡淡地转 */}
      <Beat from={tV} to={tE - 0.05}>
        <LoopRing names={LOOP} cx={1580} cy={640} r={330} fs={54} dim ats={[0, 0, 0, 0, 0, -5]} />
        <AbsoluteFill style={{ padding: '0 140px 60px', justifyContent: 'center' }}>
          <HeadlineStack lines={[
            { text: '做 IP 拼到最后，拼的不是', at: tV + 0.05, size: 96, color: P.mute },
            { text: '哪一条爆了', at: say('观点', '哪一条'), size: 210, strikeAt: say('观点', '是你每周') - 0.1 },
            { text: '是每周都知道', at: say('观点', '是你每周'), size: 96, gap: 26 },
            { text: '下一条怎么改', at: say('观点', '下一条'), size: 230, color: P.hot }]} />
        </AbsoluteFill>
      </Beat>

      {/* 收口：名字 → 关注 → 评论口令 */}
      <Beat from={tE} to={tKey - 0.1}><AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', paddingBottom: 110 }}>
        <BigFollow name="宁少" sub={<>AI 时代的<br />内容创作认知</>} at={tE} followAt={tFollow} />
      </AbsoluteFill></Beat>
      <Beat from={tKey - 0.1} to={clock13b.total}><AbsoluteFill style={{ padding: '130px 130px 0' }}>
        <div style={{ fontSize: 60, fontWeight: 600, color: P.mute }}>评论区打</div>
        <div style={{ marginTop: 16 }}><TypeBox text="工作台" at={say('收口', '打')} /></div>
        <Rise at={tGift} dy={120} style={{ position: 'absolute', right: 130, top: 150, width: 560, background: P.card, borderRadius: 30, border: `3px solid ${P.line}`, boxShadow: '0 40px 90px rgba(21,19,15,.2)', padding: '30px 36px', transform: 'rotate(4deg)' }}>
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1.2 }}>五段漏斗<br />复盘表</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 20 }}>{STAGES.map((s, i) => <div key={s.name} style={{ height: 50, width: `${100 - i * 13}%`, borderRadius: 12, background: i === 3 ? P.hot : 'rgba(21,19,15,.1)', color: i === 3 ? '#fff' : P.ink, fontSize: 30, fontWeight: 900, display: 'flex', alignItems: 'center', paddingLeft: 18 }}>S{i + 1} {s.name}</div>)}</div>
        </Rise>
        <Rise at={tGift + 0.3} style={{ position: 'absolute', left: 130, bottom: 190, fontSize: 64, fontWeight: 900 }}>先关注 → 再留言 → <span style={{ color: P.hot }}>发你</span></Rise>
      </AbsoluteFill></Beat>
    </>
  );
};

export const EP13B: React.FC = () => {
  useFonts();
  const c = clock13b;
  const sfx: [number, string, number][] = [
    [c.say('开场', '不是拍视频'), 'thud.wav', 0.5], [c.say('开场', '是拍完以后'), 'whoosh.wav', 0.45], [c.say('开场', '这些事') + 0.15, 'tick.wav', 0.4], [c.say('开场', '这些事') + 0.37, 'tick.wav', 0.4], [c.say('开场', '这些事') + 0.59, 'tick.wav', 0.4],
    [c.say('闭环', '复盘'), 'tick.wav', 0.35], [c.say('漏斗', '就是这周'), 'thud.wav', 0.45], [c.say('漏斗', '卡在关系'), 'thud.wav', 0.5], [c.say('计划', '验收'), 'thud.wav', 0.45],
    [c.say('发布和评论', '三个平台'), 'tick.wav', 0.35], [c.say('观点', '下一条'), 'thud.wav', 0.45], [c.seg('收口').start - 0.2, 'whoosh.wav', 0.4]];
  return (
    <ClockCtx.Provider value={c}>
      <AbsoluteFill style={{ background: P.paper }}>
        <Scenes /><PaperFrame brand="宁少 AI 进化论" note="画面与配音由 AI 生成" hero={heroLines} hot={hotWords} />
        {sfx.map(([t, f, v], i) => <Sequence key={i} from={Math.max(0, Math.round(t * c.fps))} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
        <Audio src={staticFile('ep13/voice.wav')} />
        <Audio src={staticFile('ep13/bgm.mp3')} volume={(f) => 0.14 * Math.min(1, f / 45) * Math.min(1, Math.max(0, (c.total * c.fps - f) / 60))} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
