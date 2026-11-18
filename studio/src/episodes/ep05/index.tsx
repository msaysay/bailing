// 05 一句话做视频：这条片子讲这套工具本身。用简化后的流程做（video-start → make-news），骨架来自 templates/news.tsx。
// 画面原则：屏幕上的字只放口播里没有的信息（英文标签、尺寸、出处、数字），口播原句用字幕。
import React from 'react';
import { AbsoluteFill, Audio, Img, Sequence, staticFile } from 'remotion';
import { ClockCtx, inOut, makeClock, mix, prog, Timing, useClock } from '../../kit/clock';
import { C, FONT, Scene, useFonts, useT } from '../../kit/kit';
import { spring } from '../../kit/motion';
import { BC, BiTag, BroadcastFrame, HalftoneBg, MONO, NotEqual, ScrambleText, Thin } from '../../components/bc';
import { GlitchText } from '../../components/fx';
import { PhosphorTerminal, TermLine } from '../../components/bc-data';
import { RadarWatch } from '../../components/bc-diagram';
import { CardWallFly } from '../../components/fx2';
import { AttemptLoop } from '../../components/series';
import { SlamWords, Typewriter } from '../../components/type';
import { FlowSteps } from '../../components/flow';
import { PetHud, PetSprite } from '../../components/pet';
import timing from './timing.json';

const SLUG = 'ep05';
export const clock = makeClock(timing as Timing);
const { say, seg, ln } = clock;
const W = 1920, H = 1080;
const chapters = [{ no: '01', title: 'ONE SENTENCE', from: '开场' }, { no: '02', title: 'TWO LINES', from: '分流' }, { no: '03', title: 'SCRIPT & VOICE', from: '稿子' }, { no: '04', title: '254 COMPONENTS', from: '画面' }, { no: '05', title: 'SELF CHECK', from: '自查' }, { no: '06', title: 'THE PET', from: '宠物' }, { no: '07', title: 'YOUR TURN', from: '结尾' }];
const hot = ['AI', '一句话', '出处', '二百五十四', '挡住人脸', '小海豹', '评论区', '一个文件夹'];
const hide = [ln('开场', '帮我做条酷'), ln('结尾', '我想做一条视频')];   // 这两句由画面上的打字承担
const T = { a: say('开场', '这条视频'), slam: say('开场', '从写稿'), ai: say('开场', '全是'), one: say('开场', '我只说了'), ask: say('开场', '帮我做条') };
const sfx: [number, string, number][] = [
  [say('开场', '写稿'), 'tick.wav', .4], [say('开场', '配音'), 'tick.wav', .4], [say('开场', '找画面'), 'tick.wav', .4], [say('开场', '剪辑'), 'tick.wav', .4], [say('开场', '特效'), 'tick.wav', .4], [T.ai, 'thud.wav', .55],
  ...['分流', '稿子', '画面', '自查', '宠物', '结尾'].map((s) => [seg(s).start, 'whoosh.wav', .45] as [number, string, number]),
  [say('画面', '规矩'), 'thud.wav', .5], [say('宠物', '是频道'), 'whoosh.wav', .5], [say('结尾', '它就带着'), 'thud.wav', .45],
];

