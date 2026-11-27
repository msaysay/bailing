// 2026-11 新增的一批组件。做法参考了几个开源项目里的动效思路，代码是按我们自己的时钟和配色重写的，没有搬它们的源码：
//   Remocn/remocn（MIT）：滚轮数字、总数拆分、逐词滑框、胶囊放大、句子自改、流向图、哑铃图、分段重分配、冲破图表、翻牌
//   magicuidesign/magicui（MIT）：光束连线、融化换字、像素块显影
// 时间都传秒（at 是出现的时刻），颜色默认跟 kit 的 C 走，color / hot 可以换成这一期骨架的强调色。
import React from 'react';
import { Img, staticFile } from 'remotion';
import { inOut, mix, prog } from '../kit/clock';
import { C, FONT, useT } from '../kit/kit';

const cl = (v: number) => Math.max(0, Math.min(1, v));
const out4 = (p: number) => 1 - Math.pow(1 - cl(p), 4);
const rnd = (i: number) => { const x = Math.sin(i * 91.7 + 13.1) * 43758.5453; return x - Math.floor(x); };
const fmt = (n: number) => Math.round(n).toLocaleString('en-US');

/** 滚轮数字：像里程表，每一位各自滚到位，高位后到。比一路数上去更有「跳表」的感觉。适合金额、播放量、人数。 */
export const RollingNumber: React.FC<{ to: number; at: number; dur?: number; prefix?: string; unit?: string; label?: string; size?: number; color?: string }> = ({ to, at, dur = 1.6, prefix = '', unit = '', label, size = 220, color = C.text }) => {
  const t = useT(), s = String(Math.round(to)), n = s.length, H = size * 1.08;
  return <div style={{ textAlign: 'center', fontFamily: FONT }}>
    {label ? <div style={{ fontSize: 34, color: C.muted, marginBottom: 10, opacity: prog(t, at, 0.4) }}>{label}</div> : null}
    <div style={{ display: 'inline-flex', alignItems: 'flex-end', fontSize: size, fontWeight: 900, color, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
      {prefix ? <span style={{ fontSize: size * 0.5, marginRight: 10, alignSelf: 'center' }}>{prefix}</span> : null}
      {s.split('').map((d, i) => { const place = n - 1 - i, p = out4((t - at - place * 0.08) / (dur * (0.55 + 0.45 * (i + 1) / n))), turns = (i + 1) * 10 + Number(d), pos = turns * p, show = p > 0 || place === 0;
        return <React.Fragment key={i}>{place % 3 === 2 && i > 0 ? <span style={{ opacity: show ? 0.55 : 0, width: size * 0.2, fontSize: size * 0.6, textAlign: 'center' }}>,</span> : null}
          <span style={{ display: 'inline-block', height: H, width: size * 0.62, overflow: 'hidden', opacity: show ? 1 : 0, position: 'relative' }}><span style={{ position: 'absolute', left: 0, right: 0, top: -(pos % 10) * H, textAlign: 'center' }}>{Array.from({ length: 11 }, (_, k) => <span key={k} style={{ display: 'block', height: H, lineHeight: `${H}px` }}>{k % 10}</span>)}</span></span></React.Fragment>; })}
      {unit ? <span style={{ fontSize: size * 0.34, marginLeft: 14, marginBottom: size * 0.1 }}>{unit}</span> : null}
    </div></div>;
};

/** 总数拆分：先落一个总数，停一下，往上让位，下面分出几支，各自数出分项。适合「三千亿，其中……」。分项加起来要等于总数。 */
export const NumberSplit: React.FC<{ total: number; unit?: string; label: string; parts: { name: string; value: number; color?: string }[]; at: number; splitAt: number; width?: number }> = ({ total, unit = '', label, parts, at, splitAt, width = 1400 }) => {
  const t = useT(), p = prog(t, at, 0.6), up = inOut((t - splitAt) / 0.8), sum = parts.reduce((a, x) => a + x.value, 0) || 1, cols = [C.accent, C.warm, '#4ADE80', '#C084FC', C.down];
  return <div style={{ width, fontFamily: FONT, position: 'relative', height: 620 }}>
    <div style={{ position: 'absolute', left: 0, right: 0, top: mix(150, 0, up), textAlign: 'center', opacity: p, transform: `scale(${mix(1, 0.62, up)})`, transformOrigin: 'top center' }}>
      <div style={{ fontSize: 34, color: C.muted }}>{label}</div><div style={{ fontSize: 220, fontWeight: 900, lineHeight: 1.05, fontVariantNumeric: 'tabular-nums' }}>{fmt(total * p)}<span style={{ fontSize: 76, marginLeft: 12 }}>{unit}</span></div></div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 250, height: 26, display: 'flex', gap: mix(0, 14, up), opacity: cl((t - splitAt + 0.2) / 0.3) }}>{parts.map((x, i) => <div key={i} style={{ flex: x.value / sum, background: up > 0.02 ? x.color ?? cols[i % 5] : C.text, borderRadius: 6 }} />)}</div>
    <div style={{ position: 'absolute', left: 0, right: 0, top: 300, display: 'flex', gap: 14 }}>{parts.map((x, i) => { const q = prog(t, splitAt + 0.6 + i * 0.18, 0.5), col = x.color ?? cols[i % 5];
      return <div key={i} style={{ flex: x.value / sum, minWidth: 0, opacity: q, transform: `translateY(${mix(-30, 0, q)}px)` }}><div style={{ width: 4, height: 60, background: col, margin: '0 auto' }} />
        <div style={{ textAlign: 'center', marginTop: 10 }}><div style={{ fontSize: 76, fontWeight: 900, color: col, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmt(x.value * q)}<span style={{ fontSize: 30 }}>{unit}</span></div><div style={{ fontSize: 30, color: C.text, whiteSpace: 'nowrap' }}>{x.name}</div><div style={{ fontSize: 24, color: C.muted }}>{Math.round((x.value / sum) * 100)}%</div></div></div>; })}</div>
  </div>;
};

/** 逐词滑框：一句话摆在那，一块色块跟着念到的词滑过去垫在后面。比变色更稳，适合读一句定义、一条规定。words 里写每个词和它念到的时刻。 */
export const SlideBoxCaption: React.FC<{ words: { t: string; at: number }[]; size?: number; hot?: string; width?: number }> = ({ words, size = 76, hot = C.warm, width = 1500 }) => {
  const t = useT(), cur = words.reduce((a, w, i) => (t >= w.at ? i : a), -1), ref = React.useRef<(HTMLSpanElement | null)[]>([]), [box, setBox] = React.useState<{ l: number; t: number; w: number; h: number }[]>([]);
  React.useLayoutEffect(() => { setBox(ref.current.map((e) => (e ? { l: e.offsetLeft, t: e.offsetTop, w: e.offsetWidth, h: e.offsetHeight } : { l: 0, t: 0, w: 0, h: 0 }))); }, [words.length, size, width]);
  const a = box[Math.max(0, cur - 1)], b = box[Math.max(0, cur)], p = cur >= 0 ? inOut((t - words[cur].at) / 0.14) : 0, on = cur >= 0 && b ? cl((t - words[0].at) / 0.16) : 0;
  const m = a && b && a.t === b.t ? { l: mix(a.l, b.l, p), t: b.t, w: mix(a.w, b.w, p), h: b.h } : b;
  return <div style={{ width, position: 'relative', fontFamily: FONT, fontSize: size, fontWeight: 900, lineHeight: 1.5, textAlign: 'center' }}>
    {m ? <div style={{ position: 'absolute', left: m.l - 10, top: m.t + m.h * 0.08, width: m.w + 20, height: m.h * 0.84, background: hot, borderRadius: 12, opacity: on }} /> : null}
    {words.map((w, i) => <span key={i} ref={(e) => { ref.current[i] = e; }} style={{ position: 'relative', display: 'inline-block', padding: '0 6px', color: i === cur ? '#111' : i < cur ? C.text : C.muted }}>{w.t}</span>)}
  </div>;
};

/** 胶囊放大：句子里的一个关键词先变成一枚胶囊，把两边的字挤开，两边的字虚掉，胶囊长成满屏的大字。适合「把一个词升格成这一章的标题」。 */
export const PillTakeover: React.FC<{ before: string; word: string; after?: string; at: number; growAt: number; color?: string; size?: number }> = ({ before, word, after = '', at, growAt, color = C.accent, size = 72 }) => {
  const t = useT(), open = prog(t, at, 0.4), g = inOut((t - growAt) / 0.8), side: React.CSSProperties = { opacity: 1 - g, filter: `blur(${g * 14}px)`, transform: `scale(${1 - g * 0.1})`, whiteSpace: 'nowrap' };
  return <div style={{ fontFamily: FONT, fontSize: size, fontWeight: 800, color: C.text, display: 'flex', alignItems: 'center', width: 1700, gap: mix(0, 26, open) + g * 40 }}>
    <span style={{ ...side, flex: '1 1 0', textAlign: 'right' }}>{before}</span>
    <span style={{ background: `rgba(91,155,255,${open * (1 - g * 0.2)})`, backgroundColor: color, color: '#fff', padding: `${mix(0, 10, open)}px ${mix(0, 34, open)}px`, borderRadius: 999, fontWeight: 900, transform: `scale(${1 + g * 2.1})`, boxShadow: `0 ${20 * g}px ${70 * g}px rgba(0,0,0,.45)`, whiteSpace: 'nowrap', zIndex: 2, opacity: open > 0 ? 1 : 0.999 }}>{word}</span>
    <span style={{ ...side, flex: '1 1 0', textAlign: 'left' }}>{after}</span></div>;
};

/** 句子自改：一句话摆好，其中一段被选中、换成另一个说法，其余的字自动挪位。适合「原话是 A，其实是 B」「口径从 A 改成了 B」。 */
export const SentenceEdit: React.FC<{ head: string; from: string; to: string; tail?: string; at: number; editAt: number; size?: number; hot?: string; width?: number }> = ({ head, from, to, tail = '', at, editAt, size = 78, hot = C.warm, width = 1500 }) => {
  const t = useT(), show = prog(t, at, 0.4), sel = cl((t - editAt) / 0.35), sw = inOut((t - editAt - 0.55) / 0.5), wFrom = from.length, wTo = to.length, wch = mix(wFrom, wTo, sw);
  return <div style={{ width, fontFamily: FONT, fontSize: size, fontWeight: 800, color: C.text, textAlign: 'center', opacity: show, lineHeight: 1.5 }}>{head}
    <span style={{ display: 'inline-block', position: 'relative', width: `${wch}em`, height: '1.5em', verticalAlign: 'top', margin: '0 8px' }}>
      <span style={{ position: 'absolute', left: -6, top: '0.14em', height: '1.22em', width: `calc(${sel * 100}% + 12px)`, background: sw > 0.5 ? hot : 'rgba(91,155,255,.45)', borderRadius: 8 }} />
      <span style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: 1 - sw, transform: `translateY(${-sw * 40}px)`, whiteSpace: 'nowrap', textDecoration: sel > 0.9 && sw < 0.4 ? 'line-through' : undefined }}>{from}</span>
      <span style={{ position: 'absolute', left: 0, right: 0, top: 0, opacity: sw, transform: `translateY(${(1 - sw) * 40}px)`, whiteSpace: 'nowrap', color: '#111', fontWeight: 900 }}>{to}</span></span>{tail}</div>;
};

