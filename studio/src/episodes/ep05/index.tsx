// 05 一句话做视频（v3，作品集级）：能做什么 → 效果库 → 怎么用（对话演示）→ 两件自己来的事 → 做片 → 怎么用好 → 结尾。
// 配音：Fish Audio（用户生成）。演示里的命令输出、稿子、检查图、成片片段都是这几天真实跑出来的东西。
// 设计系统：墨黑底 + 暖白字 + 荧光绿主色 + 珊瑚红副色；粗黑标题配瘦高等宽小字；全片同一套弹簧和错峰节奏；场景切换落在口播的词上。
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile } from 'remotion';
import { ClockCtx, inOut, makeClock, mix, prog, Timing, useClock } from '../../kit/clock';
import { FONT, Scene, useFonts, useT } from '../../kit/kit';
import { spring, noise } from '../../kit/motion';
import { BC, BiTag, BroadcastFrame, HalftoneBg, MONO, ScrambleText, Thin } from '../../components/bc';
import { CardWallFly } from '../../components/fx2';
import { GlitchText } from '../../components/fx';
import { SlamWords, Typewriter } from '../../components/type';
import { PetHud, PetSprite } from '../../components/pet';
import timing from './timing.json';

const SLUG = 'ep05';
export const clock = makeClock(timing as Timing);
const { say, seg, ln } = clock;
const W = 1920, H = 1080, FPS = 30;
const INK = '#07090D', PAPER = '#F3F1EA', LIME = BC.lime, CORAL = '#FF5A4E', DIM = 'rgba(243,241,234,.55)';
const sp = (t: number, at: number, k = 170, d = 14) => Math.max(0, spring(t - at, { from: 0, to: 1, stiffness: k, damping: d }));
const chapters = [{ title: 'ONE SENTENCE', from: '开场' }, { title: 'WHAT IT DOES', from: '能做什么' }, { title: '254 EFFECTS', from: '效果库' }, { title: 'HOW TO USE', from: '怎么用' }, { title: 'YOUR TWO JOBS', from: '两件事你自己来' }, { title: 'BUILD & CHECK', from: '做片' }, { title: 'USE IT WELL', from: '怎么用好' }, { title: 'YOUR TURN', from: '结尾' }];
const hot = ['AI', '三种', '横着的', '竖着的', '小海豹', '两百多种', '出不出镜', '出处', '声音', '自己念', 'Fish Audio', '画面', 'TikHub', '开头二十秒', '角度', '具体', '编号', '一句话'];
const hide = [ln('开场', '帮我做条'), ln('怎么用', '我想做一条视频'), ln('结尾', '我想做一条视频')];

// ---------- 通用小件 ----------
const Grain: React.FC = () => { const t = useT(); return <AbsoluteFill style={{ pointerEvents: 'none', opacity: .06, backgroundImage: 'radial-gradient(rgba(255,255,255,.9) 1px, transparent 1.2px)', backgroundSize: '3px 3px', backgroundPosition: `${(Math.floor(t * 24) * 7) % 3}px ${(Math.floor(t * 24) * 5) % 3}px`, mixBlendMode: 'overlay' }} />; };
const Clip: React.FC<{ src: string; at: number; rate?: number; style?: React.CSSProperties }> = ({ src, at, rate = 1, style }) => <Sequence from={Math.round(at * FPS)} layout="none"><OffthreadVideo src={staticFile(src)} muted playbackRate={rate} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }} /></Sequence>;
const Label: React.FC<{ children: React.ReactNode; color?: string; size?: number; style?: React.CSSProperties }> = ({ children, color = LIME, size = 22, style }) => <div style={{ fontFamily: MONO, fontSize: size, letterSpacing: '.22em', color, whiteSpace: 'nowrap', ...style }}>{children}</div>;
const Pop: React.FC<{ at: number; children: React.ReactNode; style?: React.CSSProperties; from?: 'up' | 'left' | 'right' | 'scale' }> = ({ at, children, style, from = 'up' }) => {
  const t = useT(), k = sp(t, at), tf = from === 'scale' ? `scale(${k})` : from === 'left' ? `translateX(${(1 - k) * -120}px)` : from === 'right' ? `translateX(${(1 - k) * 120}px)` : `translateY(${(1 - k) * 70}px)`;
  return <div style={{ opacity: Math.min(1, k * 2), transform: tf, ...style }}>{children}</div>;
};
const Chip: React.FC<{ at: number; text: string; color?: string; ink?: string }> = ({ at, text, color = LIME, ink = INK }) => <Pop at={at} from="scale"><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 30, color: ink, background: color, padding: '8px 22px', borderRadius: 50, whiteSpace: 'nowrap' }}>{text}</div></Pop>;
/** 一个输入框，里面打字。 */
const Prompt: React.FC<{ text: string; at: number; label?: string; w?: number; size?: number }> = ({ text, at, label = 'YOU', w = 1150, size = 74 }) => {
  const t = useT(), k = sp(t, at - .35, 180, 15);
  return <div style={{ transform: `scale(${k})`, opacity: Math.min(1, k * 2) }}>
    <Label style={{ marginBottom: 14 }}>{label} →</Label>
    <div style={{ width: w, background: '#11141B', border: `3px solid ${LIME}`, borderRadius: 26, padding: '30px 42px', boxShadow: `0 0 90px ${LIME}40` }}><Typewriter text={text} at={at} cps={10} size={size} color={PAPER} width={w - 90} /></div>
  </div>;
};
/** 卡片外框：带一行等宽标签。 */
const Frame: React.FC<{ w: number; h: number; tag: string; children: React.ReactNode; radius?: number }> = ({ w, h, tag, children, radius = 18 }) => <div><Label size={20} style={{ marginBottom: 12 }}>{tag}</Label><div style={{ width: w, height: h, borderRadius: radius, overflow: 'hidden', border: '2px solid rgba(255,255,255,.14)', boxShadow: '0 40px 100px rgba(0,0,0,.55)', background: '#000' }}>{children}</div></div>;

