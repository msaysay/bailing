// 第一件事：在公司内网（开场 + 五段）。时间全部用 say(段名, 词) 从录音里取。
// 画面字只放口播里没有的信息（数字、名称、标签、来源）；关键句用 KineticLine 让字幕自己当主角。
import React from 'react';
import { useClock } from '../../kit/clock';
import { C, Chip, Note, Panel, Pop, Scene, Src, Stage } from '../../kit/kit';
import { ChapterCard, IndexList } from '../../components';
import { Bars, BurnDown, CalendarFlip, FlapYear, ForumPost, KineticLine, LowerThird, Nameplate, PaperDuel, PeopleGrid } from '../../components/rich';

const Tag: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.muted }) => <div style={{ fontSize: 30, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{children}</div>;

export const Part1: React.FC = () => {
  const { seg, say } = useClock();
  const A = '开场', B = '一·2022不裁', D = '一·1996', F = '一·鲜花', G = '一·内网', L = '一·律师';
  const tB5 = say(B, '那年硅谷'), tWhy = say(B, '为什么'), tQ = say(D, '后来他有句') - 0.2, tC = say(D, '一个自己裁过') - 0.2, tDuel = say(L, '员工在写') - 0.2;
  return (
    <>
      {/* 开场：日历从 12 日翻到 13 日 + 三件事目录 */}
      <Scene from={seg(A).start} to={seg(A).end}><Stage style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 80 }}>
        <Pop at={0.1} dy={40} style={{ transform: 'scale(1.25)', transformOrigin: 'left center', marginRight: 70 }}><CalendarFlip at={say(A, '辞职第二天')} a={{ top: '2026 年 11 月', day: '12', label: '黄仁勋辞职', color: C.down }} b={{ top: '2026 年 11 月', day: '13', label: '第二天', color: C.accent }} /></Pop>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 34 }}>
          <Pop at={say(A, '今天说说')}><Tag>辞职之后 · 三个现场</Tag></Pop>
          <IndexList vertical items={['公司内网', '没有二号位', '华盛顿']} ats={[say(A, '三件'), say(A, '三件') + 0.4, say(A, '三件') + 0.8]} />
        </div>
      </Stage></Scene>

      {/* 2022：年份翻回去 → 各家裁员条形 vs 英伟达一个没少 → 为什么 → 再翻到 1996 */}
      <Scene from={seg(B).start} to={tB5 - 0.1} hard><Stage style={{ alignItems: 'flex-start', justifyContent: 'center', paddingLeft: 200 }}>
        <Pop at={say(B, '要看懂它')} dy={0}><FlapYear from={2026} to={2022} at={say(B, '得退回')} size={230} /></Pop>
      </Stage></Scene>
      <Scene from={tB5 - 0.1} to={tWhy - 0.15}><Stage style={{ flexDirection: 'row', gap: 60, alignItems: 'flex-start', paddingTop: 200 }}>
        <Pop at={tB5} style={{ flex: 1.15 }}><Panel style={{ borderTop: `6px solid ${C.down}`, minHeight: 470 }}>
          <Tag>2022 年 · 科技公司宣布裁员</Tag>
          <div style={{ marginTop: 30 }}><Bars max={11000} width={420} rows={[
            { name: 'Meta', value: 11000, text: '11,000 人', at: tB5 + 0.25 },
            { name: '亚马逊', value: 10000, text: '约 10,000 人', at: tB5 + 0.75 },
            { name: '推特', value: 3700, text: '约 3,700 人', at: say(B, '几万人') }]} /></div>
          <Pop at={say(B, '几万人')}><Src>各公司公告与媒体报道 · 2022-11</Src></Pop>
        </Panel></Pop>
        <Pop at={say(B, '英伟达没裁')} style={{ flex: 1 }}><Panel style={{ borderTop: `6px solid ${C.accent}`, minHeight: 470 }}>
          <Tag>同一年 · 英伟达</Tag>
          <div style={{ display: 'flex', alignItems: 'center', gap: 36, marginTop: 26 }}>
            <PeopleGrid total={60} keep={60} cols={12} at={say(B, '英伟达没裁') + 0.2} mode="light" dot={22} dur={0.9} />
            <Pop at={say(B, '一个人都没裁')}><div style={{ fontSize: 150, fontWeight: 900, color: C.accent, lineHeight: 1 }}>0</div><Tag>人被裁</Tag></Pop>
          </div>
          <Pop at={say(B, '还照发')} style={{ marginTop: 22 }}><Chip style={{ fontSize: 30, padding: '10px 22px' }}>内部信：不裁员 · 加薪 · 照发股票</Chip></Pop>
          <Pop at={say(B, '还照发')}><Src>Tom's Hardware 等转述内部信 · 2022-08</Src></Pop>
        </Panel></Pop>
      </Stage></Scene>
      <Scene from={tWhy - 0.15} to={seg(B).end}><Stage style={{ alignItems: 'center', justifyContent: 'center', gap: 50 }}>
        <Pop at={tWhy - 0.1} until={say(B, '因为他记得') - 0.1} dy={0}><KineticLine seg={B} words={['为什么']} size={280} align="center" /></Pop>
        <Pop at={say(B, '因为他记得') - 0.1} dy={0} style={{ position: 'absolute', top: 400 }}><FlapYear from={2022} to={1996} at={say(B, '因为他记得')} dur={1.4} size={230} color={C.warm} /></Pop>
      </Stage></Scene>
      <ChapterCard no="01" title="在公司内网" at={say(B, '第一件事') - 0.15} hold={1.55} />

      {/* 1996：NV1 押错路线 → 100 人剩 40 人 → 现金只剩 30 格 */}
      <Scene from={seg(D).start} to={tQ}><Stage style={{ gap: 40, paddingTop: 170 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 50 }}>
          <FlapYear from={1996} to={1996} at={0} size={110} color={C.warm} />
          <Pop at={say(D, '第一款芯片')}><Panel style={{ padding: '22px 34px', display: 'flex', alignItems: 'center', gap: 30 }}>
            <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1 }}>NV1</div>
            <div><Tag>英伟达第一款芯片</Tag>
              <Pop at={say(D, '押错')} style={{ display: 'flex', gap: 14, marginTop: 10 }}><Chip style={{ fontSize: 28, padding: '8px 18px' }}>它用：二次曲面</Chip><Chip color={C.down} style={{ fontSize: 28, padding: '8px 18px' }}>行业选了：三角形</Chip></Pop>
            </div>
          </Panel></Pop>
          <Pop at={say(D, '上市就滞销')}><Chip color={C.down} style={{ fontSize: 44 }}>滞销</Chip></Pop>
        </div>
        <div style={{ display: 'flex', gap: 60, alignItems: 'flex-start' }}>
          <Pop at={say(D, '他裁掉了') - 0.3}><Panel>
            <Tag>员工</Tag>
            <div style={{ margin: '18px 0 14px' }}><PeopleGrid total={100} keep={40} cols={20} at={say(D, '他裁掉了')} mode="drop" dot={22} color={C.text} /></div>
            <div style={{ fontSize: 50, fontWeight: 900, whiteSpace: 'nowrap' }}>约 100 人 <span style={{ color: C.down }}>→ 约 40 人</span></div>
            <Src>维基百科、The Star：裁掉一半以上（口播说七成）</Src>
          </Panel></Pop>
          <Pop at={say(D, '账上的钱') - 0.2}><Panel>
            <Tag>账上现金还能撑</Tag>
            <div style={{ margin: '18px 0 14px' }}><BurnDown days={30} at={say(D, '账上的钱')} dur={say(D, '三十天') - say(D, '账上的钱') + 0.4} /></div>
            <div style={{ fontSize: 50, fontWeight: 900, color: C.down }}>30 天</div>
          </Panel></Pop>
        </div>
        <Note>NV1 技术路线：维基百科 RIVA 128、Nvidia 条目</Note>
      </Stage></Scene>
      {/* 口头禅：字幕自己当主角 */}
      <Scene from={tQ} to={tC}><Stage style={{ justifyContent: 'center', paddingLeft: 180 }}>
        <Pop at={say(D, '后来他有句')}><Tag color={C.accent}>黄仁勋 · 多年内部讲话的开场白</Tag></Pop>
        <div style={{ borderLeft: `8px solid ${C.accent}`, paddingLeft: 44, marginTop: 30 }}><KineticLine seg={D} words={['我们离破产', '只有三十天']} hot={['只有三十天']} size={140} color={C.warm} /></div>
        <Pop at={say(D, '只有三十天') + 0.4}><Src style={{ marginTop: 30 }}>维基百科 Nvidia 条目</Src></Pop>
      </Stage></Scene>
      {/* 两个年份的他：一边裁，一边不裁 */}
      <Scene from={tC} to={seg(D).end}><Stage style={{ flexDirection: 'row', gap: 50, alignItems: 'center', justifyContent: 'flex-start' }}>
        <Pop at={say(D, '一个自己裁过')}><Panel style={{ borderTop: `6px solid ${C.down}` }}>
          <div style={{ fontSize: 96, fontWeight: 900, color: C.warm }}>1996</div><Tag>他自己裁员</Tag>
          <div style={{ marginTop: 24 }}><PeopleGrid total={50} keep={20} cols={10} at={say(D, '一个自己裁过') + 0.3} mode="drop" dot={36} color={C.text} dur={1} /></div>
        </Panel></Pop>
        <Pop at={say(D, '在别人裁员')} style={{ fontSize: 80, fontWeight: 900, color: C.muted }}>→</Pop>
        <Pop at={say(D, '在别人裁员')}><Panel style={{ borderTop: `6px solid ${C.accent}` }}>
          <div style={{ fontSize: 96, fontWeight: 900 }}>2022</div><Tag>别人都在裁 · 他不裁</Tag>
          <div style={{ marginTop: 24 }}><PeopleGrid total={50} keep={50} cols={10} at={say(D, '选择不裁')} mode="light" dot={36} dur={0.8} /></div>
        </Panel></Pop>
      </Stage></Scene>

      {/* 鲜花：只留画面，加新闻角标 */}
      <Scene from={seg(F).start} to={seg(F).end}>
        <LowerThird at={say(F, '圣克拉拉')} place="圣克拉拉 · 英伟达总部" meta="路透社现场画面 · 2026 年 11 月 12 日" />
      </Scene>

      {/* 内网：帖子评论数上涨 → 请愿 → 100 个点里亮 97 个 */}
      <Scene from={seg(G).start} to={seg(G).end}><Stage style={{ flexDirection: 'row', gap: 56, alignItems: 'flex-start', paddingTop: 180 }}>
        <div>
          <ForumPost at={say(G, '内网一个帖子')} to={1600} label="公司内网 · 员工帖子" countLabel="条评论" width={760} />
          <Pop at={say(G, '1600')}><Src>WIRED 报道，Quartz 等转述 · 11-12</Src></Pop>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 30, flex: 1 }}>
          <Pop at={say(G, '数百人')}><Panel style={{ padding: '26px 34px' }}>
            <Tag>请愿信</Tag>
            <div style={{ display: 'flex', gap: 16, marginTop: 14, flexWrap: 'wrap' }}>
              <Chip style={{ fontSize: 32, padding: '10px 22px' }}>数百人签名</Chip>
              <Pop at={say(G, '要他回来')}><Chip color={C.accent} style={{ fontSize: 32, padding: '10px 22px' }}>诉求一：让他回来</Chip></Pop>
              <Pop at={say(G, '还要求董事会')}><Chip color={C.down} style={{ fontSize: 32, padding: '10px 22px' }}>诉求二：董事会成员辞职</Chip></Pop>
            </div>
          </Panel></Pop>
          <Pop at={say(G, '一项员工')}><Panel style={{ padding: '26px 34px', display: 'flex', gap: 34, alignItems: 'center' }}>
            <PeopleGrid total={100} keep={97} cols={20} at={say(G, '97')} mode="light" dot={18} dur={1.1} />
            <div><div style={{ fontSize: 110, fontWeight: 900, lineHeight: 1 }}>97<span style={{ fontSize: 50 }}>%</span></div><Tag>员工自发投票 · 要他留任</Tag></div>
          </Panel></Pop>
        </div>
      </Stage></Scene>

      {/* 董事会：名牌 → 两份文件对撞 */}
      <Scene from={seg(L).start} to={tDuel}><Stage style={{ paddingTop: 200, gap: 40 }}>
        <Pop at={seg(L).start + 0.2}><Tag color={C.accent}>同一时间 · 董事会</Tag></Pop>
        <Pop at={say(L, '是请律师') - 0.1}><Panel style={{ display: 'inline-flex', gap: 24, alignItems: 'center', padding: '22px 34px', alignSelf: 'flex-start' }}>
          <div style={{ fontSize: 56, fontWeight: 900 }}>独立调查</div><Tag>11 月 8 日启动 · 由独立董事主导</Tag>
        </Panel></Pop>
        <div style={{ display: 'flex', gap: 50, marginTop: 10 }}>
          <Nameplate at={say(L, 'Wachtell')} title="WACHTELL LIPTON" sub="受聘律师事务所" />
          <Nameplate at={say(L, '前联邦检察官')} title="前联邦检察官" sub="受聘主持调查" />
        </div>
        <Note>独立调查：董事会 11-08 声明</Note>
      </Stage></Scene>
      <Scene from={tDuel} to={seg(L).end}><Stage style={{ justifyContent: 'center' }}>
        <PaperDuel left={{ title: '请愿信', who: '员工', at: say(L, '员工在写') }} right={{ title: '法律意见书', who: '董事会', at: say(L, '董事会在写'), stamp: '保密' }} />
      </Stage></Scene>
    </>
  );
};
