// 相框口播线的版式引擎。输入是 scripts/frame_plan.py 生成的 props.json，每期不写代码。
// 层次（由下到上）：纸纹底 → 画面窗[ 素材或卡片 → 人 → 聚光遮罩 → 贴纸和清单 → 字幕 → 大字 ] → 标题 → 署名条。
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import { c01, H, inOut, K, mix, outCubic, outQuint, pop, ramp, SANS, SERIF, SLANT, useFonts, useT, W, WIN } from './base';
import { CARDS } from './cards';

export type Face = { x: number; y: number; w: number };
export type Show = { kind: 'video' | 'image'; src: string; from?: number; fit?: 'cover' | 'pad'; pan?: boolean };
export type BigLine = { t: number; text: string; tone?: 'white' | 'accent' | 'hot'; size?: 'm' | 'l' | 'xl' };
export type Base = {
  t: number;
  /** P 人铺满 · S 聚光对比 · E 收束金句 · R 素材全窗 · C 画中画（人缩成小圆）· G 生成卡片 */
  do: 'P' | 'S' | 'E' | 'R' | 'C' | 'G';
  zoom?: number;
  person?: 'full' | 'bubble' | 'off';
  show?: Show;
  card?: { name: string; props: Record<string, unknown>; cues: number[] };
  lines?: BigLine[];
  /** 聚光打在素材上而不是人身上（「而是……」那半句配画面时用）。 */
  spotOn?: 'person' | 'show';
};
export type Overlay =
  | { kind: 'K'; t: number; end: number; text: string; side: 'left' | 'right'; row?: number }
  | { kind: 'L'; t: number; end: number; side: 'left' | 'right'; items: { t: number; text: string }[] };
export type Sub = { start: number; end: number; text: string };
export type FrameProps = {
  fps: number; total: number;
  title: [string, string, string];
  speaker: { name: string; titles: string[] };
  media: { person: string; voice: string; vw: number; vh: number; face: Face; plate: string; logo: string };
  subs: Sub[]; hot: string[];
  base: Base[]; overlays: Overlay[];
};

const BUBBLE = { d: 206, x: WIN.w - 206 - 38, y: 30 };
const MODE_DUR = 0.42;
const personMode = (b: Base): 'full' | 'bubble' | 'off' => b.person ?? (b.do === 'R' || b.do === 'G' ? 'off' : b.do === 'C' ? 'bubble' : 'full');
const baseAt = (base: Base[], t: number) => { let i = 0; base.forEach((b, k) => { if (t >= b.t) i = k; }); return i; };

type St = { x: number; y: number; w: number; h: number; r: number; s: number; ax: number; ay: number; ring: number };
const stFull = (m: FrameProps['media'], zoom: number): St => ({ x: 0, y: 0, w: WIN.w, h: WIN.h, r: 0, s: Math.max(WIN.w / m.vw, WIN.h / m.vh) * zoom, ax: m.face.x / m.vw, ay: m.face.y / m.vh, ring: 0 });
const stBubble = (m: FrameProps['media']): St => ({ x: BUBBLE.x, y: BUBBLE.y, w: BUBBLE.d, h: BUBBLE.d, r: BUBBLE.d / 2, s: (0.4 * BUBBLE.d) / m.face.w, ax: 0.5, ay: 0.44, ring: 1 });
const lerpSt = (a: St, b: St, p: number): St => ({ x: mix(a.x, b.x, p), y: mix(a.y, b.y, p), w: mix(a.w, b.w, p), h: mix(a.h, b.h, p), r: mix(a.r, b.r, p), s: mix(a.s, b.s, p), ax: mix(a.ax, b.ax, p), ay: mix(a.ay, b.ay, p), ring: mix(a.ring, b.ring, p) });