/** 流向图：左边几个来源，右边几个去向，彩带一条条流过去，粗细按数量。适合「钱从哪来、花到哪去」「流量从哪来」。 */
export const SankeyFlow: React.FC<{ from: { name: string; value: number; color?: string }[]; to: { name: string; value: number }[]; at: number; unit?: string; width?: number; height?: number }> = ({ from, to, at, unit = '', width = 1500, height = 640 }) => {
  const t = useT(), sf = from.reduce((a, x) => a + x.value, 0), st = to.reduce((a, x) => a + x.value, 0), gap = 18, NW = 26, cols = [C.accent, C.warm, '#4ADE80', '#C084FC', C.down], lx = 280, rx = width - 280;
  const lay = (arr: { value: number }[], sum: number) => { let y = 0; const usable = height - gap * (arr.length - 1); return arr.map((x) => { const h = (x.value / sum) * usable, r = { y, h }; y += h + gap; return r; }); }, L = lay(from, sf), Rr = lay(to, st);
  let k = 0; const ro = Rr.map(() => 0), links: React.ReactNode[] = [];
  from.forEach((f, i) => { let lo = 0; to.forEach((d, j) => { const v = (f.value * d.value) / sf, hL = (v / sf) * (height - gap * (from.length - 1)), hR = (v / st) * (height - gap * (to.length - 1)), y0 = L[i].y + lo + hL / 2, y1 = Rr[j].y + ro[j] + hR / 2; lo += hL; ro[j] += hR; const p = out4((t - at - 0.5 - k * 0.07) / 1.1); k++;
      const d0 = `M${lx + NW} ${y0} C ${(lx + rx) / 2} ${y0}, ${(lx + rx) / 2} ${y1}, ${rx} ${y1}`; links.push(<path key={`${i}-${j}`} d={d0} fill="none" stroke={f.color ?? cols[i % 5]} strokeOpacity={0.5} strokeWidth={Math.max(2, (hL + hR) / 2)} pathLength={1} strokeDasharray={`${p} 1`} />); }); });
  return <div style={{ width, height, position: 'relative', fontFamily: FONT }}><svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>{links}</svg>
    {from.map((f, i) => { const p = prog(t, at + i * 0.1, 0.5); return <React.Fragment key={i}><div style={{ position: 'absolute', left: lx, top: L[i].y, width: NW, height: L[i].h * p, background: f.color ?? cols[i % 5], borderRadius: 4 }} /><div style={{ position: 'absolute', left: 0, width: lx - 18, top: L[i].y + L[i].h / 2 - 34, textAlign: 'right', opacity: p }}><div style={{ fontSize: 34, fontWeight: 800 }}>{f.name}</div><div style={{ fontSize: 26, color: C.muted }}>{fmt(f.value * p)}{unit}</div></div></React.Fragment>; })}
    {to.map((d, j) => { const p = prog(t, at + 1.3 + j * 0.12, 0.5); return <React.Fragment key={j}><div style={{ position: 'absolute', left: rx, top: Rr[j].y, width: NW, height: Rr[j].h * p, background: C.text, borderRadius: 4 }} /><div style={{ position: 'absolute', left: rx + NW + 18, top: Rr[j].y + Rr[j].h / 2 - 34, opacity: p }}><div style={{ fontSize: 34, fontWeight: 800 }}>{d.name}</div><div style={{ fontSize: 26, color: C.muted }}>{fmt(d.value * p)}{unit}</div></div></React.Fragment>; })}</div>;
};

