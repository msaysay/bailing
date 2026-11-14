// 口播测试 01：用户自己的竖屏口播（讲「第一件事：公司内网」），按小 Lin 的五种版式排。
// A 全屏无叠加 · B 全屏+组件 · C 小圆头像+素材 · D 人物卡片+内容 · E 整屏标题。数字和标签沿用 ep02 已核对过的那一套。
import React from 'react';
import { AbsoluteFill, Audio, Sequence, staticFile } from 'remotion';
import { ClockCtx, makeClock, Timing } from '../../kit/clock';
import { C, Chip, Pop, Scene, Src, useFonts } from '../../kit/kit';
import { Beat, Lower, Plate, TalkClip, TalkStage, TalkSubs, TalkTitle, TW, UPPER } from '../../kit/talk';
import { Bars, BurnDown, FlapYear, ForumPost, PaperDuel, PeopleGrid } from '../../components/rich';
import { Ring } from '../../components';
import { HookTitle } from '../../components/talk';
import timing from './timing.json';
import cutsFile from './cuts.json';

export const talkClock = makeClock(timing as Timing);
const { say, seg, ln } = talkClock, cut = cutsFile.cuts;
const FACE = { x: 516, y: 625, w: 435 };   // 量自剪好的人物视频（1080×1620）
const Tag: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ children, color = C.muted, size = 32 }) => <div style={{ fontSize: size, fontWeight: 600, color, whiteSpace: 'nowrap' }}>{children}</div>;

const tLay = say('2022', '那年啊'), tNo = say('2022', '英伟达没裁'), tWhy = say('2022', '为什么呢'), tBack = say('2022', '因为他还记得');
const tChip = say('1996', '那年他的第一款'), tCutP = say('1996', '他不得已'), tCash = say('1996', '账上的钱'), tQuote = say('1996', '后来他有句');
const tFlower = say('鲜花', '所以现在'), tPost = say('内网', '内网有个帖子'), tVote = say('内网', '内网的一个帖子'), tLaw = say('律师', '董事会说呀');
// 人物的版式和景别。剪口（cut[0..3]）都落在硬切上。
const beats: Beat[] = [
  { at: 0, mode: 'full', zoom: 1 },
  { at: say('开场', '英伟达裁员') - 0.06, mode: 'full', zoom: 1.14, dur: 0 },
  { at: cut[0], mode: 'full', zoom: 1, dur: 0 },                                   // 剪口 1：被标题页盖住
  { at: tLay - 0.3, mode: 'bubble' },                                               // C：裁员潮画面
  { at: tNo - 0.3, mode: 'full', zoom: 1.08 },                                      // B：0 人被裁
  { at: tWhy - 0.05, mode: 'full', zoom: 1.28, dur: 0 },                            // A：为什么呢（推近）
  { at: tBack - 0.05, mode: 'full', zoom: 1.04, dur: 0 },                           // B：翻到 1996
  { at: tChip - 0.3, mode: 'bubble' },                                              // C：芯片画面
  { at: tCutP - 0.35, mode: 'card', box: [40, 330, 420, 600] },                     // D：人和人数格并排
  { at: tQuote - 0.35, mode: 'full', zoom: 1.1 },                                   // B：口头禅
  { at: cut[1], mode: 'full', zoom: 1, dur: 0 },                                    // 剪口 2 → A
  { at: say('记情', '在别人裁员') - 0.05, mode: 'full', zoom: 1.2, dur: 0 },
  { at: tFlower - 0.3, mode: 'bubble' },                                            // C：鲜花
  { at: tVote - 0.35, mode: 'full', zoom: 1 },                                      // B：97%
  { at: cut[2], mode: 'full', zoom: 1.12, dur: 0 },                                 // 剪口 3
  { at: cut[3], mode: 'full', zoom: 1.26, dur: 0 },                                 // 剪口 4 → A：挺操蛋的
  { at: tLaw - 0.35, mode: 'card', box: [330, 330, 420, 600] },                     // D：人在上，两份文件在下
];
const hot = ['第二天', '2022', '1996', '几万人', '一个人都没裁', '七成人', '三成', '三十天', '鲜花', '白蜡烛', '1600', '数百人', '97%', '律师'];
const sfx: [number, string, number][] = [[cut[0], 'whoosh.wav', 0.5], [say('2022', '还得再倒回') + 0.3, 'tick.wav', 0.35], [tBack, 'tick.wav', 0.35], [say('1996', '上市就滞销'), 'thud.wav', 0.45], [say('内网', '97%'), 'thud.wav', 0.4]];

