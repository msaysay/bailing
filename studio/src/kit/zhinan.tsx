// 「网格取景框口播风」（对标直男财经的竖屏口播）。整条片子由 plan.json 驱动：scripts/zhinan.py 生成，用 --props 传进来。
// 拆解和每个数的出处：docs/对标拆解-直男财经.md（第十节「复刻规格」）。画布 1080×1920。
// 五样东西：① 人全屏（1.0 / 1.1 倍来回换、偶尔怼脸）② 网格底取景框面板（框不动，里面的素材硬切）③ 满屏素材（可带小人窗）
//           ④ 网格底卡片（大黄字 + 图 / 歪着的文件截图）⑤ 叠在人身上的东西（胸口素材窗、表情符号、黄数字、白大字、黄词牌、身后大黄字）
// 全部硬切，不用淡入淡出；字幕是特粗宋体向右斜，白字黑色硬投影，一句一句整句出。
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export type ZnClip = { src: string; at: number; startFrom?: number };
export type ZnBeat = { at: number; mode: 'full' | 'punch' | 'panel' | 'cover' | 'card'; zoom?: number; clips?: ZnClip[]; mini?: boolean; word?: string; img?: string; doc?: string; mark?: [number, number, number] };
export type ZnSub = { from: number; to: number; text: string; hot?: string[] };
export type ZnOver = { type: 'media' | 'emoji' | 'float' | 'num' | 'word' | 'tags' | 'behind'; from: number; to: number; src?: string; startFrom?: number; text?: string; sub?: string; items?: string[]; ats?: number[] };
export type ZnMatte = { from: number; to: number; dir: string };
export type ZnPlan = {
  video: string; audio?: string; total: number; vw: number; vh: number; face: { x: number; y: number; w: number };
  beats: ZnBeat[]; subs: ZnSub[]; overs?: ZnOver[]; mattes?: ZnMatte[];
  sign?: { badge?: string } | null; note?: string; theme?: { yellow?: string };
};
export const znDefault: ZnPlan = { video: '', total: 10, vw: 1080, vh: 1920, face: { x: 540, y: 710, w: 310 }, beats: [{ at: 0, mode: 'full' }], subs: [] };

const W = 1080, H = 1920;
const FRAME = { x: 22, y: 380, w: 1036, h: 797 }, TAB = { x: 85, y: 446, w: 272, h: 41 }, WIN = { x: 83, y: 522, w: 912, h: 514 }, BAR = { x: 160, y: 1089, w: 758, h: 14 };
const MINI = { x: 383, y: 1336, w: 321, h: 464 }, SUB_Y = 1209, SUB_SIZE = 69, CHEST_Y = 1284, CHEST_W = 952, CHEST_H = 536;
const FACE_FULL = 0.29, FACE_PUNCH = 0.52, FACE_Y = 0.37;
const c01 = (x: number) => Math.max(0, Math.min(1, x)), back = (p: number) => { const c = 1.7, q = c01(p) - 1; return 1 + (c + 1) * q * q * q + c * q * q; };
const src = (s: string) => (/^(https?:|data:)/.test(s) ? s : staticFile(s));
const isVid = (s: string) => /\.(mp4|mov|webm|m4v)$/i.test(s);
const rnd = (i: number, k = 1) => { const x = Math.sin((i + 1) * 91.7 * k) * 43758.5453; return x - Math.floor(x); };

