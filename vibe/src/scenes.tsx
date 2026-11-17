// 场景库：每个场景一件事。舞台区 1920×700（画面 y 110–810），下面留给字幕。
import React from 'react';
import { C, a, SERIF, SANS, prog, mix, clamp, inOut, easeOut, rnd, parseHot, Fade, Tag, type Clock } from './kit';
import type { Scene, Episode } from './types';

const SW = 1920, SH = 700;
type P<K extends Scene['k']> = { s: Extract<Scene, { k: K }>; c: Clock; ep: Episode };

/** 第 k 个元素（共 count 个）在场景里的出现时刻：拍子够就一拍一个，不够就在最后一拍里依次排开。 */
const revealAt = (c: Clock, k: number, count: number, offset = 0) => {
  const avail = c.n - offset;
  if (count <= avail) return c.at(k + offset) + 0.2;
  const last = Math.max(0, avail - 1);
  if (k < last) return c.at(k + offset) + 0.2;
  return c.at(last + offset) + 0.2 + (k - last) * 0.45;
};

const Stage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>{children}</div>
);

const Hot: React.FC<{ s: string; hot?: string; n?: number }> = ({ s, hot = C.hot, n = Infinity }) => {
  let left = n; // n = 只显示前 n 个字（打字效果用），** 标记不算字
  return <>{parseHot(s).map((x, i) => { const t = x.t.slice(0, Math.max(0, left)); left -= x.t.length; return <span key={i} style={{ color: x.hot ? hot : undefined }}>{t}</span>; })}</>;
};

// ───────── 片名
const Title: React.FC<P<'title'>> = ({ c, ep }) => {
  const t = c.t, p1 = prog(t, 0.1, 0.7), p2 = prog(t, 0.45, 0.8), line = inOut((t - 0.3) / 1.2), p3 = prog(t, 0.9, 0.7);
  return (
    <Stage style={{ flexDirection: 'column' }}>
      <Fade p={p1}><Tag color={a(C.hot, 0.9)} style={{ letterSpacing: 12, fontSize: 26 }}>AI 内容创作 · 知识大赏 · {ep.group}</Tag></Fade>
      <Fade p={p2} dy={36} style={{ marginTop: 34 }}>
        <div style={{ fontFamily: SERIF, fontSize: 112, fontWeight: 700, color: C.ink, letterSpacing: 6, textAlign: 'center' }}>{ep.title}</div>
      </Fade>
      <div style={{ width: 900, height: 2, marginTop: 34, background: `linear-gradient(90deg, transparent, ${a(C.ink, 0.5)}, transparent)`, transform: `scaleX(${line})` }} />
      <Fade p={p3} style={{ marginTop: 26 }}>
        <div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 34, color: a(C.ink, 0.6), letterSpacing: 2 }}>{ep.en}</div>
      </Fade>
      <Fade p={p3} style={{ position: 'absolute', top: 40 }}>
        <div style={{ fontFamily: SERIF, fontSize: 30, color: a(C.ink, 0.35), letterSpacing: 10 }}>No.{String(ep.no).padStart(2, '0')}</div>
      </Fade>
    </Stage>
  );
};

// ───────── 大数字
const fmt = (v: number, dec = 0) => v.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
const NumberS: React.FC<P<'number'>> = ({ s, c }) => (
  <Stage style={{ flexDirection: 'column' }}>
    <div style={{ display: 'flex', gap: 160, alignItems: 'flex-end' }}>
      {s.items.map((it, k) => {
        const at = revealAt(c, k, s.items.length), p = prog(c.t, at, 0.5), cnt = easeOut(clamp((c.t - at) / 1.3));
        const hot = it.hot ?? s.items.length === 1;
        return (
          <Fade key={k} p={p} dy={40} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: s.items.length > 2 ? 150 : 200, lineHeight: 1, color: hot ? C.hot : C.ink, fontVariantNumeric: 'tabular-nums', textShadow: hot ? `0 0 60px ${a(C.hot, 0.35)}` : 'none' }}>
              <span style={{ fontSize: '0.5em' }}>{it.pre}</span>{fmt(it.v * cnt, it.dec)}<span style={{ fontSize: '0.4em', marginLeft: 8 }}>{it.suf}</span>
            </div>
            <div style={{ fontFamily: SANS, fontSize: 36, color: a(C.ink, 0.75), marginTop: 22 }}>{it.label}</div>
          </Fade>
        );
      })}
    </div>
    {s.note && <Fade p={prog(c.t, 1.2, 0.6)} style={{ position: 'absolute', bottom: 24 }}><Tag>{s.note}</Tag></Fade>}
  </Stage>
);

