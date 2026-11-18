// 第十一期：黄仁勋想回来的那一天。竖屏 1080×1920 播报风，Fish Audio 配音（用户 11-18 录制）。
// 全片用 components/bulletin.tsx（这一期新做的竖屏播报组件）。时间全部用 say(段名, 词) 从配音里取。
// 抖音规避：不用任何人物照片和国旗、地图、建筑；画面不出现「走私」「国家安全」这类大字（只留在口播和字幕里）；
// 出现股价、营收的镜头都挂「不构成投资建议」；开头 2.5 秒醒目 AI 声明，全程挂 AI 生成角标；不出现其他平台的名字。
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing, useClock, prog, mix, inOut } from '../../kit/clock';
import { useFonts, useT } from '../../kit/kit';
import { BBackdrop, BFrame, BL as B, BShot, BStage, BUp, CaseStack, DateCard, DropToZero, EmptySeat, FollowPill, Headlights, IndexTriad, KeyTyper, Kicker, MegaLine, PipeChips, QuoteCard, RoleCard, RollNumber, ScaleCompare, ShutterStamp, StatTiles, VerdictRows, bspr } from '../../components/bulletin';
import timing from './timing.json';

export const clock11 = makeClock(timing as Timing);
const c = clock11;
const hero = [c.ln('开场', '不会'), c.ln('一·为什么关门', '董事会拒绝的'), c.ln('一·为什么关门', '是一个还没结案'), c.ln('二·成绩单', '是当年一整年')];
const hot = ['1158 亿', '103%', '28 倍', '1300 亿', '24 亿', '41 亿', '80 亿', '200 亿', '是零', '不会', '小鹿', '工作流'];
const ticker = ['英伟达 FY2027 第三季度营收 1158 亿美元', '同比 +103%', '下季营收指引 1300 亿美元 ±3%', '盘后股价 +2%～3%', '数据来自公司财报与公开报道', '不构成投资建议'];
const NoAdvice: React.FC = () => <div style={{ position: 'absolute', right: 60, top: 1300, fontSize: 24, fontWeight: 600, color: B.mute }}>数据来自公司财报与公开报道 · 不构成投资建议</div>;