/** 网格底：上面灰绿、下面近黑，压一层细格子。 */
const Grid: React.FC<{ children?: React.ReactNode }> = ({ children }) => <AbsoluteFill style={{ background: 'linear-gradient(180deg,#444237 0%,#35342B 45%,#1E1D17 78%)' }}>
  <AbsoluteFill style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,.055) 2px,transparent 2px),linear-gradient(90deg,rgba(255,255,255,.055) 2px,transparent 2px)', backgroundSize: '60px 60px', WebkitMaskImage: 'linear-gradient(180deg,#000 0%,#000 55%,transparent 88%)' }} />{children}</AbsoluteFill>;

/** 素材：视频或图片，铺满所在的框。 */
const Media: React.FC<{ clip: ZnClip; t: number; fps: number; fit?: 'cover' | 'contain' }> = ({ clip, t, fps, fit = 'cover' }) => {
  const st: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit };
  if (!isVid(clip.src)) return <Img src={src(clip.src)} style={{ ...st, transform: `scale(${1 + 0.05 * c01((t - clip.at) / 4)})` }} />;                    // 图片慢慢推一点，不然像卡住了
  return <Sequence from={Math.round(clip.at * fps)} layout="none"><OffthreadVideo src={src(clip.src)} startFrom={Math.round((clip.startFrom ?? 0) * fps)} muted style={st} /></Sequence>;
};
const cur = (clips: ZnClip[] | undefined, t: number) => (clips ?? []).reduce<ZnClip | undefined>((a, c) => (t >= c.at ? c : a), undefined) ?? (clips ?? [])[0];