/** 底部字幕：横屏广播风，一行一句。 */
const Subs: React.FC = () => {
  const t = useT(), { lines } = useClock(), l = lines.find((x) => t >= x.start - .04 && t < x.end + .2);
  if (!l || hide.includes(l.n)) return null;
  const re = new RegExp('(' + hot.join('|') + ')');
  return <div style={{ position: 'absolute', left: 300, right: 300, bottom: 70, textAlign: 'center' }}><span style={{ display: 'inline-block', background: 'rgba(8,10,14,.78)', borderLeft: `6px solid ${BC.lime}`, padding: '10px 28px', fontFamily: FONT, fontSize: 46, fontWeight: 600, color: '#fff' }}>{l.text.split(re).map((x, i) => <span key={i} style={hot.includes(x) ? { color: BC.lime, fontWeight: 900 } : undefined}>{x}</span>)}</span></div>;
};
/** 聊天输入框里打出一句话。 */
const Prompt: React.FC<{ text: string; at: number; label?: string }> = ({ text, at, label = 'YOU →' }) => {
  const t = useT(), p = Math.max(0, spring(t - at + .3, { from: 0, to: 1, stiffness: 180, damping: 15 }));
  return <div style={{ transform: `scale(${p})`, opacity: Math.min(1, p * 2) }}>
    <div style={{ fontFamily: MONO, fontSize: 24, color: BC.lime, letterSpacing: '.18em', marginBottom: 14 }}>{label}</div>
    <div style={{ width: 1150, background: '#11141B', border: `3px solid ${BC.lime}`, borderRadius: 26, padding: '34px 44px', boxShadow: `0 0 80px ${BC.lime}44` }}><Typewriter text={text} at={at} cps={9} size={78} color="#fff" width={1060} /></div>
  </div>;
};
/** 一张带标签的截图卡。 */
const Shot: React.FC<{ src: string; w: number; h: number; at: number; tag: string; spec: string; tilt: number }> = ({ src, w, h, at, tag, spec, tilt }) => {
  const t = useT(), p = Math.max(0, spring(t - at, { from: 0, to: 1, stiffness: 150, damping: 13 }));
  return <div style={{ transform: `translateY(${(1 - p) * 300}px) rotate(${tilt * p}deg)`, opacity: Math.min(1, p * 2) }}>
    <div style={{ width: w, height: h, background: '#fff', padding: 10, boxShadow: '0 40px 90px rgba(0,0,0,.45)' }}><Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} /></div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 22 }}><BiTag text={tag} at={at + .3} bg={BC.ink} color={BC.lime} size={34} rotate={0} /><span style={{ fontFamily: MONO, fontSize: 24, color: BC.ink }}>{spec}</span></div>
  </div>;
};
/** 一条会跳的声波。 */
const Wave: React.FC<{ at: number }> = ({ at }) => {
  const t = useT(), p = prog(t, at, .4);
  return <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 160, opacity: p }}>{Array.from({ length: 64 }).map((_, i) => { const v = .25 + .75 * Math.abs(Math.sin(i * .7 + t * 9) * Math.sin(i * .23 + t * 3.1)); return <div key={i} style={{ width: 10, height: 160 * v * p, borderRadius: 5, background: i % 9 === 0 ? '#fff' : BC.lime }} />; })}</div>;
};

