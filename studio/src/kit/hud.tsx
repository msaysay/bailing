// 手势全息风 · 一个合成做所有期（数据驱动）。scripts/hud.py render 用 --props 把每期的 plan.json 传进来。
// 画面分两段：
//   ① 全息段：第一人称原片打底 → 悬浮玻璃界面（钉在桌面上，跟着镜头走）→ 手的那一层盖回最上面（手像是伸到界面前面）
//   ② 卡点段：一「砸」转场之后，素材跟着音乐的拍子硬切，每一刀带一种冲击（顶一下、色散、甩、圆洞穿越）
// 界面件：avatar 头像泡 / panel 主面板 / ribbon 选择飘带 / pick 选中光环 / checks 勾选清单 / dial 进度旋钮 / holo 全息成片 / tag 文字标签
import React from 'react';
import { AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';

export const HUD_W = 1080, HUD_H = 1920, HUD_FPS = 30;
type Hand = { wrist: number[]; palm: number[]; size: number; thumb: number[]; index: number[]; middle: number[] } | null;
type Track = { cam: number[][]; hands: { L: Hand[]; R: Hand[] }; frames: number; has_hands_layer?: boolean };
export type HudItem = { type: string; at: number; out?: number; anchor?: 'world' | 'screen'; follow?: string; x?: number; y?: number; [k: string]: any };
export type HudCut = { src: string; from?: number; beats: number; fx?: 'punch' | 'rgb' | 'whip' | 'iris' | 'flash'; fit?: 'cover' | 'screen'; rate?: number; label?: string; big?: string };
export type HudPlan = { w?: number; h?: number; trails?: boolean; grade?: string; dir: string; total: number; hudEnd: number; bpm: number; accent?: string; cool?: string; brand?: string; footage?: boolean; items: HudItem[]; cuts: HudCut[]; music?: string; keepSound?: number; end?: { title: string; sub?: string } };
export const hudDefault: HudPlan = { dir: 'hud-demo', total: 6, hudEnd: 6, bpm: 80, footage: false, items: [], cuts: [] };

const c01 = (x: number) => Math.max(0, Math.min(1, x));
const out3 = (x: number) => 1 - Math.pow(1 - c01(x), 3), out5 = (x: number) => 1 - Math.pow(1 - c01(x), 5);
const back = (x: number) => { const p = c01(x), k = 1.9; return 1 + (k + 1) * Math.pow(p - 1, 3) + k * Math.pow(p - 1, 2); };
const HEI = '"Hud Hei", "PingFang SC", "Microsoft YaHei", sans-serif', DIN = '"Hud Din", "Hud Hei", sans-serif';
const Ctx = React.createContext<{ t: number; f: number; accent: string; cool: string; tr: Track | null; W: number; H: number }>({ t: 0, f: 0, accent: '#FFC83D', cool: '#3DD6FF', tr: null, W: 1080, H: 1920 });
const useHud = () => React.useContext(Ctx);

const useAssets = (dir: string, want: boolean) => {
  const [tr, setTr] = React.useState<Track | null>(null);
  const [h] = React.useState(() => delayRender('hud-assets'));
  React.useEffect(() => {
    const fonts = [['Hud Hei', 'HarmonyOS_Sans_SC_Bold.ttf'], ['Hud Din', 'D-DIN-PRO-700-Bold.otf']].map(([fam, f]) => new FontFace(fam, `url(${staticFile('fonts/' + f)})`, { weight: '100 900' }).load().then((x) => document.fonts.add(x)).catch(() => undefined));
    const track = want ? fetch(staticFile(dir + '/track.json')).then((r) => r.json()).then(setTr).catch(() => undefined) : Promise.resolve();
    Promise.all([...fonts, track]).then(() => continueRender(h));
  }, [h, dir, want]);
  return tr;
};
/** 这一帧的镜头变换（前后各一帧取平均，去掉细碎的抖）。 */
const camAt = (tr: Track | null, f: number) => {
  if (!tr) return [1, 0, 0, 0]; const g = (i: number) => tr.cam[Math.max(0, Math.min(tr.cam.length - 1, i))], a = g(f - 1), b = g(f), c = g(f + 1);
  return [0, 1, 2, 3].map((k) => (a[k] + 2 * b[k] + c[k]) / 4);
};
/** 钉在场景里的一层：里面的坐标都按锚帧写，镜头怎么动它跟着怎么动。 */
const World: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { tr, f, W, H } = useHud(), [a, b, tx, ty] = camAt(tr, f);
  return <div style={{ position: 'absolute', left: 0, top: 0, width: W, height: H, transformOrigin: '0 0', transform: `matrix(${a},${b},${-b},${a},${tx},${ty})` }}>{children}</div>;
};
/** 玻璃片：半透明、背后虚化、一圈亮边、顶上一道高光。 */
const Glass: React.FC<{ w: number; h: number; r?: number; tint?: string; children?: React.ReactNode; style?: React.CSSProperties }> = ({ w, h, r = 36, tint = 'rgba(18,22,32,.42)', children, style }) => (
  <div style={{ width: w, height: h, borderRadius: r, background: tint, backdropFilter: 'blur(22px) saturate(1.5) brightness(1.08)', border: '2px solid rgba(255,255,255,.34)', boxShadow: '0 30px 80px rgba(0,0,0,.45), inset 0 2px 0 rgba(255,255,255,.35), inset 0 -30px 60px rgba(255,255,255,.05)', position: 'relative', overflow: 'hidden', ...style }}>
    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(115deg, rgba(255,255,255,.22) 0%, rgba(255,255,255,0) 28%, rgba(255,255,255,0) 70%, rgba(255,255,255,.10) 100%)' }} />
    {children}
  </div>
);
/** 出现和消失：从一个点弹出来（带回弹和一道扫光），消失时缩回去。返回 null 表示这时候不在画面里。 */
const usePop = (at: number, out = 1e9, dur = 0.42) => {
  const { t } = useHud(); if (t < at - 0.001 || t > out + 0.25) return null;
  const p = back((t - at) / dur), q = out3((t - out) / 0.22);
  return { s: Math.max(0.001, p * (1 - q * 0.6)), o: c01((t - at) / 0.1) * (1 - q), blur: (1 - out3((t - at) / 0.25)) * 14 + q * 10, age: t - at };
};
const place = (it: HudItem, body: React.ReactNode) => (it.anchor === 'screen' ? <AbsoluteFill>{body}</AbsoluteFill> : <World>{body}</World>);