export const Zhinan: React.FC<ZnPlan> = (P) => {
  const { fps } = useVideoConfig(), f = useCurrentFrame(), t = f / fps, Y = P.theme?.yellow ?? '#FAF106';
  const [h] = React.useState(() => delayRender('zhinan-font'));
  React.useEffect(() => { Promise.all([new FontFace('ZN-Sub', `url(${staticFile('fonts/SourceHanSerifSC-Heavy.otf')})`, { weight: '100 900' }).load(), new FontFace('ZN-Big', `url(${staticFile('fonts/AlimamaShuHeiTi-Bold.ttf')})`, { weight: '100 900' }).load()]).then((fs) => fs.forEach((x) => document.fonts.add(x))).catch(() => undefined).then(() => continueRender(h)); }, [h]);
  const FS = '"ZN-Sub", "Songti SC", "SimSun", serif', FB = '"ZN-Big", "PingFang SC", "Microsoft YaHei", sans-serif';
  const bi = P.beats.reduce((a, b, i) => (t >= b.at ? i : a), 0), beat = P.beats[bi], since = t - beat.at, mode = beat.mode;
  // 人怎么摆：原片铺满，再以脸为中心放大到目标脸宽；脸的落点固定在画面 37% 高的地方（放不下就贴边）
  const place = (faceW: number, bw = W, bh = H, cy = FACE_Y) => { const s = Math.max(bw / P.vw, bh / P.vh, (faceW * bw) / P.face.w), b = { left: bw / 2 - P.face.x * s, top: bh * cy - P.face.y * s, width: P.vw * s, height: P.vh * s }; return { ...b, left: Math.min(0, Math.max(bw - b.width, b.left)), top: Math.min(0, Math.max(bh - b.height, b.top)) }; };
  const person = (box: { left: number; top: number; width: number; height: number }) => <OffthreadVideo src={src(P.video)} muted style={{ position: 'absolute', left: box.left, top: box.top, width: box.width, height: box.height, maxWidth: 'none' }} />;
  const faceNat = (P.face.w * Math.max(W / P.vw, H / P.vh)) / W, fullBox = place(mode === 'punch' ? Math.max(FACE_PUNCH, faceNat * 1.5) : Math.max(FACE_FULL, faceNat) * (beat.zoom ?? 1));
  const onPerson = mode === 'full' || mode === 'punch';
  const overs = (P.overs ?? []).filter((o) => t >= o.from && t < o.to), behind = onPerson ? overs.filter((o) => o.type === 'behind') : [], matte = (P.mattes ?? []).find((m) => t >= m.from && t < m.to);
  const pop = (o: ZnOver, d = 0.12) => 0.86 + 0.14 * back((t - o.from) / d);
  const clip = cur(beat.clips, t), badge = P.sign?.badge;

  let stage: React.ReactNode;
  if (mode === 'panel') {
    const prog = c01(t / Math.max(1, P.total));
    stage = <Grid>
      <div style={{ position: 'absolute', left: FRAME.x, top: FRAME.y, width: FRAME.w, height: FRAME.h, background: 'linear-gradient(180deg,#525335,#3F4020 40%,#3A3B1E)', border: '3px solid #BEC172', boxShadow: '0 0 0 9px rgba(190,193,114,.16), 0 30px 80px rgba(0,0,0,.5)' }}>
        {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([a, b], i) => <div key={i} style={{ position: 'absolute', [a ? 'right' : 'left']: -3, [b ? 'bottom' : 'top']: -3, width: 34, height: 34, borderColor: '#E9EC9A', borderStyle: 'solid', borderWidth: `${b ? 0 : 6}px ${a ? 6 : 0}px ${b ? 6 : 0}px ${a ? 0 : 6}px` } as React.CSSProperties} />)}
      </div>
      {badge ? <div style={{ position: 'absolute', left: TAB.x, top: TAB.y, minWidth: TAB.w, height: TAB.h, padding: '0 16px', boxSizing: 'border-box', background: '#171914', color: '#fff', fontFamily: FB, fontSize: 28, lineHeight: `${TAB.h}px`, whiteSpace: 'nowrap', display: 'flex', gap: 12 }}><span style={{ color: '#BEC172' }}>▱</span>@{badge}</div> : <div style={{ position: 'absolute', left: TAB.x, top: TAB.y, width: 120, height: TAB.h, background: '#171914' }} />}
      <div style={{ position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, overflow: 'hidden', background: '#000', outline: `3px solid ${Y}` }}>{clip ? <Media key={clip.src + clip.at} clip={clip} t={t} fps={fps} /> : null}</div>
      <div style={{ position: 'absolute', left: BAR.x, top: BAR.y, width: BAR.w, height: BAR.h, borderRadius: 7, background: '#5B5D5A' }}><div style={{ width: `${prog * 100}%`, height: '100%', borderRadius: 7, background: Y }} /><div style={{ position: 'absolute', left: `calc(${prog * 100}% - 13px)`, top: -8, width: 26, height: 30, borderRadius: 8, background: '#fff', border: '3px solid #171914', boxSizing: 'border-box' }} /></div>
    </Grid>;
  } else if (mode === 'cover') {
    const mb = place(0.36 * (MINI.w / W) * (W / MINI.w), MINI.w, MINI.h, 0.42);
    stage = <AbsoluteFill style={{ background: '#000' }}>{clip ? <Media key={clip.src + clip.at} clip={clip} t={t} fps={fps} /> : null}
      <AbsoluteFill style={{ background: 'linear-gradient(180deg,transparent 52%,rgba(0,0,0,.5) 68%,rgba(0,0,0,.2) 100%)' }} />
      {beat.mini ? <div style={{ position: 'absolute', left: MINI.x, top: MINI.y, width: MINI.w, height: MINI.h, borderRadius: 24, overflow: 'hidden', border: '3px solid #E6C74E', boxSizing: 'border-box', boxShadow: '0 16px 40px rgba(0,0,0,.5)' }}>{person(mb)}</div> : null}</AbsoluteFill>;
  } else if (mode === 'card') {
    const n = (beat.word ?? '').length || 1, fs = Math.min(355, 860 / n);
    stage = <Grid>
      {beat.word ? <><div style={{ position: 'absolute', left: 150, top: 60, width: 780, height: 780, borderRadius: '50%', background: 'rgba(20,20,16,.55)' }} />{[0, 1, 2, 3].map((i) => <div key={i} style={{ position: 'absolute', left: 150, top: 420 + i * 78, width: 440 - i * 40, height: 34, background: '#fff', opacity: 0.92 }} />)}
        <div style={{ position: 'absolute', left: 0, right: 0, top: 99, textAlign: 'center', fontFamily: FB, fontSize: fs, lineHeight: 1, color: Y, whiteSpace: 'nowrap', transform: `scale(${0.9 + 0.1 * back(since / 0.14)})` }}>{beat.word}</div></> : null}
      {beat.img ? <Img src={src(beat.img)} style={{ position: 'absolute', left: 40, top: beat.word ? 99 + fs * 0.62 : 240, width: 1000, height: beat.word ? H - 99 - fs * 0.62 : 900, objectFit: 'contain', objectPosition: beat.word ? 'bottom' : 'center', filter: 'drop-shadow(0 20px 50px rgba(0,0,0,.55))' }} /> : null}
      {beat.doc ? <div style={{ position: 'absolute', left: 60, top: 420, width: 960, height: 690, transform: 'rotate(-2deg)', border: `6px solid ${Y}`, background: '#fff', overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.6)' }}><Img src={src(beat.doc)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
        {beat.mark ? <div style={{ position: 'absolute', left: `${beat.mark[0] * 100}%`, top: `${beat.mark[1] * 100}%`, width: `${beat.mark[2] * c01((since - 0.5) / 0.5) * 100}%`, height: 46, background: '#FDF705', opacity: 0.55, mixBlendMode: 'multiply' }} /> : null}</div> : null}
      {beat.mini ? <div style={{ position: 'absolute', left: MINI.x, top: MINI.y, width: MINI.w, height: MINI.h, borderRadius: 24, overflow: 'hidden', border: '3px solid #E6C74E', boxSizing: 'border-box' }}>{person(place(0.36, MINI.w, MINI.h, 0.42))}</div> : null}
    </Grid>;
  } else {
    // 人全屏 / 怼脸。身后大黄字：夹在原画面和抠出来的人之间（那几秒要先抠像，scripts/zhinan.py 会自动做）
    const k = matte ? Math.round((t - matte.from) * fps) + 1 : 0;
    stage = <AbsoluteFill style={{ background: '#000' }}>{person(fullBox)}
      {behind.map((o, i) => { const n = (o.text ?? '').length || 1, fs = Math.min(355, 900 / n); return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: Math.max(50, fullBox.top + (P.face.y - P.face.w * 0.85) * (fullBox.height / P.vh) - fs * 0.72), textAlign: 'center', fontFamily: FB, fontSize: fs, lineHeight: 1, color: Y, whiteSpace: 'nowrap', textShadow: '0 8px 30px rgba(0,0,0,.35)' }}>{o.text}</div>; })}
      {behind.length && matte ? <Img src={src(`${matte.dir}/${String(k).padStart(5, '0')}.webp`)} style={{ position: 'absolute', left: fullBox.left, top: fullBox.top, width: fullBox.width, height: fullBox.height, maxWidth: 'none' }} /> : null}
    </AbsoluteFill>;
  }

  const sub = P.subs.find((s) => t >= s.from && t < s.to), chestBusy = overs.some((o) => o.type === 'word');
  return <AbsoluteFill style={{ background: '#000' }}>
    {stage}
    {/* 叠在人身上的东西：只在人全屏时出 */}
    {onPerson ? overs.map((o, i) => {
      if (o.type === 'media' && o.src) { const im = !isVid(o.src); return <div key={i} style={{ position: 'absolute', left: (W - (im ? 786 : CHEST_W)) / 2, top: CHEST_Y, width: im ? 786 : CHEST_W, height: im ? 506 : CHEST_H, overflow: 'hidden', background: '#000', transform: `scale(${pop(o, 0.1)})`, transformOrigin: 'top center' }}><Media clip={{ src: o.src, at: o.from, startFrom: o.startFrom }} t={t} fps={fps} /></div>; }
      if (o.type === 'emoji') return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: CHEST_Y + 20, textAlign: 'center', fontSize: 400, lineHeight: 1.1, transform: `scale(${pop(o, 0.16)})` }}>{o.text}</div>;
      if (o.type === 'float') return <React.Fragment key={i}>{Array.from({ length: 14 }, (_, j) => { const p = c01((t - o.from - rnd(j) * 0.5) / (o.to - o.from)), x = 60 + rnd(j, 2) * 960, y = 1500 - p * (700 + rnd(j, 3) * 700) + (1 - rnd(j, 4)) * 300; return <div key={j} style={{ position: 'absolute', left: x - 70, top: y, fontSize: 110 + rnd(j, 5) * 90, opacity: c01(p * 8) * (1 - c01((p - 0.75) / 0.25)), transform: `rotate(${(rnd(j, 6) - 0.5) * 40}deg)` }}>{o.text}</div>; })}</React.Fragment>;
      if (o.type === 'num') return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: 1279, textAlign: 'center', fontFamily: FB, color: Y, transform: `scale(${pop(o)})`, textShadow: '0 6px 0 rgba(0,0,0,.55), 0 10px 30px rgba(0,0,0,.5)', whiteSpace: 'nowrap' }}><div style={{ fontSize: Math.min(170, 980 / Math.max(3, (o.text ?? '').length * 0.62)), lineHeight: 1.05 }}>{o.text}</div>{o.sub ? <div style={{ display: 'inline-block', background: Y, color: '#111', fontSize: 62, padding: '2px 26px', transform: 'rotate(-3deg)', textShadow: 'none', marginTop: 10 }}>{o.sub}</div> : null}</div>;
      if (o.type === 'word') return <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: 1201, textAlign: 'center', fontFamily: FB, color: '#fff', textShadow: '0 4px 12px rgba(0,0,0,.5)', transform: `scale(${pop(o)})`, whiteSpace: 'nowrap' }}><div style={{ fontSize: Math.min(145, 1000 / Math.max(1, (o.text ?? '').length)), lineHeight: 1.1 }}>{o.text}</div>{o.sub ? <div style={{ fontSize: Math.min(90, 1000 / Math.max(1, o.sub.length)), lineHeight: 1.2, marginTop: 14 }}>{o.sub}</div> : null}</div>;
      if (o.type === 'tags') { const its = o.items ?? [], n = its.length; return <React.Fragment key={i}>{its.map((s, j) => { const at = o.ats?.[j] ?? o.from + j * 0.5; if (t < at) return null; const cx = n === 1 ? 540 : 190 + (700 * j) / (n - 1), rot = (rnd(j, 7) - 0.5) * 16; return <div key={j} style={{ position: 'absolute', left: cx - (s.length * 66 + 44) / 2, top: 1430 + (j % 2) * 110 + rnd(j, 8) * 40, padding: '6px 22px', background: Y, color: '#111', fontFamily: FB, fontSize: 66, lineHeight: 1.15, whiteSpace: 'nowrap', transform: `rotate(${rot}deg) scale(${0.7 + 0.3 * back((t - at) / 0.14)})`, boxShadow: '6px 6px 0 rgba(0,0,0,.55)' }}>{s}</div>; })}</React.Fragment>; }
      return null; }) : null}
    {/* 字幕：一句一句整句出。胸口白大字在的时候让位 */}
    {sub && !chestBusy ? <div style={{ position: 'absolute', left: 30, right: 30, top: SUB_Y, textAlign: 'center', fontFamily: FS, fontWeight: 900, fontSize: sub.text.length > 12 ? Math.floor((SUB_SIZE * 12.4) / sub.text.length) : SUB_SIZE, lineHeight: '65px', color: '#FEFEFB', textShadow: '6px 3px 0 #000', transform: 'skewX(-10deg)', whiteSpace: 'nowrap' }}>{sub.hot?.length ? sub.text.split(new RegExp(`(${sub.hot.map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`)).map((p, i) => (sub.hot!.includes(p) ? <span key={i} style={{ color: Y }}>{p}</span> : p)) : sub.text}</div> : null}
    {P.note ? <div style={{ position: 'absolute', right: 34, top: 50, fontFamily: FB, fontSize: 26, color: '#fff', textShadow: '0 2px 6px rgba(0,0,0,.7)' }}>{P.note}</div> : null}
    {P.audio ? <Audio src={src(P.audio)} /> : null}
  </AbsoluteFill>;
};
