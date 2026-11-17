// 纸面风 · 手机大字：浅纸底、墨色大字、一个橙色强调。为「横屏片在手机上看」做的一组组件——
// 真实录屏只负责交代「这是哪一页」，关键信息用同样的数据重排成大字卡片，一屏只讲一件事。
// 第一次用在第十三期（IP 工作台）。时间参数都是全片时刻（秒），用 say(段名, 词) 取。
import React from 'react';
import { AbsoluteFill, Img, OffthreadVideo, Sequence, staticFile, useVideoConfig } from 'remotion';
import { useClock, prog, mix, inOut } from '../kit/clock';
import { useT } from '../kit/kit';

export const PP = { paper: '#F1EDE4', ink: '#15130F', mute: '#8E877B', line: 'rgba(21,19,15,.14)', hot: '#FF4A1C', ok: '#0B9A6B', card: '#FFFFFF', dark: '#131313', blue: '#2F7BFF' };
export const PFONT = 'MiSans, "WenQuanYi Zen Hei", sans-serif';
const P = PP;
/** 带一点回弹的 0→1。 */
export const spr = (x: number) => (x <= 0 ? 0 : 1 - Math.exp(-7 * x) * Math.cos(9 * x));

/** 一拍画面：只在 [from, to) 内渲染，首尾 0.2 秒淡入淡出；hard 硬切进，softOut 让硬切的一拍淡出。 */
export const Beat: React.FC<{ from: number; to: number; hard?: boolean; softOut?: boolean; children: React.ReactNode }> = ({ from, to, hard, softOut, children }) => {
  const t = useT(), F = 0.2, cutOut = hard && !softOut;
  if (t < from || t >= to + (cutOut ? 0 : F)) return null;
  const o = Math.min(hard ? Math.min(1, (t - from) / 0.1 + 0.25) : Math.min(1, (t - from) / F), cutOut ? 1 : 1 - Math.max(0, (t - to) / F));
  return <AbsoluteFill style={{ opacity: o, fontFamily: PFONT, color: P.ink }}>{children}</AbsoluteFill>;
};
/** 到点升起。 */
export const Rise: React.FC<{ at: number; dy?: number; dur?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, dy = 40, dur = 0.4, style, children }) => {
  const t = useT(), p = prog(t, at, dur);
  return <div style={{ ...style, opacity: p, transform: `${style?.transform ?? ''} translateY(${mix(dy, 0, p)}px)` }}>{children}</div>;
};
/** 对勾：沿路径画出来。 */
export const Tick: React.FC<{ at: number; size: number; color?: string; w?: number }> = ({ at, size, color = P.hot, w = 0.16 }) => {
  const p = inOut((useT() - at) / 0.28), L = 100;
  return <svg width={size} height={size} viewBox="0 0 60 60"><path d="M10 32 L25 46 L52 14" fill="none" stroke={color} strokeWidth={60 * w} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - p)} /></svg>;
};
/** 划线：从左往右扫过父元素（父元素要 position: relative）。 */
export const Swipe: React.FC<{ at: number; h?: number; top?: string; color?: string }> = ({ at, h = 18, top = '56%', color = P.hot }) => <span style={{ position: 'absolute', left: -10, top, height: h, width: `calc(${inOut((useT() - at) / 0.3) * 100}% + 20px)`, background: color, borderRadius: h / 2, transform: 'rotate(-1.5deg)' }} />;
export const Dot: React.FC<{ c: string; s?: number }> = ({ c, s = 26 }) => <span style={{ display: 'inline-block', width: s, height: s, borderRadius: s / 2, background: c, flex: 'none' }} />;