const Avatar: React.FC<{ it: HudItem }> = ({ it }) => {
  const pop = usePop(it.at, it.out), { accent, t } = useHud(); if (!pop) return null; const d = it.size ?? 190;
  return place(it, <div style={{ position: 'absolute', left: it.x! - d / 2, top: it.y! - d / 2 + Math.sin(t * 3) * 6, width: d, height: d, transform: `scale(${pop.s})`, opacity: pop.o, filter: `blur(${pop.blur}px)` }}>
    <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', border: `3px solid ${accent}`, opacity: 0.55, transform: `scale(${1 + ((pop.age * 1.2) % 1) * 0.35})`, filter: 'blur(1px)' }} />
    <div style={{ width: d, height: d, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,.85)', boxShadow: `0 0 40px ${accent}88, 0 20px 50px rgba(0,0,0,.5)`, background: '#1b2030' }}>
      {it.img ? <Img src={staticFile(it.img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: HEI, fontSize: d * 0.42, color: '#fff' }}>{(it.name ?? '我').slice(0, 1)}</div>}
    </div>
  </div>);
};

/** 主面板：头像 + 名字 + 一句话 + 一排小组件（数字、开关、亮色块）。 */
const Panel: React.FC<{ it: HudItem }> = ({ it }) => {
  const pop = usePop(it.at, it.out, 0.5), { accent, cool, t } = useHud(); if (!pop) return null;
  const w = it.w ?? 880, h = it.h ?? 420, tiles: { k: string; v: string; hot?: boolean }[] = it.tiles ?? [], tilt = it.tilt ?? [-14, 0];
  const fromX = (it.from?.[0] ?? it.x!) - it.x!, fromY = (it.from?.[1] ?? it.y!) - it.y!, e = 1 - out5(pop.age / 0.5);
  return place(it, <div style={{ position: 'absolute', left: it.x! - w / 2 + fromX * e, top: it.y! - h / 2 + fromY * e + Math.sin(t * 1.7) * 5, perspective: 1600 }}>
    <div style={{ transform: `rotateX(${tilt[0] + e * 40}deg) rotateY(${tilt[1]}deg) scale(${pop.s})`, opacity: pop.o, filter: `blur(${pop.blur}px)` }}>
      <Glass w={w} h={h} r={44}>
        <div style={{ position: 'absolute', left: 36, top: 36, width: 200, height: 200, borderRadius: '50%', overflow: 'hidden', border: '4px solid rgba(255,255,255,.8)', background: '#1b2030' }}>
          {it.img ? <Img src={staticFile(it.img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : null}
        </div>
        <div style={{ position: 'absolute', left: 270, top: 38, fontFamily: HEI, fontSize: 52, color: '#fff', letterSpacing: 2 }}>{it.title}</div>
        <div style={{ position: 'absolute', right: 40, top: 48, fontFamily: DIN, fontSize: 30, color: 'rgba(255,255,255,.85)', letterSpacing: 4, fontStyle: 'italic' }}>{it.sub}</div>
        <div style={{ position: 'absolute', left: 270, top: 116, display: 'grid', gridTemplateColumns: `repeat(${Math.min(4, tiles.length || 1)}, 1fr)`, gap: 14, width: w - 310 }}>
          {tiles.map((x, i) => { const a = out3((pop.age - 0.25 - i * 0.06) / 0.3); return (
            <div key={i} style={{ height: 112, borderRadius: 22, background: x.hot ? accent : 'rgba(10,12,18,.55)', border: '1.5px solid rgba(255,255,255,.18)', padding: '12px 16px', opacity: a, transform: `translateY(${(1 - a) * 24}px)`, color: x.hot ? '#14110a' : '#fff' }}>
              <div style={{ fontFamily: HEI, fontSize: 20, opacity: 0.75 }}>{x.k}</div>
              <div style={{ fontFamily: DIN, fontSize: 44, marginTop: 4, color: x.hot ? '#14110a' : i % 3 === 1 ? cool : '#fff' }}>{x.v}</div>
            </div>); })}
        </div>
        <div style={{ position: 'absolute', left: 40, bottom: 34, right: 40, fontFamily: DIN, fontSize: 24, letterSpacing: 5, color: 'rgba(255,255,255,.8)', whiteSpace: 'nowrap', overflow: 'hidden' }}>{it.slogan}</div>
        <div style={{ position: 'absolute', top: 0, bottom: 0, width: 160, left: -200 + c01(pop.age / 0.7) * (w + 300), background: 'linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent)', transform: 'skewX(-20deg)' }} />
      </Glass>
    </div>
  </div>);
};

/** 选择飘带：一条发光的金色丝带横穿画面，选项一个个顺着它滑过去。 */
const Ribbon: React.FC<{ it: HudItem }> = ({ it }) => {
  const { t, accent, W: HUD_W, H: HUD_H } = useHud(), out = it.out ?? 1e9; if (t < it.at || t > out + 0.3) return null;
  const age = t - it.at, grow = out5(age / 0.6), fade = 1 - out3((t - out) / 0.3), y0 = it.y ?? 860, amp = it.amp ?? 90, items: string[] = it.items ?? [], speed = it.speed ?? 300, gap = it.gap ?? 300;
  const yAt = (x: number) => y0 + Math.sin(x / 190 + age * 1.6) * amp * (0.5 + 0.5 * Math.sin(x / 520 + 1)) - (x - HUD_W / 2) * 0.12;
  const pts: string[] = []; for (let x = -60; x <= HUD_W + 60; x += 24) pts.push(`${x},${yAt(x).toFixed(1)}`);
  const d = 'M' + pts.join(' L'), len = HUD_W * 1.4, dash = `${len * grow} ${len * 2}`;
  return place({ ...it, anchor: it.anchor ?? 'screen' }, <div style={{ position: 'absolute', inset: 0, opacity: fade }}>
    <svg width={HUD_W} height={HUD_H} style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', overflow: 'visible' }}>
      <defs><filter id="rb1" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="26" /></filter><filter id="rb2" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="7" /></filter></defs>
      <path d={d} stroke="#FF7A1A" strokeWidth={90} fill="none" filter="url(#rb1)" opacity={0.75} strokeDasharray={dash} />
      <path d={d} stroke={accent} strokeWidth={30} fill="none" filter="url(#rb2)" strokeDasharray={dash} />
      <path d={d} stroke="#FFF6D8" strokeWidth={6} fill="none" strokeDasharray={dash} strokeLinecap="round" />
      <path d={d} stroke="#fff" strokeWidth={3} fill="none" strokeDasharray="60 420" strokeDashoffset={-age * 900} opacity={0.9} />
    </svg>
    {items.map((name, i) => { const x = HUD_W + 140 + i * gap - age * speed; if (x < -200 || x > HUD_W + 200) return null; const y = yAt(x), sel = it.pick === i && it.pickAt && t > it.pickAt, k = sel ? 1 + out3((t - it.pickAt) / 0.2) * 0.25 : 1;
      return <div key={i} style={{ position: 'absolute', left: x - 110, top: y - 110, width: 220, height: 220, transform: `scale(${k}) rotate(${Math.sin(x / 200) * 6}deg)` }}>
        <div style={{ width: 220, height: 220, borderRadius: 48, background: sel ? accent : 'rgba(14,16,24,.62)', backdropFilter: 'blur(14px)', border: `3px solid ${sel ? '#fff' : accent}`, boxShadow: `0 0 50px ${accent}99, inset 0 2px 0 rgba(255,255,255,.4)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: sel ? '#14110a' : '#fff' }}>
          <div style={{ fontFamily: DIN, fontSize: 40, color: sel ? '#14110a' : accent }}>{String(i + 1).padStart(2, '0')}</div>
          <div style={{ fontFamily: HEI, fontSize: name.length > 4 ? 34 : 42, marginTop: 6, textAlign: 'center', lineHeight: 1.15, padding: '0 10px' }}>{name}</div>
        </div>
      </div>; })}
    {it.label ? <div style={{ position: 'absolute', left: 0, right: 0, top: y0 + 250, display: 'flex', justifyContent: 'center', opacity: out3((age - 0.3) / 0.3) }}><div style={{ fontFamily: DIN, fontSize: 34, letterSpacing: 6, color: '#fff', padding: '14px 34px', borderRadius: 40, border: '2.5px solid rgba(255,255,255,.8)', background: 'rgba(10,12,18,.45)', backdropFilter: 'blur(12px)' }}>{it.label}</div></div> : null}
  </div>);
};

/** 选中光环：选中的那一项落在桌面上，一圈圈金色光环往外荡。 */
const Pick: React.FC<{ it: HudItem }> = ({ it }) => {
  const pop = usePop(it.at, it.out), { accent } = useHud(); if (!pop) return null; const R = it.r ?? 170;
  return place(it, <div style={{ position: 'absolute', left: it.x! - R, top: it.y! - R, width: R * 2, height: R * 2, opacity: pop.o, perspective: 900 }}>
    <div style={{ position: 'absolute', inset: 0, transform: 'rotateX(58deg)', mixBlendMode: 'screen' }}>
      {[0, 1, 2].map((i) => { const p = ((pop.age * 0.9 + i / 3) % 1); return <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `${10 - p * 8}px solid ${accent}`, transform: `scale(${0.35 + p * 0.9})`, opacity: (1 - p) * 0.95, boxShadow: `0 0 40px ${accent}` }} />; })}
      <div style={{ position: 'absolute', inset: R * 0.62, borderRadius: '50%', background: accent, boxShadow: `0 0 60px ${accent}`, transform: `scale(${pop.s})` }} />
    </div>
    <div style={{ position: 'absolute', left: -200, right: -200, top: R * 0.2 - out5(pop.age / 0.5) * 130, display: 'flex', justifyContent: 'center', transform: `scale(${pop.s})` }}>
      <div style={{ fontFamily: HEI, fontSize: 46, color: '#14110a', background: accent, padding: '10px 30px', borderRadius: 22, boxShadow: `0 0 50px ${accent}aa`, whiteSpace: 'nowrap' }}>{it.label}</div>
    </div>
  </div>);
};

/** 勾选清单：一项一项打勾。每项自己带时刻。 */
const Checks: React.FC<{ it: HudItem }> = ({ it }) => {
  const pop = usePop(it.at, it.out), { accent, t } = useHud(); if (!pop) return null; const rows: { t: number; text: string }[] = it.items ?? [];
  return place(it, <div style={{ position: 'absolute', left: it.x, top: it.y, opacity: pop.o, transform: `scale(${pop.s})`, transformOrigin: '0 0' }}>
    {rows.map((r, i) => { const a = out3((pop.age - i * 0.08) / 0.25), on = c01((t - r.t) / 0.22), bump = t > r.t ? 1 + (1 - out3((t - r.t) / 0.3)) * 0.25 : 1;
      return <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 20, opacity: a, transform: `translateX(${(1 - a) * -40}px)` }}>
        <div style={{ width: 66, height: 66, borderRadius: 18, border: `3px solid ${on > 0 ? accent : 'rgba(255,255,255,.6)'}`, background: on > 0 ? `${accent}33` : 'rgba(10,12,18,.5)', boxShadow: on > 0 ? `0 0 34px ${accent}` : 'none', transform: `scale(${bump})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={44} height={44} viewBox="0 0 44 44"><path d="M8 23 L19 33 L37 11" stroke={accent} strokeWidth={7} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={50} strokeDashoffset={50 * (1 - on)} /></svg>
        </div>
        <div style={{ fontFamily: HEI, fontSize: 40, color: '#fff', padding: '8px 24px', borderRadius: 18, background: 'rgba(10,12,18,.55)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,.25)', textShadow: '0 2px 10px rgba(0,0,0,.6)' }}>{r.text}</div>
      </div>; })}
  </div>);
};

/** 进度旋钮：一圈刻度 + 一段走动的弧 + 中间的百分数。可以跟着手走（follow: "R.palm"）。 */
const Dial: React.FC<{ it: HudItem }> = ({ it }) => {
  const pop = usePop(it.at, it.out), { accent, cool, t, tr, f } = useHud(); if (!pop) return null;
  const R = it.r ?? 170, p = c01((t - (it.t0 ?? it.at)) / Math.max(0.01, (it.t1 ?? it.at + 2) - (it.t0 ?? it.at))), val = Math.round((it.fromV ?? 0) + ((it.toV ?? 100) - (it.fromV ?? 0)) * p), hot = p > 0.85;
  let x = it.x ?? 540, y = it.y ?? 960, screen = it.anchor === 'screen';
  if (it.follow && tr) { const [side, key] = it.follow.split('.'), hd = (tr.hands as any)[side]?.[Math.min(f, tr.frames - 1)]; if (hd) { x = hd[key][0] + (it.dx ?? 0); y = hd[key][1] + (it.dy ?? 0); screen = true; } }
  const C = 2 * Math.PI * (R - 16), col = hot ? '#FF5A2A' : cool;
  const body = <div style={{ position: 'absolute', left: x - R, top: y - R, width: R * 2, height: R * 2, opacity: pop.o, transform: `scale(${pop.s})`, perspective: 900 }}>
    <div style={{ position: 'absolute', inset: 0, transform: `rotateX(${it.tiltX ?? 40}deg)` }}>
      <svg width={R * 2} height={R * 2} style={{ overflow: 'visible', mixBlendMode: 'screen' }}>
        <circle cx={R} cy={R} r={R - 4} fill="rgba(8,14,24,.5)" stroke="rgba(255,255,255,.5)" strokeWidth={2} />
        {Array.from({ length: 48 }).map((_, i) => { const a = (i / 48) * Math.PI * 2 + t * 0.6, r1 = R - 40, r2 = R - (i % 4 === 0 ? 64 : 52); return <line key={i} x1={R + Math.cos(a) * r1} y1={R + Math.sin(a) * r1} x2={R + Math.cos(a) * r2} y2={R + Math.sin(a) * r2} stroke="#fff" strokeWidth={i % 4 === 0 ? 3 : 1.5} opacity={0.7} />; })}
        <circle cx={R} cy={R} r={R - 16} fill="none" stroke={col} strokeWidth={14} strokeLinecap="round" strokeDasharray={`${C * p} ${C}`} transform={`rotate(-90 ${R} ${R})`} style={{ filter: `drop-shadow(0 0 16px ${col})` }} />
      </svg>
    </div>
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ fontFamily: DIN, fontSize: R * 0.6, color: '#fff', textShadow: `0 0 26px ${col}`, lineHeight: 1 }}>{val}<span style={{ fontSize: R * 0.26 }}>%</span></div>
      <div style={{ fontFamily: HEI, fontSize: 28, color: hot ? accent : '#fff', letterSpacing: 4, marginTop: 6 }}>{p >= 1 ? (it.done ?? '完成') : (it.label ?? '生成中')}</div>
    </div>
  </div>;
  return screen ? <AbsoluteFill>{body}</AbsoluteFill> : <World>{body}</World>;
};

/** 全息成片：桌面上一摞发光的圆盘，上面立起一块屏，里面是成片。build 从 0 到 1：先是线框，再从下往上扫出画面。 */
const Holo: React.FC<{ it: HudItem }> = ({ it }) => {
  const pop = usePop(it.at, it.out, 0.5), { cool, accent, t } = useHud(), { fps } = useVideoConfig(); if (!pop) return null;
  const w = it.w ?? 300, h = it.h ?? 520, build = c01((t - (it.t0 ?? it.at)) / Math.max(0.01, (it.t1 ?? it.at + 2) - (it.t0 ?? it.at))), spin = t * 40, lift = out5(pop.age / 0.7), hot = build > 0.85;
  return place(it, <div style={{ position: 'absolute', left: it.x! - 260, top: it.y! - h - 40, width: 520, height: h + 240, opacity: pop.o, transform: `scale(${pop.s})`, transformOrigin: '50% 100%' }}>
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 240, perspective: 900, mixBlendMode: 'screen' }}>
      {[0, 1, 2, 3].map((i) => <div key={i} style={{ position: 'absolute', left: 30 + i * 22, right: 30 + i * 22, bottom: 20 + i * 26 * lift, height: 190, borderRadius: '50%', transform: `rotateX(68deg) rotate(${spin * (i % 2 ? -1 : 1)}deg)`, border: `${5 - i}px ${i % 2 ? 'dashed' : 'solid'} ${hot && i > 1 ? accent : cool}`, background: i === 0 ? `radial-gradient(${cool}66, transparent 70%)` : 'transparent', boxShadow: `0 0 30px ${cool}` }} />)}
    </div>
    <div style={{ position: 'absolute', left: 260 - w / 2, bottom: 150 + lift * 20 + Math.sin(t * 2.4) * 6, width: w, height: h, perspective: 1200 }}>
      <div style={{ width: w, height: h, transform: `rotateY(${Math.sin(t * 1.3) * 16 + (it.rot ?? -12)}deg) rotateX(6deg)`, borderRadius: 26, border: `3px solid ${cool}`, boxShadow: `0 0 50px ${cool}, inset 0 0 40px ${cool}55`, overflow: 'hidden', background: 'rgba(6,16,30,.55)', position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `linear-gradient(${cool}55 1.5px, transparent 1.5px), linear-gradient(90deg, ${cool}55 1.5px, transparent 1.5px)`, backgroundSize: '34px 34px' }} />
        {it.src ? <div style={{ position: 'absolute', inset: 0, clipPath: `inset(${(1 - build) * 100}% 0 0 0)` }}>
          <Sequence from={Math.round(it.at * fps)} layout="none"><OffthreadVideo src={staticFile(it.src)} muted startFrom={Math.round((it.srcFrom ?? 0) * fps)} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `saturate(1.15) brightness(${1 + (hot ? 0.25 : 0)})` }} /></Sequence>
        </div> : null}
        <div style={{ position: 'absolute', left: 0, right: 0, top: `${(1 - build) * 100}%`, height: 5, background: '#fff', boxShadow: `0 0 26px 8px ${cool}`, opacity: build < 1 ? 1 : 0 }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,.08) 0 2px, transparent 2px 6px)', mixBlendMode: 'screen' }} />
      </div>
    </div>
  </div>);
};

