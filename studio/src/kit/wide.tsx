// 横屏深度解读风（子祺见微式）的版式引擎。数值量自两条真实成片（经济权力 13:29、卡脖子四张王牌 8:38，都是 3:2 横屏）。
// 拆解和每个数的出处见 docs/对标拆解-子祺见微.md。
// 画布 1920×1280：顶上 100 是章节导航条，底下 110 是频道标志条，中间 1920×1070 是内容区（接近 16:9）。
// 主持人视频是横屏的（1920×1080）。版式在「主持人全景 / 主持人加右侧素材窗 / 素材窗加主持人名片 / 满屏素材加圆头像 / 满屏素材加小头像 / 人不在」之间切。
// 时间一律从 timing.json 取，用法同竖屏：at(行号, '词')。
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useVideoConfig } from 'remotion';
import { inOut, mix, prog, useClock } from './clock';
import { FONT, useT } from './kit';
import widefont from './widefont.json';

export const WW = 1920, WH = 1280, TOP = 100, BOT = 110, CH = WH - TOP - BOT;   // 内容区高 1070
const PACK = widefont as { pack: string; sub: string | null; title: string | null; num: string | null };
export const W_SUB = PACK.sub ? `"Wide Sub", ${FONT}` : FONT;
export const W_TITLE = PACK.title ? `"Wide Title", "Songti SC", serif` : `"Songti SC", "Noto Serif CJK SC", serif`;
export const W_NUM = PACK.num ? `"Wide Num", ${FONT}` : FONT;
export const GOLD = '#E9C46A', GOLD2 = '#F7E3A1', INK = '#0B0D12';
/** 加载这条线的字体包（字幕、标题、数字）。在合成的最外层调一次，和 kit 的 useFonts 一起用。 */
export const useWideFonts = () => {
  const [h] = React.useState(() => delayRender('wide-fonts'));
  React.useEffect(() => {
    const list = ([['Wide Sub', PACK.sub], ['Wide Title', PACK.title], ['Wide Num', PACK.num]] as [string, string | null][]).filter(([, f]) => f);
    Promise.all(list.map(([fam, f]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: '100 900' }).load().then((x) => document.fonts.add(x)).catch(() => console.warn(`字体 ${f} 没装：python3 scripts/fonts.py install ${PACK.pack}`)))).then(() => continueRender(h));
  }, [h]);
};
const isImg = (src: string) => /\.(png|jpe?g|webp|gif)$/i.test(src);
const vis = (t: number, from: number, to: number, fin = 0.25, fout = 0.2) => (t < from - 0.02 || t > to + fout ? 0 : prog(t, from, fin) * (1 - prog(t, to, fout)));