/** 纸面外框：纸纹底、左上账号名、右上说明角标、底部字幕条和进度线。hero 里的行不出字幕，hot 里的词在字幕里变色。 */
export const PaperFrame: React.FC<{ brand: string; note?: string; hero?: number[]; hot?: string[]; captions?: boolean }> = ({ brand, note, hero = [], hot = [], captions = true }) => {
  const t = useT(), ck = useClock();
  const l0 = captions && ck ? ck.lines.find((x) => t >= x.start && t < x.end) : undefined, l = l0 && !hero.includes(l0.n) ? l0 : undefined;
  const re = hot.length ? new RegExp('(' + hot.join('|') + ')') : null;
  return (
    <AbsoluteFill style={{ fontFamily: PFONT, pointerEvents: 'none' }}>
      <AbsoluteFill style={{ opacity: 0.5, backgroundImage: 'radial-gradient(rgba(21,19,15,.09) 1px, transparent 1.2px)', backgroundSize: '9px 9px' }} />
      <div style={{ position: 'absolute', left: 60, top: 44, display: 'flex', alignItems: 'center', gap: 12, fontSize: 28, fontWeight: 900, color: P.ink }}><Dot c={P.hot} s={18} />{brand}</div>
      {note && <div style={{ position: 'absolute', right: 60, top: 40, fontSize: 24, fontWeight: 600, color: P.ink, border: `2px solid ${P.ink}`, borderRadius: 999, padding: '5px 18px' }}>{note}</div>}
      {l && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 64, display: 'flex', justifyContent: 'center' }}><span style={{ fontSize: 54, fontWeight: 900, color: P.paper, background: P.ink, borderRadius: 18, padding: '8px 34px', whiteSpace: 'nowrap' }}>{re ? l.text.split(re).map((x, i) => hot.includes(x) ? <span key={i} style={{ color: '#FF8A5C' }}>{x}</span> : x) : l.text}</span></div>}
      {ck && <div style={{ position: 'absolute', left: 0, bottom: 0, height: 10, width: `${(t / ck.total) * 100}%`, background: P.hot }} />}
    </AbsoluteFill>
  );
};

export type Roi = [number, number, number, number];
/** 录屏取景窗：深色窗口里放真实录屏或截图，橙色取景框标出「接下来放大的是这一块」，框外压暗。
 *  src 是 public 下的视频或图片；sw、sh 是素材像素；trim 是视频从第几秒开始播；roi 用素材像素坐标。 */
export const DeckWindow: React.FC<{ src: string; sw: number; sh: number; width: number; label: string; at: number; trim?: number; srcFps?: number; roi?: Roi; roiAt?: number }> = ({ src, sw, sh, width, label, at, trim = 0, srcFps = 30, roi, roiAt = 0 }) => {
  const t = useT(), { fps } = useVideoConfig(), k = width / sw, p = prog(t, roiAt, 0.4), video = /\.(mp4|webm|mov)$/.test(src);
  return (
    <div style={{ width, borderRadius: 22, overflow: 'hidden', background: P.dark, boxShadow: '0 40px 90px rgba(21,19,15,.35)', transform: `scale(${1 + Math.max(0, t - at) * 0.004})` }}>
      <div style={{ height: 44, display: 'flex', alignItems: 'center', gap: 9, padding: '0 18px', background: '#1E1E1E', fontFamily: PFONT }}>
        {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => <span key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
        <span style={{ marginLeft: 10, color: '#9A9A9A', fontSize: 20, fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ position: 'relative', width, height: sh * k, overflow: 'hidden' }}>
        <div style={{ width: sw, height: sh, transformOrigin: '0 0', transform: `scale(${k})` }}>
          {video ? <Sequence from={Math.round(at * fps)} layout="none"><OffthreadVideo src={staticFile(src)} muted trimBefore={Math.round(trim * srcFps)} style={{ width: sw, height: sh }} /></Sequence> : <Img src={staticFile(src)} style={{ width: sw, height: sh }} />}
        </div>
        {roi && <div style={{ position: 'absolute', left: roi[0] * k, top: roi[1] * k, width: roi[2] * k, height: roi[3] * k, border: `5px solid ${P.hot}`, borderRadius: 10, opacity: p, transform: `scale(${mix(1.2, 1, p)})`, boxShadow: `0 0 0 2000px rgba(0,0,0,${0.45 * p})` }} />}
      </div>
    </div>
  );
};
/** 放大卡：白底大卡片，左上角一枚橙色小标写明「放大自哪一页」。里面放重排后的大字内容。 */
export const MacroCard: React.FC<{ at: number; from: string; width: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, from, width, style, children }) => {
  const p = spr((useT() - at) / 0.55);
  return (
    <div style={{ position: 'relative', width, boxSizing: 'border-box', background: P.card, color: P.ink, fontFamily: PFONT, borderRadius: 34, padding: '40px 48px 44px', boxShadow: '0 30px 80px rgba(21,19,15,.16)', border: `2px solid ${P.line}`, opacity: Math.min(1, p * 1.6), transform: `scale(${mix(0.86, 1, p)})`, transformOrigin: 'left center', ...style }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: P.hot, color: '#fff', fontSize: 28, fontWeight: 900, padding: '6px 20px', borderRadius: 999, marginBottom: 26 }}>
        <svg width={26} height={26} viewBox="0 0 26 26"><circle cx={11} cy={11} r={7.5} fill="none" stroke="#fff" strokeWidth={3.4} /><path d="M17 17 L24 24" stroke="#fff" strokeWidth={3.6} strokeLinecap="round" /></svg>放大 · {from}
      </div>
      {children}
    </div>
  );
};

