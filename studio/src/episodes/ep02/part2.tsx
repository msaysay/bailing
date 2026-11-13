// 第二件事、第三件事、论点、市场、业绩、判断、片尾。规则同 part1：画面字不重复口播，关键句用强调字幕。
import React from 'react';
import { useClock, prog, mix, inOut } from '../../kit/clock';
import { C, Chip, Note, Panel, Pop, Scene, Src, Stage, useT } from '../../kit/kit';
import { ChapterCard } from '../../components';
import { FlapYear, KineticLine, PeopleGrid } from '../../components/rich';
import { BillMerge, CheckList, ChipFill, CutBubble, DropRuler, Earnings, EmptySeat, Milestones, MonthCells, NearZero, OrgRadial, OrgTreeCrossed, Outro, RankGrid, RoleFlip, RouteGate, TargetCard } from '../../components/rich2';

const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 30 }) => <div style={{ fontSize: size, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{children}</div>;

/** 立场滑轨：对华芯片出口「收紧 ←→ 放宽」，一个标记停在某一侧；tighten 之后整条向收紧一侧染色。 */
const Stance: React.FC<{ at: number; markAt?: number; tightenAt?: number }> = ({ at, markAt, tightenAt }) => {
  const t = useT(), W = 1400, m = markAt === undefined ? 0 : prog(t, markAt, 0.5), k = tightenAt === undefined ? 0 : inOut((t - tightenAt) / 1.0);
  return (
    <Pop at={at}><div style={{ position: 'relative', width: W, height: 250 }}>
      <Tag>对华芯片出口管制</Tag>
      <div style={{ position: 'absolute', left: 0, top: 110, width: W, height: 26, borderRadius: 13, background: C.surface, border: `1px solid ${C.line}` }} />
      <div style={{ position: 'absolute', left: 0, top: 110, width: W * mix(0.5, 0.92, k), height: 26, borderRadius: 13, background: C.down, opacity: mix(0.35, 1, k) }} />
      <div style={{ position: 'absolute', left: 0, top: 150, fontSize: 40, fontWeight: 900, color: C.down }}>收紧</div>
      <div style={{ position: 'absolute', right: 0, top: 150, fontSize: 40, fontWeight: 900, color: C.accent }}>放宽</div>
      {markAt !== undefined && <div style={{ position: 'absolute', left: W * 0.8 - 110, top: mix(20, 56, m), width: 220, textAlign: 'center', opacity: m * (1 - k) }}>
        <div style={{ background: C.accent, color: '#fff', borderRadius: 12, padding: '6px 0', fontSize: 34, fontWeight: 900 }}>黄仁勋</div><div style={{ width: 4, height: 34, background: C.accent, margin: '0 auto' }} /></div>}
    </div></Pop>
  );
};

export const Part2: React.FC = () => {
  const { seg, say } = useClock();
  const T = '二·图腾', N = '二·没有二号位', K = '二·CFO', Bd = '二·董事会', W = '三·华盛顿', P = '论点', M = '市场', E = '业绩', J = '判断', O = '片尾';
  const tT2 = say(T, '然后他砍掉') - 0.2, tQ = say(Bd, '原话是') - 0.2;
  const w1 = say(W, '他一走 国会') - 0.2, w2 = say(W, '专门堵') - 0.2, w3 = say(W, '英伟达自己披露') - 0.2, w4 = say(W, '他一走 这条线') - 0.2;
  const m2 = say(M, '高盛') - 0.2, e2 = say(E, '坏的不是数字') - 0.2;
  return (
    <>
      {/* 第二件事：1996 全员会成了图腾 */}
      <Scene from={seg(T).start} to={tT2} hard><Stage style={{ justifyContent: 'center', paddingLeft: 170 }}>
        <Pop at={say(T, '1996 年那场')} style={{ display: 'flex', alignItems: 'center', gap: 30 }}><FlapYear from={1996} to={1996} at={0} size={90} color={C.warm} /><Tag>全员会 · 后来每次内部讲话都从这句开始</Tag></Pop>
        <div style={{ border: `3px solid ${C.warm}`, borderRadius: 18, padding: '40px 50px', marginTop: 36, alignSelf: 'flex-start', background: 'rgba(13,17,25,.75)', opacity: prog(useT(), say(T, '后来成了'), 0.4) }}>
          <KineticLine seg={T} words={['我们离破产只有三十天']} size={104} color={C.warm} hot={['我们离破产只有三十天']} />
        </div>
      </Stage></Scene>
      <Scene from={tT2} to={seg(T).end}><Stage style={{ gap: 30, paddingTop: 170 }}>
        <Milestones points={[
          { year: '1996', title: '砍掉押错的路线', at: say(T, '然后他砍掉') },
          { year: '1996', title: '剩下的钱全押下一代', at: say(T, '全押进') },
          { year: '1997', title: 'RIVA 128 上市', note: '第三代芯片', at: say(T, 'RIVA 128'), color: C.accent }]} />
        <div style={{ display: 'flex', gap: 40, alignItems: 'stretch' }}>
          <MonthCells lit={1} at={say(T, '公司账上')} label="上市时，账上的钱够发工资" value="1 个月" />
          <ChipFill to={1000000} unit="颗" at={say(T, '一百万颗') - 0.5} label="上市 4 个月售出" src="维基百科 RIVA 128 条目" />
        </div>
      </Stage></Scene>
      <ChapterCard no="02" title="没有二号位" at={say(T, '第二件事') - 0.15} hold={1.6} />

      {/* 60 人直连、两个空位、不用架构图 */}
      <Scene from={seg(N).start} to={seg(N).end}><Stage style={{ flexDirection: 'row', gap: 70, alignItems: 'center', paddingTop: 130 }}>
        <Pop at={say(N, '老黄领导团队') - 0.4} dy={0}><OrgRadial n={60} at={say(N, '老黄领导团队') - 0.2} dur={say(N, '全部直接') - say(N, '老黄领导团队') + 0.6} center="黄仁勋" size={620} /></Pop>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30 }}>
          <Pop at={say(N, '60 人')}><div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}><span style={{ fontSize: 140, fontWeight: 900, lineHeight: 1 }}>60</span><Tag size={36}>人 · 没有中间层</Tag></div><Src>TechCrunch、Semafor：50 至 60 余人直接汇报</Src></Pop>
          <div style={{ display: 'flex', gap: 40, marginTop: 6 }}><EmptySeat title="COO" at={say(N, '不设 COO')} /><EmptySeat title="二号位" at={say(N, '没有二号位')} /></div>
          <div style={{ display: 'flex', gap: 30, alignItems: 'center' }}>
            <OrgTreeCrossed at={say(N, '组织架构图')} crossAt={say(N, '我不用')} />
            <Pop at={say(N, '33 年')}><Tag size={34} color={C.text}>决策 <span style={{ color: C.accent }}>1 人</span></Tag><Tag size={34} color={C.text}>执行 <span style={{ color: C.muted }}>其余所有人</span></Tag></Pop>
          </div>
        </div>
      </Stage></Scene>

      {/* CFO：被打断 → 三个月后头衔翻面 */}
      <Scene from={seg(K).start} to={seg(K).end}><Stage style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', padding: '150px 110px 230px' }}>
        <CutBubble at={say(K, '今年 8 月') + 0.2} cutAt={say(K, '他当众打断') + 0.5} who="2026 年 8 月 · 高管会 · CFO 发言中" tag="“负责汇报的 CFO”" tagAt={say(K, '负责汇报')} />
        <Pop at={say(K, '三个月后')} style={{ textAlign: 'center' }}><Tag color={C.warm} size={36}>3 个月后</Tag><div style={{ fontSize: 80, fontWeight: 900, color: C.muted }}>→</div></Pop>
        <RoleFlip name="科莱特·克雷斯" en="Colette M. Kress" a="首席财务官" b="临时首席执行官" at={say(K, '说她只是')} flipAt={say(K, '临时 CEO') - 0.4} src="英伟达 8-K · 2026-11-11" />
      </Stage></Scene>

      {/* 董事会：10 人、650 家里第 609 */}
      <Scene from={seg(Bd).start} to={tQ}><Stage style={{ gap: 26, paddingTop: 170 }}>
        <Pop at={say(Bd, '10 个董事') - 0.2} style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <PeopleGrid total={10} keep={10} cols={10} at={say(Bd, '10 个董事')} mode="light" dot={40} dur={0.6} /><Tag size={36} color={C.text}>10 位董事 · 负责选出新 CEO</Tag>
        </Pop>
        <div style={{ display: 'flex', gap: 50, alignItems: 'center' }}>
          <Pop at={say(Bd, '一家评级机构') - 0.2} dy={0}><RankGrid total={650} rank={609} at={say(Bd, '一家评级机构')} dur={say(Bd, '609') - say(Bd, '一家评级机构') + 0.5} cols={50} cell={18} /></Pop>
          <Pop at={say(Bd, '609')}><Tag>董事会评级 · 2026</Tag><div style={{ fontSize: 150, fontWeight: 900, color: C.down, lineHeight: 1.05, whiteSpace: 'nowrap' }}>609<span style={{ fontSize: 56, color: C.muted }}> / 650</span></div></Pop>
        </div>
      </Stage></Scene>
      <Scene from={tQ} to={seg(Bd).end}><Stage style={{ justifyContent: 'center', paddingLeft: 180 }}>
        <Pop at={say(Bd, '原话是')}><Tag color={C.down}>评级机构对这个董事会的评语</Tag></Pop>
        <div style={{ borderLeft: `8px solid ${C.down}`, paddingLeft: 44, marginTop: 26 }}><KineticLine seg={Bd} words={['这是一个', '糟糕透顶', '的董事会']} hot={['糟糕透顶']} size={130} color={C.down} /></div>
      </Stage></Scene>

      {/* 第三件事：华盛顿 */}
      <Scene from={seg(W).start} to={w1} hard><Stage style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Stance at={say(W, '黄仁勋一直是')} markAt={say(W, '放宽')} />
      </Stage></Scene>
      <Scene from={w1} to={w2}><Stage style={{ paddingTop: 200, gap: 30, transform: 'scale(1.08)', transformOrigin: 'left top' }}>
        <Pop at={say(W, '国会两党')} style={{ display: 'flex', gap: 20, alignItems: 'center' }}><Tag color={C.text} size={36}>国会</Tag><Chip style={{ fontSize: 32, padding: '8px 22px' }}>民主党</Chip><Chip style={{ fontSize: 32, padding: '8px 22px' }}>共和党</Chip><Tag>两党都在推</Tag></Pop>
        <BillMerge n={4} at={say(W, '四个法案')} mergeAt={say(W, '国防授权法案') - 0.3} into="国防授权法案" sub="NDAA · 每年必须通过的法案" />
      </Stage></Scene>
      <Scene from={w2} to={w3}><Stage style={{ justifyContent: 'center', alignItems: 'center', gap: 10 }}>
        <Pop at={say(W, '专门堵')}><Tag color={C.down} size={36}>法案要堵的口子</Tag></Pop>
        <RouteGate nodes={[{ label: '英伟达芯片', sub: '受出口管制', at: say(W, '专门堵') + 0.3 }, { label: '海外数据中心', sub: '芯片合法出口到这里', at: say(W, '通过海外') }, { label: '远程调用算力', sub: '人不在当地也能用', at: say(W, '远程调用') }]} gateAfter={1} gateAt={say(W, '远程调用') + 1.3} gateLabel="远程调用也要管" />
      </Stage></Scene>
      <Scene from={w3} to={w4}><Stage style={{ justifyContent: 'center', alignItems: 'center' }}>
        <NearZero at={say(W, '已经接近零') - 0.8} label="英伟达披露 · 对特定海外数据中心的芯片销售收入" />
      </Stage></Scene>
      <Scene from={w4} to={seg(W).end}><Stage style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Stance at={w4} tightenAt={say(W, '这条线')} />
      </Stage></Scene>
      <ChapterCard no="03" title="在华盛顿" at={say(W, '第三件事') - 0.15} hold={1.6} />

      {/* 论点：两句强调字幕 */}
      <Scene from={seg(P).start} to={seg(P).end}><Stage style={{ justifyContent: 'center', alignItems: 'center', gap: 30 }}>
        <Pop at={say(P, '这不是') - 0.1} until={say(P, '这是一家') - 0.05} dy={0}><KineticLine seg={P} words={['这不是', '一个人的丑闻']} hot={['一个人的丑闻']} size={150} align="center" color={C.muted} /></Pop>
        <Pop at={say(P, '这是一家')} until={say(P, '从来没准备过') - 0.05} style={{ position: 'absolute', top: 400, textAlign: 'center' }}><Tag>英伟达市值</Tag><div style={{ fontSize: 200, fontWeight: 900, lineHeight: 1.05 }}>4 万亿<span style={{ fontSize: 70 }}> 美元</span></div><Src>CNBC · 11-12 收盘略高于此数</Src></Pop>
        <Pop at={say(P, '从来没准备过') - 0.05} dy={0} style={{ position: 'absolute', top: 380 }}><KineticLine seg={P} words={['从来没准备过', '没有他']} hot={['没有他']} size={160} align="center" color={C.warm} /></Pop>
      </Stage></Scene>

      {/* 市场：跌幅尺 → 两张目标价卡 */}
      <Scene from={seg(M).start} to={m2}><Stage style={{ paddingTop: 200, gap: 30 }}>
        <Pop at={say(M, '辞职当天') - 0.2} dy={0}><DropRuler max={35} width={1560} stops={[{ v: 14, at: say(M, '盘中跌') - 0.3, dur: 1.2 }, { v: 4.34, at: say(M, '收跌') - 0.2, dur: 1.1 }]} marks={[{ v: 14, at: say(M, '14%'), label: '盘中最低 −14%' }, { v: 30, at: say(M, '跌超三成'), label: '较 10 月高点 −30% 以上', color: C.down }]} /></Pop>
        <div style={{ display: 'flex', gap: 40, marginTop: 70 }}>
          <Pop at={say(M, '4.34%')}><Panel style={{ padding: '24px 34px' }}><Tag>辞职当天收盘</Tag><div style={{ fontSize: 90, fontWeight: 900, lineHeight: 1.1 }}>−4.34%</div><Src>CNBC · 11-12</Src></Panel></Pop>
          <Pop at={say(M, '市值约')}><Panel style={{ padding: '24px 34px' }}><Tag>市值</Tag><div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.25, whiteSpace: 'nowrap' }}>英伟达 约 4 万亿 <span style={{ color: C.down, opacity: prog(useT(), say(M, '低于苹果'), 0.3) }}>&lt; 苹果</span></div><Src>英伟达市值：CNBC · 11-12</Src></Panel></Pop>
        </div>
        <Note>幅度示意，非行情走势图。盘中跌幅：CNBC 等 · 11-12</Note>
      </Stage></Scene>
      <Scene from={m2} to={seg(M).end}><Stage style={{ flexDirection: 'row', gap: 40, alignItems: 'center', justifyContent: 'center', padding: '150px 90px 190px' }}>
        <TargetCard firm="高盛" from={300} to={220} at={say(M, '高盛')} cutAt={say(M, '220') - 0.2} note="维持「买入」" src="富途转述高盛报告 · 11-12" />
        <TargetCard firm="伯恩斯坦" from={400} to={200} at={say(M, '伯恩斯坦')} cutAt={say(M, '200') - 0.2} note="评级下调至「与大盘持平」" src="Newsweek 等 · 11-12" />
      </Stage></Scene>

      {/* 业绩没坏 → 坏的是确定性 → 三个勾一个叉 */}
      <Scene from={seg(E).start} to={e2}><Stage style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Earnings at={say(E, '962') - 0.3} value={962} unit="亿美元" label="上季度营收" yoy={106} yoyAt={say(E, '106%') - 0.3} />
      </Stage></Scene>
      <Scene from={e2} to={seg(E).end}><Stage style={{ justifyContent: 'center', alignItems: 'center', gap: 60 }}>
        <KineticLine seg={E} words={['坏的不是数字', '是确定性']} hot={['是确定性']} size={120} align="center" color={C.down} />
        <CheckList items={[{ text: '芯片', at: say(E, '不缺芯片'), ok: true }, { text: '订单', at: say(E, '不缺订单'), ok: true }, { text: '客户', at: say(E, '不缺客户'), ok: true }, { text: '那个人', at: say(E, '它缺一个'), ok: false }]} />
      </Stage></Scene>

      {/* 判断 */}
      <Scene from={seg(J).start} to={seg(J).end}><Stage style={{ justifyContent: 'center', paddingLeft: 180, gap: 30 }}>
        <Pop at={say(J, '我的判断是')}><Tag color={C.accent} size={36}>我的判断</Tag></Pop>
        <KineticLine seg={J} words={['他回不来']} size={230} hot={['他回不来']} color={C.text} />
        <Pop at={say(J, '但英伟达会')} style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 20 }}>
          <Chip style={{ fontSize: 44, opacity: 0.6 }}>黄仁勋的英伟达</Chip>
          <Pop at={say(J, '变成一家')} style={{ fontSize: 60, fontWeight: 900, color: C.accent }}>→</Pop>
          <Pop at={say(J, '更像公司')}><Chip color={C.accent} style={{ fontSize: 44 }}>一家公司</Chip></Pop>
        </Pop>
      </Stage></Scene>

      {/* 片尾 */}
      <Scene from={seg(O).start} to={seg(O).end + 1}><Stage style={{ justifyContent: 'center', alignItems: 'center' }}>
        <Outro at={say(O, '我是宁少')} name="宁少" tagline="每周用 AI 拆一条商业热点" followAt={say(O, '关注我')} note="本视频由 AI 自动生成 · 配音为本人录制 · 音乐 Lightless Dawn / Kevin MacLeod (CC BY 4.0)" />
      </Stage></Scene>
    </>
  );
};