const Scenes: React.FC = () => {
  const t = useT();
  const petIn = say('宠物', '右下角'), petFly = say('宠物', '是频道'), petGrow = say('宠物', '你们的互动'), petAI = say('宠物', '由 AI');
  const fly = inOut((t - petFly) / .7), sx = mix(W / 2 - 280, W - 330, fly), sy = mix(H / 2 - 330, H - 330, fly) - Math.sin(fly * Math.PI) * 220, ss = mix(560, 0, fly);
  return (
    <>
      {/* 01 开场：五个词砸进来 → ALL BY AI 故障字 → 一句话打出来 */}
      <Scene from={0} to={T.one - .1} hard><HalftoneBg theme="black" style={{ width: W, height: H }}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 40 }}>
          {t < T.ai - .05 && <SlamWords words={[{ text: '写稿' }, { text: '配音' }, { text: '找画面', color: BC.lime }, { text: '剪辑' }, { text: '特效', color: BC.lime }]} ats={[say('开场', '写稿'), say('开场', '配音'), say('开场', '找画面'), say('开场', '剪辑'), say('开场', '特效')]} size={130} width={1700} />}
          {t >= T.ai - .05 && <><GlitchText text="ALL BY AI" at={T.ai - .05} size={260} color={BC.lime} /><div style={{ fontFamily: MONO, fontSize: 28, color: '#fff', letterSpacing: '.3em', opacity: prog(t, T.ai + .4, .3) }}>SCRIPT · VOICE · FOOTAGE · EDIT · VFX</div></>}
        </AbsoluteFill>
      </HalftoneBg></Scene>
      <Scene from={T.one - .1} to={seg('开场').end} hard><HalftoneBg theme="black" style={{ width: W, height: H }}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', top: 170, opacity: prog(t, T.one, .3) }}><Thin size={150} color="#fff">1 SENTENCE</Thin></div>
          <div style={{ marginTop: 140 }}><Prompt text="帮我做条酷一点的视频" at={T.ask} /></div>
        </AbsoluteFill>
      </HalftoneBg></Scene>

      {/* 02 分流：两张真实截图 */}
      <Scene from={seg('分流').start} to={seg('分流').end}><HalftoneBg theme="paper" style={{ width: W, height: H }}>
        <div style={{ position: 'absolute', left: 120, top: 120, opacity: prog(t, seg('分流').start + .1, .3) }}><GlitchText text="ON CAMERA?" at={say('分流', '你出不出镜') - .2} size={110} color={BC.red} calm /></div>
        <div style={{ position: 'absolute', left: 140, top: 330 }}><Shot src="ep05/news.jpg" w={880} h={495} at={say('分流', '不出镜 就做')} tag="NO → 横屏解读片" spec="1920 × 1080" tilt={-2.5} /></div>
        <div style={{ position: 'absolute', left: 1260, top: 150 }}><Shot src="ep05/talk.jpg" w={420} h={747} at={say('分流', '出镜 就做竖屏')} tag="YES → 竖屏口播" spec="1080 × 1920" tilt={2.5} /></div>
      </HalftoneBg></Scene>

      {/* 03 稿子与配音：磷光终端查出处 → 声波 + AI VOICE */}
      <Scene from={seg('稿子').start} to={say('稿子', '配音也是') - .1}><AbsoluteFill style={{ background: '#030A03', alignItems: 'center', justifyContent: 'center' }}>
        <PhosphorTerminal title="FACT CHECK // 事实核对" right="SOURCES REQUIRED" at={seg('稿子').start} width={1700} height={760}>
          <TermLine prompt text="check --every-number script.txt" at={seg('稿子').start + .3} size={34} />
          <TermLine text="[FOUND]  数字 01 → 公司公告原文 · 链接已登记" at={say('稿子', '每个数字') + .1} size={34} />
          <TermLine text="[FOUND]  日期 02 → 两家媒体交叉核对" at={say('稿子', '每个数字') + .6} size={34} />
          <TermLine text="[FOUND]  引语 03 → 采访原话 · 带时间码" at={say('稿子', '每个数字') + 1.1} size={34} />
          <TermLine text="[NO SOURCE]  传闻 04 → 删除，不进稿子" at={say('稿子', '查不到') - .2} color={BC.red} strike={say('稿子', '不写')} size={34} />
        </PhosphorTerminal>
      </AbsoluteFill></Scene>
      <Scene from={say('稿子', '配音也是') - .1} to={seg('稿子').end}><HalftoneBg theme="black" style={{ width: W, height: H }}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 50 }}>
          <Wave at={say('稿子', '配音也是')} />
          <BiTag text="AI VOICE · 本机离线合成" at={say('稿子', '你现在听到')} bg={BC.lime} color={BC.ink} size={56} />
          <div style={{ fontFamily: MONO, fontSize: 26, color: 'rgba(255,255,255,.6)', opacity: prog(t, say('稿子', '就是 AI'), .3) }}>KOKORO v1.1-ZH · VOICE #65 · APACHE-2.0</div>
        </AbsoluteFill>
      </HalftoneBg></Scene>

      {/* 04 画面：真实组件卡片墙飞过 → 254 → SCREEN ≠ VOICE */}
      <Scene from={seg('画面').start} to={say('画面', '规矩') - .1}><AbsoluteFill style={{ background: BC.black }}>
        <CardWallFly at={seg('画面').start} flyAt={seg('画面').start + 1.4} cols={10} rows={6} width={W} height={H} cards={Array.from({ length: 34 }).map((_, i) => <Img key={i} src={staticFile(`ep05/thumbs/${String(i).padStart(2, '0')}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />)} />
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: `radial-gradient(ellipse at 50% 50%, rgba(10,10,10,.75), transparent 60%)` }}>
          <ScrambleText text="254" at={say('画面', '二百五十四') - .2} dur={1}>{(s) => <Thin size={420} color={BC.lime} style={{ textShadow: `0 0 60px ${BC.lime}88`, transformOrigin: 'center' }}>{s}</Thin>}</ScrambleText>
          <div style={{ fontFamily: MONO, fontSize: 30, color: '#fff', marginTop: 40, background: 'rgba(0,0,0,.6)', padding: '6px 18px', letterSpacing: '.3em', opacity: prog(t, say('画面', '动效组件'), .3) }}>MOTION COMPONENTS · 22 GROUPS</div>
        </AbsoluteFill>
      </AbsoluteFill></Scene>
      <Scene from={say('画面', '规矩') - .1} to={seg('画面').end}><HalftoneBg theme="blue" style={{ width: W, height: H }}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}><NotEqual a="SCREEN" b="VOICE" at={say('画面', '屏幕上的字') - .1} size={210} sub="画面上只放你没听到的：出处、数字、对比" /></AbsoluteFill>
      </HalftoneBg></Scene>

      {/* 05 自查：雷达清单 → 打回循环 */}
      <Scene from={seg('自查').start} to={say('自查', '一项一项过') + .4}><HalftoneBg theme="black" style={{ width: W, height: H }}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <RadarWatch head="QC // 出片前自查" at={seg('自查').start} width={1600} items={[{ title: 'BLACK FRAMES', zh: '黑场检测' }, { title: 'FLASH FRAMES', zh: '闪帧检测' }, { title: 'LOUDNESS −16 LUFS', zh: '响度对齐平台标准' }, { title: 'FACES CLEAR', zh: '组件不压人脸' }]} ats={[say('自查', '有没有黑'), say('自查', '有没有闪'), say('自查', '声音大不大'), say('自查', '挡住人脸')]} />
        </AbsoluteFill>
      </HalftoneBg></Scene>
      <Scene from={say('自查', '一项一项过') + .4} to={seg('自查').end}><HalftoneBg theme="black" style={{ width: W, height: H }}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
          <AttemptLoop width={1600} steps={[{ label: '出片', note: '整片渲染', kind: 'try', at: say('自查', '不过关') - .3 }, { label: '不过关', note: '定位到第几秒', kind: 'fail', at: say('自查', '不过关') + .2 }, { label: '只改那一段', note: '分段重渲', kind: 'idea', at: say('自查', '自己改') - .1 }, { label: '通过', note: '才交给你', kind: 'ok', at: say('自查', '自己改') + .5 }]} />
        </AbsoluteFill>
      </HalftoneBg></Scene>

      {/* 06 宠物：大海豹 → 飞进右下角 → 经验 → 四条路线 */}
      <Scene from={seg('宠物').start} to={seg('宠物').end}><HalftoneBg theme="green" style={{ width: W, height: H }}>
        <div style={{ position: 'absolute', left: 120, top: 120, opacity: prog(t, petIn, .3) * (1 - prog(t, petGrow - .3, .3)) }}><div style={{ fontFamily: MONO, fontSize: 26, color: BC.lime, letterSpacing: '.2em' }}>CHANNEL PET · 频道宠物</div><Thin size={150} color="#fff">SEAL #001</Thin><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 38, color: '#fff', marginTop: 8 }}>名字：等你们起</div></div>
        {fly < 1 && <div style={{ position: 'absolute', left: sx, top: sy, width: ss, height: ss, opacity: t < petIn - .2 ? 0 : 1, transform: `scale(${Math.max(0, spring(t - petIn + .2, { from: 0, to: 1, stiffness: 160, damping: 12 }))})` }}><PetSprite form="young" size={ss || 1} /></div>}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 28, opacity: prog(t, petGrow, .4) }}>
          <div style={{ display: 'flex', gap: 34 }}>{['❤ 点赞', '💬 评论', '↗ 转发', '⭐ 收藏'].map((x, i) => { const k = Math.max(0, spring(t - petGrow - i * .25, { from: 0, to: 1, stiffness: 260, damping: 13 })); return <div key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, color: BC.ink, background: '#fff', borderRadius: 50, padding: '14px 34px', transform: `scale(${k})` }}>{x}</div>; })}</div>
          <div style={{ fontFamily: MONO, fontSize: 30, color: BC.lime, letterSpacing: '.2em', opacity: prog(t, petGrow + 1, .3) }}>→ XP → LEVEL UP</div>
          <div style={{ display: 'flex', gap: 26, marginTop: 40, opacity: prog(t, petAI - .2, .4) }}>{[['机芯', '#5BC8FF', '技术'], ['金羽', '#FFC94D', '赚钱'], ['焰心', '#FF7A45', '情绪'], ['星语', '#B9A2FF', '故事']].map(([n, c, k], i) => { const q = Math.max(0, spring(t - petAI - i * .18, { from: 0, to: 1, stiffness: 220, damping: 14 })); return <div key={i} style={{ width: 230, textAlign: 'center', background: 'rgba(0,0,0,.35)', border: `3px solid ${c}`, borderRadius: 22, padding: '20px 0', transform: `translateY(${(1 - q) * 60}px)`, opacity: q }}><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 52, color: c }}>{n}</div><div style={{ fontFamily: FONT, fontSize: 26, color: '#fff', opacity: .8 }}>评论偏{k}</div></div>; })}</div>
        </AbsoluteFill>
      </HalftoneBg></Scene>

      {/* 07 结尾：一个文件夹 → 输入一句话 → 五步 → 署名 */}
      <Scene from={seg('结尾').start} to={say('结尾', '它就带着') - .1}><HalftoneBg theme="black" style={{ width: W, height: H }}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 60 }}>
          {t < say('结尾', '说一句') - .1 ? <div style={{ textAlign: 'center', transform: `scale(${Math.max(0, spring(t - seg('结尾').start, { from: 0, to: 1, stiffness: 170, damping: 13 }))})` }}>
            <div style={{ position: 'relative', width: 420, height: 300, margin: '0 auto' }}><div style={{ position: 'absolute', left: 0, top: 0, width: 170, height: 60, background: BC.lime, borderRadius: '18px 18px 0 0' }} /><div style={{ position: 'absolute', left: 0, top: 40, width: 420, height: 260, background: BC.lime, borderRadius: 18, boxShadow: `0 0 90px ${BC.lime}55` }} /><div style={{ position: 'absolute', left: 0, right: 0, top: 130, textAlign: 'center', fontFamily: MONO, fontSize: 34, color: BC.ink, fontWeight: 700 }}>.zip</div></div>
            <div style={{ fontFamily: MONO, fontSize: 28, color: '#fff', marginTop: 30, letterSpacing: '.15em', opacity: prog(t, say('结尾', '交给'), .3) }}>SKILLS · SCRIPTS · 254 COMPONENTS · TEMPLATES</div>
          </div> : <Prompt text="我想做一条视频" at={say('结尾', '我想做一条视频') - .1} label="ANY AI AGENT →" />}
        </AbsoluteFill>
      </HalftoneBg></Scene>
      <Scene from={say('结尾', '它就带着') - .1} to={clock.total + 1}><HalftoneBg theme="lime" style={{ width: W, height: H }}>
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 60 }}>
          <FlowSteps width={1700} steps={[{ title: '稿子' }, { title: '声音' }, { title: '素材' }, { title: '做片' }, { title: '封面' }]} ats={[0, 1, 2, 3, 4].map((i) => say('结尾', '它就带着') + i * .22)} />
          <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 120, color: BC.ink, opacity: prog(t, say('结尾', '我是'), .3), transform: `scale(${mix(1.3, 1, prog(t, say('结尾', '我是'), .3))})` }}>宁少</div>
        </AbsoluteFill>
      </HalftoneBg></Scene>
    </>
  );
};

export const Episode: React.FC = () => {
  useFonts();
  const t = useT(), ch = chapters.filter((c) => t >= clock.seg(c.from).start).length;
  const petOn = say('宠物', '是频道') + .55, petGrow = say('宠物', '你们的互动');
  return (
    <ClockCtx.Provider value={clock}>
      <AbsoluteFill style={{ background: C.bg }}>
        <BroadcastFrame width={W} height={H} show="AI MADE" episode="一句话做视频" ticker="EP05" chapter={chapters[Math.max(0, ch - 1)].title} index={`${String(Math.max(1, ch)).padStart(2, '0')} / 07`} from={0} to={clock.total} color={t >= clock.seg('分流').start && t < clock.seg('稿子').start || t >= clock.say('结尾', '它就带着') - .1 ? BC.ink : BC.white}>
          <AbsoluteFill><Scenes /></AbsoluteFill>
        </BroadcastFrame>
        {t >= petOn && <div style={{ position: 'absolute', right: 30, bottom: 26 }}><PetHud name="？？？" form="young" stage="young" level={0} cur={0} next={100} at={petOn} gain={{ at: petGrow + .2, amount: 0, toCur: 60 }} events={[{ at: petGrow + .2, kind: 'react', form: 'young-happy', text: '长大中…' }, { at: petGrow + 2.2, kind: 'react', form: 'young' }]} size={200} /></div>}
        <Subs />
        <div style={{ position: 'absolute', left: 64, bottom: 30, fontFamily: FONT, fontSize: 20, color: 'rgba(255,255,255,.55)', textShadow: '0 1px 3px #000' }}>本视频由 AI 生成 · 配音为 AI 合成 · 音乐 Lightless Dawn – Kevin MacLeod（CC BY 4.0）</div>
        {sfx.map(([tt, f, v], i) => <Sequence key={i} from={Math.round(tt * clock.fps)} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
        <Audio src={staticFile(`${SLUG}/voice.wav`)} />
        <Audio src={staticFile(`${SLUG}/bgm.mp3`)} volume={(f) => .22 * Math.min(1, f / 30) * Math.min(1, Math.max(0, (clock.total * clock.fps - f) / 45))} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