const Scenes: React.FC = () => {
  const t = useT(), { seg, say } = useClock();
  const s = say;
  return (
    <>
      {/* ───────── 开场：同一天，上午 → 几小时后 → 不会 → 她 ───────── */}
      <BShot from={0} to={s('开场', '几个小时后')} wipe={false}><BStage>
        <BUp at={0.05}><Kicker at={0.05}>11 月 17 日 · 上午</Kicker></BUp>
        <div style={{ marginTop: 40 }}><MegaLine text="黄仁勋：" at={0.4} size={120} color={B.mute} /></div>
        <MegaLine text="我愿意回来" at={s('开场', '他愿意回归')} size={170} />
        <BUp at={s('开场', '重新出任')} style={{ marginTop: 26 }}><span style={{ fontSize: 64, fontWeight: 900, color: B.gold }}>重新出任 CEO</span></BUp>
      </BStage></BShot>
      <BShot from={s('开场', '几个小时后')} to={s('开场', '不会') - 0.05}><BStage>
        <BUp at={s('开场', '几个小时后')}><Kicker>几个小时后</Kicker></BUp>
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', gap: 30 }}>
          <svg width={200} height={200} viewBox="0 0 200 200"><circle cx={100} cy={100} r={86} fill="none" stroke={B.text} strokeWidth={10} /><path d={`M100 100 L${100 + 60 * Math.cos(t * 9 - 1.57)} ${100 + 60 * Math.sin(t * 9 - 1.57)}`} stroke={B.red} strokeWidth={10} strokeLinecap="round" /><path d={`M100 100 L${100 + 42 * Math.cos(t * 1.2)} ${100 + 42 * Math.sin(t * 1.2)}`} stroke={B.text} strokeWidth={12} strokeLinecap="round" /></svg>
          <div><div style={{ fontSize: 60, fontWeight: 900, color: B.mute }}>英伟达董事长</div><div style={{ fontSize: 96, fontWeight: 900 }}>当众回答</div></div>
        </div>
      </BStage></BShot>
      <BShot from={s('开场', '不会') - 0.05} to={s('开场', '而交出') - 0.05} hard wipe={false}><BStage style={{ alignItems: 'center' }}>
        <div style={{ fontSize: 460, fontWeight: 900, color: B.red, letterSpacing: -20, transform: `scale(${mix(1.5, 1, bspr((t - s('开场', '不会')) / 0.4))})`, opacity: Math.min(1, (t - s('开场', '不会') + 0.05) / 0.12), textShadow: `0 0 80px ${B.red}88` }}>不会</div>
      </BStage></BShot>
      <BShot from={s('开场', '而交出') - 0.05} to={seg('开场').end}><BStage>
        <BUp at={s('开场', '而交出')}><span style={{ fontSize: 64, fontWeight: 900 }}>交出成绩单的</span></BUp>
        <div style={{ marginTop: 26 }}><Headlights at={s('开场', '正是三个月前')}>
          <div style={{ fontSize: 46, fontWeight: 900, color: B.mute }}>三个月前，他说她像</div>
          <div style={{ fontSize: 120, fontWeight: 900, color: B.gold, marginTop: 20, opacity: prog(t, s('开场', '车灯前'), 0.3), whiteSpace: 'nowrap' }}>车灯前<br />发呆的小鹿</div>
        </Headlights></div>
      </BStage></BShot>

      {/* ───────── 声明 ───────── */}
      <BShot from={seg('声明').start} to={s('声明', '今天') - 0.1}><BStage>
        <BUp at={s('声明', '我是陈宁')}><span style={{ fontSize: 150, fontWeight: 900, letterSpacing: -4 }}>我是陈宁</span></BUp>
        <BUp at={s('声明', '由我的')} style={{ marginTop: 40 }}><div style={{ fontSize: 44, fontWeight: 900, color: B.mute, marginBottom: 18 }}>这条视频 · 我的 AI 工作流</div><PipeChips items={['写稿', '核对', '配音', '剪辑', '成片']} at={s('声明', '自动剪辑') - 0.2} step={0.22} /></BUp>
        <BUp at={s('声明', '如果你也想用')} style={{ marginTop: 50 }}><KeyTyper label="想用的话，评论区打" text="工作流" at={s('声明', '评论区打') + 0.3} /></BUp>
      </BStage></BShot>
      <BShot from={s('声明', '今天') - 0.1} to={seg('声明').end}><BStage>
        <IndexTriad title="这一天的三件事" items={['他想回来', '她交成绩单', '没说的答案']} ats={[s('声明', '三件事') - 0.2, s('声明', '三件事') + 0.15, s('声明', '三件事') + 0.5]} />
      </BStage></BShot>

      {/* ───────── 一·他想回来 ───────── */}
      <BShot from={seg('一·他想回来').start} to={s('一·他想回来', '如果董事会') - 0.1}><BStage>
        <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          {[['11.12', '辞职', s('一·他想回来', '11 月 12 日')], ['11.17', '发声明', s('一·他想回来', '五天后')]].map(([d, w, at], i) => (
            <React.Fragment key={d as string}>{i > 0 && <BUp at={at as number}><div style={{ width: 120, height: 8, background: B.red, borderRadius: 4 }} /><div style={{ fontSize: 34, fontWeight: 900, color: B.red, textAlign: 'center', marginTop: 8 }}>5 天</div></BUp>}
              <BUp at={at as number}><div style={{ background: B.panel, border: `2px solid ${B.line}`, borderRadius: 22, padding: '26px 34px', textAlign: 'center' }}><div style={{ fontSize: 110, fontWeight: 900, color: i ? B.gold : B.text }}>{d}</div><div style={{ fontSize: 50, fontWeight: 900, color: B.mute }}>{w}</div></div></BUp></React.Fragment>))}
        </div>
      </BStage></BShot>
      <BShot from={s('一·他想回来', '如果董事会') - 0.1} to={s('一·他想回来', '支持他的人') - 0.1}><BStage>
        <QuoteCard at={s('一·他想回来', '如果董事会') - 0.1} who="黄仁勋 · 11 月 17 日声明" when="原文为英文，意译" parts={[
          { text: '如果董事会认为，我回来对', at: s('一·他想回来', '如果董事会') }, { text: '股东、', at: s('一·他想回来', '对股东'), hot: true }, { text: '员工、', at: s('一·他想回来', '对员工'), hot: true },
          { text: '公司、', at: s('一·他想回来', '对公司'), hot: true }, { text: '美国', at: s('一·他想回来', '对美国'), hot: true }, { text: '最好，', at: s('一·他想回来', '最好') },
          { text: '我很荣幸回来当 CEO。', at: s('一·他想回来', '我很荣幸') }]} size={72} />
      </BStage></BShot>
      <BShot from={s('一·他想回来', '支持他的人') - 0.1} to={seg('一·他想回来').end}><BStage>
        <MegaLine text="场外的声音" at={s('一·他想回来', '支持他的人')} size={120} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 40 }}>
          <BUp at={s('一·他想回来', '公开说')}><div style={{ background: B.panel, borderRadius: 18, padding: '24px 30px', fontSize: 54, fontWeight: 900 }}><span style={{ color: B.gold }}>公开表态：</span>他可以回来</div></BUp>
          <BUp at={s('一·他想回来', '请愿')}><div style={{ background: B.panel, borderRadius: 18, padding: '24px 30px', fontSize: 54, fontWeight: 900 }}><span style={{ color: B.gold }}>网上请愿：</span>挺他回来</div></BUp>
        </div>
      </BStage></BShot>

      {/* ───────── 一·门关上了 ───────── */}
      <BShot from={seg('一·门关上了').start} to={s('一·门关上了', '董事会一致') - 0.1}><BStage>
        <BUp at={s('一·门关上了', '电话会')}><Kicker>财报电话会 · 开场</Kicker></BUp>
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'flex-end', gap: 10, height: 200 }}>{Array.from({ length: 36 }).map((_, i) => <div key={i} style={{ width: 16, borderRadius: 8, background: i % 5 ? B.text : B.red, height: 30 + 150 * Math.abs(Math.sin(t * 6 + i * 0.7) * Math.sin(t * 2.3 + i)) * prog(t, s('一·门关上了', '电话会'), 0.4) }} />)}</div>
        <BUp at={s('一·门关上了', '董事长')} style={{ marginTop: 50 }}><div style={{ fontSize: 50, fontWeight: 900, color: B.mute }}>先开口的是</div><div style={{ fontSize: 110, fontWeight: 900 }}>董事长</div><div style={{ fontSize: 60, fontWeight: 900, color: B.gold }}>Harvey Jones</div></BUp>
      </BStage></BShot>
      <BShot from={s('一·门关上了', '董事会一致') - 0.1} to={s('一·门关上了', '今天') - 0.1}><BStage>
        <ShutterStamp at={s('一·门关上了', '没有让他回来')} stamp="不回归" sub="董事会一致决定">
          <div style={{ textAlign: 'center' }}><div style={{ fontSize: 60, fontWeight: 900, color: B.mute }}>董事会</div><div style={{ fontSize: 110, fontWeight: 900 }}>一致接受辞职</div></div>
        </ShutterStamp>
      </BStage></BShot>
      <BShot from={s('一·门关上了', '今天') - 0.1} to={seg('一·门关上了').end}><BStage>
        <MegaLine text="今天不回答" at={s('一·门关上了', '今天')} size={140} />
        <div style={{ display: 'flex', gap: 24, marginTop: 40 }}>{[['他为什么辞职', s('一·门关上了', '辞职和')], ['调查到哪一步', s('一·门关上了', '调查的')]].map(([x, at]) => (
          <BUp key={x as string} at={(at as number) - 0.2} style={{ flex: 1 }}><div style={{ background: B.panel, border: `2px solid ${B.red}`, borderRadius: 20, padding: '30px 26px', textAlign: 'center' }}><div style={{ fontSize: 90, color: B.red, fontWeight: 900 }}>✕</div><div style={{ fontSize: 50, fontWeight: 900 }}>{x}</div></div></BUp>))}</div>
      </BStage></BShot>

      {/* ───────── 一·为什么关门 ───────── */}
      <BShot from={seg('一·为什么关门').start} to={s('一·为什么关门', '董事会自己') - 0.1}><BStage>
        <MegaLine text="为什么" at={s('一·为什么关门', '为什么')} size={230} color={B.red} />
        <MegaLine text="这么坚决？" at={s('一·为什么关门', '这么坚决')} size={150} />
        <BUp at={s('一·为什么关门', '一件都还没')} style={{ marginTop: 40 }}><span style={{ fontSize: 66, fontWeight: 900, color: B.gold }}>他身上的事，一件都没结束</span></BUp>
      </BStage></BShot>
      <BShot from={s('一·为什么关门', '董事会自己') - 0.1} to={s('一·为什么关门', '董事会拒绝的') - 0.1}><BStage style={{ justifyContent: 'flex-start', paddingTop: 30 }}>
        <CaseStack items={[
          { no: '01', title: '董事会独立调查', status: '进行中', at: s('一·为什么关门', '董事会自己') },
          { no: '02', title: '证监会调查', note: '据报道', status: '进行中', at: s('一·为什么关门', '据报道') },
          { no: '03', title: '国会三个委员会', note: '12 月 1 日 闭门问话', status: '待问话', at: s('一·为什么关门', '国会三个') },
          { no: '04', title: '问一家新加坡公司', note: 'Megaspeed · 对方否认被指的行为', status: '调查中', at: s('一·为什么关门', '问的是'), color: B.gold },
          { no: '05', title: '新设合规委员会', note: '英伟达董事会新设', status: '已成立', at: s('一·为什么关门', '英伟达还专门'), color: B.cyan }]} />
      </BStage></BShot>
      <BShot from={s('一·为什么关门', '董事会拒绝的') - 0.1} to={seg('一·为什么关门').end}><BStage>
        <div style={{ fontSize: 70, fontWeight: 900, color: B.mute }}>董事会拒绝的</div>
        <div style={{ position: 'relative', display: 'inline-block', alignSelf: 'flex-start' }}><MegaLine text="不是一个人" at={s('一·为什么关门', '不是一个人')} size={150} />
          <div style={{ position: 'absolute', left: -10, top: '52%', height: 18, background: B.red, width: `${inOut((t - s('一·为什么关门', '是一个还没') + 0.2) / 0.3) * 105}%` }} /></div>
        <div style={{ marginTop: 30 }}><MegaLine text="是一个" at={s('一·为什么关门', '是一个还没')} size={110} color={B.mute} /></div>
        <MegaLine text="未结案的风险" at={s('一·为什么关门', '还没结案') - 0.1} size={150} color={B.red} />
      </BStage></BShot>

      {/* ───────── 二·车灯前的小鹿 ───────── */}
      <BShot from={seg('二·车灯前的小鹿').start} to={s('二·车灯前的小鹿', '黄仁勋打断') - 0.1}><BStage>
        <RoleCard name="Colette Kress" en="科莱特·克雷斯" role="首席财务官 CFO" to="临时 CEO（兼 CFO）" at={s('二·车灯前的小鹿', '再说她')} flipAt={s('二·车灯前的小鹿', 'Colette') + 0.6} />
        <BUp at={s('二·车灯前的小鹿', '华尔街日报')} style={{ marginTop: 60 }}><div style={{ background: B.panel, borderRadius: 20, padding: '26px 32px' }}>
          <div style={{ fontSize: 36, fontWeight: 900, color: B.gold }}>华尔街日报 报道</div>
          <div style={{ fontSize: 60, fontWeight: 900, marginTop: 8 }}>今年 8 月 · 一次财务会议</div>
          <div style={{ fontSize: 46, fontWeight: 600, color: B.mute, marginTop: 6, opacity: prog(t, s('二·车灯前的小鹿', '她正在汇报'), 0.3) }}>她正在汇报……</div></div></BUp>
      </BStage></BShot>
      <BShot from={s('二·车灯前的小鹿', '黄仁勋打断') - 0.1} to={s('二·车灯前的小鹿', '那次会') - 0.1}><BStage>
        <BUp at={s('二·车灯前的小鹿', '黄仁勋打断')}><Kicker>他打断了她</Kicker></BUp>
        <div style={{ marginTop: 26 }}><Headlights at={s('二·车灯前的小鹿', '说她像')}>
          <div style={{ fontSize: 110, fontWeight: 900, color: B.gold, whiteSpace: 'nowrap' }}>「车灯前<br />发呆的小鹿」</div>
          <div style={{ fontSize: 66, fontWeight: 900, marginTop: 40, opacity: prog(t, s('二·车灯前的小鹿', '只是个'), 0.3) }}>「只是个负责汇报的 CFO」</div>
          <div style={{ fontSize: 46, fontWeight: 900, color: B.mute, marginTop: 20, opacity: prog(t, s('二·车灯前的小鹿', '帮不了'), 0.3) }}>帮不了他定战略</div>
        </Headlights></div>
      </BStage></BShot>
      <BShot from={s('二·车灯前的小鹿', '那次会') - 0.1} to={s('二·车灯前的小鹿', '这个说法') - 0.1}><BStage>
        <BUp at={s('二·车灯前的小鹿', '那次会')}><Kicker ghost color={B.gold}>那次会在讨论什么</Kicker></BUp>
        <div style={{ marginTop: 40, display: 'flex', alignItems: 'flex-end', gap: 26, height: 360 }}>
          {[0.3, 0.45, 0.62, 0.8, 1].map((h, i) => { const p = inOut((t - s('二·车灯前的小鹿', '越来越大') - i * 0.18) / 0.4); return <div key={i} style={{ flex: 1, height: 360 * h * p, background: `linear-gradient(0deg, ${B.red}, ${B.gold})`, borderRadius: 12 }} />; })}
        </div>
        <BUp at={s('二·车灯前的小鹿', '越来越大')} style={{ marginTop: 20 }}><div style={{ fontSize: 58, fontWeight: 900 }}>越来越大的融资承诺</div></BUp>
        <BUp at={s('二·车灯前的小鹿', '替买不起')} style={{ marginTop: 12 }}><div style={{ fontSize: 50, fontWeight: 900, color: B.mute }}>替买不起芯片的客户 <span style={{ color: B.gold }}>兜底</span></div></BUp>
        <BUp at={s('二·车灯前的小鹿', '质疑这些')} style={{ marginTop: 40 }}><div style={{ display: 'inline-block', fontSize: 70, fontWeight: 900, background: B.red, padding: '10px 30px', borderRadius: 14 }}>质疑这些交易的：她</div></BUp>
      </BStage></BShot>
      <BShot from={s('二·车灯前的小鹿', '这个说法') - 0.1} to={seg('二·车灯前的小鹿').end}><BStage>
        <MegaLine text="但要说清楚" at={s('二·车灯前的小鹿', '这个说法')} size={120} color={B.mute} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 40 }}>
          <BUp at={s('二·车灯前的小鹿', '匿名知情人')}><div style={{ background: B.panel, borderLeft: `10px solid ${B.gold}`, borderRadius: 16, padding: '24px 30px', fontSize: 58, fontWeight: 900 }}>来源：<span style={{ color: B.gold }}>一位匿名知情人</span></div></BUp>
          <BUp at={s('二·车灯前的小鹿', '两个人都')}><div style={{ background: B.panel, borderLeft: `10px solid ${B.gold}`, borderRadius: 16, padding: '24px 30px', fontSize: 58, fontWeight: 900 }}>当事双方：<span style={{ color: B.gold }}>都没有回应</span></div></BUp>
        </div>
      </BStage></BShot>

      {/* ───────── 二·十三年 ───────── */}
      <BShot from={seg('二·十三年').start} to={s('二·十三年', '那一年') - 0.1}><BStage>
        <MegaLine text="她不是突然冒出来的" at={s('二·十三年', '她不是')} size={88} />
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 30 }}><RollNumber to={2013} from={2026} at={s('二·十三年', '2013') - 0.3} dur={0.7} size={220} color={B.text} /><span style={{ fontSize: 60, fontWeight: 900, color: B.mute }}>年</span></div>
        <BUp at={s('二·十三年', '她从思科')} style={{ marginTop: 20 }}><div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 66, fontWeight: 900 }}><span style={{ color: B.mute }}>思科</span><span style={{ color: B.red }}>→</span><span>英伟达 CFO</span></div></BUp>
        <BUp at={s('二·十三年', '据说')} style={{ marginTop: 40 }}><div style={{ display: 'flex', alignItems: 'center', gap: 26, background: B.panel, borderRadius: 20, padding: '20px 28px' }}>
          <svg width={120} height={84} viewBox="0 0 120 84"><rect x={6} y={10} width={108} height={64} rx={32} fill="none" stroke={B.gold} strokeWidth={7} /><path d="M32 30 L32 54 M20 42 L44 42" stroke={B.gold} strokeWidth={7} strokeLinecap="round" /><circle cx={82} cy={36} r={6} fill={B.gold} /><circle cx={94} cy={48} r={6} fill={B.gold} /></svg>
          <div><div style={{ fontSize: 30, fontWeight: 900, color: B.mute }}>据说，两个儿子告诉她</div><div style={{ fontSize: 50, fontWeight: 900 }}>它在游戏圈很有名</div></div></div></BUp>
      </BStage></BShot>
      <BShot from={s('二·十三年', '那一年') - 0.1} to={seg('二·十三年').end}><BStage>
        <div style={{ fontSize: 60, fontWeight: 900, color: B.mute }}>那一年，英伟达全年营收</div>
        <div style={{ marginTop: 20 }}><RollNumber to={41} at={s('二·十三年', '41') - 0.4} dur={0.7} post="亿美元" size={300} color={B.text} /></div>
        <div style={{ fontSize: 34, fontWeight: 600, color: B.mute, marginTop: 20 }}>2014 财年（截至 2014 年 1 月）· 41.3 亿美元</div>
      </BStage></BShot>

      {/* ───────── 二·成绩单 ───────── */}
      <BShot from={seg('二·成绩单').start} to={s('二·成绩单', '同比') - 0.1}><BStage>
        <ScaleCompare a={{ label: '2013 年 · 一整年', value: '41 亿', v: 41 }} b={{ label: '这一季 · 一个季度', value: '1158 亿', v: 1158 }} at={s('二·成绩单', '十三年后')} bAt={s('二·成绩单', '1158') - 0.2} mulAt={s('二·成绩单', '28 倍') - 0.3} mul={28} />
        <NoAdvice />
      </BStage></BShot>
      <BShot from={s('二·成绩单', '同比') - 0.1} to={seg('二·成绩单').end}><BStage style={{ justifyContent: 'flex-start', paddingTop: 20 }}>
        <StatTiles items={[
          { label: '同比增长', to: 103, post: '%', at: s('二·成绩单', '同比'), color: B.red },
          { label: '比自己的预期多出', to: 80, pre: '≈', post: '亿', at: s('二·成绩单', '多出') },
          { label: '新芯片 Vera Rubin 首季', to: 200, pre: '≈', post: '亿', at: s('二·成绩单', '就卖了'), color: B.cyan },
          { label: '下一季预期', to: 1300, post: '亿', at: s('二·成绩单', '她给的预期') },
          { label: '盘后股价', to: 3, pre: '+2～', post: '%', at: s('二·成绩单', '盘后'), color: B.red }]} />
        <NoAdvice />
      </BStage></BShot>

      {/* ───────── 二·中国 ───────── */}
      <BShot from={seg('二·中国').start} to={seg('二·中国').end}><BStage>
        <BUp at={s('二·中国', '有一个数字')}><Kicker>单独说一个数</Kicker></BUp>
        <div style={{ marginTop: 40 }}><DropToZero label="这一季 · 特许芯片对华销售" from={24} post="亿美元" at={s('二·中国', '这一季')} dropAt={s('二·中国', '1300 亿的') - 0.2} zeroLabel="下季 1300 亿预期里：0" stamp="已停止" stampAt={s('二·中国', '现在已经停了')} /></div>
        <NoAdvice />
      </BStage></BShot>

      {/* ───────── 三·没说的 ───────── */}
      <BShot from={seg('三·没说的').start} to={s('三·没说的', '可是') - 0.1}><BStage>
        <QuoteCard at={s('三·没说的', '电话会上')} who="Colette Kress · 电话会" when="原文：business as usual" color={B.cyan} parts={[{ text: '从生意上看，', at: s('三·没说的', '从生意上') }, { text: '一切照常。', at: s('三·没说的', '一切照常'), hot: true }]} size={100} />
      </BStage></BShot>
      <BShot from={s('三·没说的', '可是') - 0.1} to={seg('三·没说的').end}><BStage style={{ alignItems: 'center' }}>
        <EmptySeat at={s('三·没说的', '可是')} title="正式 CEO：空缺" tags={[{ text: '猎头 · 已聘请', at: s('三·没说的', '猎头') }, { text: '时间表 · 无', at: s('三·没说的', '时间表') }]} />
      </BStage></BShot>

      {/* ───────── 结论 ───────── */}
      <BShot from={seg('结论').start} to={seg('结论').end}><BStage>
        <MegaLine text="说白了" at={s('结论', '说白了')} size={130} color={B.gold} />
        <div style={{ marginTop: 40 }}><VerdictRows rows={[
          { k: '没有黄仁勋，英伟达的生意', v: '照样在涨', ok: true, at: s('结论', '英伟达的生意') },
          { k: '以后由谁拍板', v: '没人能回答', ok: false, at: s('结论', '由谁拍板') },
          { k: '这家公司往哪走', v: '没人能回答', ok: false, at: s('结论', '往哪走') }]} /></div>
      </BStage></BShot>

      {/* ───────── 下一步 ───────── */}
      <BShot from={seg('下一步').start} to={s('下一步', '明天') - 0.1}><BStage>
        <MegaLine text="接下来最值得看" at={s('下一步', '这才是')} size={110} />
        <div style={{ display: 'flex', gap: 30, marginTop: 40, alignItems: 'flex-start' }}>
          <DateCard month="12 月" day="1" event="他赴国会闭门问话" at={s('下一步', '12 月 1 日')} />
          <BUp at={s('下一步', '新 CEO')} style={{ flex: 1 }}><div style={{ background: B.panel, borderRadius: 24, border: `2px solid ${B.line}`, padding: '30px 30px', height: 420, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 44, fontWeight: 900, color: B.mute }}>新 CEO</div><div style={{ fontSize: 120, fontWeight: 900, color: B.red }}>待定</div><div style={{ fontSize: 40, fontWeight: 900, color: B.gold, opacity: prog(t, s('下一步', '我会接着拆'), 0.3) }}>我会接着拆</div></div></BUp>
        </div>
        <div style={{ marginTop: 50 }}><FollowPill name="陈宁" at={s('下一步', '想看后续') - 0.2} clickAt={s('下一步', '关注我') + 0.2} /></div>
      </BStage></BShot>
      <BShot from={s('下一步', '明天') - 0.1} to={c.total}><BStage>
        <MegaLine text="明天" at={s('下一步', '明天')} size={200} color={B.red} />
        <BUp at={s('下一步', '我再把')} style={{ marginTop: 20 }}><div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.25 }}>拆给你看：<br />这条视频怎么用 AI 做出来</div></BUp>
        <BUp at={s('下一步', '我再把') + 0.6} style={{ marginTop: 40 }}><PipeChips items={['写稿', '核对', '配音', '剪辑', '成片']} at={s('下一步', '我再把') + 0.8} step={0.25} /></BUp>
      </BStage></BShot>
    </>
  );
};