// ───────── 点阵
const Dots: React.FC<P<'dots'>> = ({ s, c }) => {
  const N = s.cols * s.rows, gap = Math.min(1500 / s.cols, 520 / s.rows), r = gap * 0.32;
  const k = Math.min(c.step, s.steps.length - 1), prev = s.steps[Math.max(0, k - 1)], cur = s.steps[k];
  const p = k === 0 ? 1 : inOut((c.st) / 1.0);
  const A = mix(k === 0 ? 0 : prev.a ?? 0, cur.a ?? 0, k === 0 ? prog(c.t, 0.6, 1.2) : p);
  const B = mix(k === 0 ? 0 : prev.b ?? 0, cur.b ?? 0, k === 0 ? prog(c.t, 0.6, 1.2) : p);
  const appear = (i: number) => prog(c.t, (i % s.cols) * 0.012 + Math.floor(i / s.cols) * 0.03, 0.4);
  const label = cur.label, lp = prog(c.st, 0.1, 0.5);
  return (
    <Stage style={{ flexDirection: 'column' }}>
      <div style={{ height: 80, fontFamily: SANS, fontSize: 40, fontWeight: 600, color: C.ink, opacity: label ? lp : 0, transform: `translateY(${mix(14, 0, lp)}px)` }}>{label ? <Hot s={label} /> : null}</div>
      <svg width={gap * s.cols} height={gap * s.rows}>
        {Array.from({ length: N }, (_, i) => {
          const x = (i % s.cols + 0.5) * gap, y = (Math.floor(i / s.cols) + 0.5) * gap;
          const isA = i < A - 0.5, isB = !isA && i < A + B - 0.5;
          const col = isA ? C.hot : isB ? C.cool : a(C.ink, 0.22);
          const pulse = isA ? 1 + 0.08 * Math.sin(c.t * 3 + i * 0.3) : 1;
          return <circle key={i} cx={x} cy={y} r={r * appear(i) * pulse} fill={col} />;
        })}
      </svg>
      {s.legend && (
        <div style={{ display: 'flex', gap: 60, marginTop: 30, fontFamily: SANS, fontSize: 28, color: a(C.ink, 0.7) }}>
          <span><span style={{ color: C.hot }}>●</span> {s.legend[0]}</span>
          <span><span style={{ color: C.cool }}>●</span> {s.legend[1]}</span>
        </div>
      )}
    </Stage>
  );
};