/** 素材放在哪：full 铺满内容区；right 主持人右边的素材窗；left 名片版式左边的素材窗；framed 画框里。坐标是整张画布上的。 */
export const AREA = {
  full: { x: 0, y: TOP, w: WW, h: CH, r: 0 },
  right: { x: 724, y: 224, w: 1150, h: 762, r: 30 },
  left: { x: 30, y: 130, w: 1204, h: 910, r: 24 },
  framed: { x: 190, y: 220, w: 1540, h: 810, r: 18 },
};
export type WMode = 'full' | 'side' | 'card' | 'circle' | 'avatar' | 'off';
export type WBeat = {
  at: number;
  /** full 主持人全景；side 主持人加右侧素材窗（人还是全景，只是右边盖一个窗）；card 左素材窗加右侧主持人名片；
   *  circle 满屏素材加右上圆头像；avatar 满屏素材加左侧小头像；off 人不在。 */
  mode: WMode;
  /** full、side 时的景别，1 是原大。剪口处换景别盖住跳帧。 */
  zoom?: number;
  /** 过渡秒数，默认 0.35；换景别用 0（硬切）。 */
  dur?: number;
};
export type WFace = { x: number; y: number; w: number };   // 人脸在主持人视频（1920×1080）里的中心和宽度
type Box = { x: number; y: number; w: number; h: number; r: number; s: number; ax: number; ay: number; op: number; ring: number };
const boxOf = (b: WBeat, f: WFace, prev?: Box): Box => {
  const cover = WW / 1920;
  if (b.mode === 'full') return { x: 0, y: TOP, w: WW, h: CH, r: 0, s: cover * (b.zoom ?? 1), ax: f.x / 1920, ay: f.y / 1080, op: 1, ring: 0 };
  if (b.mode === 'side') {   // 人要让出右边给素材窗：脸在画面中间的话，把人推近并挪到左边四分之一处（对标片坐着讲的那条就是这样）；本来就站在左边的不动
    const ax = Math.min(f.x / 1920, 0.25), need = (WW * (1 - ax)) / (1920 - f.x);
    return { x: 0, y: TOP, w: WW, h: CH, r: 0, s: Math.max(cover * (b.zoom ?? 1), need), ax, ay: Math.min(0.42, f.y / 1080 + 0.06), op: 1, ring: 0 };
  }
  if (b.mode === 'card') return { x: 1274, y: 246, w: 606, h: 560, r: 0, s: (0.3 * 606) / f.w, ax: 0.5, ay: 0.4, op: 1, ring: 0 };          // 名片上半是人，下半是名字条（NameCard 画）
  if (b.mode === 'circle') return { x: 1335, y: 140, w: 510, h: 510, r: 255, s: (0.26 * 510) / f.w, ax: 0.5, ay: 0.4, op: 1, ring: 1 };   // 直径 510，圆心 (1590, 395)
  if (b.mode === 'avatar') return { x: 50, y: 640, w: 340, h: 340, r: 28, s: (0.34 * 340) / f.w, ax: 0.5, ay: 0.42, op: 1, ring: 0.6 };
  return { ...(prev as Box), op: 0 };
};
const lerpB = (a: Box, b: Box, p: number): Box => ({ x: mix(a.x, b.x, p), y: mix(a.y, b.y, p), w: mix(a.w, b.w, p), h: mix(a.h, b.h, p), r: mix(a.r, b.r, p), s: mix(a.s, b.s, p), ax: mix(a.ax, b.ax, p), ay: mix(a.ay, b.ay, p), op: mix(a.op, b.op, p), ring: mix(a.ring, b.ring, p) });
export const useWMode = (beats: WBeat[]) => { const t = useT(); let m = beats[0].mode; beats.forEach((b) => { if (t >= b.at + (b.dur ?? 0.35) / 2) m = b.mode; }); return m; };

/** 舞台。under 垫在主持人下面（满屏素材、画框、数据面板的底）；children 压在主持人上面（素材窗、标题、字幕）。
 *  chapters 是顶上导航条的章节名（「前言」加四到六章加「结语」），chapterAt 是每一章从第几秒开始，讲到哪章哪章亮。 */
export const WideStage: React.FC<{ src: string; face: WFace; beats: WBeat[]; chapters: string[]; chapterAt: number[]; channel: string; under?: React.ReactNode; children?: React.ReactNode }> = ({ src, face, beats, chapters, chapterAt, channel, under, children }) => {
  const t = useT(); let st = boxOf(beats[0], face);
  beats.slice(1).forEach((b) => { const d = b.dur ?? 0.35, p = d <= 0 ? (t >= b.at ? 1 : 0) : inOut((t - b.at) / d); if (p > 0) st = lerpB(st, boxOf(b, face, st), p); });
  const VW = 1920 * st.s, VH = 1080 * st.s;
  const left = Math.min(0, Math.max(st.w - VW, st.ax * st.w - face.x * st.s)), top = Math.min(0, Math.max(st.h - VH, st.ay * st.h - face.y * st.s));
  let cur = 0; chapterAt.forEach((x, i) => { if (t >= x) cur = i; });
  return (
    <AbsoluteFill style={{ background: INK, fontFamily: FONT, color: '#fff' }}>
      <div style={{ position: 'absolute', left: 0, top: TOP, width: WW, height: CH, overflow: 'hidden', background: '#07080C' }}>
        <div style={{ position: 'absolute', left: 0, top: -TOP, width: WW, height: WH }}>{under}</div>
      </div>
      <div style={{ position: 'absolute', left: st.x, top: st.y, width: st.w, height: st.h, borderRadius: st.r, overflow: 'hidden', opacity: st.op, boxShadow: st.ring > 0.01 ? `0 0 0 ${5 * st.ring}px ${GOLD}, 0 20px 50px rgba(0,0,0,${0.6 * st.ring})` : 'none' }}>
        <OffthreadVideo src={staticFile(src)} muted style={{ position: 'absolute', left, top, width: VW, height: VH, maxWidth: 'none' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, top: TOP, width: WW, height: CH, overflow: 'hidden' }}><div style={{ position: 'absolute', left: 0, top: -TOP, width: WW, height: WH }}>{children}</div></div>
      {/* 章节导航条：细宋体，竖线隔开，当前这一章是金色，其余灰白 */}
      <div style={{ position: 'absolute', left: 0, top: 0, width: WW, height: TOP, background: 'linear-gradient(180deg,#5C5D62,#3D3E44)', display: 'flex', alignItems: 'center', padding: '0 24px', boxSizing: 'border-box', borderBottom: '2px solid rgba(0,0,0,.6)' }}>
        {chapters.map((c, i) => <div key={i} style={{ flex: c.length <= 2 ? '0 0 auto' : '1 1 0', textAlign: 'center', fontFamily: W_TITLE, fontWeight: 600, fontSize: Math.min(44, Math.floor(1500 / Math.max(8, chapters.join('').length) * 1.05)), letterSpacing: 3, whiteSpace: 'nowrap', padding: '0 22px', color: i === cur ? GOLD2 : 'rgba(255,255,255,.86)', borderLeft: i ? '3px solid rgba(255,255,255,.8)' : undefined, textShadow: i === cur ? `0 0 18px ${GOLD}` : '0 2px 4px rgba(0,0,0,.5)' }}>{c}</div>)}
      </div>
      {/* 频道标志条 */}
      <div style={{ position: 'absolute', left: 0, top: WH - BOT, width: WW, height: BOT, background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 26 }}>
        <div style={{ width: 240, height: 2, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.55))' }} />
        <div style={{ fontFamily: W_TITLE, fontWeight: 900, fontSize: 50, letterSpacing: 8, color: GOLD2, textShadow: `0 0 22px rgba(233,196,106,.45)` }}>{channel}</div>
        <div style={{ width: 240, height: 2, background: 'linear-gradient(270deg, transparent, rgba(255,255,255,.55))' }} />
      </div>
    </AbsoluteFill>
  );
};