/** 人：铺满（可硬切推近）、缩成右上角小圆（0.42 秒缓动）、离场（硬切）。 */
const Person: React.FC<{ p: FrameProps }> = ({ p }) => {
  const t = useT(), i = baseAt(p.base, t), b = p.base[i], prev = p.base[i - 1], m = p.media;
  const mode = personMode(b), pm = prev ? personMode(prev) : mode;
  const target = (x: Base, mo: string) => (mo === 'bubble' ? stBubble(m) : stFull(m, x.zoom ?? 1));
  let st: St | null = mode === 'off' ? null : target(b, mode);
  // 铺满和小圆之间缓动；其余都是硬切
  if (prev && mode !== 'off' && pm !== 'off' && mode !== pm) st = lerpSt(target(prev, pm), target(b, mode), inOut((t - b.t) / MODE_DUR));
  // 素材之后出小圆、小圆之后回素材：小圆弹入或淡出，不拖着走
  let op = 1, sc = 1;
  if (mode === 'bubble' && pm === 'off') { sc = pop(t, b.t, 0.4); op = c01((t - b.t) / 0.15); }
  if (!st) return null;
  const vw = m.vw * st.s, vh = m.vh * st.s;
  const left = Math.min(0, Math.max(st.w - vw, st.ax * st.w - m.face.x * st.s)), top = Math.min(0, Math.max(st.h - vh, st.ay * st.h - m.face.y * st.s));
  return (
    <div style={{ position: 'absolute', left: st.x, top: st.y, width: st.w, height: st.h, borderRadius: st.r, overflow: 'hidden', opacity: op, transform: `scale(${sc})`, boxShadow: st.ring > 0.01 ? `0 0 0 ${6 * st.ring}px #fff, 0 0 0 ${9 * st.ring}px ${K.green}, 0 18px 40px rgba(20,40,25,${0.28 * st.ring})` : 'none' }}>
      <OffthreadVideo src={staticFile(m.person)} muted style={{ position: 'absolute', left, top, width: vw, height: vh, maxWidth: 'none' }} />
    </div>
  );
};

/** 素材：横版铺满；竖版或截图用自身模糊垫底，居中完整显示。pan 给静态图一个缓慢推移，避免画面停滞。 */
const ShowLayer: React.FC<{ show: Show; t0: number; t1: number }> = ({ show, t0, t1 }) => {
  const t = useT(), { fps } = useVideoConfig(), k = c01((t - t0) / Math.max(0.1, t1 - t0)), z = show.pan === false ? 1 : mix(1.0, 1.06, k);
  const media = (style: React.CSSProperties) => show.kind === 'image'
    ? <Img src={staticFile(show.src)} style={style} />
    : <OffthreadVideo src={staticFile(show.src)} muted startFrom={Math.round((show.from ?? 0) * fps)} style={style} />;
  const fill: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%' };
  return (
    <Sequence from={Math.round(t0 * fps)} durationInFrames={Math.max(1, Math.round((t1 - t0) * fps))} layout="none">
      <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#111' }}>
        {show.fit === 'pad' ? (
          <>
            {media({ ...fill, objectFit: 'cover', filter: 'blur(28px) brightness(.82) saturate(1.1)', transform: 'scale(1.2)' })}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {media({ height: '100%', width: 'auto', maxWidth: '100%', objectFit: 'contain', boxShadow: '0 12px 50px rgba(0,0,0,.45)', transform: `scale(${mix(0.96, 1, k)})` })}
            </div>
          </>
        ) : media({ ...fill, objectFit: 'cover', transform: `scale(${z})` })}
      </div>
    </Sequence>
  );
};

/** 垫在人下面的东西：素材或生成卡片。每个 base 只在自己的时间段里渲染。 */
const Under: React.FC<{ p: FrameProps }> = ({ p }) => {
  const t = useT();
  return (
    <>
      {p.base.map((b, i) => {
        const t1 = p.base[i + 1]?.t ?? p.total;
        if (t < b.t || t >= t1) return null;
        if (b.card) { const Card = CARDS[b.card.name]; if (!Card) throw new Error('没有这张卡：' + b.card.name); return <Card key={i} {...(b.card.props as object)} t0={b.t} t1={t1} cues={b.card.cues} bubble={personMode(b) === 'bubble'} />; }
        if (b.show) return <ShowLayer key={i} show={b.show} t0={b.t} t1={t1} />;
        return null;
      })}
    </>
  );
};