export const TALK01: React.FC = () => {
  useFonts();
  return (
    <ClockCtx.Provider value={talkClock}>
      <TalkStage src="talk01/person.mp4" face={FACE} beats={beats} under={<>
        <TalkClip src="ep02/footage/p1-jobcuts.mp4" at={tLay - 0.25} until={tNo - 0.3} credit="画面：CNBC" />
        <TalkClip src="ep02/footage/p1-chip.mp4" at={tChip - 0.25} until={tCutP - 0.3} />
        <TalkClip src="ep02/footage/p1-flowers.mp4" at={tFlower - 0.25} until={tPost - 0.25} credit="画面：路透社 · 2026-11-12" />
      </>}>
        {/* B 开场：钩子标题压在胸口 */}
        <div style={{ position: 'absolute', left: 80, top: 1120 }}><HookTitle size={92} lines={['黄仁勋辞职', '第二天']} at={0.25} until={say('开场', '英伟达裁员') - 0.2} /></div>

        {/* B：年份翻回 2022 */}
        <Scene from={say('2022', '还得再倒回') - 0.3} to={tLay - 0.35}><Lower><Plate style={{ padding: '14px 50px' }}><FlapYear from={2026} to={2022} at={say('2022', '还得再倒回') + 0.25} size={170} /></Plate></Lower></Scene>

        {/* C：裁员潮画面在上，各家裁员人数在下 */}
        <Scene from={tLay - 0.1} to={tNo - 0.35}><Lower style={{ top: 1100 }}><Plate style={{ width: 900, boxSizing: 'border-box', borderTop: `6px solid ${C.down}` }}>
          <Tag>2022 年 · 科技公司宣布裁员</Tag>
          <div style={{ marginTop: 22 }}><Bars max={11000} width={520} rows={[{ name: 'Meta', value: 11000, text: '11,000 人', at: tLay + 0.3 }, { name: '亚马逊', value: 10000, text: '约 10,000 人', at: tLay + 0.9 }, { name: '推特', value: 3700, text: '约 3,700 人', at: say('2022', '几万人') }]} /></div>
          <Pop at={say('2022', '几万人')}><Src>各公司公告与媒体报道 · 2022-11</Src></Pop>
        </Plate></Lower></Scene>

        {/* B：英伟达 0 人被裁 */}
        <Scene from={tNo - 0.1} to={tWhy - 0.1} hard><Lower><Plate style={{ display: 'flex', alignItems: 'center', gap: 40, borderTop: `6px solid ${C.accent}` }}>
          <Pop at={say('2022', '一个人都没裁')} dy={0}><div style={{ fontSize: 230, fontWeight: 900, color: C.accent, lineHeight: 0.9 }}>0</div></Pop>
          <div><Tag>同一年 · 英伟达</Tag><div style={{ fontSize: 70, fontWeight: 900, color: C.text, lineHeight: 1.2 }}>人被裁</div>
            <Pop at={say('2022', '而且还发股票')} style={{ marginTop: 14 }}><Chip style={{ fontSize: 30, padding: '8px 20px' }}>不裁员 · 加薪 · 照发股票</Chip></Pop></div>
        </Plate><Pop at={say('2022', '而且还发股票')}><Src>Tom's Hardware 等转述内部信 · 2022-08</Src></Pop></Lower></Scene>

        {/* B：年份翻到 1996 */}
        <Scene from={tBack - 0.05} to={tChip - 0.35} hard><Lower><Plate style={{ padding: '14px 50px' }}><FlapYear from={2022} to={1996} at={tBack + 0.2} dur={1.3} size={170} color={C.warm} /></Plate></Lower></Scene>

        {/* C：芯片画面在上，NV1 在下 */}
        <Scene from={tChip - 0.1} to={tCutP - 0.35}><Lower style={{ top: 1100 }}><Plate style={{ display: 'flex', alignItems: 'center', gap: 34 }}>
          <div style={{ fontSize: 130, fontWeight: 900, color: C.text, lineHeight: 1 }}>NV1</div>
          <div><Tag>英伟达第一款芯片</Tag><Pop at={say('1996', '押错')} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}><Chip style={{ fontSize: 30, padding: '8px 18px' }}>它用：二次曲面</Chip><Chip color={C.down} style={{ fontSize: 30, padding: '8px 18px' }}>行业选了：三角形</Chip></Pop></div>
        </Plate><Pop at={say('1996', '上市就滞销')} dy={0}><div style={{ fontSize: 76, fontWeight: 900, color: C.down, border: `8px solid ${C.down}`, borderRadius: 18, padding: '0 40px', transform: 'rotate(-6deg)', marginTop: 10 }}>滞销</div></Pop></Lower></Scene>

        {/* D：人在左上，人数格在右上，现金格在下 */}
        <Scene from={tCutP - 0.1} to={tQuote - 0.4}>
          <div style={{ position: 'absolute', left: 500, top: 330, width: 540, height: 600 }}><Pop at={tCutP - 0.05}><Plate style={{ padding: '26px 30px', height: 600, boxSizing: 'border-box' }}>
            <Tag>员工</Tag>
            <div style={{ margin: '14px 0 14px' }}><PeopleGrid total={100} keep={40} cols={10} at={tCutP + 0.2} mode="drop" dot={22} color={C.text} /></div>
            <div style={{ fontSize: 44, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>约 100 人 <span style={{ color: C.down }}>→ 约 40 人</span></div>
            <div style={{ fontSize: 22, color: C.muted, marginTop: 8, lineHeight: 1.4 }}>维基百科、The Star：裁掉一半以上<br />（口播说七成）</div>
          </Plate></Pop></div>
          <Lower style={{ top: 1100 }}><Pop at={tCash - 0.2}><Plate style={{ width: 960, boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><Tag>账上现金还能撑</Tag><div style={{ fontSize: 76, fontWeight: 900, color: C.down, lineHeight: 1 }}>30 天</div></div>
            <div style={{ marginTop: 18 }}><BurnDown days={30} at={tCash} dur={say('1996', '三十天') - tCash + 0.5} cell={52} /></div>
          </Plate></Pop></Lower>
        </Scene>

        {/* B：口头禅，给英文原话（口播里没有的信息） */}
        <Scene from={tQuote - 0.05} to={cut[1] - 0.1}><Lower><Pop at={tQuote}><Plate style={{ width: 920, boxSizing: 'border-box', borderLeft: `10px solid ${C.warm}` }}>
          <Tag color={C.warm}>黄仁勋 · 多年内部讲话的开场白</Tag>
          <div style={{ fontSize: 50, fontWeight: 900, color: C.text, lineHeight: 1.35, marginTop: 12 }}>“Our company is thirty days from going out of business.”</div>
          <Src>维基百科 Nvidia 条目</Src>
        </Plate></Pop></Lower></Scene>

        {/* C：鲜花画面，只加地点 */}
        <Scene from={tFlower} to={tPost - 0.3}><Lower style={{ top: 1110 }}><Pop at={say('鲜花', '所以现在') + 0.6}><Plate style={{ padding: '18px 44px' }}><div style={{ fontSize: 50, fontWeight: 900, color: C.text }}>圣克拉拉 · 英伟达总部</div></Plate></Pop></Lower></Scene>

        {/* C：内网帖子在上（小圆头像留在右上），两个数字在下 */}
        <Scene from={tPost - 0.15} to={tVote - 0.4}>
          <div style={{ position: 'absolute', left: 60, top: UPPER.top + 20, width: 960, transform: 'scale(1.18)', transformOrigin: 'left top' }}><ForumPost at={tPost} to={1600} label="公司内网 · 员工帖子" countLabel="条评论" width={812} /></div>
          <Lower style={{ top: 1100, flexDirection: 'row', justifyContent: 'center', alignItems: 'stretch', gap: 26 }}>
            <Pop at={say('内网', '1600')}><Plate style={{ width: 430, boxSizing: 'border-box' }}><div style={{ fontSize: 110, fontWeight: 900, color: C.text, lineHeight: 1.05 }}>1600<span style={{ fontSize: 60 }}>+</span></div><Tag>条评论</Tag><Src>WIRED 报道 · 11-12</Src></Plate></Pop>
            <Pop at={say('内网', '数百人')}><Plate style={{ width: 470, boxSizing: 'border-box' }}><div style={{ fontSize: 90, fontWeight: 900, color: C.text, lineHeight: 1.25 }}>数百人</div><Tag>签了请愿信</Tag>
              <Pop at={say('内网', '还要求董事会')} style={{ marginTop: 14 }}><Chip color={C.down} style={{ fontSize: 28, padding: '8px 18px' }}>要求董事会成员辞职</Chip></Pop></Plate></Pop>
          </Lower>
        </Scene>

        {/* B：97% */}
        <Scene from={tVote - 0.05} to={cut[3] - 0.05}><Lower><Pop at={say('内网', '一个员工自发投票')}><Plate style={{ display: 'flex', alignItems: 'center', gap: 44, padding: '26px 50px' }}>
          <Ring pct={97} at={say('内网', '97%') - 0.2} label="" size={270} />
          <div><Tag>员工自发投票</Tag><div style={{ fontSize: 76, fontWeight: 900, color: C.text, lineHeight: 1.25 }}>要他留任</div></div>
        </Plate></Pop></Lower></Scene>

        {/* D：人在上，请愿信对律师在下 */}
        <Scene from={tLaw - 0.1} to={seg('律师').end + 1}><div style={{ position: 'absolute', left: TW / 2, top: 1090, transform: 'translateX(-50%) scale(.66)', transformOrigin: 'center top' }}><PaperDuel left={{ title: '请愿信', who: '员工', at: tLaw }} right={{ title: '法律意见书', who: '董事会', at: say('律师', '我请律师') - 0.1, stamp: '保密' }} /></div></Scene>

        {/* E：章节标题页，盖住剪口 1 */}
        <TalkTitle no="01" title="公司内网" at={cut[0] - 0.05} hold={say('2022', '但是咱们') - cut[0] - 0.2} />
        <TalkSubs hot={hot} hide={[ln('2022', '第一件事儿呢')]} />
      </TalkStage>
      <Audio src={staticFile('talk01/voice.wav')} />
      {sfx.map(([t, f, v], i) => <Sequence key={i} from={Math.round(t * talkClock.fps)} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
    </ClockCtx.Provider>
  );
};