const Tag: React.FC<{ it: HudItem }> = ({ it }) => {
  const pop = usePop(it.at, it.out), { accent, W: HUD_W } = useHud(); if (!pop) return null;
  return place(it, <div style={{ position: 'absolute', left: 0, width: HUD_W, top: it.y, display: 'flex', justifyContent: 'center', opacity: pop.o, transform: `translateX(${(it.x ?? HUD_W / 2) - HUD_W / 2}px) scale(${pop.s})` }}>
    <div style={{ fontFamily: HEI, fontSize: it.size ?? 54, color: it.hot ? '#14110a' : '#fff', background: it.hot ? accent : 'rgba(10,12,18,.55)', backdropFilter: 'blur(12px)', border: `2px solid ${it.hot ? '#fff' : 'rgba(255,255,255,.4)'}`, borderRadius: 26, padding: '14px 36px', boxShadow: it.hot ? `0 0 60px ${accent}aa` : '0 20px 50px rgba(0,0,0,.4)', whiteSpace: 'nowrap' }}>{it.text}</div>
  </div>);
};
/** 冲击波：手点下去的那一下，一圈光从指尖荡开，带一个十字闪光。 */
const Pulse: React.FC<{ it: HudItem }> = ({ it }) => {
  const { t, accent, cool } = useHud(), a = t - it.at; if (a < 0 || a > 0.7) return null; const p = out5(a / 0.6), col = it.cool ? cool : accent, R = it.r ?? 220;
  return place(it, <div style={{ position: 'absolute', left: it.x! - R, top: it.y! - R, width: R * 2, height: R * 2, mixBlendMode: 'screen' }}>
    {[0, 0.12].map((d, i) => { const q = out5((a - d) / 0.55); return a > d ? <div key={i} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `${8 * (1 - q) + 1}px solid ${i ? '#fff' : col}`, transform: `scale(${0.1 + q * 0.95})`, opacity: 1 - q, boxShadow: `0 0 40px ${col}, inset 0 0 40px ${col}` }} /> : null; })}
    <div style={{ position: 'absolute', left: R - 3, top: R * (1 - (1 - p) * 0.9) - R * 0.0, width: 6, height: R * 2 * (1 - p) * 0.9, background: '#fff', boxShadow: `0 0 30px 6px ${col}`, opacity: 1 - p, transform: `translateY(${-(R * (1 - p) * 0.9) + R * (1 - (1 - (1 - p) * 0.9))}px)` }} />
    <div style={{ position: 'absolute', top: R - 3, left: R * p * 0.9 + R * 0.1 * 0, height: 6, width: R * 2 * (1 - p), marginLeft: R * p - R * p * 0.9, background: '#fff', boxShadow: `0 0 30px 6px ${col}`, opacity: 1 - p }} />
    <div style={{ position: 'absolute', inset: R * 0.72, borderRadius: '50%', background: '#fff', filter: 'blur(14px)', opacity: (1 - p) * 0.9 }} />
  </div>);
};
/** 指尖拖尾：食指动得快的时候，后面拖一道光。 */
const Trails: React.FC = () => {
  const { tr, f, cool, accent, W, H } = useHud(); if (!tr) return null; const N = 6, paths: React.ReactNode[] = [];
  (['L', 'R'] as const).forEach((s, si) => {
    const pts: number[][] = []; for (let i = N; i >= 0; i--) { const h = tr.hands[s][Math.max(0, f - i)]; if (!h) return; pts.push(h.index); }
    const len = pts.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0), jump = pts.slice(1).some((p, i) => Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]) > 170), k = jump ? 0 : c01((len - 120) / 300); if (k <= 0) return;
    for (let i = 1; i < pts.length; i++) paths.push(<line key={s + i} x1={pts[i - 1][0]} y1={pts[i - 1][1]} x2={pts[i][0]} y2={pts[i][1]} stroke={si ? accent : cool} strokeWidth={3 + (i / N) * 16} strokeLinecap="round" opacity={(i / N) * k} />);
  });
  return <svg width={W} height={H} style={{ position: 'absolute', inset: 0, mixBlendMode: 'screen', filter: 'blur(3px) drop-shadow(0 0 14px #fff)' }}>{paths}</svg>;
};
const KINDS: Record<string, React.FC<{ it: HudItem }>> = { pulse: Pulse, avatar: Avatar, panel: Panel, ribbon: Ribbon, pick: Pick, checks: Checks, dial: Dial, holo: Holo, tag: Tag };

