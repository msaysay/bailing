// 《短视频剪辑正式进入 AI 时代》第二版，横屏 1920×1080，约 48 秒。六段连续口播粗剪成 12 段（收过气口），每段换一种版式盖住剪口：
// s1–s2 电影分屏大字 → s3 质疑气泡 → s4 反问 + 三步流程 → s6 一句一句提要求（对话框）→ s7 风格墙
// → s8–s9 插入手势全息片（配乐在这里砸下去）→ s10 后续更新两张卡 → s11 评论区打「工作流」→ s12 名片 → 结尾卡。
// 先跑同目录 prep.py：产出 studio/public/full02/main.mp4、main.wav、bed.wav 和 data.json。时刻都从 data.json 取。
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import data from './data.json';

const FPS = 30;
export const FULL2_FPS = FPS, FULL2_FRAMES = Math.ceil((data.total + data.end) * FPS);
type Seg = { start: number; end: number; words: [string, number][]; face?: number[] };
const S = data.segs as unknown as Record<string, Seg>, L = data.lines as { seg: string; text: string; start: number; end: number }[];
const ln = (text: string) => L.find((l) => l.text.includes(text))!.start;
const LIME = '#D6FF3D', INK = '#0A0A0B', PAPER = '#F4F2EC', GOLD = '#FFC83D', CYAN = '#3DD6FF', RED = '#FF4D4D';
const HEI = '"G Hei", sans-serif', DIN = '"G Din", "G Hei", sans-serif', BT = '"G Bt", "G Hei", sans-serif';
const c01 = (x: number) => Math.max(0, Math.min(1, x)), out3 = (x: number) => 1 - Math.pow(1 - c01(x), 3), out5 = (x: number) => 1 - Math.pow(1 - c01(x), 5);
const back = (x: number) => { const p = c01(x), c = 1.9; return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2); };
const useFontsG = () => {
  const [h] = React.useState(() => delayRender('full2-fonts'));
  React.useEffect(() => {
    Promise.all([['G Hei', 'SourceHanSansSC-Heavy.otf'], ['G Din', 'D-DIN-PRO-700-Bold.otf'], ['G Bt', 'PangMenZhengDaoBiaoTi.ttf']].map(([fam, f]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: '100 900' }).load().then((x) => document.fonts.add(x)).catch(() => undefined))).then(() => continueRender(h));
  }, [h]);
};
const T = React.createContext(0); const useT = () => React.useContext(T);
/** 收气口的位置（剪掉 0.15 秒以上的地方）：人物在这里推近或拉回，盖住跳帧。 */
const MICRO = ((data as any).micro ?? []).map((m: number[]) => m[0]) as number[];
const segAt = (t: number) => Object.keys(S).find((k) => t >= S[k].start && t < S[k].end) ?? 's12';
/** 人物：把这一段的脸放到 (cx, cy)，脸宽 fw。 */
const Person: React.FC<{ cx: number; cy: number; fw: number; style?: React.CSSProperties }> = ({ cx, cy, fw, style }) => {
  const t = useT(), sg = segAt(Math.min(t, data.total - 0.01)), f = S[sg].face ?? [960, 455, 240], z = MICRO.filter((m) => m <= t && m >= S[sg].start).length % 2 ? 1.07 : 1, k = (fw * z) / f[2];
  return <OffthreadVideo src={staticFile('full02/main.mp4')} muted style={{ filter: 'brightness(1.08) contrast(1.04) saturate(1.05)', position: 'absolute', left: cx - f[0] * k, top: cy - f[1] * k, width: 1920 * k, height: 1080 * k, maxWidth: 'none', ...style }} />;
};
const Rise: React.FC<{ at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ at, out = 999, children, style }) => {
  const t = useT(); if (t < at - 0.02 || t > out + 0.3) return null; const p = out5((t - at) / 0.42), q = out3((t - out) / 0.25);
  return <div style={{ overflow: 'hidden', ...style }}><div style={{ transform: `translateY(${(1 - p) * 110 - q * 110}%)`, opacity: 1 - q }}>{children}</div></div>;
};
const Pop: React.FC<{ at: number; out?: number; children: React.ReactNode; style?: React.CSSProperties; from?: string }> = ({ at, out = 999, children, style, from = 'scale' }) => {
  const t = useT(); if (t < at || t > out + 0.25) return null; const p = back((t - at) / 0.4), q = out3((t - out) / 0.2), o = c01((t - at) / 0.1) * (1 - q);
  return <div style={{ ...style, opacity: o, transform: `${style?.transform ?? ''} ${from === 'left' ? `translateX(${(p - 1) * 300}px)` : from === 'up' ? `translateY(${(1 - p) * 120}px)` : `scale(${p})`}` }}>{children}</div>;
};
const Glass: React.FC<{ style?: React.CSSProperties; children?: React.ReactNode }> = ({ style, children }) => (
  <div style={{ borderRadius: 30, background: 'rgba(14,16,24,.72)', backdropFilter: 'blur(20px)', border: '2px solid rgba(255,255,255,.22)', boxShadow: '0 30px 80px rgba(0,0,0,.55), inset 0 2px 0 rgba(255,255,255,.2)', ...style }}>{children}</div>
);
/** 字幕：底部居中一行，重点词标成荧光绿。 */
const HOT = ['AI 时代', 'AI', '一键剪辑', '开源', '剪映', '搞定', '华丽的动效', '一句一句', '头部博主', '持续', '很贵的剪辑师', '全部', '数字人', '创作工作台', '粉丝群', '「工作流」', '宁少', '超级个体'];
const Subs: React.FC<{ y?: number }> = ({ y = 946 }) => {
  const t = useT(), l = L.find((x) => t >= x.start && t < x.end + 0.03); if (!l) return null;
  let parts: { s: string; hot: boolean }[] = [{ s: l.text, hot: false }];
  for (const h of HOT) parts = parts.flatMap((p) => (p.hot || !p.s.includes(h) ? [p] : p.s.split(h).flatMap((x, i, a) => (i < a.length - 1 ? [{ s: x, hot: false }, { s: h, hot: true }] : [{ s: x, hot: false }]))));
  const p = out5((t - l.start) / 0.18);
  return <div style={{ position: 'absolute', left: 0, right: 0, top: y, textAlign: 'center', fontFamily: HEI, fontSize: 62, letterSpacing: 2, color: '#fff', transform: `translateY(${(1 - p) * 16}px) scale(${0.96 + 0.04 * p})`, textShadow: '0 0 12px rgba(0,0,0,.95), 0 4px 0 rgba(0,0,0,.85), 0 0 40px rgba(0,0,0,.6)' }}>
    {parts.filter((x) => x.s).map((x, i) => <span key={i} style={{ color: x.hot ? LIME : '#fff' }}>{x.s}</span>)}
  </div>;
};
const Dim: React.FC<{ a?: number }> = ({ a = 0.55 }) => <AbsoluteFill style={{ background: `linear-gradient(90deg, rgba(6,7,10,${a}), rgba(6,7,10,${a * 0.4}))` }} />;
const Grid: React.FC = () => <AbsoluteFill style={{ background: 'radial-gradient(1200px 700px at 30% 20%, #16203a 0%, transparent 70%), radial-gradient(1000px 700px at 85% 80%, #2a1430 0%, transparent 70%), #07080c' }}><AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '60px 60px' }} /></AbsoluteFill>;
/** 圆头像：人不在主画面时留在角上，嘴型一直看得见。 */
const Head: React.FC<{ x: number; y: number; d?: number }> = ({ x, y, d = 250 }) => (
  <div style={{ position: 'absolute', left: x, top: y, width: d, height: d, borderRadius: '50%', overflow: 'hidden', border: `5px solid ${LIME}`, boxShadow: '0 20px 50px rgba(0,0,0,.6), 0 0 40px rgba(214,255,61,.35)', background: '#000' }}><Person cx={d / 2} cy={d * 0.5} fw={d * 0.52} /></div>
);