/** 前后哑铃图：很多项各有「之前」和「之后」两个数。先出之前的点，再滑到之后的位置，中间拉出一根杠，变化最大的那行亮起来。适合多城市、多品类的涨跌对比。 */
export const DumbbellShift: React.FC<{ rows: { name: string; before: number; after: number }[]; at: number; shiftAt: number; unit?: string; labels?: [string, string]; width?: number }> = ({ rows, at, shiftAt, unit = '', labels = ['之前', '之后'], width = 1400 }) => {
  const t = useT(), all = rows.flatMap((r) => [r.before, r.after]), lo = Math.min(...all), hi = Math.max(...all), pad = (hi - lo) * 0.12 || 1, X = (v: number) => 300 + ((v - lo + pad) / (hi - lo + 2 * pad)) * (width - 420), best = rows.reduce((a, r, i) => (Math.abs(r.after - r.before) > Math.abs(rows[a].after - rows[a].before) ? i : a), 0), RH = Math.min(96, 560 / rows.length);
  return <div style={{ width, fontFamily: FONT, position: 'relative', height: rows.length * RH + 60 }}>
    <div style={{ position: 'absolute', right: 0, top: 0, display: 'flex', gap: 30, fontSize: 26, color: C.muted }}><span><i style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: C.muted, marginRight: 8 }} />{labels[0]}</span><span><i style={{ display: 'inline-block', width: 16, height: 16, borderRadius: 8, background: C.accent, marginRight: 8 }} />{labels[1]}</span></div>
    {rows.map((r, i) => { const p = prog(t, at + i * 0.08, 0.4), s = inOut((t - shiftAt - i * 0.1) / 0.8), x0 = X(r.before), x1 = mix(x0, X(r.after), s), y = 50 + i * RH + RH / 2, hot = i === best && s > 0.95, col = r.after >= r.before ? C.accent : C.down;
      return <React.Fragment key={i}><div style={{ position: 'absolute', left: 0, width: 270, top: y - 22, textAlign: 'right', fontSize: 34, fontWeight: hot ? 900 : 600, color: hot ? C.text : C.muted, opacity: p }}>{r.name}</div>
        <div style={{ position: 'absolute', left: 300, right: 120, top: y, height: 1, background: C.line }} />
        <div style={{ position: 'absolute', left: Math.min(x0, x1), top: y - 4, width: Math.abs(x1 - x0), height: 8, background: col, opacity: 0.55 }} />
        <div style={{ position: 'absolute', left: x0 - 11, top: y - 11, width: 22, height: 22, borderRadius: 11, background: C.muted, opacity: p }} />
        <div style={{ position: 'absolute', left: x1 - 15, top: y - 15, width: 30, height: 30, borderRadius: 15, background: col, opacity: s > 0 ? 1 : 0, boxShadow: hot ? `0 0 26px ${col}` : undefined }} />
        <div style={{ position: 'absolute', left: Math.max(x0, x1) + 26, top: y - 22, fontSize: 32, fontWeight: 800, color: col, opacity: cl(s * 2 - 1), whiteSpace: 'nowrap' }}>{r.after > r.before ? '+' : ''}{fmt(r.after - r.before)}{unit}</div></React.Fragment>; })}</div>;
};