/** 没有原片时的替身背景（只用来看界面动画本身）。 */
const Backdrop: React.FC = () => { const { t } = useHud(); return <AbsoluteFill style={{ background: `radial-gradient(900px 700px at ${30 + Math.sin(t * 0.4) * 8}% 22%, #3a1320 0%, transparent 70%), radial-gradient(900px 800px at 78% 30%, #0e3a5c 0%, transparent 70%), linear-gradient(#0b0d14, #141018 60%, #2a1c12)` }} />; };

/** 卡点段的一刀。 */
const Cut: React.FC<{ c: HudCut; start: number; dur: number; beat: number; i: number }> = ({ c, start, dur, beat, i }) => {
  const { t, accent, W, H } = useHud(), { fps } = useVideoConfig(), a = t - start; if (a < 0 || a >= dur) return null;
  const fx = c.fx ?? 'punch', hit = 1 - out5(a / 0.28), pulse = 1 - out3(((a % beat) / beat) / 0.35), push = 1 + a * 0.035;
  const scale = (fx === 'punch' ? 1 + hit * 0.42 : fx === 'iris' ? 1 + hit * 0.15 : 1 + hit * 0.12) * push * (1 + pulse * 0.018);
  const whip = fx === 'whip' ? hit : 0, split = (fx === 'rgb' ? 26 : 8) * hit, iris = fx === 'iris' ? out5(a / 0.32) : 1;
  const fid = `cut${i}`, vid = (st: React.CSSProperties) => <Sequence from={Math.round(start * fps)} layout="none"><OffthreadVideo src={staticFile(c.src)} muted startFrom={Math.round((c.from ?? 0) * fps)} playbackRate={c.rate ?? 1} style={st} /></Sequence>;
  return <AbsoluteFill style={{ background: '#000', clipPath: iris < 1 ? `circle(${iris * 130}% at 50% 50%)` : undefined }}>
    <svg width={0} height={0} style={{ position: 'absolute' }}><defs><filter id={fid} x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
      <feColorMatrix in="SourceGraphic" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" /><feOffset in="r" dx={-split} result="r2" />
      <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
      <feColorMatrix in="SourceGraphic" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" /><feOffset in="b" dx={split} result="b2" />
      <feBlend in="r2" in2="g" mode="screen" result="rg" /><feBlend in="rg" in2="b2" mode="screen" result="rgb" /><feGaussianBlur in="rgb" stdDeviation={`${whip * 60} ${hit * 2}`} />
    </filter></defs></svg>
    <AbsoluteFill style={{ filter: `url(#${fid})`, transform: `translateX(${whip * (i % 2 ? -260 : 260)}px) scale(${scale})` }}>
      {c.fit === 'screen' ? <>
        {vid({ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'blur(40px) brightness(.45) saturate(1.3)', transform: 'scale(1.2)' })}
        <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}><div style={{ transform: `perspective(1400px) rotateY(${(i % 2 ? 1 : -1) * (6 - a * 2)}deg)`, borderRadius: 26, overflow: 'hidden', border: '2px solid rgba(255,255,255,.7)', boxShadow: '0 50px 120px rgba(0,0,0,.7)', lineHeight: 0 }}>{vid({ maxWidth: W * 0.92, maxHeight: H * 0.88, display: 'block' })}</div></AbsoluteFill>
      </> : vid({ width: '100%', height: '100%', objectFit: 'cover' })}
    </AbsoluteFill>
    <AbsoluteFill style={{ background: '#fff', opacity: (fx === 'flash' ? 0.9 : 0.28) * (1 - out3(a / 0.14)) }} />
    {c.label ? <div style={{ position: 'absolute', left: 48, top: H > W ? 150 : 60, display: 'flex', alignItems: 'center', gap: 14, transform: `translateX(${(1 - out5(a / 0.3)) * -80}px)`, opacity: c01(a / 0.1) }}>
      <span style={{ fontFamily: DIN, fontSize: 34, color: '#14110a', background: accent, padding: '2px 14px', borderRadius: 8 }}>{String(i + 1).padStart(2, '0')}</span>
      <span style={{ fontFamily: HEI, fontSize: 40, color: '#fff', textShadow: '0 3px 16px rgba(0,0,0,.8)' }}>{c.label}</span></div> : null}
    {c.big ? <div style={{ position: 'absolute', left: 0, right: 0, bottom: H * 0.17, textAlign: 'center', fontFamily: HEI, fontSize: 118, color: '#fff', letterSpacing: 4, textShadow: `0 0 40px ${accent}, 0 8px 30px rgba(0,0,0,.8)`, transform: `scale(${1 + hit * 0.5})`, opacity: c01(a / 0.08) }}>{c.big}</div> : null}
  </AbsoluteFill>;
};