/** s1–s2 电影分屏大字 */
const Hook: React.FC = () => {
  const t = useT(), panel = out5((t - 0.95) / 0.5), W = 880 * panel, a2 = ln('你现在看到'), a3 = S.s2.start, big: React.CSSProperties = { fontFamily: BT, fontSize: 132, lineHeight: 1.16, color: PAPER, letterSpacing: 4 };
  const ai = S.s1.words.find((w) => w[0] === 'a')![1];
  return <AbsoluteFill style={{ background: '#000' }}>
    <Person cx={960 + 400 * panel} cy={440} fw={300 + 40 * c01(t / 9)} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.35), transparent 30%, transparent 60%, rgba(0,0,0,.6))' }} />
    {t < 1.3 ? <Rise at={0.05} out={1.0} style={{ position: 'absolute', left: 110, top: 600 }}><div style={{ ...big, fontSize: 190, textShadow: '0 10px 40px rgba(0,0,0,.7)' }}>我宣布</div></Rise> : null}
    <div style={{ position: 'absolute', left: -200, top: -60, width: W + 200, height: 1200, background: INK, transform: 'skewX(-9deg)', borderRight: `10px solid ${LIME}`, boxShadow: '40px 0 90px rgba(0,0,0,.6)' }} />
    <div style={{ position: 'absolute', left: 90, top: 250, width: 800 }}>
      <Rise at={1.08} out={a2 - 0.1}><div style={big}>短视频剪辑</div></Rise>
      <Rise at={1.86} out={a2 - 0.08}><div style={{ ...big, fontSize: 84, color: 'rgba(244,242,236,.7)' }}>正式进入</div></Rise>
      <Rise at={ai - 0.05} out={a2 - 0.05}><div style={{ ...big, fontSize: 200, color: LIME, transform: `scale(${1 + (1 - out3((t - ai) / 0.4)) * 0.12})`, transformOrigin: 'left center' }}>AI 时代</div></Rise>
    </div>
    <div style={{ position: 'absolute', left: 90, top: 270, width: 800 }}>
      <Rise at={a2} out={a3 - 0.1}><div style={{ ...big, fontSize: 84, color: 'rgba(244,242,236,.7)' }}>你看到的这条视频</div></Rise>
      <Rise at={ln('也是我用')} out={a3 - 0.08}><div style={{ ...big, fontSize: 132, color: LIME, whiteSpace: 'nowrap' }}>AI 一键剪辑</div></Rise>
      <Rise at={ln('也是我用') + 1.2} out={a3 - 0.05}><div style={{ ...big, fontSize: 110 }}>生成的</div></Rise>
    </div>
    <div style={{ position: 'absolute', left: 90, top: 270, width: 800 }}>
      <Rise at={a3} out={S.s2.end - 0.12}><div style={{ ...big, fontSize: 84, color: 'rgba(244,242,236,.7)' }}>看到最后</div></Rise>
      <Rise at={ln('我会把这套')} out={S.s2.end - 0.1}><div style={{ ...big, fontSize: 124 }}>这套工作流</div></Rise>
      <Pop at={ln('开源给大家')} out={S.s2.end - 0.08} style={{ display: 'inline-block', marginTop: 18, transformOrigin: 'left center' }}><div style={{ ...big, fontSize: 124, color: INK, background: LIME, padding: '0 30px', borderRadius: 14, transform: 'rotate(-3deg)', whiteSpace: 'nowrap' }}>开源给大家</div></Pop>
    </div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 70 * out3(t / 0.35), background: '#000' }} /><div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 70 * out3(t / 0.35), background: '#000' }} />
  </AbsoluteFill>;
};

