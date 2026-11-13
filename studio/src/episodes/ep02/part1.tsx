// 第一件事：在公司内网（开场 + 五段）。时间全部用 say(段名, 词) 从录音里取。
import React from 'react';
import { useClock } from '../../kit/clock';
import { C, Chip, H1, Note, Panel, Pop, Scene, Src, Stage } from '../../kit/kit';
import { BigNumber, ChapterCard, DocPair, IndexList, Quote, Ring, Stat, Versus, YearDial } from '../../components';

export const Part1: React.FC = () => {
  const { seg, say } = useClock();
  const s = (n: string) => seg(n);
  const A = '开场', B = '一·2022不裁', D = '一·1996', F = '一·鲜花', G = '一·内网', L = '一·律师';
  return (
    <>
      {/* 开场：辞职第二天 + 三件事目录 */}
      <Scene from={s(A).start} to={s(A).end}><Stage style={{ justifyContent: 'center' }}>
        <Pop at={say(A, '英伟达')} style={{ fontSize: 44, color: C.muted }}>英伟达 · 黄仁勋</Pop>
        <Pop at={say(A, '辞职第二天')} style={{ fontSize: 170, fontWeight: 900, lineHeight: 1.15 }}>辞职<span style={{ color: C.accent }}>第二天</span></Pop>
        <div style={{ marginTop: 50 }}><IndexList items={['公司内网', '没有二号位', '华盛顿']} ats={[say(A, '三件'), say(A, '三件') + 0.45, say(A, '三件') + 0.9]} /></div>
      </Stage></Scene>

      {/* 2022：硅谷裁员，英伟达不裁 */}
      <Scene from={s(B).start} to={s(B).end} hard><Stage>
        <Pop at={say(B, '得退回') - 0.2} until={say(B, '那年硅谷') - 0.1} style={{ marginTop: 120, alignSelf: 'center' }}><YearDial from={2026} to={2022} at={say(B, '得退回')} /></Pop>
        <Pop at={say(B, '那年硅谷')} until={say(B, '为什么')} style={{ marginTop: -330 }}>
          <div style={{ fontSize: 44, fontWeight: 900, color: C.muted, marginBottom: 26 }}>2022 年</div>
          <Versus
            left={{ label: '硅谷科技公司', value: '裁员数万人', at: say(B, '那年硅谷'), valueAt: say(B, '几万人'), color: C.down, src: '具体人数：未取得' }}
            right={{ label: '英伟达', value: '0', at: say(B, '英伟达没裁'), valueAt: say(B, '一个人都没裁'), color: C.accent, size: 150, src: "Tom's Hardware 转述内部信 · 2022-08",
              extra: <Pop at={say(B, '还照发')} style={{ marginTop: 14 }}><Chip style={{ fontSize: 32, padding: '10px 22px' }}>不裁员 · 照发股票</Chip></Pop> }} />
        </Pop>
        <Pop at={say(B, '为什么')} style={{ position: 'absolute', left: 140, top: 330, fontSize: 150, fontWeight: 900 }}>为什么？</Pop>
        <Pop at={say(B, '因为他记得')} style={{ position: 'absolute', left: 140, top: 560, fontSize: 60, fontWeight: 600, color: C.muted }}>因为他记得 <span style={{ color: C.warm }}>1996</span></Pop>
      </Stage></Scene>
      <ChapterCard no="01" title="在公司内网" at={say(B, '第一件事') - 0.15} hold={1.55} />

      {/* 1996：押错路线、裁员、30 天 */}
      <Scene from={s(D).start} to={say(D, '后来他有句') - 0.2}><Stage>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 70 }}>
          <Pop at={s(D).start + 0.2}><div style={{ fontSize: 200, fontWeight: 900, lineHeight: 1, color: C.warm }}>1996</div></Pop>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18, paddingBottom: 14 }}>
            <Pop at={say(D, '第一款芯片')}><Chip>第一款芯片 NV1 · 押错技术路线</Chip></Pop>
            <Pop at={say(D, '上市就滞销')}><Chip color={C.down}>上市就滞销</Chip></Pop>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 60, marginTop: 50, alignItems: 'flex-start' }}>
          <Pop at={say(D, '他裁掉了')}><Panel>
            <div style={{ fontSize: 30, color: C.muted }}>裁员</div>
            <div style={{ fontSize: 96, fontWeight: 900, whiteSpace: 'nowrap' }}>约 100 人 <span style={{ color: C.down }}>→ 约 40 人</span></div>
            <Src>维基百科、The Star 等：裁掉一半以上（口播说七成）</Src>
          </Panel></Pop>
          <BigNumber to={30} unit="天" label="账上的钱只够再撑" at={say(D, '三十天')} color={C.down} size={200} />
        </div>
      </Stage></Scene>
      <Scene from={say(D, '后来他有句') - 0.2} to={say(D, '一个自己裁过') - 0.2}><Stage style={{ justifyContent: 'center' }}>
        <Quote parts={['我们离破产，', '只有三十天。']} ats={[say(D, '我们离破产'), say(D, '只有三十天')]} by="黄仁勋的口头禅" src="多年内部讲话的开场白，见维基百科 Nvidia 条目" />
      </Stage></Scene>
      <Scene from={say(D, '一个自己裁过') - 0.2} to={s(D).end}><Stage style={{ justifyContent: 'center', gap: 30 }}>
        <Pop at={say(D, '一个自己裁过')} style={{ fontSize: 64, fontWeight: 600, color: C.muted }}>一个自己裁过人的老板</Pop>
        <Pop at={say(D, '在别人裁员')} style={{ fontSize: 64, fontWeight: 600, color: C.muted }}>在别人裁员的时候</Pop>
        <Pop at={say(D, '选择不裁')} style={{ fontSize: 150, fontWeight: 900 }}>选择<span style={{ color: C.accent }}>不裁</span></Pop>
        <Pop at={say(D, '员工记')} style={{ fontSize: 56, fontWeight: 600, color: C.warm }}>员工记这个情</Pop>
      </Stage></Scene>

      {/* 鲜花与白蜡烛：只留画面 */}
      <Scene from={s(F).start} to={s(F).end}><Stage>
        <Pop at={say(F, '圣克拉拉')} style={{ position: 'absolute', left: 140, top: 150 }}><Chip style={{ fontSize: 32 }}>圣克拉拉 · 英伟达总部 · 11 月 12 日</Chip></Pop>
        <Note>来源 · 路透社现场视频（鲜花）；白蜡烛：未取得</Note>
      </Stage></Scene>

      {/* 内网：评论、请愿、投票 */}
      <Scene from={s(G).start} to={s(G).end}><Stage>
        <H1 at={s(G).start + 0.2}>公司内网</H1>
        <div style={{ display: 'flex', gap: 36, marginTop: 44, alignItems: 'stretch' }}>
          <Stat value="1600+" label="一个帖子下的评论" at={say(G, '1600')} src="WIRED 报道，多家转述 · 11-12" />
          <Stat value="数百人" label="签请愿信，要他回来" at={say(G, '数百人')} src="未取得" />
        </div>
        <div style={{ marginTop: 40 }}><Ring pct={97} at={say(G, '97')} label="自发投票的参与者要他留任" src="未取得" size={250} /></div>
        <Pop at={say(G, '还要求董事会')} style={{ position: 'absolute', right: 140, top: 250 }}><Chip color={C.down}>并要求董事会成员辞职</Chip></Pop>
      </Stage></Scene>

      {/* 董事会：请律师；请愿信 vs 法律意见书 */}
      <Scene from={s(L).start} to={say(L, '员工在写') - 0.2}><Stage>
        <Pop at={s(L).start + 0.2} style={{ fontSize: 44, color: C.muted }}>同一时间，董事会在做的是</Pop>
        <H1 at={say(L, '是请律师')} style={{ fontSize: 150 }}>请律师</H1>
        <div style={{ display: 'flex', gap: 28, marginTop: 40 }}>
          <Pop at={say(L, 'Wachtell')}><Chip color={C.accent}>Wachtell Lipton 律师事务所</Chip></Pop>
          <Pop at={say(L, '前联邦检察官')}><Chip color={C.accent}>一位前联邦检察官</Chip></Pop>
        </div>
        <Pop at={say(L, '主持调查')} style={{ fontSize: 44, fontWeight: 600, marginTop: 30 }}>受独立董事聘请，主持调查</Pop>
        <Note>来源 · 独立调查：英伟达董事会 11-08 声明；律所与检察官身份：未取得</Note>
      </Stage></Scene>
      <Scene from={say(L, '员工在写') - 0.2} to={s(L).end}><Stage style={{ justifyContent: 'center' }}>
        <DocPair left={{ title: '请愿信', who: '员工在写', at: say(L, '员工在写'), color: C.accent, tilt: -2 }} right={{ title: '法律意见书', who: '董事会在写', at: say(L, '董事会在写'), color: C.down, tilt: 2 }} />
      </Stage></Scene>
    </>
  );
};