/** 清单交接：几件杂事用大字列出来，到 doneAt 一口气打勾划掉（「这些事全交给了……」）。 */
export const TodoHandoff: React.FC<{ items: { title: string; note?: string; at: number }[]; doneAt: number; size?: number }> = ({ items, doneAt, size = 170 }) => {
  const t = useT(), b = size * 0.88;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: size * 0.15, fontFamily: PFONT, color: P.ink }}>
      {items.map((it, i) => { const p = spr((t - it.at) / 0.5), done = doneAt + i * 0.22;
        return <div key={it.title} style={{ display: 'flex', alignItems: 'center', gap: size * 0.26, opacity: Math.min(1, p * 2), transform: `translateX(${mix(-90, 0, p)}px)` }}>
          <div style={{ width: b, height: b, borderRadius: b * 0.2, border: `${Math.round(size * 0.06)}px solid ${P.ink}`, boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'center', background: t > done ? P.ink : 'transparent', flex: 'none' }}><Tick at={done} size={b * 0.86} /></div>
          <div style={{ position: 'relative', fontSize: size, fontWeight: 900, letterSpacing: -size * 0.03, lineHeight: 1.15, whiteSpace: 'nowrap' }}>{it.title}{t > done && <Swipe at={done} h={size * 0.095} color="rgba(21,19,15,.55)" />}</div>
          {it.note && <div style={{ fontSize: size * 0.36, fontWeight: 600, color: P.mute, whiteSpace: 'nowrap' }}>{it.note}</div>}
        </div>; })}
    </div>
  );
};

/** 闭环：几个环节围成一圈，到点依次点亮，橙色弧线跟着走；全亮以后小球继续绕圈。center 放圈中间的字，dim 当背景用。
 *  画在 1920×1080 的绝对坐标里（cx、cy、r）。 */
export const LoopRing: React.FC<{ names: string[]; ats: number[]; cx: number; cy: number; r: number; fs?: number; center?: React.ReactNode; dim?: boolean }> = ({ names, ats, cx, cy, r, fs = 78, center, dim }) => {
  const t = useT(), n = names.length, C2 = 2 * Math.PI * r, last = ats[n - 1];
  const lit = ats.reduce((a, x) => a + inOut((t - x) / 0.35), 0), ang = (i: number) => (i / n) * Math.PI * 2 - Math.PI / 2;
  const run = t > last + 0.4 ? (t - last - 0.4) * 0.5 : 0, ba = ang(Math.max(0, lit - 1)) + run * Math.PI * 2;
  return (
    <AbsoluteFill style={{ opacity: dim ? 0.16 : 1, fontFamily: PFONT }}>
      <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={P.line} strokeWidth={22} />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={P.hot} strokeWidth={22} strokeLinecap="round" strokeDasharray={C2} strokeDashoffset={C2 * (1 - Math.min(1, Math.max(0, lit - 1) / n + (lit >= n ? 1 : 0)))} transform={`rotate(-90 ${cx} ${cy})`} />
        {lit > 0.2 && <circle cx={cx + r * Math.cos(ba)} cy={cy + r * Math.sin(ba)} r={30} fill={P.ink} />}
      </svg>
      {names.map((nm, i) => { const a = ang(i), p = spr((t - ats[i]) / 0.5), R2 = r + fs * 1.45;
        return <div key={nm} style={{ position: 'absolute', left: cx + R2 * Math.cos(a) * 1.28, top: cy + R2 * Math.sin(a) * 0.96, transform: `translate(-50%,-50%) scale(${mix(0.8, 1, p)})`, fontSize: fs, fontWeight: 900, color: p > 0.4 ? P.ink : 'rgba(21,19,15,.22)', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: fs * 0.42, color: p > 0.4 ? P.hot : 'inherit', marginRight: 10, verticalAlign: 'middle' }}>0{i + 1}</span>{nm}</div>; })}
      {center && <div style={{ position: 'absolute', left: cx, top: cy, transform: 'translate(-50%,-50%)', textAlign: 'center', color: P.ink }}>{center}</div>}
    </AbsoluteFill>
  );
};

