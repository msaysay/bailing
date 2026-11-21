// 《短视频剪辑正式进入 AI 时代》整片，横屏 1920×1080。开头是 open02（9.5 秒），后面 28 秒正文按内容换五套模板，
// 每套模板左上角挂一块牌子写明是第几套、叫什么（出镜人嘴上没说，所以画面上标）。最后 3 秒结尾卡。
// 粗剪和时间：先跑同目录的 prep.py，它产出 studio/public/open01/main.mp4、main.wav、bed2.wav 和 data.json。所有时刻都从 data.json 取。
import React from 'react';
import { AbsoluteFill, Audio, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { OPEN02 } from '../open02';
import data from './data.json';

const FPS = 30, OPEN = 285, BODY = Math.ceil(data.total * FPS), END = 100;
export const FULL_FPS = FPS, FULL_FRAMES = OPEN + BODY + END;
type Seg = { start: number; end: number; words: Record<string, number>; face?: number[] };
const S = data.segs as unknown as Record<string, Seg>, L = data.lines as { seg: string; text: string; start: number; end: number }[];
const line = (text: string) => L.find((l) => l.text.includes(text))!.start;
const LIME = '#D6FF3D', INK = '#0A0A0B', PAPER = '#F4F2EC', GOLD = '#FFD84A', GOLD2 = '#F7E3A1';
const HEI = '"F Hei", sans-serif', DIN = '"F Din", "F Hei", sans-serif', BT = '"F Bt", "F Hei", sans-serif', SONG = '"F Song", serif', KAI = '"F Kai", serif';
const c01 = (x: number) => Math.max(0, Math.min(1, x)), out3 = (x: number) => 1 - Math.pow(1 - c01(x), 3), out5 = (x: number) => 1 - Math.pow(1 - c01(x), 5);
const back = (x: number) => { const p = c01(x), c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const useFontsF = () => {
  const [h] = React.useState(() => delayRender('full-fonts'));
  React.useEffect(() => {
    Promise.all([['F Hei', 'SourceHanSansSC-Heavy.otf'], ['F Din', 'D-DIN-PRO-700-Bold.otf'], ['F Bt', 'PangMenZhengDaoBiaoTi.ttf'], ['F Song', 'NotoSerifSC-Black.ttf'], ['F Kai', 'ChillKai.ttf']].map(([fam, f]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: '100 900' }).load().then((x) => document.fonts.add(x)).catch(() => undefined))).then(() => continueRender(h));
  }, [h]);
};
/** 人物视频：把脸放到 (cx, cy)，脸宽 fw 像素。外面套一个裁切框用。 */
const Person: React.FC<{ seg: string; cx: number; cy: number; fw: number; style?: React.CSSProperties }> = ({ seg, cx, cy, fw, style }) => {
  const f = S[seg].face ?? [900, 495, 435], k = fw / f[2];
  return <OffthreadVideo src={staticFile('open01/main.mp4')} muted style={{ position: 'absolute', left: cx - f[0] * k, top: cy - f[1] * k, width: 1920 * k, height: 1080 * k, maxWidth: 'none', ...style }} />;
};
const Rise: React.FC<{ at: number; out?: number; t: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, out = 999, t, children, style }) => {
  if (t < at - 0.02 || t > out + 0.3) return null; const p = out5((t - at) / 0.42), q = out3((t - out) / 0.25);
  return <div style={{ overflow: 'hidden', ...style }}><div style={{ transform: `translateY(${(1 - p) * 110 - q * 110}%)`, opacity: 1 - q }}>{children}</div></div>;
};
/** 模板牌：每换一套模板，左上角这块牌子翻一下，写第几套和名字。 */
const Tag: React.FC<{ no: number; name: string; at: number; t: number; y?: number }> = ({ no, name, at, t, y = 44 }) => {
  const p = back((t - at) / 0.45), glow = 1 - out3((t - at) / 1.2);
  return (
    <div style={{ position: 'absolute', left: 48, top: y, display: 'flex', alignItems: 'stretch', transform: `translateX(${(p - 1) * 700}px) scale(1.45)`, transformOrigin: 'left top', boxShadow: `0 0 ${40 * glow}px rgba(214,255,61,${0.8 * glow}), 0 10px 30px rgba(0,0,0,.5)`, borderRadius: 10, overflow: 'hidden', fontFamily: HEI }}>
      <div style={{ background: LIME, color: INK, padding: '8px 18px', fontSize: 26, letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 10 }}>AI 模板 <span style={{ fontFamily: DIN, fontSize: 36 }}>{String(no).padStart(2, '0')}</span><span style={{ fontFamily: DIN, fontSize: 22, opacity: 0.6 }}>/ 05</span></div>
      <div style={{ background: 'rgba(10,10,11,.88)', color: PAPER, padding: '8px 22px', fontSize: 30, letterSpacing: 3, display: 'flex', alignItems: 'center' }}>{name}</div>
    </div>
  );
};
/** 换模板时一道绿条从左扫到右，中间写「换模板」。 */
const Wipe: React.FC<{ at: number; t: number }> = ({ at, t }) => {
  const d = t - at; if (d < -0.12 || d > 0.3) return null; const p = c01((d + 0.12) / 0.42);
  return <div style={{ position: 'absolute', left: -700 + p * 3300, top: 0, width: 560, height: 1080, background: LIME, transform: 'skewX(-12deg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEI, fontSize: 70, color: INK, letterSpacing: 8 }}>换模板</div>;
};
/** 当前这一行字幕。render 决定每套模板的字幕长什么样。 */
const useLine = (t: number) => L.find((l) => t >= l.start - 0.03 && t < l.end + 0.03);

// ———————————————— 模板 01 · 电影分屏（接着开头的样子）————————————————
const T1: React.FC<{ t: number }> = ({ t }) => {
  const a = S.s2.start, z = 1.04 + 0.04 * c01((t - a) / 4);
  return (
    <AbsoluteFill style={{ background: INK }}>
      <AbsoluteFill style={{ overflow: 'hidden' }}><Person seg="s2" cx={1420} cy={520} fw={400 * z} style={{ filter: 'contrast(1.1) saturate(1.05)' }} /></AbsoluteFill>
      <div style={{ position: 'absolute', left: 0, top: 0, width: 980, height: 1080, background: INK, clipPath: 'polygon(0 0, 100% 0, calc(100% - 150px) 100%, 0 100%)' }} />
      <div style={{ position: 'absolute', left: 980, top: 0, width: 8, height: 1080, background: LIME, transform: 'skewX(-7.9deg)', transformOrigin: 'top left' }} />
      <div style={{ position: 'absolute', left: 100, top: 250, width: 800 }}>
        <Rise at={line('今天你看到')} t={t}><div style={{ fontFamily: HEI, fontSize: 88, lineHeight: 1.3, color: 'rgba(244,242,236,.7)', whiteSpace: 'nowrap' }}>你看到的这条视频</div></Rise>
        <Rise at={line('就是我一句话')} t={t}><div style={{ fontFamily: HEI, fontSize: 210, lineHeight: 1.15, color: LIME, whiteSpace: 'nowrap' }}>一句话</div></Rise>
        <Rise at={line('让AI自动剪辑')} t={t}><div style={{ fontFamily: HEI, fontSize: 104, lineHeight: 1.25, color: PAPER, whiteSpace: 'nowrap' }}><span style={{ fontFamily: DIN, fontSize: 124 }}>AI</span> 自动剪出来的</div></Rise>
      </div>
      {t >= line('就是我一句话') + 0.3 && <div style={{ position: 'absolute', left: 104, top: 770, fontFamily: DIN, fontSize: 34, color: 'rgba(244,242,236,.75)', letterSpacing: 2, border: '2px solid rgba(244,242,236,.3)', borderRadius: 10, padding: '14px 24px' }}><span style={{ color: LIME }}>›</span> <span style={{ fontFamily: HEI }}>{'帮我把这条口播剪出来'.slice(0, Math.floor((t - line('就是我一句话') - 0.3) * 14))}</span><span style={{ opacity: Math.floor(t * 4) % 2 }}>▍</span></div>}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 74, background: '#000' }} /><div style={{ position: 'absolute', left: 0, bottom: 0, width: 1920, height: 74, background: '#000' }} />
      <Tag no={1} name="电影分屏" at={a + 0.05} t={t} y={92} />
    </AbsoluteFill>
  );
};
// ———————————————— 模板 02 · 财经解读风（素材带 + 右上圆头像）————————————————
const Chip: React.FC<{ at: number; t: number; text: string; sub: string; x: number; small: number }> = ({ at, t, text, sub, x, small }) => {
  if (t < at) return null; const p = back((t - at) / 0.4);
  return (
    <div style={{ position: 'absolute', left: x, top: 200 - small * 146, width: 370, height: 380 - small * 230, borderRadius: 24, background: 'linear-gradient(160deg,#2A2C33,#15161B)', border: '3px solid rgba(255,255,255,.22)', boxShadow: '0 20px 50px rgba(0,0,0,.5)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `translateY(${(1 - p) * 80}px) scale(${0.8 + 0.2 * p})`, opacity: c01((t - at) / 0.12) }}>
      <div style={{ fontFamily: BT, fontSize: 96 - small * 42, color: '#F4EFD6', transform: 'skewX(-7deg)', letterSpacing: 4 }}>{text}</div>
      {small < 0.5 && <div style={{ fontFamily: HEI, fontSize: 26, color: 'rgba(255,255,255,.55)', marginTop: 12 }}>{sub}</div>}
    </div>
  );
};
const T2: React.FC<{ t: number }> = ({ t }) => {
  const a = S.s4.start, b = S.s5.start, w = S.s4.words, small = out5((t - b) / 0.45), ai = line('并且把它给AI化了') + 0.5, l = useLine(t);
  const seg = t < b ? 's4' : 's5';
  return (
    <AbsoluteFill style={{ background: '#0B0C10' }}>
      <AbsoluteFill style={{ overflow: 'hidden' }}><Person seg={seg} cx={960} cy={540} fw={900} style={{ filter: 'blur(50px) brightness(.28) saturate(.8)' }} /></AbsoluteFill>
      {/* 素材带 */}
      <div style={{ position: 'absolute', left: 80, top: 150, width: 1330, height: 720, borderRadius: 26, overflow: 'hidden', background: 'radial-gradient(1200px 700px at 30% 110%, #1E2A44 0%, #0C1018 70%)', border: '2px solid rgba(255,255,255,.14)', boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.06) 2px, transparent 2px)', backgroundSize: '54px 54px' }} />
        <div style={{ position: 'absolute', left: 60, top: 44, fontFamily: BT, fontSize: 46, color: '#fff', transform: 'skewX(-7deg)', opacity: out3((t - a - 0.2) / 0.3) }}>我拆过的头部博主 <span style={{ color: GOLD }}>·</span> <span style={{ fontFamily: HEI, fontSize: 28, color: 'rgba(255,255,255,.55)' }}>逐帧量版式、节奏、字幕</span></div>
        <Chip at={w['小@14'] - 0.05} t={t} text="小Lin" sub="财经解读 · 竖屏" x={60} small={small} />
        <Chip at={w['淡@16'] - 0.05} t={t} text="蛋解创业" sub="商业财经 · 快节奏" x={460} small={small} />
        <Chip at={w['等@20'] - 0.05} t={t} text="……" sub="还有十几位" x={860} small={small} />
        {/* 拆出来的数 → AI 工作流 */}
        {t >= b && (
          <div style={{ position: 'absolute', left: 60, right: 60, top: 280, display: 'flex', gap: 24 }}>
            {[['1/3', '人全屏只占'], ['2 秒', '换一个画面'], ['71%', '字幕固定高度']].map(([n, lab], i) => { const p = back((t - b - 0.1 - i * 0.18) / 0.4); return (
              <div key={i} style={{ flex: 1, height: 250, borderRadius: 20, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.16)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: `scale(${Math.max(0, p)})`, opacity: c01((t - b - 0.1 - i * 0.18) / 0.1) }}>
                <div style={{ fontFamily: HEI, fontSize: 28, color: 'rgba(255,255,255,.6)' }}>{lab}</div><div style={{ fontFamily: DIN, fontSize: 120, color: GOLD, lineHeight: 1.1 }}>{n}</div>
              </div>); })}
          </div>
        )}
        {t >= ai && <div style={{ position: 'absolute', left: 60, right: 60, top: 560, height: 120, borderRadius: 20, background: `linear-gradient(90deg, #FFF3A8, #E7C94C)`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, fontFamily: BT, fontSize: 74, color: '#3A2F05', transform: `skewX(-7deg) scale(${back((t - ai) / 0.35)})`, boxShadow: '0 0 60px rgba(255,226,110,.5)' }}><span style={{ fontFamily: DIN }}>→</span>全部做成 AI 工作流</div>}
      </div>
      {/* 右上圆头像 */}
      <div style={{ position: 'absolute', left: 1470, top: 150, width: 370, height: 370, borderRadius: 185, overflow: 'hidden', boxShadow: '0 0 0 7px #F3F1EA, 0 24px 60px rgba(0,0,0,.6)', transform: `scale(${back((t - a) / 0.4)})` }}><Person seg={seg} cx={185} cy={175} fw={170} /></div>
      {l && <div style={{ position: 'absolute', left: 80, width: 1330, top: 900, textAlign: 'center', fontFamily: BT, fontSize: 70, color: '#fff', transform: 'skewX(-7deg)', WebkitTextStroke: '6px rgba(12,14,20,.85)', paintOrder: 'stroke fill', whiteSpace: 'nowrap' }}>{l.text}</div>}
      <Tag no={2} name="财经解读风" at={a + 0.05} t={t} />
    </AbsoluteFill>
  );
};
// ———————————————— 模板 03 · 商业快节奏风（藏青底、金色重点词、卡片人像）————————————————
const T3: React.FC<{ t: number }> = ({ t }) => {
  const a = S.s6.start, kw = line('你可以完全不出镜') + 0.45, gen = line('直接让AI自动生成'), l = useLine(t), g = c01((t - gen) / 1.0);
  const hl = (s: string) => s.split(/(不出镜|AI自动生成)/).map((x, i) => <span key={i} style={/不出镜|AI自动生成/.test(x) ? { color: GOLD } : undefined}>{x}</span>);
  return (
    <AbsoluteFill style={{ background: 'radial-gradient(1300px 900px at 50% 30%, #131F3D 0%, #0A1020 55%, #04060D 100%)' }}>
      <AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(120,160,255,.10) 2px, transparent 2px)', backgroundSize: '48px 48px', backgroundPosition: `${t * 14}px ${t * 8}px` }} />
      {/* 人像卡 */}
      <div style={{ position: 'absolute', left: 90, top: 140, width: 760, height: 700, borderRadius: 28, overflow: 'hidden', border: `4px solid ${GOLD}`, boxShadow: `0 0 50px rgba(255,216,74,.35), 0 30px 70px rgba(0,0,0,.6)`, transform: `scale(${0.9 + 0.1 * out5((t - a) / 0.5)})` }}><Person seg="s6" cx={380} cy={320} fw={330} /></div>
      {/* 右边：重点词 + 生成过程 */}
      <div style={{ position: 'absolute', left: 930, top: 150, fontFamily: BT, fontSize: 40, color: '#fff', background: 'linear-gradient(90deg,#6D3FE0,#9A6BFF)', padding: '8px 60px 10px 28px', clipPath: 'polygon(0 0, 100% 0, calc(100% - 26px) 100%, 0 100%)', transform: `translateX(${(1 - out5((t - a - 0.2) / 0.4)) * -400}px) skewX(-7deg)` }}>玩法一</div>
      {t >= kw && <div style={{ position: 'absolute', left: 920, top: 240, fontFamily: BT, fontSize: 250, lineHeight: 1.1, color: GOLD, WebkitTextStroke: '12px #0A0D18', paintOrder: 'stroke fill', transform: `skewX(-7deg) scale(${1 + 0.7 * (1 - out5((t - kw) / 0.22))})`, transformOrigin: 'left center', filter: `blur(${(1 - out5((t - kw) / 0.22)) * 14}px)`, textShadow: '0 10px 30px rgba(0,0,0,.6)' }}>不出镜</div>}
      {t >= kw + 0.25 && <div style={{ position: 'absolute', left: 936, top: 520, width: 620 * out5((t - kw - 0.25) / 0.4), height: 12, background: GOLD }} />}
      {t >= gen - 0.1 && (
        <div style={{ position: 'absolute', left: 930, top: 580, width: 880, height: 260, borderRadius: 22, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.16)', padding: '26px 34px', boxSizing: 'border-box', transform: `translateY(${(1 - out5((t - gen + 0.1) / 0.4)) * 60}px)`, opacity: c01((t - gen + 0.1) / 0.15) }}>
          <div style={{ fontFamily: HEI, fontSize: 34, color: '#fff', display: 'flex', justifyContent: 'space-between' }}><span>AI 直接生成</span><span style={{ fontFamily: DIN, color: GOLD }}>{Math.round(g * 100)}%</span></div>
          <div style={{ marginTop: 16, height: 16, borderRadius: 8, background: 'rgba(255,255,255,.12)', overflow: 'hidden' }}><div style={{ width: `${g * 100}%`, height: '100%', background: `linear-gradient(90deg, ${GOLD}, #FFB300)` }} /></div>
          <div style={{ marginTop: 24, display: 'flex', gap: 16 }}>{['写稿', '配音', '找画面', '做动效', '出成片'].map((x, i) => <div key={i} style={{ flex: 1, textAlign: 'center', fontFamily: HEI, fontSize: 28, padding: '14px 0', borderRadius: 12, color: g > (i + 0.6) / 5 ? '#1A1200' : 'rgba(255,255,255,.45)', background: g > (i + 0.6) / 5 ? `linear-gradient(180deg, ${GOLD}, #FFB300)` : 'rgba(255,255,255,.06)' }}>{x}</div>)}</div>
        </div>
      )}
      {l && <div style={{ position: 'absolute', left: 0, right: 0, top: 890, textAlign: 'center', fontFamily: BT, fontSize: 76, color: '#fff', transform: 'skewX(-7deg)', WebkitTextStroke: '9px #0A0D18', paintOrder: 'stroke fill', textShadow: '0 6px 14px rgba(0,0,0,.6)', whiteSpace: 'nowrap' }}>{hl(l.text)}</div>}
      <Tag no={3} name="商业快节奏风" at={a + 0.05} t={t} />
    </AbsoluteFill>
  );
};
// ———————————————— 模板 04 · 横屏深度解读风（章节条、金色宋体、玻璃清单）————————————————
const T4: React.FC<{ t: number }> = ({ t }) => {
  const a = S.s7a.start, w = S.s7a.words, l = useLine(t), seg = t < S.s7b.start ? 's7a' : t < S.s7c.start ? 's7b' : 's7c';
  const rows: [string, string, number][] = [['剪掉气口', '重录、口吃、长停顿', w['减@20'] - 0.3], ['加素材', '逐句配画面、排版式', w['素@27'] - 0.3], ['加特效', '花字、数据面板、转场', w['特@30'] - 0.3], ['降噪', '人声降噪、统一响度', S.s7b.start + 0.05], ['设计封面', '挑帧、压标题', S.s7c.start + 0.05], ['输出成片', '渲染、自查', line('最终输出成片') + 0.25]];
  const done = rows.filter((r) => t >= r[2]).length;
  return (
    <AbsoluteFill style={{ background: '#0B0D12' }}>
      <div style={{ position: 'absolute', left: 0, top: 84, width: 800, height: 996, overflow: 'hidden' }}><Person seg={seg} cx={400} cy={400} fw={330} style={{ filter: 'contrast(1.06)' }} /><div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, transparent 60%, #0B0D12 100%), linear-gradient(180deg, transparent 70%, rgba(11,13,18,.9) 100%)' }} /></div>
      <div style={{ position: 'absolute', left: 800, top: 84, right: 0, bottom: 0, background: 'radial-gradient(1000px 800px at 60% 40%, #1E2B3A 0%, #0C121A 65%)' }} />
      {/* 章节条 */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: 1920, height: 84, background: 'linear-gradient(180deg,#5C5D62,#3D3E44)', display: 'flex', alignItems: 'center', padding: '0 24px 0 560px', boxSizing: 'border-box' }}>
        {['前言', '玩法一 不出镜', '玩法二 你出镜', '结语'].map((c, i) => <div key={i} style={{ flex: i === 0 || i === 3 ? '0 0 auto' : '1 1 0', textAlign: 'center', padding: '0 34px', fontFamily: SONG, fontSize: 36, letterSpacing: 3, color: i === 2 ? GOLD2 : 'rgba(255,255,255,.85)', borderLeft: i ? '3px solid rgba(255,255,255,.8)' : undefined, textShadow: i === 2 ? `0 0 18px ${GOLD}` : undefined, whiteSpace: 'nowrap' }}>{c}</div>)}
      </div>
      {/* 玻璃清单 */}
      <div style={{ position: 'absolute', left: 860, top: 130, width: 990, height: 750, borderRadius: 26, background: 'linear-gradient(160deg, rgba(255,255,255,.14), rgba(255,255,255,.04))', border: '2px solid rgba(255,255,255,.26)', boxShadow: '0 30px 80px rgba(0,0,0,.5)', padding: '34px 50px', boxSizing: 'border-box', transform: `translateX(${(1 - out5((t - a - 0.1) / 0.5)) * 300}px)`, opacity: c01((t - a - 0.1) / 0.2) }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <div style={{ fontFamily: SONG, fontSize: 62, letterSpacing: 6, background: `linear-gradient(180deg, ${GOLD2}, #E9C46A 55%, #9C7A2E)`, WebkitBackgroundClip: 'text', color: 'transparent' }}>你出镜，AI 替你做</div>
          <div style={{ fontFamily: DIN, fontSize: 54, color: GOLD2 }}>{done}<span style={{ fontSize: 30, color: 'rgba(255,255,255,.5)' }}> / 6</span></div>
        </div>
        <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {rows.map(([name, sub, at], i) => { const p = out5((t - at) / 0.35), on = t >= at; return (
            <div key={i} style={{ height: 84, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 24, padding: '0 26px', background: on ? 'rgba(233,196,106,.16)' : 'rgba(255,255,255,.035)', border: `2px solid ${on ? '#E9C46A' : 'rgba(255,255,255,.1)'}`, transform: `translateX(${on ? (1 - p) * 40 : 0}px)` }}>
              <div style={{ width: 46, height: 46, borderRadius: 23, background: on ? '#E9C46A' : 'rgba(255,255,255,.1)', color: '#1A1200', fontFamily: DIN, fontSize: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${on ? back((t - at) / 0.35) : 1})` }}>{on ? '✓' : ''}</div>
              <div style={{ fontFamily: SONG, fontSize: 46, letterSpacing: 4, color: on ? '#fff' : 'rgba(255,255,255,.3)', width: 250 }}>{name}</div>
              <div style={{ fontFamily: HEI, fontSize: 27, color: on ? 'rgba(255,255,255,.7)' : 'rgba(255,255,255,.2)' }}>{sub}</div>
            </div>); })}
        </div>
      </div>
      {l && <div style={{ position: 'absolute', left: 0, right: 0, top: 930, textAlign: 'center', fontFamily: BT, fontSize: 76, color: '#fff', WebkitTextStroke: '7px rgba(8,10,14,.9)', paintOrder: 'stroke fill', textShadow: '0 4px 12px rgba(0,0,0,.6)', whiteSpace: 'nowrap' }}>{l.text}</div>}
      <Tag no={4} name="横屏深度解读风" at={a + 0.05} t={t} y={110} />
    </AbsoluteFill>
  );
};
// ———————————————— 模板 05 · 知识科普风（一套楷体：白字幕、红钩子、黄关键词、黑底金句）————————————————
const T5: React.FC<{ t: number }> = ({ t }) => {
  const a = S.s8.start, w = S.s8.words, team = w['团@16'], only = line('你只需要这套工作流'), l = useLine(t), z = 1.02 + 0.05 * c01((t - a) / 4.3), dark = out3((t - only + 0.05) / 0.35);
  const kai = (size: number, color: string, stroke: number): React.CSSProperties => ({ fontFamily: KAI, fontSize: size, color, WebkitTextStroke: `${stroke}px ${color}`, letterSpacing: size * 0.06 });
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <AbsoluteFill style={{ overflow: 'hidden' }}><Person seg="s8" cx={960} cy={470} fw={380 * z} /></AbsoluteFill>
      <AbsoluteFill style={{ background: '#000', opacity: dark * 0.82 }} />
      {/* 红色钩子 + 划掉的词 */}
      {t < only && <div style={{ position: 'absolute', left: 0, right: 0, top: 640, textAlign: 'center', opacity: out3((t - a - 0.05) / 0.2) }}>
        <div style={{ ...kai(150, '#D4161C', 3), textShadow: '0 0 0 #fff, 4px 4px 0 #fff, -4px -4px 0 #fff, 4px -4px 0 #fff, -4px 4px 0 #fff', transform: `scale(${1 + 0.3 * (1 - out5((t - a - 0.05) / 0.25))})` }}>不再需要</div>
        {t >= line('一个专业的剪辑编导团队') && <div style={{ position: 'relative', display: 'inline-block', marginTop: 6, ...kai(92, '#F7E36B', 1.5), textShadow: '0 4px 14px rgba(0,0,0,.8)' }}>专业的剪辑编导团队<div style={{ position: 'absolute', left: -10, top: '54%', height: 10, width: `calc(${c01((t - team) / 0.35) * 100}% + 20px)`, background: '#D4161C', transform: 'rotate(-2deg)' }} /></div>}
      </div>}
      {/* 黑底金句 */}
      {t >= only && <div style={{ position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center' }}>
        <div style={{ ...kai(110, '#FFFFFF', 2), opacity: out3((t - only) / 0.3) }}>你只需要</div>
        <div style={{ ...kai(250, '#F7E36B', 5), marginTop: 10, transform: `scale(${0.2 + 0.8 * back((t - only - 0.3) / 0.4)})`, opacity: c01((t - only - 0.3) / 0.1), textShadow: '0 0 60px rgba(247,227,107,.4)' }}>这套工作流</div>
      </div>}
      {l && t < only && <div style={{ position: 'absolute', left: 0, right: 0, top: 950, textAlign: 'center', ...kai(62, '#fff', 1.4), textShadow: '0 3px 10px rgba(0,0,0,.9)' }}>{l.text}</div>}
      <Tag no={5} name="知识科普风" at={a + 0.05} t={t} />
    </AbsoluteFill>
  );
};
// ———————————————— 结尾卡 ————————————————
const EndCard: React.FC<{ t: number }> = ({ t }) => (
  <AbsoluteFill style={{ background: `radial-gradient(1400px 700px at 50% 110%, #1C2410 0%, ${INK} 62%)`, alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
    <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(244,242,236,.045) 1px, transparent 1px), linear-gradient(90deg, rgba(244,242,236,.045) 1px, transparent 1px)', backgroundSize: '96px 96px' }} />
    <Rise at={0.1} t={t}><div style={{ fontFamily: HEI, fontSize: 84, color: PAPER, letterSpacing: 4 }}>想要这套工作流的核心内容？</div></Rise>
    <Rise at={0.5} t={t} style={{ marginTop: 30 }}><div style={{ fontFamily: HEI, fontSize: 150, color: INK, background: LIME, padding: '6px 60px 16px', letterSpacing: 6 }}>评论区留言「AI剪辑」</div></Rise>
    <Rise at={1.1} t={t} style={{ marginTop: 44 }}><div style={{ fontFamily: HEI, fontSize: 40, color: 'rgba(244,242,236,.65)', letterSpacing: 4 }}>本片由 AI 工作流剪辑 · 中途换了 <span style={{ fontFamily: DIN, color: LIME, fontSize: 52 }}>5</span> 套模板</div></Rise>
  </AbsoluteFill>
);
const Body: React.FC = () => {
  const f = useCurrentFrame(), t = f / FPS, sw = [S.s4.start, S.s6.start, S.s7a.start, S.s8.start];
  return (
    <AbsoluteFill>
      {t < sw[0] ? <T1 t={t} /> : t < sw[1] ? <T2 t={t} /> : t < sw[2] ? <T3 t={t} /> : t < sw[3] ? <T4 t={t} /> : <T5 t={t} />}
      {sw.map((x, i) => <Wipe key={i} at={x} t={t} />)}
      <Audio src={staticFile('open01/main.wav')} />
      <Audio src={staticFile('open01/bed2.wav')} volume={0.5} />
      {sw.map((x, i) => <Sequence key={i} from={Math.max(0, Math.round((x - 0.12) * FPS))} layout="none"><Audio src={staticFile('sfx/whoosh.wav')} volume={0.3} /></Sequence>)}
    </AbsoluteFill>
  );
};
export const FULL01: React.FC = () => {
  useFontsF(); const f = useCurrentFrame(), { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: '#000' }}>
      <Sequence durationInFrames={OPEN}><OPEN02 /></Sequence>
      <Sequence from={OPEN} durationInFrames={BODY + END}><Body /></Sequence>
      <Sequence from={OPEN + BODY} durationInFrames={END}><EndCard t={(f - OPEN - BODY) / fps} /></Sequence>
      <AbsoluteFill style={{ background: '#000', opacity: f > FULL_FRAMES - 8 ? (f - (FULL_FRAMES - 8)) / 8 : 0 }} />
    </AbsoluteFill>
  );
};
