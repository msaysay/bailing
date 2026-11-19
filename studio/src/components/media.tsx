// 视频与图片类组件：让一段视频、几张图片在画面里有「容器」和「编排」，不裸贴。
import React from 'react';
import { Img, OffthreadVideo, staticFile } from 'remotion';
import { prog, mix, inOut } from '../kit/clock';
import { C, FONT, Pop, useT } from '../kit/kit';

const rnd = (i: number) => { const x = Math.sin(i * 45.17 + 9.1) * 43758.5453; return x - Math.floor(x); };
const Media: React.FC<{ src: string; style?: React.CSSProperties }> = ({ src, style }) => /\.(mp4|webm|mov)$/.test(src)
  ? <OffthreadVideo src={staticFile(src)} muted style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />
  : <Img src={staticFile(src)} style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />;

/** 视频卡：一段视频放进带标题条的卡片，下方写来源。引用别人的片段、采访、发布会时用。 */
export const VideoCard: React.FC<{ src: string; title: string; credit: string; at: number; width?: number }> = ({ src, title, credit, at, width = 1200 }) => {
  const p = prog(useT(), at, 0.6);
  return (
    <div style={{ width, opacity: p, transform: `translateY(${mix(50, 0, p)}px) rotate(${mix(-1.5, 0, p)}deg)`, fontFamily: FONT }}>
      <div style={{ borderRadius: 22, overflow: 'hidden', border: '6px solid #F3F1EA', boxShadow: '0 44px 100px rgba(0,0,0,.65)', height: (width * 9) / 16 }}><Media src={src} /></div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16 }}><div style={{ fontSize: 40, fontWeight: 900, color: C.text }}>{title}</div><div style={{ fontSize: 24, color: C.muted }}>画面：{credit}</div></div>
    </div>
  );
};
/** 照片堆：几张照片像被扔到桌上一样一张张落下，带白边和随机角度。 */
export const PhotoStack: React.FC<{ items: { src: string; caption?: string }[]; ats: number[]; size?: number }> = ({ items, ats, size = 520 }) => {
  const t = useT();
  return (
    <div style={{ position: 'relative', width: size * 2.2, height: size * 1.25, fontFamily: FONT }}>
      {items.map((it, i) => { const p = prog(t, ats[i], 0.45), ang = (rnd(i) - 0.5) * 22, x = (items.length > 1 ? i / (items.length - 1) : 0.5) * size * 1.2 + (rnd(i + 7) - 0.5) * size * 0.12, y = size * 0.06 + rnd(i + 3) * size * 0.22;
        return <div key={i} style={{ position: 'absolute', left: x, top: y, width: size, background: '#F6F4EE', padding: `${size * 0.035}px ${size * 0.035}px ${size * 0.12}px`, boxSizing: 'border-box', boxShadow: '0 26px 60px rgba(0,0,0,.55)', opacity: Math.min(1, p * 2), transform: `translateY(${mix(-160, 0, p)}px) rotate(${mix(ang * 2.2, ang, p)}deg) scale(${mix(1.25, 1, p)})` }}>
          <div style={{ height: size * 0.56, overflow: 'hidden' }}><Media src={it.src} /></div>{it.caption && <div style={{ position: 'absolute', left: 0, right: 0, bottom: size * 0.028, textAlign: 'center', fontSize: size * 0.055, fontWeight: 600, color: '#14171D' }}>{it.caption}</div>}
        </div>; })}
    </div>
  );
};
/** 缓推图片：一张图片在框里极缓地推近或平移（静图当背景或当主体时都不能是死图）。 */
export const KenBurns: React.FC<{ src: string; at: number; dur?: number; from?: [number, number, number]; to?: [number, number, number]; width?: number; caption?: string }> = ({ src, at, dur = 5, from = [1, 0, 0], to = [1.18, -3, -2], width = 1300, caption }) => {
  const t = useT(), p = Math.max(0, Math.min(1, (t - at) / dur)), a = prog(t, at, 0.6);
  return (
    <div style={{ position: 'relative', width, height: (width * 9) / 16, borderRadius: 20, overflow: 'hidden', boxShadow: '0 44px 100px rgba(0,0,0,.65)', opacity: a, fontFamily: FONT }}>
      <Media src={src} style={{ transform: `scale(${mix(from[0], to[0], p)}) translate(${mix(from[1], to[1], p)}%, ${mix(from[2], to[2], p)}%)` }} />
      {caption && <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '60px 30px 22px', background: 'linear-gradient(180deg, transparent, rgba(8,11,17,.85))', fontSize: 34, fontWeight: 600, color: C.text }}>{caption}</div>}
    </div>
  );
};
/** 图片墙：一面图片墙铺开，其中一张被拉到前面放大。适合「这么多里挑一个讲」。 */
export const GalleryWall: React.FC<{ items: string[]; cols: number; pick: number; at: number; pickAt: number; cell?: number }> = ({ items, cols, pick, at, pickAt, cell = 400 }) => {
  const t = useT(), h = cell * 0.5625, gap = 18, rows = Math.ceil(items.length / cols), W = cols * cell + (cols - 1) * gap, H = rows * h + (rows - 1) * gap, k = inOut((t - pickAt) / 0.8);
  return (
    <div style={{ position: 'relative', width: W, height: H }}>
      {items.map((src, i) => { const c = i % cols, r = Math.floor(i / cols), p = prog(t, at + (c + r) * 0.09, 0.4), me = i === pick, x = c * (cell + gap), y = r * (h + gap);
        return <div key={i} style={{ position: 'absolute', left: me ? mix(x, W / 2 - cell / 2, k) : x, top: me ? mix(y, H / 2 - h / 2, k) : y, width: cell, height: h, borderRadius: 14, overflow: 'hidden', opacity: p * (me ? 1 : mix(1, 0.3, k)), transform: `scale(${mix(0.85, 1, p) * (me ? mix(1, 1.9, k) : 1)})`, zIndex: me ? 5 : 1, boxShadow: me ? `0 30px 70px rgba(0,0,0,${0.6 * k})` : 'none', border: me ? `${4 * k}px solid #F3F1EA` : 'none', boxSizing: 'border-box' }}><Media src={src} /></div>; })}
    </div>
  );
};
/** 胶片条：一条横向胶片匀速滑过，每格一段画面。适合「过去几年」「一连串镜头」。 */
export const FilmStrip: React.FC<{ items: string[]; at: number; speed?: number; height?: number }> = ({ items, at, speed = 150, height = 360 }) => {
  const t = useT(), w = (height * 16) / 9, gap = 26, off = Math.max(0, t - at) * speed, p = prog(t, at, 0.5), holes = Array.from({ length: 60 });
  return (
    <div style={{ width: 1700, height: height + 110, background: '#06080C', overflow: 'hidden', position: 'relative', opacity: p, transform: 'rotate(-2deg)', boxShadow: '0 30px 80px rgba(0,0,0,.6)' }}>
      {[14, height + 76].map((y) => <div key={y} style={{ position: 'absolute', left: -((off * 1) % 60), top: y, display: 'flex', gap: 30 }}>{holes.map((_, i) => <div key={i} style={{ width: 30, height: 20, borderRadius: 5, background: '#1F2533', flex: 'none' }} />)}</div>)}
      <div style={{ position: 'absolute', left: 60 - off, top: 55, display: 'flex', gap }}>{[...items, ...items].map((s, i) => <div key={i} style={{ width: w, height, borderRadius: 8, overflow: 'hidden', flex: 'none' }}><Media src={s} /></div>)}</div>
    </div>
  );
};
/** 前后滑块：两张图叠在一起，一条竖线从左划到右，划过的地方换成另一张。前后对比最直观的一种。 */
export const BeforeAfter: React.FC<{ before: string; after: string; at: number; dur?: number; width?: number; labels?: [string, string] }> = ({ before, after, at, dur = 2.2, width = 1300, labels = ['之前', '之后'] }) => {
  const t = useT(), h = (width * 9) / 16, p = inOut((t - at) / dur), x = mix(0.06, 0.94, p) * width;
  const tag = (s: string, side: 'left' | 'right', op: number) => <div style={{ position: 'absolute', [side]: 22, top: 22, background: 'rgba(8,11,17,.8)', color: C.text, fontSize: 34, fontWeight: 900, padding: '6px 20px', borderRadius: 10, opacity: op, fontFamily: FONT }}>{s}</div>;
  return (
    <div style={{ position: 'relative', width, height: h, borderRadius: 20, overflow: 'hidden', boxShadow: '0 44px 100px rgba(0,0,0,.65)' }}>
      <Media src={before} /><div style={{ position: 'absolute', left: 0, top: 0, width: x, height: h, overflow: 'hidden' }}><div style={{ width, height: h }}><Media src={after} /></div></div>
      {tag(labels[1], 'left', p)}{tag(labels[0], 'right', 1 - p * 0.8)}
      <div style={{ position: 'absolute', left: x - 3, top: 0, width: 6, height: h, background: '#F3F1EA' }}><div style={{ position: 'absolute', left: -27, top: h / 2 - 30, width: 60, height: 60, borderRadius: 30, background: '#F3F1EA', color: '#14171D', fontSize: 30, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>⇄</div></div>
    </div>
  );
};
/** 定格标注：画面定住，几条引线从人或物上拉出来标上名字。介绍「这是谁、那是什么」。 */
export const FreezeLabels: React.FC<{ src: string; labels: { x: number; y: number; text: string; sub?: string; at: number; side?: 'left' | 'right' }[]; width?: number }> = ({ src, labels, width = 1300 }) => {
  const t = useT(), h = (width * 9) / 16;
  return (
    <div style={{ position: 'relative', width, height: h, borderRadius: 20, overflow: 'hidden', boxShadow: '0 44px 100px rgba(0,0,0,.65)', fontFamily: FONT }}>
      <Media src={src} style={{ filter: `saturate(${mix(1, 0.35, prog(t, labels[0].at - 0.3, 0.4))}) brightness(${mix(1, 0.75, prog(t, labels[0].at - 0.3, 0.4))})` }} />
      {labels.map((l, i) => { const p = prog(t, l.at, 0.4), sx = l.x * width, sy = l.y * h, dir = l.side === 'left' ? -1 : 1, ex = sx + dir * 170, ey = sy - 90;
        return <React.Fragment key={i}>
          <svg style={{ position: 'absolute', inset: 0 }} width={width} height={h}><circle cx={sx} cy={sy} r={10 * p} fill={C.warm} /><path d={`M${sx} ${sy} L${mix(sx, ex, p)} ${mix(sy, ey, p)}`} stroke={C.warm} strokeWidth={4} /></svg>
          <div style={{ position: 'absolute', left: dir > 0 ? ex + 8 : undefined, right: dir < 0 ? width - ex + 8 : undefined, top: ey - 44, background: 'rgba(8,11,17,.88)', borderLeft: `6px solid ${C.warm}`, padding: '8px 20px', opacity: prog(t, l.at + 0.25, 0.3) }}><div style={{ fontSize: 36, fontWeight: 900, color: C.text, whiteSpace: 'nowrap' }}>{l.text}</div>{l.sub && <div style={{ fontSize: 22, color: C.muted, whiteSpace: 'nowrap' }}>{l.sub}</div>}</div>
        </React.Fragment>; })}
    </div>
  );
};
/** 字里看画面：巨大的标题字当窗口，视频从字的笔画里透出来。做开场或章节用。 */
export const TextMask: React.FC<{ src: string; text: string; at: number; size?: number; sub?: string }> = ({ src, text, at, size = 380, sub }) => {
  const t = useT(), p = prog(t, at, 0.8), W = 1700, H = size * 1.3;
  return (
    <div style={{ position: 'relative', width: W, fontFamily: FONT }}>
      <div style={{ position: 'relative', width: W, height: H, opacity: p, transform: `scale(${mix(1.12, 1, p)})` }}>
        <div style={{ position: 'absolute', inset: 0, WebkitMaskImage: `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='${W}' height='${H}'><text x='50%' y='78%' text-anchor='middle' font-family='MiSans, sans-serif' font-weight='900' font-size='${size}'>${text}</text></svg>`)}")`, WebkitMaskSize: '100% 100%', maskSize: '100% 100%' }}><Media src={src} /></div>
      </div>
      {sub && <Pop at={at + 0.7} style={{ textAlign: 'center', fontSize: 44, fontWeight: 600, color: C.muted, marginTop: 6 }}>{sub}</Pop>}
    </div>
  );
};
/** 多格拼贴：几段画面按不等大的格子拼在一起，依次点亮。适合「同时发生的几件事」。 */
export const Collage: React.FC<{ items: { src: string; label?: string }[]; ats: number[]; width?: number }> = ({ items, ats, width = 1500 }) => {
  const t = useT(), h = width * 0.5, g = 16, lay = [[0, 0, 0.56, 1], [0.56, 0, 0.44, 0.5], [0.56, 0.5, 0.22, 0.5], [0.78, 0.5, 0.22, 0.5]];
  return (
    <div style={{ position: 'relative', width, height: h, fontFamily: FONT }}>
      {items.slice(0, 4).map((it, i) => { const [x, y, w, hh] = lay[i], p = prog(t, ats[i], 0.5);
        return <div key={i} style={{ position: 'absolute', left: x * width + g / 2, top: y * h + g / 2, width: w * width - g, height: hh * h - g, borderRadius: 16, overflow: 'hidden', opacity: p, transform: `scale(${mix(0.92, 1, p)})` }}><Media src={it.src} />
          {it.label && <div style={{ position: 'absolute', left: 14, bottom: 12, background: 'rgba(8,11,17,.82)', color: C.text, fontSize: 28, fontWeight: 900, padding: '4px 16px', borderRadius: 8 }}>{it.label}</div>}</div>; })}
    </div>
  );
};
/** 封面卡片轮播：几张封面（往期视频、书、产品）横向排开，当前的一张居中放大，依次轮到下一张。 */
export const CoverCarousel: React.FC<{ items: { src: string; title: string }[]; ats: number[]; cardW?: number }> = ({ items, ats, cardW = 520 }) => {
  const t = useT(); let cur = 0; ats.forEach((a) => { cur += inOut((t - a) / 0.6); }); const h = cardW * 0.5625;
  return (
    <div style={{ position: 'relative', width: 1700, height: h * 1.7, fontFamily: FONT }}>
      {items.map((it, i) => { const d = i - cur, ad = Math.abs(d), sc = mix(1.25, 0.78, Math.min(1, ad));
        return <div key={i} style={{ position: 'absolute', left: 850 - cardW / 2 + d * cardW * 0.82, top: h * 0.2, width: cardW, opacity: mix(1, 0.4, Math.min(1, ad)), transform: `scale(${sc})`, zIndex: 10 - Math.round(ad * 3) }}>
          <div style={{ height: h, borderRadius: 16, overflow: 'hidden', boxShadow: '0 30px 70px rgba(0,0,0,.6)' }}><Media src={it.src} /></div><div style={{ textAlign: 'center', fontSize: 30, fontWeight: 900, color: C.text, marginTop: 14, whiteSpace: 'nowrap', opacity: mix(1, 0, Math.min(1, ad * 1.5)) }}>{it.title}</div>
        </div>; })}
    </div>
  );
};