/** s3 质疑气泡 */
const Doubt: React.FC = () => {
  const t = useT(), a = S.s3.start, q = '你做这事，三个月之后，剪映不就超过你了吗？', n = Math.round(c01((t - ln('你做这事')) / 2.4) * q.length);
  return <AbsoluteFill style={{ background: '#000' }}>
    <Person cx={1400} cy={440} fw={310} /><Dim a={0.7} />
    <Pop at={a + 0.05} from="left" style={{ position: 'absolute', left: 110, top: 250 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
        <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'linear-gradient(135deg,#5b6170,#2b2f3a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEI, fontSize: 40, color: '#cfd3dc' }}>?</div>
        <div style={{ fontFamily: HEI, fontSize: 40, color: '#cfd3dc' }}>有人问我</div>
        <div style={{ fontFamily: HEI, fontSize: 30, color: '#fff', background: RED, padding: '4px 18px', borderRadius: 10, transform: 'rotate(-4deg)' }}>质疑</div>
      </div>
      <Glass style={{ width: 900, padding: '44px 50px', borderRadius: '8px 40px 40px 40px', minHeight: 300 }}>
        <div style={{ fontFamily: HEI, fontSize: 76, lineHeight: 1.35, color: '#fff' }}>{q.slice(0, n).split('剪映').map((x, i, arr) => <React.Fragment key={i}>{x}{i < arr.length - 1 ? <span style={{ color: GOLD }}>剪映</span> : null}</React.Fragment>)}<span style={{ opacity: Math.floor(t * 4) % 2 ? 1 : 0, color: LIME }}>▍</span></div>
      </Glass>
    </Pop>
  </AbsoluteFill>;
};

/** s4 反问 + 三步流程，s4b「搞定」 */
const Why: React.FC = () => {
  const t = useT(), f1 = ln('一个视频出来'), steps = [['01', '视频拍出来', f1], ['02', '交给 AI', ln('交给 AI')], ['03', '自动剪出来', ln('让它自动')]] as const, done = S.s4b.start;
  return <AbsoluteFill style={{ background: '#000' }}>
    <Person cx={500} cy={450} fw={t >= done ? 345 : 315} /><AbsoluteFill style={{ background: 'linear-gradient(270deg, rgba(6,7,10,.92) 40%, rgba(6,7,10,.1) 75%)' }} />
    <div style={{ position: 'absolute', left: 960, top: 200, width: 880 }}>
      <Rise at={ln('AI 时代') - 0.1} out={f1 - 0.15}><div style={{ fontFamily: DIN, fontSize: 60, color: LIME, letterSpacing: 8 }}>AI 时代</div></Rise>
      <Rise at={ln('我们为什么')} out={f1 - 0.1}><div style={{ fontFamily: BT, fontSize: 128, color: PAPER, lineHeight: 1.2 }}>为什么还需要</div></Rise>
      <Rise at={ln('我们为什么') + 0.9} out={f1 - 0.05}><div style={{ fontFamily: BT, fontSize: 170, color: PAPER, lineHeight: 1.2 }}>一个<span style={{ color: GOLD }}>剪映</span>？</div></Rise>
    </div>
    <div style={{ position: 'absolute', left: 980, top: 190, width: 820 }}>
      {steps.map(([no, name, at], i) => <Pop key={i} at={at - 0.05} from="left" style={{ marginBottom: 34 }}>
        <Glass style={{ display: 'flex', alignItems: 'center', gap: 30, padding: '30px 40px', border: `2.5px solid ${t >= at ? LIME : 'rgba(255,255,255,.2)'}`, boxShadow: `0 0 ${50 * (1 - out3((t - at) / 0.8))}px ${LIME}, 0 30px 80px rgba(0,0,0,.5)` }}>
          <div style={{ fontFamily: DIN, fontSize: 80, color: LIME, width: 110 }}>{no}</div><div style={{ fontFamily: HEI, fontSize: 80, color: '#fff' }}>{name}</div>
          {i < 2 ? <div style={{ position: 'absolute', left: 80, bottom: -36, fontFamily: DIN, fontSize: 40, color: LIME }}>▼</div> : null}
        </Glass></Pop>)}
    </div>
    <Pop at={done + 0.25} style={{ position: 'absolute', left: 1330, top: 560 }}><div style={{ fontFamily: BT, fontSize: 210, color: INK, background: LIME, padding: '0 50px', borderRadius: 24, transform: 'rotate(-8deg)', boxShadow: '0 30px 80px rgba(0,0,0,.6), 0 0 80px rgba(214,255,61,.5)' }}>搞定</div></Pop>
  </AbsoluteFill>;
};

/** s6 一句一句跟 AI 提要求 */
const Chat: React.FC = () => {
  const t = useT(), a = S.s6.start, rows = [['开头做成电影分屏大字', ln('都是我一句一句')], ['这里加一个三步流程图', ln('都是我一句一句') + 0.75], ['这句配上全息特效', ln('跟 AI 提要求') + 0.1]] as const, ok = ln('它帮我做出来');
  return <AbsoluteFill style={{ background: '#000' }}>
    <Person cx={1430} cy={450} fw={315} /><AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(6,7,10,.94) 42%, rgba(6,7,10,.1) 78%)' }} />
    <div style={{ position: 'absolute', left: 100, top: 110 }}>
      <Rise at={a + 0.1}><div style={{ fontFamily: HEI, fontSize: 46, color: 'rgba(244,242,236,.7)' }}>你现在看到的这条视频</div></Rise>
      <Rise at={ln('华丽的动效')}><div style={{ fontFamily: BT, fontSize: 120, lineHeight: 1.25, background: `linear-gradient(90deg, ${LIME}, ${CYAN} ${60 + Math.sin(t * 3) * 30}%, ${GOLD})`, WebkitBackgroundClip: 'text', color: 'transparent' }}>华丽的动效 · 包装</div></Rise>
    </div>
    <div style={{ position: 'absolute', left: 100, top: 400, width: 900 }}>
      {rows.map(([txt, at], i) => <Pop key={i} at={at} from="left" style={{ marginBottom: 22, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontFamily: HEI, fontSize: 30, color: INK, background: PAPER, borderRadius: 12, padding: '6px 14px' }}>我</div>
        <Glass style={{ padding: '18px 32px', borderRadius: 22, fontFamily: HEI, fontSize: 50, color: '#fff' }}>{txt.slice(0, Math.round(c01((t - at) / 0.45) * txt.length))}</Glass>
        <div style={{ fontFamily: DIN, fontSize: 54, color: LIME, opacity: c01((t - at - 0.55) / 0.1), transform: `scale(${back((t - at - 0.55) / 0.3)})` }}>✓</div>
      </Pop>)}
      <Pop at={ok} from="up" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ fontFamily: DIN, fontSize: 32, color: INK, background: LIME, borderRadius: 12, padding: '6px 14px' }}>AI</div>
        <div style={{ fontFamily: HEI, fontSize: 56, color: INK, background: LIME, padding: '14px 36px', borderRadius: 22, boxShadow: '0 0 60px rgba(214,255,61,.5)' }}>全部做好了</div>
      </Pop>
    </div>
  </AbsoluteFill>;
};

