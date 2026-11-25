// 财经解读风第三批组件：从小 Lin 说 2026 年的四条高清成片里新拆出来的（DeepSeek 融资、免税、韩股、猫经济）。
// 拆解和出处见 docs/对标拆解-小Lin口播-第三批.md。画布 1080×1920；颜色、字体跟 talk2 一套（FONT_TITLE、深色面板、黄色强调）。
// 这些大多是「满屏面板」：人缩成右上小圆（或不在）时铺在星点底上。Bubbles、GhostWord、ChestNumber 三个是压在人全屏上的。
// 时间都传秒：from / to 是整块出现和消失，at 是里面每一步出现的时刻。
import React from 'react';
import { AbsoluteFill, Img, staticFile } from 'remotion';
import { mix, prog } from './clock';
import { FONT, FONT_TITLE, useFonts, useT } from './kit';

const W = 1080, H = 1920, GOLD = '#F2E26B', INK = '#0B0D14';
const vis = (t: number, from: number, to: number, fin = 0.3, fout = 0.22) => (t < from - 0.02 || t > to + fout ? 0 : prog(t, from, fin) * (1 - prog(t, to, fout)));
const rnd = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const src = (s: string) => (/^(https?:|data:)/.test(s) ? s : staticFile(s));
export const TONES: Record<string, [string, string]> = { blue: ['#2A3A9C', '#16205E'], teal: ['#2C7C86', '#184A52'], purple: ['#5A3F8E', '#2E2150'], green: ['#2F7A55', '#18452F'], wine: ['#7A2B55', '#451630'], slate: ['#2A3040', '#171B26'], gold: ['#FFF3A8', '#E7C94C'], red: ['#A8343A', '#5E1B1F'] };
const grad = (tone: string) => `linear-gradient(160deg, ${(TONES[tone] ?? TONES.slate)[0]}, ${(TONES[tone] ?? TONES.slate)[1]})`;
const ink = (tone: string) => (tone === 'gold' ? '#3A2F05' : '#F4F1E4');

/** 星点底：满屏面板的统一底色（近黑 + 细星点）。对标片里所有图解面板都铺在这种底上。 */
export const Starfield: React.FC<{ from: number; to: number; tint?: string }> = ({ from, to, tint = '#0A0C14' }) => {
  const t = useT(), v = vis(t, from, to, 0.2, 0.2); if (v <= 0) return null;
  return <AbsoluteFill style={{ background: tint, opacity: v }}>{Array.from({ length: 150 }, (_, i) => <div key={i} style={{ position: 'absolute', left: rnd(i) * W, top: rnd(i + 500) * H, width: 2 + rnd(i + 900) * 3, height: 2 + rnd(i + 900) * 3, borderRadius: '50%', background: '#AFC2FF', opacity: 0.1 + 0.35 * rnd(i + 77) * (0.6 + 0.4 * Math.sin(t * 1.3 + i)) }} />)}</AbsoluteFill>;
};

