// 竖屏播报风：深夜新闻台的竖屏版。近黑底、品牌红、白字、金色数字。1080×1920。
// 版面按抖音竖屏避让：顶部 0–110 是状态栏和搜索框，底部 1520 以下是标题和简介，右侧 x>930、y 900–1500 是点赞评论那一列图标。
// 所以：顶栏放 120–200，滚动条 212–262，章节标 300，主舞台 380–1330，字幕 1350–1470、宽度不超过 840。
// 第一次用在第十一期（黄仁勋想回来的那一天）。时间参数都是全片时刻（秒）。
import React from 'react';
import { AbsoluteFill } from 'remotion';
import { useClock, prog, mix, inOut } from '../kit/clock';
import { useT } from '../kit/kit';

export const BL = { bg: '#09090C', panel: '#141419', panel2: '#1C1C23', line: 'rgba(255,255,255,.12)', text: '#F5F3EE', mute: '#8C8A93', red: '#FF2D3C', gold: '#FFC24B', cyan: '#3DDCFF', green: '#2FD38A' };
export const BFONT = 'MiSans, "WenQuanYi Zen Hei", sans-serif';
const B = BL;
const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const bspr = (x: number) => (x <= 0 ? 0 : 1 - Math.exp(-7 * x) * Math.cos(9 * x));

/** 背景：缓慢漂移的网格、两道光斑、扫描线。整片垫底。 */
export const BBackdrop: React.FC = () => {
  const t = useT();
  return (
    <AbsoluteFill style={{ background: B.bg, overflow: 'hidden' }}>
      <AbsoluteFill style={{ backgroundImage: `linear-gradient(rgba(255,255,255,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px)`, backgroundSize: '72px 72px', backgroundPosition: `0 ${(t * 14) % 72}px` }} />
      <div style={{ position: 'absolute', left: -300 + Math.sin(t * 0.21) * 120, top: 300, width: 1100, height: 1100, borderRadius: 550, background: 'radial-gradient(circle, rgba(255,45,60,.16), rgba(255,45,60,0) 65%)' }} />
      <div style={{ position: 'absolute', right: -380 + Math.cos(t * 0.17) * 140, top: 900, width: 1200, height: 1200, borderRadius: 600, background: 'radial-gradient(circle, rgba(61,220,255,.09), rgba(61,220,255,0) 65%)' }} />
      <AbsoluteFill style={{ backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,.18) 0 2px, transparent 2px 4px)', opacity: 0.5 }} />
    </AbsoluteFill>
  );
};