/** s7 风格墙 */
const Wall: React.FC = () => {
  const t = useT(), a = S.s7.start, more = ln('而且在持续'), cards = [['财经解读风', 'tpl-xiaolin'], ['横屏深度解读风', 'tpl-ziqi'], ['知识科普风', 'tpl-zhanpeng'], ['商业快节奏风', 'tpl-danjie'], ['相框老板风', ''], ['访谈纪实风', '']] as const;
  return <AbsoluteFill><Grid />
    <div style={{ position: 'absolute', left: 90, top: 60, fontFamily: BT, fontSize: 84, color: PAPER }}><Rise at={a + 0.05}><div>蒸馏<span style={{ color: LIME }}>头部博主</span>的剪辑风格</div></Rise></div>
    {cards.map(([name, img], i) => { const at = a + 0.35 + i * 0.16, x = 90 + (i % 4) * 440, y = 210 + Math.floor(i / 4) * 350, p = back((t - at) / 0.45); if (t < at) return null;
      return <div key={i} style={{ position: 'absolute', left: x, top: y + (1 - p) * 200, width: 410, opacity: c01((t - at) / 0.12), transform: `rotate(${(1 - p) * (i % 2 ? 6 : -6)}deg)` }}>
        <div style={{ height: 232, borderRadius: 20, overflow: 'hidden', border: '2px solid rgba(255,255,255,.3)', boxShadow: '0 24px 60px rgba(0,0,0,.6)', background: i === 4 ? 'linear-gradient(135deg,#3a2a14,#c9a063)' : 'linear-gradient(135deg,#12202e,#2f6d7a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: BT, fontSize: 60, color: 'rgba(255,255,255,.9)' }}>
          {img ? <Img src={staticFile(`full02/${img}.jpg`)} style={{ width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.08 - 0.08 * out3((t - at) / 2)})` }} /> : name.slice(0, 2)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}><span style={{ fontFamily: DIN, fontSize: 30, color: INK, background: LIME, padding: '0 10px', borderRadius: 6 }}>{String(i + 1).padStart(2, '0')}</span><span style={{ fontFamily: HEI, fontSize: 36, color: PAPER }}>{name}</span></div>
      </div>; })}
    <Pop at={more} style={{ position: 'absolute', left: 970, top: 560, width: 850, height: 232 }}>
      <div style={{ width: '100%', height: '100%', borderRadius: 20, border: `4px dashed ${LIME}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26, background: 'rgba(214,255,61,.08)', boxShadow: `0 0 ${40 + Math.sin(t * 8) * 20}px rgba(214,255,61,.4)` }}>
        <span style={{ fontFamily: DIN, fontSize: 150, color: LIME, lineHeight: 1 }}>+</span><span style={{ fontFamily: BT, fontSize: 84, color: PAPER }}>持续扩充中</span></div>
    </Pop>
    <Head x={1630} y={30} d={220} />
  </AbsoluteFill>;
};

/** s8–s9 插入手势全息片：每个「这样」换一段 */
const Holo: React.FC = () => {
  const t = useT(), { fps } = useVideoConfig(), a = S.s8.start, shots = [[a, 13.1], [ln('和这样的动效'), 6.2], [ln('要很贵的剪辑师'), 3.0], [S.s9.start, 9.7], [ln('全部给大家'), 8.2]] as const;
  const i = shots.reduce((acc, s, k) => (t >= s[0] ? k : acc), 0), at = shots[i][0], hit = 1 - out5((t - at) / 0.3), past = ln('要很贵的剪辑师'), now = S.s9.start;
  return <AbsoluteFill style={{ background: '#000' }}>
    {shots.map((s, k) => k === i ? <Sequence key={k} from={Math.round(s[0] * fps)} layout="none"><OffthreadVideo src={staticFile('full02/hud.mp4')} muted startFrom={Math.round(s[1] * fps)} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 + hit * 0.22})`, filter: `brightness(${1 + hit * 0.6})` }} /></Sequence> : null)}
    <AbsoluteFill style={{ background: '#fff', opacity: 0.6 * (1 - out3((t - at) / 0.14)) }} />
    <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.5), transparent 25%, transparent 65%, rgba(0,0,0,.75))' }} />
    <Pop at={a + 0.1} out={past - 0.05} from="left" style={{ position: 'absolute', left: 80, top: 60 }}><div style={{ fontFamily: HEI, fontSize: 46, color: INK, background: CYAN, padding: '8px 26px', borderRadius: 14 }}>手势全息特效 · AI 做的</div></Pop>
    <Pop at={past} out={now - 0.05} from="left" style={{ position: 'absolute', left: 80, top: 60 }}><div style={{ fontFamily: BT, fontSize: 84, color: '#fff', textShadow: '0 6px 30px rgba(0,0,0,.8)' }}>过去：<span style={{ position: 'relative' }}>很贵的剪辑师<span style={{ position: 'absolute', left: -6, top: '52%', height: 10, width: `${c01((t - past - 0.5) / 0.4) * 104}%`, background: RED, borderRadius: 5 }} /></span></div></Pop>
    <Pop at={now} from="left" style={{ position: 'absolute', left: 80, top: 60 }}><div style={{ fontFamily: BT, fontSize: 84, color: INK, background: LIME, padding: '4px 34px', borderRadius: 18, boxShadow: '0 0 70px rgba(214,255,61,.5)' }}>现在：工作流里全都有</div></Pop>
    <Head x={70} y={640} d={250} />
  </AbsoluteFill>;
};

/** s10 后续更新 */
const Next: React.FC = () => {
  const t = useT(), a = S.s10.start, c1 = ln('数字人的自动化'), c2 = ln('还有内容的创作');
  return <AbsoluteFill style={{ background: '#000' }}>
    <Person cx={470} cy={450} fw={315} /><AbsoluteFill style={{ background: 'linear-gradient(270deg, rgba(6,7,10,.94) 46%, rgba(6,7,10,.1) 80%)' }} />
    <div style={{ position: 'absolute', left: 900, top: 90 }}><Rise at={a + 0.1}><div style={{ fontFamily: DIN, fontSize: 50, color: LIME, letterSpacing: 8 }}>COMING NEXT · 持续更新</div></Rise></div>
    <Pop at={c1} from="left" style={{ position: 'absolute', left: 900, top: 190 }}><Glass style={{ width: 920, padding: '34px 44px', display: 'flex', alignItems: 'center', gap: 34 }}>
      <div style={{ width: 130, height: 130, borderRadius: '50%', overflow: 'hidden', border: `4px solid ${CYAN}`, boxShadow: `0 0 40px ${CYAN}`, flex: 'none', position: 'relative' }}><Img src={staticFile('full02/me.jpg')} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(.3) contrast(1.2)' }} /><div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg, ${CYAN}55 0 2px, transparent 2px 7px)`, transform: `translateY(${(t * 30) % 7}px)` }} /></div>
      <div><div style={{ fontFamily: BT, fontSize: 70, color: '#fff' }}>数字人自动化工作流</div><div style={{ fontFamily: HEI, fontSize: 34, color: CYAN, marginTop: 6 }}>不出镜，也能日更</div></div>
    </Glass></Pop>
    <Pop at={c2} from="left" style={{ position: 'absolute', left: 900, top: 440 }}><Glass style={{ width: 920, padding: 26 }}>
      <div style={{ fontFamily: BT, fontSize: 70, color: '#fff', padding: '4px 18px 16px' }}>内容创作<span style={{ color: LIME }}>工作台</span></div>
      <div style={{ height: 300, borderRadius: 18, overflow: 'hidden', border: '1.5px solid rgba(255,255,255,.2)' }}><Img src={staticFile('full02/wb.jpg')} style={{ width: '100%', display: 'block', transform: `translateY(${-(t - c2) * 26}px)` }} /></div>
    </Glass></Pop>
  </AbsoluteFill>;
};

/** s11 评论区打「工作流」 */
const Cta: React.FC = () => {
  const t = useT(), a = S.s11.start, g = ln('你可以进粉丝群'), c = ln('或者在评论区'), w = '工作流', n = Math.round(c01((t - c - 0.75) / 0.5) * w.length);
  return <AbsoluteFill style={{ background: '#000' }}>
    <Person cx={1420} cy={450} fw={320} /><AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(6,7,10,.94) 42%, rgba(6,7,10,.1) 78%)' }} />
    <div style={{ position: 'absolute', left: 100, top: 150 }}><Rise at={a + 0.1}><div style={{ fontFamily: BT, fontSize: 110, color: PAPER }}>对这套工作流<span style={{ color: LIME }}>感兴趣？</span></div></Rise></div>
    <Pop at={g} from="left" style={{ position: 'absolute', left: 100, top: 350 }}><Glass style={{ padding: '26px 44px', display: 'flex', alignItems: 'center', gap: 26 }}><span style={{ fontFamily: DIN, fontSize: 60, color: LIME }}>01</span><span style={{ fontFamily: HEI, fontSize: 70, color: '#fff' }}>进粉丝群</span></Glass></Pop>
    <Pop at={c} from="left" style={{ position: 'absolute', left: 100, top: 530 }}><Glass style={{ padding: '26px 44px', width: 880 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 26 }}><span style={{ fontFamily: DIN, fontSize: 60, color: LIME }}>02</span><span style={{ fontFamily: HEI, fontSize: 70, color: '#fff' }}>评论区打</span></div>
      <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ flex: 1, height: 110, borderRadius: 55, background: 'rgba(255,255,255,.12)', border: '2px solid rgba(255,255,255,.3)', display: 'flex', alignItems: 'center', padding: '0 40px', fontFamily: HEI, fontSize: 70, color: LIME }}>{w.slice(0, n)}<span style={{ opacity: Math.floor(t * 4) % 2 ? 1 : 0.2, color: '#fff', marginLeft: 4 }}>|</span></div>
        <div style={{ fontFamily: HEI, fontSize: 46, color: INK, background: LIME, padding: '26px 40px', borderRadius: 55, transform: `scale(${n >= 3 ? 1 + Math.sin(t * 10) * 0.05 : 1})`, boxShadow: n >= 3 ? '0 0 50px rgba(214,255,61,.6)' : 'none' }}>发送</div>
      </div>
    </Glass></Pop>
  </AbsoluteFill>;
};