/** 关键词光球：一章开头或者抛出一个概念时，满屏一只发光的圆环，里面两行大字（「DeepSeek 想干嘛？」「AGI」「开源」）。停 2 到 3 秒。 */
export const KeywordOrb: React.FC<{ text: string; sub?: string; en?: string; from: number; to: number; color?: string; cy?: number }> = ({ text, sub, en, from, to, color = '#4C8DFF', cy = 620 }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const p = prog(t, from, 0.6), R = 330, size = Math.min(150, Math.floor(900 / Math.max(3, text.length)));
  return <AbsoluteFill style={{ opacity: v }}>
    {Array.from({ length: 220 }, (_, i) => { const a = rnd(i) * Math.PI * 2 + t * 0.05, r = R + 30 + rnd(i + 40) * 330; return <div key={i} style={{ position: 'absolute', left: W / 2 + Math.cos(a) * r, top: cy + Math.sin(a) * r, width: 4, height: 4, borderRadius: '50%', background: color, opacity: (1 - (r - R) / 380) * 0.55 * p }} />; })}
    <div style={{ position: 'absolute', left: W / 2 - R, top: cy - R, width: R * 2, height: R * 2, borderRadius: '50%', border: `8px solid ${color}`, boxShadow: `0 0 70px ${color}, inset 0 0 90px ${color}66`, background: 'radial-gradient(circle, rgba(10,16,40,.9) 55%, rgba(20,40,110,.75) 100%)', transform: `scale(${mix(0.7, 1, p)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
      {en ? <div style={{ fontFamily: FONT, fontSize: 24, letterSpacing: 4, color, opacity: 0.8 }}>{en}</div> : null}
      <div style={{ fontFamily: FONT_TITLE, fontSize: size, color: '#9CC2FF', textShadow: `0 0 26px ${color}`, letterSpacing: 6, lineHeight: 1.1 }}>{text}</div>
      {sub ? <div style={{ fontFamily: FONT_TITLE, fontSize: size * 0.72, color: '#9CC2FF', textShadow: `0 0 26px ${color}`, transform: 'skewX(-8deg)' }}>{sub}</div> : null}
    </div></AbsoluteFill>;
};

export type TreeCell = { label: string; value?: string; unit?: string; tone?: string; at: number; w?: number; hot?: number; img?: string };
/** 构成树图：一笔钱、一个市场由谁组成。一行一行的色块，面积按占比；讲到谁谁出现，可以先放「？？？」再揭开；hot 那一刻变金色。
 *  rows 是从上到下的几行，每行的 h 是这行的高度占比，cells 的 w 是这一格在行里的宽度占比。 */
export const Treemap: React.FC<{ title: string; en?: string; rows: { h: number; cells: TreeCell[] }[]; from: number; to: number; tilt?: boolean; note?: string }> = ({ title, en, rows, from, to, tilt, note }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const X = 110, Y = 300, BW = 860, BH = 1000, th = rows.reduce((a, r) => a + r.h, 0); let y = 0;
  return <AbsoluteFill style={{ opacity: v, perspective: 1600 }}><div style={{ position: 'absolute', left: X - 24, top: Y - 150, width: BW + 48, height: BH + 190, borderRadius: 26, border: '3px solid rgba(160,180,255,.55)', boxShadow: '0 0 40px rgba(90,120,255,.25)', transform: tilt ? `rotateY(${mix(-14, -7, prog(t, from, 2))}deg) rotateX(3deg)` : undefined }}>
    <div style={{ position: 'absolute', left: 24, right: 24, top: 22, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: 64, color: '#8FA4FF', letterSpacing: 10, transform: 'skewX(-8deg)' }}>{title}</div>
    {en ? <div style={{ position: 'absolute', left: 0, right: 0, top: 104, textAlign: 'center', fontFamily: FONT, fontSize: 20, letterSpacing: 4, color: 'rgba(255,255,255,.55)' }}>{en}</div> : null}
    {rows.map((r, ri) => { const rh = (r.h / th) * BH, top = 150 + y; y += rh; const tw = r.cells.reduce((a, c) => a + (c.w ?? 1), 0); let x = 0;
      return r.cells.map((c, ci) => { const cw = ((c.w ?? 1) / tw) * BW, left = 24 + x; x += cw; const p = prog(t, c.at, 0.35), hot = c.hot != null && t >= c.hot, tone = hot ? 'gold' : c.tone ?? 'blue', small = cw < 150 || rh < 130;
        return <div key={ri + '-' + ci} style={{ position: 'absolute', left: left + 3, top: top + 3, width: cw - 6, height: rh - 6, background: p > 0 ? grad(tone) : 'rgba(255,255,255,.07)', opacity: p > 0 ? mix(0.3, 1, p) : 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: c.img ? 'flex-start' : 'center', justifyContent: 'center', paddingLeft: c.img ? 40 : 0, boxSizing: 'border-box' }}>
          {c.img && p > 0 ? <Img src={src(c.img)} style={{ position: 'absolute', right: 0, bottom: 0, height: '100%', width: '48%', objectFit: 'cover', objectPosition: 'top' }} /> : null}
          {p > 0 ? <><div style={{ fontFamily: FONT_TITLE, color: ink(tone), fontSize: small ? 34 : 84, lineHeight: 1, whiteSpace: 'nowrap' }}><span style={{ fontSize: small ? 18 : 34 }}>¥ </span>{c.value ?? '？？？'}<span style={{ fontSize: small ? 18 : 40 }}> {c.unit ?? ''}</span></div>
            <div style={{ fontFamily: FONT_TITLE, color: ink(tone), opacity: 0.85, fontSize: small ? 20 : 36, marginTop: small ? 4 : 10, letterSpacing: 3, whiteSpace: 'nowrap' }}>{c.label}</div></> : null}
        </div>; }); })}
    {note ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: -64, textAlign: 'center', fontFamily: FONT, fontSize: 24, color: 'rgba(255,255,255,.6)' }}>{note}</div> : null}
  </div></AbsoluteFill>;
};

/** 引语卡：某个人说过的一句原话。白卡片，上面是他的照片，中间灰底里是原话（hot 里的词用黄色马克笔划过），右下角签名。
 *  push 给一个时刻：从那时起镜头斜着推近到原话上（对标片读到关键句时都这么推）。原话必须有出处，写在 source。 */
export const QuoteCard3: React.FC<{ img?: string; lines: string[]; hot?: string[]; name: string; en?: string; source?: string; from: number; to: number; push?: number; top?: number }> = ({ img, lines, hot = [], name, en, source, from, to, push, top = 380 }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const p = prog(t, from, 0.4), q = push != null ? prog(t, push, 0.8) : 0, CW = 760;
  const mark = (s: string) => { const parts: React.ReactNode[] = []; let rest = s, k = 0; while (rest) { const hit = hot.map((h) => [rest.indexOf(h), h] as [number, string]).filter(([i]) => i >= 0).sort((a, b) => a[0] - b[0])[0]; if (!hit) { parts.push(rest); break; } if (hit[0] > 0) parts.push(rest.slice(0, hit[0])); parts.push(<span key={k++} style={{ background: `linear-gradient(transparent 38%, #FFE766 38%)`, padding: '0 4px' }}>{hit[1]}</span>); rest = rest.slice(hit[0] + hit[1].length); } return parts; };
  return <AbsoluteFill style={{ opacity: v, perspective: 1400 }}><div style={{ position: 'absolute', left: (W - CW) / 2, top, width: CW, background: '#F3F4F6', borderRadius: 10, boxShadow: '0 30px 80px rgba(0,0,0,.6)', overflow: 'hidden', transformOrigin: '50% 62%', transform: `translateY(${mix(60, 0, p)}px) scale(${mix(0.9, 1, p) * mix(1, 1.42, q)}) rotateY(${mix(0, 13, q)}deg) rotateZ(${mix(0, -2.5, q)}deg)` }}>
    {img ? <Img src={src(img)} style={{ width: '100%', height: 350, objectFit: 'cover', objectPosition: 'top', display: 'block' }} /> : null}
    <div style={{ fontFamily: 'Georgia, serif', fontSize: 150, lineHeight: 0.6, color: '#9FD3D0', padding: '34px 0 0 30px', height: 60 }}>“</div>
    <div style={{ margin: '10px 36px 0', background: '#E4E6EA', padding: '30px 30px 34px', fontFamily: FONT_TITLE, fontSize: Math.min(52, Math.floor(620 / Math.max(6, ...lines.map((l) => l.length)))), lineHeight: 1.6, color: '#3A4470', letterSpacing: 1, whiteSpace: 'nowrap' }}>{lines.map((l, i) => <div key={i}>{mark(l)}</div>)}</div>
    <div style={{ margin: '34px 36px 30px', borderTop: '2px solid #C9CCD3', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <div style={{ fontFamily: FONT, fontSize: 20, color: '#8A8F9C', maxWidth: 440 }}>{source ? '出处：' + source : ''}</div>
      <div style={{ textAlign: 'right' }}>{en ? <div style={{ fontFamily: FONT, fontSize: 16, color: '#9AA0AE' }}>{en}</div> : null}<div style={{ fontFamily: FONT_TITLE, fontSize: 44, color: '#5B6790', letterSpacing: 4 }}>{name}</div></div></div>
  </div></AbsoluteFill>;
};

/** 去向清单：谁 → 去了哪。一行一个人：圆头像、名字、箭头、去的地方；没讲到的先是「？？？」和空框，讲到时揭开并亮起来。 */
export const PeopleFlow: React.FC<{ rows: { name: string; img?: string; dest: string; destImg?: string; at: number }[]; from: number; to: number; top?: number }> = ({ rows, from, to, top = 400 }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const RH = 230, cur = rows.reduce((a, r, i) => (t >= r.at ? i : a), -1);
  return <AbsoluteFill style={{ opacity: v }}>{rows.map((r, i) => { const p = prog(t, r.at, 0.35), on = p > 0, here = i === cur, e = prog(t, from + i * 0.12, 0.35);
    return <div key={i} style={{ position: 'absolute', left: 60, top: top + i * (RH + 22), width: W - 120, height: RH, borderRadius: 22, background: here ? 'linear-gradient(160deg,#4A5C9E,#2A3766)' : 'linear-gradient(160deg,#222B48,#151B30)', border: '2px solid rgba(160,180,255,.25)', boxShadow: '0 16px 40px rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', padding: '0 44px', boxSizing: 'border-box', gap: 30, opacity: e, transform: `translateX(${mix(60, 0, e)}px)` }}>
      <div style={{ width: 150, height: 150, borderRadius: '50%', overflow: 'hidden', background: '#D9DDE6', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{on && r.img ? <Img src={src(r.img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: 70, height: 70, borderRadius: '50%', background: '#AEB4C2', boxShadow: '0 78px 0 22px #AEB4C2' }} />}</div>
      <div style={{ fontFamily: FONT_TITLE, fontSize: 60, color: '#fff', letterSpacing: 4, width: 250, whiteSpace: 'nowrap' }}>{on ? r.name : '? ? ?'}</div>
      <div style={{ flex: 1, height: 6, background: 'linear-gradient(90deg, rgba(120,150,255,.2), #7C9BFF)', position: 'relative' }}><div style={{ position: 'absolute', right: -4, top: -13, borderLeft: '26px solid #7C9BFF', borderTop: '16px solid transparent', borderBottom: '16px solid transparent' }} /></div>
      <div style={{ width: 300, height: 120, borderRadius: 14, background: on ? '#F1F2F5' : 'rgba(20,28,70,.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', transform: `scale(${on ? mix(1.18, 1, p) : 1})`, overflow: 'hidden' }}>{on ? (r.destImg ? <Img src={src(r.destImg)} style={{ maxWidth: '84%', maxHeight: '70%' }} /> : <span style={{ fontFamily: FONT_TITLE, fontSize: Math.min(56, Math.floor(250 / Math.max(2, r.dest.length))), color: '#1C2B6B' }}>{r.dest}</span>) : null}</div>
    </div>; })}</AbsoluteFill>;
};

/** 选项气泡：人全屏时，围着人飘几只圆气泡，一只是一个选项（「代购」「免税店」「跨境电商」）。讲到哪只哪只变大变亮。
 *  位置写画面比例（0 到 1），不要盖脸：脸在哪由版式表的 FACE 定，气泡放在脸的两侧和胸口以下。 */
export const Bubbles: React.FC<{ items: { text: string; en?: string; x: number; y: number; r: number; tone?: string; at?: number }[]; from: number; to: number; hot?: [number, number][] }> = ({ items, from, to, hot = [] }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const cur = hot.reduce((a, [at, i]) => (t >= at ? i : a), -1);
  return <AbsoluteFill style={{ opacity: v }}>{items.map((b, i) => { const p = prog(t, b.at ?? from + i * 0.1, 0.4), here = i === cur, r = b.r * (here ? 1.14 : 1), dy = Math.sin(t * 0.9 + i * 1.7) * 10, [c1, c2] = TONES[b.tone ?? 'slate'];
    return <div key={i} style={{ position: 'absolute', left: b.x * W - r, top: b.y * H - r + dy, width: r * 2, height: r * 2, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${c1}, ${c2} 78%)`, border: `4px solid ${here ? GOLD : 'rgba(255,255,255,.28)'}`, boxShadow: here ? `0 0 46px ${GOLD}88` : '0 14px 36px rgba(0,0,0,.5)', opacity: p * (cur >= 0 && !here ? 0.72 : 1), transform: `scale(${mix(0.4, 1, p)})`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: FONT_TITLE, fontSize: Math.min(78, Math.floor((r * 1.5) / Math.max(2, b.text.length))), color: here ? GOLD : '#F2EFDF', letterSpacing: 4, whiteSpace: 'nowrap' }}>{b.text}</div>
      {b.en ? <div style={{ fontFamily: FONT, fontSize: Math.max(13, r * 0.11), color: 'rgba(255,255,255,.55)', marginTop: 4 }}>{b.en}</div> : null}</div>; })}</AbsoluteFill>;
};

/** 对照表：几种做法 × 几项指标。一行一种颜色，格子先是「？」，讲到哪格哪格翻出答案（✓、✗、数字）。讲完的行可以整行亮着留到最后当总结。 */
export const MatrixBoard: React.FC<{ cols: string[]; rows: { label: string; en?: string; tone?: string; cells: string[]; at: number[] }[]; from: number; to: number; top?: number }> = ({ cols, rows, from, to, top = 420 }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const X = 70, BW = W - 140, LW = 250, RH = 230, CW = (BW - LW) / cols.length;
  return <AbsoluteFill style={{ opacity: v }}><div style={{ position: 'absolute', left: X, top, width: BW, height: 110 + rows.length * (RH + 14) + 14, borderRadius: 20, border: '3px solid rgba(255,255,255,.75)', background: 'rgba(8,10,16,.9)', boxShadow: '0 24px 60px rgba(0,0,0,.6)' }}>
    {cols.map((c, i) => <div key={c} style={{ position: 'absolute', left: LW + i * CW, top: 26, width: CW, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: 44, color: '#F4F1E4', letterSpacing: 4 }}>{c}</div>)}
    {rows.map((r, ri) => { const e = prog(t, from + ri * 0.12, 0.35);
      return <div key={ri} style={{ position: 'absolute', left: 14, top: 110 + ri * (RH + 14), width: BW - 28, height: RH, background: grad(r.tone ?? 'slate'), borderRadius: 8, opacity: e, transform: `translateY(${mix(30, 0, e)}px)` }}>
        <div style={{ position: 'absolute', left: 0, top: 0, width: LW - 14, height: RH, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,.1)', borderRadius: '8px 0 60px 8px' }}><div style={{ fontFamily: FONT_TITLE, fontSize: Math.min(58, Math.floor(200 / Math.max(2, r.label.length))), color: '#fff', letterSpacing: 4 }}>{r.label}</div>{r.en ? <div style={{ fontFamily: FONT, fontSize: 16, color: 'rgba(255,255,255,.6)', marginTop: 4 }}>{r.en}</div> : null}</div>
        {r.cells.map((c, ci) => { const p = prog(t, r.at[ci] ?? 1e9, 0.3), on = p > 0, yes = c === '✓' || c === '免', no = c === '✗';
          return <div key={ci} style={{ position: 'absolute', left: LW - 14 + ci * CW, top: 0, width: CW, height: RH, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ minWidth: 96, height: 96, borderRadius: 48, padding: on && !yes && !no ? '0 22px' : 0, boxSizing: 'border-box', background: on ? (yes ? '#3FBF6B' : no ? '#C8463F' : GOLD) : 'rgba(255,255,255,.14)', color: on ? (yes || no ? '#fff' : '#2A2606') : 'rgba(255,255,255,.55)', fontFamily: FONT_TITLE, fontSize: on && !yes && !no ? 44 : 56, display: 'flex', alignItems: 'center', justifyContent: 'center', transform: `scale(${on ? mix(1.4, 1, p) : 1})`, boxShadow: on ? '0 6px 18px rgba(0,0,0,.4)' : undefined }}>{on ? c : '?'}</div></div>; })}
      </div>; })}
  </div></AbsoluteFill>;
};

/** 两柱对比：画面左右对半分成两种颜色，各立一根一格一格码起来的柱子，数字压在柱顶；先出左边，再出右边。适合「原价 vs 到手价」「去年 vs 今年」。
 *  数字必须是口播里说的、有出处的数。 */
export const StackBars: React.FC<{ left: { value: number; label: string; en?: string }; right: { value: number; label: string; en?: string }; unit?: string; at: [number, number]; from: number; to: number; colors?: [string, string] }> = ({ left, right, unit = '¥', at, from, to, colors = ['#1B1C55', '#1F6B45'] }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const max = Math.max(left.value, right.value), BASE = 1240, MAXH = 760, SEG = 24;
  const bar = (d: { value: number; label: string; en?: string }, x: number, a: number, col: string) => { const p = prog(t, a, 0.9), n = Math.max(1, Math.round((d.value / max) * (MAXH / SEG))), shown = Math.round(n * p);
    return <>{Array.from({ length: shown }, (_, i) => <div key={i} style={{ position: 'absolute', left: x - 76, top: BASE - (i + 1) * SEG, width: 152, height: SEG - 7, background: col }} />)}
      {p > 0 ? <div style={{ position: 'absolute', left: x - 200, width: 400, top: BASE - shown * SEG - 118, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: 96, color: col, textShadow: '0 4px 18px rgba(0,0,0,.5)', letterSpacing: 4 }}><span style={{ fontSize: 44 }}>{unit}</span>{Math.round(d.value * p).toLocaleString('en-US').replace(/,/g, '')}</div> : null}
      <div style={{ position: 'absolute', left: x - 270, width: 540, top: BASE + 20, height: 150, background: 'rgba(255,255,255,.14)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontFamily: FONT_TITLE, fontSize: 62, color: col, letterSpacing: 6 }}>{d.label}</div>{d.en ? <div style={{ fontFamily: FONT, fontSize: 20, color: 'rgba(255,255,255,.55)' }}>{d.en}</div> : null}</div></>; };
  return <AbsoluteFill style={{ opacity: v }}><div style={{ position: 'absolute', left: 0, top: 0, width: W / 2, height: H, background: colors[0] }} /><div style={{ position: 'absolute', left: W / 2, top: 0, width: W / 2, height: H, background: colors[1] }} />
    {bar(left, W * 0.25, at[0], '#B9B4F2')}{bar(right, W * 0.75, at[1], '#8DF0AE')}</AbsoluteFill>;
};

/** 选择题：开头抛一个问题让观众猜（「什么宠物最火？」）。左边一列选项牌，先全是「？」，一个个翻开；公布答案时对的那张变金色、其余变灰。右边留给人物竖条（人物用 Stage 的自定义位置放进去）。 */
export const QuizBoard: React.FC<{ title: string; en?: string; options: { text: string; at: number; tone?: string }[]; answer: number; answerAt: number; from: number; to: number }> = ({ title, en, options, answer, answerAt, from, to }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const done = t >= answerAt, OH = 220;
  return <AbsoluteFill style={{ opacity: v }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 210, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: 84, color: '#F4F1E4', letterSpacing: 8, transform: 'skewX(-6deg)' }}>{title}</div>
    {en ? <div style={{ position: 'absolute', left: 0, right: 0, top: 322, textAlign: 'center', fontFamily: FONT, fontSize: 22, letterSpacing: 3, color: 'rgba(255,255,255,.5)' }}>{en}</div> : null}
    {options.map((o, i) => { const p = prog(t, o.at, 0.3), on = p > 0, right = done && i === answer, tone = right ? 'gold' : done ? 'slate' : o.tone ?? ['gold', 'green', 'teal', 'wine'][i % 4], e = prog(t, from + i * 0.1, 0.3);
      return <div key={i} style={{ position: 'absolute', left: 90, top: 410 + i * (OH + 28), width: 430, height: OH, borderRadius: 26, background: grad(tone), border: `4px solid ${right ? '#FFF7C8' : 'rgba(255,255,255,.2)'}`, boxShadow: right ? `0 0 50px ${GOLD}77` : '0 14px 34px rgba(0,0,0,.5)', opacity: e * (done && !right ? 0.5 : 1), filter: done && !right ? 'grayscale(1)' : undefined, transform: `translateX(${mix(-60, 0, e)}px) scale(${right ? mix(1, 1.06, prog(t, answerAt, 0.3)) : 1})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', left: -6, top: -18, fontFamily: FONT_TITLE, fontSize: 30, background: INK, color: '#F4F1E4', padding: '2px 16px', borderRadius: 6, transform: 'skewX(-8deg)' }}>{'ABCD'[i]}</div>
        <div style={{ fontFamily: FONT_TITLE, fontSize: on ? Math.min(110, Math.floor(360 / Math.max(1, o.text.length))) : 110, color: ink(tone), letterSpacing: 6, transform: `scale(${on ? mix(1.3, 1, p) : 1})` }}>{on ? o.text : '?'}</div></div>; })}
  </AbsoluteFill>;
};

/** 虚字：人全屏、刚抛出这期的主题词时，胸口压一个半透明的特大字（「免税」「权重」），一秒多淡掉。只用一次，放开头。 */
export const GhostWord: React.FC<{ text: string; at: number; hold?: number; top?: number }> = ({ text, at, hold = 1.6, top = 900 }) => {
  const t = useT(), v = vis(t, at, at + hold, 0.25, 0.5); if (v <= 0) return null;
  return <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: Math.min(420, Math.floor(980 / text.length)), color: '#fff', opacity: 0.42 * v, letterSpacing: 10, transform: `scale(${mix(1.25, 1, prog(t, at, 0.5))})`, textShadow: '0 0 40px rgba(255,255,255,.5)' }}>{text}</div>;
};

/** 胸口大数：人全屏时说到一个夸张的数（「一千万」），金色大数字从胸口冒出来，数字滚上去。只放有出处或者明确是假设的数；假设的在 note 里写「假设」。 */
export const ChestNumber: React.FC<{ value: number; unit?: string; prefix?: string; note?: string; at: number; hold?: number; top?: number }> = ({ value, unit = '', prefix = '¥', note, at, hold = 2.4, top = 1060 }) => {
  const t = useT(), v = vis(t, at, at + hold); if (v <= 0) return null; const p = prog(t, at, 0.7), s = Math.round(value * p).toLocaleString('en-US');
  return <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', opacity: v, transform: `scale(${mix(0.8, 1, p)})` }}>
    <div style={{ fontFamily: FONT_TITLE, fontSize: Math.min(150, Math.floor(1500 / (s.length + unit.length + 1))), color: '#FBE9A6', textShadow: '0 6px 30px rgba(0,0,0,.65), 0 0 24px rgba(255,220,120,.5)', letterSpacing: 4, whiteSpace: 'nowrap' }}>{prefix}{s}{unit}</div>
    {note ? <div style={{ fontFamily: FONT, fontSize: 26, color: 'rgba(255,255,255,.75)', marginTop: 4 }}>{note}</div> : null}</div>;
};

/** 走势图面板：暗底上一条（或两条）折线，从左到右画出来。对标片里讲行情、讲增长全靠它：线画到哪口播讲到哪，拐点打一个圆点和标签，画完在线头挂当前值。
 *  series 里 points 是一串数（等间距）；drawTo 是线画完的时刻；marks 在第 i 个点上打标记；tilt 让整块板带透视（对标片切到「对比两条线」时会斜过来）；
 *  zoom 给 [开始, 结束] 两个时刻：先贴近看开头一段，再拉开看全貌。color 用这一期的主题色。数必须是真实数据，source 写来源。 */
export const LineBoard: React.FC<{ title: string; en?: string; source?: string; series: { name?: string; color?: string; points: number[] }[]; xLabels?: string[]; unit?: string; from: number; to: number; drawTo?: number; marks?: { i: number; s?: number; label: string; at: number }[]; endTag?: boolean; startTag?: boolean; tilt?: boolean; zoom?: [number, number]; color?: string; top?: number; fill?: boolean }> = ({ title, en, source, series, xLabels = [], unit = '', from, to, drawTo, marks = [], endTag = true, startTag, tilt, zoom, color = '#FF6B6B', top = 330, fill }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const X = 150, Y = top + 190, CW = 800, CH = 820, all = series.flatMap((x) => x.points), lo0 = Math.min(...all), hi0 = Math.max(...all), pad = (hi0 - lo0) * 0.08 || 1, lo = lo0 - pad, hi = hi0 + pad;
  const step = (() => { const raw = (hi - lo) / 5, mag = Math.pow(10, Math.floor(Math.log10(raw))); return [1, 2, 2.5, 5, 10].map((k) => k * mag).find((k) => k >= raw) ?? raw; })(), ticks: number[] = []; for (let k = Math.ceil(lo / step) * step; k <= hi; k += step) ticks.push(k);
  const px = (i: number, n: number) => X + (i / Math.max(1, n - 1)) * CW, py = (val: number) => Y + CH - ((val - lo) / (hi - lo)) * CH, dp = prog(t, from + 0.3, Math.max(0.4, (drawTo ?? from + 2.2) - from - 0.3)), z = zoom ? 1 - prog(t, zoom[0], zoom[1] - zoom[0]) : 0;
  const fmt = (n: number) => (Math.abs(n) >= 1000 ? Math.round(n).toLocaleString('en-US') : String(Math.round(n * 100) / 100));
  return <AbsoluteFill style={{ opacity: v, perspective: 1500 }}><div style={{ position: 'absolute', inset: 0, transformOrigin: `${X + CW * 0.12}px ${py(series[0].points[0])}px`, transform: `scale(${mix(1, 2.3, z)}) ${tilt ? `rotateY(${mix(-16, -9, prog(t, from, 2.5))}deg) rotateX(4deg)` : ''}` }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: 64, color, letterSpacing: 10, opacity: 1 - z }}>{title}</div>
    {en ? <div style={{ position: 'absolute', left: 0, right: 0, top: top + 86, textAlign: 'center', fontFamily: FONT, fontSize: 22, letterSpacing: 2, color: 'rgba(255,255,255,.6)', opacity: 1 - z }}>{en}</div> : null}
    <div style={{ position: 'absolute', left: X, top: Y, width: CW, height: CH, background: 'rgba(255,255,255,.06)', border: '2px solid rgba(255,255,255,.28)' }} />
    {ticks.map((k) => <React.Fragment key={k}><div style={{ position: 'absolute', left: X, top: py(k), width: CW, height: 1, background: 'rgba(255,255,255,.14)' }} /><div style={{ position: 'absolute', left: X - 130, width: 116, top: py(k) - 15, textAlign: 'right', fontFamily: FONT_TITLE, fontSize: 24, color: 'rgba(255,255,255,.7)' }}>{fmt(k)}</div></React.Fragment>)}
    {xLabels.map((l, i) => <div key={i} style={{ position: 'absolute', left: px(i, xLabels.length) - 60, width: 120, top: Y + CH + 14, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: 22, color: 'rgba(255,255,255,.65)' }}>{l}</div>)}
    <svg width={W} height={H} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>{series.map((sr, si) => { const n = sr.points.length, upto = dp * (n - 1), k = Math.floor(upto), f = upto - k, pts = sr.points.slice(0, k + 1).map((val, i) => [px(i, n), py(val)]); if (k < n - 1) pts.push([mix(px(k, n), px(k + 1, n), f), mix(py(sr.points[k]), py(sr.points[k + 1]), f)]); const c = sr.color ?? (si ? '#6FB2FF' : color), d = pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join(' '), last = pts[pts.length - 1];
      return <g key={si}>{fill && si === 0 ? <path d={`${d} L${last[0]} ${Y + CH} L${X} ${Y + CH} Z`} fill={c} opacity={0.12} /> : null}<path d={d} fill="none" stroke={c} strokeWidth={5 / mix(1, 2.3, z) + 1} strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 8px ${c})` }} /><circle cx={last[0]} cy={last[1]} r={9} fill={c} stroke="#fff" strokeWidth={2} /></g>; })}</svg>
    {series.map((sr, si) => { const n = sr.points.length, c = sr.color ?? (si ? '#6FB2FF' : color); return <React.Fragment key={si}>
      {startTag && si === 0 ? <div style={{ position: 'absolute', left: px(0, n) - 10, top: py(sr.points[0]) + 18, fontFamily: FONT_TITLE, fontSize: 28, color: '#0B0D14', background: c, padding: '2px 12px', borderRadius: 6, opacity: prog(t, from + 0.3, 0.3) }}>{fmt(sr.points[0])}{unit}</div> : null}
      {endTag && dp >= 1 ? <div style={{ position: 'absolute', left: px(n - 1, n) - 150, width: 140, textAlign: 'right', top: py(sr.points[n - 1]) - 20 + (si ? 34 : -34), fontFamily: FONT_TITLE, fontSize: 30, color: c, textShadow: '0 2px 10px #000' }}>{sr.name ? sr.name + ' ' : ''}{fmt(sr.points[n - 1])}{unit}</div> : null}</React.Fragment>; })}
    {marks.map((m, i) => { const sr = series[m.s ?? 0], n = sr.points.length, q = prog(t, m.at, 0.3); if (q <= 0) return null; const x = px(m.i, n), y = py(sr.points[m.i]), c = sr.color ?? color;
      return <React.Fragment key={i}><div style={{ position: 'absolute', left: x - 16, top: y - 16, width: 32, height: 32, borderRadius: '50%', background: c, border: '3px solid #fff', boxShadow: `0 0 0 ${mix(26, 8, q)}px ${c}44`, transform: `scale(${mix(1.8, 1, q)})` }} />
        <div style={{ position: 'absolute', left: Math.min(Math.max(x - 130, X), X + CW - 260), width: 260, top: y - 84, textAlign: 'center', opacity: q }}><span style={{ fontFamily: FONT_TITLE, fontSize: 30, color: '#0B0D14', background: '#fff', padding: '4px 14px', borderRadius: 6, whiteSpace: 'nowrap' }}>{m.label}</span></div></React.Fragment>; })}
    {source ? <div style={{ position: 'absolute', left: X, top: Y + CH + 58, fontFamily: FONT, fontSize: 20, color: 'rgba(255,255,255,.5)', opacity: 1 - z }}>来源：{source}</div> : null}
  </div></AbsoluteFill>;
};

/** 步骤清单：一套打法分几步（「激进股权投资：1 入股控制 2 大改造 3 套现离场」）。斜体大序号 + 步骤名 + 一行说明；讲到哪步哪步亮、放大，没讲到的压暗。
 *  img 可以在左边放一张人物或物件的抠图（对标片放的是当事人的雕像）。 */
export const StepList: React.FC<{ title: string; en?: string; steps: { name: string; note?: string; at: number }[]; from: number; to: number; color?: string; img?: string; top?: number }> = ({ title, en, steps, from, to, color = '#E0454A', img, top = 330 }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const cur = steps.reduce((a, x, i) => (t >= x.at ? i : a), -1), L = img ? 380 : 150, SH = 250;
  return <AbsoluteFill style={{ opacity: v }}>
    <div style={{ position: 'absolute', left: L - 60, right: 50, top, height: 230 + steps.length * SH, background: 'linear-gradient(160deg, rgba(120,24,28,.5), rgba(20,8,10,.9))', border: `3px solid ${color}88`, borderRadius: 14 }} />
    {img ? <Img src={src(img)} style={{ position: 'absolute', left: 0, top: top + 120, width: 430, height: 1000, objectFit: 'cover', objectPosition: 'top' }} /> : null}
    <div style={{ position: 'absolute', left: L, right: 60, top: top + 40, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: 76, color, letterSpacing: 10, transform: 'skewX(-8deg)' }}>{title}</div>
    {en ? <div style={{ position: 'absolute', left: L, right: 60, top: top + 140, textAlign: 'center', fontFamily: FONT, fontSize: 26, letterSpacing: 6, color: `${color}cc` }}>{en}</div> : null}
    {steps.map((x, i) => { const p = prog(t, x.at, 0.35), here = i === cur, seen = p > 0;
      return <div key={i} style={{ position: 'absolute', left: L, right: 80, top: top + 220 + i * SH, height: SH - 20, borderTop: '1px solid rgba(255,255,255,.14)', display: 'flex', alignItems: 'center', gap: 28, opacity: seen ? (here ? 1 : 0.62) : 0.28, transform: `scale(${here ? mix(1, 1.06, p) : 1})`, transformOrigin: 'left center' }}>
        <div style={{ fontFamily: FONT_TITLE, fontSize: 190, lineHeight: 1, color: here ? color : `${color}77`, transform: 'skewX(-10deg)', width: 130, textAlign: 'center' }}>{i + 1}</div>
        <div><div style={{ fontFamily: FONT_TITLE, fontSize: 72, color: '#fff', letterSpacing: 6, whiteSpace: 'nowrap' }}>{x.name}</div>{x.note ? <div style={{ fontFamily: FONT_TITLE, fontSize: 30, color: here ? '#FFB3B3' : 'rgba(255,255,255,.6)', marginTop: 10, letterSpacing: 2 }}>{x.note}</div> : null}</div></div>; })}
  </AbsoluteFill>;
};

/** 层级链路：一样东西从上游到下游要过几道关（「高压电网 → 变电站 → ATS → 变压器 → 服务器机柜」）。竖着一串发光的牌子，中间连线；讲到哪块哪块亮起来并放大，上面讲过的缩小留着。 */
export const ChainCards: React.FC<{ items: { name: string; en?: string; img?: string; at: number }[]; from: number; to: number; color?: string; top?: number }> = ({ items, from, to, color = '#59B6FF', top = 330 }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const cur = items.reduce((a, x, i) => (t >= x.at ? i : a), -1), IH = Math.min(260, Math.floor(1180 / items.length));
  return <AbsoluteFill style={{ opacity: v }}>
    <div style={{ position: 'absolute', left: W / 2 - 3, top: top + 40, width: 6, height: (items.length - 1) * IH + 40, background: `linear-gradient(180deg, ${color}, ${color}22)`, boxShadow: `0 0 18px ${color}` }} />
    {items.map((x, i) => { const p = prog(t, x.at, 0.35), here = i === cur, seen = p > 0, e = prog(t, from + i * 0.1, 0.3);
      return <div key={i} style={{ position: 'absolute', left: 110, right: 110, top: top + i * IH, height: IH - 50, border: `3px solid ${seen ? color : 'rgba(255,255,255,.22)'}`, background: here ? `linear-gradient(160deg, ${color}66, rgba(10,24,60,.92))` : 'rgba(10,18,40,.88)', boxShadow: here ? `0 0 44px ${color}aa, inset 0 0 30px ${color}44` : undefined, opacity: e * (seen ? (here ? 1 : 0.7) : 0.4), transform: `scale(${here ? mix(1, 1.08, p) : seen ? 0.96 : 0.92})`, display: 'flex', alignItems: 'center', justifyContent: x.img ? 'space-between' : 'center', padding: '0 46px', boxSizing: 'border-box' }}>
        {x.img ? <Img src={src(x.img)} style={{ height: '78%', maxWidth: 300, objectFit: 'contain' }} /> : null}
        <div style={{ textAlign: x.img ? 'right' : 'center' }}><div style={{ fontFamily: FONT_TITLE, fontSize: Math.min(92, Math.floor(620 / Math.max(2, x.name.length))), color: '#EAF4FF', letterSpacing: 8, textShadow: here ? `0 0 20px ${color}` : undefined, whiteSpace: 'nowrap' }}>{x.name}</div>{x.en ? <div style={{ fontFamily: FONT, fontSize: 20, color: `${color}cc`, letterSpacing: 2, marginTop: 4 }}>{x.en}</div> : null}</div></div>; })}
  </AbsoluteFill>;
};

/** 格子占比：一百个小格子表示整个市场，几家的份额一格格涂上颜色，涂完上面跳出合计百分比（「前五加起来 19.7%」）。比饼图更能让人感觉到「就这么点」。
 *  frame 给 true 时装在一个白色手机壳里（讲手机、App 的那期这么用）。份额必须有出处。 */
export const Waffle: React.FC<{ title: string; en?: string; parts: { name: string; value: number; color: string }[]; rest?: string; from: number; to: number; fillAt: number; frame?: boolean; top?: number }> = ({ title, en, parts, rest = '其它', from, to, fillAt, frame, top = 300 }) => {
  const t = useT(), v = vis(t, from, to); if (v <= 0) return null; const total = parts.reduce((a, x) => a + x.value, 0), p = prog(t, fillAt, 1.4), n = Math.round(total * p), CELL = 66, GX = (W - CELL * 10) / 2, GY = top + 400, dark = !frame, col = (k: number) => { let acc = 0; for (const x of parts) { acc += x.value; if (k < Math.round(acc)) return x.color; } return parts[parts.length - 1].color; };
  return <AbsoluteFill style={{ opacity: v }}>
    {frame ? <div style={{ position: 'absolute', left: 130, top: top - 60, width: W - 260, height: 1320, borderRadius: 90, background: '#fff', border: '14px solid #D9DBE0', boxShadow: '0 30px 80px rgba(0,0,0,.6)' }} /> : null}
    <div style={{ position: 'absolute', left: 0, right: 0, top: top + 20, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: 46, color: dark ? '#F4F1E4' : '#5A5F6B', letterSpacing: 4 }}>{title}</div>
    {en ? <div style={{ position: 'absolute', left: 0, right: 0, top: top + 84, textAlign: 'center', fontFamily: FONT, fontSize: 18, color: dark ? 'rgba(255,255,255,.5)' : '#A2A7B2' }}>{en}</div> : null}
    <div style={{ position: 'absolute', left: 0, right: 0, top: top + 190, textAlign: 'center', fontFamily: FONT_TITLE, fontSize: 170, lineHeight: 1, color: parts[0].color, opacity: p, transform: `scale(${mix(0.8, 1, p)})` }}>{(Math.round(total * p * 10) / 10).toFixed(1)}<span style={{ fontSize: 70 }}>%</span></div>
    {Array.from({ length: 100 }, (_, k) => <div key={k} style={{ position: 'absolute', left: GX + (k % 10) * CELL + 3, top: GY + Math.floor(k / 10) * CELL + 3, width: CELL - 6, height: CELL - 6, background: k < n ? col(k) : dark ? 'rgba(255,255,255,.14)' : '#D5D7DC' }} />)}
    <div style={{ position: 'absolute', left: GX, top: GY + 10 * CELL + 24, width: CELL * 10, display: 'flex', flexWrap: 'wrap', gap: '8px 22px', justifyContent: 'center' }}>{[...parts, { name: rest, value: 100 - total, color: dark ? 'rgba(255,255,255,.3)' : '#C3C6CC' }].map((x) => <div key={x.name} style={{ display: 'flex', alignItems: 'center', gap: 8, fontFamily: FONT_TITLE, fontSize: 26, color: dark ? '#F4F1E4' : '#5A5F6B' }}><span style={{ width: 22, height: 22, background: x.color }} />{x.name} {Math.round(x.value * 10) / 10}%</div>)}</div>
  </AbsoluteFill>;
};

/** 演示：第三批组件各放 3 秒（docs 里的对照图就是从这儿截的）。内容是编的示例，不是任何一期的真实数据。 */
export const TALK3_DEMO_SEC = 45;
export const Talk3Demo: React.FC<{ video?: string }> = ({ video }) => {
  useFonts();
  const person = <AbsoluteFill style={{ background: 'linear-gradient(180deg,#5b5f6b,#2b2d35)' }}><div style={{ position: 'absolute', left: 390, top: 430, width: 300, height: 300, borderRadius: '50%', background: '#8b8f9c' }} /><div style={{ position: 'absolute', left: 190, top: 760, width: 700, height: 900, borderRadius: '180px 180px 0 0', background: '#8b8f9c' }} /><div style={{ position: 'absolute', left: 0, top: 1620, width: W, height: 300, background: '#000' }} /></AbsoluteFill>;
  const s = (i: number) => i * 3, bg = (i: number) => <Starfield from={s(i)} to={s(i) + 2.8} />;
  return <AbsoluteFill style={{ background: '#000' }}>{video ? null : person}
    {bg(0)}<KeywordOrb text="DeepSeek" sub="想干嘛？" from={0} to={2.8} />
    {bg(1)}<Treemap title="首轮外部融资" en="First Round External Financing" tilt from={3} to={5.8} rows={[{ h: 3, cells: [{ label: '创始人', value: '200', unit: '亿', tone: 'blue', at: 3.3 }] }, { h: 2, cells: [{ label: '腾讯', value: '100', unit: '亿', tone: 'teal', at: 3.6, w: 2 }, { label: '宁德时代', value: '50', unit: '亿', tone: 'teal', at: 3.9, hot: 4.6 }, { label: '京东', value: '30', unit: '亿', tone: 'teal', at: 4.1, w: 0.7 }] }, { h: 1.3, cells: [{ label: '网易', value: '30', unit: '亿', tone: 'purple', at: 4.3 }, { label: 'IDG', value: '30', unit: '亿', tone: 'purple', at: 4.4 }, { label: '其它', tone: 'slate', at: 99 }] }]} />
    {bg(2)}<QuoteCard3 lines={['我们最大的核心利益是要保持', '团队的稳定性，甚至可以认为', '是唯一的核心利益']} hot={['最大的核心利益', '团队的稳定性']} name="某创始人" en="Founder" source="投资者交流会录音文字稿（示例）" from={6} to={8.8} push={7.6} />
    {bg(3)}<PeopleFlow from={9} to={11.8} rows={[{ name: '王某', dest: '腾讯', at: 9.5 }, { name: '罗某', dest: '小米', at: 10.4 }, { name: '郭某', dest: '字节', at: 99 }]} />
    <Bubbles from={12} to={14.8} hot={[[13.4, 4]]} items={[{ text: '代购', x: 0.2, y: 0.34, r: 120, tone: 'purple' }, { text: '离岛免税', x: 0.6, y: 0.27, r: 90, tone: 'slate' }, { text: '转运海淘', x: 0.8, y: 0.4, r: 130, tone: 'green' }, { text: '出国买', x: 0.2, y: 0.52, r: 115, tone: 'wine' }, { text: '免税店', en: 'Duty-Free Shop', x: 0.28, y: 0.72, r: 190, tone: 'teal' }, { text: '跨境电商', x: 0.74, y: 0.7, r: 140, tone: 'blue' }]} />
    {bg(5)}<MatrixBoard from={15} to={17.8} cols={['增值税', '消费税', '关税']} rows={[{ label: '出国买', en: 'Buy Overseas', tone: 'teal', cells: ['免', '免', '免'], at: [15.6, 15.8, 16] }, { label: '免税店', en: 'Duty-Free', tone: 'purple', cells: ['免', '免', '免'], at: [16.4, 16.6, 16.8] }, { label: '离岛免税', tone: 'slate', cells: ['免', '免', '免'], at: [99, 99, 99] }, { label: '跨境电商', tone: 'wine', cells: ['7 折', '7 折', '免'], at: [99, 99, 99] }]} />
    <StackBars from={18} to={20.8} at={[18.3, 19.2]} left={{ value: 3395, label: '官方', en: 'Official Price' }} right={{ value: 1669, label: '免税店', en: 'Duty-Free Shop Price' }} />
    {bg(7)}<QuizBoard title="什么宠物最火？" en="What are the most popular pets?" from={21} to={23.8} answer={0} answerAt={23} options={[{ text: '猫', at: 21.5 }, { text: '狗', at: 21.8 }, { text: '龟', at: 22.1 }, { text: '蜥蜴', at: 22.4 }]} />
    {bg(10)}<LineBoard title="某指数走势" en="示例数据 · Jan – Jul" source="示例，不是真实行情" from={30} to={32.8} drawTo={31.8} xLabels={['1月', '2月', '3月', '4月', '5月', '6月', '7月']} marks={[{ i: 33, label: '6 月高点', at: 31.6 }]} series={[{ points: Array.from({ length: 42 }, (_, i) => 4300 + i * 120 + Math.sin(i * 0.9) * 260 + (i > 33 ? -(i - 33) * 520 : 0) + rnd(i) * 220) }]} />
    {bg(11)}<LineBoard title="两家年内涨跌" en="示例数据 · 涨跌幅 %" tilt unit="%" from={33} to={35.8} drawTo={34.8} color="#FF6B6B" series={[{ name: '甲', points: Array.from({ length: 40 }, (_, i) => i * i * 0.16 + Math.sin(i * 0.8) * 12 + rnd(i + 5) * 10) }, { name: '乙', points: Array.from({ length: 40 }, (_, i) => i * i * 0.085 + Math.sin(i * 0.7 + 1) * 10 + rnd(i + 50) * 8) }]} />
    {bg(12)}<StepList title="激进股权投资" en="Activist Investor" from={36} to={38.8} steps={[{ name: '入股控制', note: '发掘底子优良的问题公司', at: 36.4 }, { name: '大改造', note: '换管理层、砍成本、改战略', at: 37.4 }, { name: '套现离场', note: '等估值上升，卖掉', at: 99 }]} />
    {bg(13)}<ChainCards from={39} to={41.8} items={[{ name: '高压电网', en: 'High-Voltage Grid', at: 39.3 }, { name: '变电站', en: 'Substation', at: 39.9 }, { name: 'ATS', en: 'Automatic Transfer Switch', at: 40.6 }, { name: '变压器', en: 'Transformer', at: 99 }, { name: '服务器机柜', en: 'Server Rack', at: 99 }]} />
    {bg(14)}<Waffle title="某市场前五家占比" en="示例数据" frame from={42} to={44.8} fillAt={42.6} parts={[{ name: '甲', value: 8.2, color: '#F6C800' }, { name: '乙', value: 5.1, color: '#F08A24' }, { name: '丙', value: 3.4, color: '#E5533C' }, { name: '丁', value: 2, color: '#D0408A' }, { name: '戊', value: 1, color: '#9A45C8' }]} />
    <GhostWord text="免税" at={24.2} hold={2.4} />
    <ChestNumber value={10000000} at={27.2} note="示例数字" />
  </AbsoluteFill>;
};