export type Shot = { src: string; at: number; startFrom?: number; fit?: 'cover' | 'contain'; credit?: string };
/** 一串素材画面，放在指定区域里，硬切，每个画面极慢地推。真实成片里两秒左右换一个画面，同一个画面不超过四秒。
 *  area 是 full / right / left / framed；full 和 framed 放在 WideStage 的 under 里，right 和 left 放在 children 里（要压在主持人上面）。 */
export const Shots: React.FC<{ area: keyof typeof AREA; shots: Shot[]; until: number }> = ({ area, shots, until }) => {
  const t = useT(), { fps } = useVideoConfig(); if (!shots.length || t < shots[0].at - 0.02 || t > until + 0.25) return null;
  const A = AREA[area], op = prog(t, shots[0].at, 0.25) * (1 - prog(t, until, 0.22)), pop = area === 'full' ? 1 : mix(0.94, 1, prog(t, shots[0].at, 0.35));
  const edge = area === 'right' || area === 'left';
  return (
    <>
      {area === 'framed' && <FrameArt op={op} />}
      <div style={{ position: 'absolute', left: A.x, top: A.y, width: A.w, height: A.h, borderRadius: A.r, overflow: 'hidden', opacity: op, transform: `scale(${pop})`, background: '#000', boxShadow: edge ? `0 0 0 3px ${GOLD2}, 0 24px 60px rgba(0,0,0,.6)` : area === 'framed' ? 'inset 0 0 60px rgba(0,0,0,.9)' : undefined }}>
        {shots.map((c, i) => {
          const end = shots[i + 1]?.at ?? until + 0.25; if (t < c.at - 0.001 || t >= end) return null;
          const z = mix(1, 1.05, Math.min(1, (t - c.at) / Math.max(1.5, end - c.at))), st: React.CSSProperties = { width: '100%', height: '100%', objectFit: c.fit ?? 'cover', transform: `scale(${z})` };
          return <Sequence key={i} from={Math.round(c.at * fps)} layout="none">{isImg(c.src) ? <Img src={staticFile(c.src)} style={st} /> : <OffthreadVideo src={staticFile(c.src)} muted startFrom={Math.round((c.startFrom ?? 0) * fps)} style={st} />}
            {c.credit && <div style={{ position: 'absolute', left: 18, bottom: 12, fontSize: 24, color: 'rgba(255,255,255,.8)', textShadow: '0 1px 4px #000' }}>{c.credit}</div>}</Sequence>;
        })}
        {area === 'framed' && <div style={{ position: 'absolute', inset: 0, boxShadow: 'inset 0 0 90px 30px rgba(0,0,0,.75)' }} />}
      </div>
    </>
  );
};
/** 画框底：讲故事、打比方的那几段，素材放进一个有装饰边的画框里（对标片是暗红玫瑰框）。这里是通用的暗红绒布底加双金线。 */
const FrameArt: React.FC<{ op: number }> = ({ op }) => (
  <div style={{ position: 'absolute', left: 0, top: TOP, width: WW, height: CH, opacity: op, background: 'radial-gradient(1200px 700px at 50% 50%, #5A0F14 0%, #2A0709 60%, #0E0304 100%)' }}>
    <div style={{ position: 'absolute', left: 150, top: 80, right: 150, bottom: 0, height: 890, border: `5px solid ${GOLD}`, borderRadius: 26, boxShadow: `0 0 0 12px rgba(20,4,5,.9), 0 0 0 15px rgba(233,196,106,.55), inset 0 0 40px rgba(0,0,0,.8)` }} />
  </div>
);