export const HudFilm: React.FC<HudPlan> = (plan) => {
  const f = useCurrentFrame(), { fps, width: W, height: H } = useVideoConfig(), t = f / fps, footage = plan.footage !== false, tr = useAssets(plan.dir, footage);
  const accent = plan.accent ?? '#FFC83D', cool = plan.cool ?? '#3DD6FF', beat = 60 / plan.bpm, E = plan.hudEnd, inHud = t < E + 0.05;
  const smash = c01((t - (E - 0.2)) / 0.2), sm = smash * smash;                      // 最后 0.2 秒：整个画面往前冲、色散、过曝，砸进卡点段
  let acc = E; const cuts = plan.cuts.map((c) => { const s = acc, d = c.beats * beat; acc += d; return { c, s, d }; });
  const endAt = acc, endA = t - endAt;
  return <Ctx.Provider value={{ t, f, accent, cool, tr, W, H }}><AbsoluteFill style={{ background: '#000' }}>
    {inHud ? <AbsoluteFill style={{ transform: `scale(${1 + sm * 1.6})`, filter: `blur(${sm * 22}px) brightness(${1 + sm * 1.5}) saturate(${1 + sm})` }}>
      {footage ? <OffthreadVideo src={staticFile(plan.dir + '/base.mp4')} volume={plan.keepSound ?? 0} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: plan.grade }} /> : <Backdrop />}
      {footage && plan.grade ? <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(10,30,60,.22), rgba(40,10,50,.14))', mixBlendMode: 'multiply' }} /> : null}
      {plan.items.map((it, i) => { const K = KINDS[it.type]; return K ? <K key={i} it={it} /> : null; })}
      {footage && tr?.has_hands_layer !== false ? <OffthreadVideo transparent muted src={staticFile(plan.dir + '/hands.webm')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', filter: plan.grade }} /> : null}
      {plan.trails !== false && footage ? <Trails /> : null}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,.45) 100%)' }} />
    </AbsoluteFill> : null}
    {cuts.map((x, i) => <Cut key={i} c={x.c} start={x.s} dur={x.d} beat={beat} i={i} />)}
    {plan.end && endA >= 0 ? <AbsoluteFill style={{ background: '#07080c', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(700px 500px at 50% 45%, ${accent}33, transparent 70%)` }} />
      <div style={{ fontFamily: HEI, fontSize: 104, color: '#fff', textAlign: 'center', lineHeight: 1.25, transform: `scale(${1 + (1 - out5(endA / 0.35)) * 0.6})`, whiteSpace: 'pre-line', textShadow: `0 0 50px ${accent}88` }}>{plan.end.title}</div>
      {plan.end.sub ? <div style={{ fontFamily: HEI, fontSize: 44, color: accent, marginTop: 40, opacity: out3((endA - 0.3) / 0.3) }}>{plan.end.sub}</div> : null}
    </AbsoluteFill> : null}
    <AbsoluteFill style={{ background: '#fff', opacity: t >= E ? 0.85 * (1 - out3((t - E) / 0.18)) : sm * 0.55, pointerEvents: 'none' }} />
    {plan.brand ? <div style={{ position: 'absolute', right: 40, top: 60, fontFamily: HEI, fontSize: 28, color: 'rgba(255,255,255,.75)', letterSpacing: 3, textShadow: '0 2px 10px rgba(0,0,0,.7)' }}>{plan.brand}</div> : null}
    {plan.music ? <Audio src={staticFile(plan.music)} /> : null}
  </AbsoluteFill></Ctx.Provider>;
};