/** 分段重分配：一根长条分成几段（时间、预算怎么花的）。到点后各段缩成新的大小，空出来的那一截亮成「省下来的」，上面滚出省了多少。 */
export const TimeBreakdown: React.FC<{ segs: { name: string; before: number; after: number; color?: string }[]; at: number; shiftAt: number; unit?: string; saved?: string; width?: number }> = ({ segs, at, shiftAt, unit = '', saved = '省下来', width = 1500 }) => {
  const t = useT(), sb = segs.reduce((a, x) => a + x.before, 0), sa = segs.reduce((a, x) => a + x.after, 0), s = inOut((t - shiftAt) / 1.1), cols = [C.accent, '#C084FC', C.warm, C.down, '#38BDF8'], p = prog(t, at, 0.6), free = (sb - sa) * s;
  return <div style={{ width, fontFamily: FONT }}>
    <div style={{ display: 'flex', height: 130, gap: 6, transform: `scaleX(${p})`, transformOrigin: 'left' }}>
      {segs.map((x, i) => { const v = mix(x.before, x.after, s); return <div key={i} style={{ flex: v, minWidth: 0, background: x.color ?? cols[i % 5], borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><div style={{ fontSize: 28, fontWeight: 900, color: '#0B0E14', whiteSpace: 'nowrap' }}>{x.name}</div><div style={{ fontSize: 22, color: 'rgba(11,14,20,.75)', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>{fmt(v)}{unit}</div></div>; })}
      {free > 0.001 ? <div style={{ flex: free, minWidth: 0, border: `4px dashed #4ADE80`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4ADE80', fontSize: 30, fontWeight: 900, overflow: 'hidden', whiteSpace: 'nowrap' }}>{s > 0.6 ? saved : ''}</div> : null}
    </div>
    <div style={{ marginTop: 44, textAlign: 'center', opacity: cl(s * 2 - 0.6) }}><span style={{ fontSize: 40, color: C.muted, marginRight: 20 }}>{saved}</span><span style={{ fontSize: 150, fontWeight: 900, color: '#4ADE80', fontVariantNumeric: 'tabular-nums' }}>{fmt(free)}</span><span style={{ fontSize: 56, color: '#4ADE80', marginLeft: 8 }}>{unit}</span></div></div>;
};

/** 冲破图表：几根柱子长出来，最高的那根顶到图表的上边框，把边框顶弯，再冲出去。讲「破纪录」「远超同行」时用，一条片子只用一次。 */
export const OffTheCharts: React.FC<{ bars: { name: string; value: number }[]; hero: number; at: number; unit?: string; width?: number; height?: number }> = ({ bars, hero, at, unit = '', width = 1300, height = 620 }) => {
  const t = useT(), others = Math.max(...bars.filter((_, i) => i !== hero).map((b) => b.value)), CH = height - 120, cap = CH * 0.9, bw = Math.min(150, (width - 80) / bars.length - 40), press = cl((t - at - 1.5) / 0.35), burst = out4((t - at - 1.9) / 0.5), bend = Math.sin(press * Math.PI) * 26 * (1 - burst) + burst * 0;
  return <div style={{ width, height, position: 'relative', fontFamily: FONT }}>
    <svg width={width} height={height} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}><path d={`M20 60 L${width / 2 - 140} 60 Q ${40 + (hero + 0.5) * ((width - 80) / bars.length)} ${60 - bend * 2.2} ${width / 2 + 140} 60 L${width - 20} 60 L${width - 20} ${height - 60} L20 ${height - 60} Z`} fill="none" stroke={C.line} strokeWidth={3} strokeDasharray={burst > 0.1 ? '14 10' : undefined} /></svg>
    {bars.map((b, i) => { const p = prog(t, at + i * 0.13, 0.7), isH = i === hero, base = isH ? cap : (b.value / others) * cap * 0.72, h = isH ? base * p + burst * 150 : base * p, x = 40 + (i + 0.5) * ((width - 80) / bars.length) - bw / 2;
      return <React.Fragment key={i}><div style={{ position: 'absolute', left: x, bottom: 60, width: bw, height: h, background: isH ? C.warm : C.accent, opacity: isH ? 1 : 0.7, borderRadius: '10px 10px 0 0', boxShadow: isH && burst > 0 ? `0 0 50px ${C.warm}` : undefined }} />
        <div style={{ position: 'absolute', left: x - 60, width: bw + 120, bottom: 62 + h + 8, textAlign: 'center', fontSize: isH ? 54 : 34, fontWeight: 900, color: isH ? C.warm : C.text, opacity: isH ? burst : cl(p * 2 - 1), whiteSpace: 'nowrap' }}>{fmt(b.value)}{unit}</div>
        <div style={{ position: 'absolute', left: x - 60, width: bw + 120, bottom: 10, textAlign: 'center', fontSize: 30, color: isH ? C.text : C.muted, fontWeight: isH ? 900 : 500 }}>{b.name}</div></React.Fragment>; })}</div>;
};

/** 翻牌：机场出发牌那种一格一格翻的牌子，从乱码翻到目标。只适合数字、日期、英文代号（「2026.11.27」「NVDA」），中文不要用。 */
export const SplitFlap: React.FC<{ text: string; at: number; size?: number; color?: string }> = ({ text, at, size = 150, color = C.text }) => {
  const t = useT(), SET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return <div style={{ display: 'flex', gap: size * 0.07, fontFamily: '"D-DIN", ' + FONT }}>{text.split('').map((ch, i) => { const fixed = !SET.includes(ch.toUpperCase()), start = at + i * 0.09, steps = fixed ? 0 : 6 + Math.floor(rnd(i) * 6), k = Math.floor((t - start) / 0.06), done = k >= steps, cur = fixed || done ? ch.toUpperCase() : k < 0 ? ' ' : SET[(SET.indexOf(ch.toUpperCase()) + (steps - k) * 7 + 36 * 4) % 36], ph = fixed || done || k < 0 ? 0 : ((t - start) / 0.06) % 1;
    return fixed ? <div key={i} style={{ fontSize: size * 0.8, fontWeight: 900, color, alignSelf: 'center', width: size * 0.3, textAlign: 'center' }}>{ch}</div> : <div key={i} style={{ width: size * 0.72, height: size * 1.1, background: '#15181F', border: `2px solid ${C.line}`, borderRadius: size * 0.08, position: 'relative', overflow: 'hidden', boxShadow: '0 10px 24px rgba(0,0,0,.4)' }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.86, fontWeight: 900, color, transform: `scaleY(${1 - Math.sin(ph * Math.PI) * 0.75})` }}>{cur}</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 3, background: '#07090D' }} /></div>; })}</div>;
};

/** 光束连线：几个节点之间连着暗线，一小段亮光沿着线从一头跑到另一头，一遍遍地跑。适合「A 把数据传给 B」「这家给那家供货」这类谁连着谁。 */
export const BeamLink: React.FC<{ nodes: { name: string; x: number; y: number; hot?: boolean }[]; links: [number, number][]; at: number; width?: number; height?: number; color?: string }> = ({ nodes, links, at, width = 1400, height = 620, color = C.accent }) => {
  const t = useT();
  return <div style={{ width, height, position: 'relative', fontFamily: FONT }}><svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
    {links.map(([a, b], i) => { const A = nodes[a], B = nodes[b], x0 = A.x * width, y0 = A.y * height, x1 = B.x * width, y1 = B.y * height, mx = (x0 + x1) / 2, my = (y0 + y1) / 2 - Math.abs(x1 - x0) * 0.16, d = `M${x0} ${y0} Q ${mx} ${my} ${x1} ${y1}`, show = prog(t, at + 0.4 + i * 0.15, 0.6), u = (((t - at - 0.8 - i * 0.35) / 1.8) % 1 + 1) % 1, e = 1 - Math.pow(1 - u, 3);
      return <g key={i}><path d={d} fill="none" stroke={C.line} strokeWidth={4} pathLength={1} strokeDasharray={`${show} 1`} /><path d={d} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" pathLength={1} strokeDasharray="0.16 1" strokeDashoffset={-(e * 1.16 - 0.16)} opacity={show >= 1 ? 1 : 0} style={{ filter: `drop-shadow(0 0 10px ${color})` }} /></g>; })}</svg>
    {nodes.map((n, i) => { const p = prog(t, at + i * 0.1, 0.45); return <div key={i} style={{ position: 'absolute', left: n.x * width, top: n.y * height, transform: `translate(-50%,-50%) scale(${mix(0.6, 1, p)})`, opacity: p, background: n.hot ? color : C.surface, color: n.hot ? '#fff' : C.text, border: `3px solid ${n.hot ? color : C.line}`, borderRadius: 18, padding: '16px 30px', fontSize: 36, fontWeight: 800, whiteSpace: 'nowrap', boxShadow: '0 12px 30px rgba(0,0,0,.4)' }}>{n.name}</div>; })}</div>;
};

/** 融化换字：一个词像墨水一样糊开，再凝成另一个词。两个概念之间「其实是一回事」「从 A 变成了 B」时用，比硬切柔和。 */
export const MorphText: React.FC<{ words: string[]; ats: number[]; size?: number; color?: string; dur?: number }> = ({ words, ats, size = 200, color = C.text, dur = 0.9 }) => {
  const t = useT(), k = ats.reduce((a, x, i) => (t >= x ? i : a), 0), f = k > 0 ? cl((t - ats[k]) / dur) : 1, id = React.useId().replace(/:/g, '');
  const layer = (w: string, frac: number, key: string) => <div key={key} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: `blur(${Math.min(8 / Math.max(frac, 0.001) - 8, 90)}px)`, opacity: Math.pow(frac, 0.4), whiteSpace: 'nowrap' }}>{w}</div>;
  return <div style={{ position: 'relative', width: Math.max(...words.map((w) => w.length)) * size * 1.05, height: size * 1.4, fontFamily: FONT, fontSize: size, fontWeight: 900, color, filter: f < 1 ? `url(#${id})` : undefined }}>
    <svg width="0" height="0" style={{ position: 'absolute' }}><defs><filter id={id}><feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 255 -140" /></filter></defs></svg>
    {k > 0 && f < 1 ? layer(words[k - 1], 1 - f, 'a') : null}{layer(words[k], k > 0 ? f : prog(t, ats[0], 0.5), 'b')}</div>;
};

/** 像素块显影：一张图分成小方块，一块块随机亮出来，先灰后彩。放证据照片、当事人照片、现场图时用，比淡入有「调出来」的感觉。 */
export const PixelReveal: React.FC<{ src: string; at: number; width?: number; height?: number; grid?: number; dur?: number; caption?: string }> = ({ src, at, width = 1100, height = 620, grid = 12, dur = 1.2, caption }) => {
  const t = useT(), rows = Math.round((grid * height) / width), url = /^(https?:|data:)/.test(src) ? src : staticFile(src), col = cl((t - at - dur - 0.1) / 0.5);
  return <div style={{ fontFamily: FONT }}><div style={{ width, height, position: 'relative', borderRadius: 16, overflow: 'hidden', background: C.surface, boxShadow: '0 24px 60px rgba(0,0,0,.5)' }}>
    <Img src={url} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: `grayscale(${1 - col})` }} />
    {Array.from({ length: grid * rows }, (_, i) => { const p = cl((t - at - rnd(i) * dur) / 0.35); return p >= 1 ? null : <div key={i} style={{ position: 'absolute', left: `${((i % grid) / grid) * 100}%`, top: `${(Math.floor(i / grid) / rows) * 100}%`, width: `${100 / grid + 0.2}%`, height: `${100 / rows + 0.2}%`, background: C.surface, opacity: 1 - p }} />; })}</div>
    {caption ? <div style={{ marginTop: 16, fontSize: 28, color: C.muted, opacity: col }}>{caption}</div> : null}</div>;
};