/** 聚光：画面压黑，只留一个羽化的圆。 */
const Spot: React.FC<{ p: FrameProps }> = ({ p }) => {
  const t = useT(), i = baseAt(p.base, t), b = p.base[i];
  if (b.do !== 'S') return null;
  const prev = p.base[i - 1], cont = prev?.do === 'S', a = cont ? 1 : ramp(t, b.t, 0.22);
  const m = p.media, st = stFull(m, b.zoom ?? 1);
  const vw = m.vw * st.s, vh = m.vh * st.s, left = Math.min(0, Math.max(WIN.w - vw, st.ax * WIN.w - m.face.x * st.s)), top = Math.min(0, Math.max(WIN.h - vh, st.ay * WIN.h - m.face.y * st.s));
  const onShow = b.spotOn === 'show';
  const cx = onShow ? WIN.w * 0.7 : left + m.face.x * st.s, cy = onShow ? WIN.h * 0.46 : top + (m.face.y + m.face.w * 1.25) * st.s;
  const r = mix(WIN.h * 0.9, WIN.h * 0.36, a);
  return <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${cx}px ${cy}px, rgba(0,0,0,0) ${r * 0.72}px, rgba(0,0,0,${0.96 * a}) ${r}px)` }} />;
};

const STROKE = '#161616';
const outline = (px: number): React.CSSProperties => ({ WebkitTextStroke: `${px}px ${STROKE}`, paintOrder: 'stroke fill', textShadow: '0 4px 10px rgba(0,0,0,.45)' });

/** 字幕：贴画面窗底边，一次一短句，位置全片不动。热词放大变黄。 */
const Subs: React.FC<{ p: FrameProps }> = ({ p }) => {
  const t = useT(), b = p.base[baseAt(p.base, t)];
  if (b.do === 'S' || b.do === 'E') return null;                    // 大字出现时不重复打字幕
  const l = p.subs.find((x) => t >= x.start - 0.03 && t < x.end);
  if (!l) return null;
  let parts: { s: string; hot: boolean }[] = [{ s: l.text, hot: false }];
  p.hot.forEach((h) => { parts = parts.flatMap((x) => (x.hot || !x.s.includes(h) ? [x] : x.s.split(h).flatMap((y, k, arr) => (k < arr.length - 1 ? [{ s: y, hot: false }, { s: h, hot: true }] : [{ s: y, hot: false }])))); });
  const n = l.text.length + parts.filter((x) => x.hot).reduce((a, x) => a + x.s.length * 0.24, 0), size = Math.min(54, Math.floor(980 / Math.max(1, n)));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 26, textAlign: 'center', fontFamily: SLANT, fontSize: size, lineHeight: 1.3, color: '#fff', whiteSpace: 'pre', letterSpacing: 1, opacity: c01((t - l.start + 0.03) / 0.08), ...outline(Math.max(5, size * 0.13)) }}>
      {parts.filter((x) => x.s).map((x, k) => <span key={k} style={x.hot ? { color: K.hot, fontSize: size * 1.24 } : undefined}>{x.s}</span>)}
    </div>
  );
};

/** 橙刷字：一道橙色从左往右刷出，白色斜体字跟着露出来。 */
const Brush: React.FC<{ text: string; at: number; end: number; size?: number; align: 'left' | 'right' }> = ({ text, at, end, size = 62, align }) => {
  const t = useT(), a = outQuint((t - at) / 0.32), tx = outCubic((t - at - 0.1) / 0.3), out = 1 - c01((t - end) / 0.2);
  if (t < at || out <= 0) return null;
  return (
    <div style={{ position: 'relative', display: 'inline-block', padding: '0 14px', opacity: out, transform: `rotate(-2.5deg)`, transformOrigin: align === 'left' ? 'left center' : 'right center' }}>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: size * 0.02, height: size * 0.5, background: K.orange, borderRadius: size * 0.12, transform: `scaleX(${a})`, transformOrigin: 'left center' }} />
      <div style={{ position: 'relative', fontFamily: SLANT, fontSize: size, lineHeight: 1.18, color: '#fff', whiteSpace: 'nowrap', clipPath: `inset(-20% ${100 - tx * 104}% -20% -4%)`, ...outline(size * 0.1) }}>{text}</div>
    </div>
  );
};

/** 贴纸和清单：只放在人脸左右两侧，不压脸。 */
const Overlays: React.FC<{ p: FrameProps }> = ({ p }) => {
  const t = useT(), m = p.media, b = p.base[baseAt(p.base, t)];
  if (personMode(b) !== 'full' || b.do === 'S' || b.do === 'E') return null;
  const st = stFull(m, b.zoom ?? 1), vw = m.vw * st.s, vh = m.vh * st.s;
  const left = Math.min(0, Math.max(WIN.w - vw, st.ax * WIN.w - m.face.x * st.s)), top = Math.min(0, Math.max(WIN.h - vh, st.ay * WIN.h - m.face.y * st.s));
  const fx = left + m.face.x * st.s, fy = top + m.face.y * st.s, fw = m.face.w * st.s, gap = fw * 0.5 + 34;
  const fit = (side: 'left' | 'right', n: number, max: number) => Math.max(44, Math.min(max, Math.floor(((side === 'left' ? fx - gap : WIN.w - fx - gap) - 44) / Math.max(1, n))));
  const box = (side: 'left' | 'right', y: number): React.CSSProperties => side === 'left'
    ? { position: 'absolute', right: WIN.w - (fx - gap), top: y, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 14 }
    : { position: 'absolute', left: fx + gap, top: y, display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 14 };
  return (
    <>
      {p.overlays.map((o, i) => {
        if (t < o.t || t > o.end + 0.25) return null;
        if (o.kind === 'K') return <div key={i} style={box(o.side, fy + fw * 0.35 + (o.row ?? 0) * 92)}><Brush text={o.text} at={o.t} end={o.end} size={fit(o.side, o.text.length, 68)} align={o.side} /></div>;
        const size = fit(o.side, Math.max(...o.items.map((x) => x.text.length)), 58);
        return <div key={i} style={box(o.side, fy - fw * 0.2)}>{o.items.map((x, k) => <Brush key={k} text={x.text} at={x.t} end={o.end} size={size} align={o.side} />)}</div>;
      })}
    </>
  );
};

/** 聚光和收束时的大字：一行一拍。 */
const BigText: React.FC<{ p: FrameProps }> = ({ p }) => {
  const t = useT(), i = baseAt(p.base, t), b = p.base[i];
  if ((b.do !== 'S' && b.do !== 'E') || !b.lines) return null;
  const SZ = { m: 60, l: 78, xl: 96 }, COL = { white: '#fff', accent: K.orange, hot: K.hot };
  const end = p.base[i + 1]?.t ?? p.total;
  if (b.do === 'E') {
    const shown = b.lines.filter((l) => t >= l.t), cur = shown[shown.length - 1];   // 收束：底部一次只留一行
    if (!cur) return null;
    const fs = Math.min(SZ[cur.size ?? 'xl'], Math.floor(1000 / cur.text.length)), a = pop(t, cur.t, 0.34);
    return <div style={{ position: 'absolute', left: 0, right: 0, bottom: 18, textAlign: 'center', fontFamily: SLANT, fontSize: fs, color: COL[cur.tone ?? 'white'], whiteSpace: 'nowrap', transform: `scale(${mix(0.86, 1, a)})`, transformOrigin: 'center bottom', opacity: c01((t - cur.t) / 0.1), ...outline(fs * 0.1) }}>{cur.text}</div>;
  }
  const onShow = b.spotOn === 'show', m = p.media, room = onShow ? 900 : Math.max(300, m.face.x * Math.max(WIN.w / m.vw, WIN.h / m.vh) - m.face.w * 0.5 - 70);   // 聚光打在人身上时，字只占人脸左边
  return (
    <div style={{ position: 'absolute', left: 44, right: 44, top: onShow ? undefined : WIN.h * 0.42, bottom: onShow ? 80 : undefined, display: 'flex', flexDirection: 'column', gap: 6, alignItems: onShow ? 'center' : 'flex-start', opacity: 1 - c01((t - end + 0.12) / 0.12) }}>
      {b.lines.map((l, k) => {
        if (t < l.t) return null;
        const fs = Math.max(40, Math.min(SZ[l.size ?? 'm'], Math.floor((room * (l.size === 'l' ? 1.16 : 1)) / l.text.length))), a = outQuint((t - l.t) / 0.3);
        return <div key={k} style={{ fontFamily: SLANT, fontSize: fs, color: COL[l.tone ?? 'white'], whiteSpace: 'nowrap', marginLeft: 0, opacity: a, transform: `translateX(${mix(-28, 0, a)}px)`, ...(l.tone === 'accent' ? { textShadow: '0 4px 14px rgba(0,0,0,.6)', WebkitTextStroke: `${fs * 0.04}px #5a2c00`, paintOrder: 'stroke fill' } : outline(fs * 0.08)) }}>{l.text}</div>;
      })}
    </div>
  );
};