export type Stage = { name: string; value?: string; status?: string; weak?: boolean };
/** 分段漏斗板：几段横排大方块依次出现（ats）；scanAt 起扫描框从左往右走，停在第一个 weak 的段，前面的打勾；
 *  valuesAt 起每段换成真实数值和状态；focusAt 起第一个 weak 的段放大变橙，其余压暗。宽度固定为 n 段 × bw。 */
export const FunnelStages: React.FC<{ stages: Stage[]; ats: number[]; scanAt?: number; valuesAt?: number; focusAt?: number; bw?: number; bh?: number; gap?: number }> = ({ stages, ats, scanAt = 1e9, valuesAt = 1e9, focusAt = 1e9, bw = 320, bh = 340, gap = 24 }) => {
  const t = useT(), fi = Math.max(0, stages.findIndex((s) => s.weak)), me = t >= valuesAt, stuck = prog(t, focusAt, 0.35), scan = Math.min(fi, Math.max(0, (t - scanAt) / 0.42));
  return (
    <div style={{ position: 'relative', width: stages.length * bw + (stages.length - 1) * gap, height: bh, fontFamily: PFONT, color: P.ink }}>
      {stages.map((s, i) => { const p = spr((t - ats[i]) / 0.5), focus = i === fi, on = focus && stuck > 0;
        const seen = t >= scanAt && scan >= i - 0.05, showMe = me && t >= valuesAt + 0.25 + i * 0.28, k = focus ? 1 + 0.2 * stuck : 1 - 0.06 * stuck;
        return <div key={s.name} style={{ position: 'absolute', left: i * (bw + gap), top: 0, width: bw, height: bh, boxSizing: 'border-box', borderRadius: 30, background: on ? P.hot : P.card, color: on ? '#fff' : P.ink, border: `3px solid ${seen && !me ? (s.weak ? P.hot : P.ok) : P.line}`, opacity: Math.min(1, p * 2) * (stuck > 0 && !focus ? mix(1, 0.45, stuck) : 1), transform: `translateY(${mix(70, 0, p)}px) scale(${k})`, boxShadow: on ? '0 40px 90px rgba(255,74,28,.4)' : '0 16px 40px rgba(21,19,15,.08)', zIndex: focus ? 2 : 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', left: 24, top: 18, fontSize: 36, fontWeight: 900, color: on ? '#fff' : P.mute }}>S{i + 1}</div>
          <div style={{ fontSize: showMe ? 64 : 112, fontWeight: 900, letterSpacing: -2 }}>{s.name}</div>
          {showMe && <><div style={{ fontSize: 84, fontWeight: 900, letterSpacing: -3, lineHeight: 1.15, color: on ? '#fff' : s.weak ? P.hot : P.ink }}>{s.value}</div>
            <div style={{ fontSize: 40, fontWeight: 900, color: on ? '#fff' : s.weak ? P.hot : P.ok }}>{s.status}</div></>}
          {!me && seen && <div style={{ position: 'absolute', bottom: 22 }}>{i < fi ? <Tick at={scanAt + i * 0.42} size={84} color={P.ok} /> : s.weak ? <div style={{ fontSize: 44, fontWeight: 900, color: P.hot, opacity: prog(t, scanAt + fi * 0.42, 0.2) }}>偏弱</div> : null}</div>}
        </div>; })}
      {!me && t >= scanAt && <div style={{ position: 'absolute', left: scan * (bw + gap) - 14, top: -14, width: bw + 28, height: bh + 28, boxSizing: 'border-box', borderRadius: 40, border: `10px solid ${P.hot}` }} />}
    </div>
  );
};

/** 字段卡：几行「字段名 + 大字内容」，到点逐行点亮（没到的行压得很淡）；可以在右上角盖一个章。放在 MacroCard 里用。 */
export const FieldRows: React.FC<{ rows: { k: string; v: React.ReactNode; at: number }[]; stamp?: { text: string; at: number }; kw?: number }> = ({ rows, stamp, kw = 270 }) => {
  const t = useT();
  return (
    <div style={{ fontFamily: PFONT, color: P.ink }}>
      {rows.map((r, i) => <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 34, padding: '20px 0', borderTop: i ? `2px solid ${P.line}` : 'none', opacity: mix(0.18, 1, prog(t, r.at, 0.35)) }}>
        <span style={{ width: kw, flex: 'none', fontSize: 48, fontWeight: 900, color: P.mute }}>{r.k}</span>{r.v}</div>)}
      {stamp && <div style={{ position: 'absolute', right: 60, top: 26, transform: `rotate(-8deg) scale(${mix(1.6, 1, spr((t - stamp.at) / 0.4))})`, opacity: prog(t, stamp.at, 0.15), border: `8px solid ${P.hot}`, color: P.hot, borderRadius: 22, padding: '2px 30px', fontSize: 72, fontWeight: 900 }}>{stamp.text}</div>}
    </div>
  );
};