// ───────── 横条
const Bars: React.FC<P<'bars'>> = ({ s, c }) => {
  const max = s.max ?? Math.max(...s.items.map((x) => x.v)), hl = c.n > 1 ? c.step >= 1 : c.t > 1.8;
  const rowH = Math.min(100, 560 / s.items.length);
  return (
    <Stage style={{ flexDirection: 'column', alignItems: 'stretch', padding: '0 220px' }}>
      {s.items.map((it, k) => {
        const g = inOut((c.t - 0.3 - k * 0.18) / 1.0), on = hl && it.hot, dim = hl && !it.hot;
        return (
          <div key={k} style={{ display: 'flex', alignItems: 'center', height: rowH, opacity: dim ? 0.45 : 1, transition: 'none' }}>
            <div style={{ width: 340, fontFamily: SANS, fontSize: 34, color: C.ink, textAlign: 'right', paddingRight: 30, opacity: prog(c.t, 0.2 + k * 0.18, 0.4) }}>{it.label}</div>
            <div style={{ flex: 1, position: 'relative', height: rowH * 0.42 }}>
              <div style={{ position: 'absolute', inset: 0, background: a(C.ink, 0.06), borderRadius: 6 }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(it.v / max) * 100 * g}%`, background: on ? C.hot : a(C.ink, 0.55), borderRadius: 6, boxShadow: on ? `0 0 30px ${a(C.hot, 0.45)}` : 'none' }} />
              <div style={{ position: 'absolute', left: `calc(${(it.v / max) * 100 * g}% + 18px)`, top: '50%', transform: 'translateY(-50%)', fontFamily: SERIF, fontWeight: 700, fontSize: 36, color: on ? C.hot : C.ink, whiteSpace: 'nowrap', opacity: g }}>
                {fmt(it.v, s.dec ?? (it.v % 1 ? 1 : 0))}{s.unit}{it.tag && <span style={{ fontFamily: SANS, fontWeight: 400, fontSize: 24, color: a(C.ink, 0.55), marginLeft: 16 }}>{it.tag}</span>}
              </div>
            </div>
          </div>
        );
      })}
      {s.note && <Fade p={prog(c.t, 1.4, 0.6)} style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center' }}><Tag>{s.note}</Tag></Fade>}
    </Stage>
  );
};

// ───────── 左右对照
const Compare: React.FC<P<'compare'>> = ({ s, c }) => {
  const win = s.win ?? 'right', ph = prog(c.t, 0.1, 0.6), lastAt = revealAt(c, s.rows.length - 1, s.rows.length) + 0.8;
  const glow = prog(c.t, lastAt, 0.6);
  const col = (side: 'left' | 'right') => (side === win ? C.hot : a(C.ink, 0.55));
  const cell = (txt: string, side: 'left' | 'right', p: number) => (
    <div style={{ flex: 1, fontFamily: SANS, fontSize: 48, color: side === win ? C.ink : a(C.ink, 0.6), textAlign: side === 'left' ? 'right' : 'left', opacity: p, transform: `translateX(${mix(side === 'left' ? -30 : 30, 0, p)}px)` }}><Hot s={txt} /></div>
  );
  return (
    <Stage style={{ flexDirection: 'column' }}>
      <div style={{ display: 'flex', width: 1400, alignItems: 'center', opacity: ph, marginBottom: 44 }}>
        <div style={{ flex: 1, textAlign: 'right', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: col('left') }}>{s.left}</div>
        <div style={{ width: 160, textAlign: 'center', fontFamily: SERIF, fontSize: 36, color: a(C.ink, 0.35) }}>vs</div>
        <div style={{ flex: 1, textAlign: 'left', fontFamily: SERIF, fontWeight: 700, fontSize: 70, color: col('right'), textShadow: glow ? `0 0 ${40 * glow}px ${a(C.hot, 0.5)}` : 'none' }}>{s.right}</div>
      </div>
      <div style={{ width: 1400, position: 'relative' }}>
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 2, background: a(C.ink, 0.15), transform: `scaleY(${ph})`, transformOrigin: 'top' }} />
        {(() => {
          // 当前行的高亮条：跟着新出现的一行移动
          const rh = Math.min(110, 500 / s.rows.length), times = s.rows.map((_, k) => revealAt(c, k, s.rows.length));
          const cur = times.reduce((m, t0, k) => (c.t >= t0 ? k : m), -1);
          if (cur < 0) return null;
          const prevY = Math.max(0, cur - 1) * rh, y = mix(prevY, cur * rh, inOut((c.t - times[cur]) / 0.5));
          return <div style={{ position: 'absolute', left: -40, right: -40, top: y + 6, height: rh - 12, borderRadius: 14, background: a(C.hot, 0.1), borderLeft: `4px solid ${C.hot}`, opacity: prog(c.t, times[0], 0.4) }} />;
        })()}
        {s.rows.map(([l, r], k) => {
          const p = prog(c.t, revealAt(c, k, s.rows.length), 0.5);
          return (
            <div key={k} style={{ position: 'relative', display: 'flex', alignItems: 'center', height: Math.min(110, 500 / s.rows.length) }}>
              {cell(l, 'left', p)}<div style={{ width: 160, display: 'flex', justifyContent: 'center' }}><div style={{ width: 12, height: 12, borderRadius: 6, background: a(C.ink, 0.4), opacity: p }} /></div>{cell(r, 'right', p)}
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

// ───────── 流程 / 闭环
const Flow: React.FC<P<'flow'>> = ({ s, c }) => {
  const n = s.nodes.length, loop = !!s.loop;
  const pos = (i: number) => {
    if (loop) { const ang = -Math.PI / 2 + (i / n) * Math.PI * 2, ry = s.sub ? 205 : 235; return { x: SW / 2 + Math.cos(ang) * 470, y: SH / 2 - (s.sub ? 18 : 0) + Math.sin(ang) * ry }; }
    const span = Math.min(1600, n * 300); return { x: SW / 2 - span / 2 + (i + 0.5) * (span / n), y: SH / 2 - 10 };
  };
  // 高亮跟着拍子走：拍子数够就一拍一个节点，不够就按拍子进度等比扫过
  const stepLen = (k: number) => (k + 1 < c.n ? c.at(k + 1) : c.len) - c.at(k);
  const beatProg = c.n > 1 ? (c.step + clamp(c.st / Math.max(0.5, stepLen(c.step)))) / c.n : clamp((c.t - 0.6) / Math.max(1, c.len - 1.4));
  const sweep = c.n >= n && !loop ? Math.min(n - 0.001, c.step + clamp(c.st / Math.max(0.5, stepLen(c.step)))) : beatProg * (loop ? n : n - 0.001);
  const active = Math.floor(sweep) % n, frac = sweep - Math.floor(sweep);
  const R = loop ? 88 : 96;
  return (
    <Stage>
      <svg width={SW} height={SH} style={{ position: 'absolute', inset: 0 }}>
        {s.nodes.map((_, i) => {
          if (!loop && i === n - 1) return null;
          const A = pos(i), B = pos((i + 1) % n), d = Math.hypot(B.x - A.x, B.y - A.y), ux = (B.x - A.x) / d, uy = (B.y - A.y) / d;
          const x1 = A.x + ux * (R + 10), y1 = A.y + uy * (R + 10), x2 = B.x - ux * (R + 10), y2 = B.y - uy * (R + 10);
          const dp = prog(c.t, 0.2 + i * 0.15, 0.6), lit = i < Math.floor(sweep) || (loop && sweep >= n);
          return (
            <g key={i} opacity={dp}>
              <line x1={x1} y1={y1} x2={mix(x1, x2, dp)} y2={mix(y1, y2, dp)} stroke={lit ? a(C.hot, 0.8) : a(C.ink, 0.25)} strokeWidth={3} strokeDasharray="2 10" strokeLinecap="round" />
              <path d={`M ${x2 - ux * 18 - uy * 10} ${y2 - uy * 18 + ux * 10} L ${x2} ${y2} L ${x2 - ux * 18 + uy * 10} ${y2 - uy * 18 - ux * 10}`} fill="none" stroke={lit ? C.hot : a(C.ink, 0.35)} strokeWidth={3} />
              {i === active && c.t > 0.6 && <circle cx={mix(x1, x2, frac)} cy={mix(y1, y2, frac)} r={9} fill={C.hot} style={{ filter: `drop-shadow(0 0 10px ${C.hot})` }} />}
            </g>
          );
        })}
      </svg>
      {s.nodes.map((nd, i) => {
        const P0 = pos(i), p = prog(c.t, 0.1 + i * 0.15, 0.5), on = i === active && c.t > 0.6, done = i < active || (loop && sweep >= n);
        return (
          <div key={i} style={{ position: 'absolute', left: P0.x - R, top: P0.y - R, width: R * 2, height: R * 2, borderRadius: R, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            border: `3px solid ${on ? C.hot : done ? a(C.hot, 0.5) : a(C.ink, 0.3)}`, background: on ? a(C.hot, 0.16) : a(C.bg, 0.7), opacity: p, transform: `scale(${mix(0.6, 1, p) * (on ? 1.08 : 1)})`, boxShadow: on ? `0 0 50px ${a(C.hot, 0.45)}` : 'none' }}>
            <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: nd.length > 3 ? 30 : 38, color: on ? C.ink : a(C.ink, 0.85), textAlign: 'center', lineHeight: 1.15 }}>{nd}</div>
            {s.sub?.[i] && <div style={{ position: 'absolute', top: R * 2 + 16, width: 300, textAlign: 'center', fontFamily: SANS, fontSize: 24, color: on ? C.hot : a(C.ink, 0.5) }}>{s.sub[i]}</div>}
          </div>
        );
      })}
    </Stage>
  );
};

// ───────── 漏斗
const Funnel: React.FC<P<'funnel'>> = ({ s, c }) => {
  const n = s.layers.length, h = Math.min(108, 600 / n), w0 = 1000, w1 = 380;
  const weakOn = s.weak !== undefined && (c.n > 1 ? c.step >= c.n - 1 || c.step >= 1 && c.t > c.at(1) : c.t > 2);
  const totalH = n * (h + 8), top0 = (SH - totalH) / 2;
  return (
    <Stage style={{ flexDirection: 'column' }}>
      <svg width={SW} height={SH} style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>
        {Array.from({ length: 36 }, (_, i) => {
          // 往下漏的光点：每过一层，有一部分留下不再往下走
          const ph = ((c.t * 0.32 + rnd(i, 11)) % 1), y = ph * totalH, layer = Math.floor(y / (h + 8));
          const survive = rnd(i, 12) < Math.pow(0.62, layer);
          if (!survive || c.t < 0.8) return null;
          const wHere = mix(w0, w1, y / totalH) * 0.8, x = SW / 2 + (rnd(i, 13) - 0.5) * wHere;
          return <circle key={i} cx={x} cy={top0 + y} r={5} fill={C.hot} opacity={0.75 * Math.sin(Math.PI * Math.min(1, ph * 6)) } />;
        })}
      </svg>
      {s.layers.map((L, k) => {
        const wt = mix(w0, w1, k / n), wb = mix(w0, w1, (k + 1) / n), p = prog(c.t, 0.2 + k * 0.22, 0.5), isW = weakOn && k === s.weak, dim = weakOn && k !== s.weak;
        return (
          <div key={k} style={{ position: 'relative', width: w0, height: h, marginBottom: 8, opacity: p * (dim ? 0.45 : 1), transform: `translateY(${mix(20, 0, p)}px)` }}>
            <svg width={w0} height={h} style={{ position: 'absolute', inset: 0 }}>
              <polygon points={`${(w0 - wt) / 2},0 ${(w0 + wt) / 2},0 ${(w0 + wb) / 2},${h} ${(w0 - wb) / 2},${h}`} fill={isW ? a(C.hot, 0.7 + 0.2 * Math.sin(c.t * 3)) : a(C.ink, 0.1 + 0.05 * k)} stroke={isW ? C.hot : a(C.ink, 0.3)} strokeWidth={2} />
            </svg>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SANS, fontWeight: 700, fontSize: 36, color: isW ? C.bg : C.ink }}>{L.label}</div>
            {L.tip && <div style={{ position: 'absolute', left: (w0 + wt) / 2 + 40, top: 0, height: h, display: 'flex', alignItems: 'center', fontFamily: SANS, fontSize: 26, color: isW ? C.hot : a(C.ink, 0.5), whiteSpace: 'nowrap' }}>{L.tip}</div>}
          </div>
        );
      })}
    </Stage>
  );
};

// ───────── 曲线
const Curve: React.FC<P<'curve'>> = ({ s, c }) => {
  const w = 1380, h = 470, ox = (SW - w) / 2, oy = 90, max = Math.max(...s.pts, ...(s.ref ?? []), 1);
  const toXY = (arr: number[]) => arr.map((v, i) => [ox + (i / (arr.length - 1)) * w, oy + h - (v / max) * h] as const);
  const path = (xy: readonly (readonly [number, number])[]) => xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const main = toXY(s.pts), draw = inOut((c.t - 0.3) / 1.8), len = 4000;
  const ref = s.ref ? toXY(s.ref) : null, rp = inOut((c.t - (c.n > 1 ? c.at(1) : 1.6)) / 1.4);
  return (
    <Stage>
      <svg width={SW} height={SH} style={{ position: 'absolute', inset: 0 }}>
        {[0, 0.25, 0.5, 0.75, 1].map((g) => <line key={g} x1={ox} x2={ox + w} y1={oy + h * g} y2={oy + h * g} stroke={a(C.ink, g === 1 ? 0.35 : 0.08)} strokeWidth={g === 1 ? 2 : 1} />)}
        {ref && <path d={path(ref)} fill="none" stroke={C.cool} strokeWidth={4} strokeDasharray={`${len}`} strokeDashoffset={len * (1 - rp)} opacity={0.9} />}
        <path d={`${path(main)} L${ox + w},${oy + h} L${ox},${oy + h} Z`} fill={a(C.hot, 0.08 * draw)} />
        <path d={path(main)} fill="none" stroke={C.hot} strokeWidth={6} strokeLinejoin="round" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - draw)} style={{ filter: `drop-shadow(0 0 12px ${a(C.hot, 0.6)})` }} />
        {(s.marks ?? []).map((m, k) => {
          const at = c.n > 1 ? revealAt(c, k, s.marks!.length, 1) : 1.8 + k * 0.6, p = prog(c.t, at, 0.5);
          const fi = m.x * (s.pts.length - 1), i0 = Math.floor(fi), i1 = Math.min(s.pts.length - 1, i0 + 1);
          const x = ox + m.x * w, y = mix(main[i0][1], main[i1][1], fi - i0);
          return (
            <g key={k} opacity={p}>
              <line x1={x} x2={x} y1={y} y2={oy + h} stroke={a(C.ink, 0.4)} strokeWidth={2} strokeDasharray="4 6" />
              <circle cx={x} cy={y} r={12 * p + 2} fill={C.bg} stroke={C.hot} strokeWidth={4} />
              <text x={x} y={y - 34} textAnchor="middle" fontFamily={SANS} fontSize={32} fontWeight={700} fill={C.ink}>{m.label}</text>
            </g>
          );
        })}
        {(s.xl ?? []).map((l, i, arr) => <text key={i} x={ox + (i / (arr.length - 1)) * w} y={oy + h + 44} textAnchor="middle" fontFamily={SANS} fontSize={24} fill={a(C.ink, 0.5)}>{l}</text>)}
        {s.yl && <text x={ox} y={oy - 30} fontFamily={SANS} fontSize={24} fill={a(C.ink, 0.5)} letterSpacing={3}>{s.yl}</text>}
        {s.label && <text x={s.refLabel ? ox + w / 2 - 30 : ox + w / 2} y={oy - 30} textAnchor={s.refLabel ? 'end' : 'middle'} fontFamily={SANS} fontSize={28} fill={C.hot} opacity={draw}>━ {s.label}</text>}
        {s.refLabel && <text x={ox + w / 2 + 30} y={oy - 30} textAnchor="start" fontFamily={SANS} fontSize={28} fill={C.cool} opacity={rp}>┅ {s.refLabel}</text>}
      </svg>
      {s.note && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', opacity: prog(c.t, 1.5, 0.6) }}><Tag>{s.note}</Tag></div>}
    </Stage>
  );
};

// ───────── 钟形分布：大家都往平均值挤
const Bell: React.FC<P<'bell'>> = ({ s, c }) => {
  const w = 1400, h = 440, ox = (SW - w) / 2, oy = 110;
  const conv = c.n > 1 ? inOut((c.t - c.at(1)) / 1.6) : inOut((c.t - 1) / 2);
  const outP = s.outlier ? prog(c.t, c.n > 2 ? c.at(c.n - 1) + 0.2 : c.len * 0.6, 0.9) : 0;
  const g = (mu: number, sd: number, amp: number, lo = 0, hi = 1) => Array.from({ length: 121 }, (_, i) => { const x = lo + (hi - lo) * i / 120; return [ox + x * w, oy + h - amp * h * Math.exp(-((x - mu) ** 2) / (2 * sd * sd))] as const; });
  const d = (pts: readonly (readonly [number, number])[]) => pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const N = 11;
  return (
    <Stage>
      <svg width={SW} height={SH} style={{ position: 'absolute', inset: 0 }}>
        <line x1={ox} x2={ox + w} y1={oy + h} y2={oy + h} stroke={a(C.ink, 0.35)} strokeWidth={2} />
        {Array.from({ length: N }, (_, i) => {
          const mu0 = 0.12 + (i / (N - 1)) * 0.76, sd0 = 0.05 + rnd(i) * 0.05, amp0 = 0.35 + rnd(i, 2) * 0.35;
          const p = prog(c.t, 0.2 + i * 0.07, 0.6);
          return <path key={i} d={d(g(mix(mu0, 0.42, conv), mix(sd0, 0.07, conv), mix(amp0, 0.85, conv) * p))} fill="none" stroke={a(C.ink, mix(0.45, 0.22, conv))} strokeWidth={2.5} />;
        })}
        {s.label && <text x={ox + 0.42 * w} y={oy - 24} textAnchor="middle" fontFamily={SANS} fontSize={30} fill={a(C.ink, 0.75)} opacity={conv}>{s.label}</text>}
        {s.outlier && (
          <g opacity={outP}>
            <path d={d(g(0.84, 0.06, 0.75 * outP, 0.6, 1))} fill={a(C.hot, 0.12)} stroke={C.hot} strokeWidth={5} style={{ filter: `drop-shadow(0 0 14px ${a(C.hot, 0.6)})` }} />
            <text x={ox + 0.84 * w} y={oy + h - 0.75 * h - 30} textAnchor="middle" fontFamily={SANS} fontSize={32} fontWeight={700} fill={C.hot}>{s.outlier}</text>
          </g>
        )}
      </svg>
    </Stage>
  );
};

// ───────── 环形占比
const Ring: React.FC<P<'ring'>> = ({ s, c }) => {
  const R = 230, cx = SW / 2 - 260, cy = SH / 2, tot = s.parts.reduce((x, y) => x + y.v, 0), draw = inOut((c.t - 0.3) / 1.6);
  const hl = c.n > 1 ? c.step >= 1 : c.t > 2;
  let acc = 0;
  return (
    <Stage>
      <svg width={SW} height={SH} style={{ position: 'absolute', inset: 0 }}>
        <circle cx={cx} cy={cy} r={R} fill="none" stroke={a(C.ink, 0.06)} strokeWidth={70} />
        {s.parts.map((pt, k) => {
          const f0 = acc / tot; acc += pt.v; const f1 = acc / tot, e = Math.min(f1, draw);
          if (e <= f0) return null;
          const on = hl && pt.hot, L = 2 * Math.PI * R;
          return <circle key={k} cx={cx} cy={cy} r={R} fill="none" stroke={on ? C.hot : pt.hot ? a(C.hot, 0.55) : a(C.ink, 0.25 + 0.15 * (k % 2))} strokeWidth={on ? 84 : 70}
            strokeDasharray={`${(e - f0) * L - 4} ${L}`} strokeDashoffset={-f0 * L} transform={`rotate(-90 ${cx} ${cy})`} style={{ filter: on ? `drop-shadow(0 0 18px ${a(C.hot, 0.6)})` : 'none' }} />;
        })}
      </svg>
      {s.center && <div style={{ position: 'absolute', left: cx - 160, top: cy - 50, width: 320, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontWeight: 700, fontSize: 46, color: C.ink, opacity: draw }}>{s.center}</div>}
      <div style={{ position: 'absolute', left: SW / 2 + 120, top: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: s.parts.length > 4 ? 14 : 30, paddingBottom: s.note ? 50 : 0 }}>
        {s.parts.map((pt, k) => {
          const p = prog(c.t, 0.6 + k * 0.25, 0.5), on = hl && pt.hot;
          return (
            <Fade key={k} p={p} style={{ display: 'flex', alignItems: 'baseline', gap: 24, opacity: p * (hl && !pt.hot ? 0.5 : 1) }}>
              <span style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 64, color: on ? C.hot : C.ink, width: 170, textAlign: 'right' }}>{Math.round((pt.v / tot) * 100)}%</span>
              <span style={{ fontFamily: SANS, fontSize: 36, color: on ? C.ink : a(C.ink, 0.7) }}>{pt.label}</span>
            </Fade>
          );
        })}
      </div>
      {s.note && <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, textAlign: 'center', opacity: prog(c.t, 1.5, 0.6) }}><Tag>{s.note}</Tag></div>}
    </Stage>
  );
};

// ───────── 编号清单
const List: React.FC<P<'list'>> = ({ s, c }) => {
  const n = s.items.length, off = s.head ? 0 : 0, two = n > 4;
  const times = s.items.map((_, k) => revealAt(c, k, n, off));
  const cur = times.reduce((m, t0, k) => (c.t >= t0 ? k : m), -1);
  return (
    <Stage style={{ flexDirection: 'column' }}>
      {s.head && <Fade p={prog(c.t, 0, 0.5)} style={{ marginBottom: 40 }}><Tag color={a(C.hot, 0.9)} style={{ fontSize: 30, letterSpacing: 8 }}>{s.head}</Tag></Fade>}
      <div style={{ display: 'grid', gridTemplateColumns: two ? 'minmax(0, 1fr) minmax(0, 1fr)' : 'minmax(0, 1fr)', columnGap: 80, rowGap: two ? 26 : 30, width: two ? 1640 : 1240 }}>
        {s.items.map((it, k) => {
          const p = prog(c.t, times[k], 0.5), on = k === cur;
          return (
            <Fade key={k} p={p} dy={20} style={{ display: 'flex', alignItems: 'center', gap: 30, padding: '18px 30px', borderRadius: 16, border: `2px solid ${on ? C.hot : a(C.ink, 0.15)}`, background: on ? a(C.hot, 0.13) : 'transparent', opacity: p * (cur > k ? 0.5 : 1), transform: `translateY(${mix(20, 0, p)}px) scale(${on ? 1.03 : 1})` }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 56, color: on ? C.hot : a(C.ink, 0.45), width: 74 }}>{String(k + 1).padStart(2, '0')}</div>
              <div>
                <div style={{ fontFamily: SANS, fontWeight: 700, fontSize: two ? 40 : 46, color: C.ink }}><Hot s={it.t} /></div>
                {it.d && <div style={{ fontFamily: SANS, fontSize: two ? 26 : 30, color: a(C.ink, 0.6), marginTop: 6 }}>{it.d}</div>}
              </div>
            </Fade>
          );
        })}
      </div>
    </Stage>
  );
};

// ───────── 对话窗：派活
const Chat: React.FC<P<'chat'>> = ({ s, c }) => {
  const n = s.msgs.length;
  return (
    <Stage>
      <div style={{ width: 1440, borderRadius: 24, border: `2px solid ${a(C.ink, 0.18)}`, background: a('#FFFFFF', 0.03), overflow: 'hidden', opacity: prog(c.t, 0, 0.5) }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', gap: 10, padding: '0 24px', borderBottom: `1px solid ${a(C.ink, 0.12)}` }}>
          {[0, 1, 2].map((i) => <span key={i} style={{ width: 13, height: 13, borderRadius: 7, background: a(C.ink, 0.25) }} />)}
          <span style={{ marginLeft: 14, fontFamily: SANS, fontSize: 22, color: a(C.ink, 0.5), letterSpacing: 3 }}>{s.head ?? 'AI'}</span>
        </div>
        <div style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column', gap: 20, minHeight: 360 }}>
          {s.msgs.map((m, k) => {
            const at = revealAt(c, k, n), p = prog(c.t, at, 0.4), len = m.t.replace(/\*\*/g, '').length, chars = Math.floor(clamp((c.t - at) / 1.2) * len);
            if (c.t < at) return null;
            return (
              <div key={k} style={{ alignSelf: m.me ? 'flex-end' : 'flex-start', maxWidth: 1180, opacity: p, transform: `translateY(${mix(16, 0, p)}px)` }}>
                <div style={{ fontFamily: SANS, fontSize: 24, color: a(C.ink, 0.45), marginBottom: 8, textAlign: m.me ? 'right' : 'left' }}>{m.who ?? (m.me ? '你' : 'AI')}</div>
                <div style={{ fontFamily: SANS, fontSize: 40, lineHeight: 1.45, padding: '16px 28px', borderRadius: 18, color: C.ink, whiteSpace: 'pre-wrap',
                  background: m.me ? a(C.cool, 0.16) : 'transparent', border: `2px solid ${m.me ? a(C.cool, 0.5) : a(C.ink, 0.25)}` }}>
                  <Hot s={m.t} n={chars} />{chars < len && <span style={{ color: C.hot }}>▍</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Stage>
  );
};

// ───────── 任务方块：哪些交给 AI，哪些留给人
const Blocks: React.FC<P<'blocks'>> = ({ s, c }) => {
  const n = s.items.length, cols = n > 9 ? 4 : 3, bw = 330, bh = 110, gap = 26;
  const t1 = c.n > 1 ? c.at(1) : 1.8, t2 = c.n > 2 ? c.at(2) : t1 + 2;
  return (
    <Stage style={{ flexDirection: 'column' }}>
      {s.head && <Fade p={prog(c.t, 0, 0.5)} style={{ marginBottom: 36 }}><Tag color={a(C.ink, 0.6)} style={{ fontSize: 28, letterSpacing: 8 }}>{s.head}</Tag></Fade>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, ${bw}px)`, gap }}>
        {s.items.map((it, k) => {
          const isAI = s.ai.includes(k), p = prog(c.t, 0.15 + k * 0.07, 0.4), q = isAI ? prog(c.t, t1 + 0.1 + s.ai.indexOf(k) * 0.12, 0.5) : 0, keep = !isAI ? prog(c.t, t2, 0.6) : 0;
          return (
            <div key={k} style={{ height: bh, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontFamily: SANS, fontSize: 32, fontWeight: 600,
              border: `2px solid ${isAI ? a(C.cool, mix(0.25, 0.7, q)) : keep ? C.hot : a(C.ink, 0.25)}`, background: isAI ? a(C.cool, 0.12 * q) : a(C.hot, 0.14 * keep),
              color: isAI ? a(C.ink, mix(1, 0.45, q)) : C.ink, opacity: p, transform: `scale(${mix(0.85, 1, p) * mix(1, 0.94, q) * mix(1, 1.05, keep)})`, boxShadow: keep ? `0 0 ${36 * keep}px ${a(C.hot, 0.35)}` : 'none' }}>
              {it}
              {isAI && <span style={{ position: 'absolute', top: 8, right: 12, fontSize: 18, color: C.cool, opacity: q, letterSpacing: 2 }}>AI</span>}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 70, marginTop: 40, fontFamily: SANS, fontSize: 30 }}>
        {s.aiLabel && <span style={{ color: C.cool, opacity: prog(c.t, t1 + 0.4, 0.5) }}>■ {s.aiLabel}</span>}
        {s.keepLabel && <span style={{ color: C.hot, opacity: prog(c.t, t2 + 0.3, 0.5) }}>■ {s.keepLabel}</span>}
      </div>
    </Stage>
  );
};

// ───────── 散点：幸存者
const Scatter: React.FC<P<'scatter'>> = ({ s, c }) => {
  const t1 = c.n > 1 ? c.at(1) : 2, fall = inOut((c.t - t1) / 1.6), keepIdx = new Set(Array.from({ length: s.keep }, (_, i) => Math.floor(rnd(i, 9) * s.n)));
  return (
    <Stage>
      <svg width={SW} height={SH} style={{ position: 'absolute', inset: 0 }}>
        {Array.from({ length: s.n }, (_, i) => {
          const x = 260 + rnd(i, 3) * 1400, y0 = 90 + rnd(i, 4) * 460, keep = keepIdx.has(i), p = prog(c.t, rnd(i, 5) * 1.2, 0.4);
          const y = keep ? y0 : y0 + fall * fall * (500 + rnd(i, 6) * 300), o = keep ? 1 : 1 - fall * 0.9;
          return <circle key={i} cx={x} cy={y} r={(keep ? mix(7, 13, fall) : 7) * p} fill={keep && fall > 0 ? C.hot : a(C.ink, 0.6)} opacity={o * p} style={{ filter: keep && fall > 0.5 ? `drop-shadow(0 0 10px ${C.hot})` : 'none' }} />;
        })}
      </svg>
      {s.label && <div style={{ position: 'absolute', top: 20, left: 0, right: 0, textAlign: 'center', opacity: prog(c.t, 0.4, 0.5) * (1 - fall * 0.6) }}><Tag style={{ fontSize: 30 }}>{s.label}</Tag></div>}
      {s.keepLabel && <div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center', opacity: prog(c.t, t1 + 1.2, 0.5) }}><Tag color={C.hot} style={{ fontSize: 30 }}>{s.keepLabel}</Tag></div>}
    </Stage>
  );
};

// ───────── 中心辐射：一个核心连着很多东西
const Hub: React.FC<P<'hub'>> = ({ s, c }) => {
  const n = s.spokes.length, cx = SW / 2, cy = SH / 2, rx = 560, ry = 250;
  const pts = s.spokes.map((_, i) => { const ang = -Math.PI / 2 + (i / n) * Math.PI * 2 + Math.PI / n; return { x: cx + Math.cos(ang) * rx, y: cy + Math.sin(ang) * ry }; });
  const pc = prog(c.t, 0, 0.6);
  return (
    <Stage>
      <svg width={SW} height={SH} style={{ position: 'absolute', inset: 0 }}>
        {[0, 1].map((k) => {
          // 从中心向外扩的波纹：表示「连着」
          const ph = ((c.t + k * 1.25) / 2.5) % 1;
          return <ellipse key={`r${k}`} cx={cx} cy={cy} rx={mix(130, rx + 60, ph)} ry={mix(130, ry + 60, ph)} fill="none" stroke={a(C.hot, 0.4 * (1 - ph) * pc)} strokeWidth={3} />;
        })}
        {pts.map((P0, i) => {
          const at = 0.4 + i * Math.max(0.35, (c.len - 2.5) / n), p = inOut((c.t - at) / 0.6), ph = ((c.t * 0.6 + i * 0.37) % 1);
          return (
            <g key={i} opacity={p}>
              <line x1={P0.x} y1={P0.y} x2={mix(P0.x, cx, p)} y2={mix(P0.y, cy, p)} stroke={a(C.ink, 0.25)} strokeWidth={2} />
              {p >= 1 && <circle cx={mix(P0.x, cx, ph)} cy={mix(P0.y, cy, ph)} r={6} fill={C.hot} opacity={1 - ph * 0.6} />}
            </g>
          );
        })}
      </svg>
      {pts.map((P0, i) => {
        const p = prog(c.t, 0.4 + i * Math.max(0.35, (c.len - 2.5) / n), 0.5);
        return <div key={i} style={{ position: 'absolute', left: P0.x - 160, top: P0.y - 38, width: 320, height: 76, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 38, border: `2px solid ${a(C.ink, 0.35)}`, background: '#1A1E29', fontFamily: SANS, fontSize: 34, color: C.ink, opacity: p, transform: `scale(${mix(0.7, 1, p)})` }}>{s.spokes[i]}</div>;
      })}
      <div style={{ position: 'absolute', left: cx - 130, top: cy - 130, width: 260, height: 260, borderRadius: 130, display: 'flex', alignItems: 'center', justifyContent: 'center', background: a(C.hot, 0.15), border: `3px solid ${C.hot}`,
        boxShadow: `0 0 ${60 + 20 * Math.sin(c.t * 2)}px ${a(C.hot, 0.4)}`, fontFamily: SERIF, fontWeight: 700, fontSize: s.center.length > 4 ? 40 : 52, color: C.ink, textAlign: 'center', opacity: pc, transform: `scale(${mix(0.6, 1, pc)})` }}>{s.center}</div>
    </Stage>
  );
};

// ───────── 台阶：一级一级变化
const Stairs: React.FC<P<'stairs'>> = ({ s, c }) => {
  const n = s.items.length, bw = Math.min(260, 1400 / n - 30), maxH = 420;
  return (
    <Stage style={{ flexDirection: 'column' }}>
      {s.head && <Fade p={prog(c.t, 0, 0.5)} style={{ marginBottom: 30 }}><Tag color={a(C.ink, 0.6)} style={{ fontSize: 28, letterSpacing: 8 }}>{s.head}</Tag></Fade>}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 30, height: maxH + 120 }}>
        {s.items.map((it, k) => {
          const at = revealAt(c, k, n), p = inOut((c.t - at) / 0.7), last = k === n - 1, hh = maxH * ((k + 1) / n);
          return (
            <div key={k} style={{ width: bw, display: 'flex', flexDirection: 'column', alignItems: 'center', opacity: prog(c.t, at, 0.3) }}>
              <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 46, color: last ? C.hot : C.ink, marginBottom: 14, opacity: p }}>{it.v}</div>
              <div style={{ width: bw, height: hh * p, borderRadius: '10px 10px 0 0', background: last ? C.hot : a(C.ink, 0.15 + 0.08 * k), boxShadow: last ? `0 0 40px ${a(C.hot, 0.4)}` : 'none' }} />
              <div style={{ fontFamily: SANS, fontSize: 28, color: a(C.ink, 0.7), marginTop: 14, whiteSpace: 'nowrap' }}>{it.label}</div>
            </div>
          );
        })}
      </div>
    </Stage>
  );
};

// ───────── 两个词：从 A 到 B
const Split: React.FC<P<'split'>> = ({ s, c }) => {
  const t1 = c.n > 1 ? c.at(1) : 1.6, pa = prog(c.t, 0.1, 0.6), strike = inOut((c.t - t1) / 0.6), pb = prog(c.t, t1 + 0.3, 0.7), arrow = inOut((c.t - t1) / 0.8);
  return (
    <Stage>
      <div style={{ display: 'flex', alignItems: 'center', gap: 70 }}>
        <Fade p={pa} style={{ textAlign: 'center', position: 'relative' }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 140, color: a(C.ink, mix(1, 0.4, strike)), position: 'relative' }}>
            {s.a}
            <div style={{ position: 'absolute', left: -10, right: -10, top: '54%', height: 8, background: C.cool, transform: `scaleX(${strike})`, transformOrigin: 'left', borderRadius: 4 }} />
          </div>
          {s.aSub && <div style={{ fontFamily: SANS, fontSize: 30, color: a(C.ink, 0.5), marginTop: 10 }}>{s.aSub}</div>}
        </Fade>
        <svg width={200} height={60} style={{ opacity: arrow }}><line x1={0} y1={30} x2={180 * arrow} y2={30} stroke={C.hot} strokeWidth={5} /><path d="M165 15 L190 30 L165 45" fill="none" stroke={C.hot} strokeWidth={5} opacity={arrow > 0.9 ? 1 : 0} /></svg>
        <Fade p={pb} style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 140, color: C.hot, textShadow: `0 0 60px ${a(C.hot, 0.4)}` }}>{s.b}</div>
          {s.bSub && <div style={{ fontFamily: SANS, fontSize: 30, color: a(C.ink, 0.7), marginTop: 10 }}>{s.bSub}</div>}
        </Fade>
      </div>
    </Stage>
  );
};