/** 名片版式右边那张主持人名片的下半截：名字和一行身份。mode 是 card 时自动出现。 */
export const NameCard: React.FC<{ beats: WBeat[]; name: string; title: string }> = ({ beats, name, title }) => {
  const m = useWMode(beats); if (m !== 'card') return null;
  return (
    <div style={{ position: 'absolute', left: 1274, top: 806, width: 606, height: 188, background: 'linear-gradient(180deg,#14161C,#0A0B0F)', borderTop: `3px solid ${GOLD}`, boxSizing: 'border-box', padding: '26px 34px', display: 'flex', alignItems: 'center', gap: 26, boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>
      <div style={{ fontFamily: W_SUB, fontSize: Math.min(62, Math.floor(230 / Math.max(2, name.length))), letterSpacing: 4, whiteSpace: 'nowrap', transform: 'skewX(-8deg)' }}>{name}</div>
      <div style={{ fontSize: 22, lineHeight: 1.4, whiteSpace: 'pre-line', color: 'rgba(255,255,255,.6)', borderLeft: '2px solid rgba(255,255,255,.3)', paddingLeft: 22 }}>{title}</div>
    </div>
  );
};

/** 字幕：一行，白字深色边，压在内容区底部（画面高度 85% 处），所有版式都在这个位置。一行不超过 16 个字，全片不变色。 */
export const WideSubs: React.FC<{ hide?: number[] }> = ({ hide = [] }) => {
  const t = useT(), { lines } = useClock(), i = lines.findIndex((l, k) => t >= l.start - 0.04 && t < (lines[k + 1]?.start ?? l.end + 0.4) - 0.04), l = lines[i];
  if (!l || hide.includes(l.n) || t > l.end + 0.5) return null;
  const size = Math.min(76, Math.floor(1700 / Math.max(1, l.text.length)));
  return <div style={{ position: 'absolute', left: 0, right: 0, top: 1046, textAlign: 'center', fontFamily: W_SUB, fontSize: size, color: '#fff', whiteSpace: 'nowrap', lineHeight: 1.2, WebkitTextStroke: '7px rgba(8,10,14,.9)', paintOrder: 'stroke fill', textShadow: '0 4px 12px rgba(0,0,0,.6)' }}>{l.text}</div>;
};

/** 大字标题卡：题眼、每一章开头，整屏深色底上一行金色大字加一行小英文（「全球博弈 Global Game」）。人不在。放在 children 里。 */
export const TitleCard: React.FC<{ text: string; en?: string; at: number; hold?: number; lines?: string[] }> = ({ text, en, at, hold = 2, lines }) => {
  const t = useT(); if (t < at - 0.02 || t > at + hold + 0.3) return null; const p = prog(t, at, 0.5), q = 1 - prog(t, at + hold, 0.3);
  return (
    <div style={{ position: 'absolute', left: 0, top: TOP, width: WW, height: CH, background: 'radial-gradient(1300px 700px at 50% 55%, #2A2317 0%, #0D0B08 70%)', opacity: Math.min(1, p * 3) * q, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: W_TITLE, fontWeight: 900, fontSize: Math.min(250, Math.floor(1500 / Math.max(2, text.length))), letterSpacing: mix(60, 24, p), background: `linear-gradient(180deg, ${GOLD2}, ${GOLD} 55%, #9C7A2E)`, WebkitBackgroundClip: 'text', color: 'transparent', filter: `drop-shadow(0 0 30px rgba(233,196,106,.35)) blur(${mix(10, 0, p)}px)` }}>{text}</div>
      {en && <div style={{ fontSize: 34, letterSpacing: 18, color: 'rgba(233,196,106,.7)', marginTop: 10 }}>{en}</div>}
      {lines && <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>{lines.map((x, i) => <div key={i} style={{ fontFamily: W_TITLE, fontSize: 60, letterSpacing: 10, color: 'rgba(255,255,255,.9)', opacity: prog(t, at + 0.5 + i * 0.5, 0.4), transform: `translateX(${(i % 2 ? 1 : -1) * mix(80, 0, prog(t, at + 0.5 + i * 0.5, 0.4))}px)` }}>{x}</div>)}</div>}
    </div>
  );
};

/** 数据面板：一组数据连着讲时用（「造出全球 60% 的电动车、80% 的太阳能板」）。深色科技底上一块玻璃卡：小标题、大数字、一排十格的小图标亮到对应比例。
 *  items 里每项从自己的 at 开始显示，数字会滚上去。人不在，或者 avatar 模式留一个小头像。放在 under 里。 */
export const DataPanel: React.FC<{ title?: string; items: { label: string; value: number; unit?: string; at: number; icon?: string; decimals?: number }[]; from: number; to: number }> = ({ title, items, from, to }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null;
  let k = 0; items.forEach((x, i) => { if (t >= x.at) k = i; }); const it = items[k], p = prog(t, it.at, 0.9), val = it.value * p, lit = Math.round((it.unit === '%' ? it.value / 10 : 10) * p);
  return (
    <div style={{ position: 'absolute', left: 0, top: TOP, width: WW, height: CH, opacity: v, background: 'radial-gradient(1400px 900px at 70% 40%, #1E2B3A 0%, #0C121A 60%, #06090D 100%)' }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.04) 1px, transparent 1px)', backgroundSize: '120px 120px' }} />
      {title && <div style={{ position: 'absolute', left: 0, right: 0, top: 40, textAlign: 'center', fontFamily: W_SUB, fontSize: 84, letterSpacing: 10 }}>{title}<span style={{ color: GOLD }}> ·</span></div>}
      <div style={{ position: 'absolute', left: 250, right: 250, top: 190, height: 690, borderRadius: 26, background: 'linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,.05))', border: '2px solid rgba(255,255,255,.28)', boxShadow: '0 30px 80px rgba(0,0,0,.5)', backdropFilter: 'blur(6px)' }}>
        <div style={{ position: 'absolute', left: 50, top: 34, fontSize: 28, color: 'rgba(255,255,255,.75)' }}><span style={{ color: GOLD, fontFamily: W_NUM }}>{String(k + 1).padStart(2, '0')}</span>　|　{it.label}</div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 90, textAlign: 'center', fontFamily: W_NUM, fontSize: 280, lineHeight: 1.1 }}>{val.toFixed(it.decimals ?? 0)}<span style={{ fontSize: 90, color: GOLD }}>{it.unit}</span></div>
        <div style={{ position: 'absolute', left: 60, right: 60, bottom: 70, display: 'flex', justifyContent: 'space-between' }}>
          {Array.from({ length: 10 }).map((_, i) => <div key={i} style={{ width: 110, height: 110, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 62, background: i < lit ? 'rgba(233,196,106,.22)' : 'rgba(255,255,255,.04)', border: `2px solid ${i < lit ? GOLD : 'rgba(255,255,255,.12)'}`, filter: i < lit ? undefined : 'grayscale(1) opacity(.45)' }}>{it.icon ?? '■'}</div>)}
        </div>
      </div>
    </div>
  );
};
/** 对比条：两三个对象比同一个指标（「我们的工业产值超过美日德总和」）。放在 under 里。 */
export const CompareBars: React.FC<{ title: string; rows: { name: string; value: number; color?: string; at?: number }[]; note?: string; from: number; to: number }> = ({ title, rows, note, from, to }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const mx = Math.max(...rows.map((r) => r.value));
  return (
    <div style={{ position: 'absolute', left: 0, top: TOP, width: WW, height: CH, opacity: v, background: 'radial-gradient(1400px 900px at 30% 40%, #1E2B3A 0%, #0C121A 60%, #06090D 100%)' }}>
      <div style={{ position: 'absolute', left: 250, right: 250, top: 150, height: 760, borderRadius: 26, background: 'linear-gradient(160deg, rgba(255,255,255,.16), rgba(255,255,255,.05))', border: '2px solid rgba(255,255,255,.28)', padding: '50px 70px', boxSizing: 'border-box' }}>
        <div style={{ textAlign: 'center', fontFamily: W_SUB, fontSize: 70, letterSpacing: 8 }}>{title}</div>
        {note && <div style={{ textAlign: 'center', fontSize: 34, color: GOLD, marginTop: 6 }}>{note}</div>}
        <div style={{ marginTop: 50, display: 'flex', flexDirection: 'column', gap: 44 }}>
          {rows.map((r, i) => { const p = prog(t, r.at ?? from + 0.3 + i * 0.4, 0.8); return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
              <div style={{ width: 200, fontSize: 40, textAlign: 'right', color: 'rgba(255,255,255,.85)' }}>{r.name}</div>
              <div style={{ flex: 1, height: 70, background: 'rgba(255,255,255,.07)', borderRadius: 10, overflow: 'hidden' }}><div style={{ width: `${(r.value / mx) * 100 * p}%`, height: '100%', background: r.color ?? `linear-gradient(90deg, #B8943F, ${GOLD2})`, borderRadius: 10 }} /></div>
              <div style={{ width: 170, fontFamily: W_NUM, fontSize: 56 }}>{(r.value * p).toFixed(r.value < 10 ? 1 : 0)}</div>
            </div>); })}
        </div>
      </div>
    </div>
  );
};