export const EP11: React.FC = () => {
  useFonts();
  const sfx: [number, string, number][] = [
    [c.say('开场', '几个小时后'), 'whoosh.wav', 0.4], [c.say('开场', '不会'), 'thud.wav', 0.6], [c.say('开场', '车灯前'), 'whoosh.wav', 0.35],
    [c.say('声明', '三件事'), 'tick.wav', 0.35], [c.say('一·门关上了', '没有让他回来'), 'thud.wav', 0.55], [c.seg('一·为什么关门').start, 'whoosh.wav', 0.35],
    [c.say('一·为什么关门', '还没结案'), 'thud.wav', 0.5], [c.say('二·车灯前的小鹿', '说她像'), 'whoosh.wav', 0.35], [c.say('二·成绩单', '28 倍'), 'thud.wav', 0.55],
    [c.say('二·中国', '现在已经停了'), 'thud.wav', 0.5], [c.say('三·没说的', '谁来当'), 'tick.wav', 0.4], [c.say('下一步', '关注我') + 0.2, 'tick.wav', 0.4]];
  return (
    <ClockCtx.Provider value={c}>
      <AbsoluteFill>
        <BBackdrop /><Scenes />
        <BFrame show="宁少 · AI 快报" date="11.17 美东" ticker={ticker} hero={hero} hot={hot}
          chapters={[{ from: c.seg('一·他想回来').start, label: '第一件事 · 他想回来' }, { from: c.seg('二·车灯前的小鹿').start, label: '第二件事 · 她交成绩单' }, { from: c.seg('三·没说的').start, label: '第三件事 · 没说的答案' }, { from: c.seg('结论').start, label: '结论' }, { from: c.seg('下一步').start, label: '接下来' }]} />
        {[...sfx].map(([at, f, v], i) => <Sequence key={i} from={Math.max(0, Math.round(at * c.fps))} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
        <Audio src={staticFile('ep11/voice.wav')} />
        <Audio src={staticFile('ep11/bgm.mp3')} volume={(f) => 0.12 * Math.min(1, f / 45) * Math.min(1, Math.max(0, (c.total * c.fps - f) / 60))} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