// ───────── 结尾金句
const Quote: React.FC<P<'quote'> & { en?: string }> = ({ s, c, en }) => (
  <Stage style={{ flexDirection: 'column' }}>
    {s.lines.map((l, k) => {
      const p = prog(c.t, 0.2 + k * 0.7, 0.8);
      return <Fade key={k} p={p} dy={30}><div style={{ fontFamily: SERIF, fontWeight: 700, fontSize: 76, color: C.ink, lineHeight: 1.5, letterSpacing: 4, textAlign: 'center' }}><Hot s={l} /></div></Fade>;
    })}
    {en && <Fade p={prog(c.t, 0.4 + s.lines.length * 0.7, 0.8)} style={{ marginTop: 26 }}><div style={{ fontFamily: SERIF, fontStyle: 'italic', fontSize: 32, color: a(C.ink, 0.55) }}>{en}</div></Fade>}
    <Fade p={prog(c.t, 0.8 + s.lines.length * 0.7, 0.8)} style={{ marginTop: 56, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 80, height: 2, background: C.hot }} />
      <div style={{ fontFamily: SANS, fontSize: 30, color: a(C.ink, 0.75), letterSpacing: 6 }}>关注 宁少AI进化论</div>
      {s.next && <div style={{ fontFamily: SANS, fontSize: 24, color: a(C.ink, 0.45), letterSpacing: 3 }}>下一期 · {s.next}</div>}
    </Fade>
  </Stage>
);

const Field: React.FC<P<'field'>> = () => null;

const MAP: { [K in Scene['k']]: React.FC<P<K>> } = {
  field: Field, title: Title, number: NumberS, dots: Dots, bars: Bars, compare: Compare, flow: Flow, funnel: Funnel, curve: Curve,
  bell: Bell, ring: Ring, list: List, chat: Chat, blocks: Blocks, scatter: Scatter, hub: Hub, stairs: Stairs, split: Split, quote: Quote,
};

export const SceneView: React.FC<{ s: Scene; c: Clock; ep: Episode; en?: string }> = ({ s, c, ep, en }) => {
  const Comp = MAP[s.k] as React.FC<{ s: Scene; c: Clock; ep: Episode; en?: string }>;
  return <Comp s={s} c={c} ep={ep} en={en} />;
};