// ---------- 01 开场 ----------
const Opening: React.FC = () => {
  const t = useT(), ai = say('开场', '全是'), toc = say('开场', '它能做什么');
  return <>
    <Scene from={0} to={say('开场', '我只跟') - .05} hard><AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 30 }}>
      {t < say('开场', '稿子') - .05 ? <div style={{ textAlign: 'center' }}><Label color={CORAL} style={{ opacity: Math.floor(t * 2) % 2 ? .3 : 1 }}>● REC</Label><Thin size={200} color={PAPER} style={{ opacity: prog(t, 0, .25) }}>THIS VIDEO</Thin></div> : t < ai - .03 ? <SlamWords words={[{ text: '稿子' }, { text: '画面', color: LIME }, { text: '剪辑' }, { text: '特效', color: LIME }]} ats={[say('开场', '稿子'), say('开场', '画面'), say('开场', '剪辑'), say('开场', '特效')]} size={150} width={1500} />
        : <div style={{ transform: `translate(${(1 - Math.min(1, (t - ai) / .25)) * noise(t, { amplitude: 22, frequency: 30, seed: 2 })}px, 0)` }}><GlitchText text="ALL BY AI" at={ai - .03} size={270} color={LIME} /></div>}
      <Label color={DIM} style={{ opacity: prog(t, ai + .3, .3) }}>SCRIPT · FOOTAGE · EDIT · VFX · QC</Label>
    </AbsoluteFill></Scene>
    <Scene from={say('开场', '我只跟') - .05} to={toc - .1} hard><AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center' }}>
      <Pop at={say('开场', '一句话') - .2} style={{ position: 'absolute', top: 210 }}><Thin size={140} color={PAPER}>1 SENTENCE</Thin></Pop>
      <div style={{ marginTop: 160 }}><Prompt text="帮我做条酷一点的视频" at={say('开场', '帮我')} /></div>
    </AbsoluteFill></Scene>
    <Scene from={toc - .1} to={seg('开场').end} hard><AbsoluteFill style={{ background: INK, justifyContent: 'center', paddingLeft: 180 }}>
      {[['01', 'WHAT IT DOES', '它能做什么', say('开场', '它能做什么')], ['02', 'HOW TO USE', '怎么用', say('开场', '怎么用')], ['03', 'USE IT WELL', '怎么用得好', say('开场', '怎么用得')]].map(([n, en, zh, at], i) => { const k = sp(t, at as number); return <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 40, margin: '14px 0', opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * -140}px)` }}>
        <span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 150, lineHeight: 1, color: 'transparent', WebkitTextStroke: `3px ${LIME}` }}>{n}</span><span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 120, letterSpacing: '-.03em', color: PAPER, lineHeight: 1 }}>{en}</span><span style={{ fontFamily: FONT, fontSize: 36, color: DIM }}>{zh}</span></div>; })}
    </AbsoluteFill></Scene>
  </>;
};

// ---------- 02 能做什么：三张作品卡，镜头横移 ----------
const Formats: React.FC = () => {
  const t = useT(), s = seg('能做什么'), a1 = say('能做什么', '第一种'), a2 = say('能做什么', '第二种'), a3 = say('能做什么', '第三种');
  const stop = t < a2 - .3 ? 0 : t < a3 - .3 ? 1 : 2, from = [0, 1, 2], camX = [0, 1, 2].reduce((x, i) => (i === 0 ? 0 : mix(x, i, inOut((t - [a1, a2, a3][i] + .45) / .7))), 0);
  void stop; void from;
  const card = (i: number, node: React.ReactNode) => { const d = Math.abs(camX - i), k = 1 - Math.min(1, d); return <div style={{ position: 'absolute', left: W / 2 + (i - camX) * 1250, top: H / 2, transform: `translate(-50%, -52%) scale(${mix(.72, 1, k)}) rotateY(${(i - camX) * -18}deg)`, opacity: mix(.25, 1, k), filter: `blur(${(1 - k) * 4}px)` }}>{node}</div>; };
  return <Scene from={s.start} to={s.end}><AbsoluteFill style={{ background: `radial-gradient(1200px 800px at 50% 45%, #141A24, ${INK})`, perspective: 1800 }}>
    <Pop at={s.start + .05} style={{ position: 'absolute', left: 110, top: 60 }}><div style={{ display: 'flex', alignItems: 'baseline', gap: 26 }}><Thin size={120} color={LIME}>3</Thin><Label size={28} color={PAPER}>FORMATS · 三种成片</Label></div></Pop>
    {card(0, <div style={{ position: 'relative' }}><Frame w={1040} h={585} tag="01 · 横屏解读片 · 16:9 · 人不出镜"><Clip src="ep05/clip-news.mp4" at={s.start + .3} rate={.66} /></Frame>
      <div style={{ position: 'absolute', right: -40, top: 90, display: 'flex', flexDirection: 'column', gap: 14 }}><Chip at={say('能做什么', '写稿')} text="✎ 稿子" /><Chip at={say('能做什么', '找新闻')} text="▶ 新闻画面" /><Chip at={say('能做什么', '数字')} text="▮ 数字图表" color={PAPER} /></div></div>)}
    {card(1, <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 60 }}><div style={{ width: 380, height: 676, borderRadius: 48, padding: 14, background: '#1B1F27', boxShadow: '0 40px 100px rgba(0,0,0,.6)' }}><div style={{ width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden' }}><Clip src="ep05/clip-talk.mp4" at={a2 - .5} /></div></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}><Label size={20}>02 · 竖屏口播 · 9:16 · 人出镜</Label><Chip at={say('能做什么', '剪掉')} text="✂ 剪掉口误" color={CORAL} ink="#fff" /><Chip at={say('能做什么', '配上字幕')} text="字幕自动对齐" /><Chip at={say('能做什么', '画面就跟到哪')} text="画面跟着你走" color={PAPER} /></div></div>)}
    {card(2, <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>{(['egg3', 'hatch', 'young'] as const).map((f, i) => { const k = sp(t, a3 + .1 + i * .35, 200, 12); return <div key={f} style={{ textAlign: 'center', transform: `translateY(${(1 - k) * 80}px)`, opacity: Math.min(1, k * 2) }}><PetSprite form={f} size={[300, 330, 380][i]} /><Label size={18} color={DIM}>{['ICE EGG', 'HATCH', 'PUP'][i]}</Label></div>; })}<div style={{ marginLeft: 30, marginBottom: 60 }}><Label size={20}>03 · 频道宠物</Label><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 64, color: PAPER, lineHeight: 1.2, marginTop: 10 }}>互动越多<br />长得越大</div></div></div>)}
  </AbsoluteFill></Scene>;
};

// ---------- 03 效果库 ----------
const Library: React.FC = () => {
  const t = useT(), s = seg('效果库'), words = ['数字跳动', '图表生长', '网页滚动', '人物卡片'], pick = say('效果库', '它会按');
  return <>
    <Scene from={s.start} to={say('效果库', '数字跳动') - .1}><AbsoluteFill style={{ background: INK }}>
      <CardWallFly at={s.start} flyAt={s.start + 1} cols={10} rows={6} width={W} height={H} cards={Array.from({ length: 34 }).map((_, i) => <Img key={i} src={staticFile(`ep05/thumbs/${String(i).padStart(2, '0')}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />)} />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at 50% 50%, rgba(7,9,13,.82), transparent 62%)' }}>
        <ScrambleText text="254" at={say('效果库', '两百多种') - .3} dur={.9}>{(x) => <Thin size={440} color={LIME} style={{ textShadow: `0 0 70px ${LIME}88`, transformOrigin: 'center' }}>{x}</Thin>}</ScrambleText>
        <Label color={PAPER} size={28} style={{ marginTop: 30, background: 'rgba(0,0,0,.6)', padding: '6px 18px', opacity: prog(t, say('效果库', '效果的库'), .3) }}>MOTION COMPONENTS · 22 GROUPS</Label>
      </AbsoluteFill>
    </AbsoluteFill></Scene>
    <Scene from={say('效果库', '数字跳动') - .1} to={pick - .1} hard><AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 640px)', gap: 26, marginTop: -40 }}>{words.map((w, i) => { const at = say('效果库', w); return <Pop key={i} at={at - .15} from="scale"><Frame w={640} h={360} tag={`0${i + 1} · ${['COUNT', 'CHART', 'WEB', 'PEOPLE'][i]}`} radius={14}><Clip src={`ep05/fx${i}.mp4`} at={at - .15} /></Frame></Pop>; })}</div>
    </AbsoluteFill></Scene>
    <Scene from={pick - .1} to={s.end} hard><AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'relative', width: 1500, height: 850, overflow: 'hidden', borderRadius: 16, transform: `scale(${mix(1.25, 1, inOut((t - pick) / 1.4))})` }}><Img src={staticFile('ep05/overview.jpg')} style={{ width: '100%', display: 'block', opacity: .85 }} />
        {[[.14, .2], [.62, .44], [.38, .71], [.83, .16]].map(([x, y], i) => { const on = t >= pick + .25 + i * .5 && t < pick + .25 + (i + 1) * .5 + (i === 3 ? 9 : 0); return on ? <div key={i} style={{ position: 'absolute', left: `${x * 100}%`, top: `${y * 100}%`, width: 170, height: 100, border: `5px solid ${LIME}`, borderRadius: 10, boxShadow: `0 0 0 4000px rgba(7,9,13,.55), 0 0 40px ${LIME}` }} /> : null; })}
      </div>
      <Pop at={pick + .3} style={{ position: 'absolute', bottom: 190 }}><BiTag text="AUTO-PICK · 按内容自动挑" at={pick + .3} bg={LIME} color={INK} size={44} rotate={-2} /></Pop>
    </AbsoluteFill></Scene>
  </>;
};

// ---------- 04 怎么用：对话演示（真实输出）----------
const DOCTOR = ['✓ Node.js 22 以上', '✓ ffmpeg', '✓ Python 3.10 以上', '✓ 工程依赖', '✓ 语音识别模型', '✓ AI 配音模型', '✓ 人脸检测模型', '✓ MiSans 字体', '· TikHub 钥匙（可选）'];
const Bubble: React.FC<{ at: number; me?: boolean; children: React.ReactNode }> = ({ at, me, children }) => { const t = useT(), k = sp(t, at, 220, 16); if (t < at - .05) return null; return <div style={{ display: 'flex', justifyContent: me ? 'flex-end' : 'flex-start', margin: '12px 0', opacity: Math.min(1, k * 2), transform: `translateY(${(1 - k) * 30}px) scale(${mix(.9, 1, k)})`, transformOrigin: me ? 'right bottom' : 'left bottom' }}><div style={{ maxWidth: 560, background: me ? LIME : '#1C222C', color: me ? INK : PAPER, fontFamily: FONT, fontSize: 32, fontWeight: me ? 900 : 600, lineHeight: 1.45, padding: '14px 24px', borderRadius: me ? '24px 24px 6px 24px' : '24px 24px 24px 6px' }}>{children}</div></div>; };
const HowTo: React.FC = () => {
  const t = useT(), s = seg('怎么用'), drop = say('怎么用', '你把这个'), ask = say('怎么用', '它会先问'), chk = say('怎么用', '然后它自己'), wr = say('怎么用', '接着它写稿'), del = say('怎么用', '查不到'), ok = say('怎么用', '你说可以');
  const zip = inOut((t - drop - .3) / .9);
  return <Scene from={s.start} to={s.end}><AbsoluteFill style={{ background: `radial-gradient(1400px 900px at 30% 40%, #121822, ${INK})` }}>
    {/* 左：对话窗口 */}
    <div style={{ position: 'absolute', left: 110, top: 120, width: 700, height: 800, background: '#0E1218', border: '2px solid rgba(255,255,255,.12)', borderRadius: 26, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,.55)' }}>
      <div style={{ height: 58, display: 'flex', alignItems: 'center', gap: 10, padding: '0 22px', borderBottom: '1px solid rgba(255,255,255,.08)' }}>{[CORAL, '#FFC94D', LIME].map((c) => <i key={c} style={{ width: 14, height: 14, borderRadius: 7, background: c }} />)}<Label size={18} color={DIM} style={{ marginLeft: 14 }}>AI 助手 · 对话</Label></div>
      <div style={{ padding: '20px 26px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: 742, boxSizing: 'border-box' }}>
        <Bubble at={drop + 1} me>📁 视频工作流与组件库.zip</Bubble>
        <Bubble at={say('怎么用', '我想做一条')} me><Typewriter text="我想做一条视频" at={say('怎么用', '我想做一条')} cps={9} size={32} color={INK} width={420} /></Bubble>
        <Bubble at={ask}>好。先问你一个问题：</Bubble>
        <Bubble at={say('怎么用', '你自己出不出镜')}><b style={{ color: LIME }}>你自己出不出镜？</b></Bubble>
        <Bubble at={say('怎么用', '你自己出不出镜') + .9} me>不出镜</Bubble>
        <Bubble at={wr + .1}>稿子写好了，数字都附了出处，你看一下？</Bubble>
        <Bubble at={ok} me>可以</Bubble>
        <Bubble at={ok + .7}>好，下一步：声音。</Bubble>
      </div>
    </div>
    {/* 拖进来的文件夹 */}
    {t > drop && t < drop + 1.4 && <div style={{ position: 'absolute', left: mix(1500, 600, zip), top: mix(700, 760, zip) - Math.sin(zip * Math.PI) * 160, transform: `scale(${mix(1, .4, zip)})`, opacity: 1 - prog(t, drop + 1.2, .2) }}><div style={{ width: 170, height: 125, background: LIME, borderRadius: 14, boxShadow: `0 0 60px ${LIME}88` }} /></div>}
    {/* 右：终端（真实的环境检查输出）→ 稿子与事实核对 */}
    <Scene from={chk - .2} to={wr - .1}><div style={{ position: 'absolute', left: 880, top: 160, width: 920, background: '#030A03', border: `2px solid ${LIME}55`, borderRadius: 18, padding: '26px 34px', fontFamily: MONO, fontSize: 30, color: '#CFEFB6', boxShadow: `0 0 80px ${LIME}22` }}>
      <div style={{ color: LIME, marginBottom: 14 }}>$ 检查电脑上缺什么</div>
      {DOCTOR.map((d, i) => <div key={i} style={{ lineHeight: 1.65, opacity: t >= chk + .2 + i * .28 ? 1 : 0, color: d.startsWith('·') ? '#8FA58A' : undefined }}>{d}</div>)}
      <div style={{ color: LIME, marginTop: 10, opacity: t >= chk + .2 + DOCTOR.length * .28 ? 1 : 0 }}>全部就绪。</div>
    </div></Scene>
    <Scene from={wr - .1} to={s.end + .3}><div style={{ position: 'absolute', left: 880, top: 140 }}>
      <Pop at={wr} from="right"><div style={{ width: 920, background: PAPER, borderRadius: 18, padding: '28px 36px', color: INK, boxShadow: '0 40px 90px rgba(0,0,0,.5)' }}>
        <Label color="#6B7280" size={18}>SCRIPT.TXT · 稿子</Label>
        <div style={{ fontFamily: FONT, fontSize: 30, lineHeight: 1.6, marginTop: 10 }}>## 开场<br />一家公司账上的现金，<span style={{ background: '#FFE27A' }}>只够撑 30 天</span>……<br />## 第一件事<br />……</div>
      </div></Pop>
      <Pop at={say('怎么用', '每个数字') - .1} from="right" style={{ marginTop: 22 }}><div style={{ width: 920, background: '#0E1218', border: '2px solid rgba(255,255,255,.12)', borderRadius: 18, padding: '22px 36px', fontFamily: MONO, fontSize: 26, color: PAPER, lineHeight: 1.9 }}>
        <Label size={18}>FACT CHECK · 每个数字都要有出处</Label>
        <div>✓ 30 天 → 公司公告原文 · 链接已登记</div><div>✓ 1600 条 → 两家媒体交叉核对</div>
        <div style={{ color: CORAL, position: 'relative', display: 'table', opacity: t >= del - .2 ? 1 : 0 }}>✕ 「据说裁员七成」→ 没出处 · 删掉<span style={{ position: 'absolute', left: 0, top: '52%', height: 3, width: `${inOut((t - del - .3) / .4) * 100}%`, background: CORAL }} /></div>
      </div></Pop>
      <Pop at={ok + .3} style={{ marginTop: 22 }}><div style={{ display: 'flex', gap: 12 }}>{['稿子', '声音', '素材', '做片', '封面'].map((x, i) => <div key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 28, padding: '10px 22px', borderRadius: 12, background: i === 0 ? LIME : i === 1 ? 'transparent' : '#1C222C', color: i === 0 ? INK : PAPER, border: i === 1 ? `3px solid ${LIME}` : 'none' }}>{i === 0 ? '✓ ' : i === 1 ? '→ ' : ''}{x}</div>)}</div></Pop>
    </div></Scene>
  </AbsoluteFill></Scene>;
};

// ---------- 05 两件事你自己来 ----------
const Step: React.FC<{ n: number; text: string; at: number; color?: string }> = ({ n, text, at, color = LIME }) => <Pop at={at} from="left"><div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '12px 0' }}><span style={{ width: 52, height: 52, borderRadius: 26, background: color, color: INK, fontFamily: FONT, fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{n}</span><span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: PAPER }}>{text}</span></div></Pop>;
const TwoJobs: React.FC = () => {
  const t = useT(), s = seg('两件事你自己来'), v = say('两件事你自己来', '第一件是声音'), fish = say('两件事你自己来', '实在不想念'), img = say('两件事你自己来', '第二件是画面'), tik = say('两件事你自己来', 'TikHub'), alt = say('两件事你自己来', '没有也行');
  const focus = t < img - .2 ? 0 : 1, fx = inOut((t - img + .3) / .6);
  const half = (i: number, node: React.ReactNode) => { const on = i === 0 ? 1 - fx : fx; return <div style={{ position: 'absolute', left: i ? W / 2 : 0, top: 0, width: W / 2, height: H, background: i ? '#0C1220' : '#120E10', opacity: mix(.38, 1, on), transition: 'none' }}><div style={{ padding: '170px 0 0 110px', transform: `scale(${mix(.94, 1, on)})`, transformOrigin: 'left top' }}>{node}</div></div>; };
  void focus;
  return <Scene from={s.start} to={s.end}><AbsoluteFill style={{ background: INK }}>
    <Pop at={s.start} style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', zIndex: 3 }}><Label size={26} color={PAPER}>TWO JOBS FOR YOU · 只有两件事要你自己来</Label></Pop>
    {half(0, <><Label color={CORAL}>JOB 1 · VOICE</Label><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 110, color: PAPER, lineHeight: 1.1, margin: '10px 0 26px' }}>声音</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, height: 110, opacity: prog(t, v, .3) }}>{Array.from({ length: 34 }).map((_, i) => { const a = .2 + .8 * Math.abs(Math.sin(i * .7 + t * 8) * Math.sin(i * .21 + t * 2.7)); return <div key={i} style={{ width: 10, height: 110 * a, borderRadius: 5, background: CORAL }} />; })}</div>
      <div style={{ margin: '22px 0' }}><BiTag text="推荐 · 自己念，手机录就行" at={say('两件事你自己来', '我建议')} bg={CORAL} color="#fff" size={40} rotate={-2} /></div>
      <div style={{ opacity: prog(t, fish, .3) }}><Label color={DIM} size={20} style={{ margin: '18px 0 6px' }}>不想念 → FISH AUDIO</Label><Step n={1} text="贴进稿子" at={say('两件事你自己来', '把稿子贴进去')} color={CORAL} /><Step n={2} text="挑一个声音" at={say('两件事你自己来', '挑个声音')} color={CORAL} /><Step n={3} text="生成 · 下载 · 发给它" at={say('两件事你自己来', '生成好')} color={CORAL} /></div>
      <div style={{ marginTop: 34 }}><BiTag text="本片配音 = Fish Audio" at={say('两件事你自己来', '这条视频的声音')} bg={PAPER} color={INK} size={30} rotate={2} /></div></>)}
    {half(1, <><Label>JOB 2 · FOOTAGE</Label><div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 110, color: PAPER, lineHeight: 1.1, margin: '10px 0 26px' }}>画面</div>
      <Step n={1} text="tikhub.io 注册" at={tik} /><Step n={2} text="后台拿一把钥匙" at={say('两件事你自己来', '拿一把钥匙')} />
      <Pop at={say('两件事你自己来', '按它说的')} from="left"><div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '12px 0' }}><span style={{ width: 52, height: 52, borderRadius: 26, background: LIME, color: INK, fontFamily: FONT, fontWeight: 900, fontSize: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>3</span><span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 40, color: PAPER }}>存进</span><span style={{ fontFamily: MONO, fontSize: 34, color: INK, background: PAPER, padding: '6px 18px', borderRadius: 8 }}>🔑 钥匙.txt</span></div></Pop>
      <div style={{ marginTop: 30 }}><BiTag text="没有也行：直接发视频链接" at={alt} bg="#1C222C" color={LIME} size={36} rotate={-1} /></div></>)}
  </AbsoluteFill></Scene>;
};