/** 标题：三行，第二行进黄条。字数多了自动缩字，不换行。 */
const Title: React.FC<{ title: [string, string, string] }> = ({ title }) => {
  const fit = (s: string, max: number, room: number) => Math.min(max, Math.floor(room / Math.max(1, Array.from(s).reduce((a, c) => a + (/[“”‘’"']/.test(c) ? 0.5 : c.charCodeAt(0) < 128 ? 0.55 : 1), 0))));
  const s1 = fit(title[0], 64, 900), s2 = fit(title[1], 60, 560), s3 = fit(title[2], 64, 940);
  const line: React.CSSProperties = { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontFamily: SERIF, fontWeight: 700, color: K.ink, whiteSpace: 'nowrap', letterSpacing: 2 };
  return (
    <>
      <div style={{ ...line, top: 290 - s1 * 0.74, fontSize: s1, lineHeight: 1.45 }}>{title[0]}</div>
      <div style={{ position: 'absolute', left: 215, top: 343, width: 670, height: 90, borderRadius: 24, background: `linear-gradient(180deg, #F4BC3D, ${K.yellow})`, boxShadow: '0 3px 0 rgba(180,120,10,.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: s2, color: '#fff', letterSpacing: 6, whiteSpace: 'nowrap', textShadow: '0 2px 0 rgba(170,110,0,.35)' }}>{title[1]}</div>
      </div>
      <div style={{ ...line, top: 502 - s3 * 0.74, fontSize: s3, lineHeight: 1.45 }}>{title[2]}</div>
    </>
  );
};

/** 署名条：名字、两行头衔、标志。每期唯一会改的就是名字和头衔（brands/yuedu/speaker.json）。 */
const NameBar: React.FC<{ speaker: FrameProps['speaker']; logo: string }> = ({ speaker, logo }) => {
  const n = Array.from(speaker.name).length, ns = n <= 3 ? 76 : n === 4 ? 68 : 58, longest = Math.max(...speaker.titles.map((x) => x.length), 1), ts = Math.min(34, Math.floor(400 / longest));
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, top: 1498, height: 104, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: SERIF, fontWeight: 900, fontSize: ns, color: K.greenDeep, letterSpacing: 6, whiteSpace: 'nowrap' }}>{speaker.name}</div>
      <div style={{ width: 3, height: 72, background: K.greenDeep, margin: '0 26px 0 20px', borderRadius: 2 }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontFamily: SANS, fontWeight: 400, fontSize: ts, color: '#2E3A30', lineHeight: 1.1, whiteSpace: 'nowrap' }}>
        {speaker.titles.slice(0, 2).map((x, i) => <div key={i}>{x}</div>)}
      </div>
      <Img src={staticFile(logo)} style={{ width: 80, height: 82, marginLeft: 24 }} />
    </div>
  );
};

export const YueduFrame: React.FC<FrameProps> = (p) => {
  useFonts();
  return (
    <AbsoluteFill style={{ background: K.paper }}>
      <Img src={staticFile(p.media.plate)} style={{ position: 'absolute', left: 0, top: 0, width: W, height: H }} />
      <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, overflow: 'hidden', background: '#0c0c0c' }}>
        <Under p={p} />
        <Person p={p} />
        <Spot p={p} />
        <Overlays p={p} />
        <Subs p={p} />
        <BigText p={p} />
      </div>
      <Title title={p.title} />
      <NameBar speaker={p.speaker} logo={p.media.logo} />
      <Audio src={staticFile(p.media.voice)} />
    </AbsoluteFill>
  );
};