/** s12 名片 + 结尾卡 */
const Sign: React.FC = () => {
  const t = useT(), a = S.s12.start, e = data.total, p = out5((t - e) / 0.5);
  return <AbsoluteFill style={{ background: '#000' }}>
    <Person cx={960} cy={420} fw={330 + (t - a) * 10} /><AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 45%, rgba(0,0,0,.85))' }} />
    <div style={{ position: 'absolute', left: 150, top: 640, display: 'flex', alignItems: 'flex-end', gap: 30 }}>
      <div style={{ width: 14, height: 190, background: LIME, transform: `scaleY(${out5((t - a) / 0.4)})`, transformOrigin: 'bottom' }} />
      <div><Rise at={a + 0.05}><div style={{ fontFamily: BT, fontSize: 170, color: '#fff', lineHeight: 1.05 }}>宁少</div></Rise><Rise at={ln('陪伴 AI')}><div style={{ fontFamily: HEI, fontSize: 56, color: LIME, letterSpacing: 4 }}>陪伴 AI 时代的超级个体</div></Rise></div>
    </div>
    {t >= e ? <AbsoluteFill style={{ opacity: c01((t - e) / 0.2) }}><Grid />
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${1.25 - 0.25 * p})` }}>
        <div style={{ fontFamily: HEI, fontSize: 58, color: 'rgba(244,242,236,.8)' }}>想要这套 AI 剪辑工作流？</div>
        <div style={{ fontFamily: BT, fontSize: 150, color: INK, background: LIME, padding: '6px 60px', borderRadius: 24, margin: '30px 0', boxShadow: '0 0 90px rgba(214,255,61,.45)' }}>评论区留言「工作流」</div>
        <div style={{ fontFamily: HEI, fontSize: 46, color: PAPER, letterSpacing: 6, opacity: out3((t - e - 0.5) / 0.4) }}>宁少 AI 进化论 · 核心工作流开源</div>
      </AbsoluteFill></AbsoluteFill> : null}
  </AbsoluteFill>;
};

export const FULL02: React.FC = () => {
  useFontsG();
  const f = useCurrentFrame(), t = f / FPS, at = (k: string) => S[k].start;
  const scene = t < at('s3') ? <Hook /> : t < at('s4a') ? <Doubt /> : t < at('s6') ? <Why /> : t < at('s7') ? <Chat /> : t < at('s8') ? <Wall /> : t < at('s10') ? <Holo /> : t < at('s11') ? <Next /> : t < at('s12') ? <Cta /> : <Sign />;
  const cut = [...data.cuts].reverse().find((c) => t >= c) ?? -9, hit = 1 - out5((t - cut) / 0.22);
  return <T.Provider value={t}><AbsoluteFill style={{ background: '#000' }}>
    <AbsoluteFill style={{ transform: `scale(${1 + hit * 0.035})` }}>{scene}</AbsoluteFill>
    {t < data.total ? <Subs /> : null}
    <div style={{ position: 'absolute', right: 44, top: 34, fontFamily: HEI, fontSize: 26, color: 'rgba(255,255,255,.6)', letterSpacing: 3, display: t < at('s7') || t >= at('s8') ? 'block' : 'none' }}>宁少 AI 进化论</div>
    <Audio src={staticFile('full02/main.wav')} /><Audio src={staticFile('full02/bed.wav')} />
  </AbsoluteFill></T.Provider>;
};