// ---------- 06 做片 ----------
const Build: React.FC = () => {
  const t = useT(), s = seg('做片'), prev = say('做片', '先给你看'), nod = say('做片', '你点头'), qc = say('做片', '做完它还会');
  return <>
    <Scene from={s.start} to={qc - .1}><AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 60 }}>
      <Pop at={s.start + .05} from="scale"><Thin size={150} color={PAPER}>AUTO BUILD</Thin></Pop>
      <div style={{ display: 'flex', gap: 22 }}><Chip at={say('做片', '挑效果')} text="EFFECTS 挑效果" /><Chip at={say('做片', '配字幕')} text="SUBTITLES 配字幕" color={PAPER} /><Chip at={say('做片', '剪出来')} text="CUT 剪出来" color={CORAL} ink="#fff" /></div>
      <Pop at={prev - .1}><div style={{ width: 1300 }}>
        <div style={{ position: 'relative', height: 14, background: 'rgba(255,255,255,.15)', borderRadius: 7 }}><div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${16 * inOut((t - prev) / 1.6)}%`, background: LIME, borderRadius: 7 }} /><div style={{ position: 'absolute', left: '16%', top: -16, width: 4, height: 46, background: PAPER }} /></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}><Label color={LIME}>PREVIEW 0:00 – 0:20 · 先给你看开头</Label><Label color={DIM}>FULL CUT</Label></div>
      </div></Pop>
      <div style={{ height: 80 }}><BiTag text="✓ 你点头了，再做完整的" at={nod} bg={LIME} color={INK} size={44} rotate={-1} /></div>
    </AbsoluteFill></Scene>
    <Scene from={qc - .1} to={s.end}><AbsoluteFill style={{ background: INK }}>
      <div style={{ position: 'absolute', left: 110, top: 150, width: 1000, height: 780, overflow: 'hidden', borderRadius: 16, border: '2px solid rgba(255,255,255,.12)' }}><Img src={staticFile('ep05/qc-sheet.jpg')} style={{ width: '100%', transform: `translateY(${-inOut((t - qc) / 4) * 180}px)` }} /><div style={{ position: 'absolute', left: 0, right: 0, top: `${((t - qc) * 40) % 100}%`, height: 6, background: LIME, boxShadow: `0 0 30px ${LIME}` }} /></div>
      <div style={{ position: 'absolute', left: 1200, top: 210 }}><Label>QC · 自查结果（真实）</Label>
        {[['黑屏', '0 处', say('做片', '有没有黑屏')], ['闪帧', '0 处', say('做片', '有没有黑屏') + .4], ['响度', '−16.4 LUFS', say('做片', '声音大不大')], ['挡脸', '0 处', say('做片', '挡住人脸')]].map(([a, b, at], i) => { const k = sp(t, at as number, 260, 14); return <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 24, margin: '24px 0', opacity: Math.min(1, k * 2), transform: `translateX(${(1 - k) * 80}px)` }}><span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 54, color: LIME }}>✓</span><span style={{ fontFamily: FONT, fontWeight: 900, fontSize: 54, color: PAPER }}>{a}</span><span style={{ fontFamily: MONO, fontSize: 34, color: DIM }}>{b}</span></div>; })}
      </div>
    </AbsoluteFill></Scene>
  </>;
};

// ---------- 07 怎么用好 ----------
const Tips: React.FC = () => {
  const t = useT(), s = seg('怎么用好'), a1 = say('怎么用好', '第一'), a2 = say('怎么用好', '第二'), a3 = say('怎么用好', '喜欢哪个') - .55;
  const big = (n: string, at: number) => { const k = sp(t, at - .1, 180, 13); return <div style={{ position: 'absolute', right: 90, top: 60, fontFamily: FONT, fontWeight: 900, fontSize: 560, lineHeight: 1, color: 'transparent', WebkitTextStroke: `5px ${LIME}`, opacity: .55 * Math.min(1, k * 2), transform: `translateX(${(1 - k) * 200}px)` }}>{n}</div>; };
  return <>
    <Scene from={s.start} to={a1 - .1}><AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center' }}><Pop at={s.start + .1} from="scale"><Thin size={170} color={PAPER}>PRO TIPS ×3</Thin></Pop></AbsoluteFill></Scene>
    <Scene from={a1 - .1} to={a2 - .1} hard><HalftoneBg theme="black" style={{ width: W, height: H }}>{big('1', a1)}
      <div style={{ position: 'absolute', left: 140, top: 250 }}><Label>TIP 1 · 给角度，不只给题目</Label>
        <div style={{ marginTop: 30, fontFamily: FONT, fontWeight: 900, fontSize: 64, color: DIM, position: 'relative', display: 'table' }}>「英伟达财报」<span style={{ position: 'absolute', left: -10, right: -10, top: '52%', height: 6, background: CORAL, transform: `scaleX(${inOut((t - say('怎么用好', '别只给')) / .4)})`, transformOrigin: 'left' }} /></div>
        <div style={{ marginTop: 36 }}><Prompt text="英伟达财报——我觉得市场高估了它的护城河" at={say('怎么用好', '告诉它') + .1} w={1150} size={52} label="BETTER" /></div>
      </div></HalftoneBg></Scene>
    <Scene from={a2 - .1} to={a3 - .1} hard><HalftoneBg theme="black" style={{ width: W, height: H }}>{big('2', a2)}
      <div style={{ position: 'absolute', left: 140, top: 230 }}><Label>TIP 2 · 改的时候说具体</Label>
        <Pop at={say('怎么用好', '第三十二秒') - .2} style={{ marginTop: 40 }}><div style={{ width: 1300 }}>
          <div style={{ display: 'flex', gap: 4, height: 70 }}>{Array.from({ length: 12 }).map((_, i) => { const me = i === 3, k = me ? prog(t, say('怎么用好', '它就只改') - .1, .3) : 0; return <div key={i} style={{ flex: 1, borderRadius: 8, background: me ? `rgba(166,245,27,${mix(.25, 1, k)})` : '#1C222C', boxShadow: me ? `0 0 ${30 * k}px ${LIME}` : 'none', border: me ? `3px solid ${LIME}` : 'none' }} />; })}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14 }}><Label color={DIM}>0:00</Label><Label color={LIME} style={{ marginLeft: -760 }}>▲ 0:32 只重做这一段</Label><Label color={DIM}>2:04</Label></div>
        </div></Pop>
        <div style={{ marginTop: 40 }}><BiTag text="不用整条重来 · 约 1 分钟改好" at={say('怎么用好', '不用整条')} bg={LIME} color={INK} size={40} rotate={-1} /></div>
      </div></HalftoneBg></Scene>
    <Scene from={a3 - .1} to={s.end} hard><HalftoneBg theme="black" style={{ width: W, height: H }}>{big('3', a3)}
      <div style={{ position: 'absolute', left: 140, top: 200 }}><Label>TIP 3 · 喜欢哪个，报编号</Label>
        <Pop at={a3 + .2} style={{ marginTop: 30 }}><div style={{ position: 'relative', width: 1050, height: 560, overflow: 'hidden', borderRadius: 14 }}><Img src={staticFile('ep05/overview.jpg')} style={{ width: 1700, transform: 'translate(-300px, -720px)' }} />
          <div style={{ position: 'absolute', left: 520, top: 210, width: 200, height: 120, border: `5px solid ${LIME}`, borderRadius: 10, boxShadow: `0 0 0 3000px rgba(7,9,13,.6), 0 0 40px ${LIME}`, opacity: prog(t, say('怎么用好', '直接把编号'), .2) }} /></div></Pop>
        <div style={{ marginTop: 26, display: 'flex', alignItems: 'center', gap: 20 }}><Prompt text="下次也用 B23 粒子环" at={say('怎么用好', '下次') - .2} w={760} size={48} label="YOU" /></div>
      </div></HalftoneBg></Scene>
  </>;
};

// ---------- 08 结尾 ----------
const Outro: React.FC = () => {
  const t = useT(), s = seg('结尾'), name = say('结尾', '我是');
  return <>
    <Scene from={s.start} to={say('结尾', '剩下的') - .1}><AbsoluteFill style={{ background: INK, alignItems: 'center', justifyContent: 'center' }}>
      {t < say('结尾', '我想做一条视频') - .45 ? <Pop at={s.start} from="scale"><div style={{ position: 'relative', width: 420, height: 300 }}><div style={{ position: 'absolute', width: 170, height: 60, background: LIME, borderRadius: '18px 18px 0 0' }} /><div style={{ position: 'absolute', top: 40, width: 420, height: 260, background: LIME, borderRadius: 18, boxShadow: `0 0 100px ${LIME}66` }} /><Label color={INK} size={20} style={{ position: 'absolute', left: 0, right: 0, top: 155, letterSpacing: '.12em', textAlign: 'center', fontWeight: 700 }}>SKILLS · SCRIPTS · 254 FX</Label></div></Pop>
        : <Prompt text="我想做一条视频" at={say('结尾', '我想做一条视频')} label="ANY AI AGENT" />}
    </AbsoluteFill></Scene>
    <Scene from={say('结尾', '剩下的') - .1} to={clock.total + 1} hard><HalftoneBg theme="lime" style={{ width: W, height: H }}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 50 }}>
        <div style={{ display: 'flex', gap: 16 }}>{['稿子', '声音', '素材', '做片', '封面'].map((x, i) => { const k = sp(t, say('结尾', '剩下的') + i * .12, 260, 14); return <div key={i} style={{ fontFamily: FONT, fontWeight: 900, fontSize: 44, padding: '16px 34px', borderRadius: 14, background: INK, color: LIME, transform: `translateY(${(1 - k) * 60}px)`, opacity: Math.min(1, k * 2) }}>✓ {x}</div>; })}</div>
        <div style={{ fontFamily: FONT, fontWeight: 900, fontSize: 170, letterSpacing: '-.02em', color: INK, opacity: prog(t, name - .05, .2), transform: `scale(${mix(1.35, 1, prog(t, name - .05, .25))})` }}>宁少</div>
      </AbsoluteFill>
    </HalftoneBg></Scene>
  </>;
};

/** 底部字幕：黑底条 + 左侧荧光竖线，关键词变色。 */
const Subs: React.FC = () => {
  const t = useT(), { lines } = useClock(), l = lines.find((x) => t >= x.start - .04 && t < x.end + .15);
  if (!l || hide.includes(l.n)) return null;
  const re = new RegExp('(' + hot.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')');
  return <div style={{ position: 'absolute', left: 320, right: 320, bottom: 62, textAlign: 'center' }}><span style={{ display: 'inline-block', background: 'rgba(7,9,13,.8)', borderLeft: `6px solid ${LIME}`, padding: '10px 28px', fontFamily: FONT, fontSize: 44, fontWeight: 600, color: '#fff' }}>{l.text.split(re).map((x, i) => <span key={i} style={hot.includes(x) ? { color: LIME, fontWeight: 900 } : undefined}>{x}</span>)}</span></div>;
};
const sfx: [number, string, number][] = [
  ...['稿子', '画面', '剪辑', '特效'].map((w) => [say('开场', w), 'tick.wav', .4] as [number, string, number]), [say('开场', '全是'), 'thud.wav', .6],
  ...['能做什么', '效果库', '怎么用', '两件事你自己来', '做片', '怎么用好'].map((x) => [seg(x).start, 'whoosh.wav', .45] as [number, string, number]),
  [say('能做什么', '第二种') - .4, 'whoosh.wav', .35], [say('能做什么', '第三种') - .4, 'whoosh.wav', .35], [say('效果库', '两百多种'), 'thud.wav', .45],
  ...['数字跳动', '图表生长', '网页滚动', '人物卡片'].map((w) => [say('效果库', w) - .1, 'tick.wav', .35] as [number, string, number]),
  [say('怎么用', '查不到'), 'thud.wav', .4], [say('两件事你自己来', '我建议'), 'thud.wav', .4], [say('做片', '你点头'), 'tick.wav', .4],
  ...['有没有黑屏', '声音大不大', '挡住人脸'].map((w) => [say('做片', w), 'tick.wav', .35] as [number, string, number]),
  [say('怎么用好', '第一'), 'thud.wav', .45], [say('怎么用好', '第二'), 'thud.wav', .45], [say('怎么用好', '喜欢哪个') - .55, 'thud.wav', .45], [say('结尾', '我是'), 'thud.wav', .5],
];

export const Episode: React.FC = () => {
  useFonts();
  const t = useT(), ch = chapters.filter((c) => t >= clock.seg(c.from).start).length;
  const petOn = say('能做什么', '大家的互动');
  const light = (t >= clock.say('结尾', '剩下的') - .1);
  return (
    <ClockCtx.Provider value={clock}>
      <AbsoluteFill style={{ background: INK }}>
        <BroadcastFrame width={W} height={H} show="ONE SENTENCE" episode="一句话做视频 · AI MOTION REEL" ticker="EP05" chapter={chapters[Math.max(0, ch - 1)].title} index={`${String(Math.max(1, ch)).padStart(2, '0')} / 08`} from={0} to={clock.total} color={light ? INK : PAPER}>
          <AbsoluteFill><Opening /><Formats /><Library /><HowTo /><TwoJobs /><Build /><Tips /><Outro /></AbsoluteFill>
        </BroadcastFrame>
        <Grain />
        {t >= petOn && <div style={{ position: 'absolute', right: 30, bottom: 24 }}><PetHud name="？？？" form="young" stage="young" level={0} cur={0} next={100} at={petOn} gain={{ at: petOn + .4, amount: 0, toCur: 35 }} events={[{ at: petOn + .4, kind: 'react', form: 'young-happy', text: '长大中…' }, { at: petOn + 2.6, kind: 'react', form: 'young' }, { at: say('结尾', '我是') - .2, kind: 'react', form: 'young-happy' }]} size={190} /></div>}
        <Subs />
        <div style={{ position: 'absolute', left: 64, bottom: 26, fontFamily: FONT, fontSize: 19, color: light ? 'rgba(7,9,13,.6)' : 'rgba(243,241,234,.5)' }}>本视频由 AI 生成 · 配音 Fish Audio · 音乐 Lightless Dawn – Kevin MacLeod（CC BY 4.0）</div>
        {sfx.map(([tt, f, v], i) => <Sequence key={i} from={Math.round(tt * clock.fps)} layout="none"><Audio src={staticFile('sfx/' + f)} volume={v} /></Sequence>)}
        <Audio src={staticFile(`${SLUG}/voice.wav`)} />
        <Audio src={staticFile(`${SLUG}/bgm.mp3`)} volume={(f) => .18 * Math.min(1, f / 30) * Math.min(1, Math.max(0, (clock.total * clock.fps - f) / 45))} />
      </AbsoluteFill>
    </ClockCtx.Provider>
  );
};