/** 流程轨道：一条流程一张卡，标题加一枚角标，下面是几个阶段；on 时刻整卡点亮，tokenAt 起阶段一格格被走到。 */
export const LaneTrack: React.FC<{ title: string; badge: string; stages: string[]; on: number; color?: string; tokenAt?: number }> = ({ title, badge, stages, on, color = P.hot, tokenAt }) => {
  const t = useT();
  return (
    <div style={{ background: P.card, color: P.ink, fontFamily: PFONT, borderRadius: 30, border: `3px solid ${t >= on ? color : P.line}`, padding: '26px 34px 30px', opacity: mix(0.4, 1, prog(t, on, 0.3)), boxShadow: '0 16px 40px rgba(21,19,15,.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22 }}><span style={{ fontSize: 76, fontWeight: 900, letterSpacing: -2 }}>{title}</span><span style={{ fontSize: 40, fontWeight: 900, color: '#fff', background: color, borderRadius: 999, padding: '4px 26px' }}>{badge}</span></div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 20 }}>
        {stages.map((s, i) => { const hit = tokenAt !== undefined && t >= tokenAt + i * 0.33;
          return <React.Fragment key={s}>{i > 0 && <span style={{ fontSize: 40, color: P.mute }}>→</span>}
            <span style={{ fontSize: 46, fontWeight: 900, padding: '10px 24px', borderRadius: 16, background: hit ? color : 'rgba(21,19,15,.06)', color: hit ? '#fff' : P.ink, whiteSpace: 'nowrap' }}>{s}</span></React.Fragment>; })}
      </div>
    </div>
  );
};

/** 勾选行：几个选项（比如几个平台）用大字列出来，到点一个个打勾。 */
export const CheckRows: React.FC<{ items: { name: string; color?: string }[]; ats: number[]; size?: number }> = ({ items, ats, size = 112 }) => {
  const t = useT(), b = size * 0.93;
  return (
    <div style={{ fontFamily: PFONT, color: P.ink }}>
      {items.map((it, i) => <div key={it.name} style={{ display: 'flex', alignItems: 'center', gap: size * 0.27, padding: `${size * 0.1}px 0` }}>
        <div style={{ width: b, height: b, boxSizing: 'border-box', borderRadius: b * 0.21, border: `${Math.round(size * 0.07)}px solid ${P.ink}`, background: t > ats[i] ? P.ink : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><Tick at={ats[i]} size={b * 0.86} /></div>
        {it.color && <Dot c={it.color} s={size * 0.34} />}<span style={{ fontSize: size, fontWeight: 900, letterSpacing: -3, whiteSpace: 'nowrap' }}>{it.name}</span></div>)}
    </div>
  );
};

/** 评论到草稿：一条评论气泡（头像是灰圆，不露昵称）→ 命中规则 → 回复草稿已写好。 */
export const CommentFlow: React.FC<{ comment: string; meta?: string; rule: string; draft: string; at: number; ruleAt: number }> = ({ comment, meta, rule, draft, at, ruleAt }) => (
  <div style={{ fontFamily: PFONT, color: P.ink }}>
    <Rise at={at} style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
      <div style={{ width: 130, height: 130, borderRadius: 65, background: 'rgba(21,19,15,.14)', flex: 'none' }} />
      <div style={{ background: P.card, borderRadius: '40px 40px 40px 8px', padding: '18px 50px', border: `3px solid ${P.line}`, fontSize: 130, fontWeight: 900, letterSpacing: -3, whiteSpace: 'nowrap' }}>{comment}</div>
      {meta && <span style={{ fontSize: 46, fontWeight: 600, color: P.mute, whiteSpace: 'nowrap' }}>{meta}</span>}
    </Rise>
    <Rise at={ruleAt} style={{ display: 'flex', alignItems: 'center', gap: 30, marginTop: 44, marginLeft: 160 }}>
      <span style={{ fontSize: 100, fontWeight: 900, color: P.hot }}>↳</span>
      <div style={{ border: `6px dashed ${P.hot}`, borderRadius: '40px 40px 8px 40px', padding: '20px 44px' }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: P.hot, whiteSpace: 'nowrap' }}>{rule}</div>
        <div style={{ fontSize: 88, fontWeight: 900, letterSpacing: -2, whiteSpace: 'nowrap' }}>{draft}</div>
      </div>
    </Rise>
  </div>
);
/** 点按按钮：一个大按钮，光标滑过来点一下，按钮变成完成态。 */
export const TapButton: React.FC<{ label: string; done: string; at: number; size?: number }> = ({ label, done, at, size = 92 }) => {
  const t = useT(), ok = t > at + 0.35, m = inOut((t - at + 0.1) / 0.4);
  return (
    <div style={{ position: 'relative', display: 'inline-block', fontFamily: PFONT, fontSize: size, fontWeight: 900, color: '#fff', background: ok ? P.ok : P.ink, borderRadius: size * 0.33, padding: `${size * 0.15}px ${size * 0.76}px`, whiteSpace: 'nowrap', transform: `scale(${1 - 0.08 * Math.sin(Math.min(1, Math.max(0, (t - at - 0.25) / 0.25)) * Math.PI)})` }}>{ok ? done : label}
      <svg width={size} height={size} viewBox="0 0 30 30" style={{ position: 'absolute', right: -size * 0.33, bottom: -size * 0.55, transform: `translate(${mix(120, 0, m)}px, ${mix(80, 0, m)}px)` }}><path d="M4 2 L4 24 L10 18.5 L14 27 L18 25 L14 17 L22 17 Z" fill={P.paper} stroke={P.ink} strokeWidth={2} /></svg>
    </div>
  );
};
/** 大字输入框：一个粗框里把评论口令一个字一个字打出来，后面光标在闪。 */
export const TypeBox: React.FC<{ text: string; at: number; cps?: number; size?: number; minWidth?: number }> = ({ text, at, cps = 4.5, size = 250, minWidth = 900 }) => {
  const t = useT();
  return <div style={{ display: 'inline-block', boxSizing: 'border-box', fontFamily: PFONT, color: P.ink, background: P.card, border: `8px solid ${P.ink}`, borderRadius: 40, padding: '10px 60px', fontSize: size, fontWeight: 900, letterSpacing: -6, lineHeight: 1.15, minWidth, whiteSpace: 'nowrap' }}>{text.slice(0, Math.max(0, Math.ceil((t - at) * cps)))}<span style={{ color: P.hot, opacity: Math.floor(t * 2.5) % 2 ? 1 : 0.2 }}>|</span></div>;
};
/** 名字加关注：巨大的账号名，旁边一句定位和关注按钮，到 followAt 按钮弹一下变成已关注。 */
export const BigFollow: React.FC<{ name: string; sub: React.ReactNode; at: number; followAt: number; size?: number }> = ({ name, sub, at, followAt, size = 330 }) => {
  const t = useT(), ok = t > followAt + 0.3;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 60, fontFamily: PFONT, color: P.ink }}>
      <div style={{ fontSize: size, fontWeight: 900, letterSpacing: -10, lineHeight: 1, whiteSpace: 'nowrap', transform: `scale(${mix(1.15, 1, prog(t, at, 0.3))})` }}>{name}</div>
      <div><div style={{ fontSize: 60, fontWeight: 600, color: P.mute, lineHeight: 1.35 }}>{sub}</div>
        <div style={{ marginTop: 26, fontSize: 84, fontWeight: 900, color: '#fff', background: ok ? P.ink : P.hot, borderRadius: 999, padding: '10px 60px', display: 'inline-block', whiteSpace: 'nowrap', transform: `scale(${1 + 0.12 * Math.sin(Math.min(1, Math.max(0, (t - followAt) / 0.4)) * Math.PI)})` }}>{ok ? '已关注 ✓' : '+ 关注'}</div></div>
    </div>
  );
};
/** 大字叠行：几行大小不一的大字到点出现，大的那几行带一点推近；strikeAt 给了就在那一刻被划掉。 */
export const HeadlineStack: React.FC<{ lines: { text: string; at: number; size: number; color?: string; strikeAt?: number; gap?: number }[] }> = ({ lines }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', fontFamily: PFONT }}>
      {lines.map((l) => { const big = l.size >= 160;
        return <div key={l.text} style={{ position: 'relative', fontSize: l.size, fontWeight: 900, letterSpacing: big ? -l.size * 0.034 : 0, lineHeight: 1.15, marginTop: l.gap ?? 0, color: l.color ?? P.ink, whiteSpace: 'nowrap', opacity: prog(t, l.at, big ? 0.2 : 0.25), transform: big ? `scale(${mix(1.1, 1, prog(t, l.at, 0.3))})` : undefined, transformOrigin: 'left center' }}>{l.text}{l.strikeAt !== undefined && <Swipe at={l.strikeAt} h={l.size * 0.115} />}</div>; })}
    </div>
  );
};
/** 平台数字表：几行（平台 + 色点）× 几列大数字，到点逐行升起；hi 指定哪一格用绿色标出。放在 MacroCard 里用。 */
export const StatGrid: React.FC<{ cols: string[]; rows: { name: string; color: string; vals: string[] }[]; at: number; hi?: [number, number]; nameW?: number; colW?: number[] }> = ({ cols, rows, at, hi, nameW = 310, colW }) => {
  const t = useT();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `${nameW}px ${cols.map((_, i) => (colW?.[i] ? colW[i] + 'px' : '1fr')).join(' ')}`, columnGap: 24, rowGap: 14, alignItems: 'baseline', fontFamily: PFONT, color: P.ink }}>
      <span />{cols.map((c) => <span key={c} style={{ fontSize: 40, fontWeight: 600, color: P.mute }}>{c}</span>)}
      {rows.map((r, i) => { const p = prog(t, at + i * 0.25, 0.35), st: React.CSSProperties = { opacity: p, transform: `translateY(${mix(30, 0, p)}px)` };
        return <React.Fragment key={r.name}><span style={{ ...st, fontSize: 76, fontWeight: 900, display: 'flex', alignItems: 'center', gap: 18, whiteSpace: 'nowrap' }}><Dot c={r.color} s={34} />{r.name}</span>
          {r.vals.map((v, j) => <span key={j} style={{ ...st, fontSize: 100, fontWeight: 900, letterSpacing: -3, whiteSpace: 'nowrap', color: hi && hi[0] === i && hi[1] === j ? P.ok : P.ink }}>{v}</span>)}</React.Fragment>; })}
    </div>
  );
};