/** 竖幅：讲一个有名字的小节（「生产与计价的错配」）时挂在左边的一条暗红竖幅，从上往下写。配满屏素材用，放在 children 里。 */
export const SideBanner: React.FC<{ text: string; from: number; to: number }> = ({ text, from, to }) => {
  const t = useT(), v = vis(t, from, to, 0.4); if (v <= 0) return null;
  return <div style={{ position: 'absolute', left: 0, top: TOP, width: 250, height: CH, opacity: v, transform: `translateX(${mix(-250, 0, prog(t, from, 0.4))}px)`, background: 'linear-gradient(180deg,#8E1B20,#5C0F13)', borderRight: `4px solid ${GOLD}`, display: 'flex', justifyContent: 'center', paddingTop: 40, boxSizing: 'border-box', boxShadow: '20px 0 50px rgba(0,0,0,.5)' }}><div style={{ writingMode: 'vertical-rl', fontFamily: W_TITLE, fontWeight: 900, fontSize: Math.min(120, Math.floor(880 / Math.max(4, Math.ceil(text.length / 2)))), letterSpacing: 12, color: GOLD2, lineHeight: 1.15, height: 900 }}>{text}</div></div>;
};
/** 话题角标：一章里分小点讲时，左上角一块小牌子写这一点的名字（「量子科技」「工业软件」）。放在 children 里。 */
export const TopicTag: React.FC<{ text: string; from: number; to: number }> = ({ text, from, to }) => {
  const t = useT(), v = vis(t, from, to, 0.3); if (v <= 0) return null;
  return <div style={{ position: 'absolute', left: 36, top: TOP + 34, opacity: v, transform: `translateY(${mix(-30, 0, prog(t, from, 0.3))}px)`, fontFamily: W_SUB, fontSize: 50, letterSpacing: 6, color: '#fff', background: 'linear-gradient(135deg, rgba(60,45,120,.92), rgba(30,24,60,.92))', border: `2px solid ${GOLD}`, borderRadius: 12, padding: '10px 34px', boxShadow: '0 10px 30px rgba(0,0,0,.5)' }}>{text}</div>;
};
/** 黑板字：压在主持人全景上的一个大词（主持人身后的黑板、身边的空处），彩色描边大字，讲到关键词时弹出来。放在 children 里。 */
export const PopWord: React.FC<{ text: string; at: number; until: number; x?: number; y?: number; color?: string; size?: number }> = ({ text, at, until, x = 1000, y = 300, color = '#49E0C6', size = 130 }) => {
  const t = useT(), v = vis(t, at, until); if (v <= 0) return null; const p = prog(t, at, 0.3);
  return <div style={{ position: 'absolute', left: x, top: y, opacity: v, fontFamily: W_SUB, fontSize: size, letterSpacing: 8, color, WebkitTextStroke: '10px rgba(10,20,30,.9)', paintOrder: 'stroke fill', transform: `scale(${mix(1.5, 1, p)}) rotate(-3deg)`, textShadow: `0 0 40px ${color}` }}>{text}</div>;
};