/** 一镜：在 [from, to) 内显示。进镜默认带一道红色光条扫过；hard 则直接切。 */
export const BShot: React.FC<{ from: number; to: number; hard?: boolean; wipe?: boolean; children: React.ReactNode }> = ({ from, to, hard, wipe = true, children }) => {
  const t = useT(), F = 0.18;
  if (t < from || t >= to + (hard ? 0 : F)) return null;
  const o = hard ? Math.min(1, (t - from) / 0.08 + 0.3) : Math.min(1, (t - from) / F, 1 - Math.max(0, (t - to) / F));
  const w = inOut((t - from) / 0.35);
  return (
    <AbsoluteFill style={{ opacity: o, fontFamily: BFONT, color: B.text }}>
      {children}
      {wipe && w < 1 && <div style={{ position: 'absolute', left: `${mix(-30, 110, w)}%`, top: 380, width: 70, height: 950, background: `linear-gradient(90deg, rgba(255,45,60,0), ${B.red}, rgba(255,45,60,0))`, opacity: 0.55, transform: 'skewX(-14deg)' }} />}
    </AbsoluteFill>
  );
};
/** 主舞台：内容区 x 60–1020、y 380–1330。 */
export const BStage: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{ position: 'absolute', left: 60, top: 380, width: 960, height: 950, display: 'flex', flexDirection: 'column', justifyContent: 'center', ...style }}>{children}</div>
);
/** 到点升起。 */
export const BUp: React.FC<{ at: number; dy?: number; dur?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, dy = 50, dur = 0.38, style, children }) => {
  const p = prog(useT(), at, dur);
  return <div style={{ ...style, opacity: p, transform: `${style?.transform ?? ''} translateY(${mix(dy, 0, p)}px)` }}>{children}</div>;
};
/** 小标签：红底白字或描边。 */
export const Kicker: React.FC<{ children: React.ReactNode; at?: number; ghost?: boolean; color?: string; size?: number }> = ({ children, at = -9, ghost, color = B.red, size = 34 }) => {
  const p = bspr((useT() - at) / 0.4);
  return <span style={{ display: 'inline-block', fontSize: size, fontWeight: 900, letterSpacing: 2, padding: `${size * 0.16}px ${size * 0.55}px`, borderRadius: 8, background: ghost ? 'transparent' : color, color: ghost ? color : '#fff', border: `3px solid ${color}`, opacity: clamp(p * 2), transform: `scale(${mix(0.7, 1, p)})`, transformOrigin: 'left center', whiteSpace: 'nowrap' }}>{children}</span>;
};
/** 巨字：从左往右被「揭开」，同时轻推近。 */
export const MegaLine: React.FC<{ text: React.ReactNode; at: number; size?: number; color?: string; dur?: number; align?: 'left' | 'center' }> = ({ text, at, size = 200, color = B.text, dur = 0.32, align = 'left' }) => {
  const t = useT(), p = inOut((t - at) / dur);
  return <div style={{ fontSize: size, fontWeight: 900, letterSpacing: -size * 0.04, lineHeight: 1.08, color, clipPath: `inset(-10% ${100 - p * 100}% -10% 0)`, transform: `scale(${mix(1.08, 1, prog(t, at, 0.5)) + Math.max(0, t - at) * 0.006})`, transformOrigin: align === 'center' ? 'center' : 'left center', textAlign: align, whiteSpace: 'nowrap' }}>{text}</div>;
};
/** 引语卡：大引号、引语逐段到点点亮（没到的段压暗），下面是说话人和时间。 */
export const QuoteCard: React.FC<{ parts: { text: string; at: number; hot?: boolean }[]; who: string; when?: string; at: number; size?: number; color?: string }> = ({ parts, who, when, at, size = 70, color = B.gold }) => {
  const t = useT(), p = prog(t, at, 0.4);
  return (
    <div style={{ position: 'relative', opacity: p, transform: `translateY(${mix(40, 0, p)}px)`, background: B.panel, borderLeft: `14px solid ${color}`, borderRadius: 18, padding: '48px 50px 40px' }}>
      <div style={{ position: 'absolute', right: 30, top: -40, fontSize: 260, fontWeight: 900, color, opacity: 0.25, lineHeight: 1 }}>”</div>
      <div style={{ fontSize: size, fontWeight: 900, lineHeight: 1.32 }}>{parts.map((x, i) => { const q = prog(t, x.at, 0.25); return <span key={i} style={{ color: x.hot && q > 0.5 ? color : B.text, opacity: mix(0.22, 1, q) }}>{x.text}</span>; })}</div>
      <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 18, fontSize: 32, fontWeight: 600, color: B.mute }}><span style={{ width: 40, height: 4, background: color }} />{who}{when && <span style={{ marginLeft: 'auto', fontSize: 28 }}>{when}</span>}</div>
    </div>
  );
};
/** 剪影名牌：画一个人形剪影（不用照片）、名字、身份；flipAt 起身份翻成新身份。 */
export const RoleCard: React.FC<{ name: string; en?: string; role: string; to?: string; at: number; flipAt?: number; accent?: string }> = ({ name, en, role, to, at, flipAt = 1e9, accent = B.red }) => {
  const t = useT(), p = bspr((t - at) / 0.5), f = inOut((t - flipAt) / 0.45);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 36, opacity: clamp(p * 2), transform: `translateX(${mix(-60, 0, p)}px)` }}>
      <div style={{ position: 'relative', width: 230, height: 230, borderRadius: 30, background: `linear-gradient(160deg, ${B.panel2}, #0d0d12)`, overflow: 'hidden', border: `3px solid ${B.line}`, flex: 'none' }}>
        <svg viewBox="0 0 230 230" width={230} height={230}><circle cx={115} cy={92} r={48} fill="#2a2a33" /><path d="M30 230 C35 160 75 140 115 140 C155 140 195 160 200 230 Z" fill="#2a2a33" /></svg>
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 8, background: accent }} />
      </div>
      <div>
        <div style={{ fontSize: 80, fontWeight: 900, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{name}</div>
        {en && <div style={{ fontSize: 34, fontWeight: 600, color: B.mute, marginTop: 6, whiteSpace: 'nowrap' }}>{en}</div>}
        <div style={{ position: 'relative', height: 64, marginTop: 16, overflow: 'hidden' }}>
          <div style={{ transform: `translateY(${-f * 64}px)` }}>
            <div style={{ height: 64, fontSize: 44, fontWeight: 900, color: B.mute, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{role}</div>
            {to && <div style={{ height: 64, fontSize: 44, fontWeight: 900, color: accent, display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>{to}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
/** 卷帘门：两扇门从两侧合上，合上的一刻盖章。 */
export const ShutterStamp: React.FC<{ at: number; stamp: string; sub?: string; children?: React.ReactNode }> = ({ at, stamp, sub, children }) => {
  const t = useT(), c = inOut((t - at) / 0.5), s = bspr((t - at - 0.45) / 0.45);
  return (
    <div style={{ position: 'relative', width: 960, height: 760, borderRadius: 24, overflow: 'hidden', background: B.panel, border: `2px solid ${B.line}` }}>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
      {[0, 1].map((k) => <div key={k} style={{ position: 'absolute', top: 0, bottom: 0, width: '50%', [k ? 'right' : 'left']: 0, transform: `translateX(${(k ? 1 : -1) * (1 - c) * 100}%)`, background: `repeating-linear-gradient(0deg, #23232b 0 34px, #1a1a21 34px 40px)`, borderRight: k ? 'none' : `4px solid #000`, borderLeft: k ? `4px solid #000` : 'none' } as React.CSSProperties} />)}
      {t > at + 0.4 && <div style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%,-50%) rotate(-8deg) scale(${mix(1.8, 1, s)})`, opacity: clamp(s * 2), border: `12px solid ${B.red}`, color: B.red, borderRadius: 24, padding: '10px 50px', textAlign: 'center', background: 'rgba(9,9,12,.75)' }}>
        <div style={{ fontSize: 150, fontWeight: 900, lineHeight: 1.05, whiteSpace: 'nowrap' }}>{stamp}</div>{sub && <div style={{ fontSize: 40, fontWeight: 900, whiteSpace: 'nowrap' }}>{sub}</div>}</div>}
    </div>
  );
};
/** 案卷堆：一张张卷宗卡依次滑进来，右侧状态章（进行中、未结等）。 */
export const CaseStack: React.FC<{ items: { no: string; title: string; note?: string; status: string; at: number; color?: string }[] }> = ({ items }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {items.map((it) => { const p = bspr((t - it.at) / 0.5), c = it.color ?? B.red;
        return <div key={it.no} style={{ display: 'flex', alignItems: 'center', gap: 26, background: B.panel, border: `2px solid ${B.line}`, borderLeft: `10px solid ${c}`, borderRadius: 18, padding: '24px 30px', opacity: clamp(p * 2), transform: `translateX(${mix(120, 0, p)}px)` }}>
          <div style={{ fontSize: 64, fontWeight: 900, color: c, width: 70 }}>{it.no}</div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 50, fontWeight: 900, lineHeight: 1.2 }}>{it.title}</div>{it.note && <div style={{ fontSize: 32, fontWeight: 600, color: B.mute, marginTop: 6 }}>{it.note}</div>}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: c, border: `4px solid ${c}`, borderRadius: 10, padding: '4px 14px', transform: 'rotate(-6deg)', whiteSpace: 'nowrap' }}>{it.status}</div>
        </div>; })}
    </div>
  );
};
/** 车灯：两束光从远处打过来，中间是一句引语。 */
export const Headlights: React.FC<{ at: number; children: React.ReactNode }> = ({ at, children }) => {
  const t = useT(), p = inOut((t - at) / 0.8), flick = 0.85 + 0.15 * Math.sin(t * 13) * Math.sin(t * 7);
  return (
    <div style={{ position: 'relative', width: 960, height: 820, overflow: 'hidden', borderRadius: 24 }}>
      <svg width={960} height={820} style={{ position: 'absolute', inset: 0 }}>
        <defs><radialGradient id="hl" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#FFF6D6" stopOpacity={1} /><stop offset="100%" stopColor="#FFF6D6" stopOpacity={0} /></radialGradient>
          <linearGradient id="bm" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stopColor="#FFF3C8" stopOpacity={0.55 * p * flick} /><stop offset="100%" stopColor="#FFF3C8" stopOpacity={0} /></linearGradient></defs>
        {[300, 660].map((x) => <g key={x}><path d={`M${x - 40} 820 L${x - 260} 0 L${x + 260} 0 L${x + 40} 820 Z`} fill="url(#bm)" /><circle cx={x} cy={790} r={mix(10, 70, p)} fill="url(#hl)" opacity={flick} /></g>)}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>{children}</div>
    </div>
  );
};
/** 滚动数字：数字从 from 滚到 to（只滚数字部分），可带前后缀。 */
export const RollNumber: React.FC<{ to: number; from?: number; at: number; dur?: number; digits?: number; pre?: string; post?: string; size?: number; color?: string; comma?: boolean }> = ({ to, from = 0, at, dur = 0.9, digits = 0, pre = '', post = '', size = 200, color = B.gold, comma }) => {
  const t = useT(), p = inOut((t - at) / dur), v = mix(from, to, p), s = v.toFixed(digits);
  const out = comma ? Number(s).toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits }) : s;
  return <span style={{ fontSize: size, fontWeight: 900, letterSpacing: -size * 0.03, color, fontVariantNumeric: 'tabular-nums', opacity: prog(t, at - 0.1, 0.2), whiteSpace: 'nowrap' }}>{pre}{out}<span style={{ fontSize: size * 0.42, marginLeft: size * 0.06 }}>{post}</span></span>;
};
/** 体量对比：一根很小的条和一根很长的条，中间跳出倍数。 */
export const ScaleCompare: React.FC<{ a: { label: string; value: string; v: number }; b: { label: string; value: string; v: number }; at: number; bAt: number; mulAt: number; mul: number }> = ({ a, b, at, bAt, mulAt, mul }) => {
  const t = useT(), W = 900, pa = inOut((t - at) / 0.5), pb = inOut((t - bAt) / 0.9), wa = Math.max(14, W * a.v / b.v);
  const row = (x: typeof a, w: number, p: number, c: string) => <div style={{ opacity: clamp(p * 3) }}>
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}><span style={{ fontSize: 40, fontWeight: 900, color: B.mute }}>{x.label}</span><span style={{ fontSize: 72, fontWeight: 900, color: c }}>{x.value}</span></div>
    <div style={{ height: 70, borderRadius: 12, background: 'rgba(255,255,255,.06)' }}><div style={{ height: '100%', width: w * p, borderRadius: 12, background: c, boxShadow: `0 0 40px ${c}66` }} /></div></div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 46 }}>
      {row(a, wa, pa, B.mute)}{row(b, W, pb, B.gold)}
      <div style={{ alignSelf: 'center', opacity: prog(t, mulAt, 0.2), transform: `scale(${mix(1.6, 1, bspr((t - mulAt) / 0.45))})` }}><RollNumber to={mul} from={1} at={mulAt} dur={0.8} pre="×" size={230} color={B.red} /></div>
    </div>
  );
};
/** 数字砖：几块数字依次砸进来，每块一个滚动数字和一行说明。 */
export const StatTiles: React.FC<{ items: { label: string; to: number; pre?: string; post?: string; digits?: number; at: number; color?: string; note?: string }[] }> = ({ items }) => {
  const t = useT();
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
      {items.map((x, i) => { const p = bspr((t - x.at) / 0.45);
        return <div key={i} style={{ gridColumn: i === 0 && items.length % 2 ? 'span 2' : undefined, background: B.panel, border: `2px solid ${B.line}`, borderTop: `8px solid ${x.color ?? B.gold}`, borderRadius: 18, padding: '22px 26px', opacity: clamp(p * 2), transform: `scale(${mix(0.85, 1, p)})` }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: B.mute }}>{x.label}</div>
          <RollNumber to={x.to} at={x.at} digits={x.digits} pre={x.pre} post={x.post} size={i === 0 && items.length % 2 ? 150 : 104} color={x.color ?? B.gold} />
          {x.note && <div style={{ fontSize: 26, fontWeight: 600, color: B.mute }}>{x.note}</div>}
        </div>; })}
    </div>
  );
};
/** 归零：一个数先亮出来，到点被划掉、滚到 0。 */
export const DropToZero: React.FC<{ label: string; from: number; post: string; at: number; dropAt: number; zeroLabel: string; stamp?: string; stampAt?: number }> = ({ label, from, post, at, dropAt, zeroLabel, stamp, stampAt = 1e9 }) => {
  const t = useT(), d = inOut((t - dropAt) / 0.9), s = bspr((t - stampAt) / 0.4);
  return (
    <div style={{ position: 'relative' }}>
      <BUp at={at}><div style={{ fontSize: 44, fontWeight: 900, color: B.mute }}>{label}</div></BUp>
      <div style={{ position: 'relative', display: 'inline-block', marginTop: 10 }}>
        <RollNumber to={t < dropAt ? from : mix(from, 0, d)} from={t < dropAt ? 0 : from} at={t < dropAt ? at : dropAt - 5} dur={t < dropAt ? 0.8 : 0.01} digits={0} post={post} size={260} color={t < dropAt + 0.9 ? B.gold : B.red} />
        {t > stampAt && <div style={{ position: 'absolute', right: -40, top: 20, transform: `rotate(-10deg) scale(${mix(1.8, 1, s)})`, opacity: clamp(s * 2), border: `8px solid ${B.red}`, color: B.red, borderRadius: 14, padding: '2px 22px', fontSize: 64, fontWeight: 900, background: 'rgba(9,9,12,.8)', whiteSpace: 'nowrap' }}>{stamp}</div>}
      </div>
      {t > dropAt + 0.9 && <BUp at={dropAt + 0.9}><div style={{ fontSize: 50, fontWeight: 900, color: B.red, marginTop: 6 }}>{zeroLabel}</div></BUp>}
    </div>
  );
};
/** 空位：一把空椅子的线稿，头顶一个问号，下面几枚状态小标。 */
export const EmptySeat: React.FC<{ at: number; title: string; tags: { text: string; at: number }[] }> = ({ at, title, tags }) => {
  const t = useT(), p = prog(t, at, 0.5), q = 0.5 + 0.5 * Math.sin(t * 3.2);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, opacity: p }}>
      <div style={{ position: 'relative', width: 520, height: 520 }}>
        <svg viewBox="0 0 520 520" width={520} height={520}><g fill="none" stroke={B.text} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={1800} strokeDashoffset={1800 * (1 - inOut((t - at) / 1.1))}>
          <path d="M150 120 L150 300 L370 300 L370 120 Z" /><path d="M120 300 L400 300" /><path d="M160 300 L140 470 M360 300 L380 470 M200 300 L200 420 M320 300 L320 420" /></g></svg>
        <div style={{ position: 'absolute', left: 0, right: 0, top: 70, textAlign: 'center', fontSize: 220, fontWeight: 900, color: B.red, opacity: prog(t, at + 0.8, 0.3), textShadow: `0 0 ${30 + 30 * q}px ${B.red}` }}>?</div>
      </div>
      <div style={{ fontSize: 72, fontWeight: 900, whiteSpace: 'nowrap' }}>{title}</div>
      <div style={{ display: 'flex', gap: 18 }}>{tags.map((x) => <Kicker key={x.text} at={x.at} ghost color={B.gold} size={38}>{x.text}</Kicker>)}</div>
    </div>
  );
};
/** 结论行：每行左边一个对象，右边一个结论（✓ 或 ?），到点逐行亮。 */
export const VerdictRows: React.FC<{ rows: { k: string; v: string; ok: boolean; at: number }[] }> = ({ rows }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {rows.map((r) => { const p = bspr((t - r.at) / 0.45), c = r.ok ? B.green : B.red;
        return <div key={r.k} style={{ display: 'flex', alignItems: 'center', gap: 26, background: B.panel, borderRadius: 20, border: `2px solid ${B.line}`, padding: '26px 32px', opacity: clamp(p * 2), transform: `translateY(${mix(40, 0, p)}px)` }}>
          <div style={{ width: 96, height: 96, borderRadius: 48, background: c, color: '#0a0a0c', fontSize: 64, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>{r.ok ? '✓' : '?'}</div>
          <div><div style={{ fontSize: 36, fontWeight: 900, color: B.mute }}>{r.k}</div><div style={{ fontSize: 66, fontWeight: 900, color: r.ok ? B.text : c, whiteSpace: 'nowrap' }}>{r.v}</div></div>
        </div>; })}
    </div>
  );
};
/** 日历卡：一页撕下来的日历，月日大字，下面一行事件。 */
export const DateCard: React.FC<{ month: string; day: string; event: string; at: number; color?: string }> = ({ month, day, event, at, color = B.red }) => {
  const t = useT(), p = bspr((t - at) / 0.55);
  return (
    <div style={{ width: 520, borderRadius: 28, overflow: 'hidden', background: B.text, color: B.bg, opacity: clamp(p * 2), transform: `perspective(900px) rotateX(${mix(70, 0, p)}deg)`, transformOrigin: 'top center', boxShadow: '0 40px 90px rgba(0,0,0,.6)' }}>
      <div style={{ background: color, color: '#fff', fontSize: 44, fontWeight: 900, padding: '14px 0', textAlign: 'center' }}>{month}</div>
      <div style={{ fontSize: 260, fontWeight: 900, lineHeight: 1.05, textAlign: 'center', letterSpacing: -8 }}>{day}</div>
      <div style={{ fontSize: 40, fontWeight: 900, textAlign: 'center', padding: '0 24px 30px' }}>{event}</div>
    </div>
  );
};
/** 编号目录：01、02、03 竖排，到点逐条点亮，当前那条最亮。 */
export const IndexTriad: React.FC<{ items: string[]; ats: number[]; title?: string }> = ({ items, ats, title }) => {
  const t = useT();
  return (
    <div>
      {title && <div style={{ fontSize: 44, fontWeight: 900, color: B.mute, marginBottom: 20 }}>{title}</div>}
      {items.map((x, i) => { const p = bspr((t - ats[i]) / 0.45);
        return <div key={x} style={{ display: 'flex', alignItems: 'baseline', gap: 30, padding: '18px 0', borderTop: i ? `2px solid ${B.line}` : 'none', opacity: clamp(p * 2), transform: `translateX(${mix(-60, 0, p)}px)` }}>
          <span style={{ fontSize: 110, fontWeight: 900, color: 'transparent', WebkitTextStroke: `3px ${B.red}`, width: 160 }}>0{i + 1}</span><span style={{ fontSize: 92, fontWeight: 900 }}>{x}</span></div>; })}
    </div>
  );
};
/** 流程链：几个环节横排，到点逐个打勾，箭头连起来。 */
export const PipeChips: React.FC<{ items: string[]; at: number; step?: number }> = ({ items, at, step = 0.3 }) => {
  const t = useT();
  return (
    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
      {items.map((x, i) => { const on = t >= at + i * step;
        return <React.Fragment key={x}>{i > 0 && <span style={{ fontSize: 40, color: B.mute }}>→</span>}
          <span style={{ fontSize: 46, fontWeight: 900, padding: '10px 22px', borderRadius: 14, background: on ? B.red : B.panel2, color: on ? '#fff' : B.mute, transform: `scale(${on ? 1 : 0.92})`, whiteSpace: 'nowrap' }}>{on ? '✓ ' : ''}{x}</span></React.Fragment>; })}
    </div>
  );
};
/** 口令输入：评论框里一个字一个字打出口令。 */
export const KeyTyper: React.FC<{ label: string; text: string; at: number; cps?: number }> = ({ label, text, at, cps = 5 }) => {
  const t = useT();
  return (
    <div style={{ background: B.panel, border: `3px solid ${B.line}`, borderRadius: 24, padding: '22px 30px' }}>
      <div style={{ fontSize: 32, fontWeight: 900, color: B.mute }}>{label}</div>
      <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 1.2, whiteSpace: 'nowrap' }}>{text.slice(0, Math.max(0, Math.ceil((t - at) * cps)))}<span style={{ color: B.red, opacity: Math.floor(t * 2.5) % 2 ? 1 : 0.15 }}>|</span></div>
    </div>
  );
};
/** 关注按钮：红色大按钮，到点被点一下变成已关注。 */
export const FollowPill: React.FC<{ name: string; at: number; clickAt: number }> = ({ name, at, clickAt }) => {
  const t = useT(), ok = t > clickAt + 0.25, p = bspr((t - at) / 0.45);
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 26, background: B.panel, border: `2px solid ${B.line}`, borderRadius: 999, padding: '16px 18px 16px 40px', opacity: clamp(p * 2), transform: `scale(${mix(0.8, 1, p)})` }}>
      <span style={{ fontSize: 60, fontWeight: 900, whiteSpace: 'nowrap' }}>{name}</span>
      <span style={{ fontSize: 54, fontWeight: 900, color: '#fff', background: ok ? '#3a3a44' : B.red, borderRadius: 999, padding: '10px 44px', transform: `scale(${1 + 0.12 * Math.sin(clamp((t - clickAt) / 0.35) * Math.PI)})`, whiteSpace: 'nowrap' }}>{ok ? '已关注' : '+ 关注'}</span>
    </div>
  );
};

/** 常驻外框：顶栏（台标、日期、AI 标识）、财务滚动条、章节标、进度线、字幕。开头 openAiFor 秒内顶部出一条醒目的 AI 生成声明。 */
export const BFrame: React.FC<{ show: string; date: string; ticker: string[]; chapters: { from: number; label: string }[]; hero?: number[]; hot?: string[]; openAiFor?: number }> = ({ show, date, ticker, chapters, hero = [], hot = [], openAiFor = 2.5 }) => {
  const t = useT(), ck = useClock();
  const ch = [...chapters].reverse().find((c) => t >= c.from);
  const l0 = ck.lines.find((x) => t >= x.start && t < x.end), l = l0 && !hero.includes(l0.n) ? l0 : undefined;
  const re = hot.length ? new RegExp('(' + hot.map((h) => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')') : null;
  const tk = ticker.join('　　◆　　'), tw = tk.length * 30 + 400, x = -((t * 120) % tw);
  const live = 0.5 + 0.5 * Math.sin(t * 5);
  return (
    <AbsoluteFill style={{ fontFamily: BFONT, color: B.text, pointerEvents: 'none' }}>
      {/* 顶栏 */}
      <div style={{ position: 'absolute', left: 50, right: 50, top: 120, height: 80, display: 'flex', alignItems: 'center', gap: 18 }}>
        <span style={{ background: B.red, color: '#fff', fontSize: 38, fontWeight: 900, padding: '8px 22px', borderRadius: 8 }}>{show}</span>
        <span style={{ fontSize: 34, fontWeight: 900 }}>{date}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, fontSize: 28, fontWeight: 900, border: `2px solid ${B.text}`, borderRadius: 999, padding: '6px 18px' }}><span style={{ width: 14, height: 14, borderRadius: 7, background: B.red, opacity: live }} />AI 生成</span>
      </div>
      {/* 滚动条 */}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 212, height: 50, background: 'rgba(255,255,255,.06)', borderTop: `2px solid ${B.red}`, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, zIndex: 2, height: '100%', background: B.red, color: '#fff', fontSize: 26, fontWeight: 900, padding: '0 18px', display: 'flex', alignItems: 'center' }}>数据</div>
        <div style={{ position: 'absolute', left: 120 + x, whiteSpace: 'nowrap', fontSize: 28, fontWeight: 600, color: B.text }}>{tk}　　◆　　{tk}</div>
      </div>
      {/* 章节标 */}
      {ch && <div style={{ position: 'absolute', left: 60, top: 296, display: 'flex', alignItems: 'center', gap: 14, fontSize: 34, fontWeight: 900 }}><span style={{ width: 12, height: 40, background: B.red }} />{ch.label}</div>}
      {/* 进度线 */}
      <div style={{ position: 'absolute', left: 0, top: 262, height: 6, width: `${(t / ck.total) * 100}%`, background: B.gold }} />
      {/* 开头的 AI 声明 */}
      {t < openAiFor + 0.3 && <div style={{ position: 'absolute', left: 60, right: 60, top: 300, opacity: Math.min(1, (openAiFor + 0.3 - t) / 0.3), background: B.text, color: B.bg, borderRadius: 14, padding: '14px 24px', fontSize: 40, fontWeight: 900, textAlign: 'center' }}>本视频由 AI 生成 · 画面、配音、剪辑</div>}
      {/* 字幕 */}
      {l && <div style={{ position: 'absolute', left: 60, width: 860, top: 1350, display: 'flex' }}><span style={{ fontSize: 62, fontWeight: 900, lineHeight: 1.25, background: 'rgba(0,0,0,.72)', borderLeft: `8px solid ${B.red}`, padding: '10px 24px', borderRadius: 10 }}>{re ? l.text.split(re).map((x, i) => hot.includes(x) ? <span key={i} style={{ color: B.gold }}>{x}</span> : x) : l.text}</span></div>}
    </AbsoluteFill>
  );
};
